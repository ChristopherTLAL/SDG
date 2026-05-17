#!/usr/bin/env python3
"""
import-signings.py — single source of truth for contract data.

Reads the latest *客户签约明细*.xlsx from ~/Downloads (auto-pick by mtime).

Three things it does, all idempotent:

1. **Update existing vault students' YAML**:
   - add `客户ID: [...]` (array, supports sibling-combined folders)
   - add `合同签约人: [...]` (alias for special cases like Kimi+Byran → LI KIMI)
   - rewrite `合同明细` from signing data (drop 预收余额 / 已收 / 已交付 fields)
   - new contract entry shape: 名称 / 大类 / 签约日期 / 签约金额 / 合同状态 / 合同编号

2. **Onboard new vault folders** for advisors who lack vault coverage
   (currently 钟婷婷 + 古淑婷 — extend ONBOARD_ADVISORS list).
   - skips if folder already exists
   - if name collides with existing vault folder → suffix with " (中期顾问)"
   - intake-year-based 当前进度 (2025F or earlier = 已结案, 2026F = 后期在途, 2027F+ = 中期在途)

3. **Push full signing data to Supabase contracts table** (UPSERT by 合同编号).

After running this, also rerun:
   /usr/local/bin/python3 scripts/import-erp-comms.py
   (so newly-onboarded students get their ERP historical 沟通 archived)
   node scripts/sync-students-to-supabase.mjs
   (so dashboard sees the changes)
"""
import json
import os
import re
import sys
import urllib.request
import urllib.error
from collections import defaultdict, Counter
from datetime import datetime, date, timedelta
from pathlib import Path

import openpyxl


# ── Config ───────────────────────────────────────────────────────────────

VAULT = Path('/Users/shijie/Library/CloudStorage/OneDrive-Personal/Obsidian/规划看板/01_Student')
SDG_HTML = Path('/Users/shijie/Code/sdg-html')
ENV_FILE = SDG_HTML / '.env'

# Resolve signing xlsx source:
#   1. CLI arg (highest priority) — explicit override
#   2. Default: pick LARGEST *客户签约明细*.xlsx across ~/Downloads/ AND
#      ~/Downloads/_工作运营/ (full-history file is always >1MB, weekly slices <50KB).
#      We choose by size, not mtime, because the weekly file is sometimes newer
#      than the most recent full export — and we always prefer full-history for
#      Phase A vault override + contracts table refresh to be effective.
def _largest_signing_xlsx():
    search_dirs = [
        Path.home() / 'Downloads',
        Path.home() / 'Downloads' / '_工作运营',
    ]
    cands = []
    for d in search_dirs:
        if not d.exists():
            continue
        for p in d.glob('*客户签约明细*.xlsx'):
            if p.name.startswith('~$'):
                continue
            cands.append(p)
    if not cands:
        raise FileNotFoundError(
            'No *客户签约明细*.xlsx found in ~/Downloads or ~/Downloads/_工作运营')
    # Largest = full history; tie-break by mtime (newer)
    return max(cands, key=lambda p: (p.stat().st_size, p.stat().st_mtime))

if len(sys.argv) > 1 and sys.argv[1] not in ('-h', '--help'):
    XLSX = Path(sys.argv[1]).expanduser()
    if not XLSX.exists():
        print(f'ERROR: {XLSX} not found', file=sys.stderr)
        sys.exit(1)
elif len(sys.argv) > 1:
    print(__doc__)
    print(f'\nUsage: {sys.argv[0]} [path/to/*客户签约明细*.xlsx]')
    print(f'\nNo arg → auto-pick LARGEST file across ~/Downloads/ + _工作运营/')
    print(f'Override → pass explicit path (e.g. for testing weekly slice)')
    sys.exit(0)
else:
    XLSX = _largest_signing_xlsx()


# Aliases — vault folder name → list of contract signer 客户姓名
# Add new entries here as you discover them.
ALIASES = {
    'Kimi+Byran':  ['LI KIMI', 'Bryan Wang'],
    'Sophia+Amy':  ['LI XINYING', 'Sophia Wang'],
    'Betty':       ['陈碧涵'],
}

# 重名 disambiguation — vault folder name → exact 客户ID to use
# (only one ID; for sibling folders use ALIASES instead).
DISAMBIG = {
    '李子萱':           'P24AABbujT1xmUc95246',
    '周鑫':             'P24AABXx3yxxmUc90018',
    '胡斌':             'P24AABpPeLNxmUc92018',
    '李想 (钟婷婷)':    'P24AAB2YSCFxmUc95258',  # vault folder 后缀，避免每次跑都尝试 re-onboard
    '王思涵':           'P24AAB73Y11xmUc94528',  # vault 实际只有 27F (古淑婷线)，另一个 23F cid 是误绑
}

