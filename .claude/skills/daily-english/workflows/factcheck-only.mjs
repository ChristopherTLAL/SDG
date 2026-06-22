// factcheck-only (dynamic Workflow)
//
// Runs ONLY the fact-check stage on already-written chapter files — no generation.
// Use it to retro-fact-check chapters that shipped without a fact-check pass (e.g.
// a batch where the generate agents succeeded but the report/factcheck stage was
// throttled). Each agent reads a committed file, verifies its hard facts via
// WebSearch, surgically corrects verifiable errors IN PLACE, and re-validates.
// The orchestrator commits the corrected files afterward.

export const meta = {
  name: 'factcheck-only',
  description: 'Fact-check existing chapter files in place (no regeneration); corrects verifiable errors and re-validates',
  phases: [
    { title: 'Fact-check', detail: 'one agent per chapter: list hard facts, verify via WebSearch, surgically correct in place, re-validate' },
  ],
};

// ===========================================================================
// DATA BLOCK -- REPLACE PER RUN. Inline the slugs; do NOT use `args`.
// ===========================================================================
const BOOK_ID = 'social-contract';
const MODEL = 'sonnet';
const SLUGS = [
  '01-veil-of-ignorance',
  '02-state-of-nature',
  '03-consent-and-its-fictions',
  '04-liberty-and-its-limits',
  '05-legitimacy-and-authority',
  '07-the-market-and-the-contract',
  '08-democracy-and-its-enemies',
  '09-the-fragility-of-democracy',
  '10-social-trust-and-the-contract',
  '11-global-justice',
  '12-communitarianism-and-its-challenge',
  '13-recognition-and-difference',
  '16-distributive-justice-and-luck',
];
// ===========================================================================

const FACTCHECK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['slug', 'validatorOk', 'corrections'],
  properties: {
    slug: { type: 'string' },
    claimsChecked: { type: 'integer' },
    corrections: { type: 'array', items: { type: 'string' }, description: 'each: "claim: was X, now Y (why)"; [] if none' },
    unresolved: { type: 'array', items: { type: 'string' } },
    validatorOk: { type: 'boolean', description: 'validate.py still passes after edits' },
  },
};

function prompt(slug) {
  const outPath = 'src/data/english/books/' + BOOK_ID + '/' + slug + '.ts';
  return [
    'You are a FACT-CHECKER for one chapter of a C-level English-learning idea-essay book. Working directory: /Users/shijie/Code/sdg-html',
    'This chapter was generated but never fact-checked. Verify its HARD FACTS against real sources, correct ONLY verifiable errors, then re-validate. Your final answer is a StructuredOutput report, NOT prose.',
    '',
    'FILE: ' + outPath,
    '',
    'STEP 1 -- Read the file. List every HARD factual claim: people, works, dates, numbers, who-said/wrote/argued-what attributions, a thinker discipline label (philosopher vs legal scholar vs economist vs political scientist), and superlatives ("the first", "coined", "the most"). Ignore opinions, prose style, translation quality, and the teaching framing.',
    '',
    'STEP 2 -- Verify each with WebSearch (WebFetch if needed). Be most skeptical of attributions (who coined / said / wrote a term or argument), discipline labels, exact dates and editions, exact figures, and superlatives.',
    '',
    'STEP 3 -- Correct ONLY claims you can show are wrong. Surgical, NOT a rewrite:',
    '  - Change the minimum words to make it true, in BOTH the English and the paired zh of that sentence, and anywhere the same wrong fact recurs (a grammar/pattern example, a quiz stem or explanation).',
    '  - If a claim is plausible but you cannot confirm it, do NOT change it; put it under unresolved.',
    '  - Do NOT alter sentence IDs, the sentence count, any vocab.word (each must still match its sentence via the regex \\bword\\b), the vocab/grammar/pattern/quiz counts, or the register. NEVER introduce an em-dash (U+2014) or a doubled Chinese em-dash.',
    '',
    'STEP 4 -- Re-run: python3 .claude/skills/daily-english/scripts/validate.py ' + outPath,
    '  Fix until it prints {"ok": true}. (validate.py now also runs a real esbuild parse, so any edit that breaks the TypeScript will be caught — keep it valid.)',
    '',
    'RETURN: slug=' + JSON.stringify(slug) + ', claimsChecked (int), corrections (array of "claim: was X, now Y (why)", or [] if nothing was wrong), unresolved (array of claims you could not confirm), validatorOk (true ONLY if validate.py finally printed ok:true).',
    '',
    'Do NOT commit, push, or edit any file other than ' + outPath + '. Keep every change minimal and strictly factual.',
  ].join('\n');
}

phase('Fact-check');
log('Fact-checking ' + SLUGS.length + ' existing "' + BOOK_ID + '" chapters in place (no regeneration).');

const reports = await parallel(
  SLUGS.map((s) => () => agent(prompt(s), { label: 'fact:' + s, phase: 'Fact-check', agentType: 'general-purpose', schema: FACTCHECK_SCHEMA, model: MODEL }))
);

const done = reports.filter(Boolean);
return {
  book: BOOK_ID,
  requested: SLUGS.length,
  checked: done.map((r) => ({ slug: r.slug, validatorOk: r.validatorOk, corrections: (r.corrections || []).length, unresolved: (r.unresolved || []).length })),
  allCorrections: done.flatMap((r) => (r.corrections || []).map((c) => r.slug + ': ' + c)),
  brokenValidator: done.filter((r) => r.validatorOk === false).map((r) => r.slug),
  nulls: SLUGS.length - done.length,
};
