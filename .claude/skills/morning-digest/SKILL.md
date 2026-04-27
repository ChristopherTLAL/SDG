---
name: morning-digest
description: Generate and send the daily morning digest emails to mid-stage advisors — one personalized email per advisor with their own students' attention list, contact frequency, and deeper per-student context (latest comm note, last submission, current stage). Uses a subagent team — one composer subagent per advisor (parallel, isolated context windows so each one can dive deep into their own caseload) plus one reviewer subagent for QC. After composing, prints all drafts in chat for user approval, then sends via send-email skill. **DEFAULT MODE: test-all-to-me** — every send goes to wangshijie11@xdf.cn with subject prefixed `[TEST → 顾问名]` so 王世杰 sees what each advisor would receive. Only switch to production (real recipients) when 王世杰 explicitly says "正式发" / "send for real" / "go production". Use whenever the user says "morning digest", "早报", "今日关注清单", "发顾问邮件", "推一下今日学生", or asks to compose/send the daily advisor briefings. Don't undertrigger.
---

# morning-digest

## What this skill does

Composes and sends a personalized daily email to each active mid-stage advisor (currently 10 people). Each email contains:

1. **Their own** active students that need attention (≥14d 未联系)
2. Per-student rich context: latest comm note title + date, latest unprocessed submission, current stage
3. A small caseload summary (total active, % overdue)
4. (Phase 2 future) Daily/weekly enrichment images attached

The skill orchestrates a team of subagents (one per advisor) so each composer has its own isolated context window and can dive deep into that advisor's caseload without polluting the lead context. A reviewer subagent does a final QC pass.

## DEFAULT MODE: test-all-to-me

**Every email is sent to wangshijie11@xdf.cn** (王世杰), with the subject prefixed `[TEST → 顾问名]`. This lets 王世杰 see what each advisor would receive without spamming the team.

**Switch to production only when explicitly told:**
- "正式发" / "send for real" / "go production" / "发给所有人" / "now flip prod"

In production mode, each advisor's email goes to their actual `email` address from the `advisors` table.

If unsure, stay in test mode. Re-confirm in the chat before sending in prod.

## Critical context

- **Source of truth for advisor list + emails**: Supabase table `public.advisors` (synced from `<vault>/02_Project Manager/顾问/*.md`)
- **Sender**: always `xdf` (work address), via the `send-email` skill
- **Send-email skill**: `.claude/skills/send-email/SKILL.md` — use it via stdin to its Python helper, don't reinvent the HTTP call
- **Eligible advisors**: `active = true AND '中期' = ANY(roles)` — currently 10 people
- **Date for the digest**: today (Asia/Shanghai), formatted YYYY-MM-DD

## Architecture

```
/morning-digest (sdg-html main coordinator)
│
├─ 1. Query advisors table (active, 中期)
├─ 2. For each advisor, count their students (preview log)
├─ 3. TeamCreate("morning-digest-<ts>")
│
├─ 4. Spawn N composer Agents IN PARALLEL (one per advisor)
│      Each composer:
│        - receives advisor info + the list of their student IDs
│        - queries Supabase for richer per-student context (notes, submissions, stage)
│        - composes a markdown email body (see Email format section below)
│        - returns { advisor, body, subject_base }
│
├─ 5. Wait for all composers
│
├─ 6. Spawn 1 reviewer Agent
│      - reads all 10 drafts
│      - flags: format inconsistencies, missing sections, obvious errors,
│        accidental cross-advisor data leaks, blank bodies
│      - returns: APPROVED <one-line note> or ISSUES <bulleted list>
│
├─ 7. Print all 10 drafts to user as a preview (compact: subject + first 6 lines)
│      Wait for user response: "send" | "send for real" | edits | "abort"
│
├─ 8. On "send" (test-all-to-me, default):
│      For each draft, send via send-email skill:
│        to       = wangshijie11@xdf.cn
│        subject  = [TEST → <advisor_name>] <subject_base>
│        body     = <draft body>
│        sender   = xdf
│      Loop sequentially (10 calls, ~5s total)
│
├─ 8b. On "send for real" (prod):
│      For each draft, send via send-email skill:
│        to       = advisor.email
│        subject  = <subject_base>
│        body     = <draft body>
│        sender   = xdf
│
└─ 9. Final report: "Sent N emails (test-mode | prod). messageIds: ..."
```

