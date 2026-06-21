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
  id: "aesthetic-animal",
  cefr: "C1",
  register: 'c-level',
  noListening: true,
  modelFile: "src/data/english/books/mind-and-machine/01-hard-problem.ts",
  agentModel: 'sonnet',
};

const CHAPTERS = [
  {
    order: 1,
    slug: "01-why-beauty",
    title: "Why Beauty at All",
    angleZh: "人类为何进化出对美的感知？探讨审美体验的演化起源，以及美感究竟是适应性的副产品还是自有其功能的选择压力。",
    angleEn: "Evolution gave us hunger and fear because survival required them; the puzzle is why it also gave us the capacity to be stopped in our tracks by a sunset. This essay asks whether aesthetic experience is an adaptation in its own right or merely a by-product of other cognitive machinery.",
    searchTerms: ["Denis Dutton The Art Instinct","Ellen Dissanayake Homo Aestheticus","sexual selection and aesthetic preference"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with nominalization, and lead your patterns with define-then-problematize. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 2,
    slug: "02-sublime-terror",
    title: "The Pleasure of Being Afraid",
    angleZh: "人为何在面对令人生畏的事物时感到愉悦？探讨崇高感的哲学传统，以及恐惧与美之间令人不安的共谋关系。",
    angleEn: "Edmund Burke noticed that we call vast, terrifying things beautiful, and the observation has unsettled aesthetics ever since. This essay examines the sublime as a category that refuses to separate pleasure from fear, and asks what that refusal reveals about the architecture of aesthetic experience.",
    searchTerms: ["Edmund Burke A Philosophical Enquiry","Immanuel Kant Critique of Judgment","sublime and the limits of representation"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with it-cleft, and lead your patterns with concession-then-rebuttal. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 3,
    slug: "03-taste-real",
    title: "Is Taste Merely Personal",
    angleZh: "「萝卜白菜各有所爱」的说法听起来很民主，但若品味只是个人偏好，我们便无法真正地争论艺术的好坏。本文探讨趣味主观论与真实美学价值之间的张力。",
    angleEn: "We talk about taste as though it were purely private, yet we argue about it with an urgency reserved for matters we believe have right answers. This essay presses on the contradiction, examining whether aesthetic judgment can be both personal and genuinely truth-apt.",
    searchTerms: ["David Hume Of the Standard of Taste","Frank Sibley aesthetic concepts","aesthetic realism and anti-realism"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with wh-cleft, and lead your patterns with the thought-experiment setup. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 4,
    slug: "04-art-and-craft",
    title: "What Separates Art from Craft",
    angleZh: "一把精美的椅子与一件雕塑之间的界线在哪里？探讨艺术与工艺的区分究竟是一个有意义的哲学差异，还是一种被机构权力强化的文化偏见。",
    angleEn: "For most of human history the distinction between art and craft did not exist; skilled making was skilled making. This essay traces when and why the line was drawn, and asks whether the category of fine art illuminates something real or merely ratifies the prejudices of a particular social class.",
    searchTerms: ["Larry Shiner The Invention of Art","Pierre Bourdieu Distinction","Immanuel Kant disinterested pleasure"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with fronting and inversion, and lead your patterns with reframing not-but. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 5,
    slug: "05-expression-theory",
    title: "Art as the Language of Feeling",
    angleZh: "表现主义理论认为艺术是情感的外化，但这一说法面临一个古老的困难：并非所有好的艺术都在表达情感，而表达情感本身也不足以产生艺术。",
    angleEn: "The expression theory of art holds that works are significant because they embody and transmit the inner states of their makers. This essay weighs the theory's genuine appeal against the objection that it conflates self-expression with artistic achievement, and asks what emotion actually does inside a work of art.",
    searchTerms: ["R. G. Collingwood Principles of Art","Leo Tolstoy What Is Art","Suzanne Langer feeling and form"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with concessive subordination, and lead your patterns with steel-man then turn. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 6,
    slug: "06-form-and-meaning",
    title: "Can Form Itself Mean Anything",
    angleZh: "抽象音乐与非表现性绘画是否传达了任何「意义」，还是它们只是经过精心组织的感官刺激？探讨形式主义美学的核心命题及其限制。",
    angleEn: "Formalist aesthetics proposes that the value of art lies entirely in the arrangement of its elements: line, colour, rhythm, pitch, with no reference required to the world outside. This essay tests that claim against the intuition that pure form, however beautiful, seems to say something rather than merely be something.",
    searchTerms: ["Clive Bell significant form","Eduard Hanslick On the Musically Beautiful","Nelson Goodman Languages of Art"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with hedging and epistemic modality, and lead your patterns with analogy as argument. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 7,
    slug: "07-institutional-art",
    title: "Who Decides What Counts as Art",
    angleZh: "杜尚把一个小便池送进博物馆，从而证明了什么？探讨艺术界理论如何以机构授权取代内在性质，以及这一转移所付出的代价。",
    angleEn: "When Duchamp submitted a urinal to an art exhibition in 1917, he did not argue that it was beautiful; he argued that the art world's endorsement was sufficient. This essay examines the institutional theory of art, which is the most honest account of how contemporary art actually works and the most troubling one.",
    searchTerms: ["George Dickie institutional theory of art","Arthur Danto the artworld","Marcel Duchamp Fountain"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with apposition, and lead your patterns with qualified generalization. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 8,
    slug: "08-music-and-time",
    title: "Music and the Shape of Time",
    angleZh: "音乐是唯一在时间中展开并将时间本身作为其媒介的艺术形式。探讨这种时间性如何赋予音乐一种其他艺术难以复制的情感力量，以及它的意义究竟栖居在哪里。",
    angleEn: "Music is unusual among the arts in that it does not represent time but constitutes it: the work exists only in its unfolding. This essay asks whether this temporal structure is what gives music its peculiar emotional authority, and whether the meaning of a piece can survive being extracted from its performance.",
    searchTerms: ["Victor Zuckerkandl Sound and Symbol","Roger Scruton The Aesthetics of Music","music cognition and emotional response"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with parallelism and tricolon, and lead your patterns with reported-evidence framing. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 9,
    slug: "09-narrative-self",
    title: "Stories We Tell to Become Ourselves",
    angleZh: "心理学研究表明人类通过叙事来建构自我认同，但如果自我本身就是一个故事，那么我们究竟是谁：那个讲故事的人，还是故事中的人物？",
    angleEn: "The psychologist Dan McAdams has shown that people construct identity through narrative, organizing their lives into autobiographical stories with themes, arcs, and redemptive turns. This essay considers whether this narrative self is a genuine discovery about human psychology or a culturally specific way of making incoherence bearable.",
    searchTerms: ["Dan McAdams narrative identity","Paul Ricoeur Oneself as Another","cross-cultural self-concept research"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with colon-expansion, and lead your patterns with hedged assertion. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 10,
    slug: "10-photography-truth",
    title: "Does the Camera Lie",
    angleZh: "摄影长期以来被认为是客观记录现实的工具，但每一张照片都是取景、选时、后期处理的产物。本文探讨照片的纪录性声称与其作为构建之物这一本质之间的张力。",
    angleEn: "Photography has enjoyed a special authority among the arts because the camera was believed to transcribe rather than interpret. This essay examines how that authority was always partly mythological, and what the age of digital manipulation forces us to finally admit about the photograph's claim to truth.",
    searchTerms: ["Roland Barthes Camera Lucida","Susan Sontag On Photography","documentary ethics and photographic manipulation"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with conditional reasoning, and lead your patterns with historical framing pivot. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 11,
    slug: "11-kitsch-and-camp",
    title: "In Defense of Kitsch",
    angleZh: "媚俗品（kitsch）在高雅文化中被鄙视，但数十亿人从中获得真实的情感满足。探讨对媚俗的批判究竟是审美判断还是阶级歧视，以及坎普（camp）如何重新激活了被鄙视的对象。",
    angleEn: "Kitsch has been defined as the aesthetic lie, the fake emotion delivered on schedule, the enemy of genuine art. Yet billions find real comfort and joy in exactly the things that the critical tradition despises. This essay asks whether the condemnation of kitsch reflects a genuine aesthetic insight or a form of cultural snobbery wearing philosophical clothing.",
    searchTerms: ["Milan Kundera The Unbearable Lightness of Being kitsch","Susan Sontag Notes on Camp","Hermann Broch kitsch and evil"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with heavy noun phrase with participle clause, and lead your patterns with rhetorical question as pivot. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 12,
    slug: "12-originality-myth",
    title: "The Myth of Pure Originality",
    angleZh: "「原创性」是现代艺术的最高美德，但每一位艺术家都站在前人的肩膀上，甚至站在他们正在模仿的肩膀上。探讨原创神话如何遮蔽了影响与借鉴在创造过程中的核心地位。",
    angleEn: "Romantic aesthetics bequeathed us a cult of originality in which the artist creates ex nihilo, untouched by predecessors. This essay argues that this image of creation is not only historically false but aesthetically confused: influence is not contamination but the very medium through which artistic tradition sustains itself.",
    searchTerms: ["T. S. Eliot Tradition and the Individual Talent","Harold Bloom The Anxiety of Influence","intertextuality and originality in art"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with subjunctive and counterfactual, and lead your patterns with parallel contrast. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 13,
    slug: "13-audience-and-work",
    title: "Who Completes the Work",
    angleZh: "一件艺术作品的意义究竟由创作者决定，还是由观众在欣赏过程中完成？探讨作者意图论与开放文本理论之间的争论，以及它对艺术批评实践的影响。",
    angleEn: "When Roland Barthes declared the death of the author in 1967, he was not recording a death but performing one: transferring the authority to make meaning from the writer to the reader. This essay takes that argument seriously, presses it to its limits, and asks whether a work can mean anything without some reference to the intentions behind it.",
    searchTerms: ["Roland Barthes Death of the Author","E. D. Hirsch intentionalism","Umberto Eco The Open Work"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with reported-speech framing with epistemic verbs, and lead your patterns with definition and distinction. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 14,
    slug: "14-beauty-and-justice",
    title: "Does Beauty Have Politics",
    angleZh: "审美偏好从来不是在真空中形成的，它受到权力、历史与文化规范的塑造。探讨「美」的标准如何被用来排斥某些身体和声音，以及政治批判如何与真正的审美判断共存。",
    angleEn: "The standards that determine what counts as beautiful in art, in bodies, and in landscapes have historically reflected and reinforced the perspectives of those with the power to set them. This essay takes the political critique of beauty seriously while asking whether it collapses, if followed to its conclusion, into a denial that beauty exists at all.",
    searchTerms: ["Elaine Scarry On Beauty and Being Just","bell hooks Art on My Mind","Sianne Ngai aesthetic categories"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with fronting with negative adverb inversion, and lead your patterns with tricolon as argument. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 15,
    slug: "15-authenticity-art",
    title: "What Makes a Forgery Wrong",
    angleZh: "一幅伪作若在感官上与原作无法区分，它为何价值更低？探讨真迹的概念在艺术中究竟意味着什么，以及本真性的价值是审美的还是历史的。",
    angleEn: "If a perfect forgery of a Vermeer were indistinguishable from the original by any perceivable test, would it be just as good a painting? Most people say no, but the reasons are elusive. This essay examines what work the concept of authenticity is doing in art, and whether its value is ultimately aesthetic or sentimental.",
    searchTerms: ["Nelson Goodman Languages of Art forgery","Denis Dutton forgery and authenticity","Han van Meegeren Vermeer forgeries"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with conditional reasoning with counterfactual inversion, and lead your patterns with conditional challenge. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 16,
    slug: "16-machine-creativity",
    title: "Can a Machine Be Creative",
    angleZh: "当 AI 生成的图像在艺术竞赛中获奖，而生成音乐在音乐平台上获得百万流量，「创造力」这个概念面临前所未有的压力。探讨机器生成的作品是否能在真正意义上被称为创造。",
    angleEn: "A computer program cannot want anything, intend anything, or know that it has failed. Yet the images, texts, and compositions that machine learning systems produce are increasingly difficult to distinguish from those of human makers. This essay asks whether creativity requires a creator in any sense that excludes the machine.",
    searchTerms: ["Margaret Boden creative mind","Margaret Boden AARON Harold Cohen","generative AI and artistic authorship"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with nominalization with abstract subject chain, and lead your patterns with escalating qualification. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 17,
    slug: "17-ai-authenticity",
    title: "The Artist in the Age of the Algorithm",
    angleZh: "在 AI 能够生成几乎任何风格的作品之后，「这是人类创作的」是否仍然是一个有意义的美学标准？探讨人类起源对艺术价值的重要性是否能够在哲学上得到辩护。",
    angleEn: "Once an algorithm can produce work indistinguishable from that of a trained human artist, the claim that a piece was made by a person begins to function less as an aesthetic description and more as a provenance certificate. This essay asks whether that provenance carries genuine artistic weight or whether it is a form of species chauvinism.",
    searchTerms: ["Walter Benjamin Art in the Age of Mechanical Reproduction aura","authenticity and generative AI art debate","Boris Groys art and originality post-digital"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with apposition with parenthetical elaboration, and lead your patterns with catalog and selection. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 18,
    slug: "18-aesthetic-life",
    title: "Living Aesthetically",
    angleZh: "审美体验不只发生在博物馆里。探讨能否将生活本身作为一件艺术品来对待，以及这一理念的吸引力与危险性：它究竟是解放还是一种精心的自恋？",
    angleEn: "The idea that one might make of one's life a work of art has a long philosophical pedigree, from Nietzsche through Wilde to Foucault's aesthetics of existence. This essay weighs the genuine appeal of that vision against the suspicion that treating one's life as an artwork tends, in practice, to make one a worse person and a less attentive one.",
    searchTerms: ["Alexander Nehamas Nietzsche Life as Literature","Michel Foucault aesthetics of existence","aestheticism Oscar Wilde ethics"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with participial phrase and absolute construction, and lead your patterns with closing horizon move. Fill the rest with other fresh constructions; every example must come from your own text.",
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
