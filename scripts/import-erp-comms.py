#!/usr/bin/env python3
"""
import-erp-comms.py — import ERP 沟通记录 export → vault 沟通记录 .md files.

Idempotent: re-run safe. Each ERP record gets a sha1 dedupe ID stored in YAML;
files with matching ID are NOT re-written.

Usage:
  /usr/local/bin/python3 scripts/import-erp-comms.py [PATH_TO_XLSX]

If PATH_TO_XLSX omitted, defaults to ~/Downloads/goutongmingxibumen.xlsx.

What it does:
  1. Read ERP xlsx (sheet '创建时间', header at row 2, data at row 3+).
  2. For each row whose 学生姓名 has a vault folder: write a [ERP]-prefixed
     .md note into 01_Student/<姓名>/沟通记录/ if not already imported.
  3. Update each touched student's YAML `最后沟通时间` to max(existing, latest
     ERP date for that student).
  4. Print summary table: per-student count + per-creator count + skipped.

Does NOT touch: 沟通与纪要汇总 / 日报 / 待办看板. Existing manual notes are
preserved untouched.
"""
import openpyxl
import hashlib
import re
import sys
from datetime import datetime
from pathlib import Path
from collections import defaultdict, Counter

VAULT = Path('/Users/shijie/Obsidian/规划看板')
STUDENT_ROOT = VAULT / '01_Student'
DEFAULT_XLSX = Path.home() / 'Downloads' / 'goutongmingxibumen.xlsx'
TODAY = datetime.now().strftime('%Y-%m-%d')

XLSX = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_XLSX
if not XLSX.exists():
    print(f'ERROR: {XLSX} not found', file=sys.stderr)
    sys.exit(1)


def fmt_date(v):
    """Datetime / date / string → 'YYYY-MM-DD' or empty."""
    if v is None:
        return ''
    if isinstance(v, (datetime,)):
        return v.strftime('%Y-%m-%d')
    return str(v)[:10]


def fmt_dt(v):
    """Datetime → 'YYYY-MM-DD HH:MM:SS' for archive timestamps."""
    if v is None:
        return ''
    if isinstance(v, datetime):
        return v.strftime('%Y-%m-%d %H:%M:%S')
    return str(v)


