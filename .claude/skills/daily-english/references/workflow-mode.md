# Workflow mode (book production via a dynamic Workflow)

**This is the preferred engine for producing book chapters.** It replaces the
old Agent-tool fan-out (one `Agent({...})` per chapter from the main session) with
a single **dynamic Workflow** ([workflows/book-pipeline.mjs](../workflows/book-pipeline.mjs)).

Use it whenever you are making chapters of a themed book under
`src/data/english/books/<id>/`. (Flat daily-article backfill can still use the
legacy fan-out in [SKILL.md](../SKILL.md); the Article schema is identical, so the
workflow can do flat articles too if you point `outputPath` at `src/data/english/<slug>.ts`.)

## Why this is more stable (the whole point)

The chapter generation itself is still a long, network-heavy agent turn. What the
Workflow changes is **what happens when the network drops mid-run** (the recurring
VPN problem on this machine):

- **Resume.** Relaunch with `Workflow({ scriptPath, resumeFromRunId })` and the
  longest unchanged prefix of `agent()` calls returns from cache instantly. Every
  chapter that already finished and wrote its `.ts` is skipped; only the dead one
  re-runs. The old fan-out lost track of *all* in-flight subagents when the main
  session's own connection dropped.
- **A dead agent becomes `null`, not a dead run.** `parallel()` never rejects, so
  one chapter dying mid-stream does not take the others down. You resume to refill
  the `null`s.
- **Self-validating agents.** Each agent runs `validate.py` on its own file and
  fixes until clean, so almost nothing bounces back to the orchestrator.
- **Deterministic orchestration.** The loop, retry, and gating live in the script,
  not in a fragile main-session turn.

## The contract (how the script is shaped)

A **two-stage pipeline** per chapter, run with `pipeline()` (no barrier — each
chapter flows through both stages independently):

1. **Generate.** One `agent()` **writes its own `.ts` file**, self-validates via
   `validate.py`, and returns only a **light, flat report**
   (`{ order, slug, outputPath, ok, wordCount, ..., errors[] }`). The heavy
   bilingual content goes to disk; only scalars stream back. This is on purpose: a
   nested-array StructuredOutput of the full `Article` tends to fail (see memory
   `workflow_heavy_schema_structuredoutput_fail.md`). Never give the agent the heavy
   `Article` schema; let it Write the file and report a summary.
2. **Fact-check.** A second `agent()` reads the written file, lists its hard facts
   (names, dates, numbers, track positions, attributions, superlatives), verifies
   each via WebSearch, and **surgically corrects only verifiable errors** (in both
   the English and the paired zh, and anywhere the wrong fact threaded into a
   grammar/pattern example), then re-runs `validate.py`. It returns
   `{ order, slug, claimsChecked, corrections[], unresolved[], validatorOk }`.
   Constraints baked into its prompt: never touch sentence IDs / counts / vocab
   words / register, never add an em-dash, leave unconfirmable claims alone and
   flag them under `unresolved`.

This stage exists because Sonnet holds teaching depth but is looser with verifiable
facts than Opus (it shipped three track-position / credit slips in the ch.3
comparison). The fact-check pass makes Sonnet output ship-ready at ~1/5 the Opus
cost. A chapter whose **generation** failed skips fact-check and passes through as
`needsAttention`.

`agentType: 'general-purpose'` so each agent has Read / Write / Bash / WebSearch.
Both stages use `BOOK.agentModel` (default `'sonnet'` for this book: cheaper, and
shorter generations survive a flaky network better). Set `agentModel: undefined` to
inherit the session model (Opus) for max grammar/pattern depth and tighter facts,
at ~5x the cost; with Opus you can usually drop the fact-check stage.

## How to run

1. **Read** [workflows/book-pipeline.mjs](../workflows/book-pipeline.mjs).
2. **Fill the DATA BLOCK** at the top inline:
   - `BOOK` = `{ id, cefr, register, noListening, modelFile, agentModel }`.
     - `register`: `'b-level'` (→ `references/article-writing.md`) or `'c-level'`
       (→ `references/c-level-writing.md`).
     - `noListening: true` for books with no audio (Jay Chou). Omits both the
       `listeningWriting` field and `meta.audioUrl`.
     - `modelFile`: the gold-standard chapter the agents copy for FORMAT / REGISTER
       / DEPTH (not content). For Jay Chou: `01-son-of-the-sun.ts`.
   - `CHAPTERS` = an array of `{ order, slug, title, angleZh, angleEn, searchTerms[], avoidConstructions }`.
     **Inline the data, do NOT use `args`** (it is unreliable here — memory
     `workflow_args_inline.md`).
   - **Book coherence:** pre-assign distinct grammar/pattern territory per chapter
     in `avoidConstructions` so 18 chapters do not all teach the same three points.
     List what earlier chapters already used; the agent picks different ones. This
     keeps full parallelism (no sequential dependency between chapters).
