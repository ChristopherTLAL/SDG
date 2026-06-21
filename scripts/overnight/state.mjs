#!/usr/bin/env node
// Overnight book-goal state: pure local facts (disk + git + clock). NO network,
// so it is reliable even while the VPN is down. Prints one JSON object.
//
// Every overnight tick runs this FIRST to decide what to do. Source of truth is
// the filesystem + git, never conversation memory, so a drop/restart anywhere is
// safe: the next tick recomputes ground truth and continues.

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const ROOT = '/Users/shijie/Code/sdg-html';
const BOOK_ID = 'jay-chou';
const BOOK_DIR = `src/data/english/books/${BOOK_ID}`;
const PIPELINE = '.claude/skills/daily-english/workflows/book-pipeline.mjs';

// Hard deadlines (epoch seconds, local CST). 06:20 = absolute hard stop.
const HARD_STOP = 1782080400; // 2026-06-22 06:20:00 CST
const GOAL = 1782079200;      // 2026-06-22 06:00:00 CST

const now = Math.floor(Date.now() / 1000);

function sh(cmd) {
  try { return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim(); }
  catch { return ''; }
}

// Chapters the workflow targets this run (parsed from the pipeline DATA block).
const pipelineSrc = readFileSync(`${ROOT}/${PIPELINE}`, 'utf8');
const targetSlugs = [...pipelineSrc.matchAll(/slug: '([0-9]{2}-[a-z-]+)'/g)].map((m) => m[1]);

// All chapter files currently on disk (exclude book.ts).
const onDisk = existsSync(`${ROOT}/${BOOK_DIR}`)
  ? readdirSync(`${ROOT}/${BOOK_DIR}`).filter((f) => /^[0-9]{2}-.*\.ts$/.test(f)).map((f) => f.replace(/\.ts$/, ''))
  : [];

// Which chapter files are committed (git-tracked) = fully done + shipped.
const trackedRaw = sh(`git ls-files ${BOOK_DIR}/*.ts`);
const tracked = trackedRaw ? trackedRaw.split('\n').map((p) => p.split('/').pop().replace(/\.ts$/, '')) : [];

const missing = targetSlugs.filter((s) => !onDisk.includes(s));          // not generated yet
const untracked = onDisk.filter((s) => !tracked.includes(s));            // generated but not committed/pushed
const allChaptersTracked = onDisk.length >= 18 && untracked.length === 0 && missing.length === 0;

// Are we behind origin (committed locally but not pushed)?
sh('git fetch origin main --quiet');
const aheadOfOrigin = parseInt(sh('git rev-list --count origin/main..HEAD') || '0', 10);

let nextAction;
if (now >= HARD_STOP) nextAction = 'STOP_HARD_DEADLINE';
else if (allChaptersTracked && aheadOfOrigin === 0) nextAction = 'BOOK_COMPLETE_IDLE';
else if (untracked.length > 0 || aheadOfOrigin > 0) nextAction = 'PUSH_THEN_MAYBE_LAUNCH';
else if (missing.length > 0) nextAction = 'LAUNCH_WORKFLOW';
else nextAction = 'BOOK_COMPLETE_IDLE';

console.log(JSON.stringify({
  now,
  nowHuman: new Date(now * 1000).toLocaleString('en-CA', { timeZone: 'Asia/Shanghai', hour12: false }),
  HARD_STOP,
  GOAL,
  deadlinePassed: now >= HARD_STOP,
  goalTimePassed: now >= GOAL,
  minutesToHardStop: Math.round((HARD_STOP - now) / 60),
  book: BOOK_ID,
  targetSlugs,
  onDisk: onDisk.sort(),
  tracked: tracked.sort(),
  missing,
  untracked,
  aheadOfOrigin,
  allChaptersTracked,
  nextAction,
}, null, 2));
