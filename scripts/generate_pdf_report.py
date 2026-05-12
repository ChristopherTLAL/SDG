#!/usr/bin/env python3
"""Generate a professional MDPA PDF report with proper CJK text handling."""

import json
import re
import os

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont

# ---------------------------------------------------------------------------
# Register fonts
# ---------------------------------------------------------------------------
pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))

try:
    pdfmetrics.registerFont(TTFont("HiraginoGB-W3",
        "/System/Library/Fonts/Hiragino Sans GB.ttc", subfontIndex=0))
    pdfmetrics.registerFont(TTFont("HiraginoGB-W6",
        "/System/Library/Fonts/Hiragino Sans GB.ttc", subfontIndex=1))
    CN = "HiraginoGB-W3"
    CN_B = "HiraginoGB-W6"
except Exception:
    CN = "STSong-Light"
    CN_B = "STSong-Light"

# ---------------------------------------------------------------------------
# Paths & Colors
# ---------------------------------------------------------------------------
BASE_DIR = os.path.join(os.path.dirname(__file__), "mdpa_processed", "adtyy6vbv4c7")
OUTPUT_FILE = os.path.join(BASE_DIR, "MDPA_Report_王世杰.pdf")

PRIMARY   = HexColor("#042f24")
SECONDARY = HexColor("#0a5c45")
SURFACE   = HexColor("#f8faf9")
TEXT_CLR  = HexColor("#1a1a1a")
MUTED     = HexColor("#666666")
BORDER    = HexColor("#e0e0e0")

DIM_COLORS = {
    "O": HexColor("#1a6b4f"), "C": HexColor("#2d8a6e"),
    "E": HexColor("#3da88d"), "A": HexColor("#4fc4a8"),
    "N": HexColor("#6dd8bc"),
}
DIM_NAMES = {
    "O": "开放性 Openness",   "C": "尽责性 Conscientiousness",
    "E": "外向性 Extraversion", "A": "宜人性 Agreeableness",
    "N": "神经质 Neuroticism",
}

# ---------------------------------------------------------------------------
# Styles — wordWrap='CJK' is the key for proper Chinese line breaking
# ---------------------------------------------------------------------------
CJK = "CJK"  # enables CJK-aware line breaking in reportlab

def make_styles():
    s = {}
    s["title"] = ParagraphStyle("title",
        fontName=CN_B, fontSize=22, leading=28,
        textColor=white, alignment=TA_CENTER, spaceAfter=4*mm, wordWrap=CJK)
    s["subtitle"] = ParagraphStyle("subtitle",
        fontName=CN, fontSize=12, leading=16,
        textColor=HexColor("#ffffffcc"), alignment=TA_CENTER,
        spaceAfter=2*mm, wordWrap=CJK)
    s["h1"] = ParagraphStyle("h1",
        fontName=CN_B, fontSize=16, leading=22,
        textColor=PRIMARY, spaceBefore=6*mm, spaceAfter=3*mm, wordWrap=CJK)
    s["h2"] = ParagraphStyle("h2",
        fontName=CN_B, fontSize=13, leading=18,
        textColor=white, backColor=SECONDARY,
        borderPadding=(3*mm, 3*mm, 3*mm, 3*mm),
        spaceBefore=5*mm, spaceAfter=2*mm, wordWrap=CJK)
    s["h3"] = ParagraphStyle("h3",
        fontName=CN_B, fontSize=11.5, leading=16,
        textColor=PRIMARY, spaceBefore=4*mm, spaceAfter=2*mm, wordWrap=CJK)
    s["body"] = ParagraphStyle("body",
        fontName=CN, fontSize=10, leading=16,
        textColor=TEXT_CLR, alignment=TA_JUSTIFY,
        spaceBefore=1.5*mm, spaceAfter=1.5*mm, wordWrap=CJK)
    s["bullet"] = ParagraphStyle("bullet",
        fontName=CN, fontSize=10, leading=16,
        textColor=TEXT_CLR, leftIndent=8*mm, bulletIndent=3*mm,
        spaceBefore=1*mm, spaceAfter=1*mm, wordWrap=CJK)
    s["blockquote"] = ParagraphStyle("blockquote",
        fontName=CN, fontSize=10, leading=16,
        textColor=MUTED, leftIndent=6*mm,
        borderPadding=(2*mm, 2*mm, 2*mm, 4*mm),
        borderWidth=0, borderLeftWidth=2, borderLeftColor=SECONDARY,
        spaceBefore=2*mm, spaceAfter=2*mm, wordWrap=CJK)
    s["disclaimer"] = ParagraphStyle("disclaimer",
        fontName=CN, fontSize=8.5, leading=12,
        textColor=MUTED, alignment=TA_CENTER,
        spaceBefore=6*mm, spaceAfter=2*mm, wordWrap=CJK)
    s["score_big"] = ParagraphStyle("score_big",
        fontName=CN_B, fontSize=28, leading=34,
        textColor=PRIMARY, alignment=TA_CENTER,
        spaceBefore=2*mm, spaceAfter=2*mm, wordWrap=CJK)
    return s

