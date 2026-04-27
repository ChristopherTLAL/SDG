#!/usr/bin/env python3
"""
Send an email via the local n8n webhook (workflow id sE75CAEJo0Uc3vxgCMRs8).

Usage:
  Read a JSON payload from stdin and POST it to http://localhost:5678/webhook/send-email.
  Print the response. Exit 0 on success, non-zero on failure.

  echo '{"to":"x@y.com","subject":"hi","body":"hello"}' | python3 send.py

Payload schema (same as n8n webhook expects, with helpers added):
  {
    "to":       "recipient@example.com",      // required
    "subject":  "Subject line",                // required
    "body":     "Plain text, markdown, or HTML",  // required
    "html":     false,                         // optional, default false
    "markdown": false,                         // optional — when true, body is markdown:
                                               //   we convert to HTML server-side and
                                               //   send with html=true. Trumps `html`.
    "sender":   "xdf" | "automation",          // optional, defaults to "xdf"
    "attachments": [
      // Three input modes — use exactly one of {path, url, content}:
      {"path": "/abs/path/to/file.pdf", "filename": "optional"},
      {"url":  "https://...",            "filename": "optional",
       "headers": {"Authorization": "Bearer ..."}},          // optional auth headers
      {"content": "<base64>", "filename": "x.pdf", "mimeType": "application/pdf"}
    ]
  }

The script:
- defaults sender to "xdf" (work-default per project convention)
- pings n8n /healthz before posting; aborts with a clear error if n8n isn't running
- materializes attachments: reads files from disk, downloads URLs, base64-encodes either
- guesses mimeType from filename extension if not supplied
- prints a 1-line success summary on stdout; full error context on stderr if failed
"""

from __future__ import annotations

import base64
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.request

WEBHOOK_URL  = "http://localhost:5678/webhook/send-email"
HEALTHZ_URL  = "http://localhost:5678/healthz"
DEFAULT_SENDER = "xdf"
VALID_SENDERS  = {"xdf", "automation"}
MAX_PAYLOAD_MB = 25  # warn (not block) above this; n8n itself has limits


def die(msg: str, code: int = 1) -> None:
    print(f"send-email: {msg}", file=sys.stderr)
    sys.exit(code)


def healthcheck() -> None:
    try:
        with urllib.request.urlopen(HEALTHZ_URL, timeout=2) as r:
            if r.status != 200:
                die(f"n8n health check returned HTTP {r.status}; is the workflow active?")
    except urllib.error.URLError as e:
        die(f"n8n is not reachable at localhost:5678 ({e}). "
            "Start n8n and ensure workflow sE75CAEJo0Uc3vxgCMRs8 is active.")


def materialize_attachment(att: dict) -> dict:
    """Return an attachment in the format n8n expects: {filename, content (base64), mimeType}."""
    if "content" in att:
        # Already base64; trust filename + mimeType from caller
        if "filename" not in att:
            die("attachment with raw 'content' must also specify 'filename'")
        return {
            "filename": att["filename"],
            "content":  att["content"],
            "mimeType": att.get("mimeType") or mimetypes.guess_type(att["filename"])[0] or "application/octet-stream",
        }

    if "path" in att:
        path = os.path.expanduser(att["path"])
        if not os.path.isfile(path):
            die(f"attachment path not found: {path}")
        with open(path, "rb") as f:
            content = base64.b64encode(f.read()).decode()
        filename = att.get("filename") or os.path.basename(path)
        return {
            "filename": filename,
            "content":  content,
            "mimeType": att.get("mimeType") or mimetypes.guess_type(filename)[0] or "application/octet-stream",
        }

    if "url" in att:
        req = urllib.request.Request(att["url"], headers=att.get("headers", {}))
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                raw = r.read()
        except urllib.error.URLError as e:
            die(f"failed to download attachment from {att['url']}: {e}")
        filename = att.get("filename") or att["url"].rsplit("/", 1)[-1] or "attachment.bin"
        return {
            "filename": filename,
            "content":  base64.b64encode(raw).decode(),
            "mimeType": att.get("mimeType") or mimetypes.guess_type(filename)[0] or "application/octet-stream",
        }

    die(f"attachment has none of {{path, url, content}}: {att}")


