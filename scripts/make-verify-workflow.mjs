#!/usr/bin/env node
// Build a self-contained verification workflow script with the current generated-school
// point data inlined (workflow args are unreliable → inline). Each agent re-checks one
// school's coordinates against authoritative sources and returns ONLY corrections.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const dir = here('../src/data/schools-map/generated');
const files = readdirSync(dir).filter((f) => f.endsWith('.json'));

const SCHOOLS = files.map((f) => {
  const s = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  const points = [];
  for (const feat of s.features || []) {
    for (const it of feat.items || []) {
      points.push({ cat: feat.kind === 'zone' ? 'campus' : feat.key, name: it.name, lat: it.lat, lng: it.lng });
    }
  }
  return { id: s.id, name: s.name, nameCn: s.nameCn, points };
});

const ONLY = process.argv[2] ? new Set(process.argv[2].split(',')) : null;
const USE = ONLY ? SCHOOLS.filter((s) => ONLY.has(s.id)) : SCHOOLS;
const COUNTRY = process.argv[3] || 'the UK';

const script = `export const meta = {
  name: 'verify-uk-coords',
  description: 'Verify campus point coordinates for UK university scenes',
  phases: [{ title: 'Verify', detail: 'one agent per school re-checks every coordinate' }],
};

const SCHOOLS = ${JSON.stringify(USE)};

const SCHEMA = {
  type: 'object', required: ['corrections'], additionalProperties: false,
  properties: {
    corrections: {
      type: 'array',
      items: {
        type: 'object', required: ['name', 'action'], additionalProperties: false,
        properties: {
          name: { type: 'string', description: 'exact name as given' },
          action: { type: 'string', enum: ['fix', 'remove'] },
          lat: { type: 'number' }, lng: { type: 'number' },
          reason: { type: 'string' },
        },
      },
    },
  },
};

phase('Verify');
const results = await parallel(SCHOOLS.map((s) => () => {
  const lines = s.points.map((p) => '- [' + p.cat + '] ' + p.name + ' @ ' + p.lat + ',' + p.lng).join('\\n');
  const prompt = [
    'Verify map-pin coordinates for ' + s.name + ' (' + s.nameCn + '), ${COUNTRY}. For EACH point below, check the lat/lng truly matches that named building / place / campus in the correct city. Use OpenStreetMap, Wikipedia infoboxes and official campus maps.',
    '',
    lines,
    '',
    'Return corrections ONLY for points that are clearly WRONG — misplaced by more than ~150 m, in the wrong area/city, or the place does not actually exist. For a wrong location use action "fix" with the correct lat/lng (4+ decimals). For a non-existent/duplicate place use action "remove" with a short reason. If a point is correct, do NOT include it. Do not invent. If every point is fine, return an empty corrections array.',
  ].join('\\n');
  return agent(prompt, { schema: SCHEMA, label: 'verify:' + s.id })
    .then((r) => ({ id: s.id, corrections: (r && r.corrections) || [] }))
    .catch(() => ({ id: s.id, corrections: [], error: true }));
}));
log('verify complete: ' + results.length + ' schools, ' + results.reduce((n, r) => n + r.corrections.length, 0) + ' corrections');
return results;
`;

const out = ONLY ? '/tmp/verify-4-wf.js' : '/tmp/verify-uk-coords-wf.js';
writeFileSync(out, script);
console.log('wrote', out, '(', script.length, 'chars )');
console.log('schools:', SCHOOLS.length, 'total points:', SCHOOLS.reduce((n, s) => n + s.points.length, 0));