# ---------------------------------------------------------------------------
# Markdown → Flowables
# ---------------------------------------------------------------------------

def _xml_escape(text):
    """Escape XML special characters, preserving bold markers."""
    text = text.replace("**", "\x00B\x00")
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"\x00B\x00(.*?)\x00B\x00", r"<b>\1</b>", text)
    return text

def _join_lines(a, b):
    """Join two lines smartly: no extra space if both sides are CJK."""
    if not a or not b:
        return a + b
    last = a[-1]
    first = b[0]
    # If both sides are CJK, join directly; otherwise add a space
    if ord(last) > 0x2E80 and ord(first) > 0x2E80:
        return a + b
    if ord(last) > 0x2E80 or ord(first) > 0x2E80:
        # CJK next to Latin — no space needed either (Chinese convention)
        return a + b
    return a + " " + b

def md_to_flowables(md_text, styles, dim_color=None):
    """Parse markdown and return a list of reportlab flowables."""
    out = []
    lines = md_text.split("\n")
    i = 0

    while i < len(lines):
        raw = lines[i]
        s = raw.strip()
        if not s:
            i += 1
            continue

        # --- Horizontal rule
        if re.match(r"^-{3,}$", s):
            out.append(Spacer(1, 2*mm))
            out.append(HRFlowable(width="100%", thickness=0.5, color=BORDER,
                                  spaceBefore=2*mm, spaceAfter=2*mm))
            i += 1
            continue

        # --- Headers
        hm = re.match(r"^(#{1,3})\s+(.*)", s)
        if hm:
            lvl = len(hm.group(1))
            txt = _xml_escape(hm.group(2))
            key = f"h{lvl}"
            if lvl == 2 and dim_color:
                st = ParagraphStyle(f"h2_{id(out)}", parent=styles["h2"],
                                    backColor=dim_color)
                out.append(Paragraph(txt, st))
            else:
                out.append(Paragraph(txt, styles.get(key, styles["body"])))
            i += 1
            continue

        # --- Blockquote (may span multiple lines)
        if s.startswith(">"):
            parts = [s.lstrip("> ").strip()]
            i += 1
            while i < len(lines) and lines[i].strip().startswith(">"):
                parts.append(lines[i].strip().lstrip("> ").strip())
                i += 1
            txt = _xml_escape("<br/>".join(parts))
            out.append(Paragraph(txt, styles["blockquote"]))
            continue

        # --- Bullet
        if re.match(r"^[-*]\s+", s):
            body = re.sub(r"^[-*]\s+", "", s)
            txt = _xml_escape(body)
            out.append(Paragraph(f"•\u2002{txt}", styles["bullet"]))
            i += 1
            continue

        # --- Paragraph: collect consecutive non-special lines
        para = s
        i += 1
        while i < len(lines):
            nxt = lines[i].strip()
            if (not nxt or nxt.startswith("#") or nxt.startswith(">")
                    or re.match(r"^[-*]\s+", nxt) or re.match(r"^-{3,}$", nxt)):
                break
            para = _join_lines(para, nxt)
            i += 1
        txt = _xml_escape(para)
        out.append(Paragraph(txt, styles["body"]))

    return out

# ---------------------------------------------------------------------------
# Page callbacks
# ---------------------------------------------------------------------------
def _title_bg(canvas, doc):
    w, h = A4
    canvas.setFillColor(PRIMARY)
    canvas.rect(0, 0, w, h, fill=True, stroke=False)

