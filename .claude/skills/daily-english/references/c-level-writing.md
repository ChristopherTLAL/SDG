# C1-C2 Book Brief (OVERRIDES the B-level references)

This file is the authoritative spec for **C1-C2 "ideas" books**. Where it
conflicts with article-writing.md / grammar-design.md / pattern-design.md /
listening-writing.md (all written for A2-B2 news rewrites), **this file wins**.
The TypeScript contract in schema.md + types.ts is unchanged; only the CONTENT
register changes. Read this in full before writing a C-level chapter.

## The one-sentence thesis

A C-level chapter is **a self-contained intellectual essay that makes a real
argument**, in the register of Aeon / The Atlantic "Ideas" / the London Review
of Books — and the learning apparatus teaches the reader to *read an argument*,
not retrieve a fact.

This is NOT "a harder news rewrite." There is no event to report. There is an
idea to think through.

## 1. The essay (paragraphs)

- **Length: 450-600 words** (vs 280-380 at B-level). 6-9 paragraphs.
- **Idea-driven, not event-driven.** Open on a puzzle, a tension, a claim worth
  contesting, or a vivid concrete case that opens onto the concept. A current
  hook (a recent debate, an experiment, a book) is a fine *way in*, but the
  subject is the IDEA, not the news.
- **It must contain a genuine argument**, because the quiz and writing task will
  probe it. The shape, loosely:
  1. set up the question / stake a claim
  2. develop it with reasoning, an example, an authority, or a thought experiment
  3. raise the strongest objection honestly (the concession)
  4. answer it, qualify it, or hold the tension open
  5. close on what follows — the "so what," the larger horizon
- **Register: sophisticated but lucid.** Long sentences with controlled
  subordination; abstraction handled with precision; the occasional concrete
  image to anchor the abstraction. Never wilfully obscure, never padded. Read
  your draft aloud — if a sentence cannot be followed on one hearing, recast it.
