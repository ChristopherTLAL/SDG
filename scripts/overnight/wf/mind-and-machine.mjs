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
  id: "mind-and-machine",
  cefr: "C1",
  register: 'c-level',
  noListening: true,
  modelFile: "src/data/english/books/mind-and-machine/01-hard-problem.ts",
  agentModel: 'sonnet',
};

const CHAPTERS = [
  {
    order: 1,
    slug: "01-hard-problem",
    title: "The Hard Problem",
    angleZh: "为什么会有体验？戴维·查尔默斯把意识研究劈成「简单问题」与「困难问题」，后者问的是：为何一切信息加工都伴随着内在的感受，而非在黑暗中悄然运转。",
    angleEn: "David Chalmers split consciousness into easy problems (function) and the hard problem (why there is experience at all); the essay walks through the explanatory gap and tests the illusionist attempt to dissolve it.",
    searchTerms: ["David Chalmers hard problem of consciousness","Daniel Dennett illusionism qualia","Joseph Levine explanatory gap"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with Nominalization (grammatical metaphor), and lead your patterns with Steel-man then turn (concession-rebuttal). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 2,
    slug: "02-turing-test",
    title: "What the Test Cannot Tell Us",
    angleZh: "图灵测试把「会不会聊天」等同于「有没有智能」，这个等式本身就预设了一个有争议的答案。本章追问：通过了这项测试，究竟证明了什么，又恰恰回避了什么。",
    angleEn: "The Turing Test conflates behavioural fluency with understanding; the essay presses the question of what passing the test actually establishes, and where the test simply stipulates its way past the hard questions.",
    searchTerms: ["Alan Turing imitation game 1950","John Searle Chinese Room argument","Turing test criticism philosophy of mind"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with It-cleft for focus (It is precisely here that...), and lead your patterns with Define-then-problematize (not because A but because B). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 3,
    slug: "03-chinese-room",
    title: "Syntax Is Not Semantics",
    angleZh: "塞尔的「中文房间」思想实验：一个不懂中文的人，按规则操纵符号，输出的中文回复却以假乱真。程序能处理符号，但处理符号等同于理解意义吗？",
    angleEn: "Searle's Chinese Room thought experiment pits syntactic manipulation against genuine semantic understanding, challenging the functionalist claim that running the right program is sufficient for thought.",
    searchTerms: ["John Searle Chinese Room argument 1980","functionalism philosophy of mind","systems reply to Chinese Room"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with Thought-experiment setup (conditional framing with hypothetical present), and lead your patterns with Analogy as argument (the concrete image that carries the logical structure). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 4,
    slug: "04-what-is-it-like",
    title: "What Is It Like to Be a Bat?",
    angleZh: "托马斯·内格尔追问：蝙蝠用超声波感知世界，那种体验是什么样的？这个问题无法从外部回答，暗示主观性本身抵抗科学的第三人称解释。",
    angleEn: "Nagel's bat argument shows that subjective character cannot be captured by objective description; the essay uses the bat as a test case for the limits of third-person science and what those limits mean for AI consciousness.",
    searchTerms: ["Thomas Nagel what is it like to be a bat 1974","subjective experience physicalism","Mary's room Frank Jackson knowledge argument"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with Wh-cleft for emphasis (What the experiment shows is...), and lead your patterns with The qualified generalization (as a rule, though not without exception). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 5,
    slug: "05-free-will-illusion",
    title: "The Will That Arrives Too Late",
    angleZh: "本杰明·利贝特的实验显示，大脑在受试者「决定」动作之前数百毫秒便已准备好动作。这是自由意志的终结，还是实验本身存在根本的误读？",
    angleEn: "Libet's readiness-potential experiments suggest the brain prepares action before conscious intention arrives; the essay weighs whether this demolishes free will or merely reveals how crude our instruments for reading consciousness still are.",
    searchTerms: ["Benjamin Libet readiness potential free will 1983","Daniel Wegner illusion of conscious will","free will neuroscience critique"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with Fronting and inversion (Central to this view is... / Nowhere is this clearer than...), and lead your patterns with Reported-evidence framing (the experiment showed X, which the author reads as Y). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 6,
    slug: "06-personal-identity",
    title: "The Ship of Theseus Has a Brain",
    angleZh: "如果你的每一个神经元被逐一替换为功能相同的硅芯片，「你」还是你吗？本章借助帕菲特的身份理论检验：人格同一性到底依附于什么，记忆、连续性，还是某种更难言说的东西。",
    angleEn: "Parfit's puzzle about personal identity is pressed through the neuron-replacement scenario: what makes you the same person over time, and whether that question has any determinate answer at all.",
    searchTerms: ["Derek Parfit reasons and persons personal identity","Ship of Theseus identity paradox","neuron replacement thought experiment"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with Concessive subordination (granted that / even if / for all its X), and lead your patterns with Reframing (the question is not whether X, but what kind of X). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 7,
    slug: "07-global-workspace",
    title: "The Theatre of the Mind",
    angleZh: "全局工作区理论把意识比作舞台聚光灯：无数竞争的神经过程在后台运算，只有被「广播」到全局的信息才浮现为意识。这是目前最具影响力的神经科学意识理论，但它解决的究竟是哪个问题？",
    angleEn: "Baars's Global Workspace Theory frames consciousness as the spotlight of a neural theatre; the essay asks whether this elegantly maps the architecture of attention while leaving the hard problem exactly where Chalmers found it.",
    searchTerms: ["Bernard Baars global workspace theory consciousness","Stanislas Dehaene global neuronal workspace","neural correlates of consciousness"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with Apposition (a noun phrase that renames and elaborates the preceding noun), and lead your patterns with Concession-then-rebuttal with an internal qualification. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 8,
    slug: "08-integrated-information",
    title: "A Number for Consciousness",
    angleZh: "朱利奥·托诺尼的「整合信息理论」（IIT）给意识赋予一个数值 Phi，并主张：凡是整合信息程度足够高的系统，无论其物质基础如何，都拥有某种形式的体验。这是理论上的突破，还是把泛心论装进了数学外衣？",
    angleEn: "Tononi's Integrated Information Theory assigns consciousness a measurable value, Phi, and implies that sufficiently integrated systems (grids, Internet routers) are conscious; the essay weighs its mathematical elegance against the panpsychist implications critics find alarming.",
    searchTerms: ["Giulio Tononi integrated information theory IIT phi","panpsychism philosophy of mind","IIT criticism Scott Aaronson"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with Hedging and epistemic modality (it would seem / arguably / on this reading / tends to), and lead your patterns with Thought-experiment setup (suppose that X; what would follow?). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 9,
    slug: "09-extended-mind",
    title: "The Extended Mind",
    angleZh: "克拉克与查尔默斯的「延展心智」论：手机为你所做的，如果搬到大脑内部完成，我们会称之为记忆。那么，颅骨究竟是心智的边界，还是只是一个我们从未认真追问过的习惯？",
    angleEn: "Clark and Chalmers's parity principle dissolves the skull as a privileged boundary; Otto's notebook and its dementia-patient owner force the question of whether coupling is the same as constitution.",
    searchTerms: ["Andy Clark David Chalmers extended mind 1998","active externalism philosophy","Adams Aizawa coupling constitution fallacy"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with Embedded counterfactual inversion (were it done in the head / were it X, we would call it Y), and lead your patterns with Prising apart an assumed identity (does not deny A; denies that A equals B). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 10,
    slug: "10-predictive-brain",
    title: "The Brain That Bets on the World",
    angleZh: "预测性编码理论颠转了感知的传统图像：大脑不是被动地接收感官信号，而是持续地生成预测，把错误率压到最低。如果感知只是一种受控的幻觉，「真实」意味着什么？",
    angleEn: "Predictive processing (Karl Friston, Andy Clark) recasts perception as the brain minimising prediction error rather than passively receiving input; the essay draws out what this means for the reliability of introspection and the nature of hallucination.",
    searchTerms: ["Karl Friston predictive processing free energy principle","Andy Clark surfing uncertainty predictive mind","Helmholtz unconscious inference perception"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with Parallelism and tricolon (three balanced phrases that build toward a point), and lead your patterns with Definition reframed (what we call X is in fact Y operating under Z). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 11,
    slug: "11-embodied-cognition",
    title: "Thinking with the Body",
    angleZh: "身体不只是心智的载具，它参与认知本身。握笔的手势影响思维，感到温暖的人评价他人更友善，手势甚至能帮助盲人理解数学。「身体化认知」对人工智能意味着什么：没有身体的系统能真正思考吗？",
    angleEn: "Embodied cognition research (Lakoff, Varela, Thompson) shows that bodily states, gestures, and sensorimotor loops shape abstract thought; the essay asks whether a disembodied AI running on a server thereby lacks something cognition requires.",
    searchTerms: ["embodied cognition Lakoff Johnson philosophy in the flesh","Francisco Varela Evan Thompson embodied mind","gesture and cognition David McNeill"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with Heavy noun phrase with participle clause (a system lacking all sensorimotor engagement...), and lead your patterns with Hedged assertion (it would not be unreasonable to suppose that...). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 12,
    slug: "12-language-and-thought",
    title: "Does Language Shape What We Can Think?",
    angleZh: "萨丕尔-沃尔夫假说的强版本认为，语言决定思想；弱版本认为语言影响认知偏好。大型语言模型能够处理语言却（据我们所知）不会思考，这对这场争论意味着什么？",
    angleEn: "The Sapir-Whorf hypothesis (from its strong Whorfianism to Boroditsky's softer evidence) is tested against what large language models reveal: can a system that manipulates language with no inner life shed light on whether language constitutes or merely channels thought?",
    searchTerms: ["Benjamin Lee Whorf linguistic relativity","Lera Boroditsky language and thought research","large language models and meaning"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with Colon-expansion (a colon that opens onto the fuller implication of the preceding clause), and lead your patterns with Qualified concession (while it is true that X, this account overlooks Y). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 13,
    slug: "13-moral-status",
    title: "What Would It Take to Deserve Moral Consideration?",
    angleZh: "如果我们无法从外部证实一个系统是否有感受，我们该如何决定它是否值得道德考量？本章检视「道德地位」的标准，并追问：在不确定性之下，谨慎原则要求我们做什么。",
    angleEn: "The essay examines what criteria (sentience, interests, relational status) ground moral consideration, and asks whether the hard problem of consciousness makes it impossible to apply those criteria to AI with any confidence, or whether uncertainty itself demands precaution.",
    searchTerms: ["moral status sentience Peter Singer animal liberation","Nick Bostrom AI moral patienthood","moral uncertainty and precautionary principle"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with Conditional reasoning (if X, then Y; but if not-X, then Z), and lead your patterns with Dilemma framing (either X with consequence A, or not-X with consequence B). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 14,
    slug: "14-attention-economy",
    title: "The Mind That Cannot Look Away",
    angleZh: "社交媒体平台被设计成持续争夺注意力的机器。注意力经济不只是一个商业现象，它是对认知主权的系统性侵蚀，而「上瘾」这个词掩盖了深层的权力结构。",
    angleEn: "The attention economy (Herbert Simon, Tim Wu, Yochai Benkler) is read not just as a business model but as an architecture that redistributes cognitive agency; the essay asks whether the language of 'addiction' accurately captures what is taken from users.",
    searchTerms: ["Herbert Simon attention scarcity information overload","Tim Wu the attention merchants","Tristan Harris persuasive technology design"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with Fronted nominalization as topic-setter (The systematic erosion of... / What passes for attention is...), and lead your patterns with Colon as pivot (a colon that shifts from description to diagnosis). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 15,
    slug: "15-consciousness-and-sleep",
    title: "The Disappeared Self",
    angleZh: "每晚我们都会消失，又重新出现。深度睡眠中意识缺席，却不是死亡，梦中的「我」是同一个自我吗？睡眠研究以一种侧门，把意识的最根本特征都逼了出来。",
    angleEn: "Sleep, dreaming, and anaesthetic unconsciousness serve as natural experiments that reveal which features of the self are load-bearing; the essay uses these altered states to probe what continuity of personal identity actually requires.",
    searchTerms: ["consciousness during sleep Tononi Massimini TMS EEG","dreaming and personal identity philosophy","anaesthesia awareness and consciousness"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with Fronting for cohesion (prepositional phrase or temporal adverbial moved to sentence-initial position), and lead your patterns with Parallel-case comparison (in case A... in case B... which reveals that...). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 16,
    slug: "16-artificial-creativity",
    title: "Can a Machine Surprise Itself?",
    angleZh: "AI 系统生成的图像、音乐和诗歌已令人叹为观止。但创造力要求的不只是新颖性，还有意向性、自我批判、乃至某种惊奇的能力。没有内在体验的系统能真正「创作」，还是只是统计学上的巧合？",
    angleEn: "Computational creativity raises the question of whether novelty plus skill exhausts what we mean by creativity, or whether something further (intentionality, the capacity to be surprised by one's own output) is required that current AI systems structurally cannot have.",
    searchTerms: ["Margaret Boden creative mind computational creativity","DALL-E Midjourney artistic output debate","intentionality and creativity philosophy"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with Nominalization stacked in subject position (The production of novel outputs that satisfy no antecedent specification...), and lead your patterns with Progressive narrowing (from broad claim to the precise condition that distinguishes the cases). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 17,
    slug: "17-alignment-problem",
    title: "Teaching Values to a System That Has None",
    angleZh: "AI 对齐问题的核心悖论：我们试图让机器遵循人类价值观，却无法就「哪些价值观」达成共识，也无法确认机器真正「理解」了这些价值观，还是只是在统计上拟合了我们的表达方式。",
    angleEn: "The AI alignment problem (Stuart Russell, Paul Christiano) reveals a regress: to specify human values we must already have them explicit, but human values are partly tacit, contested, and contextual; the essay asks whether alignment is a technical problem with a technical solution or a political problem in disguise.",
    searchTerms: ["Stuart Russell human compatible AI alignment","Paul Christiano AI alignment research","goodhart's law AI specification gaming"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with Subjunctive and counterfactual (were we to succeed in specifying X fully / had we a clear account of Y), and lead your patterns with Problem reframed (this is not a technical problem but a political one in disguise). Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 18,
    slug: "18-minds-we-make",
    title: "The Minds We Make, and What They Ask of Us",
    angleZh: "作为一本书的结语，本章不给出答案，而是盘点这些问题真正意味着什么：我们正在建造我们尚未理解的那类事物，而这一事实要求我们以一种全新的谦逊来面对意识、道德与知识的边界。",
    angleEn: "The concluding essay holds the book's threads together: we are building systems whose inner life (if any) we cannot verify, whose values we cannot reliably specify, and whose effects on human minds are already reshaping cognition; the appropriate response is not techno-optimism or panic but a principled reckoning with what we do not know.",
    searchTerms: ["AI consciousness ethics 2020s debate","Nick Bostrom superintelligence existential risk","Kate Crawford Atlas of AI political economy"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with Tricolon with escalating weight (we do not know X, we cannot specify Y, we have not reckoned with Z), and lead your patterns with Principled open suspension (it may be that X; or it may be that Y; what is certain is Z). Fill the rest with other fresh constructions; every example must come from your own text.",
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
