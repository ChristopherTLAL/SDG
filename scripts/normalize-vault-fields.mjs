// One-shot YAML normalizer for student vault files.
// Run: node scripts/normalize-vault-fields.mjs
//
// After running, run `npm run sync-students` to push cleaned values to Supabase.
//
// Idempotent — re-running on already-canonical files makes no further edits.

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const VAULT = process.env.OBSIDIAN_VAULT_ROOT ||
  '/Users/shijie/Library/CloudStorage/OneDrive-Personal/Obsidian/规划看板';
const STUDENT_DIR = join(VAULT, '01_Student');

// Per-student exact-value rewrites. Keyed by folder name.
// Per-student per-token rewrites (substring-matched within the value, so
// the surrounding YAML shape — bare string / [array] / multi-value — doesn't
// matter). Order = how listed; multiple entries on one student are applied
// sequentially.
const EDITS = {
  '周怡敏': [{ key: '合同', from: '英国跃领研究生Max版', to: '英国跃领研究生MAX版' }],
  '孙钟谋': [{ key: '合同', from: '(前端新案)',          to: '待签' }],
  '吴雨彤': [{ key: '合同', from: 'TBD',                 to: '待签' }],
  '金梓屹': [{ key: '合同', from: '格物计划一年期',      to: '格物计划' }],
  '王米尔': [{ key: '合同', from: '高端合同(待签)',      to: '高端合同' }],
  '逯畅':   [{ key: '合同', from: '格物半年期',          to: '格物半年' }],
  '马江涛': [{ key: '合同', from: '博士合同',            to: '博士' }],
  '鞠睿':   [{ key: '合同', from: '格物一年期 (服务期2年)', to: '格物计划' }],
};

// Global field-value map (applied to every student where field's value matches).
const FIELD_MAPS = {
  '目前就读学校': {
    '西浦': '西交利物浦大学',
    '西浦（2+2）': '西交利物浦大学',
    '西浦2+': '西交利物浦大学',
    '人大（苏州校区）': '中国人民大学苏州校区',
    '苏州大学（中外合办项目4+0）': '苏州大学',
    '江苏大学 - 北亚利桑那大学中外合办（1+2+1）': '江苏大学',
    '江苏大学（中外合办项目）': '江苏大学',
    '苏州城市学院/鲍尔州立（1+2+1）': '苏州城市学院',
  },
};

async function processFile(folder) {
  const path = join(STUDENT_DIR, folder, `${folder}.md`);
  let raw;
  try { raw = await readFile(path, 'utf8'); }
  catch { return { touched: false, changes: [] }; }

  const lines = raw.split('\n');
  const changes = [];
  let inFrontmatter = false;
  let frontmatterEnded = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '---') {
      if (!inFrontmatter) inFrontmatter = true;
      else { frontmatterEnded = true; break; }
      continue;
    }
    if (!inFrontmatter || frontmatterEnded) continue;

    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (!m) continue;
    const [, rawKey, rawValue] = m;
    const key = rawKey.trim();
    const value = rawValue.trim();

    // Per-student edits: substring-match the `from` token anywhere in the
    // value. Handles three YAML shapes: bare string, ["…"] array, and
    // multi-value strings split by commas in either form.
    const studentEdit = EDITS[folder];
    if (studentEdit) {
      for (const f of studentEdit) {
        if (f.key !== key) continue;
        if (value.includes(f.from)) {
          const newValue = value.split(f.from).join(f.to);
          lines[i] = `${rawKey}: ${newValue}`;
          changes.push(`  ${key}: ${value} → ${newValue}`);
        }
      }
    }

    // Global field-value rewrites (school normalizations) — exact-match only,
    // since we don't want partial substring rewrites bleeding into longer names.
    const map = FIELD_MAPS[key];
    if (map && value in map) {
      const target = map[value];
      lines[i] = `${rawKey}: ${target}`;
      changes.push(`  ${key}: ${value} → ${target}`);
    }
  }

  if (changes.length === 0) return { touched: false, changes: [] };
  await writeFile(path, lines.join('\n'), 'utf8');
  return { touched: true, changes };
}

async function main() {
  const entries = await readdir(STUDENT_DIR, { withFileTypes: true });
  let touched = 0;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    const result = await processFile(entry.name);
    if (result.touched) {
      touched++;
      console.log(`✏  ${entry.name}`);
      for (const c of result.changes) console.log(c);
    }
  }
  console.log(`\nDone. Touched ${touched} student file${touched === 1 ? '' : 's'}.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