3. **Launch:** `Workflow({ script: <the filled-in file contents> })`. The tool
   persists the script and returns a `scriptPath` + `runId` — keep both.
4. The workflow runs in the background; you get a notification when it returns
   `{ book, requested, chapters[], agentNull }`, where each `chapters[]` row carries
   `{ order, slug, outputPath, generated, factChecked, validatorOk, claimsChecked,
   corrections[], unresolved[] }`. Read `corrections` to see what the fact-check
   fixed and `unresolved` for claims it could not confirm (those deserve your eyes).

## After it returns

1. **Independent re-validate** (cheap, belt-and-suspenders) on every file in
   `chapters[]`, and skim each row's `corrections` / `unresolved`:
   ```bash
   python3 .claude/skills/daily-english/scripts/validate.py src/data/english/books/<id>/<slug>.ts
   ```
   A row with `validatorOk: false` means the fact-check edits broke validation; a
   non-empty `unresolved` means a claim the checker could not confirm. Both want a
   human glance before shipping.
2. **Refill gaps.** If `agentNull > 0` or a row has `generated: false`, resume:
   ```
   Workflow({ scriptPath: '<persisted path>', resumeFromRunId: '<runId>' })
   ```
   Finished chapters return from cache; only the missing/failed ones re-run. (If a
   chapter's *content* is wrong rather than the agent having died, edit that
   chapter's entry or just re-run the single chapter with a one-element `CHAPTERS`
   array.)
3. **Ship.** Commit + push the new chapter files (per CLAUDE.md, prefer GitHub MCP;
   `git reset HEAD -- .` first). The book loader auto-discovers chapters by folder,
   so no index edits. Vercel builds; confirm the chapter renders at
   `/tools/english/books/<id>/<slug>`.

## Resume cheat-sheet

| Situation | Action |
|---|---|
| Run died (VPN drop), some chapters done | `Workflow({ scriptPath, resumeFromRunId })` — cached prefix is free |
| One chapter's content is wrong | Re-run with a 1-element `CHAPTERS` (just that chapter); it overwrites the file |
| Want to add more chapters to a shipped book | New run, new `CHAPTERS`; resume not needed |
| Same script + same data, re-launched | 100% cache hit (no re-generation, no cost) |

## Worked example: the Jay Chou book (B2, no audio)

`BOOK = { id: 'jay-chou', cefr: 'B2', register: 'b-level', noListening: true, modelFile: 'src/data/english/books/jay-chou/01-son-of-the-sun.ts' }`

18 chapters, locked. Ch.1 is shipped (the register model). Ch.2 ships in the script
as the water-test. The remaining 16 themes (flesh each into a full `CHAPTERS` entry
when doing the full run, assigning distinct grammar/pattern territory per chapter):

| # | slug (suggested) | theme |
|---|---|---|
| 1 | `01-son-of-the-sun` | ✅ 2026 return, the album *Son of the Sun* after four quiet years |
| 2 | `02-one-city-one-song` | Carnival II tour: each city themed around a different song (water test) |
| 3 | `03-twenty-five-years` | 25th anniversary of the self-titled debut |
| 4 | `04-record-breaking-tour` | Carnival tour 2022–25, the box-office / attendance records |
| 5 | `05-art-history` | *Greatest Works of Art*: the MV that plays like art history |
| 6 | `06-east-meets-west` | 中国风 fusion: erhu/guzheng over hip-hop and R&B |
| 7 | `07-the-lyricist` | 方文山, the lyricist behind the imagery |
| 8 | `08-mojito` | *Mojito* and Chou's late-career lightness |
| 9 | `09-the-mumble` | his famously slurred diction as a deliberate style |
| 10 | `10-prodigy-to-producer` | piano prodigy to self-producing auteur |
| 11 | `11-secret` | the film *Secret* (不能说的秘密) |
| 12 | `12-rice-field` | *Rice Field* / *Listen to Mom*: the gentle, rooted songs |
| 13 | `13-the-ktv-king` | his decades-long dominance of KTV songbooks |
| 14 | `14-the-nostalgia-economy` | the youth-nostalgia economy around his catalogue |
| 15 | `15-streaming-and-fans` | streaming records and fan economy |
| 16 | `16-mandopop-goes-global` | Mandopop's global reach through him |
| 17 | `17-the-phenomenon` | the 天王 phenomenon: why he became *the* one |
| 18 | `18-the-inheritors` | his influence on the new generation of artists |

Run order is free (chapters are independent); just keep each chapter's
`avoidConstructions` honest about what earlier chapters used so the grammar/pattern
coverage stays varied across the book.
