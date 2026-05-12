#!/usr/bin/env python3
"""Generate a professional MDPA Excel report from pre-written personality analysis."""

import json
import re
import os
import xlsxwriter

BASE_DIR = os.path.join(os.path.dirname(__file__), "mdpa_processed", "adtyy6vbv4c7")
OUTPUT_FILE = os.path.join(BASE_DIR, "MDPA_Report_王世杰.xlsx")

# ---------------------------------------------------------------------------
# Colour palette
# ---------------------------------------------------------------------------
PRIMARY = "#042f24"
SECONDARY = "#0a5c45"
DIM_COLORS = {
    "O": "#1a6b4f",
    "C": "#2d8a6e",
    "E": "#3da88d",
    "A": "#4fc4a8",
    "N": "#6dd8bc",
}
SURFACE = "#f8faf9"
TEXT_COLOR = "#1a1a1a"
MUTED = "#666666"
WHITE = "#FFFFFF"

DIM_NAMES = {
    "O": "开放性 Openness",
    "C": "尽责性 Conscientiousness",
    "E": "外向性 Extraversion",
    "A": "宜人性 Agreeableness",
    "N": "神经质 Neuroticism",
}

# ---------------------------------------------------------------------------
# Markdown parser
# ---------------------------------------------------------------------------

def parse_markdown(text):
    """Parse markdown into a list of dicts with type/content/level."""
    lines = text.split("\n")
    blocks = []
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Skip empty lines
        if not stripped:
            i += 1
            continue

        # Horizontal rule
        if re.match(r"^-{3,}$", stripped):
            blocks.append({"type": "hr"})
            i += 1
            continue

        # Headers
        m = re.match(r"^(#{1,3})\s+(.*)", stripped)
        if m:
            level = len(m.group(1))
            blocks.append({"type": f"h{level}", "content": m.group(2)})
            i += 1
            continue

        # Blockquote
        if stripped.startswith(">"):
            content = stripped.lstrip("> ").strip()
            # Collect multi-line blockquotes
            i += 1
            while i < len(lines) and lines[i].strip().startswith(">"):
                content += "\n" + lines[i].strip().lstrip("> ").strip()
                i += 1
            blocks.append({"type": "blockquote", "content": content})
            continue

        # Bullet points
        if re.match(r"^[-*]\s+", stripped):
            content = re.sub(r"^[-*]\s+", "", stripped)
            blocks.append({"type": "bullet", "content": content})
            i += 1
            continue

        # Regular paragraph — collect consecutive non-empty, non-special lines
        para = stripped
        i += 1
        while i < len(lines):
            nxt = lines[i].strip()
            if not nxt or nxt.startswith("#") or nxt.startswith(">") or re.match(r"^[-*]\s+", nxt) or re.match(r"^-{3,}$", nxt):
                break
            para += "\n" + nxt
            i += 1
        blocks.append({"type": "paragraph", "content": para})

    return blocks


NBSP = "\u00A0"  # non-breaking space — prevents unwanted line breaks
ZWS = "\u200B"    # zero-width space — allows Excel to break at this point

def insert_word_breaks(text):
    """Insert zero-width spaces into very long Latin sequences so Excel can wrap mid-word."""
    def _break_long_word(m):
        word = m.group(0)
        # Insert ZWS every 12 chars — only for genuinely long sequences
        return ZWS.join(word[i:i+12] for i in range(0, len(word), 12))
    return re.sub(r"[A-Za-z0-9_/.:-]{18,}", _break_long_word, text)

def glue_identifiers(text):
    """Replace space before test item IDs with NBSP so they don't break away from context."""
    # Matches: SIT_007, PAIR_13, POL_JP_02, N_SIT_04, AV_C_01, MBTI, OCEAN, ENTP etc.
    return re.sub(r" (?=[A-Z][A-Z_]+[\d_]*[\d])", NBSP, text)

def strip_bold(text):
    """Remove **bold** markers, glue identifiers, insert word-break hints."""
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = glue_identifiers(text)
    return insert_word_breaks(text)


