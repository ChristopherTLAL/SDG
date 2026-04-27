---
name: morning-digest
description: Generate and send the daily morning digest emails to mid-stage advisors — one personalized email per advisor with their own students' attention list, contact frequency, and deeper per-student context (latest comm note, last submission, current stage). Each advisor with > 0 students gets a dedicated isolated subagent (parallel, plain Agent — NO TeamCreate) so each composer has a clean context window. Zero-caseload advisors are filled in inline with a simple template (no subagent waste). After all drafts assemble, the lead validates them inline (each draft mentions only its own advisor's students), prints all in chat for user approval, then sends via send-email skill. **DEFAULT MODE: test-all-to-me** — every send goes to wangshijie11@xdf.cn with subject prefixed `[TEST → 顾问名]` so 王世杰 sees what each advisor would receive. Only switch to production (real recipients) when 王世杰 explicitly says "正式发" / "send for real" / "go production". Use whenever the user says "morning digest", "早报", "今日关注清单", "发顾问邮件", "推一下今日学生", or asks to compose/send the daily advisor briefings. Don't undertrigger.
---

# morning-digest

## What this skill does

Composes and sends a personalized daily email to each active mid-stage advisor (currently 10 people). Each email contains:

1. **Their own** active students that need attention (≥14d 未联系)
2. Per-student rich context: latest comm note title + date, latest unprocessed submission, current stage
3. A small caseload summary (total active, % overdue)
4. (Phase 2 future) Daily/weekly enrichment images attached

## DEFAULT MODE: test-all-to-me

**Every email is sent to wangshijie11@xdf.cn** (王世杰), with the subject prefixed `[TEST → 顾问名]`. This lets 王世杰 see what each advisor would receive without spamming the team.

**Switch to production only when explicitly told:**
- "正式发" / "send for real" / "go production" / "发给所有人" / "now flip prod"

In production mode, each advisor's email goes to their actual `email` address from the `advisors` table.

If unsure, stay in test mode. Re-confirm in the chat before sending in prod.

## Critical context

- **Source of truth for advisor list + emails**: Supabase table `public.advisors` (synced from `<vault>/02_Project Manager/顾问/*.md`)
- **Sender**: always `xdf` (work address), via the `send-email` skill
- **Send-email skill**: `.claude/skills/send-email/SKILL.md` — use it via stdin to its Python helper
- **Eligible advisors**: `active = true AND '中期' = ANY(roles)` — currently 10 people
- **Date for the digest**: today (Asia/Shanghai), formatted YYYY-MM-DD

## Architecture — important: NO TeamCreate

**Earlier version of this skill used `TeamCreate` + `team_name`. That was wrong.** Team-managed agents share a mailbox and can see each other; when the lead sends followup messages, multiple agents pick up each other's tasks ("cross-cover"), producing duplicate drafts and wasted compute. We don't need any inter-agent coordination here — each composer is independent.

**Correct architecture:**

```
/morning-digest (lead, sdg-html context)
│
├─ 1. Query advisors table (active, 中期)
│
├─ 2. Pre-fetch a per-advisor student count (one SQL) so we can split:
│        WITH_CASELOAD = advisors with > 0 students
│        ZERO_CASELOAD = advisors with 0 students
│
├─ 3. For each WITH_CASELOAD advisor: spawn a PLAIN Agent (no team_name)
│        - Each composer gets a focused prompt with ONLY their own advisor's name
│          and their own student id list (lead pre-fetches the list and embeds it
│          so the subagent can't accidentally query other advisors)
│        - Composer queries Supabase for per-student notes/submissions context
│        - Returns JSON via the Agent tool's synchronous result (no mailbox)
│        Spawn ALL of them in a single message so they run in parallel.
│
├─ 4. For each ZERO_CASELOAD advisor: lead inlines the "no caseload" template.
│        No subagent. Saves 5 agent-spawns of pure waste.
│
├─ 5. Lead validates all 10 drafts inline:
│        - Parse each JSON
│        - For each draft, verify the body only mentions students from the
│          advisor's own student list (cross-leak check)
│        - Verify no empty / placeholder bodies
│        - Verify stats are plausible
│        If any issue: surface to user, do NOT auto-proceed.
│
├─ 6. Print preview to user (compact: subject + key stats per draft).
│        User responds: send | send for real | show N | abort | edit instructions
│
└─ 7. Send: loop send-email skill 10 times with the right `to` per mode.
```

