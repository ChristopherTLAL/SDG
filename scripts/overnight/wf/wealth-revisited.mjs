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
  id: "wealth-revisited",
  cefr: "C1",
  register: 'c-level',
  noListening: true,
  modelFile: "src/data/english/books/mind-and-machine/01-hard-problem.ts",
  agentModel: 'sonnet',
};

const CHAPTERS = [
  {
    order: 1,
    slug: "01-what-money-is",
    title: "What Money Is",
    angleZh: "货币并非商品交换的媒介，而是社会债务关系的具象化。人类学家格雷伯与历史学家的发现，从根本上动摇了经济学教科书里那个「以物易物起源论」的神话。",
    angleEn: "Money is not a neutral lubricant for barter but a crystallised social debt. Anthropologist David Graeber and the historical record together dismantle the textbook myth of pre-monetary exchange.",
    searchTerms: ["David Graeber Debt the First 5000 Years","Felix Martin Money the Unauthorised Biography","Caroline Humphrey barter origin myth"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with wh-cleft (What money turns out to be, on the anthropological evidence, is a record of social obligation rather than a store of intrinsic value.), and lead your patterns with define-then-problematize. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 2,
    slug: "02-price-and-value",
    title: "The Gap Between Price and Value",
    angleZh: "价格是市场的信号，价值却是哲学争论的战场。从亚当·斯密的「劳动价值论」到新古典经济学的「边际效用」，经济学一直无法完全回避这个古老难题。",
    angleEn: "Price and value are not the same thing, yet economic theory persistently conflates them. From Smith's labour value to marginalism, the difficulty of separating cost from worth has never been resolved cleanly.",
    searchTerms: ["Adam Smith labour theory of value Wealth of Nations","William Stanley Jevons marginalist revolution","Michael Sandel What Money Can't Buy"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with nominalization (the conflation of price with value; the erosion of any clear distinction between cost and worth), and lead your patterns with concession-then-rebuttal. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 3,
    slug: "03-invisible-hand",
    title: "The Hand That Was Never Invisible",
    angleZh: "「看不见的手」是现代自由市场神学的基石，却也是经济思想史上被误读最深的隐喻之一。斯密原意远比后世引申者所呈现的克制。",
    angleEn: "The invisible hand is the founding metaphor of free-market ideology, yet Smith used the phrase only twice and meant something far more modest. Its career as a general principle is a story of selective reading.",
    searchTerms: ["Adam Smith invisible hand metaphor original context","Emma Rothschild Economic Sentiments Smith","Gavin Kennedy Adam Smith invisible hand misuse"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with it-cleft (It is precisely this modesty that later interpreters stripped away, converting a local observation about merchants into a universal law of social coordination.), and lead your patterns with reversal via historical counterexample. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 4,
    slug: "04-market-as-moral",
    title: "The Market as a Moral System",
    angleZh: "市场从未在道德真空中运行。契约的强制执行、产权的法律保障、信任的社会基础，都是非市场的力量在为市场撑腰。把市场说成是自然自发的，本身就是一种政治选择。",
    angleEn: "Markets presuppose enforceable contracts, property rights, and background trust, none of which markets themselves produce. To treat the market as natural is already to have made a political choice.",
    searchTerms: ["Karl Polanyi The Great Transformation embeddedness","Samuel Bowles The Moral Economy","Amartya Sen Development as Freedom market foundations"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with fronting and inversion (Central to any functioning market is a set of legal and moral arrangements that the market neither generates nor sustains on its own.), and lead your patterns with analogy as argument. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 5,
    slug: "05-interest-and-usury",
    title: "The Long Rehabilitation of Interest",
    angleZh: "历史上大多数文明都将收取利息视为道德罪恶，今天我们却把它视为资本配置的正常报酬。这一道德观的逆转既非理性进步的直线，也非单纯意识形态的篡权，而是一段错综复杂的政治经济史。",
    angleEn: "For most of human history lending at interest was condemned as usury. Its rehabilitation into normal capital income is not a straight march of rational enlightenment but a contested political and moral negotiation.",
    searchTerms: ["Aristotle Politics usury chrematistike","Norman Siebert usury Catholic moral theology history","Niall Ferguson Ascent of Money interest rate history"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with concessive subordination (Even if we grant that interest compensates a lender for deferring consumption, this account cannot by itself determine what rate is just, or whether any rate is.), and lead your patterns with the qualified generalization. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 6,
    slug: "06-comparative-advantage",
    title: "The Elegant Idea That Proves Too Much",
    angleZh: "大卫·李嘉图的比较优势原理是经济学最优雅的定理之一，几乎一切主流贸易理论都从它出发。但这份优雅恰恰遮蔽了它最重要的假设：生产要素不能跨国自由流动。",
    angleEn: "Ricardo's comparative advantage is perhaps economics' most elegant theorem, but its elegance is purchased by an assumption modern globalisation violates: that capital and labour stay home.",
    searchTerms: ["David Ricardo On the Principles of Political Economy comparative advantage","Dani Rodrik Globalisation Paradox","Paul Samuelson comparative advantage and factor mobility critique"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with conditional reasoning (Were capital truly immobile, as Ricardo assumed, then every nation would gain from specialisation; once it is not, the gains redistribute rather than simply multiply.), and lead your patterns with steel-man then turn. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 7,
    slug: "07-growth-imperative",
    title: "The Growth Imperative",
    angleZh: "经济增长是现代政治的头号共识，却在一个资源有限的星球上面临根本性的生物物理约束。质疑增长不是怀旧的乌托邦主义，而是对复利逻辑本身的严肃追问。",
    angleEn: "Growth is modern politics' first commandment, yet compound growth on a finite planet reaches biophysical limits that no efficiency gain can indefinitely postpone. Questioning it is not nostalgia but arithmetic.",
    searchTerms: ["Herman Daly steady-state economics","Tim Jackson Prosperity Without Growth","Kate Raworth Doughnut Economics planetary boundaries"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with hedging and epistemic modality (It would be rash to suppose that decoupling growth from resource use can proceed without limit; the evidence, on balance, tends to suggest otherwise.), and lead your patterns with reframing not-but. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 8,
    slug: "08-inequality-ratchet",
    title: "The Inequality Ratchet",
    angleZh: "皮凯蒂的核心公式 r > g 把不平等的自我强化描述为资本主义的内在逻辑，而非政策失败。批评者指出，历史数据的处理与对未来的外推，都需要远比公式本身更多的理论预设。",
    angleEn: "Piketty's r > g formula presents self-reinforcing inequality as capitalism's structural logic, not a policy accident. Critics argue that the data and the extrapolation carry heavier theoretical baggage than the equation reveals.",
    searchTerms: ["Thomas Piketty Capital in the Twenty-First Century","Lawrence Summers Piketty r greater g critique","Branko Milanovic Global Inequality"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with apposition (Piketty's central formula, the claim that the return on capital persistently outpaces economic growth, rests on historical readings that are themselves deeply contested.), and lead your patterns with reported-evidence framing. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 9,
    slug: "09-money-fiat",
    title: "Faith, Force, and Fiat Money",
    angleZh: "法定货币没有任何内在价值，仅凭国家强制与集体信念维系其流通。这并不使它脆弱，因为同样的机制同样维系着法律与产权本身。货币之谜不在其「无根」，而在国家权力的边界。",
    angleEn: "Fiat money has no intrinsic value, but neither do property rights or legal obligations. The same interplay of state enforcement and collective belief that makes money work also makes a contract binding; the puzzle is not money's groundlessness but the reach of sovereign power.",
    searchTerms: ["Stephanie Kelton The Deficit Myth MMT fiat","Perry Mehrling The New Lombard Street","Georg Friedrich Knapp State Theory of Money chartalism"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with parallelism and tricolon (What gives money its power is neither gold in a vault, nor an algorithm in a server, nor a clause in a constitution, but the shared expectation that others will accept it.), and lead your patterns with thought-experiment setup. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 10,
    slug: "10-labour-and-dignity",
    title: "Labour as More Than a Factor",
    angleZh: "标准经济学把劳动视为一种生产要素，与资本、土地并列。但劳动附着在有感受的人身上这一事实，使劳动力市场天然地无法像商品市场一样运转，这是波兰尼与凯恩斯都曾指出的。",
    angleEn: "Economics treats labour as a factor of production alongside capital and land, but labour cannot be separated from the person supplying it. This embeds asymmetries of power and dignity into every employment relation that commodity-market models cannot see.",
    searchTerms: ["Karl Polanyi labour fictitious commodity","John Maynard Keynes sticky wages General Theory","Elizabeth Anderson Private Government workplace power"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with heavy noun phrase with participle clause (Labour, being inseparable from the body and life history of the person who supplies it, resists the frictionless mobility that standard factor-price equalization requires.), and lead your patterns with the paradox opener. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 11,
    slug: "11-externalities",
    title: "The Costs That Markets Forget",
    angleZh: "外部性是标准市场失灵理论的核心概念，也是为政府干预辩护的标准工具。但一旦把气候变化的规模代入科斯定理，价格修复方案所依赖的前提便开始动摇。",
    angleEn: "Externalities are the textbook case for market failure, and carbon pricing is the textbook fix. But at the scale of climate change, the Coasian property-rights solution confronts transaction costs and moral questions it was never built to handle.",
    searchTerms: ["Ronald Coase The Problem of Social Cost externality theorem","Arthur Pigou The Economics of Welfare pigouvian tax","Nicholas Stern Stern Review climate externality scale"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with colon-expansion (Correcting a large externality requires something the market cannot supply on its own: an agreed price for a harm that affects everyone and is owned by no one.), and lead your patterns with the scaling argument. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 12,
    slug: "12-rent-and-rentiers",
    title: "The Return of the Rentier",
    angleZh: "地租、平台垄断租金与专利收益，在形式上各异，在逻辑上同构：都是对稀缺性的占有而非对价值的创造。凯恩斯曾预言食利阶层将自然消亡，结果恰好相反。",
    angleEn: "Ground rent, platform monopoly rents, and patent royalties look different but are structurally identical: returns from ownership of scarcity rather than creation of value. Keynes predicted the rentier would wither away; the twenty-first century has proved him spectacularly wrong.",
    searchTerms: ["John Maynard Keynes euthanasia rentier General Theory","Mariana Mazzucato The Value of Everything rent extraction","Brett Christophers Rentier Capitalism"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with subjunctive and counterfactual (Had Keynes been right that the rentier would be euthanised by abundance, the twenty-first century would look rather different from how it does.), and lead your patterns with comparative framing. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 13,
    slug: "13-behavioral-markets",
    title: "When Homo Economicus Met Reality",
    angleZh: "行为经济学用心理学实验把「理性经济人」从教科书的宝座上拉了下来，却同时面临一个尴尬：如果人类系统性地非理性，市场价格还能算是有效信号吗？",
    angleEn: "Behavioural economics demonstrated that systematic irrationality is the norm, not the exception. This created a tension at the heart of the discipline: if agents are reliably irrational, how much confidence can we place in market prices as efficient signals?",
    searchTerms: ["Daniel Kahneman Thinking Fast and Slow prospect theory","Richard Thaler nudge behavioural market design","Robert Shiller Irrational Exuberance market efficiency critique"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with relative clause stacking (The rational actor, whose preferences are stable, whose information is complete, and whose choices are immune to framing, has no empirical counterpart.), and lead your patterns with the two-cultures bridge. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 14,
    slug: "14-financialization",
    title: "When Finance Outgrew the Economy",
    angleZh: "过去半个世纪，金融部门在GDP中的占比急剧扩张，大量资本从实体生产流向资产投机。金融化是经济繁荣的助推器，还是在用明天的信用透支今天的增长？",
    angleEn: "Since the 1970s, finance has grown faster than the real economy it was meant to serve. Whether financialisation lubricates growth or merely redistributes existing claims on wealth is a question with large political consequences.",
    searchTerms: ["Adair Turner Between Debt and the Devil financialisation","Rana Foroohar Makers and Takers","Gerald Epstein Financialization and the World Economy"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with passive voice with agent suppression (When the risk of default is dispersed across thousands of instruments, accountability is lost and the question of who should bear the loss goes unanswered.), and lead your patterns with the missing variable move. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 15,
    slug: "15-property-rights",
    title: "Property as Political Invention",
    angleZh: "产权被自由主义传统视为先于政府而存在的自然权利，但历史与人类学的证据表明，它是国家权力的产物，而非其前提。这一区别在土地、数据与遗传资源等领域尤其关键。",
    angleEn: "Liberal theory often treats property rights as pre-political natural rights that states merely protect. History suggests the opposite: property is constituted by the state, and what counts as ownable is a continuous political decision.",
    searchTerms: ["John Locke Second Treatise property natural rights","C.B. Macpherson Political Theory of Possessive Individualism","Hernando de Soto Mystery of Capital property formalization"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with reported speech with epistemic verb (Locke maintained that individuals acquire legitimate property rights through their own labour; critics contend that this merely licenses the first act of enclosure.), and lead your patterns with definition with unstated assumption. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 16,
    slug: "16-commons-and-enclosure",
    title: "The Commons Were Not Tragic",
    angleZh: "加雷特·哈丁的「公地悲剧」是政策辩论中引用最广的经济学寓言之一，但奥斯特罗姆的田野调查发现，长久存续的公共资源管理在现实中普遍存在。哈丁的「寓言」从一开始就预设了无制度约束的个体。",
    angleEn: "Garrett Hardin's tragedy of the commons is among the most cited economic parables in policy debate, yet Elinor Ostrom's fieldwork showed that self-governing commons have survived for centuries. The tragedy was never about commons but about unregulated open-access regimes.",
    searchTerms: ["Garrett Hardin Tragedy of the Commons 1968","Elinor Ostrom Governing the Commons Nobel","David Feeny commons regimes open access distinction"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with existential there-construction (There is, as Ostrom documented across dozens of cases, a third path between private enclosure and state control: the governed commons, with its own rules, sanctions, and long memory.), and lead your patterns with hedged assertion. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 17,
    slug: "17-redistribution-debate",
    title: "The Arithmetic of Redistribution",
    angleZh: "再分配政策的效率代价究竟有多大？在「公平与效率的权衡」这一经典表述背后，是大量难以达成共识的实证争议，以及对「效率」本身的不同定义。",
    angleEn: "The efficiency cost of redistribution is the central empirical dispute in fiscal policy, yet the familiar trade-off framing conceals profound disagreements about what counts as efficient and over what time horizon the calculation should run.",
    searchTerms: ["Arthur Okun Equality and Efficiency leaky bucket","Emmanuel Saez top marginal tax rate optimal","Gregory Mankiw optimal taxation and redistribution debate"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with correlative conjunction (The choice is not only between redistribution and growth but also between different definitions of what a well-functioning economy is supposed to achieve.), and lead your patterns with tripartite structure. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 18,
    slug: "18-economy-and-flourishing",
    title: "Beyond GDP",
    angleZh: "GDP是政策制定者最依赖的经济指标，却从一开始就不是衡量福祉的工具。在测量焦虑、孤独、生态损耗和无酬劳动方面，它结构性地失明。对其替代或补充方案的讨论，是一场关于什么才是「好的经济」的政治哲学争论。",
    angleEn: "GDP was never designed to measure wellbeing, yet it has become the primary metric of economic success. Alternative measures expose not a technical shortfall but a prior political choice about what an economy is ultimately for.",
    searchTerms: ["Simon Kuznets GDP original warning Senate testimony","Joseph Stiglitz Amartya Sen Fitoussi Commission measuring wellbeing","Diane Coyle GDP A Brief but Affectionate History"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with absolute construction (Its original caveats noted and then set aside, GDP hardened from a provisional wartime measure into the single number by which governments judge themselves and are judged.), and lead your patterns with the open question close. Fill the rest with other fresh constructions; every example must come from your own text.",
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