# 私单 detection is now YAML-driven (2026-05-17 onward).
# vault .md frontmatter `合同` 字段含 `私单` 或 `私单（非公司合同）` 的学生会
# 被识别为私单并跳过 ERP 匹配 / 不被 import-signings.py 改写 YAML。
# 不要再 hardcode 名字 list — 在 vault YAML 改 `合同: [私单]` 即可。
PRIVATE_CONTRACT_LABELS = ('私单', '私单（非公司合同）')

# Onboard new vault folders for these advisors' uncovered students:
ONBOARD_ADVISORS = ['钟婷婷', '古淑婷', '高幸玲', '王姝琰']

TODAY = datetime.now().strftime('%Y-%m-%d')


# ── Helpers ──────────────────────────────────────────────────────────────

def cleanup_addon_name(s):
    """Clean up contract template name → stable 大类 string.

    Strips:
      - year prefix (2023 / 23财 / 23 财年)
      - 项目/服务合同 etc. suffix words
      - **OA codes** (TY-OAxxxxxxxx#NN-MM, US-OAxxxxx, UK-OAxxxxx#N etc.)
        — these were leaking into 大类 and creating false granularity
        (e.g. 'AST学术指导（线下一对一40小时）TY-OA17890191#7' should be
        just 'AST学术指导（线下一对一40小时）').
    """
    s = re.sub(r'^\d{4}\s*财?\s*', '', s)
    s = re.sub(r'^\d{2}\s*财?\s*年?\s*', '', s)
    # Strip ERP OA codes FIRST (they sit at the tail; doing this before the
    # 服务合同 cleanup catches names like "...服务合同TY-OA17491816#3-21").
    # Pattern: [LETTERS]-OA<digits>(  -<digits> OR #<digits>(-<digits>)? )*
    s = re.sub(r'\s*[A-Z]{2}-OA\d+(?:[#-]\d+(?:-\d+)?)*\s*$', '', s)
    s = re.sub(r'\s*(项目服务合同|项目合同|服务合同|项目服务|合同|项目)\s*(?=[（(])', '', s)
    s = re.sub(r'\s*(项目服务合同|项目合同|服务合同|项目服务|合同|项目)\s*$', '', s)
    return s.strip()


def category(s):
    """Map 合同模板名称 → 大类. Same logic as sync-financial-to-vault.py."""
    if not s:
        return 'unknown'
    if "跃领" in s and "博士" in s: return "跃领-博士版"
    if "跃领" in s and "本科" in s: return "跃领-本科版"
    if "跃领" in s and "科研" in s: return "跃领-科研addon"
    if "跃领" in s: return "跃领"
    if "格物" in s and ("半年" in s or "（半年）" in s): return "格物-半年"
    if "格物" in s and ("一年" in s or "（一年）" in s): return "格物-一年"
    if "格物" in s: return "格物-一年"
    if "精英预备" in s: return "精英预备课程"
    if "菁英" in s and "博士" in s: return "博士"
    if "菁英" in s: return "菁英"
    if "亚洲英文授课博士" in s or "亚洲英文授课硕士" in s: return "亚洲博士"
    if "亚洲英语系高端" in s or "欧亚" in s or "亚英高端" in s: return "亚洲英语系高端"
    if "亚洲英文授课" in s and ("研究生" in s or "本科" in s or "授课式" in s): return "亚洲英语系高端"
    if "新港澳" in s or "新港" in s or "中国港澳" in s: return "新港澳联申"
    if "美国研究生启航" in s: return "启航"
    if "美国研究生快捷当季" in s or "美国研究生快捷" in s: return "美国研究生快捷"
    if "美研尊享" in s or "美国研究生尊享" in s: return "尊享"
    if ("澳大利亚" in s or "加拿大" in s) and "签证" in s: return cleanup_addon_name(s)
    if "澳大利亚" in s or "澳新" in s: return "澳洲申请"
    if "加拿大" in s: return "加拿大申请"
    if "云中学" in s: return "云中学"
    if "香港" in s or "港-" in s or "港A" in s or "港授课" in s: return "港申请"
    if "英国本科" in s: return "英国本科"
    if "英国研究生" in s and "博士" in s: return "英国硕博"
    if "美国线上中学" in s: return "美国本科预备"
    if "欧洲英语系博士" in s: return "欧洲博士"
    return cleanup_addon_name(s)