- **Name names.** Refer to real thinkers, experiments, books, schools of thought
  (Kahneman, the Chinese Room, Rawls's veil, the replication crisis). Accuracy
  matters — verify with WebSearch. But this is an essay, not a literature
  review: cite to think, not to pad.
- **Stand-alone.** No "in the previous chapter," no "next time."
- Each sentence still needs its `zh` — and at this level the Chinese must be
  **precise, written, academic Chinese**, not casual. It is a real translation a
  graduate student would respect.

## 2. Vocabulary (18-22 entries)

- The hard words of academic prose: AWL + sophisticated general vocabulary.
  Examples of the target band: *salient, contingent, tenuous, ramification,
  ostensibly, intractable, parsimonious, adjudicate, subsume, reify, provisional,
  underdetermined, vindicate, latent, constitutive, subtle, recalcitrant.*
- **Teach register and polysemy, not just meaning.** When a common word carries
  an academic sense, that IS the entry: *entertain* (a hypothesis), *a body of*
  (work), *want for* (nothing), *beg the question*, *on the order of*, *to a
  first approximation*. The `defEn` should name the academic sense; `defZh`
  should be exact.
- Levels 1-4 are recalibrated UP: a C-level "Level 1" is roughly B2; "Level 4"
  is genuinely GRE/postgraduate. Still cover all four, still >=2 at Level 1
  (so there is some scaffolding) and >=2 at Level 4.
- `example` sentences must themselves be in academic register.
- `vocab.word` must still match its sentence under `\bword\b` (validator).

## 3. "Grammar" field -> Advanced structures (3 entries)

At this level grammar is mastered; what is taught is **the syntax of
sophisticated writing**. Each entry takes ONE such resource and shows, on the
article's own sentences, how it creates density, focus, or stance. Choose from:

- **Nominalization / grammatical metaphor** — turning processes into things to
  raise abstraction and pack information ("the erosion of trust", "this
  conflation").
- **Cleft & pseudo-cleft** for focus ("What the experiment shows is...", "It is
  precisely here that...").
- **Fronting & inversion** for emphasis and cohesion ("Central to this view is...",
  "Nowhere is this clearer than...").
- **Hedging & epistemic modality** — the calibrated stance of scholarship ("it
  would seem", "arguably", "on this reading", "tends to", "if anything").
- **Concessive subordination** ("granted that", "even if", "for all its X").
- **Heavy noun phrases / participle clauses** for economy.
- **The subjunctive / counterfactual** ("were we to accept", "had Kuhn been
  right").

`title` = a learning-centred headline in Chinese (NOT jargon); `pattern` = the
schematic; `explanationZh` = multi-paragraph, explaining WHY the structure does
what it does and when to reach for it; 4-6 worked examples; `commonMistake` +
`vsSimilar` where useful. This is where model quality matters most — make it
genuinely illuminating, not a textbook restatement.

## 4. "Patterns" field -> Rhetorical moves (3 entries)

The argumentative moves of good essayistic and academic writing — exactly what a
personal statement, SOP, or university essay needs:

- **Concession-rebuttal**: "While it is true that X, this overlooks Y."
- **Definition + problematization**: "What we call X is in fact Y," / "The very
  notion of X assumes..."
- **Hedged assertion**: "It would not be unreasonable to suppose that..."
- **Analogy as argument**: "To say X is rather like saying Y."
- **Steel-man then turn**: state the opponent's best case, then pivot.
- **The qualified generalization**: "As a rule, though not without exception..."
- **The reframing "not...but"**: "The question is not whether X, but how."

`useCase` = student-facing intent in Chinese; `skeleton` = abstract template;
`original` = the article sentence (byte-exact); `whyItWorks` = multi-paragraph
rhetorical analysis; 3-5 worked examples each with a `context`; `adaptingTip`.

## 5. Quiz (5) — argument, not recall

**No fact-retrieval. None.** Every item is GRE/LSAT reading-comprehension
register:

- central-claim identification ("Which best states the author's main thesis?")
- inference ("The author would most likely agree that...")
- the function of a part ("The thought experiment in paragraph 3 serves chiefly
  to...")
- the unstated assumption a claim rests on
- author stance / tone ("The author's attitude toward X is best described as...")

Distractors must be *plausible* — close misreadings, over-generalizations, or
half-truths, not obvious throwaways. `explanation` says why the key is right AND
why the trap is tempting. Bind to a `sentenceId` where apt.

## 6. listeningWriting -> Listen, reconstruct, respond

The 听·析·写 flow, recast:

- **infoGap** = an **argument map**, not a fact table. Cues (in Chinese) ask the
  learner to reconstruct the reasoning: the central thesis; the strongest
  objection considered; the concession granted; the key example and what it
  shows; the conclusion / what follows. `answer` is still an English phrase
  extractable from the passage, still bound to a `sentenceId`. 6-8 rows, one
  prefilled as a worked example.
- **writing** = an **analytical / argumentative paragraph**, 100-150 words (up
  from 60-80). E.g. "Do you find the author's argument persuasive? Take a
  position, give one reason, and meet one objection." Must reuse `usePatternIds`
  = TWO of this chapter's rhetorical moves. Provide 2 `starters`. `modelAnswer`
  (110-150 words) must itself model academic register and deploy the named
  moves; `modelAnswerZh` precise.

## 7. Narration register (book.ts tts)

Keep `voice: 'coral'`. Change `instructions` to the essayistic register:
"Read as a thoughtful essayist narrating a serious idea to an educated listener:
measured, articulate, unhurried, with the cadence of a fine audio essay. Let long
sentences breathe; lift slightly at the turns of the argument; never rushed,
never flat. Clean, neutral accent."

## Hard rules (carried over, still enforced)

1. **No em-dashes** anywhere (— or ——). Use commas, colons, parentheses, periods,
   or recast. The site owner does not like them.
2. **No straight `"..."` inside single-quoted TS strings** — escaping inner
   quotes is fine, but prefer 「...」/ '...' for quoted phrases inside zh, and
   verify the file parses (esbuild) before declaring done.
3. Vocab levels numeric 1-4; `vocab.word` matches its sentence via `\bword\b`.
4. CEFR field is `'C1'` or `'C2'` and must match the assignment.

## The bar

Hold each chapter against this: *would this essay be at home, lightly edited, in
Aeon? Would a Hong Kong / Oxbridge admissions tutor recognise it as the kind of
prose their applicants must read and write?* If not, it is not done.
