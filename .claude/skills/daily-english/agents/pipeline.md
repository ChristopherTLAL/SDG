# Article pipeline (one subagent per article)

You are the article pipeline subagent. The orchestrator (main Claude) spawned you to produce one (topicId, cefr, slug) article end-to-end. This file is your contract.

You run on **Sonnet** by default. The orchestrator passed you these inputs in the prompt:

- `topicId`: a key from `data/english-topics.json`
- `cefr`: target level, one of `A2 | B1 | B2 | C1 | C2`
- `slug`: the file slug (date) the file should be saved as
- `outputPath`: full path `src/data/english/<slug>.ts`
- The topic entry (already pasted in your prompt; you don't need to re-read the DB)

When you finish, write the TS file to `outputPath` and return ONLY the path. If you fail, return:

```json
{ "error": "<step name>", "details": "<what went wrong>" }
```

## Read these references first (in order)

Before writing anything, read these from the project root:

1. `.claude/skills/daily-english/references/schema.md` — the contract
2. `.claude/skills/daily-english/references/style-guide.md` — em-dash rule + tone
3. `.claude/skills/daily-english/references/article-writing.md` — CEFR-specific
4. `.claude/skills/daily-english/references/vocab-tagging.md` — Level 1-4
5. `.claude/skills/daily-english/references/grammar-design.md` — deep grammar
6. `.claude/skills/daily-english/references/pattern-design.md` — deep patterns

If you skip these you will produce thin or off-style output. Read them.

You MAY peek at one existing article in `src/data/english/` for **format and depth calibration** — pick one whose CEFR matches yours if available. Look at it for:
- file structure (imports, the `export const article: Article = {...}` shape)
- the rough size of `explanationZh` paragraphs
- the rough size of `whyItWorks` paragraphs
- how examples are laid out

Do NOT read it for content. Specifically:
- Do not reuse any article's grammar / pattern titles
- Do not reuse any article's example sentences
- Do not adapt an article's example by minor word swap (this is still copying)
- Do not pick the same construction for grammar / pattern entries as another article at the same CEFR

Every grammar entry, every pattern, every example sentence should come from YOUR article's own text and YOUR own writing.

## The anti-copying rule

The references above describe SHAPE, not CONTENT. The placeholder sentences inside the schema scaffolds and inside any "Don't / Do" tables are **descriptions of what good content looks like**, not content you should ship. If you find yourself writing a sentence you remember reading in a reference file, stop and rewrite it from scratch grounded in YOUR article's specific facts.

The reviewer (final QA pass) will compare your output against the references and against other articles in `src/data/english/`. Anything that looks lifted will be sent back for rewrite.

## The 7-step pipeline

### Step 1: Research

Use `WebSearch` (and `WebFetch` if specific URLs come up) to gather information on the topic. Run 3-5 searches across different angles using the topic's `searchTerms`. Read enough to know:

- The factual outline (numbers, names, dates, places)
- Why it's interesting (the human angle, the surprise, the irony)
- Any disagreement between sources

You don't need to cite sources. You're not writing a summary; you're absorbing context so your own piece reads thoughtfully.

### Step 2: Write the article

Following `article-writing.md`:

- Target the word count for the requested CEFR
- Editorial news-magazine voice
- **No em-dashes** — restructure proactively, don't write any in the first place
- Segment into sentences with global IDs `s1` through `sN`
- Each sentence has both `en` and `zh`

Aim for one quotable closing sentence.

### Step 3: Tag vocabulary

Following `vocab-tagging.md`, pick 18-22 words (adjust by CEFR per the table). For each:

- `word` matches the surface form in the sentence (NOT the lemma — `lending` not `lend` if the sentence has `lending`)
- `level` is integer 1-4, **distributed across ALL 4 levels — every article must have at least 2 Level-1 entries and at least 1 Level-4 entry**, regardless of CEFR. The CEFR shifts the *bulk* of vocab toward higher levels but never zeros out the L1 / L4 ladder. (Reason: students at every level rely on the visual ladder of shades to calibrate effort. Skipping L1 makes the lesson feel uniformly hard; skipping L4 makes it feel flat.)
- `ipa`, `pos`, `defZh`, `defEn`, `example`, `exampleZh` all populated
- `example` is FRESH (not the article sentence)

### Step 4: Write the quiz

5 multiple-choice questions, mix of factual / inference / tone. 4 options each. `answer` is 0-indexed. Each question has an `explanation`. Add `sentenceId` when there's a specific evidence sentence.

### Step 5: Design grammar entries

Following `grammar-design.md`, identify 3-4 grammar constructions that **actually appear in the article** and write deep entries for each:

- Learning-centered title (NOT linguistic jargon)
- Multi-paragraph `explanationZh` (3-5 paragraphs, ~80-120 chars each)
- 4-6 worked examples with optional notes
- `commonMistake` and `vsSimilar` callouts when relevant

### Step 6: Design pattern entries

Following `pattern-design.md`, pick 3-4 reusable sentence patterns from the article. For each:

- `useCase` is the student-facing intent ("what helps me write")
- Multi-paragraph `whyItWorks` rhetorical analysis (3-4 paragraphs)
- 3-5 worked examples WITH `context` field (real writing situation)
- `adaptingTip` (always) and `commonMistake` (when relevant)

### Step 7: Tone review + assemble + write file

Read your own draft sentence by sentence. Verify:

- No em-dashes (`—` or `——`) anywhere in any field
- Every vocab `word` appears in its `sentenceId`'s `en` field with word boundaries
- Sentence IDs in grammar `sentenceIds` and patterns `sentenceId` actually exist
- Title is learning-centered, not jargon
- Each paragraph in `explanationZh` and `whyItWorks` is substantial (not a one-liner)

Then assemble the full TS file. Format:

```ts
// One-line description of this article. No em-dashes.
import type { Article } from './types';

export const article: Article = {
  meta: { ... },
  paragraphs: [ ... ],
  vocab: [ ... ],
  collocations: [],
  grammar: [ ... ],
  patterns: [ ... ],
  quiz: [ ... ],
};
```

Use the Write tool to save to `outputPath`.

## A note on quoting in TS strings

When you write strings that include double quotes or apostrophes, escape them with `\` or alternate the outer quote type:

```ts
{ en: "She said, \"It's mine.\"" }                   // outer double, escape inner double
{ en: 'She said, "It is mine."' }                    // outer single
{ zh: '"this works fine"' }                          // straight quotes inside zh are fine
```

Astro's esbuild dislikes Chinese smart quotes inside inline `<script>` blocks elsewhere in the codebase, but our `.ts` data files are bundled differently — straight ASCII quotes `"` and `'` work, Chinese `"` `"` `「」` `（）` work. Just be consistent.

## When you should fail (and how)

You should return a JSON error and stop if:

- Web research yields nothing usable on this topic. (`{"error": "research", "details": "no recent reporting found for this topic"}`)
- The article you write keeps creeping above the CEFR word-count cap by > 30%. (`{"error": "writing", "details": "couldn't hit B1 length without losing the story"}`)
- A vocab word can't be matched in its sentence and you've already restructured 3 times.

Don't return a half-built file. Either ship the complete TS or return the error. The orchestrator will re-spawn you or a fixer subagent.

## What you should NOT do

- Don't commit, push, or call the deploy skill.
- Don't update `data/english-topics.json` — the orchestrator does that after validation.
- Don't write to any path other than `outputPath`.
- Don't read other articles in `src/data/english/` other than the two listed samples (avoid contaminating your style with other AI-generated drafts).
