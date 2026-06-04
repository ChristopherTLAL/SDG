#!/usr/bin/env node
// Merge "lifestyle / around-campus" workflow output into the generated detail scenes:
// appends supermarket / dining / services / attractions as toggleable pointLayers.
//   node scripts/merge-lifestyle.mjs <lifestyle-output.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const GEN = here('../src/data/schools-map/generated');
const SRC = process.argv[2];
if (!SRC) { console.error('usage: merge-lifestyle.mjs <output.json>'); process.exit(1); }

const raw = JSON.parse(readFileSync(SRC, 'utf8'));
const arr = Array.isArray(raw) ? raw : (raw.result || []);

// category key -> {label, color, icon}; order = render/toggle order (after academic layers)
const CATS = [
  ['supermarket', { label: '超市 / 亚超', color: '#ea580c', icon: 'shopping_cart' }],
  ['dining', { label: '必吃 / 餐饮', color: '#dc2626', icon: 'restaurant' }],
  ['services', { label: '生活服务', color: '#0e7490', icon: 'account_balance' }],
  ['attractions', { label: '周边 / 打卡', color: '#db2777', icon: 'photo_camera' }],
];

const decode = (s) => typeof s === 'string'
  ? s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
  : s;
// lifestyle POIs sit near campus — tighter than the campus radius (~25km) + global box
const near = (a, lat, lng) =>
  Math.abs(lat - a[0]) < 0.25 && Math.abs(lng - a[1]) < 0.3 &&
  lat > -60 && lat < 72 && lng > -180 && lng < 180;

let schools = 0, added = 0, dropped = 0;
for (const r of arr) {
  if (!r || !r.data || !r.anchor) continue;
  const path = `${GEN}/${r.id}.json`;
  let scene;
  try { scene = JSON.parse(readFileSync(path, 'utf8')); } catch { continue; }
  // strip any previously-merged lifestyle layers (idempotent re-run)
  const lifeKeys = new Set(CATS.map(([k]) => k));
  scene.features = scene.features.filter((f) => !(f.kind === 'pointLayer' && lifeKeys.has(f.key)));
  for (const [key, c] of CATS) {
    const items = [];
    for (const it of (r.data[key] || [])) {
      if (typeof it.lat !== 'number' || typeof it.lng !== 'number') { dropped++; continue; }
      if (!near(r.anchor, it.lat, it.lng)) { dropped++; continue; }
      const o = { name: decode(it.name), nameCn: decode(it.nameCn), lat: it.lat, lng: it.lng };
      if (it.note) o.note = decode(it.note);
      items.push(o);
      added++;
    }
    if (items.length) scene.features.push({ kind: 'pointLayer', key, label: c.label, color: c.color, icon: c.icon, items });
  }
  writeFileSync(path, JSON.stringify(scene, null, 2) + '\n');
  schools++;
}
console.log(`lifestyle merged into ${schools} schools; added ${added} POIs, dropped ${dropped} (out of range).`);
