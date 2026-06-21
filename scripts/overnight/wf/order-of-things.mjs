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
  id: "order-of-things",
  cefr: "C2",
  register: 'c-level',
  noListening: true,
  modelFile: "src/data/english/books/mind-and-machine/01-hard-problem.ts",
  agentModel: 'sonnet',
};

const CHAPTERS = [
  {
    order: 1,
    slug: "01-demarcation",
    title: "Where Science Ends",
    angleZh: "波普尔的可证伪标准曾被视为划分科学与非科学的利剑，但这把利剑究竟能否真正切开这道界线，本身就是一个未解的哲学难题。",
    angleEn: "Popper's falsifiability criterion promised a clean line between science and pseudoscience, but the criterion itself turns out to be harder to apply than its elegance suggests.",
    searchTerms: ["Karl Popper falsifiability","Lakatos research programmes demarcation","Duhem-Quine thesis underdetermination"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with it-cleft for focus, and lead your patterns with define-then-problematize. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 2,
    slug: "02-kuhn-revolution",
    title: "The Structure of Scientific Change",
    angleZh: "库恩的「范式转换」改变了我们理解科学史的方式，但若科学进步真的不可公度，我们又凭什么说一场革命是前进而非横移？",
    angleEn: "Kuhn's paradigm shifts reframed scientific history as punctuated upheaval, yet the incommensurability thesis he introduced may make 'progress' an incoherent notion.",
    searchTerms: ["Thomas Kuhn Structure Scientific Revolutions","Paul Feyerabend incommensurability","Imre Lakatos scientific progress"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with wh-cleft for emphasis, and lead your patterns with concession-then-rebuttal. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 3,
    slug: "03-unreasonable-effectiveness",
    title: "The Unreasonable Effectiveness of Mathematics",
    angleZh: "维格纳问过一个至今没有公认答案的问题：为何一门纯在心智中发展的数学，竟能如此精准地描述一个对它一无所知的宇宙？",
    angleEn: "Wigner's famous puzzle about mathematics and physics remains genuinely open: whether the fit is a deep metaphysical fact or a selection effect we impose on nature is still contested.",
    searchTerms: ["Eugene Wigner unreasonable effectiveness mathematics","Max Tegmark mathematical universe hypothesis","Mark Steiner applicability mathematics"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with colon-expansion, and lead your patterns with thought-experiment setup. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 4,
    slug: "04-induction-problem",
    title: "The Scandal of Induction",
    angleZh: "休谟揭示了归纳法的循环：我们无法用「过去的规律性」来证明「未来会有规律」，因为这一证明本身就已经预设了归纳。这个丑闻，三百年来没有令人信服的答案。",
    angleEn: "Hume's problem of induction is not a puzzle awaiting a clever solution but a permanent constraint on the logical structure of empirical knowledge, and science's success makes the gap all the more striking.",
    searchTerms: ["David Hume problem of induction","Nelson Goodman new riddle induction grue","Karl Popper response to Hume"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with fronting and inversion, and lead your patterns with reframing not-but. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 5,
    slug: "05-theory-ladenness",
    title: "Seeing Through Theory",
    angleZh: "每一次科学观测都已经被理论预先塑造：我们看见的是「光的偏折」而非「光子轨迹」，是「癌细胞」而非「特定形态的细胞聚集」。观测的纯洁性是一个神话。",
    angleEn: "The theory-ladenness of observation means that raw, untainted data is a fiction, yet science still manages to adjudicate between competing theories, and understanding how is central to understanding what science does.",
    searchTerms: ["Norwood Russell Hanson theory-ladenness observation","Pierre Duhem holism observation","Kuhn observation paradigm dependence"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with nominalization and grammatical metaphor, and lead your patterns with analogy as argument. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 6,
    slug: "06-replication-crisis",
    title: "When the Numbers Lie",
    angleZh: "心理学和生物医学的可重复性危机不只是若干坏苹果的问题，它暴露了科学激励结构与真理追求之间长期被掩盖的裂缝。",
    angleEn: "The replication crisis in psychology and biomedicine is best understood not as a failure of individual researchers but as a structural consequence of the incentives and publication norms that science has built for itself.",
    searchTerms: ["Open Science Collaboration replication crisis psychology","John Ioannidis why most published findings are false","p-hacking publication bias"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with conditional reasoning and the counterfactual, and lead your patterns with steel-man then turn. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 7,
    slug: "07-emergence",
    title: "More Than the Sum",
    angleZh: "涌现现象提出了一个古老问题：整体的性质能否从部分的性质中被推导出来，还是涌现为物理还原论划下了真正的边界？",
    angleEn: "Emergence is either a label for our explanatory limitations or a genuine ontological claim that some properties of wholes resist derivation from parts, and the two readings have very different consequences for the unity of science.",
    searchTerms: ["Philip Anderson More is Different emergence","Jerry Fodor special sciences","Mark Bedau weak strong emergence"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with parallelism and tricolon, and lead your patterns with qualified generalization. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 8,
    slug: "08-reduction",
    title: "The Limits of Reduction",
    angleZh: "物理还原论者相信，一旦掌握了基本粒子的完整方程，原则上一切都能被推导出来。但「原则上」与「实践上」之间的那道鸿沟，可能比它看起来更像是概念上的裂缝。",
    angleEn: "The claim that higher-level sciences will eventually reduce to physics rests on an 'in principle' that may conceal a conceptual impossibility, not merely a practical difficulty, and Fodor's argument about special sciences remains its most durable challenge.",
    searchTerms: ["Jerry Fodor special sciences reduction","Ernest Nagel reduction philosophy science","Jaegwon Kim mental causation supervenience"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with apposition for packed qualification, and lead your patterns with hedged assertion. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 9,
    slug: "09-scientific-realism",
    title: "Do Quarks Really Exist?",
    angleZh: "科学实在论者认为，成功的科学理论大致正确地描述了不可观测的实体；反实在论者回答，科学的成功只需「经验适足」，无需承诺那些理论实体真的存在。",
    angleEn: "The debate between scientific realism and instrumentalism turns on whether the predictive success of theories gives us reason to believe in the unobservable entities they posit, and the no-miracles argument and the pessimistic meta-induction are its twin poles.",
    searchTerms: ["Hilary Putnam no-miracles argument scientific realism","Larry Laudan pessimistic meta-induction","Bas van Fraassen constructive empiricism"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with hedging and epistemic modality, and lead your patterns with reported-evidence framing. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 10,
    slug: "10-underdetermination",
    title: "More Than One Theory Fits",
    angleZh: "同样的证据往往可以容纳彼此竞争的多种理论，而逻辑本身无法为我们做出裁决：理论的选择不可避免地引入了证据之外的价值判断。",
    angleEn: "Underdetermination of theory by evidence is not a sceptical curiosity but a structural feature of scientific inference, and how scientists actually choose between empirically equivalent theories reveals the irreducible role of values in what looks like pure inquiry.",
    searchTerms: ["Duhem-Quine thesis underdetermination","Larry Laudan values scientific choice","Thomas Kuhn values theory choice"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with concessive subordination with even if, and lead your patterns with central-claim identification via contrast. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 11,
    slug: "11-causation",
    title: "The Cement of the Universe",
    angleZh: "科学以发现因果关系为己任，但「因果关系」本身是一个哲学上远比看起来更复杂的概念：相关不是因果，而如何从相关跨到因果，至今没有逻辑上令人完全信服的论证。",
    angleEn: "Science seeks causal explanations, but causation itself has resisted philosophical analysis for centuries, and the gap between correlation and causation points to a deeper question about whether causes exist in the world or are imposed by our minds.",
    searchTerms: ["Judea Pearl causality ladder","Hume constant conjunction causation","Nancy Cartwright capacities causal inference"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with fronting with negative adverbial for emphasis, and lead your patterns with open-question close. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 12,
    slug: "12-models-and-reality",
    title: "The Map That Became the Territory",
    angleZh: "科学模型刻意简化现实，但简化的代价是：当模型的预测成立，我们无法确定成立的原因；当模型失败，我们同样无法确定失败的原因。",
    angleEn: "The paradox of scientific models is that their usefulness depends on the very idealizations that ensure they are false, and reconciling predictive power with representational fidelity has no general solution.",
    searchTerms: ["George Box all models are wrong","Roman Frigg scientific representation models","Nancy Cartwright dappled world models"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with heavy noun phrase with embedded relative clause, and lead your patterns with paradox-then-resolution. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 13,
    slug: "13-probability",
    title: "What Does Probability Mean?",
    angleZh: "概率是现代科学不可或缺的语言，但频率主义与贝叶斯主义对「概率意味着什么」给出了根本不同的答案，而这场争论并非纯粹技术性的：它牵涉科学推断的基础。",
    angleEn: "The debate between frequentist and Bayesian interpretations of probability is not merely technical; it reflects incompatible accounts of what scientific inference is doing when it assigns a number to uncertainty.",
    searchTerms: ["Rudolf Carnap confirmation theory","Bayesian epistemology probability","frequentism probability philosophy science"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with wh-cleft with nominal clause as subject, and lead your patterns with two-horns dilemma framing. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 14,
    slug: "14-explanation",
    title: "What It Means to Explain",
    angleZh: "覆盖律模型将科学解释化约为演绎，但它遗漏了因果方向：身高推算影子的长度，以同样的逻辑步骤也能从影子推算旗杆高度，但后者并不令人满意。",
    angleEn: "Hempel's covering-law model of explanation promised a formal account of why science explains, but the flagpole problem shows that logical derivation captures something and misses the causal arrow that makes some derivations feel like explanations and others like mere inference.",
    searchTerms: ["Carl Hempel covering-law model scientific explanation","flagpole problem irrelevance objection Bromberger","Wesley Salmon causal explanation"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with appositive aside as argumentative pivot, and lead your patterns with counterexample-then-principle. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 15,
    slug: "15-laws-of-nature",
    title: "Are the Laws of Nature Laws?",
    angleZh: "物理定律是被发现的还是被发明的？它们是宇宙中坚不可摧的特征，还是只是我们描述规律性的最简洁方式？这个问题比它初看上去更难决断。",
    angleEn: "Whether the laws of nature have a modal force beyond the regularities they describe, or whether they are simply the most economical summaries of what happens, divides Humeans and necessitarians in ways that matter for how science understands its own authority.",
    searchTerms: ["David Lewis Humean supervenience laws of nature","David Armstrong universals necessitation laws","Nancy Cartwright laws nature capacity"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with subjunctive and counterfactual conditional, and lead your patterns with fork-in-the-road setup. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 16,
    slug: "16-social-dimensions",
    title: "Science as a Social Practice",
    angleZh: "科学知识的生产是一项社会活动，这个洞见解放了科学社会学，也引发了一个令人不安的问题：若知识的形成受到权力关系和文化背景的塑造，客观性还剩多少？",
    angleEn: "The sociology of scientific knowledge rightly exposed science as a social practice, but conflating the social causes of belief with its epistemic justification risks sliding into a relativism that science itself is well placed to resist.",
    searchTerms: ["Robert Merton norms of science CUDOS","David Bloor strong programme sociology knowledge","Helen Longino social epistemology science"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with concessive clause with for all its construction, and lead your patterns with slippery-slope warning then limit. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 17,
    slug: "17-time-arrow",
    title: "Why Time Has a Direction",
    angleZh: "物理基本方程在时间反演下几乎保持对称，但我们感知到的时间却有明确的方向。这道不对称的来源，至今没有被物理学完全解释，而它指向了科学与经验之间最深的裂缝之一。",
    angleEn: "The asymmetry of time is one of the deepest puzzles at the intersection of physics and philosophy: the fundamental equations permit time reversal, yet the past is fixed and the future is open, and no purely physical account of this asymmetry has proved universally convincing.",
    searchTerms: ["Ludwig Boltzmann entropy arrow of time","Sean Carroll time's arrow cosmology","Huw Price time asymmetry philosophy physics"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with participial clause for compressed contrast, and lead your patterns with phenomenon-first then mechanism-gap. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 18,
    slug: "18-unity-of-science",
    title: "One Science or Many?",
    angleZh: "逻辑实证主义者梦想把所有科学统一到一套语言和一组基础定律之下。这个梦想的失落，反而让各门科学以各自的方式繁荣，而「统一」究竟是一个认识论理想还是一个形而上学的偏见，值得重新审视。",
    angleEn: "The logical positivists' dream of a unified science under the banner of physics collapsed, but whether that collapse is a loss, a liberation, or simply an occasion for a more pluralist and pragmatist account of what inquiry is for, remains genuinely open.",
    searchTerms: ["Otto Neurath unity of science movement","Jerry Fodor special sciences autonomy","John Dupre disorder of things scientific pluralism"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with parallel noun phrase series with tricolon resolution, and lead your patterns with historical-arc then open-verdict. Fill the rest with other fresh constructions; every example must come from your own text.",
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