def safe_filename(s, maxlen=30):
    """Strip filesystem-unsafe + whitespace-collapsing for filename use."""
    if not s:
        return '记录'
    s = re.sub(r'[/\\\n\r\t\0:|<>"*?]', '_', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return (s[:maxlen] or '记录').strip()


def sha1_short(parts):
    h = hashlib.sha1('|'.join(str(p) for p in parts).encode('utf-8')).hexdigest()
    return h[:12]


def existing_dedupe_ids(student_dir):
    """Scan student's 沟通记录/ for already-imported ERP IDs."""
    notes_dir = student_dir / '沟通记录'
    if not notes_dir.exists():
        return set()
    ids = set()
    for f in notes_dir.glob('[[]ERP[]]*.md'):
        try:
            head = f.read_text(encoding='utf-8', errors='ignore')[:600]
            m = re.search(r'^erp_dedupe_id:\s*(\S+)', head, re.MULTILINE)
            if m:
                ids.add(m.group(1))
        except Exception:
            pass
    return ids


def build_note(row_dict, dedupe_id):
    """Render the markdown body from row dict."""
    sname = row_dict.get('学生姓名') or ''
    sdate = fmt_date(row_dict.get('沟通日期'))
    creator = row_dict.get('创建人') or '(未知)'
    method = row_dict.get('沟通方式') or '(未填)'
    ctype = row_dict.get('沟通类型') or '常规沟通'
    content = row_dict.get('沟通内容') or ''
    remark = row_dict.get('备注') or ''
    next_date = fmt_date(row_dict.get('预计下次沟通日期'))
    next_focus = row_dict.get('下次沟通重点') or ''
    archived = fmt_dt(row_dict.get('归档时间'))

    school1 = row_dict.get('毕业/就读院校一') or ''
    school2 = row_dict.get('毕业/就读院校二') or ''
    major1 = row_dict.get('就读专业一') or ''
    major2 = row_dict.get('就读专业二') or ''
    gpa4 = row_dict.get('GPA4')
    gpa100 = row_dict.get('GPA100')
    toefl = row_dict.get('TOEFL')
    ielts = row_dict.get('IELTS')
    gre = row_dict.get('GRE')
    gmat = row_dict.get('GMAT')
    other_test = row_dict.get('其他考试') or ''
    test_remark = row_dict.get('备注（如考试记录）') or ''

    yaml_lines = [
        '---',
        'source: ERP',
        f'erp_dedupe_id: {dedupe_id}',
        f'学生姓名: {sname}',
        f'沟通日期: {sdate}',
        f'创建人: {creator}',
        f'沟通类型: {ctype}',
        f'沟通方式: {method}',
    ]
    if next_date:
        yaml_lines.append(f'预计下次沟通日期: {next_date}')
    if archived:
        yaml_lines.append(f'erp_archived_at: "{archived}"')
    yaml_lines.append(f'import_at: {TODAY}')
    yaml_lines.append('---')

    body = ['', f'# [ERP] {sname} {ctype} {sdate}', '']
    body.append(
        f'> ⚠️ 此记录从公司 ERP 系统批量导入（{TODAY}）。'
        f'创建人：**{creator}** | 类型：**{ctype}** | 方式：{method}'
    )
    body.append('')

    body.append('## 沟通内容')
    body.append('')
    body.append(content if content.strip() else '(无)')
    body.append('')

    body.append('## 下次沟通重点')
    body.append('')
    body.append(next_focus if next_focus.strip() else '(未填)')
    body.append('')

    body.append('## 备注')
    body.append('')
    body.append(remark if remark.strip() else '(无)')
    body.append('')

    # Standardized info block (only show if any data).
    info_bits = []
    if school1:
        info_bits.append(f'- 毕业/就读院校一：{school1}{f"  专业：{major1}" if major1 else ""}')
    if school2:
        info_bits.append(f'- 毕业/就读院校二：{school2}{f"  专业：{major2}" if major2 else ""}')
    if gpa4 is not None:
        info_bits.append(f'- GPA4：{gpa4}')
    if gpa100 is not None:
        info_bits.append(f'- GPA100：{gpa100}')
    if toefl is not None:
        info_bits.append(f'- TOEFL：{toefl}')
    if ielts is not None:
        info_bits.append(f'- IELTS：{ielts}')
    if gre is not None:
        info_bits.append(f'- GRE：{gre}')
    if gmat is not None:
        info_bits.append(f'- GMAT：{gmat}')
    if other_test:
        info_bits.append(f'- 其他考试：{other_test}')
    if test_remark:
        info_bits.append(f'- 考试备注：{test_remark}')

    if info_bits:
        body.append('## ERP 标化与背景快照（沟通时点）')
        body.append('')
        body.extend(info_bits)
        body.append('')

    return '\n'.join(yaml_lines + body)


def update_student_yaml_last_comm(student_dir, latest_date):
    """Update YAML 最后沟通时间 to max(existing, latest_date) — only if newer."""
    main_md = student_dir / f'{student_dir.name}.md'
    if not main_md.exists():
        return False
    text = main_md.read_text(encoding='utf-8')
    m = re.search(r'^最后沟通时间:\s*(\S*)\s*$', text, re.MULTILINE)
    if not m:
        return False
    existing = m.group(1).strip()
    if existing and existing >= latest_date:
        return False
    new_line = f'最后沟通时间: {latest_date}'
    new_text = re.sub(
        r'^最后沟通时间:.*$',
        new_line,
        text,
        count=1,
        flags=re.MULTILINE,
    )
    main_md.write_text(new_text, encoding='utf-8')
    return True


# ── Main ──
print(f'📦 ERP import — reading {XLSX}')
wb = openpyxl.load_workbook(XLSX, read_only=False, data_only=True)
# read_only=False because some ERP exports have a merged-cell title that
# causes read_only mode to mis-detect dimensions as A1:A1 (returns 1 row).
# Use '沟通时间' sheet — has 沟通日期 (actual conversation date), what we want
# semantically. '创建时间' sheet uses 创建日期 (when row was entered into ERP),
# which can lag the actual conversation by days/weeks.
ws = wb['沟通时间']
all_rows = list(ws.iter_rows(values_only=True))

# ERP export format: row 0 may be a title row ('中期顾问客户沟通明细表') or the
# real header. Auto-detect by looking for '学生姓名' in row 0 vs row 1.
required = {'学生姓名', '沟通日期', '创建人', '沟通类型', '沟通内容'}
def _row_is_header(row):
    return row is not None and '学生姓名' in (row or ()) and '沟通日期' in (row or ())

if _row_is_header(all_rows[0]):
    header_idx = 0
elif len(all_rows) > 1 and _row_is_header(all_rows[1]):
    header_idx = 1
else:
    print('ERROR: could not locate header row in sheet 沟通时间', file=sys.stderr)
    sys.exit(1)

header = all_rows[header_idx]
COL = {h: i for i, h in enumerate(header) if h}

missing = required - set(COL.keys())
if missing:
    print(f'ERROR: missing required header columns: {missing}', file=sys.stderr)
    sys.exit(1)

vault_students = {p.name: p for p in STUDENT_ROOT.iterdir()
                  if p.is_dir() and not p.name.startswith('_')}
print(f'  vault students: {len(vault_students)}')

# Build row dicts, filter for vault-matched students.
data_rows = all_rows[header_idx + 1:]  # skip up through header row
print(f'  ERP rows total: {len(data_rows)}')

# Track per-student records, pre-read existing dedupe IDs.
student_existing_ids = {}
student_latest_date = defaultdict(str)

stats = {
    'rows_read': 0,
    'skipped_no_name': 0,
    'skipped_not_in_vault': 0,
    'already_imported': 0,
    'newly_written': 0,
    'errors': 0,
}
per_creator = Counter()
per_student = Counter()
not_in_vault_names = Counter()

for r in data_rows:
    if not r:
        continue
    stats['rows_read'] += 1
    sname = r[COL['学生姓名']]
    if not sname:
        stats['skipped_no_name'] += 1
        continue
    sname = str(sname).strip()
    if sname not in vault_students:
        stats['skipped_not_in_vault'] += 1
        not_in_vault_names[sname] += 1
        continue

    sdir = vault_students[sname]
    if sname not in student_existing_ids:
        student_existing_ids[sname] = existing_dedupe_ids(sdir)

    row_dict = {h: r[i] for h, i in COL.items()}
    sdate = fmt_date(row_dict.get('沟通日期'))
    if not sdate:
        # Skip ERP rows with no 沟通日期 (rare, can't dedupe / file)
        stats['errors'] += 1
        continue

    creator = row_dict.get('创建人') or ''
    content_full = row_dict.get('沟通内容') or ''
    # Hash the FULL 沟通内容. The old key truncated to 200 chars, so two distinct
    # same-day/same-creator notes differing only after char 200 collided and the
    # second was silently dropped. `dedupe_id_legacy` (the old 200-char hash) is
    # still matched so previously-imported long notes aren't re-imported as dupes.
    dedupe_id = sha1_short([sname, sdate, creator, content_full])
    dedupe_id_legacy = sha1_short([sname, sdate, creator, content_full[:200]])

    if dedupe_id in student_existing_ids[sname] or dedupe_id_legacy in student_existing_ids[sname]:
        stats['already_imported'] += 1
        continue

    # Compose filename
    ctype = row_dict.get('沟通类型') or '常规沟通'
    summary_src = (row_dict.get('沟通内容') or row_dict.get('备注') or '').strip()
    summary = safe_filename(summary_src.split('\n')[0], maxlen=30)
    filename = f'[ERP] {sdate} {ctype} - {summary}.md'

    notes_dir = sdir / '沟通记录'
    notes_dir.mkdir(exist_ok=True)
    target = notes_dir / filename

    # Filename collision (same date+type+summary30) → append dedupe_id suffix
    if target.exists():
        # Check if it's already-our-import (would have been caught by dedupe scan).
        # Otherwise, append suffix.
        existing_text = target.read_text(encoding='utf-8', errors='ignore')[:500]
        if dedupe_id in existing_text or dedupe_id_legacy in existing_text:
            stats['already_imported'] += 1
            continue
        target = notes_dir / f'[ERP] {sdate} {ctype} - {summary}_{dedupe_id[:6]}.md'

    try:
        target.write_text(build_note(row_dict, dedupe_id), encoding='utf-8')
        stats['newly_written'] += 1
        per_creator[creator] += 1
        per_student[sname] += 1
        if sdate > student_latest_date[sname]:
            student_latest_date[sname] = sdate
    except Exception as e:
        stats['errors'] += 1
        print(f'  ERROR writing {target}: {e}', file=sys.stderr)

# Update YAML 最后沟通时间 for each touched student
yaml_updated = 0
for sname, latest in student_latest_date.items():
    sdir = vault_students[sname]
    if update_student_yaml_last_comm(sdir, latest):
        yaml_updated += 1

# ── Print summary ──
print()
print('═══ ERP Import Summary ═══')
for k, v in stats.items():
    print(f'  {k}: {v}')
print(f'  yaml_最后沟通时间_updated: {yaml_updated}')
print()

if per_creator:
    print('Records imported per 创建人:')
    for k, v in per_creator.most_common():
        print(f'  {k}: {v}')
    print()

if per_student:
    print(f'Top 15 students by ERP record count this run:')
    for k, v in per_student.most_common(15):
        print(f'  {k}: {v}')
    print()

if not_in_vault_names:
    print(f'⚠️  {len(not_in_vault_names)} ERP students not in vault (skipped). Top 10:')
    for k, v in not_in_vault_names.most_common(10):
        print(f'  {k}: {v}')
    print()
    print('  (These are likely closed cases / non-product clients. Add vault folder if needed.)')

print('Done.')
