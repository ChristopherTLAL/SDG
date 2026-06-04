#!/usr/bin/env node
/**
 * assemble-generated-scenes.mjs — turn the uk-school-scenes workflow output into
 * standardized generic campus scenes under src/data/schools-map/generated/<id>.json.
 *
 * Applies consistent category styling, sanity-checks coordinates against each school's
 * anchor (drops far-off / out-of-UK points), decodes HTML entities, and writes one JSON
 * per school. registry.ts auto-discovers these via import.meta.glob.
 *
 *   node scripts/assemble-generated-scenes.mjs [path-to-workflow-output.json]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const SRC = process.argv[2] || '/private/tmp/claude-501/-Users-shijie-Code-sdg-html--claude-worktrees-tender-driscoll-8903f8/b6e18a40-ce0f-453c-854b-01a15b78d252/tasks/wvvrcw2os.output';

const raw = JSON.parse(readFileSync(SRC, 'utf8'));
const results = Array.isArray(raw) ? raw : (raw.result || []);

const CATS = {
  department: { label: '院系 / 教学楼', color: '#2563eb', icon: 'school', defaultOn: true },
  library: { label: '图书馆', color: '#0891b2', icon: 'local_library' },
  museum: { label: '博物馆 / 展馆', color: '#9333ea', icon: 'museum' },
  landmark: { label: '地标 / 学生中心', color: '#64748b', icon: 'place' },
};
const ORDER = ['department', 'library', 'museum', 'landmark'];

const decode = (s) => typeof s === 'string'
  ? s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
  : s;

// generous campus/metro radius (keeps satellite campuses) + global sanity box
const near = (anchor, lat, lng) =>
  Math.abs(lat - anchor[0]) < 1.6 && Math.abs(lng - anchor[1]) < 2.2 &&
  lat > -60 && lat < 72 && lng > -180 && lng < 180;

mkdirSync(here('../src/data/schools-map/generated'), { recursive: true });

let written = 0, dropped = 0;
const report = [];
for (const r of results) {
  if (!r || !r.data) continue;
  const d = r.data;
  const features = [];
  for (const key of ORDER) {
    const items = (d.categories && d.categories[key]) || [];
    const clean = [];
    for (const it of items) {
      if (typeof it.lat !== 'number' || typeof it.lng !== 'number') { dropped++; continue; }
      if (!near(r.anchor, it.lat, it.lng)) { dropped++; continue; }
      const o = { name: decode(it.name), nameCn: decode(it.nameCn), lat: it.lat, lng: it.lng };
      if (it.note) o.note = decode(it.note);
      clean.push(o);
    }
    if (clean.length) {
      const c = CATS[key];
      const f = { kind: 'pointLayer', key, label: c.label, color: c.color, icon: c.icon, items: clean };
      if (c.defaultOn) f.defaultOn = true;
      features.push(f);
    }
  }
  // campuses → zone circles ("点到面"); placed first so the toggle row leads.
  if (Array.isArray(d.campuses) && d.campuses.length) {
    const zitems = [];
    for (const z of d.campuses) {
      if (typeof z.lat !== 'number' || typeof z.lng !== 'number') { dropped++; continue; }
      if (!near(r.anchor, z.lat, z.lng)) { dropped++; continue; }
      const radius = Math.min(Math.max(Number(z.radius) || 300, 80), 2500);
      const o = { name: decode(z.name), nameCn: decode(z.nameCn), lat: z.lat, lng: z.lng, radius };
      if (z.note) o.note = decode(z.note);
      zitems.push(o);
    }
    if (zitems.length) features.unshift({ kind: 'zone', label: '校区 / 区域', color: '#16a34a', defaultOn: true, items: zitems });
  }

  const center = Array.isArray(d.center) && d.center.length === 2 && near(r.anchor, d.center[0], d.center[1]) ? d.center : r.anchor;
  const zoom = d.zoom >= 11 && d.zoom <= 17 ? d.zoom : 15;
  const scene = { id: r.id, type: 'school', name: r.name, nameCn: r.nameCn, city: r.city, center, zoom, blurb: decode(d.blurb) || '', features };
  writeFileSync(here(`../src/data/schools-map/generated/${r.id}.json`), JSON.stringify(scene, null, 2) + '\n');
  written++;
  report.push(`${r.id}:${features.reduce((n, f) => n + f.items.length, 0)}`);
}

console.log(`wrote ${written} scenes, dropped ${dropped} out-of-range points`);
console.log(report.join('  '));
