#!/usr/bin/env node
// Merge the au-qs-data workflow output into the canonical universities dataset:
// fills coords + QS rank for existing AU schools, adds new ones, tags the Group of Eight.
//   node scripts/merge-au-data.mjs <au-output.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const UNI = here('../src/data/universities/universities.json');
const SRC = process.argv[2];
if (!SRC) { console.error('usage: merge-au-data.mjs <output.json>'); process.exit(1); }

const u = JSON.parse(readFileSync(UNI, 'utf8'));
const raw = JSON.parse(readFileSync(SRC, 'utf8'));
const incoming = Array.isArray(raw) ? raw : (raw.result || []);

const norm = (s) => String(s || '').toLowerCase().replace(/\(.*?\)/g, ' ').replace(/['’`.,&\-–:]/g, ' ').replace(/\b(the|university|of|at)\b/g, ' ').replace(/\s+/g, ' ').trim();
const GO8 = new Set(['melbourne', 'unsw', 'sydney', 'anu', 'monash', 'uq', 'uwa', 'adelaide']);
const inUS = (lat, lng) => lat < -9 && lat > -45 && lng > 110 && lng < 155; // AU bbox

const byCn = new Map(), byEn = new Map();
for (const x of u) { if (x.country === 'AU' || true) { if (!byCn.has(x.nameCn)) byCn.set(x.nameCn, x); const k = norm(x.name); if (k && !byEn.has(k)) byEn.set(k, x); } }

const slug = (s) => s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'au';
const ids = new Set(u.map((x) => x.id));
const uniqueId = (b) => { let id = b, n = 2; while (ids.has(id)) { id = `${b}-${n}`; n++; } ids.add(id); return id; };

let updated = 0, added = 0, skipped = 0;
for (const s of incoming) {
  if (!s || typeof s.lat !== 'number' || !inUS(s.lat, s.lng)) { skipped++; continue; }
  let rec = byCn.get(s.nameCn) || byEn.get(norm(s.name));
  if (rec) {
    rec.lat = s.lat; rec.lng = s.lng; rec.country = 'AU'; rec.countryCn = '澳大利亚';
    if (s.qsRank) rec.qsRank = s.qsRank;
    if (s.city) rec.city = s.city;
    if (s.type) rec.type = s.type;
    rec.ranksYear = 2026;
    updated++;
  } else {
    rec = { id: uniqueId(slug(s.name)), name: s.name, nameCn: s.nameCn, country: 'AU', countryCn: '澳大利亚', city: s.city || '', lat: s.lat, lng: s.lng, qsRank: s.qsRank || null, arwuRank: null, usnewsRank: null, ranksYear: 2026, type: s.type || 'public', tags: [] };
    u.push(rec); byCn.set(rec.nameCn, rec); byEn.set(norm(rec.name), rec);
    added++;
  }
  rec.tags = GO8.has(rec.id) ? ['八大 Go8'] : (rec.tags || []).filter((t) => t !== '八大 Go8');
}

writeFileSync(UNI, JSON.stringify(u, null, 2) + '\n');
const au = u.filter((x) => x.country === 'AU');
console.log(`AU merge — updated ${updated}, added ${added}, skipped(out-of-AU/no-coord) ${skipped}`);
console.log(`AU total ${au.length} | with coords ${au.filter((x) => x.lat != null).length} | Go8 tagged ${au.filter((x) => (x.tags || []).includes('八大 Go8')).length}`);
