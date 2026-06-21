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
  id: "thinking-about-thinking",
  cefr: "C1",
  register: 'c-level',
  noListening: true,
  modelFile: "src/data/english/books/mind-and-machine/01-hard-problem.ts",
  agentModel: 'sonnet',
};

const CHAPTERS = [
  {
    order: 1,
    slug: "01-overconfidence-trap",
    title: "The Overconfidence Trap",
    angleZh: "为什么专家越自信，预测往往越不准？本章检视「过度自信」的认知根源，以及自我怀疑为何是智识成熟的标志，而非软弱的表现。",
    angleEn: "Why does greater expertise so often breed greater certainty rather than greater humility? This essay examines the cognitive roots of overconfidence and argues that calibrated doubt is a mark of intellectual maturity, not weakness.",
    searchTerms: ["Philip Tetlock superforecasting","Dunning-Kruger effect cognitive bias","epistemic humility Kahneman"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with nominalization, and lead your patterns with define-then-problematize. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 2,
    slug: "02-wisdom-of-crowds",
    title: "The Wisdom of Crowds, Reconsidered",
    angleZh: "群体智慧的吸引力在于它颠覆精英决策神话，但信息串联与从众效应足以让群体比最差的成员还要愚蠢。本章厘清这两种力量各自成立的条件。",
    angleEn: "The wisdom of crowds is a compelling rebuke to expert elitism, yet information cascades can make a group dumber than its worst member. This essay maps the precise conditions under which aggregation yields insight rather than madness.",
    searchTerms: ["James Surowiecki wisdom of crowds","Sushil Bikhchandani information cascades","Cass Sunstein deliberative polling"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with it-cleft, and lead your patterns with concession-then-rebuttal. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 3,
    slug: "03-two-systems",
    title: "Two Systems, One Mind",
    angleZh: "卡尼曼的「系统一/系统二」框架已成心理学常识，但这一整洁的二分法究竟是描述性的科学发现，还是一个便于叙事的比喻？本章反思元认知语言的危险。",
    angleEn: "Kahneman's fast-and-slow dichotomy has entered everyday speech, yet critics argue it is a metaphor masquerading as a mechanism. This essay asks what we gain, and what we obscure, by carving the mind into two.",
    searchTerms: ["Daniel Kahneman Thinking Fast and Slow","Jonathan Evans dual-process theory","Gerd Gigerenzen heuristics critique"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with wh-cleft, and lead your patterns with thought-experiment setup. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 4,
    slug: "04-replication-crisis",
    title: "When the Studies Would Not Replicate",
    angleZh: "2011 年后，数十项心理学经典发现相继无法重复，这场「复制危机」动摇的不仅是结论，更是科学知识生产的整套机制。本章追问：什么坏掉了，又如何修复？",
    angleEn: "When dozens of celebrated psychology findings crumbled under replication, the crisis revealed not bad scientists but structural incentives that reward novelty over truth. This essay diagnoses what broke and what a reformed science might look like.",
    searchTerms: ["Open Science Collaboration 2015 replication","publication bias p-hacking psychology","Uri Simonsohn researcher degrees of freedom"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with fronting and inversion, and lead your patterns with reported-evidence framing. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 5,
    slug: "05-availability-heuristic",
    title: "The Availability of Fear",
    angleZh: "我们对风险的判断往往取决于脑海中能轻易浮现的画面，而非实际概率。本章审视可得性启发的机制，并探讨媒体与政治如何系统性地利用这一偏误。",
    angleEn: "We judge a risk by how easily a vivid image of it comes to mind, not by its actual probability. This essay traces the availability heuristic from its cognitive origins to its exploitation by media and political rhetoric.",
    searchTerms: ["Amos Tversky Kahneman availability heuristic","Paul Slovic risk perception psychology","Nassim Taleb black swan availability"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with hedging and epistemic modality, and lead your patterns with analogy as argument. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 6,
    slug: "06-confirmation-bias",
    title: "The Comfort of Being Right",
    angleZh: "确认偏误不只是懒惰：它是心智在自我保护，让我们的信念体系免于崩解。本章提出，真正的智识美德不是永不出错，而是学会在证据面前改变主意。",
    angleEn: "Confirmation bias is not mere laziness; it is the mind protecting the coherence of a belief system under cognitive load. This essay argues that the intellectual virtue worth cultivating is not infallibility but the capacity to update.",
    searchTerms: ["Peter Wason selection task confirmation bias","Raymond Nickerson confirmation bias review","Philip Tetlock belief updating superforecasters"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with concessive subordination, and lead your patterns with steel-man then turn. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 7,
    slug: "07-priming-effect",
    title: "The Invisible Push",
    angleZh: "启动效应曾是社会心理学最令人叹服的发现之一，暗示环境中无意识的线索能悄然塑造判断与行为。然而复制危机将其中许多打回原形。本章追问：心理学该如何对待它自己的明星实验。",
    angleEn: "Priming effects once seemed to prove that we are steered by cues we never notice, yet many landmark findings have failed to replicate. This essay asks what remains of the priming story and what its partial collapse reveals about how a science handles its own foundational claims.",
    searchTerms: ["John Bargh social priming experiments","Ap Dijksterhuis ego depletion replication failure","Brian Nosek reproducibility project psychology"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with conditional reasoning, and lead your patterns with reframing not-but. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 8,
    slug: "08-expert-intuition",
    title: "When to Trust a Gut",
    angleZh: "不是所有的直觉都是偏误：棋手、消防员、急诊医生依赖的快速判断有其理性根基。本章区分「真实专业直觉」与「错觉性专业直觉」，并追问两者的分界线究竟在哪里。",
    angleEn: "Not every gut feeling is a bias: the rapid judgements of chess players, firefighters, and clinicians rest on genuine expertise. This essay draws the line between real expert intuition and the illusion of expertise, asking what kind of environment makes intuition trustworthy.",
    searchTerms: ["Gary Klein naturalistic decision making","Kahneman Noise judgment error","Robin Hogarth wicked versus kind learning environments"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with apposition, and lead your patterns with qualified generalization. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 9,
    slug: "09-narrative-fallacy",
    title: "The Stories We Cannot Stop Telling",
    angleZh: "大脑天生是叙事机器：它将随机事件串联成有因有果的故事，以此赋予世界秩序感。本章探讨叙事谬误如何在金融、历史解释与个人传记中制造虚幻的确定性。",
    angleEn: "The brain is a narrative machine by default, weaving causally coherent stories from sequences that may be random. This essay examines how the narrative fallacy generates false certainty in financial hindsight, historical explanation, and the stories we tell about our own lives.",
    searchTerms: ["Nassim Taleb narrative fallacy","Roger Schank story understanding cognitive science","Vinod Goel syllogistic reasoning narrative bias"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with parallelism and tricolon, and lead your patterns with hedged assertion. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 10,
    slug: "10-sunk-cost",
    title: "The Tyranny of Yesterday's Spending",
    angleZh: "沉没成本谬误是经济学教科书里最常见的理性失败：我们坚守已无价值的事情，仅仅因为我们曾经为它付出。本章提出，这一「非理性」背后藏着关于承诺与身份认同的复杂逻辑。",
    angleEn: "The sunk cost fallacy is economics textbooks' favourite example of irrationality, yet persisting with a losing commitment may serve the social logic of loyalty and identity. This essay asks whether sunk cost reasoning is always a mistake or whether it sometimes tracks something real.",
    searchTerms: ["Richard Thaler sunk cost fallacy behavioral economics","Hal Arkes sunk cost research","Daniel Navarro Bayesian sunk cost reframing"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with colon-expansion, and lead your patterns with colon-then-pivot. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 11,
    slug: "11-framing-effects",
    title: "The Frame Is the Argument",
    angleZh: "同样的信息，用不同的方式呈现，会引发截然不同的选择。框架效应揭示了「中立表达」是个神话，并迫使我们追问：当选择随框架变化时，我们究竟在表达什么偏好？",
    angleEn: "The same information, framed differently, reliably produces different choices, which suggests that the neutral presentation of options is a myth. This essay asks what framing effects reveal about the nature of preference and whether the effect can ever be escaped.",
    searchTerms: ["Tversky Kahneman framing effects prospect theory","George Lakoff framing political language","Cass Sunstein nudge choice architecture"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with heavy noun phrase with participle clause, and lead your patterns with the-very-notion problematization. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 12,
    slug: "12-motivated-reasoning",
    title: "Reasoning Toward a Conclusion",
    angleZh: "动机性推理是确认偏误的强化版：我们不只是寻找支持既有信念的证据，而是像律师一样，先锁定结论，再为它辩护。本章探讨这一倾向的演化根源，以及理性辩论为何常常无法改变人心。",
    angleEn: "Motivated reasoning is confirmation bias in adversarial mode: the mind acts as its own defense attorney, working backward from a desired conclusion. This essay traces its evolutionary logic and asks why rational argument so often fails to shift deeply held beliefs.",
    searchTerms: ["Ziva Kunda motivated reasoning cognitive psychology","Jonathan Haidt moral intuition reasoning","Hugo Mercier Sperber argumentative theory of reasoning"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with subjunctive and counterfactual, and lead your patterns with evolutionary-logic framing. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 13,
    slug: "13-base-rate-neglect",
    title: "The Lonely Number",
    angleZh: "面对一个引人入胜的具体案例，我们往往忘记询问基础比率。本章以医疗诊断和法庭证据为场景，阐明基础比率忽视如何将小概率事件夸大为「令人信服的证明」。",
    angleEn: "A vivid individual case can crowd out the silent statistic that should anchor every probability judgement. This essay uses medical diagnosis and legal evidence to show how base-rate neglect turns a low-probability result into a compelling but mistaken conviction.",
    searchTerms: ["Kahneman Tversky base rate neglect representativeness heuristic","Gerd Gigerenzen natural frequency medical diagnosis","Sally Clark criminal case base rate"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with embedded relative clause as restrictive modifier, and lead your patterns with case-to-principle induction. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 14,
    slug: "14-hindsight-bias",
    title: "It Was Obvious All Along",
    angleZh: "事后诸葛的认知机制使我们相信，过去的结果是不可避免的，从而阻碍了真正的反事实思考。本章追问：历史与政策分析如何在后见偏误的泥沼中挣扎，又如何尝试逃脱。",
    angleEn: "Hindsight bias makes the past feel inevitable and forecloses the counterfactual thinking that genuine learning requires. This essay examines how historians and policy analysts struggle to reason about what could have happened and why the struggle matters.",
    searchTerms: ["Baruch Fischhoff hindsight bias creep","Philip Tetlock counterfactual history political science","Neal Roese hindsight bias review"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with fronted negative adverbial with subject-verb inversion, and lead your patterns with counterfactual unpacking. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 15,
    slug: "15-what-p-values-mean",
    title: "The Number That Broke Science",
    angleZh: "p 值最初是一种临时的统计惯例，却演变为科学发现的守门人，催生了 p 值操控与发表偏见。本章为非统计学读者解释这个数字究竟在测量什么，以及为何它一旦成为目标就失去了意义。",
    angleEn: "The p-value began as a rough heuristic and became the gatekeeper of scientific truth, a transformation that incentivized p-hacking and gutted the literature. This essay explains what the number actually measures and why, once it becomes a target, it ceases to be a measure.",
    searchTerms: ["Ronald Fisher p-value history significance testing","Andrew Gelman p-hacking statistical criticism","Goodhart's Law measurement target"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with it-cleft for contrastive focus, and lead your patterns with origin-then-corruption narrative. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 16,
    slug: "16-anchoring-effect",
    title: "The First Number Wins",
    angleZh: "锚定效应揭示了我们的判断在多大程度上被任意的初始数字所左右，哪怕我们明知这个数字是随机生成的。本章探讨这一机制在薪资谈判、司法量刑和拍卖中的深远后果。",
    angleEn: "Anchoring shows that an arbitrary initial number exerts a gravitational pull on our estimates even when we know it was randomly generated. This essay traces the effect from laboratory experiments to salary negotiations, judicial sentencing, and auction strategy.",
    searchTerms: ["Tversky Kahneman anchoring adjustment heuristic","Fritz Strack anchoring legal sentencing","Adam Galinsky negotiation anchoring"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with wh-cleft for emphasis, and lead your patterns with lab-to-life transfer argument. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 17,
    slug: "17-noise-in-judgment",
    title: "The Other Bias You Have Not Heard Of",
    angleZh: "我们已学会警惕偏误，但噪声，即针对同一案例的判断之间毫无意义的随机差异，同样是系统性错误的来源，而且更难被察觉。本章区分偏误与噪声，并探讨降低噪声的代价。",
    angleEn: "We have been trained to spot bias, but noise, the random scatter of judgements about identical cases, is an equally serious source of error and far harder to detect. This essay distinguishes bias from noise and asks what it costs to reduce the latter.",
    searchTerms: ["Kahneman Sibony Sunstein Noise book","Daniel Kahneman noise variability judgment","actuarial versus clinical prediction Meehl"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with apposition for precise definition, and lead your patterns with distinction-drawing clarification. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 18,
    slug: "18-knowing-what-you-know",
    title: "The Limits of the Examined Mind",
    angleZh: "反思能否修正偏误？证据表明，在没有正确反馈的情况下，内省往往只会固化既有的错误。本章以元认知研究作结，追问：一个意识到自身局限的心智，能走多远？",
    angleEn: "Can reflection correct bias? Evidence suggests that without accurate feedback, introspection tends to entrench existing errors rather than dissolve them. This essay closes by asking how far a mind that knows its own limits can stretch those limits.",
    searchTerms: ["Timothy Wilson introspection illusion social psychology","David Dunning metacognition self-assessment","Richard Feynman cargo cult science self-deception"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with concessive subordination with stance marking, and lead your patterns with open-question closing move. Fill the rest with other fresh constructions; every example must come from your own text.",
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
