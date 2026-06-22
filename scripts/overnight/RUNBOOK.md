# Overnight book-goal RUNBOOK (one tick, MULTI-BOOK)

You were woken by a cron (or by a workflow-completion notification) to advance the
overnight English-books goal: **finish Jay Chou ch5-18, then work the C-level books
in `scripts/overnight/queue.json`, until done or the deadline.** Do **one tick** of
the procedure below, then stop. Working dir: `/Users/shijie/Code/sdg-html`.

Correctness comes from **idempotency + state-from-disk**, never memory. A VPN drop
or app restart anywhere is safe: the next tick recomputes truth and continues. Keep
each tick short. Do NOTHING outside this procedure.

## STEP 0 — read state (always first)

```bash
node scripts/overnight/state.mjs
```
Use its JSON: `deadlinePassed`, `nextAction`, `currentBook`, `currentScript`,
`currentMissing`, `untrackedByBook`, `minutesToHardStop`, `aheadOfOrigin`.

## STEP 1 — HARD STOP (overrides everything)

If `deadlinePassed == true` (now >= 06:20) or `nextAction == "STOP_HARD_DEADLINE"`:
1. `CronList` then `CronDelete` **every** overnight cron (work cron + 06:20 kill-switch).
2. `TaskList` then `TaskStop` **every** running task (kill any in-flight workflow).
3. Append to `.overnight/log.md`: `[<nowHuman>] HARD STOP 06:20. Shipped: <git-tracked chapter count> chapters.`
4. **STOP. The goal is over. Never generate/launch/push again.**

## STEP 2 — if a workflow is already running, do nothing else

A generation workflow may be running in the background (it mutates chapter files
during fact-check, so we must NOT push or relaunch while it runs).
- `TaskList`: if any workflow/background task is **running**, append
  `[<nowHuman>] <currentBook>: run in progress` to `.overnight/log.md` and **STOP this tick**.
- Restart fallback (TaskList empty): if `.overnight/active.json` exists and its
  `startedEpoch` is **within the last 30 min**, assume a run is going: log and STOP.
  If older than 30 min, it is stale → `rm .overnight/active.json` and continue
  (the workflow is idempotent; relaunching is safe).

## STEP 3 — ship finished chapters (only when NO workflow is running)

If `untrackedByBook` is non-empty or `aheadOfOrigin > 0`:

For every untracked slug (all books), validate first:
```bash
python3 .claude/skills/daily-english/scripts/validate.py src/data/english/books/<bookId>/<slug>.ts
```
Stage ONLY chapters that print `{"ok": true}` (explicit pathspecs, never `-A`).
**Always stage the book's `book.ts` manifest too** — a chapter committed without its
`book.ts` deploys but 404s (the loader registers books by their manifest). Then
commit + push, resilient to the parallel session's pushes:
```bash
git reset HEAD -- .
git add src/data/english/books/<bookId>/book.ts          # the manifest — or the whole book 404s
git add src/data/english/books/<bookId>/<valid-slug>.ts   # repeat per valid file; also: git add scripts/overnight .claude/skills/daily-english if ahead
git commit -m "feat(english/<bookId>): overnight batch — <slugs> (Sonnet + fact-check)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
git fetch origin main && git rebase origin/main && git push origin main
```
If `git push` is rejected (non-fast-forward, the parallel session pushed): repeat
`git fetch origin main && git rebase origin/main && git push origin main` once more.
A chapter that is untracked but FAILS validate is left as-is (the next workflow run
overwrites it, since it is not git-tracked).

## STEP 4 — launch the next batch (only if work remains and time is safe)

If `currentBook` is set, `currentReady == true`, `currentMissing` is non-empty, and
`minutesToHardStop > 25`:
```
Workflow({ scriptPath: "/Users/shijie/Code/sdg-html/<currentScript>" })
```
(`currentScript` is e.g. `scripts/overnight/wf/jay-chou.mjs` or `.../deep-time.mjs`.)
The workflow is **idempotent**: chapters already committed to git are skipped, only
`currentMissing` are generated + fact-checked. Then write the marker + log and STOP:
```bash
mkdir -p .overnight
printf '{"startedEpoch": %s, "book": "<currentBook>", "script": "<currentScript>"}\n' "$(date +%s)" > .overnight/active.json
printf '[%s] launched %s for %s missing chapter(s)\n' "$(date '+%F %T')" "<currentBook>" "<count>" >> .overnight/log.md
```
If `minutesToHardStop <= 25`, do NOT launch (it would not finish). Just push what is
done (Step 3) and stop.

## STEP 4b — current book not ready (rare)

If `currentReady == false` (its `scripts/overnight/wf/<id>.mjs` is missing): if
`scripts/overnight/lineups/<id>.json` exists, render it
(`node scripts/overnight/render-book.mjs <id>`), syntax-check the result, and on
success this tick ends (next tick will launch it). If it still cannot be rendered,
append a note to `.overnight/log.md`, remove that id from `scripts/overnight/queue.json`,
and stop (skip the broken book; do not let it block the queue).

## STEP 5 — all complete

If `nextAction == "ALL_COMPLETE_IDLE"` (every queued book fully tracked + pushed):
1. Append `[<nowHuman>] ALL QUEUED BOOKS COMPLETE.` to `.overnight/log.md`.
2. `CronList` then `CronDelete` the **work** cron (job done early). Leave the 06:20
   kill-switch (it will fire, find nothing to do, and no-op).
3. STOP.

## On a workflow COMPLETION notification (fast path, not a cron)

Same logic: first `rm .overnight/active.json`, then run this runbook from STEP 1
(hard-stop), STEP 3 (push what finished), STEP 4 (relaunch current book if any
chapters are still `missing` because agents died/null, or advance to the next book).
The cron is only the safety net for anything this misses.
