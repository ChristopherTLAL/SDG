#!/usr/bin/env python3
"""
sync-financial-to-vault.py — 把财务 ERP 导出（预收账款余额表）映射到 vault YAML

数据流：
  财务 ERP 导出 .xlsx (~/Downloads/2026财年X月预收账款余额表-ERP导出YYYYMMDD.xlsx)
    ↓
  按 客户姓名 匹配 vault 学生
    ↓
  生成 / 更新 vault YAML 两个字段：
    - 合同（list of 大类标签：跃领 / 格物 / 菁英 / 就业力addon / ...）
    - 合同明细（list of 财务真名 + 主合同金额 + 优惠 + 已收 + 预收余额 + 签约日期）

行为：
  - 只动财务匹配上的学生（不加新学生）
  - 6 个 vault 写错产品的学生（沈天纬/周顾奕/顾咏颐/黄天翊/蒋子涵/邹晶）按财务覆盖
  - vault-only 学生（财务无）完全不动
  - 如果 vault YAML 已有 合同 / 合同明细 字段，replace；否则插入
  - 其他 YAML 字段（姓名/中期顾问/当前进度等）一律不动
  - 无 dry-run，直接 apply（用户已授权，本脚本是 idempotent 的）

用法：
  python3 scripts/sync-financial-to-vault.py [path/to/financial.xlsx]

  默认从 ~/Downloads/ 找最新一份 "2026财年X月预收账款余额表-ERP导出*.xlsx"。

注意（运维）：
  - 重跑 idempotent：相同财务 Excel 跑两次结果完全相同
  - 财务 Excel 是 source of truth；vault 合同明细是 derived data
  - 大类清单 (CATEGORIES) 在脚本内硬编码；新合同模板可能需要扩展
"""

import sys
import re
import argparse
from pathlib import Path
from collections import defaultdict, Counter
from datetime import date, datetime

import openpyxl

# ============================================================
# 配置
# ============================================================

VAULT_ROOT = Path("/Users/shijie/Library/CloudStorage/OneDrive-Personal/Obsidian/规划看板")
STUDENT_DIR = VAULT_ROOT / "01_Student"


