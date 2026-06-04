#!/usr/bin/env node
// Apply a coordinate-verification workflow output to the generated scenes (country-agnostic).
//   node scripts/apply-verify.mjs <verify-output.json>
// Corrections: {name, action:'fix', lat, lng} | {name, action:'remove'}. A "fix" that would
// move a point more than 30km is treated as suspicious and skipped (logged).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const GEN = here('../src/data/schools-map/generated');
const SRC = process.argv[2];
if (!SRC) { console.error('usage: apply-verify.mjs <output.json>'); process.exit(1); }

const raw = JSON.parse(readFileSync(SRC, 'utf8'));
const arr = Array.isArray(raw) ? raw : (raw.result || []);

const R = 6371000, rad = Math.PI / 180;
const dist = (a, b, c, d) => { const x = Math.sin((c - a) * rad / 2) ** 2 + Math.cos(a * rad) * Math.cos(c * rad) * Math.sin((d - b) * rad / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
const sane = (lat, lng) => lat > -60 && lat < 72 && lng > -180 && lng < 180;

let fixed = 0, removed = 0, miss = 0, big = 0, schools = 0;
const bigList = [];
for (const r of arr) {
  if (!r || !r.id || !Array.isArray(r.corrections) || !r.corrections.length) continue;
  const path = `${GEN}/${r.id}.json`;
  let scene;
  try { scene = JSON.parse(readFileSync(path, 'utf8')); } catch { continue; }
  for (const c of r.corrections) {
    let done = false;
    for (const f of scene.features) {
      const i = f.items.findIndex((it) => it.name === c.name);
      if (i === -1) continue;
      if (c.action === 'remove') { f.items.splice(i, 1); removed++; done = true; }
      else if (c.action === 'fix' && typeof c.lat === 'number' && typeof c.lng === 'number' && sane(c.lat, c.lng)) {
        const dm = dist(f.items[i].lat, f.items[i].lng, c.lat, c.lng);
        if (dm > 30000) { big++; bigList.push(`${r.id} "${c.name}" ${(dm / 1000).toFixed(1)}km — SKIPPED`); }
        else { f.items[i].lat = c.lat; f.items[i].lng = c.lng; fixed++; }
        done = true;
      }
      break;
    }
    if (!done) miss++;
  }
  scene.features = scene.features.filter((f) => f.items.length);
  writeFileSync(path, JSON.stringify(scene, null, 2) + '\n');
  schools++;
}
console.log(`applied to ${schools} schools — fixed ${fixed}, removed ${removed}, miss ${miss}, skipped(>30km) ${big}`);
if (bigList.length) console.log(bigList.join('\n'));
