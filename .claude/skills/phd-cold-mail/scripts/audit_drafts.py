#!/usr/bin/env python3
"""
R2 — Style audit pass for cold-mail drafts.

Scans every draft's email body for common AI-tells and prints a report:

1. **Lexical red flags**: hedging / inflation / throat-clearing phrases.
2. **Length distribution**: too short / too long outliers.
3. **Opening duplication**: how many drafts open with the same first sentence
   (or near-duplicates). High overlap = formulaic.
4. **Paragraph-3 anchor density**: paragraph 3 should cite a specific paper or
   concept; flag drafts where the para 3 looks generic.

No LLM — pure regex / frequency analysis. The output is meant to inform a
human (the user) deciding what tone fixes to apply in R3.

Usage:
    python3 audit_drafts.py DIR
"""

import argparse
import json
import re
from collections import Counter
from pathlib import Path


# AI-tell phrases — case-insensitive substring match on the email body
RED_FLAG_PHRASES = {
    # Hedging / pleading
    "I would be honored": "hedging-honored",
    "I am honored": "hedging-honored",
    "It would be a great privilege": "hedging-privilege",
    "It would be an honor": "hedging-privilege",
    "I would be grateful": "hedging-grateful",
    "deeply grateful": "hedging-grateful",
    "I am deeply": "hedging-deeply",
    # Throat-clearing openers
    "I hope this email finds you well": "throat-clearing",
    "I hope this finds you well": "throat-clearing",
    "I am reaching out": "throat-clearing",
    "I am writing to express my interest": "throat-clearing",
    # Adjective inflation
    "groundbreaking": "inflation-adjective",
    "world-class": "inflation-adjective",
    "exceptional": "inflation-adjective",
    "outstanding work": "inflation-adjective",
    "cutting-edge": "inflation-adjective",
    "state-of-the-art": "inflation-adjective",
    "remarkable": "inflation-adjective",
    "incredible": "inflation-adjective",
    "fascinating": "inflation-adjective",
    # Generic alignment claims
    "perfectly aligned": "generic-alignment",
    "perfect alignment": "generic-alignment",
    "deeply aligned": "generic-alignment",
    "strongly aligned": "generic-alignment",
    "directly aligned": "generic-alignment",
    "ideal fit": "generic-fit",
    "perfect fit": "generic-fit",
    "great fit": "generic-fit",
    # Empty admiration
    "deeply impressed": "empty-admiration",
    "particularly struck by": "empty-admiration",
    "great admiration": "empty-admiration",
    "I have long admired": "empty-admiration",
    "much admire": "empty-admiration",
    # AI-cadence phrases
    "It is with great": "ai-cadence",
    "I am thrilled": "ai-cadence",
    "I am eager to contribute": "ai-cadence",
    # Empty closings (besides standard "I have attached my CV")
    "Looking forward to": "weak-closing",
    "Thank you for your time and consideration": "weak-closing",
}


def word_count(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text))


def get_paragraphs(body: str):
    return [p.strip() for p in re.split(r"\n\s*\n", body.strip()) if p.strip()]


def looks_generic(paragraph: str) -> bool:
    """Heuristic: paragraph cites NO year, NO paper title, NO concrete artifact."""
    if not paragraph:
        return False
    has_year = bool(re.search(r"\b20[12]\d\b", paragraph))
    has_doi = "doi" in paragraph.lower() or "10." in paragraph
    has_quoted_concept = bool(re.search(r"[\"“][^\"”]{4,}[\"”]", paragraph))
    has_strong_proper_noun = bool(re.search(r"\b[A-Z][a-z]*\.?[A-Z]\w+\b", paragraph))  # e.g., MATILDA.FT, ReaxFF
    has_specific_method = bool(re.search(r"\b(MD|MC|CG|SSAGES|ReaxFF|MARTINI|DFT|MATILDA|HOOMD|DPD|GROMACS|LAMMPS|ML)\b", paragraph))
    return not (has_year or has_doi or has_quoted_concept or has_strong_proper_noun or has_specific_method)


