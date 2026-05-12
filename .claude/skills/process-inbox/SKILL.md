---
name: process-inbox
description: Process the unprocessed entries in the internal dashboard's submissions inbox by orchestrating a team of subagents that each spawn a headless Claude Code instance inside the Obsidian vault, so each student's submissions get archived using the vault's own skills (meeting-minutes for STT text, summarize for long content, etc.) — not just dumped as raw markdown. The vault subagents follow the vault's CLAUDE.md "two iron rules" (read SKILL.md before invoking, and write all required files: 学生档案 / 沟通记录 / 日报 / 任务看板). After all per-student writes are done, a reviewer subagent spot-checks the changes; only then does the main coordinator mark submissions processed in Supabase. Use whenever the user says "process inbox", "处理 inbox", "处理 submissions", "归档 submissions", "处理一下提交", or asks to clear out the internal dashboard's submission queue. Also use when the user references a specific submission id they want archived. Don't undertrigger — if the user vaguely says they want to clean up submissions, employee uploads, or the inbox, this is the right skill. **Note**: a SEPARATE headless auto-archiver runs every 120s via launchd (`com.sdg.inbox-auto`, trigger `scripts/process-inbox-auto.sh`) for self-student happy-path submissions. That auto-archiver does NOT load this skill — it has its own restricted code path. Manual `/process-inbox` (this skill) is still the right tool for: cross-advisor submissions, new clients, oversized content, or whenever vault-skill intelligence (meeting-minutes / summarize) is wanted. See "## Auto-mode" section for the boundary between the two.
---

# Process Inbox skill

## What this skill does

The internal dashboard at `/internal/submissions` collects entries from employees: 沟通记录 / 重要 comment / 状态更新 / 会议 / 其他, plus optional file attachments (PDF, Word, image). Each unprocessed entry needs to be archived into Shijie's Obsidian vault with **the vault's own intelligence** — STT transcripts go through `meeting-minutes`, long content gets summarized, etc. The vault has rich skills for this; this skill orchestrates them.

The hard part: the vault's skills (`_agents/skills/meeting-minutes/`, `summarize/`, `onboarding/`, `planning-roadmap/`, `lor_writer/`, etc.) and the vault's `CLAUDE.md` (with the "two iron rules" and trigger table) only load when Claude Code starts inside the vault directory. So this skill spawns headless `claude -p` instances inside the vault, one per student.

## ⚠️ Reality (2026-04-04 onwards): vault `claude -p` is OAuth-banned

**The subagent → vault `claude -p` path described below is currently BROKEN** due to Anthropic's 2026-04-04 OpenClaw ban (see memory `headless_claude_oauth_broken.md`). Headless `claude -p` spawned from launchd / stripped-env contexts returns `403 Request not allowed`.

**Two paths still work**:

1. **`claude -p` from THIS Desktop session's Bash tool** — inherits `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST=1` etc. from the running Claude Desktop process, which makes the backend treat it as first-party. So the orchestration design (per-student subagents → vault claude) **does still work IF the user types `/process-inbox` and you actually invoke the skill**. The skill's normal flow below applies.

2. **Inline handling (no subagent, no vault `claude -p`)** — when the user asks informally ("看一下 submission" / "处理一下") and you handle it directly in the current Desktop session without invoking the skill via `/process-inbox`. **This is the fallback that gets used most often in practice.** When you go this route, **you MUST manually do all 4 vault writes per the vault's iron rule二**, because there is no vault claude to enforce them.

### Inline fallback checklist — 4 NON-NEGOTIABLE vault writes per submission

When archiving a submission inline (without spawning a subagent), every submission MUST result in updates to ALL FOUR files:

