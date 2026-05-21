# Book mode (themed multi-chapter books)

The daily-english pipeline normally produces standalone articles for the flat
library. **Book mode** produces *chapters* of a themed book (e.g. "Giselle:
Inside aespa"). A chapter is a normal `Article` plus two book-only additions:

1. a `listeningWriting` field (see [listening-writing.md](listening-writing.md))
2. a `meta.audioUrl` filled LATER by the TTS script (leave it absent)

Everything else (research → write → vocab → quiz → grammar → patterns → tone
review) runs exactly as in [pipeline.md](../agents/pipeline.md). Read that and
all its references first; this file only states the deltas.

## Inputs the orchestrator passes you

- `bookId`        e.g. `giselle`
- `chapterOrder`  integer, e.g. `1`
- `chapterSlug`   `NN-slug`, e.g. `01-comeback` (the filename, NN = order)
- `topic`         a title + angle + searchTerms (NOT from english-topics.json)
- `cefr`          the book's level (Giselle = **B1**, all chapters)
- `outputPath`    `src/data/english/books/<bookId>/<chapterSlug>.ts`

## Deltas vs. the flat pipeline

### Import path
Chapter files live two levels deeper than flat articles, so the import is:

```ts
import type { Article } from '../../types';   // NOT './types'
```

### meta
- `meta.date` is still the **real news date** of the event the chapter covers
  (find it in research; ≤ today). It is NOT the chapter number.
- `meta.title` / `meta.titleZh` as usual.
- Do **not** set `meta.audioUrl` — the audio script adds it after generation.

### Extra step 8
After the normal 7 steps, add the `listeningWriting` field per
[listening-writing.md](listening-writing.md). Its info-gap rows bind to your
sentence IDs and its writing task reuses your own pattern IDs, so do this last,
once paragraphs + patterns are final.

### Output object
```ts
import type { Article } from '../../types';

export const article: Article = {
  meta: { ... },          // no audioUrl
  paragraphs: [ ... ],
  vocab: [ ... ],
  collocations: [],
  grammar: [ ... ],
  patterns: [ ... ],
  quiz: [ ... ],
  listeningWriting: { infoGap: [ ... ], writing: { ... } },
};
```

Write to `outputPath` with the Write tool. The book loader
([src/data/english/books/index.ts](../../../../src/data/english/books/index.ts))
auto-discovers it by folder; chapter order comes from the `NN-` filename prefix.

## Calibration for B1

Per article-writing.md's B1 row: ~280-330 words, plain high-frequency syntax,
short clear clauses. Because the reader is rich (hover vocab, grammar, patterns,
flashcards, listening, writing), B1 text is fine even for a motivated learner;
the depth comes from the tooling, not from cranking the prose difficulty.

Keep the prose **listenable** (it becomes TTS audio): short sentences, clear
referents, avoid dense parentheticals or number-stacked sentences that sound
awkward read aloud.
