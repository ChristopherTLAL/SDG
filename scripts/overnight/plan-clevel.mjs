export const meta = {
  name: 'plan-clevel-books',
  description: 'Design 18-chapter idea-essay lineups for the C-level books; each agent writes scripts/overnight/lineups/<id>.json',
  phases: [{ title: 'Plan', detail: 'one agent per C-level book designs 18 distinct idea-essay chapters and writes its lineup JSON' }],
};

const SAMPLE = 'src/data/english/books/mind-and-machine/01-hard-problem.ts';
const CREF = '.claude/skills/daily-english/references/c-level-writing.md';

const BOOKS = [
  { id: 'mind-and-machine', cefr: 'C1', hint: 'Slugs 01-hard-problem (order 1, the hard problem of consciousness) and 09-extended-mind (order 9, the extended mind) ALREADY EXIST. Reuse those exact slugs and topics for orders 1 and 9, and design the other 16 chapters around them.' },
  { id: 'deep-time', cefr: 'C1', hint: '' },
  { id: 'examined-life', cefr: 'C1', hint: '' },
  { id: 'thinking-about-thinking', cefr: 'C1', hint: '' },
  { id: 'wealth-revisited', cefr: 'C1', hint: '' },
  { id: 'aesthetic-animal', cefr: 'C1', hint: '' },
  { id: 'order-of-things', cefr: 'C2', hint: '' },
  { id: 'social-contract', cefr: 'C2', hint: '' },
];

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['bookId', 'ok', 'chapterCount'],
  properties: {
    bookId: { type: 'string' },
    ok: { type: 'boolean', description: 'true ONLY if lineups/<id>.json was written and parses as 18 valid specs' },
    chapterCount: { type: 'integer' },
    notes: { type: 'string' },
  },
};

function prompt(b) {
  const out = 'scripts/overnight/lineups/' + b.id + '.json';
  return [
    'Design the chapter lineup for a C-level English-learning idea-essay book. Working dir: /Users/shijie/Code/sdg-html. Your final answer is a StructuredOutput report, NOT prose.',
    '',
    'BOOK: ' + b.id + ' (' + b.cefr + '). FIRST read its manifest src/data/english/books/' + b.id + '/book.ts for the title, blurb, and intended theme.',
    'Then read, to calibrate register and depth (not content):',
    '  - ' + CREF + '   (the C-level idea-essay brief)',
    '  - ' + SAMPLE + '   (a finished C1 sample chapter)',
    '',
    'DESIGN exactly 18 standalone chapters that together map the book theme at ' + b.cefr + ' depth, each a single genuine idea in the register of a serious ideas magazine (Aeon, The Atlantic). Each chapter stands alone and presents one idea with a real, steel-manned concession. Make the 18 topics genuinely distinct and well-sequenced.',
    b.hint ? ('EXISTING CHAPTERS: ' + b.hint) : '',
    '',
    'VARIETY: assign each of the 18 chapters a DISTINCT grammar anchor AND a DISTINCT rhetorical-pattern anchor (no repeats across the 18). Draw from advanced constructions: nominalization, it-cleft, wh-cleft, hedging and epistemic modality, fronting and inversion, concessive subordination, conditional reasoning, apposition, parallelism and tricolon, colon-expansion, concession-then-rebuttal, define-then-problematize, the thought-experiment setup, reported-evidence framing, and the like.',
    '',
    'WRITE the lineup to ' + out + ' with the Write tool, as a JSON array of EXACTLY 18 objects, each with these keys:',
    '  order (int 1-18), slug ("NN-kebab", NN zero-padded to match order), title (English), angleZh (1-2 sentence Chinese topic + angle), angleEn (1-2 sentence English topic + angle), searchTerms (array of 3 strings: the thinkers / works / debates to ground the essay), grammarAnchor (string), patternAnchor (string).',
    'Rules: NO em-dash characters anywhere; valid, parseable JSON. After writing, verify it parses with Bash: node -e "JSON.parse(require(\'fs\').readFileSync(\'' + out + '\',\'utf8\')); console.log(\'ok\')".',
    '',
    'RETURN: bookId="' + b.id + '", ok (true only if the file was written and parses as 18 specs), chapterCount, notes (one line).',
  ].filter(Boolean).join('\n');
}

phase('Plan');
log('Designing 18-chapter lineups for ' + BOOKS.length + ' C-level books (parallel).');

const reports = await parallel(
  BOOKS.map((b) => () => agent(prompt(b), { label: 'plan:' + b.id, phase: 'Plan', agentType: 'general-purpose', schema: SCHEMA, model: 'sonnet' }))
);

const done = reports.filter(Boolean);
return {
  planned: done.filter((r) => r.ok).map((r) => r.bookId),
  failed: done.filter((r) => !r.ok).map((r) => ({ bookId: r.bookId, notes: r.notes })),
  agentNull: BOOKS.length - done.length,
};