## Step-by-step

### Step 1 — Query advisors

Use `mcp__supabase__execute_sql`:

```sql
select name, email, roles
from advisors
where active = true and '中期' = any(roles)
order by name;
```

If empty → abort, tell user "no active 中期 advisors in the table".

### Step 2 — Sketch the batch (no DB writes yet)

Print: `Found N 中期 advisors: [name × email]. Composing drafts in parallel...`

### Step 3 — TeamCreate

```
TeamCreate({
  team_name: "morning-digest-<timestamp>",
  description: "Compose per-advisor morning digest emails for <date>"
})
```

### Step 4 — Spawn composer subagents in parallel

For each advisor, spawn an Agent **in the same message** (parallel tool calls):

```
Agent({
  name: <advisor_name>,
  team_name: "morning-digest-<ts>",
  subagent_type: "general-purpose",
  prompt: <see template>,
})
```

#### Composer subagent prompt template

```
You are composing the morning digest email for advisor "<advisor_name>".

YOUR JOB
Compose a markdown email body addressed to <advisor_name> covering only THEIR
students. Do NOT send the email — just return the body and a suggested subject.
Don't reach beyond your assigned advisor's students. Today's date is <YYYY-MM-DD>.

CONTEXT YOU HAVE
- Advisor name: <advisor_name>
- Advisor email: <email>
- Advisor roles: <roles>

YOUR DATA
Use mcp__supabase__execute_sql to query. Don't assume — verify.

1. Active students assigned to you (mid_advisor):
   select id, name, stage, last_contact_at, enroll_year, major_intention
   from students
   where mid_advisor = '<advisor_name>'
     and (stage is null or stage not in ('已结案','退费','已完成'))
   order by last_contact_at asc nulls first;

2. For each student needing attention (>= 14d since last_contact_at), enrich:
   - latest student note (note_name + note_date) for context:
     select note_name, note_date, body_md
     from student_notes
     where student_id = <id>
     order by note_date desc nulls last
     limit 1;
   - any unprocessed submission for this student:
     select id, type, summary, submitted_at, submitted_by
     from submissions
     where student_id = <id> and processed = false
     order by submitted_at desc;

EMAIL FORMAT
Use the format specified in src/skills/morning-digest/SKILL.md "Email format"
section. Keep tone friendly-professional. Group by tier (⚠️ 28d+ first,
then 21–27d 红, then 14–20d 淡红).

OUTPUT
Return strictly this JSON (no extra prose):
{
  "advisor":      "<advisor_name>",
  "subject_base": "中期顾问每日关注清单 · <YYYY-MM-DD> · <advisor_name>",
  "body":         "<full markdown body>",
  "stats": {
    "total_active":      <int>,
    "needs_attention":   <int (>= 14d)>,
    "critical":          <int (>= 28d)>
  }
}
```

### Step 5 — Wait for all composers, collect drafts

### Step 6 — Reviewer subagent

```
Agent({
  name: "reviewer",
  team_name: "morning-digest-<ts>",
  subagent_type: "general-purpose",
  prompt: <see template>,
})
```

#### Reviewer prompt template

```
You are the reviewer for the morning digest batch.

DRAFTS TO REVIEW
<paste all N composer outputs here>

CHECKS
1. Each draft mentions only its own advisor's students (cross-leaks = 严重)
2. Sections present: title, attention list (or "全员都好" placeholder if zero), caseload summary
3. No empty body or placeholder text like "TODO" / "<insert>"
4. Tier ordering correct (⚠️ before red before pink)
5. Markdown is well-formed (no broken tables, dangling brackets)

OUTPUT
APPROVED <one-line summary>
or
ISSUES
- <draft N>: <specific problem>
- ...

Do not edit any drafts.
```

### Step 7 — Preview to user

Print in chat:

