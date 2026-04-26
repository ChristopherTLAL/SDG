---
name: process-inbox
description: Process the unprocessed entries in the internal dashboard's submissions inbox by orchestrating a team of subagents that each spawn a headless Claude Code instance inside the Obsidian vault, so each student's submissions get archived using the vault's own skills (meeting-minutes for STT text, summarize for long content, etc.) — not just dumped as raw markdown. The vault subagents follow the vault's CLAUDE.md "two iron rules" (read SKILL.md before invoking, and write all required files: 学生档案 / 沟通记录 / 日报 / 任务看板). After all per-student writes are done, a reviewer subagent spot-checks the changes; only then does the main coordinator mark submissions processed in Supabase. Use whenever the user says "process inbox", "处理 inbox", "处理 submissions", "归档 submissions", "处理一下提交", or asks to clear out the internal dashboard's submission queue. Also use when the user references a specific submission id they want archived. Don't undertrigger — if the user vaguely says they want to clean up submissions, employee uploads, or the inbox, this is the right skill.
---

# Process Inbox skill

## What this skill does

The internal dashboard at `/internal/submissions` collects entries from employees: 沟通记录 / 重要 comment / 状态更新 / 会议 / 其他, plus optional file attachments (PDF, Word, image). Each unprocessed entry needs to be archived into Shijie's Obsidian vault with **the vault's own intelligence** — STT transcripts go through `meeting-minutes`, long content gets summarized, etc. The vault has rich skills for this; this skill orchestrates them.

The hard part: the vault's skills (`_agents/skills/meeting-minutes/`, `summarize/`, `onboarding/`, `planning-roadmap/`, `lor_writer/`, etc.) and the vault's `CLAUDE.md` (with the "two iron rules" and trigger table) only load when Claude Code starts inside the vault directory. So this skill spawns headless `claude -p` instances inside the vault, one per student.

## Architecture (read this carefully — it's the whole point)

```
process-inbox (sdg-html context)
│
├─ TeamCreate("inbox-batch-<ts>")
│
├─ Spawn N general-purpose Agents in parallel (one per student-group):
│  Each Agent does:
│    1. Write per-student payload to /tmp/inbox-batch-<ts>/<student>-payload.md
│    2. Bash: cd <vault> && claude -p --dangerously-skip-permissions \
│             --add-dir <vault> < /tmp/.../payload.md > /tmp/.../result.txt
│       └─→ This spawns a fresh CC instance in the vault. That CC:
│           - loads the vault's CLAUDE.md (sees iron rules + trigger table)
│           - decides which vault skill to use based on submission type/content
│           - reads SKILL.md for that skill
│           - writes all required files (沟通记录, 学生档案, 日报, 任务看板)
│           - exits with a stdout report
│    3. Capture stdout as the per-student report
│    4. Report back to main: which submission ids, which files written, any errors
│
├─ Wait for all per-student Agents to complete
│
├─ Spawn one reviewer Agent (sdg-html context, doesn't need vault skills):
│    1. Read all per-student reports
│    2. Spot-check 2-3 vault files via Read tool
│    3. Verify: 学生档案 最后沟通时间 updated? 沟通记录 .md exists? 日报 has new top entry?
│    4. Report: "all clear" OR list of issues
│
└─ If reviewer all-clear:
    - SQL UPDATE submissions SET processed=true, processed_at=now(), processed_path=...
   Otherwise: surface issues to user, don't auto-mark
```

**Why this 2-layer design**: outer Agent (sdg-html) handles orchestration + Supabase comms. Inner `claude -p` (vault) handles file writes with full vault context. The two layers don't need to know each other's tools.

## Critical paths and config

- **Vault root**: `/Users/shijie/Library/CloudStorage/OneDrive-Personal/Obsidian/规划看板`
- **Vault `CLAUDE.md`**: lives at vault root; defines iron rules + skill triggers
- **Vault skills root**: `_agents/skills/` (NOT `.claude/skills/` — important, the trigger table in vault CLAUDE.md uses `_agents/skills/` paths)
- **Supabase project ref**: `sdcubejyamnghhhxzvco`
- **Env values**: `~/Code/sdg-html/.env` (read with `grep ^KEY= .env | cut -d= -f2-`)
- **claude CLI**: `/opt/homebrew/bin/claude` (installed globally via npm)

## Step-by-step workflow

### Step 1: Pull the unprocessed queue

Use `mcp__supabase__execute_sql`:

```sql
select
  s.id, s.type, s.submitted_at, s.submitted_by, s.summary, s.content,
  s.attachment_url, s.audio_url, s.ai_transcript, s.ai_summary,
  s.student_id, s.student_name_raw,
  st.name as student_name, st.mid_advisor, st.stage, st.obsidian_path
from submissions s
left join students st on st.id = s.student_id
where s.processed = false
order by s.student_id nulls last, s.submitted_at asc;
```

Group rows by `student_id` (or by `student_name_raw` when `student_id` is null).

Print a one-line summary per student-group:

