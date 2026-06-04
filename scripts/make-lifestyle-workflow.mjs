#!/usr/bin/env node
// Emit a "lifestyle / around-campus" research workflow for every school that has a
// generated detail scene. Each agent finds supermarkets / dining / services / attractions
// near the main campus. Output feeds merge-lifestyle.mjs.
//   node scripts/make-lifestyle-workflow.mjs [out.js]
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const GEN = here('../src/data/schools-map/generated');
const canon = JSON.parse(readFileSync(here('../src/data/universities/universities.json'), 'utf8'));
const countryOf = {};
for (const u of canon) countryOf[u.id] = u.country;
const CNAME = { UK: 'the UK', US: 'the USA' };

const SCHOOLS = readdirSync(GEN).filter((f) => f.endsWith('.json')).map((f) => {
  const s = JSON.parse(readFileSync(`${GEN}/${f}`, 'utf8'));
  return { id: s.id, name: s.name, nameCn: s.nameCn, city: s.city || '', anchor: s.center, country: CNAME[countryOf[s.id]] || 'the UK' };
});

const OUT = process.argv[2] || '/tmp/lifestyle-wf.js';

const script = `export const meta = {
  name: 'campus-lifestyle',
  description: 'Around-campus lifestyle POIs (supermarkets / dining / services / attractions) for student maps',
  phases: [{ title: 'Research', detail: 'one agent per school finds nearby living essentials' }],
};

const SCHOOLS = ${JSON.stringify(SCHOOLS)};

const ITEM = {
  type: 'object', required: ['name', 'nameCn', 'lat', 'lng'], additionalProperties: false,
  properties: { name: { type: 'string' }, nameCn: { type: 'string' }, lat: { type: 'number' }, lng: { type: 'number' }, note: { type: 'string' } },
};
const SCHEMA = {
  type: 'object', required: ['supermarket', 'dining', 'services', 'attractions'], additionalProperties: false,
  properties: {
    supermarket: { type: 'array', items: ITEM, description: '超市/亚超 2-5' },
    dining: { type: 'array', items: ITEM, description: '必吃/餐饮 3-6' },
    services: { type: 'array', items: ITEM, description: '生活服务 2-4' },
    attractions: { type: 'array', items: ITEM, description: '周边/打卡 2-5' },
  },
};

phase('Research');
const results = await parallel(SCHOOLS.map((s) => () =>
  agent([
    'Map the area AROUND the main campus of ' + s.name + ' (' + s.nameCn + ') in ' + s.city + ', ' + s.country + ' — for an incoming international (especially Chinese) student.',
    'Main campus ~ lat ' + s.anchor[0] + ', lng ' + s.anchor[1] + '. Find REAL, well-known nearby places (within ~5km):',
    '- supermarket: major supermarkets PLUS Chinese/Asian supermarkets (groceries, Chinese ingredients) — 2 to 5.',
    '- dining: notable Chinese / Asian restaurants AND iconic local must-eats near campus — 3 to 6.',
    '- services: bank (account opening), hospital / GP / urgent care, pharmacy, phone-carrier shop — 2 to 4.',
    '- attractions: nearby sights / photo spots / places worth visiting — 2 to 5.',
    '',
    'Each item: name (English or local), nameCn (中文), lat, lng (real decimal coords, 4+ decimals, near campus), note (one short Chinese sentence on why it matters / what it is).',
    'Use real verifiable places (OpenStreetMap / Google Maps / official sites). Do not invent. Quality and correct location over quantity.',
  ].join('\\n'), { label: 'life:' + s.id, schema: SCHEMA })
    .then((data) => ({ id: s.id, anchor: s.anchor, data }))
    .catch(() => null)
));

const ok = results.filter(Boolean);
log('lifestyle scenes: ' + ok.length + '/' + SCHOOLS.length);
return ok;
`;

import('node:fs').then((fs) => {
  fs.writeFileSync(OUT, script);
  console.log('wrote', OUT, '(', script.length, 'chars )', '|', SCHOOLS.length, 'schools');
});