def is_yes(v):
    return v == '是' or v is True or v == 1 or v == '1'


def parse_date(v):
    if v is None:
        return None
    if isinstance(v, (datetime, date)):
        return v.strftime('%Y-%m-%d')
    s = str(v).strip()
    if not s:
        return None
    return s[:10]


def progress_for_intake(intake_year):
    """Map intake_year to 当前进度. As of today (2026):
        ≤ 2025: 已结案 (graduated / enrolled)
        2026:   后期在途 (final stretch)
        ≥ 2027: 中期在途 (still in mid stage)
    """
    if intake_year is None:
        return '中期在途'
    try:
        y = int(intake_year)
    except (TypeError, ValueError):
        return '中期在途'
    if y <= 2025: return '已结案'
    if y == 2026: return '后期在途'
    return '中期在途'


def safe_yaml_str(s):
    """YAML-safe string (quote if contains special chars)."""
    if s is None:
        return ''
    s = str(s)
    if any(c in s for c in [':', '#', '@', '`', '"', "'", '[', ']', '{', '}', '\n']):
        return '"' + s.replace('"', '\\"') + '"'
    return s


# ── Read .env for Supabase ──────────────────────────────────────────────

def load_env():
    env = {}
    if not ENV_FILE.exists():
        print(f'⚠ .env not found at {ENV_FILE}; Supabase upload will be skipped', file=sys.stderr)
        return env
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


# ── Read signing xlsx ───────────────────────────────────────────────────

def read_signings():
    print(f'📖 Reading {XLSX.name}')
    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    ws = wb['签约明细']
    header = [c.value for c in next(ws.iter_rows(min_row=1, max_row=1))]
    COL = {h: i for i, h in enumerate(header) if h}
    rows = []
    for r in ws.iter_rows(min_row=2, values_only=True):
        if r and r[COL['客户姓名']] and r[COL['客户ID']] and r[COL['合同编号']]:
            rows.append(r)
    print(f'   {len(rows)} contract rows')
    return rows, COL


# ── Read existing vault ─────────────────────────────────────────────────

def _yaml_scalar(yaml_text, key):
    """读 YAML frontmatter 里 `key: value` 的标量值. 空值返回 ''.
    用 `[ \\t]*` 不用 `\\s*` 以避免吃下一行的换行 + 字段名."""
    m = re.search(rf'^{re.escape(key)}:[ \t]*(.*?)$', yaml_text, re.MULTILINE)
    if not m:
        return None
    return m.group(1).strip()


def _yaml_is_private(text):
    """True iff frontmatter `合同` 字段含 PRIVATE_CONTRACT_LABELS 中的任一标签.
    驱动私单识别 — 取代之前 hardcode 的 PRIVATE_NO_SIGNING name list。"""
    m = re.match(r'^---\s*\n(.*?)\n---', text, re.DOTALL)
    if not m:
        return False
    val = _yaml_scalar(m.group(1), '合同')
    if not val:
        return False
    return any(label in val for label in PRIVATE_CONTRACT_LABELS)


def _yaml_advisor_fields(text):
    """从 vault .md frontmatter 抽取 中期/前期/后期 顾问 (primary, 多顾问取第一个).
    返回 dict {'mid': ..., 'early': ..., 'late': ...}, 找不到的 key 缺失.
    用于 Phase A: contracts 表 mid/early/late_advisor 用 vault 值覆盖 ERP 值."""
    m = re.match(r'^---\s*\n(.*?)\n---', text, re.DOTALL)
    if not m:
        return {}
    yaml = m.group(1)
    out = {}
    for yaml_key, out_key in [('中期顾问', 'mid'), ('前期顾问', 'early'), ('后期顾问', 'late')]:
        val = _yaml_scalar(yaml, yaml_key)
        if not val:
            continue
        if val.startswith('['):
            items = [s.strip().strip('"').strip("'") for s in val.strip('[]').split(',')]
            items = [i for i in items if i]
            if items:
                out[out_key] = items[0]
        else:
            out[out_key] = val.strip('"').strip("'")
    return out


def read_vault_students():
    students = []
    for p in sorted(VAULT.iterdir()):
        if not p.is_dir() or p.name.startswith('_'):
            continue
        md = p / f'{p.name}.md'
        if not md.exists():
            continue
        text = md.read_text(encoding='utf-8', errors='ignore')
        students.append({
            'folder': p,
            'name': p.name,
            'md_path': md,
            'is_private': _yaml_is_private(text),
            'advisors': _yaml_advisor_fields(text),  # Phase A: cache 顾问字段，避免重读
        })
    return students