# ---------------------------------------------------------------------------
# Excel writer helpers
# ---------------------------------------------------------------------------

class ReportWriter:
    def __init__(self, workbook):
        self.wb = workbook
        self._init_formats()

    def _init_formats(self):
        wb = self.wb
        base = {"font_name": "Microsoft YaHei", "font_color": TEXT_COLOR}

        self.fmt_title = wb.add_format({
            **base, "font_size": 18, "bold": True, "font_color": WHITE,
            "bg_color": PRIMARY, "align": "center", "valign": "vcenter",
            "text_wrap": True, "border": 0,
        })
        self.fmt_h1 = wb.add_format({
            **base, "font_size": 16, "bold": True, "align": "left",
            "valign": "vcenter", "bottom": 2, "bottom_color": PRIMARY,
        })
        self.fmt_h2 = wb.add_format({
            **base, "font_size": 13, "bold": True, "font_color": WHITE,
            "bg_color": SECONDARY, "align": "left", "valign": "vcenter",
            "text_wrap": True,
        })
        self.fmt_h3 = wb.add_format({
            **base, "font_size": 12, "bold": True, "align": "left",
            "valign": "vcenter", "text_wrap": True,
        })
        self.fmt_body = wb.add_format({
            **base, "font_size": 10.5, "text_wrap": True,
            "align": "left", "valign": "top",
        })
        self.fmt_body_bold = wb.add_format({
            **base, "font_size": 10.5, "text_wrap": True, "bold": True,
            "align": "left", "valign": "top",
        })
        self.fmt_bullet = wb.add_format({
            **base, "font_size": 10.5, "text_wrap": True,
            "align": "left", "valign": "top", "indent": 1,
        })
        self.fmt_blockquote = wb.add_format({
            **base, "font_size": 10.5, "italic": True, "text_wrap": True,
            "align": "left", "valign": "top",
            "left": 3, "left_color": SECONDARY, "font_color": MUTED,
        })
        self.fmt_hr = wb.add_format({"bottom": 1, "bottom_color": "#cccccc"})
        self.fmt_disclaimer = wb.add_format({
            **base, "font_size": 9, "italic": True, "font_color": MUTED,
            "text_wrap": True, "align": "center", "valign": "vcenter",
        })
        # Table formats
        self.fmt_table_header = wb.add_format({
            **base, "font_size": 10.5, "bold": True, "font_color": WHITE,
            "bg_color": PRIMARY, "align": "center", "valign": "vcenter",
            "border": 1, "border_color": WHITE,
        })
        self.fmt_table_cell = wb.add_format({
            **base, "font_size": 10.5, "align": "center", "valign": "vcenter",
            "border": 1, "border_color": "#e0e0e0", "text_wrap": True,
        })
        self.fmt_table_cell_left = wb.add_format({
            **base, "font_size": 10.5, "align": "left", "valign": "vcenter",
            "border": 1, "border_color": "#e0e0e0", "text_wrap": True,
        })
        self.fmt_table_alt = wb.add_format({
            **base, "font_size": 10.5, "align": "center", "valign": "vcenter",
            "border": 1, "border_color": "#e0e0e0", "bg_color": SURFACE,
            "text_wrap": True,
        })
        self.fmt_table_alt_left = wb.add_format({
            **base, "font_size": 10.5, "align": "left", "valign": "vcenter",
            "border": 1, "border_color": "#e0e0e0", "bg_color": SURFACE,
            "text_wrap": True,
        })
        self.fmt_score_big = wb.add_format({
            **base, "font_size": 28, "bold": True, "font_color": PRIMARY,
            "align": "center", "valign": "vcenter",
        })
        self.fmt_label = wb.add_format({
            **base, "font_size": 10.5, "font_color": MUTED,
            "align": "left", "valign": "vcenter",
        })
        self.fmt_value = wb.add_format({
            **base, "font_size": 10.5, "bold": True,
            "align": "left", "valign": "vcenter",
        })
        self.fmt_mbti_big = wb.add_format({
            **base, "font_size": 36, "bold": True, "font_color": PRIMARY,
            "align": "center", "valign": "vcenter",
        })

    def _setup_sheet(self, ws, title_text, tab_color=None, content_mode=False):
        """Common sheet setup. content_mode=True uses single wide column B for auto-height."""
        ws.hide_gridlines(2)
        ws.set_landscape()
        ws.set_paper(9)  # A4
        ws.set_margins(left=0.5, right=0.5, top=0.5, bottom=0.5)
        ws.set_column("A:A", 2)
        if content_mode:
            # Single wide column B for content — enables Excel auto row height
            ws.set_column("B:B", 95)
            ws.set_column("C:H", 0.5, None, {"hidden": True})
        else:
            ws.set_column("B:H", 14)
        ws.set_column("I:I", 2)
        if tab_color:
            ws.set_tab_color(tab_color)
        ws.freeze_panes(1, 0)
        # Title banner row 0
        ws.merge_range("B1:H1", title_text, self.fmt_title)
        ws.set_row(0, 50)
        return 2  # next row

    def _estimate_row_height(self, text, cols=7, font_size=10.5):
        """Estimate row height for wrapped text, calibrated against manual adjustments."""
        if not text:
            return 20
        def effective_len(s):
            n = 0
            for ch in s:
                if ord(ch) > 0x2E80:  # CJK range
                    n += 1.7
                else:
                    n += 1
            return n

        chars_per_line = 78  # calibrated for merged B:H with ZWS word-breaking
        lines = text.split("\n")
        total_lines = 0
        for line in lines:
            elen = effective_len(line)
            total_lines += max(1, -(-int(elen) // chars_per_line))  # ceil division
        return max(20, 8 + total_lines * (font_size + 3.5))

    def _write_rich_text(self, ws, row, text, fmt_normal, fmt_bold, merge="B:H"):
        """Write text with **bold** markers as rich string."""
        col_start = 1  # B
        col_end = 7    # H
        clean = strip_bold(text)
        height = self._estimate_row_height(clean)
        ws.set_row(row, height)
        # Just write clean text with the normal format for simplicity
        # (xlsxwriter rich strings are complex with merge_range)
        ws.merge_range(row, col_start, row, col_end, clean, fmt_normal)
        return row + 1

    def write_markdown_sheet(self, ws, title, md_text, tab_color, dim_key=None):
        """Render a markdown report into a worksheet.
        Uses single wide column B (no merge) so Excel can auto-fit row heights."""
        color = tab_color
        # Create dimension-specific h2 format
        fmt_h2_dim = self.wb.add_format({
            "font_name": "Microsoft YaHei", "font_size": 13, "bold": True,
            "font_color": WHITE, "bg_color": color,
            "align": "left", "valign": "vcenter", "text_wrap": True,
        })

        row = self._setup_sheet(ws, title, tab_color=color, content_mode=True)

        # If we have a dim_key, show the score prominently
        if dim_key and dim_key in data.get("ocean_summary", {}):
            score = data["ocean_summary"][dim_key]["calibrated"]
            ws.write(row, 1, f'校准得分: {score:.3f}' if score is not None else "校准得分: N/A", self.fmt_score_big)
            ws.set_row(row, 45)
            row += 1
            ws.set_row(row, 8)
            row += 1

        blocks = parse_markdown(md_text)
        for block in blocks:
            btype = block["type"]
            if btype == "h1":
                ws.write(row, 1, block["content"], self.fmt_h1)
                ws.set_row(row, 36)
                row += 1
            elif btype == "h2":
                ws.write(row, 1, block["content"], fmt_h2_dim)
                ws.set_row(row, 32)
                row += 1
            elif btype == "h3":
                ws.write(row, 1, block["content"], self.fmt_h3)
                ws.set_row(row, 28)
                row += 1
            elif btype == "paragraph":
                content = strip_bold(block["content"])
                ws.write(row, 1, content, self.fmt_body)
                # No set_row → Excel auto-fits based on text_wrap + column width
                row += 1
            elif btype == "bullet":
                content = f"{NBSP}{NBSP}•{NBSP}{NBSP}" + strip_bold(block["content"])
                ws.write(row, 1, content, self.fmt_bullet)
                row += 1
            elif btype == "blockquote":
                content = strip_bold(block["content"])
                ws.write(row, 1, content, self.fmt_blockquote)
                row += 1
            elif btype == "hr":
                ws.write(row, 1, "", self.fmt_hr)
                ws.set_row(row, 6)
                row += 1

            # Small spacing after section headers
            if btype in ("h1", "h2"):
                ws.set_row(row, 6)
                row += 1

        ws.print_area(0, 0, row, 8)
        return row


# ---------------------------------------------------------------------------
# Load data
# ---------------------------------------------------------------------------

with open(os.path.join(BASE_DIR, "00_overview.json"), "r", encoding="utf-8") as f:
    data = json.load(f)

reports = {}
for key in ["O", "C", "E", "A", "N", "interactions", "personal"]:
    fpath = os.path.join(BASE_DIR, f"report_{key}.md")
    with open(fpath, "r", encoding="utf-8") as f:
        reports[key] = f.read()

# ---------------------------------------------------------------------------
# Create workbook
# ---------------------------------------------------------------------------

wb = xlsxwriter.Workbook(OUTPUT_FILE, {"strings_to_urls": False})
rw = ReportWriter(wb)

# ==================== Sheet 1: 概览与行政 ====================
ws = wb.add_worksheet("概览与行政")
row = rw._setup_sheet(ws, "MDPA 多维人格动态评估报告\n" + data["student"]["name"], tab_color=PRIMARY)

# Student info section
ws.merge_range(row, 1, row, 7, "基本信息", rw.fmt_h2)
ws.set_row(row, 28)
row += 1
ws.set_row(row, 5)
row += 1

info_items = [
    ("姓名", data["student"]["name"]),
    ("邮箱", data["student"]["email"]),
    ("背景", data["student"]["background"]),
    ("测试编号", data["test_meta"]["result_id"]),
    ("完成时间", data["test_meta"]["completed_at"][:10]),
    ("用时", f'{data["test_meta"]["duration_minutes"]:.1f} 分钟'),
    ("题目总数", str(data["test_meta"]["total_questions"])),
]
for label, value in info_items:
    ws.write(row, 1, label, rw.fmt_label)
    ws.merge_range(row, 2, row, 7, value, rw.fmt_value)
    ws.set_row(row, 22)
    row += 1

row += 1

# OCEAN Scores section
ws.merge_range(row, 1, row, 7, "OCEAN 大五人格得分", rw.fmt_h2)
ws.set_row(row, 28)
row += 1
ws.set_row(row, 5)
row += 1

# Table headers
headers = ["维度", "校准分", "原始分", "调整值", "直观评级"]
for ci, h in enumerate(headers):
    ws.write(row, 1 + ci, h, rw.fmt_table_header)
ws.set_row(row, 24)
row += 1

def score_label(val):
    if val is None:
        return "N/A"
    if val >= 0.7:
        return "高"
    elif val >= 0.4:
        return "中高"
    elif val >= 0.1:
        return "中"
    elif val >= -0.2:
        return "中低"
    else:
        return "低"

for i, dim in enumerate(["O", "C", "E", "A", "N"]):
    ds = data["ocean_summary"][dim]
    cal = ds["calibrated"]
    raw_val = ds["raw"]
    adj = ds["adjustment"]
    fmt_c = rw.fmt_table_cell if i % 2 == 0 else rw.fmt_table_alt
    fmt_l = rw.fmt_table_cell_left if i % 2 == 0 else rw.fmt_table_alt_left
    ws.write(row, 1, DIM_NAMES[dim], fmt_l)
    ws.write(row, 2, f"{cal:.3f}" if cal is not None else "N/A", fmt_c)
    ws.write(row, 3, f"{raw_val:.3f}" if raw_val is not None else "N/A", fmt_c)
    ws.write(row, 4, f"{adj:+.3f}" if adj is not None else "N/A", fmt_c)
    ws.write(row, 5, score_label(cal), fmt_c)
    ws.set_row(row, 22)
    row += 1

row += 1

# OCEAN Bar Chart
chart = wb.add_chart({"type": "bar"})
chart_data_row_start = row
dim_labels = [DIM_NAMES[d] for d in ["O", "C", "E", "A", "N"]]
dim_scores = [data["ocean_summary"][d]["calibrated"] or 0 for d in ["O", "C", "E", "A", "N"]]
# Write chart data to hidden area
for ci, (lbl, sc) in enumerate(zip(dim_labels, dim_scores)):
    ws.write(row + ci, 9, lbl)
    ws.write(row + ci, 10, sc)

chart.add_series({
    "name": "校准得分",
    "categories": [ws.name, chart_data_row_start, 9, chart_data_row_start + 4, 9],
    "values": [ws.name, chart_data_row_start, 10, chart_data_row_start + 4, 10],
    "fill": {"color": PRIMARY},
    "border": {"color": PRIMARY},
})
chart.set_title({"name": "OCEAN 人格维度得分", "name_font": {"size": 11, "bold": True, "color": PRIMARY}})
chart.set_x_axis({"min": -0.5, "max": 1.0, "num_font": {"size": 9}})
chart.set_y_axis({"reverse": True, "num_font": {"size": 9}})
chart.set_legend({"none": True})
chart.set_size({"width": 520, "height": 240})
chart.set_style(2)
ws.insert_chart(row, 1, chart, {"x_offset": 0, "y_offset": 0})
row += 14

# MBTI
ws.merge_range(row, 1, row, 7, "MBTI 类型", rw.fmt_h2)
ws.set_row(row, 28)
row += 1
ws.set_row(row, 5)
row += 1

ws.merge_range(row, 1, row, 3, data["mbti"]["type"], rw.fmt_mbti_big)
ws.set_row(row, 50)
# Axis strengths beside it
mbti_s = data["mbti"]["strengths"]
axis_text = f'E-I: {mbti_s["EI"]:.2f}   N-S: {mbti_s["NS"]:.2f}   F-T: {mbti_s["FT"]:.2f}   J-P: {mbti_s["JP"]:.2f}'
ws.merge_range(row, 4, row, 7, axis_text, rw.fmt_body)
row += 2

# N-clusters
ws.merge_range(row, 1, row, 7, "神经质子维度 N-Cluster", rw.fmt_h2)
ws.set_row(row, 28)
row += 1
ws.set_row(row, 5)
row += 1

n_cl = data["n_clusters"]
n_headers = ["分析反刍 (ar)", "压力脆弱 (sv)", "情绪反应 (er)"]
n_vals = [n_cl["ar"], n_cl["sv"], n_cl["er"]]
for ci, h in enumerate(n_headers):
    ws.write(row, 1 + ci * 2, h, rw.fmt_table_header)
    ws.write(row, 2 + ci * 2, f"{n_vals[ci]:.3f}", rw.fmt_table_cell)
ws.set_row(row, 24)
row += 2

# Behavioral RT
ws.merge_range(row, 1, row, 7, "行为反应时间分析", rw.fmt_h2)
ws.set_row(row, 28)
row += 1
ws.set_row(row, 5)
row += 1

# Overall RT stats
ort = data["behavioral_analysis"]["overall_rt"]
ws.merge_range(row, 1, row, 7, "总体统计", rw.fmt_h3)
ws.set_row(row, 22)
row += 1

ort_items = [
    ("题目数", str(ort["count"])),
    ("平均 (秒)", f'{ort["mean_sec"]:.1f}'),
    ("中位数 (秒)", f'{ort["median_sec"]:.1f}'),
    ("标准差 (秒)", f'{ort["stdev_sec"]:.1f}'),
    ("最快 (秒)", f'{ort["min_sec"]:.1f}'),
    ("最慢 (秒)", f'{ort["max_sec"]:.1f}'),
]
for label, val in ort_items:
    ws.write(row, 1, label, rw.fmt_label)
    ws.write(row, 2, val, rw.fmt_value)
    ws.set_row(row, 20)
    row += 1

row += 1

# By-module RT
ws.merge_range(row, 1, row, 7, "模块统计", rw.fmt_h3)
ws.set_row(row, 22)
row += 1

mod_headers = ["模块", "题数", "平均(s)", "中位数(s)", "标准差(s)", "最快(s)", "最慢(s)"]
for ci, h in enumerate(mod_headers):
    ws.write(row, 1 + ci, h, rw.fmt_table_header)
ws.set_row(row, 24)
row += 1

for mi, (mod, mdata) in enumerate(data["behavioral_analysis"]["rt_by_module"].items()):
    fmt_c = rw.fmt_table_cell if mi % 2 == 0 else rw.fmt_table_alt
    ws.write(row, 1, mod, fmt_c)
    ws.write(row, 2, str(mdata["count"]), fmt_c)
    ws.write(row, 3, f'{mdata["mean_sec"]:.1f}', fmt_c)
    ws.write(row, 4, f'{mdata["median_sec"]:.1f}', fmt_c)
    ws.write(row, 5, f'{mdata["stdev_sec"]:.1f}', fmt_c)
    ws.write(row, 6, f'{mdata["min_sec"]:.1f}', fmt_c)
    ws.write(row, 7, f'{mdata["max_sec"]:.1f}', fmt_c)
    ws.set_row(row, 22)
    row += 1

row += 1

# Top 5 slowest / fastest
for title, key in [("最慢 Top 5 项目", "slowest_5"), ("最快 Top 5 项目", "fastest_5")]:
    ws.merge_range(row, 1, row, 7, title, rw.fmt_h3)
    ws.set_row(row, 22)
    row += 1
    ws.write(row, 1, "题目 ID", rw.fmt_table_header)
    ws.write(row, 2, "时间 (秒)", rw.fmt_table_header)
    ws.set_row(row, 24)
    row += 1
    for si, item in enumerate(ort[key]):
        fmt_c = rw.fmt_table_cell if si % 2 == 0 else rw.fmt_table_alt
        ws.write(row, 1, item["id"], fmt_c)
        ws.write(row, 2, f'{item["sec"]:.1f}', fmt_c)
        ws.set_row(row, 20)
        row += 1
    row += 1

# Disclaimer
ws.merge_range(row, 1, row, 7,
    "本报告基于MDPA多维人格动态评估系统生成，仅供参考，不构成心理诊断。",
    rw.fmt_disclaimer)
ws.set_row(row, 30)
row += 1

ws.print_area(0, 0, row, 8)

# ==================== Sheets 2-6: Dimension reports ====================
for dim in ["O", "C", "E", "A", "N"]:
    dim_ws = wb.add_worksheet(DIM_NAMES[dim][:8])
    full_title = f"{DIM_NAMES[dim]} — 维度深度分析"
    rw.write_markdown_sheet(dim_ws, full_title, reports[dim], DIM_COLORS[dim], dim_key=dim)

# ==================== Sheet 7: 维度交互 ====================
ws_inter = wb.add_worksheet("维度交互")
rw.write_markdown_sheet(ws_inter, "维度交互解读：当人格的五条河流汇聚", reports["interactions"], SECONDARY)

# ==================== Sheet 8: 个人化深度分析 ====================
ws_personal = wb.add_worksheet("个人化深度分析")
rw.write_markdown_sheet(ws_personal, "个人化深度分析：写给王世杰的一封信", reports["personal"], PRIMARY)

wb.close()
print(f"Excel report generated: {OUTPUT_FILE}")
