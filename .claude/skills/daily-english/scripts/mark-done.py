#!/usr/bin/env python3
"""
Mark a (topicId, cefr, slug) pair done in data/english-topics.json.

Usage:
  python3 mark-done.py --topic-id t-vesuvius-ai-2024 --cefr B2 --slug 2026-05-09
"""
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def find_repo_root() -> Path:
    p = Path(__file__).resolve()
    for parent in p.parents:
        if (parent / "data").is_dir() and (parent / "src" / "data" / "english").is_dir():
            return parent
    raise RuntimeError("could not find repo root")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--topic-id", required=True)
    ap.add_argument("--cefr", required=True, choices=["A2", "B1", "B2", "C1", "C2"])
    ap.add_argument("--slug", required=True)
    args = ap.parse_args()

    repo = find_repo_root()
    db_path = repo / "data" / "english-topics.json"
    db = json.loads(db_path.read_text(encoding="utf-8"))

    file_path = f"src/data/english/{args.slug}.ts"
    if not (repo / file_path).exists():
        print(json.dumps({"error": f"article file not found at {file_path}"}))
        sys.exit(1)

    found = False
    for topic in db.get("topics", []):
        if topic["id"] != args.topic_id:
            continue
        found = True
        articles = topic.setdefault("articles", [])
        # Skip if already recorded
        if any(a.get("cefr") == args.cefr for a in articles):
            print(json.dumps({"warning": f"already marked done", "topic": args.topic_id, "cefr": args.cefr}))
            sys.exit(0)
        articles.append({
            "cefr": args.cefr,
            "slug": args.slug,
            "filePath": file_path,
            "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        })
        break

    if not found:
        print(json.dumps({"error": f"topic id {args.topic_id} not found in DB"}))
        sys.exit(1)

    db_path.write_text(json.dumps(db, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"ok": True, "topicId": args.topic_id, "cefr": args.cefr, "slug": args.slug}))


if __name__ == "__main__":
    main()
