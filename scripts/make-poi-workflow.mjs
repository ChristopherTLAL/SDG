#!/usr/bin/env node
// Emit a "ranked campus + neighborhood POI" research workflow for every school that has a
// generated detail scene. ONE Sonnet agent per school covers all 8 layers (academic +
// lifestyle), each item ranked 1..n by a "most-mentioned" judgment + a short tier label.
// Output feeds merge-poi.mjs.
//   node scripts/make-poi-workflow.mjs [out.js]
//   ONLY=harvard,melbourne node scripts/make-poi-workflow.mjs   # subset
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const GEN = here('../src/data/schools-map/generated');
const canon = JSON.parse(readFileSync(here('../src/data/universities/universities.json'), 'utf8'));
const countryOf = {};
for (const u of canon) countryOf[u.id] = u.country;
const CNAME = { UK: 'the UK', US: 'the USA', AU: 'Australia' };

const SCHOOLS = readdirSync(GEN).filter((f) => f.endsWith('.json')).map((f) => {
  const s = JSON.parse(readFileSync(`${GEN}/${f}`, 'utf8'));
  return { id: s.id, name: s.name, nameCn: s.nameCn, city: s.city || '', anchor: s.center, country: CNAME[countryOf[s.id]] || 'the UK' };
});

const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
const USE = ONLY ? SCHOOLS.filter((s) => ONLY.has(s.id)) : SCHOOLS;
const OUT = process.argv[2] || '/tmp/poi-wf.js';

const script = `export const meta = {
  name: 'campus-poi-ranked',
  description: 'Ranked campus + neighborhood POIs (8 layers, most-mentioned 1..n + tiers) for student maps',
  phases: [{ title: 'Research', detail: 'one Sonnet agent per school ranks academics + living essentials' }],
};

const SCHOOLS = ${JSON.stringify(USE)};

const ITEM = {
  type: 'object', required: ['name', 'nameCn', 'lat', 'lng', 'rank', 'tier'], additionalProperties: false,
  properties: {
    name: { type: 'string' }, nameCn: { type: 'string' },
    lat: { type: 'number' }, lng: { type: 'number' },
    note: { type: 'string' },
    rank: { type: 'integer', minimum: 1, description: '1-based, contiguous within this category (1 = most recommended)' },
    tier: { type: 'string', description: 'short Chinese tier label, e.g. 绝对必吃 / 很推荐 / 一般' },
  },
};
const SCHEMA = {
  type: 'object',
  required: ['department', 'library', 'museum', 'landmark', 'supermarket', 'dining', 'services', 'attractions'],
  additionalProperties: false,
  properties: {
    department: { type: 'array', items: ITEM, description: '院系/教学楼/重点建筑 8-15, ranked by academic prominence' },
    library: { type: 'array', items: ITEM, description: '图书馆 6-10' },
    museum: { type: 'array', items: ITEM, description: '博物馆/展馆/画廊 4-8' },
    landmark: { type: 'array', items: ITEM, description: '地标/学生中心/标志建筑 6-10' },
    supermarket: { type: 'array', items: ITEM, description: '主流超市 + 中国/亚洲超市 6-10' },
    dining: { type: 'array', items: ITEM, description: '中餐/亚洲餐 + 本地必吃 12-20' },
    services: { type: 'array', items: ITEM, description: '银行/医院GP/药房/电信 等生活服务 6-10' },
    attractions: { type: 'array', items: ITEM, description: '周边景点/打卡/必逛 8-15' },
  },
};

phase('Research');
const results = await parallel(SCHOOLS.map((s) => () =>
  agent([
    'Build a comprehensive, RANKED campus + neighborhood guide for ' + s.name + ' (' + s.nameCn + ') in ' + s.city + ', ' + s.country + ' — for an incoming international (especially Chinese) student.',
    'Main campus ~ lat ' + s.anchor[0] + ', lng ' + s.anchor[1] + '.',
    '',
    'For EACH category, research BROADLY across multiple sources (Google Maps ratings + review counts, 小红书, Reddit, local best-of lists, official university pages) and rank items by how often / how strongly they are recommended — a "most-mentioned" judgment. rank=1 is the single most recommended; assign a CONTIGUOUS 1..n ranking PER category. tier = a short Chinese strength label: for dining use 绝对必吃 / 很推荐 / 一般; for the rest use 必去 / 强烈推荐 / 推荐 / 可选 (or analogous).',
    '',
    'Categories (counts are targets — prefer real, well-known places over filler):',
    '- department: 院系 / 教学楼 / 重点建筑 — 8 to 15, ranked by academic prominence / notability.',
    '- library: 图书馆 — 6 to 10.',
    '- museum: 博物馆 / 展馆 / 画廊 — 4 to 8.',
    '- landmark: 地标 / 学生中心 / 标志性建筑 — 6 to 10.',
    '- supermarket: 主流超市 PLUS 中国/亚洲超市 (中式食材) — 6 to 10.',
    '- dining: 中餐 / 亚洲餐 AND 本地必吃 — 12 to 20.',
    '- services: bank (开户), hospital / GP / urgent care, pharmacy, phone-carrier shop — 6 to 10.',
    '- attractions: 周边景点 / 打卡 / 必逛 — 8 to 15.',
    '',
    'Each item: name (English or local), nameCn (中文), lat, lng (real decimal coords, 4+ decimals — near campus for lifestyle, the exact building for academic), note (one short Chinese sentence: why it matters / what it is), rank (1-based int, contiguous per category), tier (short Chinese label).',
    'Use ONLY real, verifiable places (OpenStreetMap / Google Maps / official sites). Do NOT invent. Accurate coordinates and a correct ranking matter more than hitting the max count.',
  ].join('\\n'), { label: 'poi:' + s.id, model: 'sonnet', schema: SCHEMA })
    .then((data) => ({ id: s.id, anchor: s.anchor, data }))
    .catch(() => null)
));

const ok = results.filter(Boolean);
log('ranked POI scenes: ' + ok.length + '/' + SCHOOLS.length);
return ok;
`;

import('node:fs').then((fs) => {
  fs.writeFileSync(OUT, script);
  console.log('wrote', OUT, '(', script.length, 'chars )', '|', USE.length, 'schools');
});