def md_to_html(md: str) -> str:
    """Convert markdown to a self-styled HTML email body.

    Uses the `markdown` library with extras for tables and fenced code, then
    wraps in a minimal inline-styled <html> shell so it renders consistently
    across Gmail / Outlook / corporate clients (most strip <style> tags).
    """
    try:
        import markdown  # python-markdown
    except ImportError:
        die("markdown=true requested but Python `markdown` package is not installed. "
            "Run: pip3 install markdown")

    inner = markdown.markdown(md, extensions=["tables", "fenced_code", "sane_lists"])

    # Inline-style wrapper. Most email clients strip <style>, so use inline styles.
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;font-size:14px;line-height:1.65;color:#0f172a;max-width:720px;margin:0 auto;padding:24px;">
<style>
  h1 {{ font-size: 22px; font-weight: 800; letter-spacing: -0.01em; margin: 0 0 16px; padding-bottom: 12px; border-bottom: 2px solid #042f24; color: #042f24; }}
  h2 {{ font-size: 16px; font-weight: 700; margin: 28px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; color: #0f172a; }}
  h3 {{ font-size: 14px; font-weight: 700; margin: 18px 0 6px; color: #0f172a; }}
  p {{ margin: 0 0 12px; }}
  ul, ol {{ padding-left: 22px; margin: 0 0 12px; }}
  li {{ margin: 3px 0; }}
  table {{ border-collapse: collapse; margin: 0 0 16px; font-size: 13px; }}
  th, td {{ border: 1px solid #e5e7eb; padding: 6px 10px; text-align: left; }}
  th {{ background: #f8fafc; font-weight: 700; }}
  code {{ background: #f1f5f9; padding: 1px 6px; border-radius: 4px; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.9em; }}
  a {{ color: #042f24; text-decoration: underline; text-decoration-color: rgba(4,47,36,0.3); }}
  hr {{ border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0; }}
  strong {{ font-weight: 700; }}
</style>
{inner}
</body></html>"""


def build_payload(spec: dict) -> dict:
    # Required fields
    for k in ("to", "subject", "body"):
        if k not in spec or not spec[k]:
            die(f"missing required field: {k}")

    sender = spec.get("sender") or DEFAULT_SENDER
    if sender not in VALID_SENDERS:
        die(f"invalid sender {sender!r}; valid: {sorted(VALID_SENDERS)}")

    body = spec["body"]
    is_html = bool(spec.get("html", False))
    if spec.get("markdown"):
        body = md_to_html(body)
        is_html = True  # markdown trumps html flag — we just emitted HTML

    payload: dict = {
        "to":      spec["to"],
        "subject": spec["subject"],
        "body":    body,
        "sender":  sender,
        "html":    is_html,
    }

    if spec.get("attachments"):
        payload["attachments"] = [materialize_attachment(a) for a in spec["attachments"]]

    return payload


def post(payload: dict) -> dict:
    body = json.dumps(payload).encode("utf-8")
    size_mb = len(body) / (1024 * 1024)
    if size_mb > MAX_PAYLOAD_MB:
        print(f"send-email: warning — payload is {size_mb:.1f} MB (n8n may reject)", file=sys.stderr)

    req = urllib.request.Request(
        WEBHOOK_URL,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            resp = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        die(f"webhook returned HTTP {e.code}: {e.read().decode(errors='replace')}")
    except urllib.error.URLError as e:
        die(f"webhook POST failed: {e}")

    if not resp.get("success"):
        die(f"webhook returned non-success: {resp}")

    return resp


def main() -> None:
    raw = sys.stdin.read()
    if not raw.strip():
        die("no JSON payload on stdin", code=2)
    try:
        spec = json.loads(raw)
    except json.JSONDecodeError as e:
        die(f"invalid JSON on stdin: {e}", code=2)

    healthcheck()
    payload = build_payload(spec)
    resp = post(payload)

    print(f"OK · sender={payload['sender']} · to={payload['to']} · "
          f"messageId={resp.get('messageId', '?')} · threadId={resp.get('threadId', '?')}")


if __name__ == "__main__":
    main()
