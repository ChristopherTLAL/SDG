// Sync Obsidian student YAML → Supabase `students` table.
//
// Usage:
//   node scripts/sync-students-to-supabase.mjs
//
// Requires env vars:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   OBSIDIAN_VAULT_ROOT   (default: /Users/shijie/Library/CloudStorage/OneDrive-Personal/Obsidian/规划看板)
//
// Reads every `01_Student/<name>/<name>.md`, parses the YAML frontmatter,
// and upserts into `students` keyed by `name`.

import { readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import matter from 'gray-matter';
import 'dotenv/config';

const VAULT = process.env.OBSIDIAN_VAULT_ROOT ||
  '/Users/shijie/Library/CloudStorage/OneDrive-Personal/Obsidian/规划看板';
const STUDENT_DIR = join(VAULT, '01_Student');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Skip folders starting with `_` (reserved: _shared, _pending) or non-CJK/ASCII namespaced groups
const SKIP = new Set(['_shared', '_pending']);

function parseDate(val) {
  if (!val) return null;
  const s = String(val).trim();
  // YAML can come back as a Date object or a string. Normalize.
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return null;
  const [, y, mo, d] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function pickString(obj, key) {
  const v = obj[key];
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

// Coerce to text[] — accept string ("英国跃领"), array (["英国跃领"]), or null.
function pickArray(obj, key) {
  const v = obj[key];
  if (v === undefined || v === null) return [];
  if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
  const s = String(v).trim();
  if (!s) return [];
  // Allow comma-separated fallback
  return s.split(/[,，、]/).map(x => x.trim()).filter(Boolean);
}

async function loadStudents() {
  const entries = await readdir(STUDENT_DIR, { withFileTypes: true });
  const records = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (SKIP.has(entry.name)) continue;
    if (entry.name.startsWith('_')) continue;

    const folder = join(STUDENT_DIR, entry.name);
    const mdPath = join(folder, `${entry.name}.md`);

    let raw;
    try {
      raw = await readFile(mdPath, 'utf8');
    } catch (err) {
      console.warn(`  ⚠  ${entry.name}: no ${entry.name}.md, skipping`);
      continue;
    }

    let fm;
    try {
      fm = matter(raw).data;
    } catch (err) {
      console.warn(`  ⚠  ${entry.name}: YAML parse failed — ${err.message}`);
      continue;
    }

    // YAML uses Chinese keys. Map them to DB columns.
    // Contracts can be either array `合同: [英国跃领]` (current) or string `合同类型: 英国跃领` (legacy).
    const contracts = pickArray(fm, '合同');
    const legacyContractType = pickString(fm, '合同类型');
    const finalContracts = contracts.length ? contracts : (legacyContractType ? [legacyContractType] : []);

    const record = {
      name: pickString(fm, '姓名') || entry.name,
      enroll_year: pickString(fm, '入学年份'),
      stage: pickString(fm, '当前进度'),
      contracts: finalContracts,
      contract_type: legacyContractType ?? (finalContracts[0] ?? null),
      major_intention: pickString(fm, '意向专业方向'),
      major_current: pickString(fm, '专业'),
      current_school: pickString(fm, '目前就读学校'),
      grade: pickString(fm, '年级'),
      gpa: pickString(fm, 'GPA'),
      client_email: pickString(fm, '客户邮箱'),
      early_advisor: pickString(fm, '前期顾问'),
      mid_advisor: pickString(fm, '中期顾问'),
      last_contact_at: parseDate(fm['最后沟通时间']),
      obsidian_path: `01_Student/${entry.name}`,
      tags: [],
      synced_at: new Date().toISOString(),
    };

    records.push(record);
  }

  return records;
}

async function main() {
  console.log(`Reading vault at ${STUDENT_DIR} …`);
  const records = await loadStudents();
  console.log(`Parsed ${records.length} student records.\n`);

  if (!records.length) {
    console.log('Nothing to sync.');
    return;
  }

  // Upsert by `name` (the unique key).
  const { data, error } = await supabase
    .from('students')
    .upsert(records, { onConflict: 'name', ignoreDuplicates: false })
    .select('id, name');

  if (error) {
    console.error('Upsert failed:', error);
    process.exit(1);
  }

  console.log(`✅ Upserted ${data?.length ?? records.length} rows into students.`);

  // Print first 5 for a sanity check.
  for (const r of records.slice(0, 5)) {
    console.log(`   ${r.name.padEnd(10)} · ${r.stage ?? '—'.padEnd(6)} · ${r.last_contact_at ?? '—'}`);
  }
  if (records.length > 5) console.log(`   … and ${records.length - 5} more`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
