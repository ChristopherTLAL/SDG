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

| Don't | Do |
|---|---|
| `What-cleft for emphasis` | `把焦点放在"东西"上，而不是"谁做的"` |
| `Em-dash insertion` | (don't write this lesson at all — em-dashes are forbidden) |
| `Reduced relative clause` | `把 "who/which is" 省掉，让句子更紧` |
| `Concessive Yet at sentence start` | `用 Yet 起句，比 But 更克制，更书面` |
| `Present perfect continuous` | `用现在完成进行时把"已经做了很久且还在做"说清楚` |
| `Causative let + bare infinitive` | `用 "let" 让句子说"让人做某事"` |

The technical name still appears as the `pattern` field (the schematic). The `title` is the headline; `pattern` is the small code block below it.

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