def _normal_page(canvas, doc):
    w, h = A4
    canvas.setStrokeColor(PRIMARY)
    canvas.setLineWidth(1.5)
    canvas.line(20*mm, h - 12*mm, w - 20*mm, h - 12*mm)
    canvas.setFont(CN, 8)
    canvas.setFillColor(MUTED)
    canvas.drawCentredString(w / 2, 10*mm,
                             f"MDPA 多维人格动态评估报告  ·  第 {doc.page} 页")

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def build_pdf():
    with open(os.path.join(BASE_DIR, "00_overview.json"), "r", encoding="utf-8") as f:
        data = json.load(f)

    reports = {}
    for key in ["O", "C", "E", "A", "N", "interactions", "personal"]:
        with open(os.path.join(BASE_DIR, f"report_{key}.md"), "r", encoding="utf-8") as f:
            reports[key] = f.read()

    S = make_styles()
    el = []

    # ────────────── Title page ──────────────
    el.append(Spacer(1, 60*mm))
    el.append(Paragraph("MDPA", S["title"]))
    el.append(Paragraph("多维人格动态评估报告", S["title"]))
    el.append(Spacer(1, 10*mm))
    el.append(Paragraph(data["student"]["name"], ParagraphStyle("pname",
        fontName=CN_B, fontSize=18, leading=24,
        textColor=HexColor("#ffffffdd"), alignment=TA_CENTER, wordWrap=CJK)))
    el.append(Spacer(1, 6*mm))
    meta = data["test_meta"]
    el.append(Paragraph(
        f'{meta["completed_at"][:10]}  ·  {meta["total_questions"]} 题  ·  '
        f'{meta["duration_minutes"]:.0f} 分钟', S["subtitle"]))
    el.append(Spacer(1, 30*mm))
    el.append(Paragraph(
        "本报告基于 MDPA 多维人格动态评估系统生成，仅供参考，不构成心理诊断。",
        ParagraphStyle("tw", fontName=CN, fontSize=9, leading=13,
                       textColor=HexColor("#ffffff99"), alignment=TA_CENTER, wordWrap=CJK)))
    el.append(PageBreak())

    # ────────────── Overview page ──────────────
    el.append(Paragraph("概览", S["h1"]))

    info_rows = [
        ["姓名", data["student"]["name"]],
        ["邮箱", data["student"]["email"]],
        ["背景", Paragraph(data["student"]["background"],
            ParagraphStyle("bg", fontName=CN_B, fontSize=10, leading=14,
                           textColor=TEXT_CLR, wordWrap=CJK))],
        ["MBTI", data["mbti"]["type"]],
        ["编号", meta["result_id"]],
    ]
    t = Table(info_rows, colWidths=[25*mm, 135*mm])
    t.setStyle(TableStyle([
        ("FONT", (0, 0), (0, -1), CN, 10),
        ("FONT", (1, 0), (1, -1), CN_B, 10),
        ("TEXTCOLOR", (0, 0), (0, -1), MUTED),
        ("TEXTCOLOR", (1, 0), (1, -1), TEXT_CLR),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, BORDER),
    ]))
    el.append(t)
    el.append(Spacer(1, 5*mm))

    # OCEAN table
    el.append(Paragraph("OCEAN 大五人格得分", S["h2"]))
    el.append(Spacer(1, 2*mm))

    def _rating(v):
        if v is None: return "N/A"
        if v >= 0.7: return "高"
        if v >= 0.4: return "中高"
        if v >= 0.1: return "中"
        if v >= -0.2: return "中低"
        return "低"

    rows = [["维度", "校准分", "原始分", "调整值", "评级"]]
    for d in "OCEAN":
        ds = data["ocean_summary"][d]
        c, r, a = ds["calibrated"], ds["raw"], ds["adjustment"]
        rows.append([
            DIM_NAMES[d],
            f"{c:.3f}" if c is not None else "—",
            f"{r:.3f}" if r is not None else "—",
            f"{a:+.3f}" if a is not None else "—",
            _rating(c),
        ])
    ot = Table(rows, colWidths=[45*mm, 25*mm, 25*mm, 25*mm, 20*mm])
    ot.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONT", (0, 0), (-1, 0), CN_B, 10),
        ("FONT", (0, 1), (-1, -1), CN, 10),
        ("ALIGNMENT", (0, 0), (-1, 0), "CENTER"),
        ("ALIGNMENT", (1, 1), (-1, -1), "CENTER"),
        ("ALIGNMENT", (0, 1), (0, -1), "LEFT"),
        ("BACKGROUND", (0, 2), (-1, 2), SURFACE),
        ("BACKGROUND", (0, 4), (-1, 4), SURFACE),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    el.append(ot)
    el.append(Spacer(1, 4*mm))

    # MBTI axis + N-clusters
    ms = data["mbti"]["strengths"]
    el.append(Paragraph(
        f'<b>MBTI: {data["mbti"]["type"]}</b>\u2003'
        f'E-I: {ms["EI"]:.2f}\u2003N-S: {ms["NS"]:.2f}\u2003'
        f'F-T: {ms["FT"]:.2f}\u2003J-P: {ms["JP"]:.2f}', S["body"]))
    nc = data["n_clusters"]
    el.append(Paragraph(
        f'<b>神经质子维度</b>\u2003'
        f'分析反刍: {nc["ar"]:.3f}\u2003'
        f'压力脆弱: {nc["sv"]:.3f}\u2003'
        f'情绪反应: {nc["er"]:.3f}', S["body"]))

    # RT summary
    el.append(Paragraph("行为反应时间摘要", S["h3"]))
    ort = data["behavioral_analysis"]["overall_rt"]
    el.append(Paragraph(
        f'共 {ort["count"]} 题，'
        f'平均 {ort["mean_sec"]:.1f}s，中位数 {ort["median_sec"]:.1f}s，'
        f'最快 {ort["min_sec"]:.1f}s，最慢 {ort["max_sec"]:.1f}s', S["body"]))
    el.append(Paragraph(
        "思考最久: " + "、".join(
            f'{it["id"]}({it["sec"]:.1f}s)' for it in ort["slowest_5"]
        ), S["body"]))

    # By-module RT table
    el.append(Spacer(1, 2*mm))
    mod_rows = [["模块", "题数", "均值(s)", "中位(s)", "最快(s)", "最慢(s)"]]
    for mod, md in data["behavioral_analysis"]["rt_by_module"].items():
        mod_rows.append([
            mod, str(md["count"]),
            f'{md["mean_sec"]:.1f}', f'{md["median_sec"]:.1f}',
            f'{md["min_sec"]:.1f}', f'{md["max_sec"]:.1f}',
        ])
    mt = Table(mod_rows, colWidths=[28*mm, 18*mm, 22*mm, 22*mm, 22*mm, 22*mm])
    mt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONT", (0, 0), (-1, 0), CN_B, 9),
        ("FONT", (0, 1), (-1, -1), CN, 9),
        ("ALIGNMENT", (0, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    for ri in range(2, len(mod_rows), 2):
        mt.setStyle(TableStyle([("BACKGROUND", (0, ri), (-1, ri), SURFACE)]))
    el.append(mt)

    el.append(PageBreak())

    # ────────────── 5 Dimension pages ──────────────
    for dim in ["O", "C", "E", "A", "N"]:
        sc = data["ocean_summary"][dim]["calibrated"]
        el.append(Paragraph(DIM_NAMES[dim], S["h1"]))
        el.append(Paragraph(
            f"校准得分: {sc:.3f}" if sc is not None else "校准得分: —",
            S["score_big"]))
        el.append(HRFlowable(width="100%", thickness=1,
                              color=DIM_COLORS[dim],
                              spaceBefore=2*mm, spaceAfter=4*mm))
        el.extend(md_to_flowables(reports[dim], S, dim_color=DIM_COLORS[dim]))
        el.append(PageBreak())

    # ────────────── Interactions ──────────────
    el.append(Paragraph("维度交互解读", S["h1"]))
    el.append(HRFlowable(width="100%", thickness=1, color=SECONDARY,
                          spaceBefore=2*mm, spaceAfter=4*mm))
    el.extend(md_to_flowables(reports["interactions"], S, dim_color=SECONDARY))
    el.append(PageBreak())

    # ────────────── Personal ──────────────
    el.append(Paragraph("个人化深度分析", S["h1"]))
    el.append(HRFlowable(width="100%", thickness=1, color=PRIMARY,
                          spaceBefore=2*mm, spaceAfter=4*mm))
    el.extend(md_to_flowables(reports["personal"], S, dim_color=PRIMARY))

    # Disclaimer
    el.append(Spacer(1, 10*mm))
    el.append(HRFlowable(width="60%", thickness=0.5, color=BORDER,
                          spaceBefore=4*mm, spaceAfter=4*mm))
    el.append(Paragraph(
        "本报告基于 MDPA 多维人格动态评估系统生成，仅供个人发展参考，不构成心理诊断或医学建议。",
        S["disclaimer"]))

    # ────────────── Build ──────────────
    doc = SimpleDocTemplate(OUTPUT_FILE, pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=18*mm, bottomMargin=18*mm,
        title="MDPA 多维人格动态评估报告",
        author="Chinese SDGs Institute")
    doc.build(el, onFirstPage=_title_bg, onLaterPages=_normal_page)
    print(f"PDF report generated: {OUTPUT_FILE}")

if __name__ == "__main__":
    build_pdf()