# ── Build customer_id → student folder mapping ─────────────────────────

def build_customer_to_folder_map(rows, COL, vault_students):
    """Returns dict[customer_id] = folder_name (or None if unmapped)."""
    name_to_ids = defaultdict(set)
    for r in rows:
        name_to_ids[r[COL['客户姓名']]].add(r[COL['客户ID']])

    cid_to_folder = {}
    folder_to_cids = defaultdict(set)
    folder_signers = defaultdict(set)  # folder → set of 客户姓名 used in signing

    private_folders = sorted(vs['name'] for vs in vault_students if vs['is_private'])
    if private_folders:
        print(f'🔒 私单 folders 跳过 ERP 匹配 ({len(private_folders)}): {private_folders}')

    # 重名保护: ERP 中 客户姓名 X → >1 个不同 cid, 且 vault 有同名非私单 folder,
    # 但没有 DISAMBIG entry 显式选 cid → 不自动绑定（防止把两个真实不同客户的
    # 合同合并写进同一个 vault 文件夹）。这种情况要么加 DISAMBIG，要么走 onboard
    # 自动建 "X (中期顾问名)" suffix folder。
    aliased_signers = {s for signers in ALIASES.values() for s in signers}
    ambiguous_names = set()
    for name, ids in name_to_ids.items():
        if len(ids) <= 1:
            continue
        if name in DISAMBIG or name in aliased_signers:
            continue
        vault_match = [vs for vs in vault_students
                       if vs['name'] == name and not vs['is_private']]
        if vault_match:
            ambiguous_names.add(name)
            print(f'⚠ 重名: ERP 有 {len(ids)} 个 cid 客户姓名 == "{name}"  '
                  f'→ vault folder 不自动绑定。要绑定请加 DISAMBIG: {sorted(ids)}')

    for vs in vault_students:
        name = vs['name']

        if vs['is_private']:
            continue  # 私单 — 跟 ERP 完全隔离

        # ALIASES first (sibling-combined / English-name signed)
        if name in ALIASES:
            for signer in ALIASES[name]:
                for cid in name_to_ids.get(signer, set()):
                    cid_to_folder[cid] = name
                    folder_to_cids[name].add(cid)
                    folder_signers[name].add(signer)
            continue

        # DISAMBIG (重名 with explicit ID choice)
        if name in DISAMBIG:
            cid = DISAMBIG[name]
            cid_to_folder[cid] = name
            folder_to_cids[name].add(cid)
            folder_signers[name].add(name)
            continue

        if name in ambiguous_names:
            continue  # 重名未消歧 — 跳过自动绑定

        # Normal direct name match
        ids = name_to_ids.get(name, set())
        for cid in ids:
            cid_to_folder[cid] = name
            folder_to_cids[name].add(cid)
            folder_signers[name].add(name)

    return cid_to_folder, folder_to_cids, folder_signers


# ── Identify new students to onboard ────────────────────────────────────

def identify_onboard_candidates(rows, COL, cid_to_folder, vault_folder_names):
    """For each ONBOARD_ADVISORS, find customers (留学申请=是) not covered by vault."""
    candidates = {}  # cid -> {name, advisor, intake, count, total}
    for r in rows:
        adv = r[COL['中期顾问']]
        if adv not in ONBOARD_ADVISORS:
            continue
        if not is_yes(r[COL['是否包含留学申请']]):
            continue
        cid = r[COL['客户ID']]
        if cid in cid_to_folder:
            continue  # already covered
        nm = r[COL['客户姓名']]
        if cid not in candidates:
            candidates[cid] = {
                'cid': cid,
                'name': nm,
                'advisor': adv,
                'intake': r[COL['入学年']],
                'count': 0,
                'total': 0.0,
            }
        candidates[cid]['count'] += 1
        candidates[cid]['total'] += r[COL['签约金额（实时）']] or 0
        # Prefer earliest non-null intake_year
        if r[COL['入学年']] and not candidates[cid]['intake']:
            candidates[cid]['intake'] = r[COL['入学年']]

    # Detect collisions with existing vault folders + within candidate list
    final = []
    for cid, c in candidates.items():
        target_folder_name = c['name']
        # If collides with existing vault → suffix with " (advisor)"
        if target_folder_name in vault_folder_names:
            target_folder_name = f"{c['name']} ({c['advisor']})"
        c['target_folder'] = target_folder_name
        final.append(c)
    return final


