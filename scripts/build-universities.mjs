#!/usr/bin/env node
/**
 * build-universities.mjs — ONE-TIME SEEDER for the canonical university dataset.
 *
 * Merges the two existing (drifted) ranking sources into a single source of truth:
 *   1. src/data/budget-data.json        — 105 schools w/ id/name/nameCn/city/type/qsRank(老版 QS)
 *   2. <vault>/_agents/skills/school-plan/references/rankings_top200.json — QS2026 + ARWU + USNews
 *
 * Output: src/data/universities/universities.json
 *   - QS rank taken from vault (QS2026) where matched; budget qsRank as fallback otherwise.
 *   - UK universities get lat/lng (from UK_COORDS) for the schools map.
 *   - Adds UK universities that are in vault top200 but missing from budget (EXTRA_UK).
 *
 * After seeding, universities.json is hand-maintained as the single source of truth.
 * Re-run only to re-seed from scratch. Run:  node scripts/build-universities.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

// ⚠️ GUARD: universities.json is now the HAND-MAINTAINED single source of truth for ranks
// (full official QS2026 baked in via scripts/ingest-qs-ranks.py). This seeder reseeds QS from
// the partial vault Top-200 list and WOULD REVERT the official ranks / US backfills. It has
// already done its one-time job — do not run it again unless you truly mean to reseed from
// scratch (then re-run ingest-qs-ranks.py afterwards). Pass --reseed to override.
if (!process.argv.includes('--reseed')) {
  console.error('⚠️  build-universities.mjs is a one-time seeder; universities.json is now the source of truth.');
  console.error('    Re-running reseeds QS from vault Top-200 and reverts official rank fills. Pass --reseed if you really mean it.');
  process.exit(1);
}

const VAULT = process.env.OBSIDIAN_VAULT_ROOT || '/Users/shijie/Obsidian/规划看板';

const budget = JSON.parse(readFileSync(here('../src/data/budget-data.json'), 'utf8'));
const vault = JSON.parse(
  readFileSync(VAULT + '/_agents/skills/school-plan/references/rankings_top200.json', 'utf8')
);

// budget region id -> [country code, country 中文]
const REGION_COUNTRY = {
  us: ['US', '美国'], uk: ['UK', '英国'], au: ['AU', '澳大利亚'], ca: ['CA', '加拿大'],
  hk: ['HK', '中国香港'], sg: ['SG', '新加坡'], jp: ['JP', '日本'], kr: ['KR', '韩国'],
  ch: ['CH', '瑞士'], de: ['DE', '德国'], nl: ['NL', '荷兰'], fr: ['FR', '法国'],
  se: ['SE', '瑞典'], dk: ['DK', '丹麦'], be: ['BE', '比利时'], ie: ['IE', '爱尔兰'],
};

// Main-campus coordinates for UK universities (for the schools map overview).
const UK_COORDS = {
  cambridge: [52.2043, 0.1149], oxford: [51.7548, -1.2544], imperial: [51.4988, -0.1749],
  ucl: [51.5246, -0.1340], edinburgh: [55.9445, -3.1892], manchester: [53.4668, -2.2339],
  kcl: [51.5115, -0.1160], lse: [51.5143, -0.1167], bristol: [51.4585, -2.6030],
  warwick: [52.3793, -1.5615], glasgow: [55.8721, -4.2882], leeds: [53.8067, -1.5550],
  southampton: [50.9352, -1.3962], birmingham: [52.4508, -1.9305], sheffield: [53.3811, -1.4878],
  nottingham: [52.9387, -1.1959], standrews: [56.3398, -2.7967], qmul: [51.5246, -0.0382],
  durham: [54.7653, -1.5762], lancaster: [54.0105, -2.7855], bath: [51.3782, -2.3264],
  liverpool: [53.4054, -2.9665], newcastle: [54.9799, -1.6149], exeter: [50.7372, -3.5346],
  york: [53.9465, -1.0530], cardiff: [51.4886, -3.1790], reading: [51.4414, -0.9418],
  qub: [54.5841, -5.9350],
};

// UK universities present in vault top200 but missing from budget-data.
const EXTRA_UK = [
  { id: 'bath', name: 'University of Bath', nameCn: '巴斯大学', city: 'Bath', qsRank: 132, arwuRank: null, usnewsRank: null },
  { id: 'liverpool', name: 'University of Liverpool', nameCn: '利物浦大学', city: 'Liverpool', qsRank: 147, arwuRank: '101-150', usnewsRank: null },
  { id: 'newcastle', name: 'Newcastle University', nameCn: '纽卡斯尔大学', city: 'Newcastle', qsRank: 137, arwuRank: '201-300', usnewsRank: null },
  { id: 'exeter', name: 'University of Exeter', nameCn: '埃克塞特大学', city: 'Exeter', qsRank: 155, arwuRank: '151-200', usnewsRank: null },
  { id: 'york', name: 'University of York', nameCn: '约克大学', city: 'York', qsRank: 169, arwuRank: '201-300', usnewsRank: null },
  { id: 'cardiff', name: 'Cardiff University', nameCn: '卡迪夫大学', city: 'Cardiff', qsRank: 181, arwuRank: '201-300', usnewsRank: null },
  { id: 'reading', name: 'University of Reading', nameCn: '雷丁大学', city: 'Reading', qsRank: 194, arwuRank: null, usnewsRank: null },
  { id: 'qub', name: "Queen's University Belfast", nameCn: '贝尔法斯特女王大学', city: 'Belfast', qsRank: 199, arwuRank: null, usnewsRank: null },
];

// Known nameCn mismatches between the two sources: budget id -> vault university_cn
const OVERRIDE = {
  monash: '莫纳什大学',
  tcd: '都柏林三一学院',
  western: '西安大略大学',
  udemontreal: '蒙特利尔大学',
};

// Schools not present in the vault QS top-200 list: keep a QS rank here so the seed
// stays correct independently of budget-data.json (whose qsRank field is being removed,
// since the canonical dataset is now the single source of truth for ranks).
const FALLBACK_QS = {
  ottawa: 189, calgary: 170, keio: 188, kaist: 41, sciencespo: 90,
};

const norm = (s) =>
  s.toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[''`.,&\-–:]/g, ' ')
    .replace(/\b(the|university|college|of|at)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const clean = (r) => (r == null || r === 'N/A' || r === '') ? null : String(r);

const vByCn = new Map();
const vByEn = new Map();
for (const v of vault) {
  if (!vByCn.has(v.university_cn)) vByCn.set(v.university_cn, v);
  const k = norm(v.university);
  if (!vByEn.has(k)) vByEn.set(k, v);
}

function vaultFor(b) {
  if (OVERRIDE[b.id] && vByCn.has(OVERRIDE[b.id])) return vByCn.get(OVERRIDE[b.id]);
  if (vByCn.has(b.nameCn)) return vByCn.get(b.nameCn);
  const k = norm(b.name);
  if (vByEn.has(k)) return vByEn.get(k);
  return null;
}

const out = [];
let matched = 0;
const unmatched = [];

for (const r of budget.regions) {
  const [country, countryCn] = REGION_COUNTRY[r.id] || [r.id.toUpperCase(), r.name];
  for (const s of r.schools) {
    const v = vaultFor(s);
    if (v) matched++; else unmatched.push(`${s.nameCn} (${s.name})`);
    const rec = {
      id: s.id,
      name: s.name,
      nameCn: s.nameCn,
      country,
      countryCn,
      city: s.city,
      lat: UK_COORDS[s.id]?.[0] ?? null,
      lng: UK_COORDS[s.id]?.[1] ?? null,
      qsRank: v ? v.qs_rank : (FALLBACK_QS[s.id] ?? s.qsRank ?? null),
      arwuRank: v ? clean(v.arwu_rank) : null,
      usnewsRank: v ? clean(v.usnews_rank) : null,
      ranksYear: 2026,
      type: s.type,
      tags: [],
    };
    out.push(rec);
  }
}

for (const e of EXTRA_UK) {
  out.push({
    id: e.id, name: e.name, nameCn: e.nameCn, country: 'UK', countryCn: '英国', city: e.city,
    lat: UK_COORDS[e.id]?.[0] ?? null, lng: UK_COORDS[e.id]?.[1] ?? null,
    qsRank: e.qsRank, arwuRank: e.arwuRank ?? null, usnewsRank: e.usnewsRank ?? null,
    ranksYear: 2026, type: 'public', tags: [],
  });
}

// Include ALL remaining vault top-200 entries so the canonical set is a SUPERSET of
// the vault rankings file. This makes scripts/export-rankings.mjs a clean full sync and
// gives the future global map a head start. These extra entries carry ranks only (no
// coords / costs yet) — fill lat/lng later when a country gets mapped.
const COUNTRY_CN = {
  US: '美国', UK: '英国', CH: '瑞士', SG: '新加坡', CN: '中国', HK: '中国香港', TW: '中国台湾',
  AU: '澳大利亚', CA: '加拿大', FR: '法国', DE: '德国', JP: '日本', KR: '韩国', NL: '荷兰',
  IT: '意大利', IE: '爱尔兰', SE: '瑞典', DK: '丹麦', BE: '比利时', NZ: '新西兰', FI: '芬兰',
  NO: '挪威', AT: '奥地利', ES: '西班牙', RU: '俄罗斯', BR: '巴西', CL: '智利', MX: '墨西哥',
  ID: '印度尼西亚', ZA: '南非', AE: '阿联酋', KZ: '哈萨克斯坦', QA: '卡塔尔', SA: '沙特阿拉伯',
  IN: '印度', MY: '马来西亚', AR: '阿根廷',
};
const outByCn = new Map();
const outByEn = new Map();
for (const u of out) { outByCn.set(u.nameCn, u); outByEn.set(norm(u.name), u); }
const usedIds = new Set(out.map((u) => u.id));
const slugify = (s) =>
  s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'school';
const uniqueId = (base) => { let id = base, n = 2; while (usedIds.has(id)) { id = `${base}-${n}`; n++; } usedIds.add(id); return id; };

const overrideCns = new Set(Object.values(OVERRIDE));
let added = 0;
for (const v of vault) {
  if (overrideCns.has(v.university_cn)) continue;        // already matched a budget school
  if (outByCn.has(v.university_cn)) continue;
  if (outByEn.has(norm(v.university))) continue;
  const rec = {
    id: uniqueId(slugify(v.university)),
    name: v.university.replace(/\s*\(.*?\)\s*/g, ' ').trim(),
    nameCn: v.university_cn,
    country: v.country,
    countryCn: COUNTRY_CN[v.country] || v.country,
    city: '',
    lat: null,
    lng: null,
    qsRank: v.qs_rank,
    arwuRank: clean(v.arwu_rank),
    usnewsRank: clean(v.usnews_rank),
    ranksYear: 2026,
    type: '',
    tags: [],
  };
  out.push(rec);
  outByCn.set(rec.nameCn, rec);
  outByEn.set(norm(rec.name), rec);
  added++;
}