1. **`01_Student/<student_name>/沟通记录/{YYYY-MM-DD} {type} - {summary前30字}.md`** — the archive note itself (full content + YAML frontmatter)
2. **`01_Student/<student_name>/<student_name>.md`** — update `最后沟通时间` YAML field to the 沟通 date (use date IN the content for historical backfills; submission date for current)
3. **`02_Project Manager/日报-{mid_advisor}.md`** — **insert AT TOP** (just after the `# 日报-<advisor>` heading), reverse-chronological. Each entry ≤4 bullets, with `→ [[沟通记录文件名]]` link at end. Multi-advisor students (`mid_advisors = [A, B]`) → write to BOTH advisors' 日报. If 日报-{advisor}.md doesn't exist, create it with `# 日报-{advisor}` as first line.
4. **`02_Project Manager/待办任务看板.md`** — if the submission contains actionable TODOs, add them under the date section. Use the existing format: `- [ ] **[[学生]]** — context → [[沟通记录链接]]` with nested `[ ] 学生侧 / 顾问侧` items. **Also update the "📆 看板最后更新" line at top to today's date.**

**Most common gap (per 2026-05-12 user feedback)**: files 1 and 2 done, files 3 and 4 forgotten. The user noticed because submissions weren't surfacing in 日报-袁辰飞. Don't repeat this — checklist all 4 before marking processed.

### When to use which path

- User types `/process-inbox` explicitly → run the skill via subagents (Step 1-9 below). Subagents spawn vault claude which writes all 4 files via iron rules.
- User asks informally ("看一下 submission" / "处理 inbox" / references a specific submission id) → handle inline in THIS session. **Apply the 4-file checklist above manually.** Don't invoke the skill via subagents — too heavy for 1-3 submissions.

The "Step-by-step workflow" below describes the subagent orchestration (path 1). The inline path (path 2) is: just walk through the 4-file checklist for each submission, then run `sync-students-to-supabase.mjs` once at the end, then SQL UPDATE `processed=true`.

---

## NON-NEGOTIABLE: every submission must produce a 沟通记录 .md

**Every submission, no matter how short, MUST result in a real markdown file written to `01_Student/<student_name>/沟通记录/`.** No exceptions.

Why: downstream systems depend on this — the morning-digest skill reads `student_notes` (synced from this folder) to compose per-student attention items, and falls back to `<name>.md` body only when no recent note exists. If you skip note creation for "trivial" submissions (like a one-line status update), the digest loses signal and the student looks like they have no recent activity even though they do.

If the submission is too small to warrant the full `meeting-minutes` skill treatment (just a short comment / status flag), still create a note with a concise body — type / date / submitter / summary / content. Filename pattern: `{YYYY-MM-DD} {type} - {summary 前30字}.md`.

The vault claude must be told this explicitly in the payload — see the per-student payload template below.

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

  **铁律一：每条 submission 必须产出一个 沟通记录 .md** — 不许跳过。
  即使是一句话的 status update / 简短 comment，也要写一个 .md 文件到
  01_Student/<student_name>/沟通记录/。下游 morning-digest skill 依赖
  这些文件做学生关注清单；跳过 = 学生显得"零最近活动"，digest 失真。

  - 选合适的 skill 处理内容（依 CLAUDE.md 触发表，e.g. STT/录音文本 →
    meeting-minutes，长内容 → summarize 后归档）；如果内容太短不值得 skill
    treatment，仍然要直接写 .md（type / by / summary / content 即可），
    **不能不写**
  - 触发任何 skill 前先 Read 对应 SKILL.md（vault 铁律一）
  - 完成后必须更新（vault 铁律二，全部 4 项）：
    1. **01_Student/<student_name>/沟通记录/{YYYY-MM-DD} {type} - {summary前30字}.md**
       — 这一项 NON-NEGOTIABLE，每个 submission 都要一个 .md
    2. 01_Student/<student_name>/<student_name>.md — 更新 `最后沟通时间`
       + 在 `## 沟通与纪要汇总` 下追加 `[[文件名]]` 双向链接 + 一行精华
       （e.g. `2026-04-27 沟通：定 USABO 排课 + 上海 wet lab 联系`）
    3. 02_Project Manager/日报-<mid_advisor>.md — 顶部插入条目，
       ≤4 行/条目。如该顾问日报不存在则新建，第一行 `# 日报-<mid_advisor>`。
       **如果学生 mid_advisor 是多选 (e.g. 刘昱彤 = [王世杰, 陆梦婕])，把同一条
       日报写到 EACH 顾问的 日报-X.md 文件里**（共管学生，两位顾问都需要看到）。
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

