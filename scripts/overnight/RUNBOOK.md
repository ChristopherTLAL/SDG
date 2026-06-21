# Overnight book-goal RUNBOOK (one tick)

You were woken by a cron to advance the overnight English-books goal. Do **one
tick** of the procedure below, then stop. Working dir: `/Users/shijie/Code/sdg-html`.

Correctness comes from **idempotency + state-from-disk**, never from memory. A VPN
drop or app restart anywhere is safe: the next tick recomputes truth and continues.
Keep each tick short. Do NOT do anything outside this procedure.

## STEP 0 — read state (always first)

```bash
node scripts/overnight/state.mjs
```

This prints JSON. Use its `nextAction` and fields below.

## STEP 1 — HARD STOP (the one rule that overrides everything)

If `deadlinePassed` is `true` (now >= 06:20) **or** `nextAction == "STOP_HARD_DEADLINE"`:

1. `CronList` → `CronDelete` **every** overnight cron job (work cron + kill-switch).
2. `TaskList` → `TaskStop` **every** running task (kill any in-flight workflow).
3. Append one line to `.overnight/log.md`: `[<nowHuman>] HARD STOP at 06:20. Final: <tracked count>/18 chapters shipped.`
4. **STOP. Do nothing else. The goal is over.**

Never generate or launch anything once `deadlinePassed` is true.

## STEP 2 — don't double-launch

A workflow may already be running in the background (the cron cannot overlap
*itself*, but a launched workflow keeps running while the REPL is idle).

- `TaskList`: if any workflow/background task is still **running**, a batch is in
  flight. Append `[<nowHuman>] run in progress, <tracked>/18 shipped` to
  `.overnight/log.md` and **STOP this tick** (its completion will drive the next step).
- Cross-restart fallback: if `TaskList` shows nothing but `.overnight/active.json`
  exists and its `startedEpoch` is **within the last 30 minutes**, assume a run is
  still going: log and STOP. If the marker is older than 30 min, it is stale →
  delete it and continue (the workflow is idempotent, so relaunching is safe).

## STEP 3 — ship finished chapters (idempotent)

If `untracked` is non-empty **or** `aheadOfOrigin > 0`:

For each slug in `untracked`:
```bash
python3 .claude/skills/daily-english/scripts/validate.py src/data/english/books/jay-chou/<slug>.ts
```
Only chapters that print `{"ok": true}` may ship. Then commit + push, **explicit
pathspecs only**, fetch-first fast-forward:
```bash
git fetch origin main && git merge --ff-only origin/main 2>/dev/null
git reset HEAD -- .
git add src/data/english/books/jay-chou/<each-valid-slug>.ts   # explicit paths, never -A
git commit -m "feat(english/jay-chou): ch.NN <title> (B2, Sonnet + fact-check, overnight)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
git push origin main
```
If a chapter is `untracked` but FAILS validate, leave it (the next workflow run
overwrites it, since it is not git-tracked).

## STEP 4 — launch the next batch (only if work remains and time is safe)

If `missing` is non-empty **and** `minutesToHardStop > 25`:

```
Workflow({ scriptPath: "/Users/shijie/Code/sdg-html/.claude/skills/daily-english/workflows/book-pipeline.mjs" })
```
The workflow is **idempotent**: chapters already committed to git are skipped
(near-zero cost), only `missing` ones are generated + fact-checked. Then write the
marker and log:
```bash
mkdir -p .overnight
printf '{"startedEpoch": %s, "expected": %s}\n' "$(date +%s)" '<missing JSON array>' > .overnight/active.json
printf '[%s] launched workflow for %s missing chapter(s)\n' "$(node -e 'console.log(new Date().toLocaleString())')" "<count>" >> .overnight/log.md
```
**STOP** (the workflow runs in the background; you will be notified when it returns).

If `minutesToHardStop <= 25`, do NOT launch (a new batch would not finish). Just
push whatever is done (Step 3) and stop.

## STEP 5 — book complete

If `nextAction == "BOOK_COMPLETE_IDLE"` (all 18 chapters tracked + pushed):

1. Append `[<nowHuman>] BOOK COMPLETE: 18/18 Jay Chou chapters shipped.` to `.overnight/log.md`.
2. `CronList` → `CronDelete` the **work** cron (job done early). Leave the 06:20
   kill-switch (it will fire, see everything done, and no-op).
3. STOP.

## When a workflow COMPLETES (you get a task-notification, not a cron)

Handle it in-context with the SAME logic: delete `.overnight/active.json`, then run
this runbook from STEP 1 (hard-stop check), STEP 3 (push what finished), STEP 4
(relaunch if any chapters are still `missing` because agents died/null). This is
the fast path; the cron is the safety net that catches anything missed.