```
Found 3 submissions across 2 students + 1 new client:
  刘昱彤      (student_id=11) — 1 沟通记录, 1 会议
  何海川      (student_id=8)  — 1 状态更新
  「李某某」  (new client)    — 1 沟通记录
```

If empty, say so and stop.

Ask the user to confirm before dispatching: "Process all? Reply yes/no/或者只处理 #X #Y". This guards against accidental batch processing.

### Step 2: Handle new clients first (synchronous, asks user)

For each row where `student_id IS NULL`:

> Submission #{id} 是新客「{student_name_raw}」，vault 里还没有 folder。要现在建档吗？要的话告诉我学生姓名（最终 folder 名）+ 任何关键 YAML（合同 / 中期顾问 / 入学年份等）；不要的话我跳过这条。

Wait for response. Don't dispatch a subagent for new clients — onboarding is human-judgment territory.

If skipped, leave `processed = false` and move on. If user provides info to onboard, you can spawn a special subagent that runs vault `claude -p` with the `onboarding` skill.

### Step 3: Download attachments locally

For each linked-student submission with `attachment_url` or `audio_url`, download to `/tmp/inbox-batch-<ts>/`:

```bash
TS=$(date +%s)
BATCH_DIR=/tmp/inbox-batch-$TS
mkdir -p "$BATCH_DIR"

SUPABASE_URL=$(grep '^SUPABASE_URL=' ~/Code/sdg-html/.env | cut -d= -f2-)
SUPABASE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' ~/Code/sdg-html/.env | cut -d= -f2-)

# For each attachment:
curl -fsSL -o "$BATCH_DIR/<derived-filename>.<ext>" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  "$SUPABASE_URL/storage/v1/object/submissions/<attachment_url>"
```

Use derived names like `2026-04-26-summary-snippet.pdf` since Supabase upload didn't preserve original filenames. Subagents pass the local file path to vault claude.

If a download fails, do NOT dispatch the subagent for that submission — surface the error and skip.

### Step 4: Create the team

```
TeamCreate({
  team_name: "inbox-batch-<ts>",
  description: "Process the inbox batch dispatched at <ts>"
})
```

Optional: also TaskCreate per student-group so progress is visible.

### Step 5: Dispatch per-student subagents IN PARALLEL

For each linked-student group, spawn an Agent with team membership. **Do all spawns in a single message** (parallel tool calls) — don't wait for one to finish before starting the next.

```
Agent({
  name: "<student_name>",   // human-readable, addressable via SendMessage
  team_name: "inbox-batch-<ts>",
  subagent_type: "general-purpose",
  prompt: <see template below>,
})
```

#### Per-student subagent prompt template

```
You are the inbox-processing subagent for student "<student_name>".

YOUR JOB
Run a fresh Claude Code instance inside the Obsidian vault to archive this
student's submissions, then report back what was written. You do NOT touch
Supabase — the main coordinator handles that.

VAULT PATH: /Users/shijie/Library/CloudStorage/OneDrive-Personal/Obsidian/规划看板
PAYLOAD FILE: /tmp/inbox-batch-<ts>/<student_name>-payload.md
RESULT FILE:  /tmp/inbox-batch-<ts>/<student_name>-result.txt

STEP 1 — Write the payload file
Use Write to put this content at <PAYLOAD FILE>:

  # Inbox 批量处理 — <student_name>

  你正在 vault 里运行（CLAUDE.md 已加载），需要把下面的 submission 按 vault
  的规矩归档。要点：
  - 选合适的 skill（依 CLAUDE.md 的触发表，e.g. STT/录音文本 → meeting-minutes，
    长内容 → summarize 后再归档，短沟通 → 直接归档为 沟通记录）
  - 触发任何 skill 前先 Read 对应 SKILL.md（铁律一）
  - 完成后必须更新（铁律二）：
    1. 01_Student/<student_name>/沟通记录/ — 写新的 .md
    2. 01_Student/<student_name>/<student_name>.md — 更新 最后沟通时间 + 加双向链接
    3. 02_Project Manager/日报-<mid_advisor>.md — 当月文件，**插入到顶部**（
       `# 日报` 标题之后），≤4 行/条目，≤15 行/天。如果该顾问的当月日报文件
       不存在，新建一个，第一行 `# 日报-<mid_advisor>-<YYYY-MM>`
    4. 02_Project Manager/待办任务看板.md — 如果有新 todo
  - 附件：从下面列的本地路径 mv 到 01_Student/<student_name>/个性化材料/，
    重命名为 `{YYYY-MM-DD} {summary前20字}.{ext}`

  ## 学生背景
  - 姓名：<student_name>
  - 中期顾问：<mid_advisor or "未分配">
  - 当前进度：<stage or "未填">
  - 档案路径：<obsidian_path>

  ## Submissions（共 N 条）

  ### Submission #<id>
  - 类型：<type>
  - 提交时间：<submitted_at>
  - 提交人：<submitted_by>
  - 摘要：<summary>
  - 详细内容：
    <content>
  - AI 转写：<ai_transcript or "(无)">
  - AI 摘要：<ai_summary or "(无)">
  - 附件本地路径：<list of /tmp/.../filename, or "(无)">

  (重复每条 submission)

  ## 完成后请输出
  一段简短的 markdown 报告：
  - 每条 submission 用了哪个 skill / 怎么处理的
  - 写了哪些文件（带绝对路径）
  - 改了哪些文件
  - 如果有跳过 / 出错，说明原因

