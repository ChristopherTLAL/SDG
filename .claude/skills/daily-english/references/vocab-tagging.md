# Vocab tagging

After the article body is written, scan for 18-22 words that are worth a vocab card. The reader can filter "show me only words at Level X and harder", so you must rank words **by article-internal difficulty**, not by absolute frequency in some external corpus.

## How many words

| CEFR | Vocab count | Distribution |
|---|---|---|
| A2 | 12-16 | mostly Level 1, a few Level 2 |
| B1 | 16-20 | bulk Level 1-2, a couple Level 3 |
| B2 | 18-22 | spread across all 4 levels |
| C1 | 20-26 | bulk Level 3-4, a few Level 2 |
| C2 | 22-28 | bulk Level 4 with rare lexical items |

## How to assign Level 1-4

The level is **relative to this article**. Within a B2 piece, the easiest tagged words are Level 1; the hardest are Level 4. Within a C1 piece, the easiest tagged words are still Level 1, but those Level 1 words might individually be more advanced than the Level 4 of an A2 piece.

This sounds confusing but it works in practice because each article shows its own level chips with its own counts. The student picks "Level 2 and harder" within the article they're reading.

Rough internal difficulty heuristics:

- **Level 1**: a word the target-CEFR student probably knows but might want to confirm (`expensive`, `lending`, `community` in B1; `striking`, `preserves`, `inefficient` in B2)
- **Level 2**: high-frequency for native speakers, mid-difficulty for the target CEFR (`workshops`, `household` in B1; `unchecked`, `emerged`, `coordinated` in B2)
- **Level 3**: low-frequency, often Latinate or technical (`tricky`, `insurance` in B1; `designated`, `nocturnal`, `ecological` in B2)
- **Level 4**: rare, GRE-tier, technical, or culturally loaded (`stewardship`, `celestial`, `hatchlings` in B2; `obfuscate`, `paradoxical` in C1)

If you can't decide between two adjacent levels, lean lower (more accessible). The reader can always raise the floor.

## What kinds of words to pick

Good vocab choices:
- **High-utility low-frequency**: `disorientation`, `stewardship`, `volunteer` — words the student will actually use again in writing
- **Cultural / abstract nouns**: `heritage`, `irony`, `community`
- **Adjectives with shades**: `unchecked`, `coordinated`, `striking` — give the student a tonal vocabulary
- **Phrasal verbs**: `wear out`, `pick up`, `give up` — these are notoriously hard for Chinese learners and worth tagging
- **Adverbs that change tone**: `substantially`, `instinctively`, `steadily`
- **Words with non-obvious senses**: `store` (verb), `borrow` (vs. lend), `striking` (= remarkable, not = hitting)

Avoid:
- Proper nouns (cities, names, organizations)
- Numbers, dates
- Words that are spelled like Chinese loanwords or have transparent transliteration
- Function words (`the`, `however`)
- Words a learner could deduce from context with no card

## The exact `word` field

This is the most error-prone field. The front-end pre-renders `<span class="vocab">` by running `\b<word>\b` regex over each sentence's en text. **`word` must match the surface form exactly as it appears in the sentence.**

| Sentence has | `word` field | Result |
|---|---|---|
| "the library has been **lending** tools" | `lending` | ✅ wraps "lending" |
| "the library has been **lending** tools" | `lend` | ❌ never matches |
| "Tools **wear out** faster than books" | `wear out` | ✅ wraps "wear out" |
| "**Hatchlings** crawl..." | `hatchlings` | ✅ wraps "Hatchlings" (case-insensitive at boundary) |

Multi-word phrases are fine (`wear out`, `go beyond`). The front-end's regex handles them.

## The `lemma` field

`lemma` is the dictionary form. `word: 'lending'`, `lemma: 'lend'`. `word: 'hatchlings'`, `lemma: 'hatchling'`. `word: 'wear out'`, `lemma: 'wear out'` (phrasal verb has no separate citation form).

This field is currently used only as metadata (not surfaced in UI yet), but populate it correctly so future features (cross-article vocab review, dictionary lookup) work without rebackfilling.

## IPA

Use IPA, not pinyin or simplified phonetic. American or British, your choice — try to be consistent within an article. Standard symbols:

- /ʌ/ as in "but"
- /ə/ schwa (most unstressed vowels)
- /ɪ/ as in "bit"
- /iː/ long e
- /ɒ/ British "lot" (American often /ɑː/)
- /θ/ /ð/ "th" voiceless / voiced

If unsure, default to a Cambridge online dictionary lookup pronunciation. Don't invent phonemes.

## defZh — Chinese definition

Format: 1-3 short alternatives separated by Chinese semicolon `；`. Examples:

- `'不受控制的；未受抑制的'`
- `'转化；改造'`
- `'磨损；用坏'`
- `'监管；负责的看护'`

Don't write a full Chinese sentence as a definition. Don't list five synonyms. Two short alternatives is the sweet spot.

## defEn — English definition

One short clause, lowercase, no article, no period. The student is glancing at this; long defs are noise.

| Word | Good defEn | Bad defEn |
|---|---|---|
| unchecked | `not controlled or restrained` | `If something is unchecked, it means that it is allowed to happen without being stopped or controlled.` |
| celestial | `relating to the sky or outer space` | `Pertaining to or relating to the heavenly bodies.` |

## example + exampleZh

The example should be **fresh** — NOT the article sentence. Show the word in a different context so the student sees its range.

- Use a context that is plausible in everyday or news-adjacent writing
- 8-15 words long
- Make the word's meaning **inferable from context** (good examples teach without a definition)
- Provide the Chinese translation of the example

| Word | Article sentence (bad as example) | Fresh example (good) |
|---|---|---|
| unchecked | "decades of unchecked urban growth" | "Unchecked deforestation has accelerated species loss." |
| stewardship | "the appetite for this kind of stewardship" | "The trust prides itself on long-term stewardship of the land." |

## Self-check after tagging

- [ ] All words in `vocab` array appear (with `\b` boundaries) in their `sentenceId`'s `en` field
- [ ] All `level` values are integers in {1,2,3,4} — not strings, not 0, not 5
- [ ] No two vocab entries point to the exact same `(word, sentenceId)` combo
- [ ] IPA looks like IPA, not garbled
- [ ] Each example sentence is different from the article sentence
- [ ] Levels distributed across 1-4 (not all clumped at 2)
