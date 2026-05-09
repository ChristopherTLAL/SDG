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

    # Build topicId → newsDate (lower bound for that topic's article dates)
    news_date_by_id: dict[str, date] = {}
    for topic in db.get("topics", []):
        news = topic.get("newsDate", "")
        if not news:
            continue
        try:
            if len(news) == 7:  # YYYY-MM
                news_date_by_id[topic["id"]] = date.fromisoformat(news + "-01")
            elif len(news) == 10:
                news_date_by_id[topic["id"]] = date.fromisoformat(news)
        except ValueError:
            pass

    # Take only count requested (unless topic-id was specified, then take all matching)
    if not args.topic_id and args.count:
        pending = pending[: args.count]

    # Date assignment policy:
    # 1. Articles fill the timeline going BACKWARD from today (newest first).
    # 2. The newest existing slug acts as the floor — every new slug must be older than it.
    # 3. Each article's date must be >= its topic's newsDate (an article cannot predate its event).
    # 4. If the natural backward cursor lands before newsDate, snap forward to newsDate
    #    and keep walking back from there for subsequent topics.
    today = date.today()
    existing_dates = sorted(
        (date.fromisoformat(s) for s in used_slugs if len(s) == 10),
        reverse=True,
    )
    if existing_dates:
        # Start one day older than the oldest existing article.
        cursor = existing_dates[-1] - timedelta(days=1)
    else:
        cursor = today

    # Never go forward in time, and never overlap an existing slug.
    for p in pending:
        floor = news_date_by_id.get(p["topicId"])
        # If cursor would predate the event, raise it back up to event date.
        if floor and cursor < floor:
            cursor = floor
        # Pick the first free day at-or-before cursor.
        while cursor.isoformat() in used_slugs or cursor > today:
            if cursor > today:
                cursor -= timedelta(days=1)
                continue
            cursor -= timedelta(days=1)
            # If we walked below the floor, snap up.
            if floor and cursor < floor:
                cursor = floor
                while cursor.isoformat() in used_slugs:
                    cursor += timedelta(days=1)
                break
        p["slug"] = cursor.isoformat()
        used_slugs.add(p["slug"])
        cursor -= timedelta(days=1)

    print(json.dumps(pending, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
