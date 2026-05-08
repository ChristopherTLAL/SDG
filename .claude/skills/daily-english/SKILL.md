---
name: daily-english
description: Mass-produces leveled English-learning articles for the /tools/english/ library. Each article is a 280-420 word news rewrite at a target CEFR level (A2 to C2), shipped as a TypeScript file dropped into `src/data/english/YYYY-MM-DD.ts` and auto-discovered by the front-end. Use whenever the user says "write a daily english article", "做一篇英语文章", "生成英语阅读", "跑一批英语阅读", "produce articles for english tool", "batch generate english reading", or asks to fill the english article library. Also use when the user references a specific topic ID from `data/english-topics.json` and asks to make the article. Don't undertrigger — if the user vaguely says "弄几篇英语阅读", "添加新闻阅读", "from topics list", this is the right skill.
---

# daily-english

A skill that takes a curated news topic and produces a fully-built English-learning article — research-grounded prose at a target CEFR level, vocabulary tagged Level 1-4, deep grammar + pattern lessons, comprehension quiz — formatted as a drop-in `src/data/english/YYYY-MM-DD.ts` file for the [/tools/english/](../../../src/pages/tools/english/) reader.

The skill is built for **batch production**. The end goal is hundreds of articles. Per invocation it can do one article or a batch of 10+. Each article goes through a 7-step pipeline; quality safeguards (no em-dashes, schema validity, vocab regex matches) are enforced by an automated validator before the file is written.

## When the user invokes you

The user typically calls this skill in one of three ways:

1. **One specific topic** — "do `t-vesuvius-ai-2024` at B2"
2. **A batch of N pending topics** — "run 10 from the topic queue"
3. **All remaining for a given level** — "do all pending B1s"

Resolve the user's intent first, then execute the **Orchestration loop** below.

## Architecture

```
[ Main Claude — orchestrator ]
       │
       │ for each (topicId, cefr) selected from data/english-topics.json:
       │
       ├──→ [ pipeline subagent (Opus) ]   <- spawned in parallel, up to 10 at a time
       │     │
       │     │ runs the 7-step pipeline internally (see agents/pipeline.md):
       │     │   1. research      : multi-source news gathering (WebSearch + WebFetch)
       │     │   2. write article : 280-420 word prose at target CEFR
       │     │   3. tag vocab     : 18-22 words, Level 1-4 with IPA/def/example
       │     │   4. write quiz    : 5 MCQ + explanations
       │     │   5. design grammar/patterns : deep multi-paragraph entries
       │     │   6. tone review   : polish prose, purge em-dashes
       │     │   7. assemble TS file (write to src/data/english/YYYY-MM-DD.ts)
       │     │
       │     │ returns: filePath of written article OR error report
       │
       │ wait for all pipelines to finish
       │
       ├──→ run scripts/validate.py on each new TS file
       │      │
       │      │ if validation fails → spawn fixer subagent on that file
       │
       └──→ run scripts/mark-done.py to update topics.json with completed (topicId, cefr) pairs
```

The pipeline subagent uses **Opus** for tone + learning-design quality. Sonnet is too easy to drift into stock-essay phrasing for the deep grammar / pattern explanations. If you want to optimize cost later, the pipeline can be split into a Sonnet draft + Opus polish — but for v1, Opus end-to-end is the safer default.

## Orchestration loop (what to do each time you're invoked)

### Step 1: Resolve the work list

The topic database lives at [`data/english-topics.json`](../../../data/english-topics.json) (project root, NOT inside this skill — it's curated independently). Schema in [references/topics-db.md](references/topics-db.md).

Pick a list of (topicId, cefr) pairs to do. Use `scripts/pick-topics.py` if the user gave a count or filter:

```bash
python3 .claude/skills/daily-english/scripts/pick-topics.py --count 10           # next 10 pending
python3 .claude/skills/daily-english/scripts/pick-topics.py --cefr B2 --count 5  # 5 pending B2s
python3 .claude/skills/daily-english/scripts/pick-topics.py --topic-id t-foo     # specific topic, all pending CEFRs
```

The script outputs JSON like:
```json
[
  {"topicId": "t-vesuvius-ai-2024", "cefr": "B2", "slug": "2026-05-09"},
  {"topicId": "t-iceland-volcanoes", "cefr": "B2", "slug": "2026-05-10"}
]
```

The `slug` is auto-assigned by the script — first available unused date starting from today. It also **doubles as the file name** (`src/data/english/<slug>.ts`).

If the user named a specific topic, just use that. Either way, finalize the work list and confirm with the user before spawning subagents — these calls cost real tokens.

### Step 2: Spawn pipeline subagents in parallel

For each (topicId, cefr, slug) in the list, spawn a pipeline subagent. Use the Agent tool with `subagent_type: general-purpose` and `model: opus`. Pass each subagent these inputs in its prompt:

```
Read .claude/skills/daily-english/agents/pipeline.md and execute the full 7-step
pipeline for this article:

  topicId: <id>
  cefr:    <level>
  slug:    <YYYY-MM-DD>
  outputPath: src/data/english/<slug>.ts

Topic data (look up from data/english-topics.json by topicId):
<paste the topic entry here so the subagent doesn't have to re-read the DB>

When done, write the TS file to outputPath and return ONLY the path. If you fail
at any step, return a JSON error block:
  { "error": "<step name>", "details": "<what went wrong>" }
```

**Batching size**: Spawn at most 10 subagents per Agent message. For larger batches, do 10 at a time, wait for all to return, then start the next 10. This keeps token throughput reasonable and lets you fail-fast on validation errors mid-batch.

### Step 3: Validate each output

After each batch returns, run the validator on every successfully-written file:

```bash
python3 .claude/skills/daily-english/scripts/validate.py src/data/english/<slug>.ts
```

The validator checks:
- No em-dashes (`—` or `——`) anywhere in the file
- Schema integrity: required fields present, vocab levels in {1,2,3,4}, sentenceIds match
- Vocab regex: each `vocab.word` value, when used as `\bword\b`, must match its target sentence's `en` text (otherwise the front-end frontmatter renderer won't wrap it in a `<span class="vocab">`)
- CEFR matches request (the top-level `meta.cefr` must equal the requested level)

