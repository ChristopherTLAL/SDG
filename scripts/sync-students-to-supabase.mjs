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

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import matter from 'gray-matter';
import 'dotenv/config';

const VAULT = process.env.OBSIDIAN_VAULT_ROOT ||
  '/Users/shijie/Library/CloudStorage/OneDrive-Personal/Obsidian/规划看板';
const STUDENT_DIR = join(VAULT, '01_Student');
const REPORTS_DIR = join(VAULT, '02_Project Manager');

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

// Find a YYYY-MM-DD anywhere in a filename, e.g. "刘昱彤 规划沟通 2026-04-17"
function dateFromName(name) {
  const m = name.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return null;
  const [, y, mo, d] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

async function listDir(path) {
  try {
    return await readdir(path, { withFileTypes: true });
  } catch {
    return [];
  }
}

// Read all .md files in 01_Student/<name>/沟通记录/
async function loadCommunicationNotes(studentFolder, studentName) {
  const notesDir = join(studentFolder, '沟通记录');
  const entries = await listDir(notesDir);
  const notes = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    if (extname(e.name).toLowerCase() !== '.md') continue;
    const noteName = e.name.slice(0, -3); // strip .md
    let raw = '';
    try {
      raw = await readFile(join(notesDir, e.name), 'utf8');
    } catch {
      continue;
    }
    // Strip YAML frontmatter if present, keep body only
    let body = raw;
    try {
      body = matter(raw).content;
    } catch {
      // ignore — fall back to raw
    }
    notes.push({
      note_name: noteName,
      body_md: body,
      obsidian_path: `01_Student/${studentName}/沟通记录/${e.name}`,
      note_date: dateFromName(noteName),
    });
  }
  return notes;
}

// List filenames in 01_Student/<name>/个性化材料/
async function loadAttachmentNames(studentFolder) {
  const attachDir = join(studentFolder, '个性化材料');
  const entries = await listDir(attachDir);
  return entries.filter(e => e.isFile() && !e.name.startsWith('.')).map(e => e.name);
}

async function loadStudents() {
  const entries = await readdir(STUDENT_DIR, { withFileTypes: true });
  const records = [];
  const notesByStudentName = new Map(); // name → notes[]

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

    let parsed;
    try {
      parsed = matter(raw);
    } catch (err) {
      console.warn(`  ⚠  ${entry.name}: YAML parse failed — ${err.message}`);
      continue;
    }
    const fm = parsed.data;
    const body = parsed.content ?? '';

    // YAML uses Chinese keys. Map them to DB columns.
    // Contracts can be either array `合同: [英国跃领]` (current) or string `合同类型: 英国跃领` (legacy).
    const contracts = pickArray(fm, '合同');
    const legacyContractType = pickString(fm, '合同类型');
    const finalContracts = contracts.length ? contracts : (legacyContractType ? [legacyContractType] : []);

    const attachments = await loadAttachmentNames(folder);
    const commNotes = await loadCommunicationNotes(folder, entry.name);

    const studentName = pickString(fm, '姓名') || entry.name;

    const record = {
      name: studentName,
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
      body_md: body,
      attachments,
      tags: [],
      synced_at: new Date().toISOString(),
    };

    records.push(record);
    notesByStudentName.set(studentName, commNotes);
  }

  return { records, notesByStudentName };
}

async function syncStudentNotes(studentIdByName, notesByStudentName) {
  let totalNotes = 0;
  let totalStudents = 0;

  for (const [studentName, notes] of notesByStudentName) {
    const studentId = studentIdByName.get(studentName);
    if (!studentId) continue;
    totalStudents++;

    // Replace strategy: delete all this student's notes, then insert current set.
    // Simpler than diffing and keeps the table free of orphans when files get renamed/deleted.
    const { error: delErr } = await supabase
      .from('student_notes')
      .delete()
      .eq('student_id', studentId);
    if (delErr) {
      console.warn(`  ⚠  ${studentName}: delete old notes failed — ${delErr.message}`);
      continue;
    }

    if (!notes.length) continue;

    const rows = notes.map(n => ({
      student_id: studentId,
      note_name: n.note_name,
      body_md: n.body_md,
      obsidian_path: n.obsidian_path,
      note_date: n.note_date,
      synced_at: new Date().toISOString(),
    }));

    const { error: insErr } = await supabase.from('student_notes').insert(rows);
    if (insErr) {
      console.warn(`  ⚠  ${studentName}: insert notes failed — ${insErr.message}`);
      continue;
    }
    totalNotes += rows.length;
  }

  return { totalNotes, totalStudents };
}

// Read all 02_Project Manager/日报-*.md files and upsert into daily_reports.
async function syncDailyReports() {
  let entries;
  try {
    entries = await readdir(REPORTS_DIR, { withFileTypes: true });
  } catch {
    return { count: 0, advisors: [] };
  }

  const reports = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    const m = e.name.match(/^日报-(.+)\.md$/);
    if (!m) continue;
    const advisor = m[1].trim();
    if (!advisor) continue;

    let body = '';
    try {
      body = await readFile(join(REPORTS_DIR, e.name), 'utf8');
    } catch {
      continue;
    }
    reports.push({
      advisor,
      body_md: body,
      obsidian_path: `02_Project Manager/${e.name}`,
      synced_at: new Date().toISOString(),
    });
  }

  if (!reports.length) return { count: 0, advisors: [] };

  const { error } = await supabase
    .from('daily_reports')
    .upsert(reports, { onConflict: 'advisor', ignoreDuplicates: false });

  if (error) {
    console.warn('  ⚠  daily_reports upsert failed:', error.message);
    return { count: 0, advisors: [] };
  }

  return { count: reports.length, advisors: reports.map(r => r.advisor) };
}

async function main() {
  console.log(`Reading vault at ${STUDENT_DIR} …`);
  const { records, notesByStudentName } = await loadStudents();
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

  // Sync communication notes (one extra step per student).
  const studentIdByName = new Map((data ?? []).map(r => [r.name, r.id]));
  const { totalNotes, totalStudents } = await syncStudentNotes(studentIdByName, notesByStudentName);
  console.log(`\n✅ Synced ${totalNotes} communication notes across ${totalStudents} students.`);

  // Sync per-advisor daily reports.
  const { count: dailyCount, advisors } = await syncDailyReports();
  console.log(`\n✅ Synced ${dailyCount} daily report${dailyCount === 1 ? '' : 's'}: ${advisors.join(', ') || '—'}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
