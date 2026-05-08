#!/usr/bin/env python3
"""
Pick pending (topicId, cefr) pairs from data/english-topics.json
and assign each a slug (filename date).

Usage:
  python3 pick-topics.py --count 10
  python3 pick-topics.py --cefr B2 --count 5
  python3 pick-topics.py --topic-id t-vesuvius-ai-2024
"""
import argparse
import json
import sys
from datetime import date, timedelta
from pathlib import Path


def find_repo_root() -> Path:
    """Find the repo root by walking up from this script."""
    p = Path(__file__).resolve()
    for parent in p.parents:
        if (parent / "data").is_dir() and (parent / "src" / "data" / "english").is_dir():
            return parent
    raise RuntimeError("could not find repo root")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--count", type=int, default=10)
    ap.add_argument("--cefr", default=None, help="filter to a specific CEFR level")
    ap.add_argument("--topic-id", default=None, help="pick this specific topic (all pending CEFRs)")
    args = ap.parse_args()

    repo = find_repo_root()
    db_path = repo / "data" / "english-topics.json"
    if not db_path.exists():
        print(json.dumps({"error": f"topic DB not found at {db_path}"}))
        sys.exit(1)

    db = json.loads(db_path.read_text(encoding="utf-8"))

    # Find used slugs from existing article files
    article_dir = repo / "src" / "data" / "english"
    used_slugs = set()
    for f in article_dir.glob("*.ts"):
        if f.stem in {"types", "index"}:
            continue
        used_slugs.add(f.stem)

    # Also count slugs already assigned in the DB (from prior run that may not have finished)
    for topic in db.get("topics", []):
        for art in topic.get("articles", []):
            if "slug" in art:
                used_slugs.add(art["slug"])

    # Find pending pairs
    pending = []
    for topic in db.get("topics", []):
        if args.topic_id and topic["id"] != args.topic_id:
            continue
        done_cefrs = {a["cefr"] for a in topic.get("articles", []) if a.get("cefr")}
        for cefr in topic.get("suggestedCEFR", []):
            if cefr in done_cefrs:
                continue
            if args.cefr and cefr != args.cefr:
                continue
            pending.append({"topicId": topic["id"], "cefr": cefr})

    # Take only count requested (unless topic-id was specified, then take all matching)
    if not args.topic_id and args.count:
        pending = pending[: args.count]

    # Assign slugs (next available date starting from today)
    today = date.today()
    cursor = today
    for p in pending:
        while cursor.isoformat() in used_slugs:
            cursor += timedelta(days=1)
        p["slug"] = cursor.isoformat()
        used_slugs.add(p["slug"])
        cursor += timedelta(days=1)

    print(json.dumps(pending, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
