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


def cleanup_addon_name(s):
    """清理 add-on 合同名：去年份前缀（"2023" / "23 财" / "23 财年"）+ 去服务合同尾巴。
    保留括号 / 版本号 / 课时数等关键产品标识。

    例：
      "2023海外学术导师录播课程服务6课时" → "海外学术导师录播课程服务6课时"
      "【就业力】顶锋计划-国内名校导师远程科研（独立一作）项目服务合同"
        → "【就业力】顶锋计划-国内名校导师远程科研（独立一作）"
      "2025海外名校导师远程科研项目合同（高端版）" → "海外名校导师远程科研（高端版）"
    """
    s = re.sub(r'^\d{4}\s*财?\s*', '', s)
    s = re.sub(r'^\d{2}\s*财?\s*年?\s*', '', s)
    # 去括号前的 noise：例 "...项目服务合同（36800）" → "...（36800）"
    s = re.sub(r'\s*(项目服务合同|项目合同|服务合同|项目服务|合同|项目)\s*(?=[（(])', '', s)
    # 去末尾的同 noise（无括号场景）
    s = re.sub(r'\s*(项目服务合同|项目合同|服务合同|项目服务|合同|项目)\s*$', '', s)
    return s.strip()


def category(simplified_name):
    """合同大类。
    主类（留学服务）：返回简化大类 — 跃领 / 格物-半年 / 格物-一年 / 菁英 / 亚洲英语系高端 等共 17 种。
    Add-on（产品 / 搭售）：返回 cleanup 后的合同名（细粒度）— 用户后续做产品 donut 时直接用。
    """
    if not simplified_name:
        return "unknown"
    s = simplified_name
    # ── 主类：跃领 系（科研 add-on 留在跃领 group 内） ──
    if "跃领" in s and "博士" in s:
        return "跃领-博士版"
    if "跃领" in s and "本科" in s:
        return "跃领-本科版"
    if "跃领" in s and "科研" in s:
        return "跃领-科研addon"
    if "跃领" in s:
        return "跃领"
    # ── 主类：格物 半年 vs 一年期 ──
    if "格物" in s and ("半年" in s or "（半年）" in s):
        return "格物-半年"
    if "格物" in s and ("一年" in s or "（一年）" in s):
        return "格物-一年"
    if "格物" in s:
        return "格物-一年"
    # ── 主类：菁英 / 精英预备 / 亚洲系列 ──
    # 注意：精英预备课程（2-6 课时课程产品）≠ 美研菁英全程服务，是两个独立产品。
    # "菁英博士合同" 也不是菁英大类，是博士大类（user direction 2026-05-07）。
    if "精英预备" in s:
        return "精英预备课程"
    if "菁英" in s and "博士" in s:
        return "博士"
    if "菁英" in s:
        return "菁英"
    if "亚洲英文授课博士" in s or "亚洲英文授课硕士" in s:
        return "亚洲博士"
    if "亚洲英语系高端" in s or "欧亚" in s or "亚英高端" in s:
        return "亚洲英语系高端"
    if "亚洲英文授课" in s and ("研究生" in s or "本科" in s or "授课式" in s):
        return "亚洲英语系高端"
    if "新港澳" in s or "新港" in s or "中国港澳" in s:
        return "新港澳联申"
    # ── 主类：美研系列 ──
    if "美国研究生启航" in s:
        return "启航"
    if "美国研究生快捷当季" in s or "美国研究生快捷" in s:
        return "美国研究生快捷"
    if "美研尊享" in s or "美国研究生尊享" in s:
        return "尊享"
    # ── 主类：区域单申请（签证类虽含国家名但属 add-on，走细粒度） ──
    if ("澳大利亚" in s or "加拿大" in s) and "签证" in s:
        return cleanup_addon_name(s)
    if "澳大利亚" in s or "澳新" in s:
        return "澳洲申请"
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
    # ── Add-on（产品 / 搭售）：用 cleanup 后的合同名作大类（细粒度） ──
    return cleanup_addon_name(s)


# ============================================================
# 读财务表
# ============================================================

