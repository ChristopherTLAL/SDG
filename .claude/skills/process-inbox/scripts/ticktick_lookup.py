#!/usr/bin/env python3
"""ticktick_lookup.py — list TickTick appointments for a given date.

Used by process-inbox to attribute a 录音 (auto-transcribed Voice Memo) to a
student: the recording filename embeds a timestamp (e.g. "20260613 132911"),
and the appointment covering that time is the student. See SKILL.md「录音」.

Usage:
    python .claude/skills/process-inbox/scripts/ticktick_lookup.py [YYYY-MM-DD]
    (default date: today)

The private calendar feed URL is read from TICKTICK_ICS_FEED (env var, or the
`.env` at the repo root) — NEVER hardcode it here: this repo is public, and the
feed exposes student appointment names + times.
"""
import os
import re
import sys
import urllib.request
from datetime import datetime, timedelta, date
from pathlib import Path


def load_feed_url():
    """Resolve TICKTICK_ICS_FEED from env, then repo-root .env, then ~/Code/sdg-html/.env."""
    if os.environ.get("TICKTICK_ICS_FEED"):
        return os.environ["TICKTICK_ICS_FEED"].strip()
    candidates = [
        Path(__file__).resolve().parents[4] / ".env",   # repo root (…/sdg-html/.env)
        Path.home() / "Code" / "sdg-html" / ".env",
    ]
    for env in candidates:
        if env.exists():
            for line in env.read_text().splitlines():
                line = line.strip()
                if line.startswith("TICKTICK_ICS_FEED="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None


def main():
    target = date.today()
    if len(sys.argv) > 1:
        try:
            target = datetime.strptime(sys.argv[1], "%Y-%m-%d").date()
        except ValueError:
            print(f"ERROR: bad date '{sys.argv[1]}', expected YYYY-MM-DD", file=sys.stderr)
            sys.exit(1)

    url = load_feed_url()
    if not url:
        print("ERROR: TICKTICK_ICS_FEED not set (add it to .env or export it).", file=sys.stderr)
        sys.exit(1)

    try:
        data = urllib.request.urlopen(url, timeout=20).read().decode("utf-8", "ignore")
    except Exception as e:
        print(f"ERROR: failed to fetch calendar feed: {e}", file=sys.stderr)
        sys.exit(1)

    rows = []
    for ev in re.split(r"BEGIN:VEVENT", data):
        sm = re.search(r"SUMMARY:(.*)", ev)
        st = re.search(r"DTSTART.*?:(\d{8}(?:T\d{6})?Z?)", ev)
        if not (sm and st):
            continue
        raw, summary = st.group(1).strip(), sm.group(1).strip()
        try:
            if "T" in raw:
                if raw.endswith("Z"):
                    dt = datetime.strptime(raw, "%Y%m%dT%H%M%SZ") + timedelta(hours=8)
                else:
                    dt = datetime.strptime(raw[:15], "%Y%m%dT%H%M%S")
                d, t = dt.date(), dt.strftime("%H:%M")
            else:
                d, t = datetime.strptime(raw, "%Y%m%d").date(), "全天"
        except Exception:
            continue
        if d == target:
            rows.append((t, summary))

    print(f"=== TickTick 日程 {target}（北京时间）===")
    for t, s in sorted(rows):
        print(f"  [{t}] {s}")
    if not rows:
        print("  (无预约 / feed 里没有该日条目)")


if __name__ == "__main__":
    main()
