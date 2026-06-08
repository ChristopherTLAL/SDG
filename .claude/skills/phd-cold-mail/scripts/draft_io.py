#!/usr/bin/env python3
"""
Read/write per-supervisor cold-mail drafts as STRUCTURED JSON files (canonical
source-of-truth) plus a rendered human-readable Markdown view.

Schema:
  {
    "id": "001",
    "supervisor": {"name", "name_chinese", "school", "department", "position"},
    "contact": {"email", "email_confirmed", "email_source"},
    "availability": {"status", "evidence"},
    "top_rank": int | null,
    "research": {
      "summary",
      "papers": [{"citation", "doi"}],
      "links": [str, ...],
      "alignment_notes": [str, ...]
    },
    "email": {"subject", "body", "signature"},
    "meta": {"student", "student_english_name", "generated_at", "model", "source_excel"},
    "send_status": {"sent", "sent_at", "reply_received", "reply_at", "notes"}
  }

Usage:
    # Convert existing markdown to JSON (idempotent — JSON is source of truth)
    python3 draft_io.py md-to-json DIR
    # Render JSON back to MD
    python3 draft_io.py json-to-md DIR
    # Roundtrip test
    python3 draft_io.py roundtrip DIR
"""

import argparse
import json
import re
import sys
from pathlib import Path


# ---------- Markdown → JSON ----------

def parse_frontmatter(text):
    m = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
    if not m:
        return {}, text
    fm = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            fm[k.strip()] = v.strip()
    return fm, text[m.end():]


def split_sections(body):
    """Split body by ## headers. Returns dict of {section_name: section_text}."""
    sections = {}
    current_key = "_preamble"
    current = []
    for line in body.splitlines():
        m = re.match(r"^##\s+(.+?)$", line)
        if m:
            sections[current_key] = "\n".join(current).strip()
            current_key = m.group(1).strip()
            current = []
        else:
            current.append(line)
    sections[current_key] = "\n".join(current).strip()
    return sections


def parse_notes_section(notes_text):
    """Parse the 调研笔记 section's **field**: value structure."""
    out = {
        "summary": "",
        "papers": [],
        "links": [],
        "alignment_notes": [],
        "availability_evidence": "",
    }
    current_field = None
    current_lines = []

    def flush():
        nonlocal current_field, current_lines
        if not current_field:
            return
        text = "\n".join(current_lines).strip()
        if current_field == "研究方向":
            out["summary"] = text
        elif current_field == "重要论文":
            for line in text.splitlines():
                line = line.strip()
                m = re.match(r"^\d+\.\s+(.+)$", line)
                if m:
                    citation = m.group(1).strip()
                    doi = None
                    doi_m = re.search(r"(?:DOI:\s*|https?://doi\.org/)(\S+)", citation, re.I)
                    if doi_m:
                        doi = doi_m.group(1).rstrip(".")
                    out["papers"].append({"citation": citation, "doi": doi})
        elif current_field == "主要链接":
            for line in text.splitlines():
                line = line.strip().lstrip("-").strip()
                if line:
                    out["links"].append(line)
        elif current_field == "对齐点 (内部 notes)" or current_field == "对齐点":
            for line in text.splitlines():
                line = line.strip().lstrip("-").strip()
                if line:
                    out["alignment_notes"].append(line)
        elif current_field == "博士招生情况":
            out["availability_evidence"] = text

    for line in notes_text.splitlines():
        m = re.match(r"^\*\*(.+?)\*\*:\s*(.*)$", line)
        if m:
            flush()
            current_field = m.group(1).strip()
            current_lines = [m.group(2)] if m.group(2) else []
        else:
            current_lines.append(line)
    flush()
    return out


def md_to_record(md_text, filename):
    """Convert one MD file's text to a record dict."""
    fm, body = parse_frontmatter(md_text)
    sections = split_sections(body)

    subject = sections.get("Subject", "").strip()
    body_text = sections.get("Email body", "").strip()
    # Strip trailing horizontal rule (separator before the 调研笔记 section gets
    # captured inside the email body section because split_sections delimits by ##)
    body_text = re.sub(r"\n+---\s*$", "", body_text).strip()

    # Split off signature (last single-line paragraph of body_text)
    body_lines = body_text.split("\n\n")
    signature = ""
    if body_lines and len(body_lines[-1].splitlines()) == 1 and len(body_lines) > 1:
        signature = body_lines[-1].strip()
        body_without_sig = "\n\n".join(body_lines[:-1]).strip()
    else:
        body_without_sig = body_text

    notes_text = sections.get("调研笔记（不要发出去）", "") or sections.get("调研笔记", "")
    notes = parse_notes_section(notes_text)

    # ID from filename: 001 / u042
    id_match = re.match(r"^([u]?\d+)_", filename)
    file_id = id_match.group(1) if id_match else filename.rsplit(".", 1)[0]

    # Top rank
    rank_str = fm.get("top_rank", "")
    try:
        top_rank = int(rank_str) if rank_str and rank_str not in ("null", "None", "-") else None
    except ValueError:
        top_rank = None

    email_val = fm.get("email", "")
    email_confirmed = bool(email_val and "未确认" not in email_val and email_val != "?")

    record = {
        "id": file_id,
        "supervisor": {
            "name": fm.get("supervisor", "").strip(),
            "school": fm.get("school", "").strip(),
            "department": fm.get("department", "").strip(),
            "position": fm.get("position", "").strip(),
        },
        "contact": {
            "email": email_val.strip(),
            "email_confirmed": email_confirmed,
            "email_source": "",  # populated when email_hunt subagent updates
        },
        "availability": {
            "status": fm.get("availability", "").strip(),
            "evidence": notes["availability_evidence"],
        },
        "top_rank": top_rank,
        "research": {
            "summary": notes["summary"],
            "papers": notes["papers"],
            "links": notes["links"] or [s.strip() for s in fm.get("research_sources", "").split(",") if s.strip()],
            "alignment_notes": notes["alignment_notes"],
        },
        "email": {
            "subject": subject,
            "body": body_without_sig,
            "signature": signature,
        },
        "meta": {
            "generated_at": fm.get("generated_at", "").strip(),
            "model": fm.get("model", "").strip(),
            "source_excel": "",
            "student": "",
            "student_english_name": "",
        },
        "send_status": {
            "sent": False,
            "sent_at": None,
            "reply_received": False,
            "reply_at": None,
            "notes": None,
        },
    }
    return record


