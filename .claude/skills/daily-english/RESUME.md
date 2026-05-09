# Resume the daily-english backfill

Pause point: **2026-05-09**, after batch 12. Resuming next week when the Opus monthly quota recovers — or sooner if Sonnet is willing to keep absorbing the load (which it has been).

## State at pause

- **215 article files** in `src/data/english/` (212 marked done in topics DB, plus a duplicate SLIM C1 file from an earlier double-spawn — harmless).
- **540 pairs pending** across **270 fully-untouched topics** + tail-end CEFRs of 103 partially-done topics.
- All file `meta.date`s reflect REAL news event dates (not slug-rank-based dates). The slug (filename) is now an opaque URL key, decoupled from `meta.date`.
- All 215 articles have `meta.titleZh` (Chinese subtitle, shown on the card and at the article page header).

## To check before resuming

1. `git pull` (the local copy may have drifted while paused).
2. `git log --oneline -10` — confirm the last commits still match what's on `main`.
3. `ls src/data/english/*.ts | wc -l` — should be **217** (215 articles + `types.ts` + `index.ts`).
4. Open the live site at `/tools/english/` — confirm the card grid renders with Chinese subtitles + relative dates.

## How to spawn the next batch

The pipeline is unchanged. From this conversation or any new one, run:

```bash
python3 .claude/skills/daily-english/scripts/pick-topics.py --count 18
```

That returns the next 18 `(topicId, cefr, slug)` triples. **Critical**: the `slug` is just an opaque filename. The subagent must set `meta.date` to the real news event date, NOT the slug. The pipeline.md is now wired for this — it tells the subagent so explicitly.

For each triple, spawn one Sonnet subagent (NOT Opus — the monthly Opus quota is the bottleneck):

```
Agent({
  description: 'Topic short name CEFR',
  subagent_type: 'general-purpose',
  model: 'sonnet',
  run_in_background: true,
  prompt: `Pipeline subagent for daily-english. Working dir: /Users/shijie/Code/sdg-html

Inputs: topicId=<id>, cefr=<cefr>, slug=<slug>, outputPath=src/data/english/<slug>.ts

Read .claude/skills/daily-english/agents/pipeline.md and all reference files. Research via WebSearch — <one-sentence brief on the event>. <If sibling exists at <other slug>.ts, mention it and what angle the new article should take.> Keep word count under <CEFR cap>.

CRITICAL: Do NOT copy phrasing/examples/titles from any reference doc or sibling article.

Write the TS file to outputPath. Return only the absolute path. Do not commit, push, deploy, or update topics.json.`,
})
```

Spawn 15-20 in parallel. As each completes, validate + mark-done:

```bash
python3 .claude/skills/daily-english/scripts/validate.py src/data/english/<slug>.ts
python3 .claude/skills/daily-english/scripts/mark-done.py --topic-id <id> --cefr <cefr> --slug <slug>
```

After every batch (~18 articles), commit + push:

```bash
rm -f /tmp/git_temp_idx
GIT_INDEX_FILE=/tmp/git_temp_idx git read-tree HEAD
GIT_INDEX_FILE=/tmp/git_temp_idx git add -A src/data/english/ data/english-topics.json
TREE=$(GIT_INDEX_FILE=/tmp/git_temp_idx git write-tree)
git update-ref refs/heads/main $(printf 'daily-english: <N> articles in (batch <X> complete)\n\nCo-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>\n' | git commit-tree "$TREE" -p HEAD)
git push
```

## Pipeline rules already in place

The `pipeline.md` enforces these — re-read it if anything seems off:

1. **Run on Sonnet by default** (Opus quota is the bottleneck).
2. **`meta.date` = real news event publication-equivalent date**, not the slug. Found via WebSearch during research. Format `YYYY-MM-DD`. Must be ≤ today and ≥ topic's `newsDate`.
3. **`meta.titleZh` required** — 6-12 character Chinese subtitle, NOT a translation of English headline. Captures the heart in one breath.
4. **Vocab needs at least 2 Level-1 entries and at least 1 Level-4 entry** regardless of CEFR. (Reason: students rely on the visual ladder.)
5. **No em-dashes anywhere** (`—` or `——` or en-dash). Restructure proactively.

## Common cleanup after a batch

A few articles per batch fail validation due to vocab `word` not matching the surface form in its `sentenceId`. Quick patches:

- Find the offending vocab entry, change `word` to a different word that DOES appear in that sentence (or change `sentenceId` to a sentence containing the original word).
- Re-validate. Mark done.

This used to be more frequent on Opus. Sonnet seems to have ~1 of these per batch of 18.

## Topic queue priorities (which topics to pick first)

`pick-topics.py` returns whatever's pending in topic-DB order. To prioritize a specific theme (e.g. politics, sports, science), filter pending pairs by tag:

```bash
python3 -c "
import json
db = json.load(open('data/english-topics.json'))
for t in db['topics']:
    if 'politics' not in t.get('tags', []):
        continue
    done = {a['cefr'] for a in t.get('articles',[]) if a.get('cefr')}
    pending = [c for c in t.get('suggestedCEFR',[]) if c not in done]
    if pending:
        print(t['id'], pending)
"
```

## Key files

- `src/data/english/types.ts` — Article schema (note the new `titleZh?` field on `ArticleMeta`)
- `src/data/english/index.ts` — auto-discovery; exposes `articles`, `articleEntries`, `articlesBySlug` (keyed on filename, NOT meta.date)
- `src/pages/tools/english/index.astro` — landing card grid + filter
- `src/pages/tools/english/[slug].astro` — article reader
- `data/english-topics.json` — topic DB; track which `(topicId, cefr)` pairs are done
- `.claude/skills/daily-english/agents/pipeline.md` — subagent contract (the source of truth for what each generator does)
- `.claude/skills/daily-english/scripts/{pick-topics,validate,mark-done}.py` — orchestration helpers
