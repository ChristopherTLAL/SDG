---
name: send-email
description: Send an email through Shijie's local n8n webhook (workflow id sE75CAEJo0Uc3vxgCMRs8 at localhost:5678) which routes to either his work address (xdf, default for anything work-related) or a Gmail automation address (only when explicitly requested or for system/personal pings). Supports plain text or HTML body, multiple attachment input modes (local path / HTTP URL / raw base64). Use whenever the user says "发邮件", "send email", "email this to ...", "邮件给", "回家长", "回校方", "follow-up email", "发个 follow-up", or any phrasing that implies sending email. Also use when other skills (process-inbox, future morning-digest, etc.) need to dispatch email — there's no other configured email channel in this project, so this skill is the single answer for email. Don't undertrigger.
---

# send-email

## What this skill does

Wraps the local n8n webhook so any Claude session in `~/Code/sdg-html` can send email without remembering curl flags, base64 encoding, or sender selection rules. The skill defaults sender to `xdf` (the work account) per project convention; pings n8n's healthz before posting so failures are loud and clear; handles three attachment input modes so callers don't have to base64 things themselves.

## Critical context

- **Webhook**: `POST http://localhost:5678/webhook/send-email` (no auth, n8n is local-only)
- **n8n workflow id**: `sE75CAEJo0Uc3vxgCMRs8` — must be **active**, otherwise health check fails clearly
- **Health check**: `GET http://localhost:5678/healthz` (script does this before posting)
- **Helper script**: `.claude/skills/send-email/scripts/send.py` (stdlib-only Python, no install needed)
- **Default sender**: `xdf` (work) → `wangshijie11@xdf.cn` (Shijie Christopher WANG, SMTP)
- **Other sender**: `automation` → `automation.mail985@gmail.com` (Gmail OAuth, display name fixed by Gmail). Only use when:
  - User explicitly asks ("用 gmail 发", "用 automation")
  - It's a system / smoke / personal ping (not customer-facing)

## How to use

The simplest pattern: hand a JSON spec to the helper script via stdin.

```bash
cat <<'EOF' | python3 .claude/skills/send-email/scripts/send.py
{
  "to":      "parent@example.com",
  "subject": "【苏州前途】XX 同学 4 月规划报告",
  "body":    "家长您好：\n\n附件是 XX 本月的规划报告。\n\n王世杰\n苏州前途中期规划"
}
EOF
```

The script will:
1. Health-check n8n (fail fast if not running)
2. Default `sender` to `xdf` since none was specified
3. POST to the webhook
4. Print `OK · sender=xdf · to=parent@example.com · messageId=... · threadId=...`

Exit code is 0 on success, non-zero on any failure (with stderr explaining).

## JSON spec reference

```jsonc
{
  // required
  "to":      "recipient@example.com",
  "subject": "Subject line",
  "body":    "Plain text body. Use \\n for line breaks. Or HTML if html=true.",

  // optional
  "html":    false,                    // true = render body as HTML
  "sender":  "xdf",                    // "xdf" (default, work) or "automation" (Gmail)
  "attachments": [
    // Three input modes — pick one per attachment:

    // (a) local file path — script reads + base64-encodes
    { "path": "/Users/shijie/.../report.pdf" },
    { "path": "/tmp/file.docx", "filename": "Custom Name.docx" },

    // (b) HTTP/HTTPS URL — script downloads + base64-encodes
    { "url": "https://supabase.../object/sign/...?token=..." },
    { "url": "https://internal/.../doc",
      "headers": { "Authorization": "Bearer ..." },
      "filename": "doc.pdf" },

    // (c) raw base64 — passed through; filename + mimeType required
    { "content": "JVBERi0xLjQK...", "filename": "x.pdf", "mimeType": "application/pdf" }
  ]
}
```

`mimeType` is auto-guessed from filename when omitted.

## Sender selection — the rule

**Default: `xdf`**. Almost everything in this project that touches email is work-related (parents, schools, advisors, teammates), so `xdf` is the right channel.