```
✅ Reviewer: APPROVED — all 10 drafts look clean

Drafts ready to send (test-mode default → wangshijie11@xdf.cn):

1. [TEST → 王世杰]   3 attention (1 ⚠️) — 54 active
2. [TEST → 袁辰飞]   2 attention (0 ⚠️) — 8 active
3. [TEST → 张曌璐]   1 attention (0 ⚠️) — 1 active
...
10. [TEST → 钟婷婷]  0 attention — 0 active

Reply with:
  - "send" or "go" → send all 10 to wangshijie11@xdf.cn (test mode)
  - "send for real" → send all 10 to actual recipients (prod)
  - "show full N" → print full body of draft #N
  - "abort"        → cancel
```

If reviewer flagged ISSUES, list them and ask user how to proceed; do NOT auto-send.

### Step 8 — Send

For each draft, call send-email skill via Bash:

```bash
cat <<EOF | python3 .claude/skills/send-email/scripts/send.py
{
  "to": "<recipient>",
  "subject": "<final subject>",
  "body": "<draft body>",
  "sender": "xdf"
}
EOF
```

Send sequentially. Capture each `messageId`. If any fail, report and continue.

### Step 9 — Report

Final summary:

```
✅ Sent 10 emails (test mode → wangshijie11@xdf.cn)
   1. [TEST → 王世杰]  messageId=<...>
   2. [TEST → 袁辰飞]  messageId=<...>
   ...
```

## Email format (canonical)

Each composer returns markdown like this:

```markdown
# 中期顾问每日关注清单 · 2026-04-27 · 袁辰飞

你好 袁辰飞，

以下是你今天的关注清单。共 8 个在管学生，2 人需要联系。

## 需要联系的学生

### ⚠️ 张三 — 30d 未联系 · 中期在途
- 入学年份：2028 fall · 意向：Bioinformatics
- 最近沟通 (3-28)：[[张三 规划沟通 2026-03-28]] — 雅思节奏定档 + 8 月二战 6.0+
- 待处理 inbox：1 条 (家长问选校时间)

### 🟠 李四 — 17d 未联系 · 后期在途
- 入学年份：2027 fall · 意向：CS
- 最近沟通 (4-10)：[[李四 选校确认 2026-04-10]] — IC offer 接受
- 待处理 inbox：(无)

## 你的带案概览

- 在管学生：8
- 14d+ 未联系：2 (25%)
- 28d+ ⚠️：1

——
苏州前途中期看板 · sdg.undp.ac.cn/internal
```

If 0 students need attention:

```markdown
# 中期顾问每日关注清单 · 2026-04-27 · 张曌璐

你好 张曌璐，

你的 1 个在管学生今天都在 14 天内有过接触 ✓

## 你的带案概览

- 在管学生：1
- 14d+ 未联系：0
- 28d+ ⚠️：0
```

If 0 students total (advisor has no caseload yet):

```markdown
# 中期顾问每日关注清单 · 2026-04-27 · 高幸玲

你好 高幸玲，

你目前还没有分到学生。如果有问题可以联系王世杰。

——
苏州前途中期看板 · sdg.undp.ac.cn/internal
```

(Future: this section will be populated with daily/weekly enrichment content.)

## Phase 2 (later, when you provide source)

- **每日素材附件**: separate broadcast channel — same content × 10 recipients (王世杰 + 9 advisors). Likely a different skill (`/daily-materials`) since the workflow is different (single content, no per-recipient compute).
- **Caseload comparison table**: small table at the bottom showing all advisors' counts so each one can see relative load. Optional — depends on whether 王世杰 wants peer visibility.

## Edge cases

- **Composer fails for one advisor**: skip that draft, note in the preview, continue with the rest. Don't block the batch on one advisor.
- **send-email script fails**: report the messageId failure, continue with next, end summary lists failures separately
- **Subagent times out**: spawn a follow-up that just queries that one advisor and composes; or skip with a note
- **Reviewer flags ISSUES**: surface verbatim, do NOT auto-send. User decides

## What this skill does NOT do

- Doesn't auto-send without user approval (always preview + confirm in chat first)
- Doesn't loop / schedule itself (use launchd / cron / a /loop skill if you want recurring)
- Doesn't update the Supabase advisors table (read-only here; edit in vault YAML + sync)
- Doesn't handle Phase 2 enrichment images (separate skill when ready)
