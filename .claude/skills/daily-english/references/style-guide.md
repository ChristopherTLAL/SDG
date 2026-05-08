# Style guide

## The em-dash rule (non-negotiable)

The site owner has zero tolerance for em-dashes (`—` U+2014). They are forbidden in:
- Article body (en + zh)
- editorsNote
- All grammar fields: `title`, `pattern`, `explanationZh`, `examples[].en/zh/note`, `commonMistake`, `vsSimilar`
- All pattern fields: `useCase`, `skeleton`, `original`, `whyItWorks`, `examples[].context/text/zh`, `adaptingTip`, `commonMistake`
- Quiz questions, options, explanations
- File header comments

Hyphens (`-`) inside compound words like `dark-sky`, `red-tinted`, `tool-as-metaphor`, `4-day work week` are **fine**. They are different punctuation; they do not trigger the rule.

Chinese em-dash (`——` U+2014 × 2) is also forbidden. In Chinese text, use `，` (Chinese comma) or split into two sentences with `。` instead.

### How to rewrite an em-dash you're tempted to type

| Em-dash use | Replacement |
|---|---|
| Appositive insertion: `X — appositive — Y` | `X, appositive, Y` (commas) |
| Dramatic pause: `X — Y` | `X. Y` (split sentences) or `X, Y` (comma) |
| List intensifier: `X — and even Y` | `X, even Y` (drop em-dash, keep "even") |
| Compound joiner in Chinese: `让步—反驳结构` | `让步反驳结构` (no separator) |
| Aside in Chinese: `他来过——只待了五分钟` | `他来过，只待了五分钟` |
| Pull-quote setup: `She said it once — and I never forgot` | `She said it once, and I never forgot` |

The validator will reject any file containing `—` or `——`. Catch them yourself before you submit.

## Tone — editorial, not academic, not breezy

The article voice is **literate news magazine**. Think: BBC Future, The Atlantic, The Economist's color sections. Specifically:

- Sentences vary in length. A long descriptive sentence is followed by a short reflective one. Don't write entire paragraphs of medium-length sentences in monotone.
- Concrete > abstract. Mention places, numbers, names, sounds, materials. Avoid floating talk like "Many people today face challenges related to...".
- The author has a point of view but doesn't shout. Closing paragraphs often pivot from facts to a small reflection.
- No emojis. No exclamation marks. No "Welcome to..." / "In today's world..." openers.
- No SAT-prep stiffness either ("Furthermore..." / "Moreover...") — that signals fake essay.

## Tone — Chinese translations

The `zh` field is for **comprehension**, not literary translation. It should:

- Read like natural Chinese, not transliterated English ("根据最近的研究" not "根据研究最近的")
- Match register with the English (a casual sentence stays casual in Chinese)
- Preserve the **clause structure** when reasonable — students compare en + zh side by side and benefit from seeing how clauses map
- Use Chinese punctuation throughout (`，` `。` `「」` `（）`), not English `, . " ()`
- Numbers: keep numeric form for figures (`80 percent` → `80%`), spell out for small counts in narrative (`three speakers` → `三位讲者`)

## Learning-centered titles

Grammar `title` and Pattern `useCase` are **headlines a student reads**, not labels a linguist would assign. They should answer "what does this help me do?" rather than "what is this called?".

The shape of a good title:
- A verb phrase that names a writing move (`把焦点放在 X 上` / `用 X 让句子 Y` / `先 X，再 Y`)
- Anchored in a concrete decision the student would face (`什么时候用 X 比 Y 好`)
- Free of grammar terminology unless the term is already familiar (no "cleft", "reduced relative", "concessive")

The shape of a bad title:
- A linguistic label dropped in (`What-cleft for emphasis`, `Reduced relative clause`)
- A vague aspiration (`Better sentence structure`)
- A direct restatement of the pattern (`The "What X is Y" pattern`)

Write the title that, when a student sees it in the grammar tab, makes them think "oh, that's a real thing I want to learn how to do." The `pattern` field still exists for the technical schema (`What [clause] is/was [emphasis]`); the `title` is the human-facing headline.

**Important:** Do not use the same titles or formulations as appear in any other article in `src/data/english/`. Each article's grammar / pattern entries should be discovered from THAT article's actual writing — don't duplicate constructions that have already been taught at the same CEFR.

## When you're stuck

If you can't think of how to write the sentence without em-dashes, you're allowed to:
- Split into two short sentences (this often **improves** the prose).
- Restructure using "with", "by", "while", or a participial phrase.
- Use a colon instead of an em-dash if it introduces a list or expansion.
- Use parentheses for genuinely parenthetical asides.

You are NOT allowed to:
- Use the em-dash anyway and "we'll fix it later"
- Use a hyphen `-` in place of an em-dash (looks like a typo, also wrong)
- Use the en-dash `–` as a workaround (still a long dash, still rejected by the validator)
