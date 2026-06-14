#!/usr/bin/env python3
"""ticktick.py — TickTick MCP CLI helper (read + write) for the consulting workflow.

Talks to the TickTick MCP (https://mcp.dida365.com) via JSON-RPC. Bearer token
from TICKTICK_API_TOKEN (env or repo-root .env) — NEVER hardcode (repo is public).

Subcommands:
  lookup  <YYYY-MM-DD>                       list a day's appointments (completed+undone)
  add     --title T --due ISO|YYYY-MM-DD [--project NAME] [--content C] [--time HH:MM] [--all-day]
  find    --date YYYY-MM-DD [--contains TEXT] [--project NAME]   find appts (id/projectId/status)
  complete --project-id PID --task-id TID
  delete   --project-id PID --task-id TID
  checklist-add "给 X 发 Y" [--date YYYY-MM-DD]   append an item to today's 📋下班前清单 (CHECKLIST task)

Used by:  process-inbox (录音 归属 + 归档闭环),  meeting-minutes (Action Items → 任务).
Default project for new tasks: 中期带案25fall (student work).
"""
import argparse
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timedelta, date
from pathlib import Path

MCP_URL = "https://mcp.dida365.com"
DEFAULT_PROJECT = "中期带案25fall"   # 🌏中期带案25fall — student appointments / follow-ups
TZ = "Asia/Shanghai"
CHECKLIST_PREFIX = "📋下班前清单"

_PROJECT_CACHE = None