**Why no separate reviewer subagent**: with the new architecture, each composer is constrained to its own advisor (no cross-leak possible by construction). Lead-side inline validation is cheap and sufficient.

## Step-by-step

### Step 1 — Query advisors

Use `mcp__supabase__execute_sql`:

```sql
select name, email, roles
from advisors
where active = true and '中期' = any(roles)
order by name;
```

If empty → abort.

### Step 2 — Pre-fetch each advisor's student list

```sql
select mid_advisor as advisor, id, name, stage, last_contact_at, enroll_year,
       major_intention, current_school
from students
where mid_advisor = any($advisor_names)
  and (stage is null or stage not in ('已结案','退费','已完成'))
order by mid_advisor, last_contact_at asc nulls first;
```

Group rows by `advisor`. Result: a Map<advisor_name, students[]>.

Print a one-line caseload summary: `"袁辰飞 8, 张曌璐 1, ..., 高幸玲 0"`. Confirm with user before dispatching if you want — or proceed straight to step 3.

### Step 3 — Dispatch composer subagents IN PARALLEL (only for caseload > 0)

For each advisor with `students.length > 0`, spawn a **plain Agent** (NO `team_name`) in the same message:

```
Agent({
  description: "Compose digest for <advisor>",
  subagent_type: "general-purpose",
  prompt: <see template>,
})
```

`description` is short, only used for UI. There's no `name` (no team), no `team_name`. The subagent runs in foreground, returns its JSON via the Agent tool's result.

#### Composer subagent prompt template

```
You are composing today's morning digest email for ONE specific advisor.

ADVISOR: <advisor_name>
EMAIL:   <email>
ROLES:   <roles>
TODAY:   <YYYY-MM-DD>

YOUR ASSIGNED STUDENTS (this is the COMPLETE list — do NOT query for any other
advisor or any student not in this list):

<embed the student list as a JSON array, one object per student with id, name,
 stage, last_contact_at, enroll_year, major_intention, current_school>

YOUR JOB
For EACH student in the list above where days_since_last_contact >= 14
(or last_contact_at is null), enrich with two SQL queries:

  - Latest note for context:
    select note_name, note_date, body_md from student_notes
    where student_id = <id> order by note_date desc nulls last limit 1;

  - Unprocessed inbox (use only as a signal for "建议推进" hints if the
    submission summary contains a question / open ask. Don't display the count;
    just fold any urgent items into the hints line):
    select id, type, summary from submissions
    where student_id = <id> and processed = false;

Then compose a markdown body following the EMAIL FORMAT below. days_since =
(today - last_contact_at). Null last_contact_at = treat as ≥14d.

The 「建议推进」 line is the most important per-student field. See the
"Building 「建议推进」" section near the bottom of this SKILL for source
priority, style, and examples.

EMAIL FORMAT (Chinese markdown)

# 中期顾问每日关注清单 · YYYY-MM-DD · <advisor_name>

你好 <advisor_name>，

以下是你今天的关注清单。共 N 个在管学生，M 人需要联系。

## 需要联系的学生
(group by tier: ⚠️ 28d+ first, then 🔴 21-27d, then 🟠 14-20d. Within group, sort by days desc)

### <emoji> 学生姓名 — Nd 未联系 · stage
- 入学年份：X · 意向：Y
- 最近沟通 (MM-DD)：[[note_name]] — <一句精华提炼，从 body_md 取，<=30 字>
- 建议推进：<1–3 条 short hints, separated by ` / `>  ← see "Building 建议推进" below

## 你的带案概览

- 在管学生：N
- 14d+ 未联系：M (X%)
- 28d+ ⚠️：critical_count

——
苏州前途中期看板 · sdg.undp.ac.cn/internal

If all students < 14d:
  Replace "## 需要联系的学生" section with:
  你的 N 个在管学生今天都在 14 天内有过接触 ✓

OUTPUT (return ONLY this strict JSON, no markdown wrapping, no other prose):
{
  "advisor": "<advisor_name>",
  "subject_base": "中期顾问每日关注清单 · YYYY-MM-DD · <advisor_name>",
  "body": "<full markdown body with \\n line breaks>",
  "stats": {"total_active": <int>, "needs_attention": <int>, "critical": <int>}
}

CRITICAL CONSTRAINTS
- Do NOT query for any student or advisor not in YOUR ASSIGNED STUDENTS list above
- Do NOT compose drafts for other advisors
- Do NOT respond to or speculate about other advisors' work
```