# ── YAML rewrite: 合同明细 ──────────────────────────────────────────────

def render_contracts_yaml(contracts):
    """Render 合同明细 list as YAML (with 2-space indent, list-of-dict)."""
    if not contracts:
        return ''
    lines = []
    for c in contracts:
        lines.append(f'  - 名称: {safe_yaml_str(c["template_name"])}')
        lines.append(f'    大类: {safe_yaml_str(c["category"])}')
        lines.append(f'    签约日期: {c["signed_at"]}')
        amt = c.get('signed_amount')
        if amt is not None:
            lines.append(f'    签约金额: {amt:.2f}' if isinstance(amt, float) else f'    签约金额: {amt}')
        lines.append(f'    合同状态: {safe_yaml_str(c["status"])}')
        lines.append(f'    合同编号: {safe_yaml_str(c["contract_id"])}')
    return '\n'.join(lines)


def render_main_categories(contracts):
    """List of unique 大类 values, ordered by first appearance."""
    seen = set()
    result = []
    for c in contracts:
        if c['category'] not in seen:
            seen.add(c['category'])
            result.append(c['category'])
    return result


# ── YAML field replace helpers ──────────────────────────────────────────

def replace_yaml_field(text, field, new_value_block):
    """Replace `field: ...` (single-line OR multi-line list) with new_value_block.
    If field doesn't exist, append before the closing `---`.
    """
    # Match: "field: <value>\n" OR "field:\n  - ...\n  - ...\n"
    pattern = re.compile(
        rf'^{re.escape(field)}:.*?(?=^\S|\Z)',
        re.MULTILINE | re.DOTALL,
    )
    if pattern.search(text):
        # Replace
        return pattern.sub(new_value_block.rstrip() + '\n', text, count=1)
    else:
        # Insert before closing ---
        m = re.search(r'^---\s*\n(.*?)\n---', text, re.DOTALL | re.MULTILINE)
        if m:
            insertion = new_value_block.rstrip() + '\n'
            return text[:m.end(1) + 1] + insertion + text[m.end(1) + 1:]
        return text


def update_existing_student_yaml(md_path, customer_ids, signers, contracts):
    """Rewrite YAML frontmatter for an existing student."""
    text = md_path.read_text(encoding='utf-8')

    # Defensive: never overwrite 私单 — even if upstream logic misroutes here.
    # 2026-05-17 bug: hardcoded PRIVATE_NO_SIGNING + accidental name collision
    # caused legacy sync-financial-to-vault.py to overwrite 王世杰's 私单 李想 with
    # 钟婷婷的 ERP 李想 数据. Belt-and-suspenders check.
    if _yaml_is_private(text):
        return False

    # Build new value blocks
    cid_block = '客户ID: [' + ', '.join(customer_ids) + ']'

    if signers and (set(signers) - {md_path.parent.name}):
        # Has alias signers (different from folder name)
        alias_list = sorted(s for s in signers if s != md_path.parent.name)
        if alias_list:
            signer_block = '合同签约人: [' + ', '.join(alias_list) + ']'
        else:
            signer_block = None
    else:
        signer_block = None

    cats = render_main_categories(contracts)
    cat_block = '合同: [' + ', '.join(cats) + ']' if cats else '合同: []'

    detail_block = '合同明细:\n' + render_contracts_yaml(contracts) if contracts else '合同明细: []'

    # Apply replacements
    new_text = text
    new_text = replace_yaml_field(new_text, '客户ID', cid_block)
    if signer_block is not None:
        new_text = replace_yaml_field(new_text, '合同签约人', signer_block)
    # Drop legacy 预收 / 已收 / 已交付 / 优惠 fields by rewriting 合同明细
    new_text = replace_yaml_field(new_text, '合同', cat_block)
    new_text = replace_yaml_field(new_text, '合同明细', detail_block)

    if new_text != text:
        md_path.write_text(new_text, encoding='utf-8')
        return True
    return False