STEP 2 — Run the vault claude
Run this Bash command (don't add any flags I haven't listed):

  cd "/Users/shijie/Library/CloudStorage/OneDrive-Personal/Obsidian/规划看板" && \
    claude -p --dangerously-skip-permissions --add-dir "$(pwd)" \
    < "/tmp/inbox-batch-<ts>/<student_name>-payload.md" \
    > "/tmp/inbox-batch-<ts>/<student_name>-result.txt" 2>&1

The vault claude will exit when done. If it errors, the result file captures
stderr. Don't retry automatically — bubble the error to the main coordinator.

STEP 3 — Report back
Read the result file and respond with:
- "submissions_processed": [list of submission ids you successfully archived]
- "files_written": [list of absolute paths created]
- "files_modified": [list of absolute paths updated]
- "skipped_or_errored": [list of {id, reason}]
- "vault_claude_output_excerpt": last ~20 lines of the result file
```

### Step 6: Wait for all subagents

Each Agent runs in parallel. Wait for all to send their final report. Tally:
- Total submissions claimed as processed (collect ids into a set `processed_ids`)
- Files written/modified (for the reviewer to spot-check)
- Errors (for surfacing to user)

### Step 7: Spawn reviewer Agent

```
Agent({
  name: "reviewer",
  team_name: "inbox-batch-<ts>",
  subagent_type: "general-purpose",
  prompt: <see template below>,
})
```

#### Reviewer prompt template

```
You are the reviewer for inbox processing batch <ts>.

CONTEXT
N per-student subagents have written to the vault. Each one's report is
included below. Your job is to spot-check the writes (NOT redo work) and
flag anything off.

VAULT PATH: /Users/shijie/Library/CloudStorage/OneDrive-Personal/Obsidian/规划看板

PER-STUDENT REPORTS:
<inject each subagent's report here>

CHECKS
1. For 2-3 random students, Read the new 沟通记录/*.md to verify it has
   meaningful structure (not just raw paste of the submission content).
2. For 1-2 random students, Read 01_Student/<name>/<name>.md and confirm
   the 最后沟通时间 YAML field reflects the new submission date.
3. Read 02_Project Manager/日报-<advisor>.md (for whichever advisors had
   submissions today) and confirm new entries appear at the TOP of the file
   (per vault rule: insert at top, not append at bottom).

OUTPUT FORMAT
Respond with EXACTLY one of:
  - APPROVED: <one-line summary of what looked good>
  - ISSUES: <bulleted list of specific problems with file:line references>

Do not modify any files yourself.
```

### Step 8: Mark processed

Only if reviewer responded `APPROVED`:

```sql
update submissions
set processed = true,
    processed_at = now(),
    processed_path = '<the .md file path relative to vault root>'
where id in (<comma-separated processed_ids>);
```

If reviewer said ISSUES, do NOT mark. Surface the issues to the user verbatim and ask how to proceed.

### Step 9: Final summary

```
✅ Processed N submissions across M students:
  #5 → 01_Student/刘昱彤/沟通记录/2026-04-26 沟通记录 - 家长问雅思首考时间.md
  #7 → 01_Student/何海川/沟通记录/2026-04-26 会议 - 周一面谈.md (+ 1 attachment)

⏭  Skipped 1:
  #6 新客「李某某」— user said skip

🔍 Reviewer: APPROVED
```

Tell the user the inbox is now clean and the 30-min sync will pick up the new vault notes for the dashboard.

## Edge cases

- **Vault `claude -p` hangs**: timeout the bash command at 5 minutes per student. If hit, report and skip.
- **Multiple submissions for same student**: the vault claude handles them all in one shot (single payload), so the iron-rule writes happen once per student per batch.
- **Multiple students linked to same advisor**: each student-subagent independently appends to the same `日报-<advisor>.md`. Race condition risk is low (one-shot writes per subagent), but if you observe duplication, serialize per-advisor in step 5.
- **Network failure on Supabase update (step 8)**: retry once, then surface — the writes already happened in vault, you just need to mark in DB.
- **Reviewer flags real issues**: do NOT auto-undo. The vault writes have already happened. Surface to user, let them either fix manually or tell you to mark anyway.

## What this skill explicitly does NOT do

- Doesn't write to vault directly — all writes go through `claude -p` in the vault so the iron rules apply
- Doesn't auto-onboard new clients — always asks
- Doesn't send notifications, emails
- Doesn't delete the original Supabase Storage attachments (cheap to keep as backup)