# ---------- JSON → Markdown ----------

def render_md(record):
    """Render a record back to the canonical MD format."""
    sup = record["supervisor"]
    contact = record["contact"]
    avail = record["availability"]
    email = record["email"]
    research = record["research"]
    meta = record["meta"]

    email_disp = contact["email"] if contact.get("email") else "未确认"
    if contact.get("email") and not contact.get("email_confirmed"):
        if "未确认" not in email_disp:
            email_disp = f"{email_disp} (未确认)"

    fm_lines = [
        "---",
        f"supervisor: {sup['name']}",
        f"school: {sup['school']}",
        f"department: {sup['department']}",
        f"position: {sup['position']}",
        f"email: {email_disp}",
        f"availability: {avail['status']}",
        f"top_rank: {record['top_rank'] if record['top_rank'] else 'null'}",
        f"generated_at: {meta['generated_at']}",
        f"research_sources: {', '.join(research['links'][:3])}",
        f"model: {meta['model']}",
        "---",
        "",
        f"# 致 {sup['name']} 套磁信",
        "",
        "## Subject",
        "",
        email["subject"],
        "",
        "## Email body",
        "",
        email["body"],
    ]
    if email.get("signature"):
        fm_lines += ["", email["signature"]]
    fm_lines += [
        "",
        "---",
        "",
        "## 调研笔记（不要发出去）",
        "",
        f"**研究方向**: {research['summary']}",
        "",
        "**重要论文**:",
    ]
    for i, p in enumerate(research["papers"], 1):
        fm_lines.append(f"{i}. {p['citation']}")
    fm_lines += [
        "",
        f"**博士招生情况**: {avail['evidence']}",
        "",
        "**主要链接**:",
    ]
    for link in research["links"]:
        fm_lines.append(f"- {link}")
    fm_lines += ["", "**对齐点 (内部 notes)**:"]
    for note in research["alignment_notes"]:
        fm_lines.append(f"- {note}")
    return "\n".join(fm_lines) + "\n"


# ---------- CLI ----------

def cmd_md_to_json(folder: Path, dry_run=False):
    md_files = sorted([f for f in folder.iterdir() if f.suffix == ".md" and f.name not in ("INDEX.md",)])
    converted = 0
    for f in md_files:
        record = md_to_record(f.read_text(encoding="utf-8"), f.name)
        json_path = f.with_suffix(".json")
        if not dry_run:
            json_path.write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
        converted += 1
    print(f"Converted {converted} markdown → JSON in {folder}")


def cmd_json_to_md(folder: Path, dry_run=False):
    json_files = sorted([f for f in folder.iterdir() if f.suffix == ".json" and f.name not in ("MANIFEST.json",)])
    rendered = 0
    for f in json_files:
        record = json.loads(f.read_text(encoding="utf-8"))
        md = render_md(record)
        md_path = f.with_suffix(".md")
        if not dry_run:
            md_path.write_text(md, encoding="utf-8")
        rendered += 1
    print(f"Rendered {rendered} JSON → markdown in {folder}")


def cmd_roundtrip(folder: Path):
    """Test that md_to_record → render_md → md_to_record yields the same record."""
    md_files = sorted([f for f in folder.iterdir() if f.suffix == ".md" and f.name != "INDEX.md"])
    mismatches = []
    for f in md_files[:5]:  # spot-check
        original_text = f.read_text(encoding="utf-8")
        rec = md_to_record(original_text, f.name)
        rendered = render_md(rec)
        rec2 = md_to_record(rendered, f.name)
        # Compare subjects + bodies (the parts the user cares about)
        if rec["email"]["subject"] != rec2["email"]["subject"]:
            mismatches.append(f"{f.name}: subject differs")
        if rec["email"]["body"] != rec2["email"]["body"]:
            mismatches.append(f"{f.name}: body differs ({len(rec['email']['body'])} vs {len(rec2['email']['body'])})")
        if len(rec["research"]["papers"]) != len(rec2["research"]["papers"]):
            mismatches.append(f"{f.name}: papers count differs ({len(rec['research']['papers'])} vs {len(rec2['research']['papers'])})")
    if mismatches:
        print(f"Roundtrip ISSUES ({len(mismatches)}):")
        for m in mismatches:
            print(f"  - {m}")
    else:
        print(f"Roundtrip OK on first 5 samples")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["md-to-json", "json-to-md", "roundtrip"])
    ap.add_argument("folder")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    folder = Path(args.folder)
    if args.cmd == "md-to-json":
        cmd_md_to_json(folder, args.dry_run)
    elif args.cmd == "json-to-md":
        cmd_json_to_md(folder, args.dry_run)
    elif args.cmd == "roundtrip":
        cmd_roundtrip(folder)


if __name__ == "__main__":
    main()