def create_new_student_folder(target_folder, advisor, intake_year, customer_id, contracts):
    """Build a new vault student folder + minimal YAML + subdirs."""
    folder = VAULT / target_folder
    if folder.exists():
        return False  # idempotent
    folder.mkdir()
    (folder / '沟通记录').mkdir()
    (folder / '个性化材料').mkdir()
    (folder / '文书材料').mkdir()

    progress = progress_for_intake(intake_year)
    intake_label = f'{intake_year} fall' if intake_year else '待补'

    cats = render_main_categories(contracts)
    cat_str = '[' + ', '.join(cats) + ']' if cats else '[]'

    detail = render_contracts_yaml(contracts) if contracts else ''

    yaml_block = f"""---
标签: 学生档案
姓名: {target_folder}
当前进度: {progress}
入学年份: {intake_label}
目标地区: 待补
目前就读学校: 待补
专业:
意向专业方向:
中期顾问: {advisor}
前期顾问:
后期顾问:
客户邮箱:
最后沟通时间:
客户ID: [{customer_id}]
合同: {cat_str}
合同明细:
{detail}
---

# {target_folder} 的学生档案

## 备注

> 自动建档来源签约表（{TODAY}）— 中期顾问 = **{advisor}**
> ⚠ 该 folder 由 import-signings.py 自动创建。基本信息（学校 / 专业 / 邮箱）需补全。

## 沟通与纪要汇总
<!-- 使用 Agent 工作流每次更新时将链接追加到这里 -->

## 个性化材料

## 文书材料
"""
    (folder / f'{target_folder}.md').write_text(yaml_block, encoding='utf-8')
    return True


# ── Supabase upload ─────────────────────────────────────────────────────

