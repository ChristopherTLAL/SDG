#!/usr/bin/env node
/**
 * merge-us-data.mjs — merge U.S. News Top-100 workflow output into the canonical
 * university dataset. Updates existing US schools with coords + USNews rank, adds new
 * ones, tags (藤校 / 公立 / 私立 / Top20).
 *   node scripts/merge-us-data.mjs <path-to-us-data-array.json>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const here = (p) => fileURLToPath(new URL(p, import.meta.url));

const SRC = process.argv[2];
if (!SRC) { console.error('usage: merge-us-data.mjs <data.json>'); process.exit(1); }
const raw = JSON.parse(readFileSync(SRC, 'utf8'));
const data = Array.isArray(raw) ? raw : (raw.result || []);
const uniPath = here('../src/data/universities/universities.json');
const uni = JSON.parse(readFileSync(uniPath, 'utf8'));

// QS ranks come from the canonical QS source (vault rankings_top200.json — the same source
// build-universities.mjs seeds from). Never hardcode qsRank:null, so "one data, many uses" holds.
const VAULT = process.env.OBSIDIAN_VAULT_ROOT || '/Users/shijie/Obsidian/规划看板';
const ranks = JSON.parse(readFileSync(VAULT + '/_agents/skills/school-plan/references/rankings_top200.json', 'utf8'));

const norm = (s) => s.toLowerCase().replace(/\(.*?\)/g, ' ').replace(/['’`.,&\-–:]/g, ' ').replace(/\b(the|university|college|of|at|and)\b/g, ' ').replace(/\s+/g, ' ').trim();
const slug = (s) => s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'school';

const usByCn = new Map(), usByEn = new Map();
for (const u of uni) { if (u.country !== 'US') continue; usByCn.set(u.nameCn, u); usByEn.set(norm(u.name), u); }
const ids = new Set(uni.map((u) => u.id));
const uniqueId = (b) => { let id = b, n = 2; while (ids.has(id)) { id = `${b}-${n}`; n++; } ids.add(id); return id; };

const IVY = new Set(['哈佛大学', '耶鲁大学', '普林斯顿大学', '哥伦比亚大学', '宾夕法尼亚大学', '康奈尔大学', '布朗大学', '达特茅斯学院']);
const tagsFor = (rec, type) => {
  const t = [];
  if (IVY.has(rec.nameCn)) t.push('藤校');
  if (type === 'public') t.push('公立'); else if (type === 'private') t.push('私立');
  if (rec.usnewsRank && Number(rec.usnewsRank) <= 20) t.push('Top20');
  return t;
};

const qsByCn = new Map(), qsByEn = new Map();
for (const r of ranks) {
  if (r.qs_rank == null || r.qs_rank === '') continue;
  if (!qsByCn.has(r.university_cn)) qsByCn.set(r.university_cn, r.qs_rank);
  const k = norm(r.university); if (!qsByEn.has(k)) qsByEn.set(k, r.qs_rank);
}
const qsFor = (nameCn, name) => qsByCn.get(nameCn) ?? qsByEn.get(norm(name)) ?? null;

let updated = 0, added = 0;
for (const s of data) {
  if (typeof s.lat !== 'number' || typeof s.lng !== 'number') continue;
  const existing = usByCn.get(s.nameCn) || usByEn.get(norm(s.name));
  if (existing) {
    existing.lat = s.lat; existing.lng = s.lng;
    existing.usnewsRank = String(s.usNewsRank);
    if (existing.qsRank == null || existing.qsRank === '') existing.qsRank = qsFor(existing.nameCn, existing.name);
    existing.tags = tagsFor(existing, s.type || existing.type);
    if (s.state && !/,\s*[A-Z]{2}$/.test(existing.city)) existing.city = `${s.city}, ${s.state}`;
    updated++;
  } else {
    const rec = {
      id: uniqueId(slug(s.name)), name: s.name, nameCn: s.nameCn,
      country: 'US', countryCn: '美国', city: s.state ? `${s.city}, ${s.state}` : s.city,
      lat: s.lat, lng: s.lng, qsRank: qsFor(s.nameCn, s.name), arwuRank: null, usnewsRank: String(s.usNewsRank),
      ranksYear: 2026, type: s.type || '', tags: [],
    };
    rec.tags = tagsFor(rec, s.type);
    uni.push(rec); usByCn.set(rec.nameCn, rec); added++;
  }
}

writeFileSync(uniPath, JSON.stringify(uni, null, 2) + '\n');
const us = uni.filter((u) => u.country === 'US');
console.log(`merged: updated ${updated}, added ${added}`);
console.log(`US total now: ${us.length} | with coords: ${us.filter((u) => u.lat != null).length} | with usnews: ${us.filter((u) => u.usnewsRank).length}`);
