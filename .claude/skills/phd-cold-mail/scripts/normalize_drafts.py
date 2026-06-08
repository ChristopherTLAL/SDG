#!/usr/bin/env python3
"""
R1 — Mechanical normalization pass for cold-mail drafts.

Standardizes the `subject` and `signature` fields across all per-supervisor JSON
files. This is the FIRST step of the post-review workflow: subject + signature
are mechanical and don't need per-letter LLM judgment, so we normalize cheaply
before any tone audit / user review.

Subject template (NO year — locking the admission cycle in subject hurts
when the student's graduation timing is uncertain; supervisors will infer
year from CV / response thread):
    PhD inquiry — {topic} — {student_name}

Signature template:
    {student_name}
    {role}
    {affiliation}

The topic for each subject is extracted from the existing free-form subject via
regex: strip lead phrases (`PhD inquiry`, `Prospective PhD`, etc.), strip year
markers, strip trailing student name, take what's left.

Usage:
    python3 normalize_drafts.py DIR --year 2027 \
        --student-name "Jinnan Liu" \
        --role "MSc Candidate, School of Radiation Medicine and Protection" \
        --affiliation "Soochow University"
    # Re-render MD from updated JSON after:
    python3 draft_io.py json-to-md DIR
"""

import argparse
import json
import re
import sys
from pathlib import Path

# Patterns to strip when extracting the topic from a free-form subject
LEAD_PATTERNS = [
    r"^(?:re:\s*)?(?:fwd:\s*)?",  # email reply/forward prefixes
    r"^Prospective\s+(?:Fall\s+\d{4}\s+)?PhD\s+(?:applicant|student)?[\s\-—–:|/]*",
    r"^PhD\s+(?:inquiry|enquiry|Inquiry|Enquiry|application|Application)\s*",
    r"^Inquiry\s+about\s+(?:Fall\s+\d{4}\s+)?PhD\s+(?:Openings?|positions?|opportunities?)\s*(?:in\s+)?",
    r"^Application\s+for\s+(?:Fall\s+\d{4}\s+)?PhD\s*",
]

# Patterns to strip year markers wherever they appear
YEAR_PATTERNS = [
    r"\([^)]*(?:Fall|Spring|fall|spring|Autumn)?\s*20\d{2}[^)]*\)",  # (Fall 2027), (2027), (2025/2026 Intake)
    r"\b(?:Fall|Spring|Autumn|fall|spring|autumn)\s+20\d{2}\b",  # Fall 2027
    r"\b20\d{2}\s+(?:fall|spring|autumn|entry|intake|admission|cycle)\b",  # 2027 fall
    r"\b20\d{2}\s*(?:entry|intake|admission|cycle)\b",  # 2027 entry
    r"\bFY\s*20\d{2}\b",  # FY2027
]


def extract_topic(subject: str) -> str:
    """Strip year markers, lead phrases, and trailing name; return middle topic."""
    s = subject.strip()
    # 1. Strip leading phrase
    for pat in LEAD_PATTERNS:
        s = re.sub(pat, "", s, flags=re.I)
    # 2. Strip year markers (run multiple times for robustness)
    for _ in range(2):
        for pat in YEAR_PATTERNS:
            s = re.sub(pat, "", s, flags=re.I)
    # 3. Strip "for Fall 2027" and similar leftover prepositional phrases
    s = re.sub(r"\bfor\s*$", "", s, flags=re.I)
    s = re.sub(r"\bin\s*$", "", s, flags=re.I)
    # 4. Strip trailing student name (configurable later if needed)
    s = re.sub(r"[\s\-—–/|,]+(?:Jinnan\s+Liu|Liu\s+Jinnan)\s*$", "", s, flags=re.I)
    # 5. Strip leading + trailing delimiters / whitespace
    s = re.sub(r"^[\s\-—–:|/]+", "", s)
    s = re.sub(r"[\s\-—–:|/]+$", "", s)
    # 6. Collapse double spaces / weird whitespace
    s = re.sub(r"\s+", " ", s).strip()
    return s


def normalize_subject(topic: str, year, student_name: str) -> str:
    """Compose normalized subject. If year=None, omit the year parenthetical
    (recommended for students whose graduation timing is uncertain — typical
    for Chinese 学硕 who may extend to 3 years)."""
    if year:
        return f"PhD inquiry (Fall {year}) — {topic} — {student_name}"
    return f"PhD inquiry — {topic} — {student_name}"


def normalize_signature(student_name: str, role: str, affiliation: str) -> str:
    parts = [student_name]
    if role:
        parts.append(role)
    if affiliation:
        parts.append(affiliation)
    return "\n".join(parts)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--year", type=int, default=None, help="If set, subject includes '(Fall YYYY)'. Omit to keep subject year-neutral (recommended).")
    ap.add_argument("--student-name", default="Jinnan Liu")
    ap.add_argument("--role", default="MSc Candidate, School of Radiation Medicine and Protection")
    ap.add_argument("--affiliation", default="Soochow University")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    folder = Path(args.folder)
    files = sorted([f for f in folder.iterdir() if f.suffix == ".json" and f.name != "MANIFEST.json"])

    new_sig = normalize_signature(args.student_name, args.role, args.affiliation)
    changes = []
    suspicious = []

    for f in files:
        r = json.loads(f.read_text(encoding="utf-8"))
        old_subject = r["email"]["subject"]
        old_signature = r["email"]["signature"]

        topic = extract_topic(old_subject)
        if not topic or len(topic) < 6 or len(topic) > 120:
            suspicious.append((f.name, old_subject, topic))
            # Skip subject change for this row; still update signature
            new_subject = old_subject
        else:
            new_subject = normalize_subject(topic, args.year, args.student_name)

        if new_subject != old_subject or new_sig != old_signature:
            changes.append((f.name, old_subject, new_subject, old_signature != new_sig))
            r["email"]["subject"] = new_subject
            r["email"]["signature"] = new_sig
            if not args.dry_run:
                f.write_text(json.dumps(r, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Normalized {len(changes)} drafts")
    print(f"  Subject changes: {sum(1 for _, o, n, _ in changes if o != n)}")
    print(f"  Signature changes: {sum(1 for _, _, _, sig in changes if sig)}")
    if suspicious:
        print(f"\n⚠️  Suspicious subjects (topic extraction failed, subject left unchanged): {len(suspicious)}")
        for fn, sub, topic in suspicious:
            print(f"   {fn:50s} extracted={topic!r:20s} from={sub!r}")
    # Show first 5 changes for sanity
    print("\nFirst 5 subject normalizations:")
    for fn, old, new, _ in changes[:5]:
        if old == new:
            continue
        print(f"  {fn[:40]:40s}")
        print(f"    OLD: {old}")
        print(f"    NEW: {new}")


if __name__ == "__main__":
    main()