def supabase_upsert_contracts(env, contract_rows):
    """Bulk UPSERT contract rows to Supabase. Uses PostgREST UPSERT
    (POST + Prefer: resolution=merge-duplicates)."""
    url = env.get('SUPABASE_URL')
    key = env.get('SUPABASE_SERVICE_ROLE_KEY')
    if not url or not key:
        print('⚠ Skipping Supabase upload (env missing)')
        return 0

    # Batch in chunks of 500
    BATCH = 500
    total_ok = 0
    for i in range(0, len(contract_rows), BATCH):
        chunk = contract_rows[i:i + BATCH]
        body = json.dumps(chunk, ensure_ascii=False, default=str).encode('utf-8')
        req = urllib.request.Request(
            f'{url}/rest/v1/contracts',
            data=body,
            method='POST',
            headers={
                'apikey': key,
                'Authorization': f'Bearer {key}',
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=minimal',
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                if resp.status in (200, 201, 204):
                    total_ok += len(chunk)
                    print(f'   ✓ pushed batch {i // BATCH + 1}: {len(chunk)} rows')
                else:
                    print(f'   ⚠ batch {i // BATCH + 1} status {resp.status}: {resp.read()[:200]}')
        except urllib.error.HTTPError as e:
            print(f'   ✗ batch {i // BATCH + 1} HTTP {e.code}: {e.read()[:300]}')
            return total_ok
        except Exception as e:
            print(f'   ✗ batch {i // BATCH + 1} error: {e}')
            return total_ok
    return total_ok


def supabase_link_students(env, cid_to_folder, name_to_student_id):
    """For each customer_id with a folder, set students.customer_ids[] += that cid."""
    url = env.get('SUPABASE_URL')
    key = env.get('SUPABASE_SERVICE_ROLE_KEY')
    if not url or not key:
        return 0

    # folder -> [customer_ids]
    folder_to_cids = defaultdict(list)
    for cid, folder in cid_to_folder.items():
        folder_to_cids[folder].append(cid)

    n = 0
    for folder, cids in folder_to_cids.items():
        sid = name_to_student_id.get(folder)
        if sid is None:
            continue
        body = json.dumps({'customer_ids': cids}).encode('utf-8')
        req = urllib.request.Request(
            f'{url}/rest/v1/students?id=eq.{sid}',
            data=body,
            method='PATCH',
            headers={
                'apikey': key,
                'Authorization': f'Bearer {key}',
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
            },
        )
        try:
            urllib.request.urlopen(req, timeout=15)
            n += 1
        except Exception as e:
            print(f'   ⚠ failed link student {folder}: {e}')
    return n


def supabase_backfill_contracts_student_id(env):
    """UPDATE contracts SET student_id = matching students.id (via customer_ids[] array contains)."""
    url = env.get('SUPABASE_URL')
    key = env.get('SUPABASE_SERVICE_ROLE_KEY')
    if not url or not key:
        return 0
    # Use Supabase RPC pattern via raw SQL through pg_meta endpoint? PostgREST doesn't allow
    # cross-table UPDATE FROM directly. Easiest: fetch students with customer_ids, then PATCH
    # contracts per customer_id. For 253 students that's 253 fast PATCHes.
    req = urllib.request.Request(
        f'{url}/rest/v1/students?select=id,customer_ids&customer_ids=not.is.null',
        headers={'apikey': key, 'Authorization': f'Bearer {key}'},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        rows = json.loads(resp.read())
    n = 0
    for s in rows:
        sid = s['id']
        for cid in (s['customer_ids'] or []):
            body = json.dumps({'student_id': sid}).encode('utf-8')
            req = urllib.request.Request(
                f'{url}/rest/v1/contracts?customer_id=eq.{cid}',
                data=body,
                method='PATCH',
                headers={
                    'apikey': key,
                    'Authorization': f'Bearer {key}',
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                },
            )
            try:
                urllib.request.urlopen(req, timeout=15)
                n += 1
            except Exception as e:
                print(f'   ⚠ backfill cid={cid}: {e}')
    return n


def supabase_get_student_id_map(env):
    """Pull current students table → dict[name] = id."""
    url = env.get('SUPABASE_URL')
    key = env.get('SUPABASE_SERVICE_ROLE_KEY')
    if not url or not key:
        return {}
    req = urllib.request.Request(
        f'{url}/rest/v1/students?select=id,name&limit=1000',
        headers={'apikey': key, 'Authorization': f'Bearer {key}'},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        rows = json.loads(resp.read())
    return {r['name']: r['id'] for r in rows}


# ── Main ────────────────────────────────────────────────────────────────

def main():
    env = load_env()

    rows, COL = read_signings()
    vault_students = read_vault_students()
    vault_folder_names = {vs['name'] for vs in vault_students}
    print(f'📁 Vault: {len(vault_students)} folders')

    cid_to_folder, folder_to_cids, folder_signers = \
        build_customer_to_folder_map(rows, COL, vault_students)
    print(f'   {len(cid_to_folder)} customer_id mapped to {len(folder_to_cids)} vault folders')

    # ── Identify onboard candidates ──
    candidates = identify_onboard_candidates(rows, COL, cid_to_folder, vault_folder_names)
    print(f'\n🆕 Onboard candidates ({len(candidates)} new students for {ONBOARD_ADVISORS}):')

    # ── Group contracts by 客户ID for vault rewrite ──
    contracts_by_cid = defaultdict(list)
    for r in rows:
        cid = r[COL['客户ID']]
        contract_id = r[COL['合同编号']]
        signed = parse_date(r[COL['签约时间']])
        if not signed:
            continue
        contracts_by_cid[cid].append({
            'contract_id': contract_id,
            'customer_id': cid,
            'customer_name': r[COL['客户姓名']],
            'signed_at': signed,
            'signed_amount': r[COL['签约金额（实时）']] or 0,
            'template_name': r[COL['合同模板名称']] or '',
            'category': category(r[COL['合同模板名称']] or ''),
            'status': r[COL['合同状态']] or '',
            'is_application': is_yes(r[COL['是否包含留学申请']]),
            'is_training': is_yes(r[COL['是否包含语言培训']]),
            'is_research': is_yes(r[COL.get('是否科研类', -1)] if '是否科研类' in COL else None),
            'is_competition': is_yes(r[COL.get('是否竞赛类', -1)] if '是否竞赛类' in COL else None),
            'intake_year': r[COL['入学年']],
            'signing_advisor': r[COL.get('签约顾问', -1)] if '签约顾问' in COL else None,
            'early_advisor':   r[COL['前期顾问']] if r[COL['前期顾问']] else None,
            'mid_advisor':     r[COL['中期顾问']] if r[COL['中期顾问']] else None,
            'late_advisor':    r[COL['后期顾问']] if r[COL['后期顾问']] else None,
            'copywriter':      r[COL['文案顾问']] if r[COL['文案顾问']] else None,
            'source_type':     r[COL.get('来源类型', -1)] if '来源类型' in COL else None,
            'channel_category': r[COL.get('渠道分类', -1)] if '渠道分类' in COL else None,
            'channel_detail':  r[COL.get('渠道明细', -1)] if '渠道明细' in COL else None,
            'referrer':        r[COL.get('推荐人', -1)] if '推荐人' in COL else None,
            'is_first_application': is_yes(r[COL.get('19财至查询截止日是否首次申请', -1)] if '19财至查询截止日是否首次申请' in COL else None),
            'is_first_company': is_yes(r[COL.get('是否当前公司首次签约', -1)] if '是否当前公司首次签约' in COL else None),
            'is_b2b':          is_yes(r[COL.get('是否B端', -1)] if '是否B端' in COL else None),
            'b2b_partner':     r[COL.get('B端合作方', -1)] if 'B端合作方' in COL else None,
            'city':            r[COL.get('城市', -1)] if '城市' in COL else None,
            'product_category': r[COL.get('产品类别', -1)] if '产品类别' in COL else None,
            'service_category': r[COL.get('主体服务类别', -1)] if '主体服务类别' in COL else None,
        })

    # Sort each customer's contracts by signed_at descending (newest first)
    for cid in contracts_by_cid:
        contracts_by_cid[cid].sort(key=lambda c: c['signed_at'], reverse=True)

    # ── Update existing vault students' YAML ──
    print(f'\n📝 Updating existing vault students:')
    yaml_updates = 0
    for vs in vault_students:
        cids = sorted(folder_to_cids.get(vs['name'], set()))
        if not cids:
            continue
        signers = sorted(folder_signers.get(vs['name'], set()))
        # Aggregate contracts across all cids for this folder
        agg = []
        for cid in cids:
            agg.extend(contracts_by_cid.get(cid, []))
        agg.sort(key=lambda c: c['signed_at'], reverse=True)
        if update_existing_student_yaml(vs['md_path'], cids, signers, agg):
            yaml_updates += 1
    print(f'   {yaml_updates} student YAMLs rewritten')

    # ── Onboard new vault folders ──
    print(f'\n🆕 Creating new vault folders:')
    onboarded = 0
    for c in candidates:
        target = c['target_folder']
        contracts = contracts_by_cid.get(c['cid'], [])
        if create_new_student_folder(target, c['advisor'], c['intake'], c['cid'], contracts):
            onboarded += 1
    print(f'   {onboarded} new folders created')

    # ── Push to Supabase contracts table ──
    print(f'\n📤 Push to Supabase contracts table:')
    db_rows = []
    for cid, contracts in contracts_by_cid.items():
        for c in contracts:
            db_rows.append(c)
    print(f'   {len(db_rows)} total contract rows to upsert')

    # Phase A (2026-05-17): vault YAML 是 advisor 归属的 source of truth.
    # 同一 cid 下所有 contract row 的 mid/early/late_advisor 一律按 vault YAML
    # 该 folder 的当前 中期/前期/后期顾问 写入 (多顾问取第一个 = primary).
    # vault 字段为空 → 保留 ERP 值 (避免无意删数据). vault 没有对应 folder → 不变.
    folder_to_advisors = {vs['name']: vs.get('advisors', {}) for vs in vault_students}

    override_n = 0
    for row in db_rows:
        folder = cid_to_folder.get(row['customer_id'])
        if not folder:
            continue
        adv = folder_to_advisors.get(folder, {})
        if adv.get('mid')   and row.get('mid_advisor')   != adv['mid']:
            row['mid_advisor']   = adv['mid'];   override_n += 1
        if adv.get('early') and row.get('early_advisor') != adv['early']:
            row['early_advisor'] = adv['early']
        if adv.get('late')  and row.get('late_advisor')  != adv['late']:
            row['late_advisor']  = adv['late']
    print(f'   🔁 vault override: {override_n} 行 mid_advisor 改写 (前期/后期 同步覆盖)')

    n_pushed = supabase_upsert_contracts(env, db_rows)
    print(f'   ✓ pushed {n_pushed} contracts')

    # ── Link students.customer_ids[] ──
    print(f'\n🔗 Link students.customer_ids[]:')
    name_to_id = supabase_get_student_id_map(env)
    n_linked = supabase_link_students(env, cid_to_folder, name_to_id)
    print(f'   ✓ linked {n_linked} students')

    # ── Backfill contracts.student_id by joining customer_id → students.customer_ids[] ──
    n_backfilled = supabase_backfill_contracts_student_id(env)
    print(f'   ✓ backfilled contracts.student_id for {n_backfilled} rows')

    # ── Summary ──
    print(f'\n═══ Summary ═══')
    print(f'  Signing rows read:           {len(rows)}')
    print(f'  Unique customer_ids:         {len(contracts_by_cid)}')
    print(f'  Vault students existing:     {len(vault_students)}')
    print(f'  Vault YAMLs rewritten:       {yaml_updates}')
    print(f'  New folders onboarded:       {onboarded}')
    print(f'  Contracts pushed Supabase:   {n_pushed}')
    print(f'  Students linked customer_ids:{n_linked}')
    print(f'\n📋 Next steps (if you want to fully refresh):')
    print(f'   /usr/local/bin/python3 scripts/import-erp-comms.py')
    print(f'   /opt/homebrew/bin/node scripts/sync-students-to-supabase.mjs')


if __name__ == '__main__':
    main()