def read_financial(xlsx_path):
    """返回 dict[客户姓名] = list[contract dict]

    财务字段语义（重要）：
      主合同金额 — sticker price (含税)
      签约金额（实时）— 实际签约 = 主合同 - 优惠减钱 + 选校金额 + 补充金额（含税）
      优惠减钱 — 实际降价
      优惠价值 — 等价附送服务（不影响签约金额）
      选校金额 / 补充金额 — 加项（不一定为 0，邹晶等学生有）
      退费总金额 — 签约后退的（不影响签约金额本身）
      已收服务费总额 — 实际到账金额（cash collected）
      转收入含税 — 已确认收入（含税）= 各阶段报完成之和
      转收入不含税 — 已确认收入（不含税，即剔除 6% VAT）
      预收余额（RMB）— 已收 - 转收入含税 = 待交付的服务对应的钱
                       （是 已收 的子集，不是独立账户）

    关系：
      签约金额 = 主合同 - 优惠减钱 + 选校金额 + 补充金额
      已收 ≤ 签约 (分期未付完时小于；正常情况下签约 = 已收)
      预收余额 = 已收 - 已交付（转收入含税）
    """
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
            # 合同价
            "主合同金额": _money(r[COL["主合同金额"]]),
            "签约金额": _money(r[COL["签约金额（实时）"]]),  # ERP 权威值
            "优惠减钱": _money(r[COL["优惠金额（减钱）"]]),
            "优惠价值": _money(r[COL["优惠金额（价值）"]]),
            "选校金额": _money(r[COL["选校金额"]]),
            "补充金额": _money(r[COL["补充金额"]]),
            "退费": _money(r[COL["退费总金额"]]),
            # 现金 / 履约
            "已收": _money(r[COL["已收服务费总额"]]),
            "已交付": _money(r[COL["转收入含税"]]),       # 已确认收入（含税）
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

    sum_fields = ["主合同金额", "签约金额", "优惠减钱", "优惠价值",
                  "选校金额", "补充金额", "退费", "已收", "已交付", "预收余额"]
    consolidated = []
    for name, group in by_name.items():
        if len(group) == 1:
            consolidated.append(group[0])
            continue
        merged = {
            "名称": name,
            "大类": group[0]["大类"],
            "签约日期": min(g["签约日期"] for g in group if g["签约日期"]) or "",
        }
        for f in sum_fields:
            merged[f] = sum(g.get(f, 0) for g in group)
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
    """生成 合同 + 合同明细 两个字段的 YAML 文本。

    合同明细字段顺序：基本（名称/大类/签约日期）→ 合同价 → 优惠 → 现金/履约。
    可选字段（选校/补充/退费/优惠价值）== 0 时不写出，让 YAML 简洁。
    """
    cats = sorted(set(categories))
    cats_inline = "[" + ", ".join(cats) + "]"

    lines = [f"合同: {cats_inline}"]
    if not contracts:
        return "\n".join(lines)
    lines.append("合同明细:")
    for c in contracts:
        lines.append(f"  - 名称: {c['名称']}")
        lines.append(f"    大类: {c['大类']}")
        if c.get("签约日期"):
            lines.append(f"    签约日期: {c['签约日期']}")
        # 合同价
        lines.append(f"    主合同金额: {c['主合同金额']}")
        lines.append(f"    签约金额: {c['签约金额']}")
        # 优惠 / 加项 / 退费 — 只在非零时写
        if c.get("优惠减钱"): lines.append(f"    优惠减钱: {c['优惠减钱']}")
        if c.get("优惠价值"): lines.append(f"    优惠价值: {c['优惠价值']}")
        if c.get("选校金额"): lines.append(f"    选校金额: {c['选校金额']}")
        if c.get("补充金额"): lines.append(f"    补充金额: {c['补充金额']}")
        if c.get("退费"):     lines.append(f"    退费: {c['退费']}")
        # 现金 / 履约
        lines.append(f"    已收: {c['已收']}")
        lines.append(f"    已交付: {c['已交付']}")
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
