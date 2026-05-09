# TypeScript schema for an article

The article TS file at `src/data/english/<slug>.ts` exports a single `article: Article` object. The shape is defined by [`src/data/english/types.ts`](../../../../src/data/english/types.ts). Read that file directly if you need the canonical version. This page is the working summary.

## Top-level shape

```ts
import type { Article } from './types';

export const article: Article = {
  meta: {
    date: '2026-05-09',                       // YYYY-MM-DD; matches the slug + filename
    title: 'Why Tourists Are Now Paying to See the Stars',  // English headline
    cefr: 'B2',                               // 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
    wordCount: 412,                           // count the article body, not headline
    readingMinutes: 5,                        // ~85 words per minute B1, ~120 B2, ~150 C1
    editorsNote: '...',                       // optional, ~25-50 words; what makes this piece worth reading
  },
  paragraphs: [...],
  vocab: [...],
  collocations: [],                            // can be empty array; not currently rendered prominently
  grammar: [...],
  patterns: [...],
  quiz: [...],
};
```

## paragraphs

```ts
{
  id: 'p1',                                    // 'p1', 'p2', ... in order
  sentences: [
    { id: 's1',  en: '...', zh: '...' },       // 's1' through 's<N>' across the WHOLE article (not per paragraph)
    { id: 's2',  en: '...', zh: '...' },
    ...
  ]
}
```

- Sentence IDs are global, not per-paragraph. So if paragraph 1 has 4 sentences, paragraph 2 starts at `s5`.
- Each sentence is what the front-end shows as a clickable unit. **It can contain more than one grammatical sentence** (e.g. two short sentences joined). Use this to keep period-split rhetoric intact.
- `zh` is the Chinese translation. Same number of sentences in zh as in en (they are paired by id).

## vocab

```ts
{
  id: 'v1',                                    // 'v1', 'v2', ... in order
  word: 'unchecked',                           // surface form as it appears in the sentence (case-preserved)
  lemma: 'unchecked',                          // dictionary form, lowercase
  sentenceId: 's4',                            // the sentence this word appears in
  level: 2,                                    // 1 | 2 | 3 | 4 (NOT a string code)
  pos: 'adj.',                                 // 'n.' / 'v.' / 'adj.' / 'adv.' / 'phr. v.' etc
  ipa: '/ʌnˈtʃekt/',
  defZh: '不受控制的；未受抑制的',                // 1-3 short alternatives separated by ；
  defEn: 'not controlled or restrained',       // one-line English gloss
  example: 'Unchecked deforestation has accelerated species loss.',
  exampleZh: '不受约束的森林砍伐加速了物种消失。', // optional but strongly recommended
}
```

**Critical**: `word` must match the surface form **exactly as it appears in its target sentence**, because the front-end uses `\b<word>\b` regex to wrap `<span class="vocab">` at frontmatter time. If `word: 'lending'` but the sentence says `lend`, the span never gets attached and the highlight doesn't render.

Common mistakes to avoid:
- vocab `word: 'borrow'` but sentence says `borrowing` — they have to match
- vocab `word: 'tools'` but sentence says `tool` — they have to match
- vocab `word: 'wear out'` (multi-word phrasal verb) — fine, regex `\bwear out\b` works

## grammar

```ts
{
  id: 'g1',
  title: '把焦点放在"东西"上，而不是"谁做的"',  // student-facing, learning-centered, NOT linguistic jargon
  pattern: 'What [clause] is/was [emphasis]',  // technical schematic, shown alongside title
  sentenceIds: ['s5'],                         // the article sentences that exemplify this grammar
  explanationZh: [                             // multi-paragraph deep explanation, 3-5 paragraphs typical
    'paragraph 1 ...',
    'paragraph 2 ...',
    'paragraph 3 ...',
  ],
  examples: [                                  // 4-6 worked examples
    {
      en: 'What surprised me most was how quiet the room had become.',
      zh: '最让我意外的，是房间变得多么安静。',     // optional but recommended
      note: '把"感到意外"这件事拉到主词位置，比 I was surprised by ... 更聚焦。',  // optional teaching note
    },
    ...
  ],
  commonMistake: '不要写成 "What we lost are now luxuries"...',  // optional callout
  vsSimilar: 'It-cleft 也用于强调，但...',                          // optional callout
}
```

## patterns

```ts
{
  id: 'pt1',
  useCase: '命名一个新现象，把它装进有节奏的开篇句',  // student-facing intent, NOT the abstract pattern
  skeleton: 'A new [X] has emerged around the simple act of [verb-ing].',  // the template
  original: 'A new tourism industry has emerged around the simple act of looking up.',  // article quote
  sentenceId: 's6',                            // the article sentence this pattern came from
  whyItWorks: [                                // multi-paragraph rhetorical analysis, 3-4 paragraphs
    'paragraph 1 ...',
    'paragraph 2 ...',
  ],
  examples: [                                  // 3-5 worked examples WITH context
    {
      context: '写一篇慢食运动的引言',
      text: 'A new dining culture has emerged around the simple act of cooking dinner from scratch.',
      zh: '围绕"从头做饭"这件简单的事，一种新的餐饮文化兴起了。',  // optional
    },
    ...
  ],
  adaptingTip: '用这个句式时，[X] 一定要选有重量感的词...',
  commonMistake: '...',                         // optional callout
}
```

## quiz

```ts
{
  id: 'q1',
  q: 'According to the article, ...',
  options: ['option A', 'option B', 'option C', 'option D'],  // exactly 4
  answer: 2,                                    // 0-indexed
  explanation: 'The article says ...',
  sentenceId: 's4',                             // optional; if set, "See evidence" button highlights this sentence
}
```

5 questions per article. Mix:
- 1-2 factual recall (who/what/when/where)
- 1-2 inference (why/implication)
- 1 attitude or tone (what is the author's stance)

## collocations

Currently rendered minimally on the front-end. Always include the field but you can leave it `[]` for v1. If you do populate it:

```ts
{
  id: 'c1',
  phrase: 'wash out',
  sentenceId: 's4',
  meaningZh: '冲淡、使褪色',
  example: '...',
  exampleZh: '...',
}
```

## File header

Every article file starts with:

```ts
// Brief one-line description of this article (no em-dashes).
import type { Article } from './types';

export const article: Article = {
  ...
};
```

The file should be a clean TypeScript module. No re-exports, no helpers — just the single `article` constant.

## Auto-discovery

When you write a new file at `src/data/english/<slug>.ts`, the front-end's [`src/data/english/index.ts`](../../../../src/data/english/index.ts) picks it up automatically via `import.meta.glob('./*.ts', { eager: true })`. **Do not edit `index.ts`** — it has no manual entries to add.

The slug **is** the file name (`2026-05-09.ts`) **and** the URL slug (`/tools/english/2026-05-09`) **and** `meta.date`. They must all match.
