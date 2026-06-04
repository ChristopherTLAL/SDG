#!/usr/bin/env node
// Emit a campus-scenes generation workflow (multi-campus zones + cross-campus buildings)
// with a school list inlined. Output feeds assemble-generated-scenes.mjs.
//   node scripts/make-scenes-workflow.mjs <schools.json> <Country> <out.js>
import { readFileSync, writeFileSync } from 'node:fs';

const [, , SRC, COUNTRY = 'USA', OUT = '/tmp/scenes-wf.js'] = process.argv;
const SCHOOLS = JSON.parse(readFileSync(SRC, 'utf8')).map((s) => ({ id: s.id, name: s.name, nameCn: s.nameCn, city: s.city, lat: s.lat, lng: s.lng }));

const script = `export const meta = {
  name: 'campus-scenes',
  description: 'Research ALL campuses (as circles) + cross-campus buildings for ${COUNTRY} universities',
  phases: [{ title: 'Research', detail: 'one agent per university maps every campus + key buildings' }],
};

const SCHOOLS = ${JSON.stringify(SCHOOLS)};

const ITEM = {
  type: 'object', required: ['name', 'nameCn', 'lat', 'lng'], additionalProperties: false,
  properties: { name: { type: 'string' }, nameCn: { type: 'string' }, lat: { type: 'number' }, lng: { type: 'number' }, note: { type: 'string' } },
};
const ZONE = {
  type: 'object', required: ['name', 'nameCn', 'lat', 'lng', 'radius'], additionalProperties: false,
  properties: { name: { type: 'string' }, nameCn: { type: 'string' }, lat: { type: 'number' }, lng: { type: 'number' }, radius: { type: 'number', description: 'meters 200-1500' }, note: { type: 'string' } },
};
const SCHEMA = {
  type: 'object', required: ['center', 'zoom', 'blurb', 'campuses', 'categories'], additionalProperties: false,
  properties: {
    center: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
    zoom: { type: 'number', description: '12 spread / 13 / 14 / 15 compact' },
    blurb: { type: 'string' },
    campuses: { type: 'array', items: ZONE, description: 'ALL distinct campuses/sites as circles' },
    categories: {
      type: 'object', additionalProperties: false,
      properties: { department: { type: 'array', items: ITEM }, library: { type: 'array', items: ITEM }, museum: { type: 'array', items: ITEM }, landmark: { type: 'array', items: ITEM } },
    },
  },
};

phase('Research');
const results = await parallel(SCHOOLS.map((s) => () =>
  agent([
    'You are mapping ALL campuses of ' + s.name + ' (' + s.nameCn + ') in ' + s.city + ', ${COUNTRY}.',
    'Anchor (main campus) ~ lat ' + s.lat + ', lng ' + s.lng + '.',
    '',
    'Research the real geography (Wikipedia, OpenStreetMap, official campus maps) and return:',
    '- center: [lat,lng] of the main campus; zoom: 15 compact urban / 14 large single campus / 13-12 spread or multi-site.',
    '- blurb: one Chinese sentence on the campus character.',
    '- campuses: EVERY distinct campus / site as a circle {name, nameCn, lat, lng, radius(meters 200-1500), note} — main campus PLUS satellites (medical center, research park, downtown, athletics, remote sites).',
    '- categories: department (key academic buildings/colleges across campuses), library (main libraries), museum (museums/galleries, omit if none), landmark (signature buildings, student union, stadium, station).',
    '',
    'Rules: real decimal coordinates (4+ decimals), each within ~0.5 deg of the anchor (satellites may be farther but still the right metro). Official English names + concise Chinese + one short Chinese note. 8-20 buildings total is plenty. Quality and correct location over quantity.',
  ].join('\\n'), { label: 'campus:' + s.id, schema: SCHEMA })
    .then((data) => ({ id: s.id, name: s.name, nameCn: s.nameCn, city: s.city, anchor: [s.lat, s.lng], data }))
    .catch(() => null)
));

const ok = results.filter(Boolean);
log('campus scenes: ' + ok.length + '/' + SCHOOLS.length);
return ok;
`;

writeFileSync(OUT, script);
console.log('wrote', OUT, '(', script.length, 'chars )', '|', SCHOOLS.length, 'schools');
