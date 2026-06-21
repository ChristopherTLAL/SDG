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
  id: "examined-life",
  cefr: "C1",
  register: 'c-level',
  noListening: true,
  modelFile: "src/data/english/books/mind-and-machine/01-hard-problem.ts",
  agentModel: 'sonnet',
};

const CHAPTERS = [
  {
    order: 1,
    slug: "01-trolley-problem",
    title: "The Trolley and the Lever",
    angleZh: "电车难题为何在半个世纪后仍然让哲学家争论不休？本文论证，它的价值不在于给出答案，而在于揭示我们道德直觉内部的真实裂缝。",
    angleEn: "The trolley problem has split moral philosophers for fifty years not because it is unrealistic but because it exposes a genuine fault line inside ordinary moral intuition itself.",
    searchTerms: ["Philippa Foot trolley problem 1967","Judith Jarvis Thomson doctrine of double effect","Joshua Greene dual-process moral psychology fMRI"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with nominalization, and lead your patterns with define-then-problematize. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 2,
    slug: "02-experience-machine",
    title: "The Machine That Gives You Everything",
    angleZh: "诺齐克的「体验机器」思想实验揭示：如果人们宁可拒绝接入，那就说明我们在意的并非仅仅是感受良好，而是真实地与世界相连。",
    angleEn: "Robert Nozick's experience machine thought experiment reveals that what most people value is not pleasant experience alone but genuine contact with an unmediated reality, and that revelation reshapes how we think about happiness.",
    searchTerms: ["Robert Nozick experience machine Anarchy State and Utopia 1974","hedonism versus desire satisfaction welfare theories","Felipe De Brigard experience machine empirical studies 2010"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with wh-cleft, and lead your patterns with thought-experiment setup. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 3,
    slug: "03-veil-of-ignorance",
    title: "Choosing Behind the Veil",
    angleZh: "罗尔斯的「无知之幕」要求我们想象自己不知道将成为社会中的哪个人，再来设计规则。本文考察这一装置是否真的能把自私变成公正，还是它只是把一种特定的风险态度伪装成了中立。",
    angleEn: "Rawls's veil of ignorance is the most influential thought experiment in twentieth-century political philosophy, yet critics argue it smuggles in a particular attitude toward risk and thereby reaches contestable conclusions by apparently neutral means.",
    searchTerms: ["John Rawls A Theory of Justice veil of ignorance original position","John Harsanyi utilitarian critique of Rawls and risk","Robert Nozick entitlement theory libertarianism critique Rawls"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with it-cleft, and lead your patterns with concession-then-rebuttal. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 4,
    slug: "04-peter-singer-drowning-child",
    title: "The Drowning Child and the Distant Poor",
    angleZh: "彼得·辛格论证，若你能以小代价拯救一条生命，距离的远近不应成为道德上的理由。本文直面这一论证的力量，并追问它是否要求我们彻底放弃对自己生活的特殊关怀。",
    angleEn: "Peter Singer's drowning-child argument has the form of a logical proof, yet if it is valid our ordinary comfortable lives stand in permanent moral default, and that conclusion forces us to ask whether the logic has missed something or whether we have simply been evading it.",
    searchTerms: ["Peter Singer Famine Affluence and Morality 1972","Samuel Scheffler agent-relative prerogatives","Susan Wolf moral saints demandingness objection philosophy"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with conditional reasoning with if-then chain, and lead your patterns with steel-man then turn. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 5,
    slug: "05-moral-luck",
    title: "The Role of Luck in Blame",
    angleZh: "两名司机以同等鲁莽的方式驾驶，其中一人恰好撞到了人。我们对他的谴责更重，但这公平吗？道德运气的问题动摇了我们关于责任的最基本信念。",
    angleEn: "Two reckless drivers behave identically, but one happens to hit a pedestrian; our blame falls harder on that one, and the philosopher Thomas Nagel argued this reveals that moral responsibility is partly determined by factors entirely beyond a person's control.",
    searchTerms: ["Thomas Nagel moral luck 1976 Mortal Questions","Bernard Williams moral luck resultant circumstantial","Michael Moore causation criminal responsibility tort"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with fronting and inversion, and lead your patterns with reported-evidence framing. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 6,
    slug: "06-effective-altruism-rise-fall",
    title: "When Doing the Most Good Goes Wrong",
    angleZh: "有效利他主义运动承诺用理性计算把善意变成最大善果，却以FTX崩溃和末日论争议收场。本文探讨这一哲学实验暴露了哪些关于道德推理本身的深层问题。",
    angleEn: "Effective altruism promised to make charity as rigorous as science, yet the movement's trajectory from Peter Singer's Oxford seminars to Sam Bankman-Fried's collapse raises uncomfortable questions about what happens when a moral framework optimizes too hard.",
    searchTerms: ["Will MacAskill What We Owe the Future longtermism","Sam Bankman-Fried FTX collapse effective altruism","Amia Srinivasan effective altruism critique London Review 2015"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with concessive subordination, and lead your patterns with historical-arc framing. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 7,
    slug: "07-obligations-future-generations",
    title: "What We Owe to People Not Yet Born",
    angleZh: "尚未存在的人能有权利吗？气候变化、核废料处置、债务累积，这些都要求我们对这个问题给出答案，而每一种理论都留下了令人不安的空白。",
    angleEn: "Our most consequential decisions affect billions of people who do not yet exist and cannot consent or protest, and the absence of a coherent theory of obligations to future generations is not a philosophical curiosity but a practical emergency.",
    searchTerms: ["Derek Parfit Reasons and Persons Part IV future generations","Samuel Scheffler death and the afterlife lectures humanity","John Broome climate ethics intergenerational justice"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with apposition, and lead your patterns with reframing not-but. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 8,
    slug: "08-non-identity-problem",
    title: "The People We Will Never Wrong",
    angleZh: "帕菲特的「非同一性问题」揭示：如果我们当初的污染决策是未来某人之所以存在的原因，我们怎么能说我们伤害了他？这一悖论颠覆了常规的因果伤害观。",
    angleEn: "Derek Parfit demonstrated that if we choose a policy today that causes a different person to exist tomorrow rather than a better-off one, we may have made the world worse without harming any specific individual, a conclusion that breaks the usual machinery of moral reasoning.",
    searchTerms: ["Derek Parfit non-identity problem Reasons and Persons","David Boonin non-identity problem reply future persons","reproductive ethics climate change identity future generations"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with hedging and epistemic modality, and lead your patterns with paradox-statement. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 9,
    slug: "09-moral-realism",
    title: "Are There Moral Facts?",
    angleZh: "当我们说「奴隶制是错的」，我们是在陈述一个客观事实，还是在表达一种强烈的感受？道德实在论与反实在论之争决定了我们能否真正理性地讨论伦理问题。",
    angleEn: "The question of whether moral claims describe a mind-independent reality or merely express attitudes is not a dry academic puzzle: the answer determines whether moral argument is genuinely rational or merely the negotiation of preferences dressed in logical clothing.",
    searchTerms: ["J.L. Mackie moral error theory Inventing Right and Wrong","Derek Parfit On What Matters convergence moral realism","Allan Gibbard expressivism Wise Choices Apt Feelings"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with colon-expansion, and lead your patterns with analogy as argument. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 10,
    slug: "10-moral-intuitions-vs-arguments",
    title: "When to Trust Your Gut",
    angleZh: "有时一个论证看上去无懈可击，但结论却令人反感到无法接受。道德哲学家称之为「通过反例推翻前提」：这究竟是理性的最终防线，还是偏见的最后避难所？",
    angleEn: "Philosophers call it tollensing the ponens: when an argument is valid but its conclusion is monstrous, the right response may be to reject a premise rather than accept the conclusion, raising the question of when intuitions have the authority to veto logic.",
    searchTerms: ["Derek Parfit tollensing the ponens intuitions arguments","Jeff McMahan killing in war intuitions versus arguments","Peter Singer override intuitions utilitarian moral psychology"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with heavy noun phrase with embedded relative clause, and lead your patterns with hedged assertion. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 11,
    slug: "11-impartiality-and-special-obligations",
    title: "Do You Owe More to Your Own Children?",
    angleZh: "纯粹的功利主义要求我们平等地对待每一个人，但几乎所有人都认为我们对自己的孩子、朋友、同胞负有特殊义务。这种偏爱是道德上的瑕疵，还是美好生活的核心构成？",
    angleEn: "Impartialism asks us to treat every person's welfare as equally worthy of concern, yet any parent who genuinely tried to live by this principle would strike most observers as not admirably just but disturbingly cold, and that reaction may itself carry philosophical weight.",
    searchTerms: ["Bernard Williams integrity objection utilitarianism one thought too many","Samuel Scheffler agent-relative prerogatives Rejection of Consequentialism","Susan Wolf moral saints Philosophy and Public Affairs 1982"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with parallelism and tricolon, and lead your patterns with case-study-then-generalize. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 12,
    slug: "12-consent-and-the-social-contract",
    title: "Did You Ever Agree to the Rules?",
    angleZh: "社会契约论声称政治权威来自人民的同意，但没有人真正签过这份契约。理论家们用「假设同意」「默示同意」来填补这个空白，但每一种方案都有其致命弱点。",
    angleEn: "Social contract theory grounds political authority in consent, but no living person has signed any contract with a government, and the various substitutes philosophers have proposed (tacit, hypothetical, or ongoing consent) each carry a different way of failing to do the job.",
    searchTerms: ["John Locke tacit consent Second Treatise of Government","David Hume Of the Original Contract critique consent","A. John Simmons political obligation philosophical anarchism"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with parenthetical elaboration within a complex sentence, and lead your patterns with enumeration-then-synthesis. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 13,
    slug: "13-animal-ethics",
    title: "The Boundary of Moral Concern",
    angleZh: "我们将道德关怀的边界划在哪里，以及为何划在那里，是对我们道德框架最有揭示性的检验之一。本文追问，将动物排除在外的标准理由能否经得住仔细审视。",
    angleEn: "Where we draw the boundary of moral consideration, and by what criterion, is one of the most revealing tests of any ethical framework, and the standard reasons given for excluding non-human animals turn out to mark lines that cut across our other moral commitments in uncomfortable ways.",
    searchTerms: ["Peter Singer Animal Liberation speciesism utilitarian","Christine Korsgaard Fellow Creatures Kantian animal ethics","Jeff McMahan ethics of killing different species cognitive criteria"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with fronted wh-clause as subject, and lead your patterns with example-to-principle. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 14,
    slug: "14-moral-responsibility-and-free-will",
    title: "Can We Blame Anyone at All?",
    angleZh: "如果神经科学和决定论是对的，每一个道德上的「选择」都只是更早原因的结果，那么赞美和谴责的整个道德实践是否建立在一个关于人类自由的幻觉之上？",
    angleEn: "Neuroscience and determinism together suggest that every choice is the product of causes stretching back before the chooser was born, and if that is true, the entire practice of holding people morally responsible rests on a picture of human agency that may be false.",
    searchTerms: ["Peter Strawson Freedom and Resentment reactive attitudes 1962","Daniel Dennett free will compatibilism Elbow Room","Derk Pereboom hard incompatibilism Living Without Free Will"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with subjunctive and counterfactual construction, and lead your patterns with accumulation-then-turn. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 15,
    slug: "15-demandingness-of-morality",
    title: "How Much Does Morality Ask of You?",
    angleZh: "如果道德的要求是无止境的，它最终会侵蚀使生活得以值得过的那些特殊依恋和个人计划。本文论证，对这种「过度苛求」的抵制不是道德上的软弱，而是对道德本身价值的合理主张。",
    angleEn: "A moral theory that demands everything a person could give, leaving no legitimate room for personal projects or partial commitments, may undermine the very kinds of life that make morality worth caring about, and that objection belongs inside ethical theory rather than outside it.",
    searchTerms: ["Samuel Scheffler demandingness objection consequentialism","Susan Wolf meaningful life moral demands Beyond Blame","Frances Kamm deontological constraints options prerogatives"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with relative clause with internal modification, and lead your patterns with qualified generalization. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 16,
    slug: "16-lying-and-deception",
    title: "Is Honesty Always a Virtue?",
    angleZh: "康德坚持即使向追杀你朋友的凶手也不能撒谎，这个极端立场让后来的大多数哲学家感到不安。本文追问，这种不安是否揭示了义务论伦理学内部真正的张力。",
    angleEn: "Kant's insistence that lying is wrong even to a murderer at the door is the case most often used to discredit absolute deontology, yet dismissing it too quickly lets us off a hook we should stay on: the real question is whether honesty is a duty with exceptions or a default that can be overridden.",
    searchTerms: ["Kant On a supposed right to lie from philanthropy 1797","Christine Korsgaard The Right to Lie Kant on Dealing with Evil","Alasdair MacIntyre lying deception virtue ethics After Virtue"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with it-cleft with shifted focus, and lead your patterns with pivot-and-claim. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 17,
    slug: "17-justice-and-rectification",
    title: "Who Owes What for Wrongs Long Past?",
    angleZh: "历史不公正的受益者对其受害者的后代负有赔偿义务吗？本文审视这一问题背后关于个人责任、跨代义务与国家身份的复杂假设。",
    angleEn: "Reparations for historical injustice require that we assign obligations to people who did not commit the original wrong and benefits to people who did not directly suffer it, and making that transfer plausible demands a theory of collective identity that most liberal political philosophy has been reluctant to provide.",
    searchTerms: ["Jeremy Waldron supersession thesis reparations historical injustice","Janna Thompson Taking Responsibility for the Past intergenerational","Ta-Nehisi Coates The Case for Reparations Atlantic 2014"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with reporting verb with that-clause nominalized, and lead your patterns with question-and-deferral. Fill the rest with other fresh constructions; every example must come from your own text.",
  },
  {
    order: 18,
    slug: "18-good-life-and-moral-life",
    title: "Can a Good Person Have a Good Life?",
    angleZh: "苏格拉底相信美德就是幸福，而现代道德哲学有时使两者看起来水火不容。本文回到这一古老问题：过一个从道德上说得过去的人生，究竟会让你的生活更丰富还是更贫乏？",
    angleEn: "Socrates held that virtue and happiness are the same thing, but the demands examined across this book suggest they may pull apart: a morally serious life risks foreclosing the partiality, comfort, and complicity that make ordinary flourishing possible, and that tension is where moral philosophy begins again.",
    searchTerms: ["Aristotle eudaimonia Nicomachean Ethics Book I flourishing","Susan Wolf Meaning in Life and Why It Matters lectures","Bernard Williams Ethics and the Limits of Philosophy moral residue"],
    avoidConstructions: "This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with. For THIS chapter, lead your grammar with colon-expansion with tripartite elaboration, and lead your patterns with appeal-to-consequence. Fill the rest with other fresh constructions; every example must come from your own text.",
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