out.sort((a, b) =>
  a.country === b.country ? (a.qsRank ?? 9999) - (b.qsRank ?? 9999) : a.country.localeCompare(b.country)
);
console.log(`Added ${added} vault-only entries (ranks only).`);

// Tag UK universities (drives the overview tag filter). Membership lists are stable.
const RUSSELL = new Set(['cambridge', 'oxford', 'imperial', 'ucl', 'kcl', 'lse', 'edinburgh', 'manchester', 'bristol', 'warwick', 'glasgow', 'leeds', 'southampton', 'sheffield', 'birmingham', 'nottingham', 'durham', 'newcastle', 'liverpool', 'exeter', 'cardiff', 'qmul', 'york', 'qub']);
const G5 = new Set(['oxford', 'cambridge', 'imperial', 'ucl', 'lse']);
const SCOTLAND = new Set(['edinburgh', 'glasgow', 'standrews']);
for (const u of out) {
  if (u.country !== 'UK') continue;
  const t = [];
  if (RUSSELL.has(u.id)) t.push('罗素集团');
  if (G5.has(u.id)) t.push('G5');
  if (SCOTLAND.has(u.id)) t.push('苏格兰');
  u.tags = t;
}

mkdirSync(here('../src/data/universities'), { recursive: true });
writeFileSync(here('../src/data/universities/universities.json'), JSON.stringify(out, null, 2) + '\n');

const uk = out.filter((u) => u.country === 'UK');
console.log(`TOTAL=${out.length}  MATCHED=${matched}  UNMATCHED=${unmatched.length}`);
console.log(`UK=${uk.length}  UK_NO_COORDS=${JSON.stringify(uk.filter((u) => u.lat == null).map((u) => u.id))}`);
console.log('UNMATCHED:', unmatched.join('; ') || '(none)');
console.log('UK list:', uk.map((u) => `${u.qsRank}:${u.id}`).join(', '));
