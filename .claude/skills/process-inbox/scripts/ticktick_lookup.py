#!/usr/bin/env python3
"""ticktick_lookup.py — list a day's TickTick appointments (completed + undone).

Used by process-inbox to attribute a 录音 (auto-transcribed Voice Memo) to a
student: the recording filename embeds a timestamp (e.g. "20260613 132911"),
and the appointment covering that time is the student.

Queries the TickTick MCP (https://mcp.dida365.com) for BOTH completed and
undone tasks on the date. This matters because Shijie marks meetings 完成 after
they happen — completed tasks drop out of the published-ICS calendar feed (and
the feed is only a ±18-day rolling window), so the old ICS approach silently
missed exactly the meetings we most need to attribute. The MCP has no such blind
spot.

Usage:
    python .claude/skills/process-inbox/scripts/ticktick_lookup.py [YYYY-MM-DD]
    (default date: today)

Reads the bearer token from TICKTICK_API_TOKEN (env var, or the `.env` at the
repo root). NEVER hardcode it — this repo is public. Create the token at
TickTick → 设置 → 账户与安全 → API 口令.
"""
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timedelta, date
from pathlib import Path

MCP_URL = "https://mcp.dida365.com"


def load_token():
    if os.environ.get("TICKTICK_API_TOKEN"):
        return os.environ["TICKTICK_API_TOKEN"].strip()
    for env in (Path(__file__).resolve().parents[4] / ".env",
                Path.home() / "Code" / "sdg-html" / ".env"):
        if env.exists():
            for line in env.read_text().splitlines():
                if line.strip().startswith("TICKTICK_API_TOKEN="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None


def mcp_call(token, name, arguments):
    """Call a TickTick MCP tool; return a flat list of task dicts."""
    body = json.dumps({
        "jsonrpc": "2.0", "id": 1, "method": "tools/call",
        "params": {"name": name, "arguments": arguments},
    }).encode("utf-8")
    req = urllib.request.Request(MCP_URL, data=body, method="POST", headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    })
    with urllib.request.urlopen(req, timeout=25) as r:
        payload = json.loads(r.read().decode("utf-8", "ignore"))
    if "error" in payload:
        raise RuntimeError(payload["error"])
    tasks = []
    for c in payload.get("result", {}).get("content", []):
        try:
            obj = json.loads(c.get("text", ""))
        except Exception:
            continue
        tasks.extend(obj if isinstance(obj, list) else [obj])
    return tasks


def to_beijing(iso):
    """Parse a TickTick ISO datetime (any offset) → (date, 'HH:MM') in Beijing (+8)."""
    m = re.match(r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.\d+)?([+-]\d{2}:?\d{2}|Z)?", iso.strip())
    if not m:
        return None, None
    base = datetime.strptime(m.group(1), "%Y-%m-%dT%H:%M:%S")
    off = m.group(2) or "+0000"
    if off == "Z":
        off_min = 0
    else:
        off = off.replace(":", "")
        off_min = (1 if off[0] == "+" else -1) * (int(off[1:3]) * 60 + int(off[3:5]))
    bj = base - timedelta(minutes=off_min) + timedelta(hours=8)
    return bj.date(), bj.strftime("%H:%M")


def main():
    target = date.today()
    if len(sys.argv) > 1:
        try:
            target = datetime.strptime(sys.argv[1], "%Y-%m-%d").date()
        except ValueError:
            print(f"ERROR: bad date '{sys.argv[1]}', expected YYYY-MM-DD", file=sys.stderr)
            sys.exit(1)

    token = load_token()
    if not token:
        print("ERROR: TICKTICK_API_TOKEN not set (add to .env or export it).", file=sys.stderr)
        sys.exit(1)

    start = f"{target.isoformat()}T00:00:00+0800"
    end = f"{target.isoformat()}T23:59:59+0800"
    search = {"search": {"startDate": start, "endDate": end}}

    rows = []
    for tool, mark in (("list_completed_tasks_by_date", "✓已完成"),
                       ("list_undone_tasks_by_date", "○未完成")):
        try:
            for t in mcp_call(token, tool, search):
                iso = t.get("startDate") or t.get("dueDate")
                if not iso:
                    continue
                d, hm = to_beijing(iso)
                if d == target:
                    rows.append((hm, t.get("title", "?"), mark))
        except Exception as e:
            print(f"  (warn: {tool} 调用失败: {e})", file=sys.stderr)

    print(f"=== TickTick 日程 {target}（北京时间，含已完成）===")
    for hm, title, mark in sorted(rows):
        print(f"  [{hm}] {title}  {mark}")
    if not rows:
        print("  (无预约)")


if __name__ == "__main__":
    main()
