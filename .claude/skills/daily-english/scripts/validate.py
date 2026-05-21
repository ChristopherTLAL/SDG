#!/usr/bin/env python3
"""
Validate a generated article TS file.

Usage: python3 validate.py <path-to-article-ts-file>

Exits 0 if valid, 1 if errors. Prints JSON {"ok": bool, "errors": [...]}.
"""
import json
import re
import sys
from pathlib import Path


VALID_CEFR = {"A2", "B1", "B2", "C1", "C2"}
VALID_LEVELS = {1, 2, 3, 4}


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "errors": ["usage: validate.py <file>"]}))
        sys.exit(1)

    path = Path(sys.argv[1])
    if not path.exists():
        print(json.dumps({"ok": False, "errors": [f"file not found: {path}"]}))
        sys.exit(1)

    content = path.read_text(encoding="utf-8")
    errors = []

    # 1. No em-dashes anywhere
    if "——" in content:
        errors.append("contains Chinese em-dash (——)")
    # Check for single em-dash (after we already verified the double check)
    em_count = content.count("—")
    # Each "——" counts as 2 single em-dashes; subtract them
    double_em_count = content.count("——") * 2
    single_em_count = em_count - double_em_count
    if single_em_count > 0:
        # Show first few contexts
        positions = []
        idx = 0
        while idx < len(content) and len(positions) < 3:
            pos = content.find("—", idx)
            if pos == -1:
                break
            ctx_start = max(0, pos - 25)
            ctx_end = min(len(content), pos + 25)
            positions.append(content[ctx_start:ctx_end].replace("\n", " "))
            idx = pos + 1
        errors.append(f"contains em-dash (—); found {single_em_count} occurrence(s). first contexts: {positions}")

    # 2. Schema integrity (regex-level checks; we can't run TS without tsc)
    if "export const article: Article" not in content:
        errors.append("missing 'export const article: Article' export")
    # Flat articles import from './types'; book chapters live two levels deeper
    # (books/<id>/<chapter>.ts) and import from '../../types'.
    if ("import type { Article } from './types'" not in content
            and "import type { Article } from '../../types'" not in content):
        errors.append(
            "missing import: \"import type { Article } from './types'\" (flat) "
            "or \"'../../types'\" (book chapter)"
        )

    # 3. CEFR value
    cefr_match = re.search(r"cefr:\s*['\"]([^'\"]+)['\"]", content)
    if not cefr_match:
        errors.append("could not find meta.cefr value")
    elif cefr_match.group(1) not in VALID_CEFR:
        errors.append(f"invalid cefr value: {cefr_match.group(1)} (must be one of {sorted(VALID_CEFR)})")

    # 4. Vocab levels are 1..4
    level_values = re.findall(r"\blevel:\s*(\d+)", content)
    for lv in level_values:
        if int(lv) not in VALID_LEVELS:
            errors.append(f"invalid vocab level: {lv} (must be 1, 2, 3, or 4)")

    # 5. Sentence ID extraction
    # Match { id: 's<N>', en: '...', zh: '...' } robustly across single/double quoted strings.
    sentence_pattern = re.compile(
        r"\{\s*id:\s*['\"](s\d+)['\"]\s*,\s*en:\s*('(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\")\s*,\s*zh:",
        re.DOTALL,
    )
    sentences = {}
    for m in sentence_pattern.finditer(content):
        sid = m.group(1)
        en_lit = m.group(2)
        # strip outer quotes and unescape
        en = en_lit[1:-1]
        en = en.replace("\\'", "'").replace('\\"', '"').replace("\\\\", "\\").replace("\\n", "\n")
        sentences[sid] = en

    if not sentences:
        errors.append("no sentences extracted (or sentence pattern didn't match — schema deviation)")

    # 6. Vocab regex matches: each vocab.word must be findable by \b in its sentenceId's en
    vocab_pattern = re.compile(
        r"\{\s*id:\s*['\"](v\d+)['\"]\s*,\s*word:\s*('(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\")"
        r"\s*,\s*lemma:\s*(?:'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\")"
        r"\s*,\s*sentenceId:\s*['\"](s\d+)['\"]",
        re.DOTALL,
    )
    vocab_count = 0
    for m in vocab_pattern.finditer(content):
        vocab_count += 1
        vid = m.group(1)
        word_lit = m.group(2)
        sid = m.group(3)
        word = word_lit[1:-1]
        word = word.replace("\\'", "'").replace('\\"', '"').replace("\\\\", "\\")
        if sid not in sentences:
            errors.append(f"vocab {vid} ({word!r}) references sentenceId {sid} that doesn't exist")
            continue
        sentence = sentences[sid]
        if not re.search(rf"\b{re.escape(word)}\b", sentence, re.IGNORECASE):
            errors.append(
                f"vocab {vid} word {word!r} not found via \\b in sentence {sid}: {sentence[:80]!r}"
            )

    if vocab_count == 0:
        errors.append("no vocab entries extracted")

    # 7. Grammar / pattern sentenceIds reference real sentences
    # grammar: sentenceIds: ['s5', 's8']
    for m in re.finditer(r"sentenceIds:\s*\[([^\]]*)\]", content):
        ids = re.findall(r"['\"](s\d+)['\"]", m.group(1))
        for sid in ids:
            if sid not in sentences:
                errors.append(f"grammar references unknown sentenceId: {sid}")

    # patterns: sentenceId: 's6' (single)
    for m in re.finditer(r"\bsentenceId:\s*['\"](s\d+)['\"]", content):
        sid = m.group(1)
        if sid not in sentences:
            errors.append(f"pattern references unknown sentenceId: {sid}")

    # 8. wordCount sanity (should be roughly within CEFR range)
    word_count_match = re.search(r"wordCount:\s*(\d+)", content)
    if word_count_match and cefr_match:
        wc = int(word_count_match.group(1))
        cefr = cefr_match.group(1)
        ranges = {"A2": (160, 280), "B1": (220, 380), "B2": (290, 460), "C1": (340, 540), "C2": (380, 600)}
        lo, hi = ranges.get(cefr, (0, 10000))
        if wc < lo or wc > hi:
            errors.append(f"wordCount {wc} outside soft range {lo}-{hi} for {cefr}")

    # Output
    if errors:
        print(json.dumps({"ok": False, "errors": errors}, indent=2, ensure_ascii=False))
        sys.exit(1)

    print(json.dumps({
        "ok": True,
        "stats": {
            "sentences": len(sentences),
            "vocab": vocab_count,
            "cefr": cefr_match.group(1) if cefr_match else None,
            "wordCount": int(word_count_match.group(1)) if word_count_match else None,
        }
    }, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()
