#!/usr/bin/env node
// Merge the ranked-POI workflow output (make-poi-workflow.mjs) into the generated detail scenes.
// Rebuilds all 8 pointLayers (academic + lifestyle) with rank + tier, sorted + renumbered
// contiguous; PRESERVES the campus `zone` feature (and any non-pointLayer feature). Idempotent.
//   node scripts/merge-poi.mjs <poi-output.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const GEN = here('../src/data/schools-map/generated');
const SRC = process.argv[2];
if (!SRC) { console.error('usage: merge-poi.mjs <output.json>'); process.exit(1); }

const raw = JSON.parse(readFileSync(SRC, 'utf8'));
const arr = Array.isArray(raw) ? raw : (raw.result || []);

// key -> {label, color, icon, defaultOn?}; order = render/toggle order (academic first, then lifestyle)
const CATS = [
  ['department', { label: '院系 / 教学楼', color: '#2563eb', icon: 'school', defaultOn: true }],
  ['library', { label: '图书馆', color: '#0891b2', icon: 'local_library' }],
  ['museum', { label: '博物馆 / 展馆', color: '#9333ea', icon: 'museum' }],
  ['landmark', { label: '地标 / 学生中心', color: '#64748b', icon: 'place' }],
  ['supermarket', { label: '超市 / 亚超', color: '#ea580c', icon: 'shopping_cart' }],
  ['dining', { label: '必吃 / 餐饮', color: '#dc2626', icon: 'restaurant' }],
  ['services', { label: '生活服务', color: '#0e7490', icon: 'account_balance' }],
  ['attractions', { label: '周边 / 打卡', color: '#db2777', icon: 'photo_camera' }],
];
const KEYS = new Set(CATS.map(([k]) => k));

const decode = (s) => typeof s === 'string'
  ? s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
  : s;
// POIs sit on/near campus — generous box around the anchor (~28km lat) + global sanity
const near = (a, lat, lng) =>
  Math.abs(lat - a[0]) < 0.25 && Math.abs(lng - a[1]) < 0.3 &&
  lat > -60 && lat < 72 && lng > -180 && lng < 180;

let schools = 0, added = 0, dropped = 0;
for (const r of arr) {
  if (!r || !r.data || !r.anchor) continue;
  const path = `${GEN}/${r.id}.json`;
  let scene;
  try { scene = JSON.parse(readFileSync(path, 'utf8')); } catch { continue; }

  // keep every non-pointLayer feature (campus zone, etc.); rebuild the 8 pointLayers below
  scene.features = scene.features.filter((f) => f.kind !== 'pointLayer');

  for (const [key, c] of CATS) {
    const items = [];
    for (const it of (r.data[key] || [])) {
      if (typeof it.lat !== 'number' || typeof it.lng !== 'number') { dropped++; continue; }
      if (!near(r.anchor, it.lat, it.lng)) { dropped++; continue; }
      const o = { name: decode(it.name), nameCn: decode(it.nameCn), lat: it.lat, lng: it.lng, rank: Number(it.rank) || 999 };
      if (it.tier) o.tier = decode(it.tier);
      if (it.note) o.note = decode(it.note);
      items.push(o);
      added++;
    }
    if (!items.length) continue;
    // sort by the model's rank, then RENUMBER contiguous 1..n (survivors only)
    items.sort((x, y) => x.rank - y.rank);
    items.forEach((o, i) => { o.rank = i + 1; });
    const layer = { kind: 'pointLayer', key, label: c.label, color: c.color, icon: c.icon, items };
    if (c.defaultOn) layer.defaultOn = true;
    scene.features.push(layer);
  }

  writeFileSync(path, JSON.stringify(scene, null, 2) + '\n');
  schools++;
}
console.log(`ranked POI merged into ${schools} schools; kept ${added} POIs, dropped ${dropped} (out of range / bad coord).`);
