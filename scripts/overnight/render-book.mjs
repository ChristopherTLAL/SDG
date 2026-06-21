#!/usr/bin/env node
// render-book.mjs <bookId>
// Deterministically builds scripts/overnight/wf/<id>.mjs by splicing a book's
// DATA block (from scripts/overnight/lineups/<id>.json) into the pipeline
// template (book-pipeline.mjs, between the OVERNIGHT-DATA markers). All content
// is injected via JSON.stringify, so agent-written lineup text can NEVER produce
// a JS syntax error. The pipeline logic itself is copied verbatim, never touched.

import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = '/Users/shijie/Code/sdg-html';
const TEMPLATE = `${ROOT}/.claude/skills/daily-english/workflows/book-pipeline.mjs`;
const SAMPLE = 'src/data/english/books/mind-and-machine/01-hard-problem.ts';

// Per-book config. modelFile = a finished sample chapter for register/format.
const CONFIG = {
  'mind-and-machine': { cefr: 'C1', model: 'src/data/english/books/mind-and-machine/01-hard-problem.ts' },
  'deep-time': { cefr: 'C1', model: SAMPLE },
  'examined-life': { cefr: 'C1', model: SAMPLE },
  'thinking-about-thinking': { cefr: 'C1', model: SAMPLE },
  'wealth-revisited': { cefr: 'C1', model: SAMPLE },
  'aesthetic-animal': { cefr: 'C1', model: SAMPLE },
  'order-of-things': { cefr: 'C2', model: SAMPLE },
  'social-contract': { cefr: 'C2', model: SAMPLE },
};

const C_AVOID = 'This is a C-level idea-essay book. Keep book-wide variety: do NOT reuse a grammar point or rhetorical pattern that another chapter of this book leads with.';

const id = process.argv[2];
if (!id || !CONFIG[id]) { console.error(`unknown book id: ${id}`); process.exit(1); }
const cfg = CONFIG[id];

const lineup = JSON.parse(readFileSync(`${ROOT}/scripts/overnight/lineups/${id}.json`, 'utf8'));
if (!Array.isArray(lineup) || lineup.length < 1) { console.error('empty/invalid lineup'); process.exit(1); }

const Q = (s) => JSON.stringify(s == null ? '' : s);

const bookObj =
  'const BOOK = {\n' +
  `  id: ${Q(id)},\n` +
  `  cefr: ${Q(cfg.cefr)},\n` +
  `  register: 'c-level',\n` +
  `  noListening: true,\n` +
  `  modelFile: ${Q(cfg.model)},\n` +
  `  agentModel: 'sonnet',\n` +
  '};';

const chapters = lineup.map((c) => {
  const avoid = C_AVOID +
    ' For THIS chapter, lead your grammar with ' + (c.grammarAnchor || 'a fresh advanced construction') +
    ', and lead your patterns with ' + (c.patternAnchor || 'a fresh rhetorical move') +
    '. Fill the rest with other fresh constructions; every example must come from your own text.';
  return '  {\n' +
    `    order: ${Number(c.order)},\n` +
    `    slug: ${Q(c.slug)},\n` +
    `    title: ${Q(c.title)},\n` +
    `    angleZh: ${Q(c.angleZh)},\n` +
    `    angleEn: ${Q(c.angleEn)},\n` +
    `    searchTerms: ${JSON.stringify(Array.isArray(c.searchTerms) ? c.searchTerms : [])},\n` +
    `    avoidConstructions: ${Q(avoid)},\n` +
    '  },';
}).join('\n');

const DATA = bookObj + '\n\nconst CHAPTERS = [\n' + chapters + '\n];';

const tpl = readFileSync(TEMPLATE, 'utf8');
const START = '// >>>OVERNIGHT-DATA-START';
const END = '// >>>OVERNIGHT-DATA-END';
const a = tpl.indexOf(START), b = tpl.indexOf(END);
if (a < 0 || b < 0) { console.error('template markers not found'); process.exit(1); }
const out = tpl.slice(0, a) + START + '\n' + DATA + '\n' + END + tpl.slice(b + END.length);

const dest = `${ROOT}/scripts/overnight/wf/${id}.mjs`;
writeFileSync(dest, out);
console.log(`rendered ${dest} (${lineup.length} chapters)`);