On validation failure, spawn a fixer subagent (Opus, `general-purpose`) and pass the file path + error list. The fixer reads the file, applies the minimal fix, and rewrites it.

### Step 4: Mark topics done

For each successfully validated file, run:
```bash
python3 .claude/skills/daily-english/scripts/mark-done.py --topic-id <id> --cefr <level> --slug <slug>
```

This updates `data/english-topics.json` with the completed (topicId, cefr) → filePath mapping. The `articles` array on the topic entry now lists the produced files.

### Step 5: Report back

Tell the user concisely:
- ✅ written and validated — list with slug + topic event title + cefr
- ❌ failed (after fix attempt) — list with reason

Don't auto-commit or auto-deploy. The user runs `/deploy` separately when they're ready to ship.

## Reference files (load when relevant)

| File | When to load |
|---|---|
| [references/schema.md](references/schema.md) | Always — the TS schema is the contract |
| [references/style-guide.md](references/style-guide.md) | Always — the no-em-dash + tone rules |
| [references/article-writing.md](references/article-writing.md) | When writing the article body |
| [references/vocab-tagging.md](references/vocab-tagging.md) | When tagging vocabulary |
| [references/grammar-design.md](references/grammar-design.md) | When designing grammar entries |
| [references/pattern-design.md](references/pattern-design.md) | When designing pattern entries |
| [references/topics-db.md](references/topics-db.md) | When reading or updating `data/english-topics.json` |

The pipeline subagent reads these as it goes — they are the substantive instructions per step. SKILL.md (this file) is just the orchestration shell.

## Existing samples to model the output after

Two production-quality samples already exist; the pipeline subagent should read at least one before assembling its TS file to confirm the format:

- [src/data/english/2026-05-07.ts](../../../src/data/english/2026-05-07.ts) — B2 (dark sky tourism)
- [src/data/english/2026-05-08.ts](../../../src/data/english/2026-05-08.ts) — B1 (tool-lending libraries)

Match this style. Match this depth. Anything thinner than these is not done.

## Hard rules (the validator catches violations but you should not produce them in the first place)

1. **No em-dashes anywhere.** Not in articles, not in zh translations, not in explanations, not in examples, not in callouts. Use commas, parentheses, periods, or restructure the sentence. The site owner does not like em-dashes.
2. **Vocab levels are numeric 1-4.** Not 'CET4'/'CET6'/'IELTS'/'GRE'. The Level 1-4 scale is article-internal and roughly aligned to surface-form difficulty.
3. **Vocab `word` field must match exactly as it appears in the sentence.** The front-end renders `<span class="vocab">` via `\bword\b` regex. If `word: 'lending'` but the sentence has `lend`, the span never gets wrapped and the highlight won't work.
4. **Grammar / pattern titles are learning-centered, not jargon.** Bad: `"What-cleft for emphasis"`. Good: `"把焦点放在'东西'上，而不是'谁做的'"`. Pattern useCase: `"想要表达 X"` / `"在 X 时这么写"` style.
5. **Article CEFR is the article's level. Vocab Level 1-4 is internal to the article.** A B2 article still has its hardest words tagged Level 4 — it doesn't suddenly have GRE-tier words because the CEFR is high.

## What this skill does NOT do

- It does not commit / push / deploy. The user runs `/deploy` separately.
- It does not curate the topic database. The user adds news events to `data/english-topics.json` themselves (or uses a separate skill).
- It does not call other skills. It is self-contained.