def find_latest_financial():
    """找 ~/Downloads/ 里最新的财务 Excel"""
    candidates = sorted(
        (Path.home() / "Downloads").glob("*财年*预收账款余额表-ERP导出*.xlsx"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if not candidates:
        sys.exit("❌ 没找到财务 Excel；命令行传一个路径或放 ~/Downloads/")
    return candidates[0]


# ============================================================
# 合同名 → 大类映射（基于 2026/03 财务实际数据，每次新模板出现需要扩展）
# ============================================================

def simplify(name):
    """去掉 OA 编码尾巴（YZ-OA12345#1 之类）"""
    if not name:
        return ""
    s = re.sub(r"\s*[A-Z]{2}-?OA\d+[#\-\d]*\s*", "", name)
    s = re.sub(r"\s*OA\d+[#\-\d]*\s*", "", s)
    s = re.sub(r"\s*-[A-Z]+\s*$", "", s)  # 单纯尾部 -D / -A
    return s.strip()


def category(simplified_name):
    """合同大类。最具体的判断在前 — findSOPByContract 的 substring match 也是这个顺序。"""
    if not simplified_name:
        return "unknown"
    s = simplified_name
    # 跃领 系（最具体的 variant 先判）
    if "跃领" in s and "博士" in s:
        return "跃领-博士版"
    if "跃领" in s and "本科" in s:
        return "跃领-本科版"
    if "跃领" in s and "科研" in s:
        return "跃领-科研addon"
    if "跃领" in s:
        return "跃领"
    # 格物 系
    if "格物" in s:
        return "格物"
    # 菁英 系（含历史"精英预备"错字）
    if "菁英" in s or "精英预备" in s:
        return "菁英"
    # 亚洲英语系高端 / 新港澳 系
    if "亚洲英语系高端" in s or "欧亚" in s or "亚英高端" in s:
        return "亚洲英语系高端"
    if "亚洲英文授课博士" in s or "亚洲英文授课硕士" in s:
        return "亚洲博士"
    if "亚洲英文授课" in s and ("研究生" in s or "本科" in s or "授课式" in s):
        # 2023 财年旧版命名 — 现归亚洲英语系高端大类
        return "亚洲英语系高端"
    if "新港澳" in s or "新港" in s or "中国港澳" in s:
        return "新港澳联申"
    # 境外学术监护
    if "境外学术监护" in s or "学术监护" in s:
        return "境外服务addon"
    # 参赛指导（背提的一种）
    if "参赛" in s and "指导" in s:
        return "背景提升addon"
    # 美研系列
    if "美国研究生启航" in s:
        return "启航"
    if "美国研究生快捷当季" in s or "美国研究生快捷" in s:
        return "美国研究生快捷"
    if "美研尊享" in s or "美国研究生尊享" in s:
        return "尊享"
    # 区域单申请
    if "澳大利亚" in s and "签证" in s:
        return "签证addon"
    if "澳大利亚" in s or "澳新" in s:
        return "澳洲申请"
    if "加拿大" in s and "签证" in s:
        return "签证addon"
    if "加拿大" in s:
        return "加拿大申请"
    if "云中学" in s:
        return "云中学"
    if "香港" in s or "港-" in s or "港A" in s or "港授课" in s:
        return "港申请"
    if "英国本科" in s:
        return "英国本科"
    if "英国研究生" in s and "博士" in s:
        return "英国硕博"
    if "美国线上中学" in s:
        return "美国本科预备"
    if "欧洲英语系博士" in s:
        return "欧洲博士"
    if "亚洲英文授课博士" in s or "亚洲英文授课硕士" in s:
        return "亚洲博士"
    # 单项产品
    if "就业力" in s or "美研职场起航" in s:
        return "就业力addon"
    if "CLUB" in s or "学术指导" in s or "学术导师" in s:
        return "学术指导addon"
    if ("英语" in s or "英文能力" in s) and ("提升" in s or "能力" in s):
        return "英语addon"
    if "EPQ" in s or "AST" in s or "Bowl" in s or "物理碗" in s or "起点学院" in s:
        return "背景提升addon"
    if "科研" in s or "博睿" in s:
        return "科研addon"
    if "英领" in s:
        return "英领课程"
    return "其他"


# ============================================================
# 读财务表
# ============================================================

def read_financial(xlsx_path):
    """返回 dict[客户姓名] = list[contract dict]"""
    print(f"📖 读取财务表: {xlsx_path}")
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    ws = wb["sheet1"]
    rows = list(ws.iter_rows(values_only=True))
    header = list(rows[0])
    data = rows[1:]
    COL = {h: i for i, h in enumerate(header) if h}

    by_name = defaultdict(list)
    for r in data:
        name = r[COL["客户姓名"]]
        if not name:
            continue
        full_name = r[COL["合同模板"]]
        if not full_name:
            continue
        record = {
            "名称": simplify(full_name),
            "大类": category(simplify(full_name)),
            "签约日期": _format_date(r[COL["日期"]]),
            "主合同金额": _money(r[COL["主合同金额"]]),
            "优惠减钱": _money(r[COL["优惠金额（减钱）"]]),
            "优惠价值": _money(r[COL["优惠金额（价值）"]]),
            "已收": _money(r[COL["已收服务费总额"]]),
            "预收余额": _money(r[COL["预收余额（RMB）"]]),
        }
        by_name[name.strip()].append(record)

    print(f"   财务表共 {len(data)} 行 / {len(by_name)} 唯一客户")
    return by_name


def _format_date(d):
    if isinstance(d, datetime):
        return d.strftime("%Y-%m-%d")
    if isinstance(d, date):
        return d.isoformat()
    return ""


def _money(v):
    if v is None:
        return 0
    try:
        f = float(v)
        return int(f) if f.is_integer() else round(f, 2)
    except (TypeError, ValueError):
        return 0


# ============================================================
# 合并同模板的多份合同（同模板多次出现 → 累加金额）
# ============================================================

def consolidate_contracts(records):
    """同名合同（同 名称）合并：金额累加，签约日期取最早。"""
    by_name = defaultdict(list)
    for r in records:
        by_name[r["名称"]].append(r)

    consolidated = []
    for name, group in by_name.items():
        if len(group) == 1:
            consolidated.append(group[0])
            continue
        merged = {
            "名称": name,
            "大类": group[0]["大类"],
            "签约日期": min(g["签约日期"] for g in group if g["签约日期"]) or "",
            "主合同金额": sum(g["主合同金额"] for g in group),
            "优惠减钱": sum(g["优惠减钱"] for g in group),
            "优惠价值": sum(g["优惠价值"] for g in group),
            "已收": sum(g["已收"] for g in group),
            "预收余额": sum(g["预收余额"] for g in group),
        }
        consolidated.append(merged)
    # 按签约日期升序
    consolidated.sort(key=lambda r: (r["签约日期"] or "9999"))
    return consolidated


# ============================================================
# YAML 字段读写
# ============================================================

def split_frontmatter(content):
    """返回 (yaml_text, body)。无 frontmatter 则返回 (None, content)。"""
    m = re.match(r"^---\n(.*?)\n---\n?(.*)", content, re.DOTALL)
    if not m:
        return None, content
    return m.group(1), m.group(2)


def remove_yaml_field(yaml_text, field):
    """从 yaml_text 删除 `<field>:` 段（含其多行 list value）。
    多行 list 检测：连续行以缩进或 `-` 开头。"""
    lines = yaml_text.split("\n")
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # 顶级字段定义识别：行首非空白 + 字段名 + :
        # field 可能含中文字符
        m = re.match(rf"^{re.escape(field)}:[ \t]*(.*)$", line)
        if m:
            # 跳过该字段：如果 inline value（同行后面有内容），单行删除
            inline_val = m.group(1).strip()
            if inline_val and not inline_val.startswith("|") and not inline_val.startswith(">"):
                # inline scalar / inline flow seq → 单行删除
                i += 1
                continue
            # 多行 block：跳过后续所有缩进行 / `-` 开头行
            i += 1
            while i < len(lines):
                nxt = lines[i]
                if not nxt.strip():
                    i += 1
                    continue
                if nxt.startswith(" ") or nxt.startswith("\t") or nxt.lstrip().startswith("-"):
                    i += 1
                    continue
                break
            continue
        out.append(line)
        i += 1
    return "\n".join(out)


def render_contracts_yaml(categories, contracts):
    """生成 合同 + 合同明细 两个字段的 YAML 文本。"""
    cats = sorted(set(categories))
    cats_inline = "[" + ", ".join(cats) + "]"

    lines = [f"合同: {cats_inline}"]
    if not contracts:
        return "\n".join(lines)
    lines.append("合同明细:")
    for c in contracts:
        lines.append(f"  - 名称: {c['名称']}")
        lines.append(f"    大类: {c['大类']}")
        if c["签约日期"]:
            lines.append(f"    签约日期: {c['签约日期']}")
        lines.append(f"    主合同金额: {c['主合同金额']}")
        lines.append(f"    优惠减钱: {c['优惠减钱']}")
        lines.append(f"    优惠价值: {c['优惠价值']}")
        lines.append(f"    已收: {c['已收']}")
        lines.append(f"    预收余额: {c['预收余额']}")
    return "\n".join(lines)


def update_archive(archive_path, categories, contracts):
    """更新一个学生档案的 合同 + 合同明细 字段；其他 YAML / body 不动。"""
    content = archive_path.read_text(encoding="utf-8")
    yaml_text, body = split_frontmatter(content)
    if yaml_text is None:
        # 没 frontmatter — 跳过（不该发生）
        return False

    # 移除现有 合同 / 合同明细 字段
    yaml_text = remove_yaml_field(yaml_text, "合同")
    yaml_text = remove_yaml_field(yaml_text, "合同明细")

    # 清理多余空行
    yaml_text = re.sub(r"\n{3,}", "\n\n", yaml_text).strip()

    # 在 yaml 末尾追加新字段
    new_block = render_contracts_yaml(categories, contracts)
    new_yaml = (yaml_text + "\n" + new_block).strip()
    new_content = f"---\n{new_yaml}\n---\n{body}"

    if new_content == content:
        return False
    archive_path.write_text(new_content, encoding="utf-8")
    return True


# ============================================================
# 主流程
# ============================================================

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "xlsx",
        nargs="?",
        type=Path,
        default=None,
        help="财务 Excel 路径（默认 ~/Downloads/ 最新）",
    )
    args = parser.parse_args()

    xlsx_path = args.xlsx or find_latest_financial()
    fin_by_name = read_financial(xlsx_path)

    # 扫所有 vault 学生
    vault_students = []
    for sd in sorted(STUDENT_DIR.iterdir()):
        if not sd.is_dir() or sd.name.startswith("_"):
            continue
        archive = sd / f"{sd.name}.md"
        if archive.exists():
            vault_students.append((sd.name, archive))
    print(f"   vault 共 {len(vault_students)} 学生")

    # 按学生处理
    matched = 0
    updated = 0
    unchanged = 0
    skipped_no_match = 0
    cat_counter = Counter()

    for stu, archive in vault_students:
        if stu not in fin_by_name:
            skipped_no_match += 1
            continue
        matched += 1
        records = consolidate_contracts(fin_by_name[stu])
        if not records:
            continue
        cats = [r["大类"] for r in records]
        for c in cats:
            cat_counter[c] += 1
        if update_archive(archive, cats, records):
            updated += 1
        else:
            unchanged += 1

    print()
    print("=" * 60)
    print(f"✅ vault YAML 同步完成")
    print(f"   匹配学生: {matched} / {len(vault_students)}")
    print(f"   更新档案: {updated}")
    print(f"   未变（已是最新）: {unchanged}")
    print(f"   未匹配学生（vault 不动）: {skipped_no_match}")
    print()
    print(f"📊 大类分布（共 {sum(cat_counter.values())} 个合同条目）:")
    for cat, n in cat_counter.most_common():
        print(f"   [{n:3d}]  {cat}")


if __name__ == "__main__":
    main()
