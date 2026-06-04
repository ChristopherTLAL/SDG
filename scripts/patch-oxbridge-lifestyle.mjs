#!/usr/bin/env node
// Insert lifestyle pointLayers into the hand-written TS scenes (cambridge.ts / oxford.ts).
// These don't go through merge-lifestyle (that only touches generated/*.json).
//   node scripts/patch-oxbridge-lifestyle.mjs <oxbridge-lifestyle-output.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const out = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const arr = Array.isArray(out) ? out : (out.result || []);

const CATS = [
  ['supermarket', '超市 / 亚超', '#ea580c', 'shopping_cart'],
  ['dining', '必吃 / 餐饮', '#dc2626', 'restaurant'],
  ['services', '生活服务', '#0e7490', 'account_balance'],
  ['attractions', '周边 / 打卡', '#db2777', 'photo_camera'],
];
const decode = (s) => typeof s === 'string'
  ? s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
  : s;
const q = (s) => JSON.stringify(decode(s)); // double-quoted, fully escaped — safe for esbuild
const near = (a, lat, lng) => Math.abs(lat - a[0]) < 0.25 && Math.abs(lng - a[1]) < 0.3;

for (const r of arr) {
  if (!r || !r.data) continue;
  const feats = [];
  for (const [key, label, color, icon] of CATS) {
    const items = (r.data[key] || []).filter((it) => typeof it.lat === 'number' && near(r.anchor, it.lat, it.lng));
    if (!items.length) continue;
    const itemsTS = items.map((it) =>
      `        { name: ${q(it.name)}, nameCn: ${q(it.nameCn)}, lat: ${it.lat}, lng: ${it.lng}${it.note ? `, note: ${q(it.note)}` : ''} },`
    ).join('\n');
    feats.push(`    {\n      kind: 'pointLayer',\n      key: '${key}',\n      label: '${label}',\n      color: '${color}',\n      icon: '${icon}',\n      items: [\n${itemsTS}\n      ],\n    },`);
  }
  if (!feats.length) continue;
  const file = here(`../src/data/schools-map/detail/${r.id}.ts`);
  let ts = readFileSync(file, 'utf8');
  // strip any previously-inserted lifestyle layers (idempotent)
  ts = ts.replace(/\n    \{\n      kind: 'pointLayer',\n      key: '(?:supermarket|dining|services|attractions)',[\s\S]*?\n    \},(?=\n(?:    \{\n      kind: 'pointLayer',\n      key: '(?:supermarket|dining|services|attractions)'|  \],\n\};))/g, '');
  const anchor = '\n  ],\n};';
  const idx = ts.lastIndexOf(anchor);
  if (idx === -1) { console.log('anchor not found in', r.id); continue; }
  ts = ts.slice(0, idx) + '\n' + feats.join('\n') + ts.slice(idx);
  writeFileSync(file, ts);
  console.log(`patched ${r.id}: +${feats.length} lifestyle layers, ${feats.reduce((n, f) => n + (f.match(/name:/g) || []).length, 0)} POIs`);
}
