#!/usr/bin/env node
/**
 * export-rankings.mjs — sync canonical ranks → the vault school-plan rankings file.
 *
 * The canonical dataset (src/data/universities/universities.json) is the SINGLE SOURCE
 * OF TRUTH for QS / ARWU / U.S. News ranks. This script refreshes the vault's
 * rankings_top200.json numbers IN PLACE — preserving its roster, names, key order —
 * matching each vault row to a canonical record by Chinese name, then English name.
 *
 * Idempotent: if nothing changed, the vault file is left untouched.
 * Run after editing ranks in universities.json:  node scripts/export-rankings.mjs
 *
 * This closes the "edit a rank in one place, everything updates" loop:
 *   universities.json → (build) schools map + budget calculator
 *                     → (this script) vault 选校表 rankings reference.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const VAULT = process.env.OBSIDIAN_VAULT_ROOT || '/Users/shijie/Obsidian/规划看板';
const VAULT_FILE = VAULT + '/_agents/skills/school-plan/references/rankings_top200.json';

const uni = JSON.parse(readFileSync(here('../src/data/universities/universities.json'), 'utf8'));
const vault = JSON.parse(readFileSync(VAULT_FILE, 'utf8'));

const norm = (s) =>
  s.toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[''`.,&\-–:]/g, ' ')
    .replace(/\b(the|university|college|of|at)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const byCn = new Map();
const byEn = new Map();
for (const u of uni) {
  if (!byCn.has(u.nameCn)) byCn.set(u.nameCn, u);
  const k = norm(u.name);
  if (!byEn.has(k)) byEn.set(k, u);
}
const canonFor = (v) => byCn.get(v.university_cn) || byEn.get(norm(v.university)) || null;
const na = (x) => (x == null || x === '') ? 'N/A' : String(x);

let changed = 0;
const unmatched = [];
for (const v of vault) {
  const c = canonFor(v);
  if (!c) { unmatched.push(v.university_cn); continue; }
  const qs = c.qsRank ?? v.qs_rank;
  const arwu = na(c.arwuRank);
  const us = na(c.usnewsRank);
  if (v.qs_rank !== qs || v.arwu_rank !== arwu || v.usnews_rank !== us) {
    v.qs_rank = qs;
    v.arwu_rank = arwu;
    v.usnews_rank = us;
    changed++;
  }
}

if (changed > 0) {
  writeFileSync(VAULT_FILE, JSON.stringify(vault, null, 2) + '\n');
  console.log(`vault rankings synced: ${changed} of ${vault.length} rows updated.`);
} else {
  console.log(`vault rankings already in sync (${vault.length} rows); file untouched.`);
}
if (unmatched.length) {
  console.log(`unmatched (in vault, not in canonical) ${unmatched.length}: ${unmatched.join(', ')}`);
}
