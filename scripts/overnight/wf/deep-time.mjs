// english-book-pipeline (dynamic Workflow)
//
// Generates English-learning BOOK chapters as drop-in `Article` .ts files for the
// /tools/english/books reader. One agent per chapter: research -> write -> tag
// vocab -> design grammar + patterns -> quiz -> self-validate -> write the .ts.
//
// Why a Workflow and not an Agent-tool fan-out (the old way):
//   - RESUME: a network drop only costs the one in-flight chapter. Relaunch with
//     Workflow({scriptPath, resumeFromRunId}) and every finished chapter returns
//     from cache instantly; only the dead one re-runs.
//   - A dead agent resolves to `null`, it does NOT kill the run. The other
//     chapters keep going; you resume to fill the gaps.
//   - Each agent self-validates via validate.py, so almost nothing bounces back
//     to the orchestrator.
//
// HOW TO RUN: read references/workflow-mode.md. Replace the DATA BLOCK below
// (inline the chapters; do NOT rely on `args` -- it is unreliable in this env),
// then call Workflow({script: <this file's contents>}). Iterate by editing the
// persisted scriptPath the tool returns and re-invoking Workflow({scriptPath}).

export const meta = {
  name: 'english-book-pipeline',
  description: 'Generate English-learning book chapters as drop-in Article .ts files; resumable under flaky networks',
  phases: [
    { title: 'Generate', detail: 'one agent per chapter: research, write, tag vocab, design grammar+patterns, quiz, self-validate via validate.py, write the .ts file' },
    { title: 'Fact-check', detail: 'a second agent verifies the hard facts in each chapter via WebSearch and surgically corrects verifiable errors, then re-validates' },
  ],
};

// ===========================================================================
// DATA BLOCK -- REPLACE PER RUN. Inline everything; do NOT use `args`.
// (Currently: Jay Chou ch.5-18, the full remaining batch on Sonnet + fact-check.)
// ===========================================================================
// >>>OVERNIGHT-DATA-START
const BOOK = {
  id: "deep-time",
  cefr: "C1",
  register: 'c-level',
  noListening: true,
  modelFile: "src/data/english/books/mind-and-machine/01-hard-problem.ts",
  agentModel: 'sonnet',
};