def normalize_opening(body: str) -> str:
    """First sentence of the body for duplication analysis."""
    # Skip greeting "Dear Prof X,"
    paragraphs = get_paragraphs(body)
    if not paragraphs:
        return ""
    first = paragraphs[0]
    # Drop the salutation line if it leads
    first_lines = first.split("\n")
    if len(first_lines) > 1 and re.match(r"^Dear\s+(Prof|Dr|Mr|Ms|Mrs)\.?\s+\S", first_lines[0], re.I):
        first = "\n".join(first_lines[1:]).strip()
    # First sentence
    m = re.match(r"^([^.!?]{15,400}[.!?])", first)
    return m.group(1).lower() if m else first[:200].lower()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    args = ap.parse_args()
    folder = Path(args.folder)
    files = sorted([f for f in folder.iterdir() if f.suffix == ".json" and f.name != "MANIFEST.json"])

    findings_by_file = {}  # file -> list of (phrase, category, count)
    word_counts = []
    opening_phrases = Counter()
    file_to_opening = {}
    para3_generic = []
    para2_long = []  # paragraph 2 looking like CV dump if too long

    for f in files:
        r = json.loads(f.read_text(encoding="utf-8"))
        body = r["email"]["body"]
        wc = word_count(body)
        word_counts.append((wc, f.name))

        # Red-flag scan
        fns = []
        for phrase, cat in RED_FLAG_PHRASES.items():
            count = len(re.findall(re.escape(phrase), body, re.I))
            if count > 0:
                fns.append((phrase, cat, count))
        if fns:
            findings_by_file[f.name] = fns

        # Opening duplication
        op = normalize_opening(body)
        op_key = op[:80]
        opening_phrases[op_key] += 1
        file_to_opening[f.name] = op_key

        # Paragraph 3 generic check
        paragraphs = get_paragraphs(body)
        # Skip "Dear Prof X" line; usually para 0 = greeting+intro, para 1 = background, para 2 = alignment, para 3 = ask
        # But heuristically: 3rd substantive paragraph (whichever has 200-500 chars)
        substantive = [p for p in paragraphs if word_count(p) > 30 and not re.match(r"^Dear\s+", p, re.I)]
        if len(substantive) >= 3:
            para3 = substantive[2]  # 0-indexed 3rd substantive
            if looks_generic(para3):
                para3_generic.append(f.name)

        # Para 2 too long
        if len(substantive) >= 2:
            para2 = substantive[1]
            if word_count(para2) > 200:
                para2_long.append((f.name, word_count(para2)))

    # Report
    print(f"\n{'='*70}\nAUDIT REPORT — {len(files)} drafts\n{'='*70}\n")

    # 1. Red flags
    if findings_by_file:
        cat_counts = Counter()
        for f, fns in findings_by_file.items():
            for _, cat, _ in fns:
                cat_counts[cat] += 1
        print(f"## 1. Lexical red flags ({len(findings_by_file)} drafts affected)")
        for cat, n in cat_counts.most_common():
            phrases_in_cat = {p for p, c in RED_FLAG_PHRASES.items() if c == cat}
            example_files = [f for f, fns in findings_by_file.items()
                             if any(c == cat for _, c, _ in fns)][:3]
            print(f"  - **{cat}**: {n} drafts. Phrases: {', '.join(sorted(phrases_in_cat)[:4])}{'...' if len(phrases_in_cat)>4 else ''}")
            print(f"      e.g.: {', '.join(example_files)}")
    else:
        print(f"## 1. Lexical red flags: NONE 🟢")

    # 2. Length distribution
    word_counts.sort()
    print(f"\n## 2. Word-count distribution")
    print(f"  - min: {word_counts[0][0]} ({word_counts[0][1]})")
    print(f"  - 25%: {word_counts[len(word_counts)//4][0]}")
    print(f"  - 50%: {word_counts[len(word_counts)//2][0]}")
    print(f"  - 75%: {word_counts[3*len(word_counts)//4][0]}")
    print(f"  - max: {word_counts[-1][0]} ({word_counts[-1][1]})")
    print(f"  - <180 (too short): {[f for wc, f in word_counts if wc < 180]}")
    print(f"  - >350 (too long):  {[f for wc, f in word_counts if wc > 350]}")

    # 3. Opening duplication
    print(f"\n## 3. Opening-line duplication (first-sentence near-duplicates)")
    dup_op = [(op, n) for op, n in opening_phrases.most_common() if n >= 3]
    if dup_op:
        for op, n in dup_op:
            files_with = [f for f, o in file_to_opening.items() if o == op]
            print(f"  - **{n} drafts** open with: {op[:120]!r}")
            print(f"      files: {', '.join(files_with[:5])}{'...' if len(files_with)>5 else ''}")
    else:
        print("  No 3+ duplicates 🟢")

    # 4. Paragraph 3 generic
    print(f"\n## 4. Paragraph-3 generic flattery (no year / no specific method / no proper noun)")
    if para3_generic:
        print(f"  {len(para3_generic)} drafts flagged:")
        for fn in para3_generic[:10]:
            print(f"  - {fn}")
        if len(para3_generic) > 10:
            print(f"  ... and {len(para3_generic)-10} more")
    else:
        print("  None 🟢")

    # 5. Para 2 too long (CV-dump symptom)
    print(f"\n## 5. Paragraph 2 too long (CV-dump risk, >200 words)")
    if para2_long:
        for fn, wc in sorted(para2_long, key=lambda x: -x[1])[:10]:
            print(f"  - {fn}: {wc} words")
    else:
        print("  None 🟢")

    print(f"\n{'='*70}\nDONE.\n")


if __name__ == "__main__":
    main()