### Step 4 — Inline ZERO_CASELOAD templates

For each advisor with 0 students, the lead generates the body inline (no subagent):

```
# 中期顾问每日关注清单 · YYYY-MM-DD · <advisor_name>

你好 <advisor_name>，

你目前还没有分到学生。如果有问题可以联系王世杰。

——
苏州前途中期看板 · sdg.undp.ac.cn/internal
```

Stats: `{"total_active": 0, "needs_attention": 0, "critical": 0}`

### Step 5 — Lead-side validation

For each of the 10 drafts:

1. Parse JSON. If parse fails → flag and surface to user.
2. Cross-leak check: extract all student names mentioned in the body (regex `### .* 学生名 — ` or look for known names). Verify each name is in that advisor's pre-fetched student list. If any name belongs to a different advisor → flag.
3. Empty check: body must be > 100 chars.
4. Stats sanity: `needs_attention <= total_active`, `critical <= needs_attention`.

If any flags → list them and ask user how to proceed. Do NOT auto-send.

### Step 6 — Preview to user

```
✅ 10 drafts ready (all validated, no cross-leaks)

Drafts (test-mode default → wangshijie11@xdf.cn):

  1. [TEST → 王世杰]   55 active · 36 attention · 22 ⚠️
  2. [TEST → 袁辰飞]    8 active ·  2 attention ·  2 ⚠️
  3. [TEST → 张曌璐]    1 active ·  0 attention ·  0 ⚠️
  ...
 10. [TEST → 高幸玲]    0 active

Reply:
  send / go        → send all 10 to wangshijie11@xdf.cn (test mode)
  send for real    → send all 10 to actual recipients (prod)
  show N           → print full body of draft #N
  edit N: <note>   → ask the composer to revise draft #N with your note
  abort            → cancel
```

### Step 7 — Send

For each draft, call send-email via Bash. **Always set `markdown: true`** — drafts are markdown, send-email will convert to styled HTML so the email renders properly (h1/h2 styling, table borders, list indentation, etc.) instead of showing raw markdown text.

```bash
cat <<EOF | python3 .claude/skills/send-email/scripts/send.py
{
  "to":       "<recipient per mode>",
  "subject":  "<final subject>",
  "body":     "<draft body in markdown>",
  "sender":   "xdf",
  "markdown": true
}
EOF
```

Send sequentially (~5s for 10). Capture each `messageId`. If any fail, report and continue.

In test mode: `to = wangshijie11@xdf.cn`, `subject = "[TEST → <advisor>] " + subject_base`
In prod mode: `to = advisor.email`, `subject = subject_base`

### Step 8 — Final report

```
✅ Sent N emails (test | prod)
   1. [TEST → 王世杰]  messageId=<...>
   ...
```

## Email format examples

**With attention items:**

```markdown
# 中期顾问每日关注清单 · 2026-04-27 · 袁辰飞

你好 袁辰飞，

以下是你今天的关注清单。共 8 个在管学生，2 人需要联系。

## 需要联系的学生

### ⚠️ 孙钟谋 — 33d 未联系 · 需对接
- 入学年份：待定 · 意向：可持续与绿色金融 (ESG) / 环境经济
- 最近沟通 (3-11)：[[孙钟谋规划沟通会议 260311]] — 大气科学跨考 ESG，定暑期实习+雅思路线
- 建议推进：催雅思备考材料 / 发 3-5 个暑期实习清单

### ⚠️ 王艺蒙 — 31d 未联系 · 需对接
- 入学年份：2028 fall · 意向：艺术管理 (不考虑作品集专业)
- 最近沟通 (3-6)：[[王艺蒙 规划沟通 2026-03-06]] — UCL/KCL 艺管，GPA 冲 90、写 Writing sample
- 建议推进：复盘 GPA 现状 / Writing sample 导师匹配 / 暑期美术馆实习

## 你的带案概览
- 在管学生：8
- 14d+ 未联系：2 (25%)
- 28d+ ⚠️：2

——
苏州前途中期看板 · sdg.undp.ac.cn/internal
```