const CHAPTERS = [
  {
    order: 1,
    slug: "01-scale-of-time",
    title: "The Scale We Cannot Feel",
    angleZh: "人类大脑进化于数十万年的尺度，却要面对四十亿年的地球史。本文探讨为何我们的直觉对「深时」根本失效，以及这种认知局限的伦理后果。",
    angleEn: "Our intuitions were shaped by evolutionary timescales far too short to make deep time visceral. This essay examines why geological time defeats ordinary cognition and what that failure demands of us ethically.",
    searchTerms: ["John McPhee deep time basin and range","Stephen Jay Gould time's arrow time's cycle","cognitive scope insensitivity Paul Slovic"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with nominalization, and lead your patterns with define-then-problematize. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 2,
    slug: "02-fermi-silence",
    title: "Why the Sky Is Silent",
    angleZh: "费米悖论：若银河中文明理应比比皆是，为何我们一无所闻？本文梳理大过滤器假说，并追问沉默究竟是好消息还是噩兆。",
    angleEn: "The Fermi paradox holds that a galaxy teeming with life should long since have announced itself. This essay examines the Great Filter hypothesis and asks what the silence most plausibly means for our own future.",
    searchTerms: ["Robin Hanson great filter","Nick Bostrom are you living in a simulation","Enrico Fermi paradox SETI"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with it-cleft for focus, and lead your patterns with concession-then-rebuttal. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 3,
    slug: "03-longtermism",
    title: "The Weight of the Unborn",
    angleZh: "功利主义计算表明，潜在的未来人口数量远超所有曾存在的人，这是否意味着我们对尚未出生者负有压倒一切的道德义务？",
    angleEn: "If the future is astronomically large, the potential people who might exist vastly outnumber all who have ever lived. This essay scrutinises longtermism's central claim and the counterarguments that strain it.",
    searchTerms: ["William MacAskill what we owe the future","Derek Parfit reasons and persons repugnant conclusion","emile torres longtermism critique"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with conditional reasoning with were-to and subjunctive, and lead your patterns with steel-man-then-turn. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 4,
    slug: "04-anthropocene",
    title: "The Age We Named After Ourselves",
    angleZh: "「人类世」这一地质学概念的诞生，不仅是科学上的命名，更是一种道德陈述：它宣告人类已成为地球的地质营力。这个词背后隐藏着怎样的预设？",
    angleEn: "Naming a geological epoch after ourselves is not merely a scientific act but a moral one. This essay asks what the Anthropocene concept reveals and conceals about humanity's relationship to deep time.",
    searchTerms: ["Paul Crutzen anthropocene coinage","Dipesh Chakrabarty climate history and human history","Jan Zalasiewicz anthropocene working group"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with wh-cleft for argument structure, and lead your patterns with reframing not-X-but-Y. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 5,
    slug: "05-extinction-risk",
    title: "The Asymmetry of Catastrophe",
    angleZh: "存在性风险（人类灭绝或永久衰退）在道德上是否比其他风险拥有完全不同量级的分量？本文考察这种「不对称性」论证的力量与弱点。",
    angleEn: "An existential risk is unlike ordinary risks not merely in scale but in kind, because it forecloses all future value. This essay tests the asymmetry argument and asks whether it can bear the policy weight placed upon it.",
    searchTerms: ["Nick Bostrom superintelligence existential risk","Toby Ord the precipice existential risk","Samuel Scheffler death and the afterlife"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with hedging and epistemic modality, and lead your patterns with analogy-as-argument. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 6,
    slug: "06-deep-history",
    title: "Before We Were Human",
    angleZh: "现代智人仅占地球生命史极短的一段。深历史研究正在改写我们对「人类本性」的理解：当视野延伸至二十万年前，何谓文化、何谓本性的边界开始模糊。",
    angleEn: "Deep history extends the frame of the human past from recorded civilisation back two hundred millennia, dissolving the boundary between nature and culture. This essay asks what that longer view changes about self-understanding.",
    searchTerms: ["David Christian big history","Daniel Lord Smail deep history and the brain","E.O. Wilson sociobiology human origins"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with fronting and inversion for cohesion, and lead your patterns with thought-experiment setup. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 7,
    slug: "07-geological-records",
    title: "Reading the Stone Archive",
    angleZh: "地层是地球的档案，每一层沉积都封存着消失已久的气候与生态。地质学家如何从岩石中读出数百万年前的故事，而这些故事对今天意味着什么？",
    angleEn: "Stratigraphy is the art of reading time from layered rock, and geologists use it to recover climates, extinctions, and ecosystems that vanished long before any witness. This essay traces what the archive reveals and what it warns.",
    searchTerms: ["Peter Ward and Joe Kirschvink a new history of life","Richard Fortey life a natural history of the first four billion years","ice core paleoclimatology Vostok"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with participial clauses for economy, and lead your patterns with reported-evidence framing. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 8,
    slug: "08-mass-extinction",
    title: "When Life Nearly Ended",
    angleZh: "地球曾经历五次大灭绝，最惨烈的那次消灭了超过九成的物种。当我们意识到自己或许正在引发第六次，这段历史对我们的现在有何道德意义？",
    angleEn: "The five mass extinctions on record reshaped the biosphere each time they struck, opening ecological vacuums that new lineages flooded. This essay asks what the sixth extinction we appear to be causing differs from its predecessors.",
    searchTerms: ["Elizabeth Kolbert the sixth extinction","Peter Ward under a green sky","end-Permian mass extinction causes"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with concessive subordination, and lead your patterns with qualified generalization. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 9,
    slug: "09-pale-blue-dot",
    title: "One Pixel of Light",
    angleZh: "1990年旅行者一号拍摄的「暗淡蓝点」照片，是科学与伦理的交汇：卡尔·萨根由此推导出一套宇宙视角的道德论证。这个论证成立吗？",
    angleEn: "Carl Sagan argued that seeing Earth as a pale blue dot in the vastness of space should prompt both humility and solidarity. This essay weighs whether a cosmological perspective can ground moral conclusions or merely evoke sentiment.",
    searchTerms: ["Carl Sagan pale blue dot 1994","Thomas Nagel view from nowhere","overview effect astronaut cognition"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with apposition for precision, and lead your patterns with hedged assertion. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 10,
    slug: "10-discounting-future",
    title: "The Ethics of Discounting",
    angleZh: "经济学常规做法是把未来的利益折现，认为远期成本与眼前成本不具同等分量。但在气候变化与代际伦理的语境下，这种折现究竟是理性还是偏见？",
    angleEn: "Economists routinely discount future benefits, treating time preference as rational. But when the future in question stretches centuries, discounting becomes a moral stance, not merely a technical one. This essay interrogates that sleight of hand.",
    searchTerms: ["Nicholas Stern stern review social discount rate","Frank Ramsey discount rate ethics","Partha Dasgupta valuing the future"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with colon-expansion for elaboration, and lead your patterns with concession-then-rebuttal (pragmatic framing). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 11,
    slug: "11-deep-futures",
    title: "What Remains After Us",
    angleZh: "若人类文明维持足够长的时间，我们留下的痕迹将进入地质记录；若文明崩溃，我们留下的又将是什么？本文思考深度未来视角如何改变对持续性与遗产的理解。",
    angleEn: "On a million-year horizon, our cities become fossils and our plastics become strata. This essay thinks through what a genuinely deep-futures perspective implies for how we build, produce, and value endurance.",
    searchTerms: ["Alan Weisman the world without us","Jan Zalasiewicz the earth after us","longevity civilization Seed magazine"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with parallelism and tricolon, and lead your patterns with concession-rebuttal (distinct framing: objection from pragmatism). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 12,
    slug: "12-nuclear-waste",
    title: "A Warning That Must Outlast Language",
    angleZh: "核废料需要被隔离长达十万年，远超任何现存文明或语言的寿命。如何向未来的人发出警告，成为一个前所未有的跨代际沟通难题。",
    angleEn: "Spent nuclear fuel must remain isolated for a hundred thousand years, longer than any language or civilisation has so far lasted. How to warn future humans who may not share our symbols is a genuine problem in deep-time communication.",
    searchTerms: ["WIPP nuclear warning messages 10000 years","Bastide long-term nuclear waste warning","semiotics of danger deep time"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with heavy noun phrase subjects, and lead your patterns with thought-experiment setup (distinct: impossibility scenario). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 13,
    slug: "13-climate-history",
    title: "The Climate the Ice Remembers",
    angleZh: "冰芯记录封存了过去八十万年的大气成分，使我们能将工业革命以来的气候变化置于深时坐标系中。这种历史对比揭示了什么，又可能遮蔽什么？",
    angleEn: "Ice-core data gives us an eight-hundred-thousand-year record of atmospheric composition, placing current warming in a deep-time frame. This essay examines what that longer context clarifies and what risks it might, perversely, obscure.",
    searchTerms: ["ice core climate record EPICA dome C","Michael Mann hockey stick temperature record","climate sensitivity paleoclimate constraints"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with relative clause stacking for density, and lead your patterns with reported-evidence framing (distinct: concessive evidence). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 14,
    slug: "14-cosmic-calendar",
    title: "Compressing the Cosmos",
    angleZh: "萨根的「宇宙日历」将138亿年压缩为一年：人类文明仅出现在最后几秒。本文探讨这类思维实验如何改变道德直觉，以及它们的局限在哪里。",
    angleEn: "Sagan's cosmic calendar compresses 13.8 billion years into a single year, placing all of human history in the final eleven seconds. This essay asks whether such mental compression genuinely reorders moral priorities or only produces momentary vertigo.",
    searchTerms: ["Carl Sagan cosmos cosmic calendar","Kees Boeke cosmic view powers of ten","scale cognition perspective psychological distance"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with it-cleft variation with pseudo-cleft what-clause, and lead your patterns with analogy-as-argument (distinct: scale analogy). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 15,
    slug: "15-longevity-civilization",
    title: "What It Would Take to Last",
    angleZh: "没有任何文明维持了超过数千年。若我们希望人类文明延续数万年乃至数百万年，需要做哪些根本性的制度或生态改变？",
    angleEn: "No civilisation on record has lasted more than a few thousand years. This essay investigates what structural changes would be necessary for a civilisation to persist on genuinely deep-time scales and whether that aspiration is coherent.",
    searchTerms: ["long now foundation Stewart Brand clock of the long now","Joseph Tainter collapse of complex societies","civilizational longevity scenarios existential risk literature"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with conditional reasoning with hypothetical inversion, and lead your patterns with define-then-problematize (distinct word: longevity versus persistence). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 16,
    slug: "16-rights-of-future",
    title: "Can the Unborn Hold Rights?",
    angleZh: "法律上权利通常属于现有存在者。但若气候政策的主要受益者尚未出生，我们能否赋予他们可主张的权利？这一哲学难题的边界在哪里？",
    angleEn: "Legal systems typically vest rights in existing persons. But if our most consequential decisions affect people who do not yet exist, the question of whether future people can hold rights becomes more than academic. This essay maps the difficulty.",
    searchTerms: ["Edith Brown Weiss in fairness to future generations","Joel Feinberg rights of future generations","constitutions and future generations environmental law"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with fronting of abstract subject with inversion (distinct: evaluative fronting), and lead your patterns with qualified generalization (distinct: legal-then-ethical register shift). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 17,
    slug: "17-contingency-life",
    title: "The Accident of Intelligence",
    angleZh: "复杂生命、乃至智慧生命的出现，在进化史上可能是极度偶然的。如果时间倒转重来，同样的故事几乎不可能重演。这一偶然性对我们看待自身有何影响？",
    angleEn: "Evolutionary biologists debate whether intelligence was an inevitable outcome of natural selection or a highly improbable accident. This essay examines the contingency thesis and what it implies for our sense of place in deep time.",
    searchTerms: ["Stephen Jay Gould wonderful life burgess shale contingency","Simon Conway Morris life's solution inevitable convergence","Sean Carroll big picture evolution purpose"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with nominalization of process for abstract predication (distinct: chain of nominalizations), and lead your patterns with steel-man-then-turn (distinct: turn on shared premise). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 18,
    slug: "18-reckoning",
    title: "Living in the Gap",
    angleZh: "我们是生命史上第一个能够反思自身在深时中位置的物种，也是第一个有能力塑造地球长期未来的物种。这两种身份如何塑造了一种新的人类责任？",
    angleEn: "We are the first species capable of knowing its own place in deep time and the first capable of altering Earth's long-term trajectory. This essay asks what it means to hold both capacities at once and what kind of responsibility that generates.",
    searchTerms: ["Hans Jonas the imperative of responsibility","Timothy Morton hyperobjects ecology","Amia Srinivasan ethics of the far future"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with parallel syntax across clauses with anaphoric cohesion, and lead your patterns with concessive subordination leading to affirmation. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
];
// >>>OVERNIGHT-DATA-END
// ===========================================================================

// Light, flat report schema (scalars + one string array). Deliberately NOT the
// heavy nested Article shape -- nested-array StructuredOutput tends to fail.
const REPORT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['order', 'slug', 'outputPath', 'ok', 'errors'],
  properties: {
    order: { type: 'integer' },
    slug: { type: 'string' },
    title: { type: 'string' },
    outputPath: { type: 'string' },
    ok: { type: 'boolean', description: 'true ONLY if validate.py finally printed {"ok": true}' },
    alreadyDone: { type: 'boolean', description: 'true if the chapter was already committed in git and was skipped (no regeneration)' },
    wordCount: { type: 'integer' },
    sentenceCount: { type: 'integer' },
    vocabCount: { type: 'integer' },
    validatorOutput: { type: 'string', description: 'the raw JSON line validate.py printed on the final attempt' },
    errors: { type: 'array', items: { type: 'string' }, description: 'unresolved problems; [] when ok' },
  },
};

function chapterPrompt(book, ch) {
  const registerRef = book.register === 'c-level'
    ? '.claude/skills/daily-english/references/c-level-writing.md'
    : '.claude/skills/daily-english/references/article-writing.md';
  const listeningClause = book.noListening
    ? 'This book has NO audio and NO listening apparatus. Do NOT add a listeningWriting field and do NOT set meta.audioUrl. End the object after quiz (with collocations: []).'
    : 'After the 7 steps add a listeningWriting field per references/listening-writing.md. Leave meta.audioUrl absent (the TTS script fills it later).';
  const outPath = 'src/data/english/books/' + book.id + '/' + ch.slug + '.ts';
  return [
    'You are ONE chapter of an English-learning book for the /tools/english/books reader. Working directory: /Users/shijie/Code/sdg-html',
    '',
    'IDEMPOTENCY (check FIRST): run `git ls-files --error-unmatch ' + outPath + '` via Bash. If it succeeds (exit 0, the file is already committed), this chapter is fully done. Return immediately with ok:true and alreadyDone:true (fill stats from the file if cheap, else 0), and do NO other work. Only if that command FAILS (file untracked or missing) do you proceed to generate below.',
    '',
    'Produce EXACTLY ONE chapter as a drop-in TypeScript Article file, then self-validate it. Your final answer is a StructuredOutput report (schema-enforced), NOT prose. The orchestrator sets your model; ignore any note in pipeline.md about which model you run on.',
    '',
    'CHAPTER',
    '  book id:    ' + book.id,
    '  cefr:       ' + book.cefr,
    '  order:      ' + ch.order,
    '  slug:       ' + ch.slug,
    '  title:      ' + ch.title,
    '  angle (zh): ' + ch.angleZh,
    '  angle (en): ' + ch.angleEn,
    '  outputPath: ' + outPath,
    '',
    'READ THESE FIRST (in order), then follow them exactly:',
    '  1. .claude/skills/daily-english/agents/pipeline.md        (the 7-step contract)',
    '  2. .claude/skills/daily-english/references/schema.md       (the TS shape)',
    '  3. .claude/skills/daily-english/references/style-guide.md  (no-em-dash + tone)',
    '  4. ' + registerRef + '   (CEFR-specific calibration)',
    '  5. .claude/skills/daily-english/references/vocab-tagging.md',
    '  6. .claude/skills/daily-english/references/grammar-design.md',
    '  7. .claude/skills/daily-english/references/pattern-design.md',
    '  8. ' + book.modelFile + '   (gold-standard sample: copy its FORMAT, REGISTER, and DEPTH, never its content)',
    '',
    'BOOK-CHAPTER DELTAS (vs a flat article):',
    "  - Import: import type { Article } from '../../types';   (two levels up, NOT ./types)",
    '  - meta.date = the REAL news/event date this chapter covers (must be <= today), found during research. NOT the chapter number.',
    '  - collocations: []',
    '  - ' + listeningClause,
    '',
    'RESEARCH: use WebSearch with 1-3 focused queries to ground facts, and especially DATES. Start from: ' + JSON.stringify(ch.searchTerms) + '. Do not over-research; most of this is stable cultural fact. Absorb context, do not cite.',
    '',
    'BOOK COHERENCE (variety): ' + (ch.avoidConstructions || 'Pick grammar and pattern constructions that arise naturally from your own text; do not force a particular one.'),
    '',
    'HARD RULES (validate.py rejects violations; do not produce them):',
    '  - NO em-dash character (U+2014) and NO doubled Chinese em-dash (U+2014 U+2014) in ANY field. Use commas, periods, colons, or parentheses. Hyphens in compounds like dark-sky are fine.',
    '  - Each vocab.word must match its sentence via the regex \\bword\\b, case-sensitive surface form (lending, not lend). Avoid choosing a sentence-initial word as vocab (capitalization breaks the match).',
    '  - vocab.level is an integer 1-4, spread across all four levels (at least two L1 and at least one L4).',
    '  - Counts: 18-22 vocab, 3 grammar, 3 patterns, 5 quiz. Match the DEPTH of the model sample (multi-paragraph explanationZh and whyItWorks).',
    '  - Grammar title and pattern useCase are learning-centered Chinese headlines, never linguistics jargon.',
    '',
    'QUOTING IN .ts STRINGS: straight ASCII quotes and Chinese full-width quotes are both fine in these data files. Watch apostrophes inside single-quoted strings (escape as \\\' or switch that string to double quotes). Be consistent.',
    '',
    'THEN SELF-VALIDATE (do not skip):',
    '  1. Write the file to outputPath with the Write tool.',
    '  2. Run: python3 .claude/skills/daily-english/scripts/validate.py ' + outPath,
    '  3. If it prints {"ok": false, ...}, read the errors, FIX the file, and re-run. Up to 3 attempts.',
    '  4. As a final check, grep your own file for the em-dash character to be certain none slipped in.',
    '',
    'RETURN the StructuredOutput report: order, slug, title, outputPath, ok (true only if validate.py finally printed "ok": true), wordCount, sentenceCount, vocabCount, validatorOutput (the final JSON line), errors (unresolved issues, else []).',
    '',
    'Do NOT commit, push, deploy, or edit any file other than outputPath. Do NOT update topics.json.',
  ].join('\n');
}

// Fact-check stage report: light + flat. Lists exactly what was changed.
const FACTCHECK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['order', 'slug', 'validatorOk', 'corrections'],
  properties: {
    order: { type: 'integer' },
    slug: { type: 'string' },
    claimsChecked: { type: 'integer', description: 'how many discrete factual claims were verified' },
    corrections: { type: 'array', items: { type: 'string' }, description: 'each: "claim: was X, now Y (source/reason)"; [] if nothing was wrong' },
    unresolved: { type: 'array', items: { type: 'string' }, description: 'plausible claims that could not be confirmed or denied; left as-is and flagged' },
    validatorOk: { type: 'boolean', description: 'validate.py still passes after the edits' },
  },
};

function factCheckPrompt(book, ch, gen) {
  const outPath = (gen && gen.outputPath) || ('src/data/english/books/' + book.id + '/' + ch.slug + '.ts');
  return [
    'You are a FACT-CHECKER for one chapter of an English-learning book. Working directory: /Users/shijie/Code/sdg-html',
    'A chapter file was just written by another agent. Verify its HARD FACTS against real sources, correct ONLY verifiable errors, then re-validate. Your final answer is a StructuredOutput report, NOT prose.',
    '',
    'FILE:  ' + outPath,
    'TOPIC: ' + ch.title + ' -- ' + (ch.angleEn || ''),
    '',
    'STEP 1 -- Read the file and list every HARD factual claim: people, songs, albums, films, places; dates; numbers (sales, attendance, chart positions, counts, money); a song or track position on an album; who-wrote/produced/directed-what; and superlatives ("the first", "never before", "highest-grossing", "only"). Ignore opinions, prose style, translation quality, and the teaching framing.',
    '',
    'STEP 2 -- Verify each claim with WebSearch (WebFetch if needed). Be most skeptical of the details that are easy to get wrong: a track\'s position in an album, exact release dates, exact figures, attribution of credit, and superlatives.',
    '',
    'STEP 3 -- Correct ONLY claims you can show are wrong. This is surgical fact-correction, NOT a rewrite:',
    '  - Change the minimum words needed to make the fact true, in BOTH the English and the paired zh of that sentence.',
    '  - If the same wrong fact also appears inside a grammar/pattern explanation or example, fix it there too so they stay consistent.',
    '  - If a claim is plausible but you cannot confirm it, do NOT change it; put it under unresolved.',
    '  - Do NOT alter: sentence IDs, the number of sentences, any vocab.word (each must still appear in its sentence via the regex \\bword\\b), the vocab/grammar/pattern/quiz counts, or the register. If a needed fix would drop a vocab word from its sentence, rephrase so the word stays, or repoint that vocab entry to a different word that is present.',
    '  - NEVER introduce an em-dash (U+2014) or a doubled Chinese em-dash. Use commas, periods, or colons.',
    '',
    'STEP 4 -- Re-run: python3 .claude/skills/daily-english/scripts/validate.py ' + outPath,
    '  If it prints {"ok": false}, you broke something during editing; fix until it prints {"ok": true}. Also grep the file for the em-dash character to be sure none slipped in.',
    '',
    'RETURN the report: order=' + ch.order + ', slug=' + JSON.stringify(ch.slug) + ', claimsChecked (int), corrections (array of "claim: was X, now Y (why)", or [] if none), unresolved (array of claims you could not confirm), validatorOk (true ONLY if validate.py finally printed ok:true).',
    '',
    'Do NOT commit, push, or edit any file other than ' + outPath + '. Keep every change minimal and strictly factual.',
  ].join('\n');
}

function genOpts(ch) {
  const o = { label: 'gen:ch' + ch.order, phase: 'Generate', agentType: 'general-purpose', schema: REPORT_SCHEMA };
  if (BOOK.agentModel) o.model = BOOK.agentModel;
  return o;
}
function factOpts(ch) {
  const o = { label: 'fact:ch' + ch.order, phase: 'Fact-check', agentType: 'general-purpose', schema: FACTCHECK_SCHEMA };
  if (BOOK.agentModel) o.model = BOOK.agentModel;
  return o;
}

phase('Generate');
log('Producing ' + CHAPTERS.length + ' chapter(s) for "' + BOOK.id + '" (' + BOOK.cefr + ', register=' + BOOK.register + ', model=' + (BOOK.agentModel || 'session-default') + '): generate -> fact-check, pipelined.');

// Pipeline: each chapter flows generate -> fact-check independently (no barrier).
// A chapter whose generation failed skips fact-check and passes through.
const results = await pipeline(
  CHAPTERS,
  (ch) => agent(chapterPrompt(BOOK, ch), genOpts(ch)),
  (gen, ch) => {
    if (!gen || !gen.ok) return { gen: gen, fact: null, skippedFactCheck: true };
    if (gen.alreadyDone) return { gen: gen, fact: null, alreadyDone: true };
    return agent(factCheckPrompt(BOOK, ch, gen), factOpts(ch)).then((fact) => ({ gen: gen, fact: fact }));
  }
);

const rows = results.filter(Boolean);
const shipReady = rows.filter((r) => r.gen && r.gen.ok && (!r.fact || r.fact.validatorOk !== false));
const withCorrections = rows.filter((r) => r.fact && r.fact.corrections && r.fact.corrections.length);
const nulls = CHAPTERS.length - rows.length;
log('Pipeline done: ' + shipReady.length + ' ship-ready, ' + withCorrections.length + ' had fact corrections, ' + nulls + ' agent-null (resume to refill nulls).');

return {
  book: BOOK.id,
  requested: CHAPTERS.length,
  chapters: rows.map((r) => ({
    order: r.gen && r.gen.order,
    slug: r.gen && r.gen.slug,
    title: r.gen && r.gen.title,
    outputPath: r.gen && r.gen.outputPath,
    wordCount: r.gen && r.gen.wordCount,
    generated: !!(r.gen && r.gen.ok),
    factChecked: !!r.fact,
    validatorOk: r.fact ? r.fact.validatorOk : !!(r.gen && r.gen.ok),
    claimsChecked: r.fact && r.fact.claimsChecked,
    corrections: (r.fact && r.fact.corrections) || [],
    unresolved: (r.fact && r.fact.unresolved) || [],
    genErrors: (r.gen && r.gen.errors) || [],
  })),
  agentNull: nulls,
};
