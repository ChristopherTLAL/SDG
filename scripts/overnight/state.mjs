#!/usr/bin/env node
// Overnight book-goal state (MULTI-BOOK): pure local facts (disk + git + clock).
// NO network beyond a quiet git fetch, so it is reliable even while the VPN flaps.
// Source of truth is the filesystem + git, never conversation memory: a drop or
// restart anywhere is safe because the next tick recomputes ground truth.
//
// Walks scripts/overnight/queue.json in order. A book's TARGET chapters come from
// its workflow script scripts/overnight/wf/<id>.mjs; a chapter is DONE when its
// .ts is committed in git. The CURRENT book is the first incomplete one.

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const ROOT = '/Users/shijie/Code/sdg-html';
const HARD_STOP = 1782080400; // 2026-06-22 06:20:00 CST — absolute hard stop
const GOAL = 1782079200;      // 2026-06-22 06:00:00 CST
const now = Math.floor(Date.now() / 1000);

const sh = (c) => { try { return execSync(c, { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return ''; } };

let queue = [];
try { queue = JSON.parse(readFileSync(`${ROOT}/scripts/overnight/queue.json`, 'utf8')); } catch { queue = ['jay-chou']; }

sh('git fetch origin main --quiet');
const aheadOfOrigin = parseInt(sh('git rev-list --count origin/main..HEAD') || '0', 10);

function bookState(id) {
  const dir = `src/data/english/books/${id}`;
  const wf = `${ROOT}/scripts/overnight/wf/${id}.mjs`;
  const ready = existsSync(wf);
  const targets = ready
    ? [...readFileSync(wf, 'utf8').matchAll(/slug:\s*['"]([0-9]{2}-[a-z0-9-]+)['"]/g)].map((m) => m[1])
    : [];
  const onDisk = existsSync(`${ROOT}/${dir}`)
    ? readdirSync(`${ROOT}/${dir}`).filter((f) => /^[0-9]{2}-.*\.ts$/.test(f)).map((f) => f.replace(/\.ts$/, ''))
    : [];
  const trackedRaw = sh(`git ls-files ${dir}/*.ts`);
  const tracked = trackedRaw ? trackedRaw.split('\n').map((p) => p.split('/').pop().replace(/\.ts$/, '')) : [];
  const missing = targets.filter((s) => !onDisk.includes(s));
  const untracked = onDisk.filter((s) => !tracked.includes(s));
  const complete = ready && missing.length === 0 && untracked.length === 0;
  return { id, ready, targets: targets.length, onDisk: onDisk.length, tracked: tracked.length, missing, untracked, complete };
}

const books = queue.map(bookState);
const anyUntracked = books.some((b) => b.untracked.length > 0);
const current = books.find((b) => !b.complete) || null;

let nextAction;
if (now >= HARD_STOP) nextAction = 'STOP_HARD_DEADLINE';
else if (anyUntracked || aheadOfOrigin > 0) nextAction = 'PUSH';
else if (!current) nextAction = 'ALL_COMPLETE_IDLE';
else if (!current.ready) nextAction = 'BOOK_NOT_READY';
else if (current.missing.length > 0) nextAction = 'LAUNCH';
else nextAction = 'ALL_COMPLETE_IDLE';

console.log(JSON.stringify({
  now,
  nowHuman: new Date(now * 1000).toLocaleString('en-CA', { timeZone: 'Asia/Shanghai', hour12: false }),
  HARD_STOP,
  deadlinePassed: now >= HARD_STOP,
  goalTimePassed: now >= GOAL,
  minutesToHardStop: Math.round((HARD_STOP - now) / 60),
  aheadOfOrigin,
  queue,
  currentBook: current ? current.id : null,
  currentScript: current ? `scripts/overnight/wf/${current.id}.mjs` : null,
  currentReady: current ? current.ready : null,
  currentMissing: current ? current.missing : [],
  untrackedByBook: books.filter((b) => b.untracked.length).map((b) => ({ id: b.id, untracked: b.untracked })),
  books: books.map((b) => ({ id: b.id, ready: b.ready, targets: b.targets, tracked: b.tracked, missing: b.missing.length, untracked: b.untracked.length, complete: b.complete })),
  nextAction,
}, null, 2));