def load_token():
    if os.environ.get("TICKTICK_API_TOKEN"):
        return os.environ["TICKTICK_API_TOKEN"].strip()
    for env in (Path(__file__).resolve().parents[4] / ".env",
                Path.home() / "Code" / "sdg-html" / ".env"):
        if env.exists():
            for line in env.read_text().splitlines():
                if line.strip().startswith("TICKTICK_API_TOKEN="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("ERROR: TICKTICK_API_TOKEN not set (.env or env).")


def mcp(name, arguments):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/call",
                       "params": {"name": name, "arguments": arguments}}).encode()
    req = urllib.request.Request(MCP_URL, data=body, method="POST", headers={
        "Authorization": f"Bearer {load_token()}",
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream"})
    payload = json.loads(urllib.request.urlopen(req, timeout=25).read().decode("utf-8", "ignore"))
    if "error" in payload:
        raise RuntimeError(payload["error"])
    objs = []
    for c in payload.get("result", {}).get("content", []):
        try:
            o = json.loads(c.get("text", ""))
        except Exception:
            continue
        objs.extend(o if isinstance(o, list) else [o])
    return objs


def project_id(name):
    """Resolve a project NAME → id (substring match, case-insensitive). 'inbox' → 'inbox'."""
    global _PROJECT_CACHE
    if not name or name.lower() == "inbox":
        return "inbox"
    if _PROJECT_CACHE is None:
        _PROJECT_CACHE = mcp("list_projects", {})
    for p in _PROJECT_CACHE:
        if isinstance(p, dict) and name in (p.get("name") or ""):
            return p.get("id")
    sys.exit(f"ERROR: project '{name}' not found.")


def beijing(iso):
    m = re.match(r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.\d+)?([+-]\d{2}:?\d{2}|Z)?", (iso or "").strip())
    if not m:
        return None, None
    base = datetime.strptime(m.group(1), "%Y-%m-%dT%H:%M:%S")
    off = m.group(2) or "+0000"
    off_min = 0 if off == "Z" else (1 if off[0] == "+" else -1) * (int(off.replace(':', '')[1:3]) * 60 + int(off.replace(':', '')[3:5]))
    bj = base - timedelta(minutes=off_min) + timedelta(hours=8)
    return bj.date(), bj.strftime("%H:%M")


def iso_due(due, time="09:00", all_day=False):
    """Normalize a --due into a TickTick ISO datetime (+0800)."""
    if "T" in due:                       # already ISO-ish
        return due if due.endswith(("0", "Z")) or "+" in due else due + "+0800"
    if all_day:
        return f"{due}T00:00:00+0800"
    return f"{due}T{time}:00+0800"


# ── subcommands ───────────────────────────────────────────────────────────

def cmd_lookup(a):
    target = datetime.strptime(a.date, "%Y-%m-%d").date() if a.date else date.today()
    start, end = f"{target}T00:00:00+0800", f"{target}T23:59:59+0800"
    rows = []
    for tool, mark in (("list_completed_tasks_by_date", "✓已完成"), ("list_undone_tasks_by_date", "○未完成")):
        for t in mcp(tool, {"search": {"startDate": start, "endDate": end}}):
            d, hm = beijing(t.get("startDate") or t.get("dueDate"))
            if d == target:
                rows.append((hm, t.get("title", "?"), mark))
    print(f"=== TickTick 日程 {target}（北京时间，含已完成）===")
    for hm, title, mark in sorted(rows):
        print(f"  [{hm}] {title}  {mark}")
    if not rows:
        print("  (无预约)")


def cmd_add(a):
    task = {"title": a.title, "projectId": project_id(a.project),
            "timeZone": TZ, "isAllDay": bool(a.all_day)}
    if a.due:
        task["startDate"] = iso_due(a.due, a.time, a.all_day)
    if a.content:
        task["content"] = a.content
    res = mcp("create_task", {"task": task})
    t = res[0] if res else {}
    print(f"✓ 建任务: {a.title}  (id={t.get('id','?')} project={t.get('projectId','?')})")


def cmd_find(a):
    target = datetime.strptime(a.date, "%Y-%m-%d").date()
    start, end = f"{target}T00:00:00+0800", f"{target}T23:59:59+0800"
    for tool, st in (("list_completed_tasks_by_date", "done"), ("list_undone_tasks_by_date", "todo")):
        for t in mcp(tool, {"search": {"startDate": start, "endDate": end}}):
            d, hm = beijing(t.get("startDate") or t.get("dueDate"))
            title = t.get("title", "")
            if d == target and (not a.contains or a.contains in title):
                print(f"  [{hm}] {title}  status={st}  taskId={t.get('id')}  projectId={t.get('projectId')}")


def cmd_complete(a):
    mcp("complete_task", {"project_id": a.project_id, "task_id": a.task_id})
    print(f"✓ 已完成 task {a.task_id}")


def cmd_delete(a):
    mcp("delete_task", {"project_id": a.project_id, "task_id": a.task_id})
    print(f"✓ 已删除 task {a.task_id}")


def cmd_checklist_add(a):
    target = datetime.strptime(a.date, "%Y-%m-%d").date() if a.date else date.today()
    title = f"{CHECKLIST_PREFIX} {target}"
    pid = project_id(DEFAULT_PROJECT)
    # find today's checklist task
    existing = None
    for t in mcp("search_task", {"query": CHECKLIST_PREFIX}):
        if isinstance(t, dict) and t.get("title") == title:
            existing = t.get("id") or t.get("taskId")
            break
    item = {"title": a.item, "status": 0}
    if existing:
        full = mcp("get_task_by_id", {"task_id": existing})
        cur = (full[0].get("items") or []) if full else []
        cur.append(item)
        mcp("update_task", {"task_id": existing, "task": {"id": existing, "projectId": pid, "items": cur, "kind": "CHECKLIST"}})
        print(f"✓ 加进今天的「{title}」：{a.item}（共 {len(cur)} 项）")
    else:
        task = {"title": title, "projectId": pid, "kind": "CHECKLIST",
                "timeZone": TZ, "isAllDay": False,
                "startDate": f"{target}T17:00:00+0800", "items": [item]}
        mcp("create_task", {"task": task})
        print(f"✓ 新建「{title}」并加入：{a.item}")


def main():
    p = argparse.ArgumentParser(description="TickTick MCP CLI")
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("lookup"); s.add_argument("date", nargs="?"); s.set_defaults(fn=cmd_lookup)

    s = sub.add_parser("add")
    s.add_argument("--title", required=True); s.add_argument("--due")
    s.add_argument("--project", default=DEFAULT_PROJECT); s.add_argument("--content")
    s.add_argument("--time", default="09:00"); s.add_argument("--all-day", action="store_true")
    s.set_defaults(fn=cmd_add)

    s = sub.add_parser("find")
    s.add_argument("--date", required=True); s.add_argument("--contains"); s.add_argument("--project")
    s.set_defaults(fn=cmd_find)

    s = sub.add_parser("complete")
    s.add_argument("--project-id", dest="project_id", required=True)
    s.add_argument("--task-id", dest="task_id", required=True); s.set_defaults(fn=cmd_complete)

    s = sub.add_parser("delete")
    s.add_argument("--project-id", dest="project_id", required=True)
    s.add_argument("--task-id", dest="task_id", required=True); s.set_defaults(fn=cmd_delete)

    s = sub.add_parser("checklist-add")
    s.add_argument("item"); s.add_argument("--date"); s.set_defaults(fn=cmd_checklist_add)

    a = p.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
