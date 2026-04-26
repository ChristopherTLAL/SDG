---
name: process-inbox
description: Process the unprocessed entries in the internal dashboard's submissions inbox — fetch each via Supabase MCP, write a properly-formatted Obsidian markdown note to the student's 沟通记录 folder, download any attachments to 个性化材料, and mark the submission processed in the DB. Use whenever the user says "process inbox", "处理 inbox", "处理 submissions", "归档 submissions", "处理一下提交", or asks to clear out the internal dashboard's submission queue. Also use when the user references a specific submission id they want archived. Don't undertrigger — if the user vaguely says they want to clean up submissions, employee uploads, or the inbox, this is the right skill.
---

# Process Inbox skill

## What this skill does

The internal dashboard at `/internal/submissions` collects entries from employees: 沟通记录 / 重要 comment / 状态更新 / 会议 / 其他, plus optional file attachments. Each unprocessed entry needs to be archived into Shijie's Obsidian vault as a properly-formatted markdown note, with any attachments saved to the right folder. Then the submission gets marked `processed = true` in the database so it disappears from the inbox.

This skill automates the full read → write → mark-processed loop. The user only needs to step in for new clients (submissions where `student_id` is null because the student doesn't have a vault folder yet).

## Critical context — read this every time

The Obsidian vault is mounted at:

```
/Users/shijie/Library/CloudStorage/OneDrive-Personal/Obsidian/规划看板
```

Inside that vault:
- `01_Student/<student_name>/<student_name>.md` — main per-student file (YAML + body)
- `01_Student/<student_name>/沟通记录/*.md` — communication notes (your write target)
- `01_Student/<student_name>/个性化材料/*` — attachments (your other write target)

**Do not invent a different folder structure.** Always use the exact `students.name` value from Supabase as the folder name (e.g. `刘昱彤`, `Kimi+Byran`, `何海川`). Do not transliterate, normalize, or change spacing — Obsidian wikilinks depend on exact filenames.

The Supabase project ref is `sdcubejyamnghhhxzvco`. Service role key + URL live in `~/Code/sdg-html/.env`. The Supabase MCP (`mcp__supabase__*` tools) is configured in `~/Code/sdg-html/.mcp.json` — only available when Claude Code is launched from `~/Code/sdg-html`.

## When this skill runs into problems

- **Supabase MCP not available** → check that the working directory is `~/Code/sdg-html`. The MCP is project-scoped.
- **`.env` values missing** → the `~/Code/sdg-html/.env` file should have `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. If absent, ask the user.
- **Vault path doesn't exist** → the user may have moved their Obsidian vault. Ask before assuming a new location.

## Step-by-step workflow

### Step 1: Pull the unprocessed queue

Use `mcp__supabase__execute_sql`:

```sql
select
  s.id, s.type, s.submitted_at, s.submitted_by, s.summary, s.content,
  s.attachment_url, s.audio_url, s.ai_transcript, s.ai_summary,
  s.student_id, s.student_name_raw,
  st.name as student_name, st.mid_advisor, st.stage
from submissions s
left join students st on st.id = s.student_id
where s.processed = false
order by s.submitted_at asc;
```

Print a one-line summary first so the user can confirm scope:

```
Found 3 unprocessed submissions:
  #5  刘昱彤 (沟通记录)        — 家长问雅思首考时间
  #6  新客「李某某」(状态更新)  — 待建档
  #7  何海川 (会议)            — 周一线下面谈
```

If there's nothing to process, say so and stop.

### Step 2: Decide each submission's fate

Iterate one at a time. For each:

#### Case A — Linked student (`student_id` is not null)

Proceed to step 3 directly.

#### Case B — New client (`student_id` is null, only `student_name_raw`)

The vault has no folder for this person. **Stop and ask:**

> Submission #{id} 是新客「{student_name_raw}」，vault 里还没有 folder。要建档吗？要的话告诉我学生姓名（最终 folder 名）；不要的话我就跳过这条。

Wait for the user's reply. Do NOT auto-create a folder. If skipped, leave the submission as `processed = false` (not archived) and continue to the next. If the user wants to build a profile, they'll do it themselves in Obsidian — the skill doesn't write to `01_Student/` outside of `沟通记录` and `个性化材料`.

### Step 3: Build the markdown body

Use this template. Skip sections whose source field is empty:

```markdown
---
type: {type}
submitted_at: {submitted_at, in YYYY-MM-DD HH:mm format}
submitted_by: {submitted_by}
student: {student_name}
mid_advisor: {mid_advisor}
stage: {stage}
---

# {type} · {student_name} · {YYYY-MM-DD}

## 摘要
{summary}

## 详细内容
{content}

## AI 转写
{ai_transcript}

## AI 摘要
{ai_summary}
```

Notes:
- Don't add a backlink to the original submission. The user wants the markdown clean.
- If `summary` is empty, still write the H1 header with type + student + date.
- If `content` is empty (e.g. attachment-only submission), the section just gets skipped.

### Step 4: Construct the filename

Format:

```
{YYYY-MM-DD} {type} - {summary truncated to first 30 chars, newlines stripped}.md
```

Fallbacks:
1. If `summary` is empty → use first 30 chars of `content`.
2. If both empty → use `submission #{id}` as the trailer.

Sanitize: replace `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|` with `-`. Trim trailing whitespace.

Example: `2026-04-26 沟通记录 - 家长问雅思首考时间.md`

If a file with the exact same name already exists in `沟通记录/`, append `(2)`, `(3)`, etc. Don't overwrite.

### Step 5: Download attachments (if any)

If `attachment_url` or `audio_url` is set, download to:

```
<vault>/01_Student/<student_name>/个性化材料/
```

The bucket-relative path is in `attachment_url` (e.g. `attachment/1745493123-x7k2.pdf`). The original filename was lost during upload — only the extension is preserved. So derive a meaningful name:

```
{YYYY-MM-DD} {summary trimmed to 20 chars}.{ext}
```

If `summary` is empty, use `{YYYY-MM-DD} submission-{id}.{ext}`.

Download with `curl` using the service role key:

```bash
# Read the .env values
SUPABASE_URL=$(grep '^SUPABASE_URL=' ~/Code/sdg-html/.env | cut -d= -f2)
SUPABASE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' ~/Code/sdg-html/.env | cut -d= -f2)

# Then for each attachment:
curl -fsSL -o "<dest path>" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  "${SUPABASE_URL}/storage/v1/object/submissions/${attachment_url}"
```

If the file already exists at the destination, append a numeric suffix the same way as for the .md file.

### Step 6: Write the markdown

Write the file with the Write tool to:

```
/Users/shijie/Library/CloudStorage/OneDrive-Personal/Obsidian/规划看板/01_Student/<student_name>/沟通记录/<filename>.md
```

If the `沟通记录/` folder doesn't exist, create it (`mkdir -p`).

### Step 7: Mark processed

Use `mcp__supabase__execute_sql` with the relative path stored:

```sql
update submissions
set processed = true,
    processed_at = now(),
    processed_path = '01_Student/<student_name>/沟通记录/<filename>.md'
where id = {id};
```

The `processed_path` column gives Shijie a back-reference if she ever needs to find where a submission ended up.

### Step 8: Summarize

After all submissions are handled, print:

```
✅ Processed 2 submissions
  #5 → 01_Student/刘昱彤/沟通记录/2026-04-26 沟通记录 - 家长问雅思首考时间.md
  #7 → 01_Student/何海川/沟通记录/2026-04-26 会议 - 周一线下面谈.md (+ 1 attachment)

⏭  Skipped 1 (waiting on user decision)
  #6 新客「李某某」— user said skip
```

Tell the user where to find the files and that the inbox is now clean. Suggest they pull the vault if it's git-synced.

## Edge cases worth handling proactively

- **Multiple attachments under one submission**: each gets its own derived filename. Use a `-1`, `-2` suffix to disambiguate within the same submission if needed.
- **`student_name` contains characters that look like path separators**: shouldn't happen given the existing 90 students, but if you encounter `/` or `\` in a student name, sanitize the same way as filenames.
- **Network failure mid-processing**: if a download fails, do NOT mark the submission as processed. Report the failure and continue to the next. The user can re-run later to retry.
- **30-min sync race**: the cron sync runs `npm run sync-students` every 30 minutes. If the skill writes a new `.md` under `沟通记录/`, the next sync picks it up and the new note shows on the student detail page. No special handling needed.

## What this skill explicitly does NOT do

- Doesn't create new student folders (Case B is always asked, never auto)
- Doesn't write back to `<student>.md` (the main file) — that's Shijie's prerogative
- Doesn't send notifications, emails, or anything user-facing beyond the terminal summary
- Doesn't delete the original Supabase Storage attachments after download (they stay as backup; cheap)
- Doesn't track an "audit log" — `submissions.processed_path` is the only trail
