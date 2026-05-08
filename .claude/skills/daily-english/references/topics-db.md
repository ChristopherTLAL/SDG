# Topic database (`data/english-topics.json`)

Curated list of news events at the project root. Independent of the skill — the user adds / edits topics here, the skill consumes from it.

## Path

`<repo>/data/english-topics.json`

NOT in the skill folder. NOT in `src/data/english/` (that path is for finished article TS files).

## Schema

```json
{
  "topics": [
    {
      "id": "t-vesuvius-ai-2024",
      "event": "AI deciphers Herculaneum scrolls",
      "summary": "Researchers used machine learning to read sealed, carbonized scrolls from the Vesuvius eruption of 79 AD, recovering passages from a previously unread Greek philosophical text.",
      "newsDate": "2024-02",
      "searchTerms": [
        "vesuvius scrolls AI",
        "herculaneum carbonized scrolls deep learning",
        "vesuvius challenge competition winner"
      ],
      "suggestedCEFR": ["B2", "C1"],
      "tags": ["technology", "archaeology", "history", "ai"],
      "articles": []
    }
  ]
}
```

### Field meanings

- **`id`** (string, required, unique) — slug-style ID like `t-<keyword>-<year>`. Used as foreign key.
- **`event`** (string, required) — short headline-style description of the news event.
- **`summary`** (string, required) — 1-2 sentence prose summary. Helps researcher subagent know what to search for.
- **`newsDate`** (string, "YYYY-MM" or "YYYY") — when the news happened. Helps narrow web searches.
- **`searchTerms`** (string[]) — seed queries for the researcher subagent. Pick 2-4 distinct angles.
- **`suggestedCEFR`** (string[], values from "A2" "B1" "B2" "C1" "C2") — which levels this event can be written at. The skill produces one article per (topicId, cefr) pair.
- **`tags`** (string[], optional) — categorization for filtering / browsing. Free-form.
- **`articles`** (array, populated by skill) — completed articles. See below.

### `articles` array (populated as work completes)

Each entry tracks one finished (topic, cefr) pair:

```json
{
  "cefr": "B2",
  "slug": "2026-05-09",
  "filePath": "src/data/english/2026-05-09.ts",
  "createdAt": "2026-05-09T14:30:00Z"
}
```

A topic with `suggestedCEFR: ["B1", "B2", "C1"]` is fully done when `articles` has 3 entries (one for each CEFR). Until then, the missing CEFRs are pending.

## How to find pending work

Run:
```bash
python3 .claude/skills/daily-english/scripts/pick-topics.py --count 10
```

This script reads the database and emits a JSON list of `{topicId, cefr, slug}` for the next N pending pairs.

A pair is "pending" if `cefr ∈ suggestedCEFR` and there is no entry in `articles` with that `cefr`.

The script also auto-assigns a `slug` (filename) for each pending pair: it picks the first available date starting from today that's not already taken by another article.

## How to mark work done

After a successful (topic, cefr) generation:
```bash
python3 .claude/skills/daily-english/scripts/mark-done.py \
  --topic-id t-vesuvius-ai-2024 \
  --cefr B2 \
  --slug 2026-05-09
```

This appends an `{cefr, slug, filePath, createdAt}` entry to that topic's `articles` array.

## Adding new topics

The user does this manually (or via a future curation skill). Just open `data/english-topics.json` and add to the `topics` array. The schema is the same. No deduplication is enforced — if you add a duplicate `id`, the script will likely fail.

For the skill itself: never invent topics. If asked to "do 10 more articles" and the queue is empty, report that and stop. Don't fabricate news to pad the database.
