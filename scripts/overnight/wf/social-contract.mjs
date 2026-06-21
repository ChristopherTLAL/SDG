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
  id: "social-contract",
  cefr: "C2",
  register: 'c-level',
  noListening: true,
  modelFile: "src/data/english/books/mind-and-machine/01-hard-problem.ts",
  agentModel: 'sonnet',
};

const CHAPTERS = [
  {
    order: 1,
    slug: "01-veil-of-ignorance",
    title: "Behind the Veil",
    angleZh: "罗尔斯的「无知之幕」究竟要求我们忘掉什么，又为何这种遗忘本身就是一种深刻的道德洞见？",
    angleEn: "What Rawls's original position actually demands we forget, and why that structured forgetting is itself a profound moral argument for equal basic liberties.",
    searchTerms: ["John Rawls A Theory of Justice","original position veil of ignorance","difference principle critique"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with wh-cleft (What the veil requires is not ignorance of facts but ignorance of identity), and lead your patterns with define-then-problematize. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 2,
    slug: "02-state-of-nature",
    title: "The State of Nature Was Never Natural",
    angleZh: "霍布斯、洛克与卢梭想象中的「自然状态」从未真实存在，却为何至今仍是政治哲学不可绕过的虚构装置？",
    angleEn: "The state of nature is an acknowledged fiction, yet its power as a philosophical device lies precisely in what it forces us to ask about the justification of political authority.",
    searchTerms: ["Hobbes Leviathan state of nature","Locke Second Treatise government","Rousseau social contract"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with it-cleft (It is precisely because the state of nature never existed that its work in the argument is conceptual, not historical), and lead your patterns with thought-experiment setup. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 3,
    slug: "03-consent-and-its-fictions",
    title: "The Consent We Never Gave",
    angleZh: "没有人真正「同意」过他们出生于其中的社会契约，而「默示同意」理论如何勉强维持，又在哪里最终崩溃？",
    angleEn: "Tacit consent theories try to ground political obligation in residence and participation, but the exit costs that make consent real are precisely what makes it coerced.",
    searchTerms: ["tacit consent Locke political obligation","David Hume consent metaphor","A John Simmons moral principles political obligations"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with concessive subordination (Even if residence counts as consent, the precondition of a genuine alternative removes the consent's moral force), and lead your patterns with concession-then-rebuttal. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 4,
    slug: "04-liberty-and-its-limits",
    title: "Two Freedoms, One Word",
    angleZh: "以赛亚·柏林对「消极自由」与「积极自由」的区分，是政治话语中最常被错用的概念对，其误读如何催生了截然对立的政治主张？",
    angleEn: "Isaiah Berlin's distinction between negative and positive liberty is the most consistently misread concept in political philosophy, and the confusion has real consequences for how states justify their interventions.",
    searchTerms: ["Isaiah Berlin two concepts of liberty","positive negative liberty debate","Philip Pettit republican freedom"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with nominalization (The conflation of the two freedoms is not a semantic slip but a political manoeuvre), and lead your patterns with reframing not-but. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 5,
    slug: "05-legitimacy-and-authority",
    title: "Why Should I Obey?",
    angleZh: "国家的「合法性」与「权威」是两个不同的问题：一个国家可以在道德上站得住脚却无权要求服从，这种区分在哪些具体情形中最具杀伤力？",
    angleEn: "Legitimacy and authority are distinct: a state can be legitimate without generating an obligation to obey, a gap that anarchist political philosophy has long occupied and which liberal theory has never fully closed.",
    searchTerms: ["Joseph Raz service conception authority","anarchism political obligation Wolff","legitimacy authority distinction"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with apposition (The anarchist claim, that no state has demonstrated a title to command mere by existing, is harder to dismiss than most political scientists suppose), and lead your patterns with steel-man then turn. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 6,
    slug: "06-justice-as-fairness",
    title: "Fairness Is Not Equality",
    angleZh: "罗尔斯的「差别原则」允许不平等，但要求不平等对最弱势群体有利，这一貌似矛盾的立场如何在道德哲学中自我辩护？",
    angleEn: "Rawls's difference principle permits inequality only when it benefits the least advantaged, a position that looks paradoxical on its surface but rests on a distinctive argument about what impartial choosers would rationally select.",
    searchTerms: ["Rawls difference principle","luck egalitarianism Elizabeth Anderson critique","Norman Daniels just health"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with conditional reasoning (Were the difference principle to be rejected, the alternative of strict equality would leave everyone worse off than under a moderately unequal arrangement that raises the minimum), and lead your patterns with hedged assertion. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 7,
    slug: "07-the-market-and-the-contract",
    title: "What the Market Cannot Justify",
    angleZh: "自由市场理论常被当作社会契约的自然结果，但诺齐克的持有理论与罗尔斯的正义论为何在表面协议之下存在根本裂痕？",
    angleEn: "Nozick's entitlement theory and Rawlsian liberalism share procedural language but differ in whether historical acquisition or hypothetical choice is the foundation of just holdings, a gap that shapes every debate about redistribution.",
    searchTerms: ["Nozick Anarchy State and Utopia","entitlement theory redistribution critique","Rawls Nozick debate property"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with fronting and inversion (Central to Nozick's objection is the claim that patterned principles must continuously interfere with the free choices that produced the distribution), and lead your patterns with reported-evidence framing. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 8,
    slug: "08-democracy-and-its-enemies",
    title: "Majority Rule and Its Discontents",
    angleZh: "多数决原则在民主理论中看似不证自明，但少数权利与多数意志之间的张力，正是立宪主义存在的根本理由。",
    angleEn: "Majority rule is the procedural default of democracy, yet the constitutional limits placed on majorities are not anti-democratic but rather constitutive of democracy itself, because they protect the preconditions of future democratic deliberation.",
    searchTerms: ["constitutional democracy Dworkin rights as trumps","tyranny of majority Tocqueville","deliberative democracy Habermas"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with parallelism and tricolon (What majorities can legitimately decide, what they cannot, and who adjudicates the difference: these three questions define the entire field of constitutional law), and lead your patterns with extended-scope paradox. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 9,
    slug: "09-the-fragility-of-democracy",
    title: "How Democracies Die from Within",
    angleZh: "当代民主的崩溃往往不是通过军事政变，而是通过选举赢家对体制的逐步侵蚀，这一「自杀式」民主终结模式在历史上如何一再复现？",
    angleEn: "The paradigmatic threat to twenty-first-century democracy is not the coup but the gradual erosion of norms by elected leaders who use the legitimacy of the ballot to dismantle the institutions that make elections meaningful.",
    searchTerms: ["Levitsky Ziblatt How Democracies Die","democratic backsliding Hungary Poland","Ginsburg Huq How to Save a Constitutional Democracy"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with hedging and epistemic modality (It would be an overstatement to say that democratic erosion is irreversible once begun, yet the empirical record offers little comfort to those who believe institutions are self-repairing), and lead your patterns with illustration-then-generalization. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 10,
    slug: "10-social-trust-and-the-contract",
    title: "Trust as the Invisible Infrastructure",
    angleZh: "社会资本与制度信任不只是民主的副产品，而是其运转的前提条件，那么当信任瓦解时，是什么先走的：制度，还是信任？",
    angleEn: "Social trust is not merely a pleasant feature of healthy democracies but a prior condition without which the institutions of the social contract cannot function, making the erosion of trust both cause and symptom of democratic crisis.",
    searchTerms: ["Robert Putnam Bowling Alone social capital","Onora O'Neill trust Reith lectures","generalized trust political institutions"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with colon-expansion (There is a structural irony here: the institutions designed to generate trust can only work if enough trust already exists to make people use them), and lead your patterns with analogy as argument. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 11,
    slug: "11-global-justice",
    title: "Does the Contract Stop at the Border?",
    angleZh: "传统社会契约论以民族国家为基本单元，但全球不平等与气候危机迫使我们追问：正义原则是否也要求一份跨越国境的契约？",
    angleEn: "Classical social contract theory was designed for bounded societies, and extending its logic to the global level either demands radical redistribution between nations or requires accepting that moral luck of birthplace is beyond the reach of justice.",
    searchTerms: ["Thomas Pogge global justice institutions","Rawls Law of Peoples critique","cosmopolitanism nationalism debate"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with heavy noun phrases and participle clauses (The argument for a global difference principle, often presented as a straightforward extension of domestic Rawlsianism, carries with it implications that most liberal democracies are unprepared to accept), and lead your patterns with qualified generalization. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 12,
    slug: "12-communitarianism-and-its-challenge",
    title: "The Unencumbered Self Is a Fiction",
    angleZh: "社群主义对自由主义的核心挑战：「负重的自我」而非自由主义想象中的「无负担自我」，才是真实的道德行动者；这一批评在哪些方面真正击中了要害？",
    angleEn: "The communitarian challenge to liberal political theory is not that community matters but that the very self liberals invoke as the chooser of values is already constituted by a community it did not choose, making the original position an incoherent fantasy.",
    searchTerms: ["Michael Sandel Liberalism and the Limits of Justice","Charles Taylor Sources of the Self communitarian","Alasdair MacIntyre After Virtue"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with subjunctive and counterfactual (Were the self truly unencumbered at the moment of choosing, no thickness of cultural inheritance would survive the veil, and that is precisely what communitarians deny), and lead your patterns with point-counterpoint pivot. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 13,
    slug: "13-recognition-and-difference",
    title: "The Contract's Invisible Exclusions",
    angleZh: "历史上的社会契约将女性、奴隶和殖民地人口排除在外，这不只是执行失误，而是契约论本身在理论结构上的深层缺陷。",
    angleEn: "The historical exclusions of women, enslaved people, and colonised populations from social contract theory are not accidental omissions but reveal a structural dependency: the contract's universal language required particular bodies to be rendered invisible.",
    searchTerms: ["Carole Pateman The Sexual Contract","Charles Mills The Racial Contract","feminist political theory social contract critique"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with passive constructions for agent suppression (The bodies rendered invisible by the contract are never named as absent; the passive voice of classical theory enacts the exclusion it refuses to discuss), and lead your patterns with framing-by-contrast. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 14,
    slug: "14-civil-disobedience",
    title: "When Lawbreaking Is a Duty",
    angleZh: "公民不服从作为一种政治行动，其道德正当性如何依赖于它同时承认被违反之法律的整体权威，这一悖论构成了它区别于普通违法行为的关键。",
    angleEn: "Civil disobedience is distinguished from mere lawbreaking by its public, nonviolent, and communicative character, but its moral weight depends on a paradox: it appeals to principles of justice that only make sense within the legal order it is breaking.",
    searchTerms: ["Rawls civil disobedience theory","Martin Luther King Letter from Birmingham Jail","Peter Singer democracy and disobedience"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with correlative construction (Not only does civil disobedience accept the legal penalty as part of its address to the majority, but it also thereby distinguishes itself from mere self-interested lawbreaking), and lead your patterns with paradox-then-resolution. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 15,
    slug: "15-punishment-and-the-contract",
    title: "Why Do We Punish?",
    angleZh: "刑罚的三种正当性理论（报应论、威慑论、改造论）与社会契约论如何相互关联，三者对「国家惩罚公民」这一权力的来源各给出了何种不同的账单？",
    angleEn: "Retributivism, deterrence theory, and rehabilitative accounts of punishment each rest on a different understanding of what the social contract creates, and that difference determines whether incarceration is ever justified as an end in itself.",
    searchTerms: ["Kant retributivism punishment theory","consequentialist deterrence Bentham","mass incarceration social contract Angela Davis"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with absolute phrase and participial clause (Each theory granting the state a different mandate, the choice between them is not a technical matter but a decision about what kind of society the contract is meant to create), and lead your patterns with competing-frameworks survey. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 16,
    slug: "16-distributive-justice-and-luck",
    title: "Luck, Desert, and the Egalitarian Wager",
    angleZh: "若一个人的才能、出身和运气都是「道德上任意的」，那么什么样的回报才算「应得的」？luck egalitarianism如何在试图拯救平等时陷入了另一种困境。",
    angleEn: "Luck egalitarianism holds that inequalities arising from brute luck are unjust while those flowing from genuine choice are not, but drawing that distinction in practice produces intrusive inquiries into personal decisions that critics call harshly judgmental.",
    searchTerms: ["G.A. Cohen luck egalitarianism","Elizabeth Anderson luck egalitarianism critique","Samuel Scheffler moral arbitrariness"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with restrictive relative clause for precision (The inequality that luck egalitarianism targets is specifically the kind that cannot be traced to any decision the disadvantaged person could reasonably have made otherwise), and lead your patterns with principle-tested-by-case. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 17,
    slug: "17-deliberative-democracy",
    title: "Talking Ourselves Into Agreement",
    angleZh: "审议民主理论主张，合法的政治决策必须经由理性公开讨论而来，而非仅凭票数，但现实中的人类讨论为何常常使两极分化加剧而非减缓？",
    angleEn: "Deliberative democracy promises that reasoned public discourse can transform preferences and generate legitimate decisions, yet the empirical literature on group polarisation suggests that discussion more often intensifies existing commitments than moderates them.",
    searchTerms: ["Habermas communicative action deliberative democracy","Cass Sunstein polarisation echo chambers","deliberative polls James Fishkin"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with reported attribution and indirect speech (Habermas contends that legitimate norms are those to which all affected parties could agree under conditions of open and undistorted communication, a claim that critics have found difficult to operationalise), and lead your patterns with theory-meets-evidence tension. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 18,
    slug: "18-the-contract-reconsidered",
    title: "After the Contract",
    angleZh: "社会契约从一个关于国家起源的历史叙事，演变为关于政治合法性的反事实设计工具，这一转变标志着现代政治哲学的成熟，也留下了它最核心的未解之谜：谁有资格参与契约的缔结？",
    angleEn: "The trajectory of social contract theory from Hobbes to Rawls and beyond is a movement from historical fiction to hypothetical procedure, and the question it still cannot answer, who counts as a party, reveals the limits of contractarian thinking and the work that remains for political philosophy.",
    searchTerms: ["Martha Nussbaum capabilities approach social contract","non-human animals future generations social contract","Will Kymlicka Contemporary Political Philosophy"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with ellipsis and gapping for compression (Hobbes asked what the state could do for us; Rawls, what we would accept from behind the veil; Nussbaum, what we owe to those who cannot speak for themselves), and lead your patterns with colon-expansion. Fill the rest with other fresh constructions; every example must come from your own text.",
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
