# Article writing — CEFR-controlled prose

The article body is the core of the lesson. Get this right and the rest (vocab, grammar, patterns) follows naturally. Get it wrong and no amount of leveling fixes a flat read.

## Word count and reading time per CEFR

| CEFR | wordCount | readingMinutes | Sentence avg | Para count |
|---|---|---|---|---|
| A2 | 180-240 | 3 | 8-12 words | 4-5 |
| B1 | 250-320 | 4 | 10-15 words | 5-6 |
| B2 | 320-420 | 5 | 14-20 words | 6-7 |
| C1 | 380-480 | 6 | 18-25 words | 6-8 |
| C2 | 420-540 | 7 | 20-30 words | 6-8 |

These are guidelines, not bounds. If a B2 article reads better at 380 words, ship 380.

## Sourcing — multiple reports, one event

For each topic, the pipeline starts by gathering 3-5 different reports of the same news event. Use the topic's `searchTerms` (from `data/english-topics.json`) as starting queries. Browse for:

- Mainstream wire (Reuters, AP, BBC, Al Jazeera) — facts and dates
- A weekly / longform (The Atlantic, BBC Future, NYT, FT) — context and analysis
- A specialist outlet (Nature for science, Bloomberg for finance, Wired for tech) — domain depth
- Optional: a contrarian or non-Western source — for nuance

Read all of them. Take notes on:
- The key facts (numbers, names, dates, places)
- Why this is interesting (the human angle, the surprise, the irony)
- Disagreements between sources (these often make for the most interesting paragraph)

Then write **your own piece**. Do not paraphrase any single article. The output should read like a thoughtful editor wrote it after reading all the sources.

## Structure (CEFR-independent)

Most articles follow this rough shape:

1. **Hook (1-2 sentences)**: a vivid concrete fact or scene. Not a thesis. Not "In recent years...".
2. **Setup (1 paragraph)**: what is the news, what is the immediate context.
3. **Detail (1-2 paragraphs)**: numbers, names, the texture of the story.
4. **Wider lens (1 paragraph)**: why does this matter, who is affected.
5. **Tension or counterpoint (1 paragraph)**: the obstacle, the skeptics, the unfinished part.
6. **Reflection (1-2 sentences)**: a small turn that asks something of the reader. Often the most quotable line.

Don't follow this rigidly. Vary order. Skip a section if it adds nothing.

## CEFR-specific writing

### A2 (Elementary)

- Vocabulary: high-frequency, mostly Anglo-Saxon. Avoid Latinate ("utilize" → "use", "purchase" → "buy").
- Grammar: present + past simple, simple future. Avoid present perfect continuous, conditionals, passives.
- Sentences: short. One main idea per sentence. Subjects are nouns or pronouns, not gerund phrases.
- Concepts: explained, not assumed. ("A solar farm is a place that produces electricity from sunlight.")
- Tone: warm and clear. Like explaining to a neighbor.

### B1 (Lower-intermediate)

- Vocabulary: still mostly common words, but you can introduce some collocations and ~5-8 less-common words that get tagged for vocab study.
- Grammar: present perfect, simple conditionals, basic passives. Phrasal verbs are fair game (`wear out`, `give up`, `pick up`).
- Sentences: medium. Some compound sentences. Few subordinate clauses.
- Concepts: light context-setting okay. ("Tool libraries — places that lend tools the way regular libraries lend books — have spread to over 500 cities.") — wait, **no em-dashes**. Rewrite: "Tool libraries, places that lend tools the way regular libraries lend books, have spread to over 500 cities."
- Tone: friendly journalism. The B1 sample (`2026-05-08.ts`, tool libraries) is the canonical voice.

### B2 (Upper-intermediate)

- Vocabulary: this is where the leveled vocab system shines. 18-22 words tagged across Level 1-4. Include some abstract nouns (`stewardship`, `disorientation`), some adjectives with shades (`unchecked`, `coordinated`), some adverbs (`substantially`, `instinctively`).
- Grammar: full range. Reduced relative clauses, what-clefts, present perfect continuous, formal "Yet" at sentence start, careful punctuation rhythms.
- Sentences: vary. Long descriptive sentences mixed with short reflective ones. The B2 sample (`2026-05-07.ts`, dark sky tourism) is the model.
- Concepts: assume some general knowledge. Don't define common terms.
- Tone: literate news magazine. Capable of irony, restraint, a closing line that lingers.

### C1 (Advanced)

- Vocabulary: low-frequency Latinate, scientific terms in context, occasional GRE-tier (`venerable`, `preposterous`, `imminent`, `paradoxical`).
- Grammar: nominalizations, fronting for emphasis, complex coordination, relative clauses with quantifier-pronouns ("none of which..."), formal subjunctive.
- Sentences: routinely 25+ words. Multiple subordinate clauses. Parenthetical restrictions.
- Concepts: assume the reader is intellectually engaged. Drop in references the reader will Google.
- Tone: New Yorker / FT longform. Confident, measured, dryly ironic at times.

### C2 (Mastery)

- Use sparingly. Most learners don't need C2; this level is for showing what real native register reads like.
- Allow rare words, deliberate stylistic choices, ambiguity that requires re-reading.
- Sentences can be very long (30+ words) if the structure earns it.

## Sentence ID assignment

After writing, segment into clickable units. Each unit gets a global ID `s1`, `s2`, ..., `sN`. Each clickable unit can contain MORE than one grammatical sentence if they form a tight rhetorical unit (see B1 sample, `s22`: "A book is a kind of tool. And a tool, in its own way, can teach." — two grammatical sentences, one clickable unit, because they form a single bicolon).

Default rule: one grammatical sentence per ID. Only merge two sentences when:
- They are very short
- They form a single rhetorical move (parallel structure, reversal, set-up + punchline)
- Splitting them would harm the lesson on patterns or grammar

## Chinese translation

Each sentence id has a `zh`. Translate **for comprehension**, not for literary effect. The student is reading the en, learning, and glancing at zh to confirm understanding. So:
- One zh sentence per en sentence (or per merged unit, if the en is merged)
- Match the **clause structure** when reasonable so students can map "this clause in en = this clause in zh"
- Use Chinese punctuation throughout
- Don't paraphrase or "improve" — translate what's there

## Self-check before handing off

Before you finalize the article body, verify:

- [ ] Word count within CEFR range (count the en text, excluding title)
- [ ] No em-dashes (`—` `——`) anywhere
- [ ] Every sentence has both `en` and `zh`
- [ ] Chinese reads naturally, not like a transliteration
- [ ] Article ends on a quotable line, not on a list of facts