**All clean (caseload > 0 but all < 14d):**

```markdown
# 中期顾问每日关注清单 · 2026-04-27 · 张曌璐

你好 张曌璐，

你的 1 个在管学生今天都在 14 天内有过接触 ✓

## 你的带案概览
- 在管学生：1
- 14d+ 未联系：0
- 28d+ ⚠️：0

——
苏州前途中期看板 · sdg.undp.ac.cn/internal
```

**Zero caseload (lead inlines, no subagent):**

```markdown
# 中期顾问每日关注清单 · 2026-04-27 · 高幸玲

你好 高幸玲，

你目前还没有分到学生。如果有问题可以联系王世杰。

——
苏州前途中期看板 · sdg.undp.ac.cn/internal
```

## Building 「建议推进」 — what to put there

Each per-student card shows 1–3 short hints (separated by ` / `, no leading bullet) that give the advisor concrete things to bring up in the next contact. The hints come FROM the latest comm note's content — extract action items / next steps / open questions / promises made by the advisor that are now overdue.

**Source priority** (composer subagent walks these in order):

1. **Action items in the latest note** (e.g., a "Action Items" / "下一步" / "顾问 Action" / "待办" section). Lift the verb-phrase, drop fluff. Cap at ~12 字 each.
2. **Promises the advisor made** ("我下周给你...", "我会帮你筛..."). These are highest priority — the student is waiting.
3. **Open questions left from last meeting** ("学校还没定" / "实习方向再想想").
4. **Stage + days-elapsed default** if the note has nothing actionable: e.g.
   - `中期在途` + 30d+ → "确认近况 / 标化进度"
   - `后期在途` + 14d+ → "签证 / 行前节奏"
   - `需对接` + 30d+ → "首联 + 基础档案"

**Style**:
- Each hint is ≤ 12 字, action-shaped (verb-led), concrete.
- Use ` / ` to separate. Max 3.
- If literally nothing actionable (e.g., new student no notes yet), write `首联建档` or similar single hint.

**Examples**:

```
- 建议推进：催雅思备考材料 / 跟进 3 个暑期实习筛选清单
- 建议推进：复盘 USABO 排课 / 催牛剑营录取 / 上海 wet lab 资源
- 建议推进：确认 offer 押金 / 签证递交节奏
- 建议推进：方向探索访谈（兴趣测评 + 学科偏好）
- 建议推进：首联 + 港大数学路径节点
```

**What NOT to write here**:
- ❌ Long context ("根据上次沟通学生选了 Natural Sciences...") — that's already in the 最近沟通 line above
- ❌ "联系学生" / "跟进" 这种空话 — be specific
- ❌ Inbox counts — we removed that field intentionally; if there's a real urgent submission, surface it as one of the hints (e.g. "回家长关于雅思时间的问题")

## Phase 2 (later, when you provide source)

- **每日素材附件**: separate broadcast channel — same content × 10 recipients (王世杰 + 9 advisors). Likely a different skill (`/daily-materials`) since the workflow is different (single content, no per-recipient compute).
- **Caseload comparison table** in 王世杰's email so he sees relative load.
- **Edit-by-instruction** ("edit 1: shorten the intro") for fast revision before send.

## Edge cases

- **Composer subagent fails** for one advisor → mark that draft missing, surface to user before any sending. Do NOT silently send 9.
- **send-email script fails** for a recipient → report messageId failure, continue with next, end summary lists failures separately.
- **Cross-leak detected in validation** → surface verbatim, do NOT auto-send. User decides whether to override.

## What this skill does NOT do

- **Does NOT use TeamCreate.** Each composer is a plain isolated Agent. (Earlier broken design used TeamCreate; that caused cross-cover bugs.)
- Doesn't auto-send without user approval (always preview + confirm in chat first).
- Doesn't loop / schedule itself.
- Doesn't update the Supabase advisors table (read-only here; edit in vault YAML + sync).
- Doesn't handle Phase 2 enrichment images (separate skill when ready).