**Switch to `automation`** only when:
- The user explicitly says so ("用 gmail 发", "automation 发", etc.)
- It's a smoke test or system notification with no real audience
- The user has previously configured a specific use case to use `automation`

If you're unsure, just use `xdf`. It's the safer default for anything customer-facing.

## When to use HTML body

Default is plain text — good for most one-shot emails. Switch to HTML when:
- Sending a structured digest (color-coded lists, tables, urgency badges)
- Embedding inline images (rare; use attachments instead unless inline matters)
- The body is long enough that paragraph spacing matters

**Easy path: write markdown, set `"markdown": true`.** The script converts your markdown to a styled HTML email (inline CSS for h1/h2/h3, tables, lists, code, links — renders consistently across Gmail / Outlook / xdf company mail). This is the recommended approach for any email that has structure (headings, lists, tables). You don't need to write HTML by hand.

```json
{ "to": "...", "subject": "...", "body": "# Heading\n\n- item 1\n- item 2", "markdown": true }
```

**Manual HTML path**: set `"html": true` and put your own HTML in `body` (full `<html>` doc or inner-only — n8n wraps either). Use this only if `markdown: true` doesn't give you enough control.

## Examples

### Send a plain-text follow-up to a parent (most common case)

```bash
cat <<'EOF' | python3 .claude/skills/send-email/scripts/send.py
{
  "to": "parent_li@163.com",
  "subject": "【苏州前途】李同学 - 4 月规划沟通纪要",
  "body": "李老师您好：\n\n刚刚和小李通完话，附件是这次的纪要。下次沟通约在 5 月 15 日左右。\n\n如有任何问题随时联系。\n\n王世杰\n苏州前途中期规划"
}
EOF
```

### Send with an attachment from local path

```bash
cat <<'EOF' | python3 .claude/skills/send-email/scripts/send.py
{
  "to": "admissions@uni.edu",
  "subject": "[Application Update] Liu Yutong",
  "body": "Dear Admissions,\n\nPlease find attached the updated CV for Liu Yutong.\n\nBest,\nShijie WANG",
  "attachments": [{ "path": "/Users/shijie/.../Liu_Yutong_CV.pdf" }]
}
EOF
```

### Send with an attachment fetched from a Supabase signed URL

```bash
SIGNED_URL="https://sdcubejyamnghhhxzvco.supabase.co/storage/v1/object/sign/submissions/..."
cat <<EOF | python3 .claude/skills/send-email/scripts/send.py
{
  "to": "advisor@xdf.cn",
  "subject": "Submission #42 needs review",
  "body": "Attached is the file from submission #42.",
  "attachments": [{ "url": "$SIGNED_URL", "filename": "submission-42.pdf" }]
}
EOF
```

### Force the gmail sender (only when explicitly asked)

```bash
cat <<'EOF' | python3 .claude/skills/send-email/scripts/send.py
{
  "to": "automation.mail985@gmail.com",
  "subject": "[smoke test] send-email skill OK",
  "body": "If you see this, the skill works.",
  "sender": "automation"
}
EOF
```

## Error handling

The script aborts loudly (non-zero exit, message on stderr) when:
- n8n health check fails → "n8n is not reachable at localhost:5678 ..."
- A required field is missing → "missing required field: to"
- Sender is invalid → "invalid sender 'foo'; valid: ['automation', 'xdf']"
- An attachment path doesn't exist → "attachment path not found: ..."
- Attachment URL download fails → "failed to download attachment from ..."
- Webhook returns non-200 → echoes the HTTP body
- Webhook returns 200 but `success=false` → echoes the JSON

If the script succeeds but the email never arrives, check spam first (especially first time `xdf` writes to a new external domain), then check n8n's execution log at `localhost:5678` for the workflow run.

## What this skill does NOT do

- Doesn't manage scheduling — pair with launchd / cron / a /loop skill for recurring sends
- Doesn't handle multiple recipients in one call (n8n webhook accepts a single `to`); call once per recipient
- Doesn't manage threading / replies — every send is a new thread (use the same Subject if you want clients to see them grouped)
- Doesn't validate email format syntactically — n8n / SMTP will reject bad addresses