---

## Auto-mode (headless launchd job — runs OUTSIDE this skill)

There is a **separate** auto-archiver that polls the inbox queue every 120s
via launchd. **The auto-archiver does NOT load this skill.** It runs an
entirely separate code path with paranoid security restrictions.

This section is documentation only — for runtime behavior, see the trigger
script source.

### Auto-archiver location
- Trigger script: `scripts/process-inbox-auto.sh`
- LaunchAgent plist: `~/Library/LaunchAgents/com.sdg.inbox-auto.plist`
- Pause flag: `touch ~/Code/sdg-html/.inbox-auto-paused`
- Status: `bash scripts/inbox-auto-status.sh`
- Live log: `tail -f ~/Library/Logs/sdg-inbox-auto.log`

### Why a separate code path

This skill (`/process-inbox` manual) uses `claude -p --dangerously-skip-permissions`
to invoke vault skills with full tool access. That's **safe for human-driven
runs** (Shijie has just typed `/process-inbox`, knows context, can interrupt) but
**unsafe for unattended automation** — a malicious submission could prompt-inject
a vault claude into running `rm -rf` or curling the .env to attacker.com.

Auto mode therefore:
- Runs claude with **`--tools "Read,Edit,Write"` only** (no Bash, no MCP, no
  WebFetch, no Skill tool)
- Runs claude with **`--strict-mcp-config`** + no `--mcp-config` flag → zero
  MCP servers loaded
- Restricts file access to **vault root only** (`--add-dir VAULT_ROOT`, cwd at
  neutral `/tmp/sdg-auto-cwd` so no `CLAUDE.md` auto-discovery)
- Runs claude with **a custom paranoid system prompt** that flags submission
  content as untrusted external data (prompt-injection-aware)
- Trigger script (NOT claude) handles all Supabase IO via curl REST API
- Trigger script (NOT claude) downloads attachments and `mv`s to vault path;
  claude only edits text files
- SQL `UPDATE processed=true` happens in the trigger script AFTER claude reports
  ok via JSON output line

Worst-case prompt injection in auto mode: vandalize vault files (revertible
via `git -C VAULT reset --hard`). Cannot exfil `.env`, cannot push to git,
cannot send emails, cannot publish Sanity, cannot run shell commands.

### Self-student vs cross-advisor classification

For each submission with `student_id IS NOT NULL`:

- if `submissions.submitted_by ∈ students.mid_advisors[]` → **self_student**
  (happy path: archive + mark `processed=true`)
- else → **cross_advisor** (archive vault, **leave `processed=false`** for
  Shijie to manually review via /process-inbox)
- if `student_id IS NULL` → **new_client** (skip entirely, leave for manual)

Multi-advisor (e.g. 田子辰 = `[王世杰, 徐祖韵]`): either advisor submitting
counts as self-student.

### Cost / model

Trigger uses Opus (`--model opus`). Per-submission token estimate ~16K
(13K input + 3K output) ≈ $0.40 at Opus 4.7 pricing. 5 submissions/day ≈
$60/month ≈ ~3% of Max 20× plan equivalent. To downgrade for cost, edit
`MODEL=` in `scripts/process-inbox-auto.sh`.

### When manual /process-inbox is still needed

- Cross-advisor submissions (auto leaves `processed=false`)
- New clients (`student_id IS NULL`)
- Oversized content (auto skips submissions where `len(content) > 20000`)
- Anything where you want vault-skill intelligence (meeting-minutes for STT,
  summarize for long content) — auto only does verbatim-style archive

So manual `/process-inbox` and auto coexist. Auto handles the high-volume
happy path silently; manual handles the cases auto won't touch.

### When this skill (manual `/process-inbox`) gets used

User invokes `/process-inbox` interactively. Then this skill's normal flow
applies (sections above), with full `--dangerously-skip-permissions` access
for the vault subagents — same as before. Auto-mode does not change manual
behavior.
