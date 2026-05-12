---
name: advisor-weekly
description: Generate AI-written "this-week follow-up suggestions" for every active 中期 advisor, then persist to Supabase so the website (/internal/kanban/advisors/[name]/weekly) shows the suggestions at the top of each advisor's weekly reminder page. Uses agent-teams architecture — Opus orchestrates, one Sonnet subagent per advisor reads that advisor's students (recent comm notes + pending submissions + contracts + days-since-contact) in parallel and writes 「本周建议跟进」 markdown, Opus then UPSERTs each into `advisor_weekly_advice`. Trigger whenever the user says "/advisor-weekly", "本周顾问建议", "顾问周报建议", "每周顾问 AI 建议", "advisor weekly advice", "跑一下顾问 AI 周报", "更新顾问本周提醒", "刷新本周 AI 建议", or any phrasing implying "let AI generate this week's advisor action list and push it to the site". Don't undertrigger.
---

# advisor-weekly

## What this skill does

Walks every active 中期 advisor, reads each one's in-管 students (近 3 条沟通记录全文 + 待处理 submissions + 合同状态 + 距上次沟通天数 + stage / 入学届 / 意向 / 在读学校), and asks a per-advisor Sonnet subagent to write a **specific** 「本周建议跟进」markdown — "why → do-this" format, no empty phrases.

The output is persisted to Supabase table `advisor_weekly_advice` (key = `advisor_name, week_start`). The website's per-advisor weekly reminder page (`/internal/kanban/advisors/[name]/weekly`) reads this row and shows it at the top.

**Cadence:** the user runs this manually once per week (typically Monday morning). UPSERT means re-running within the same week overwrites; older weeks stay in the table as history.

## Critical context

- **Supabase project ref**: `sdcubejyamnghhhxzvco`
- **Env vars** (live in `~/Code/sdg-html/.env`, MUST be sourced before running scripts):
  - `SUPABASE_URL` — REST API base
  - `SUPABASE_SERVICE_ROLE_KEY` — service-role key (bypasses RLS)
- **MCP**: the `supabase` MCP server is configured in `.mcp.json` and exposes `mcp__supabase__execute_sql`. If the MCP tool isn't loaded yet, fetch it via ToolSearch first.
- **Vault for context augmentation** (optional, only if a student's last sync is stale): `/Users/shijie/Library/CloudStorage/OneDrive-Personal/Obsidian/规划看板/01_Student/<name>/沟通记录/*.md`. Default to reading `student_notes` rows from Supabase since the sync runs every 30 min.
- **Cohort floor**: only students with at least one `enroll_years` element ≥ 2026F count. (Logic lives in `src/utils/cohort-filter.ts`; replicate in SQL with the predicate below.)
- **Active advisor**: `advisors.active = true AND '中期' = ANY(roles)`.

## Workflow — Opus is the coordinator

### Step 1: bootstrap the table (idempotent)

Run once each time the skill loads — it's a `create table if not exists`, so no-op after the first run.

Call `mcp__supabase__execute_sql` with the SQL in `scripts/bootstrap.sql`. (Read the file via the Read tool, paste into the MCP call. Don't hardcode — keep the SQL as the source of truth.)

If the supabase MCP isn't yet loaded, run a ToolSearch first: `query: "select:mcp__supabase__execute_sql", max_results: 1`.

### Step 2: load advisor list + this week's Monday

```sql
SELECT name, emails
FROM advisors
WHERE active = true
  AND '中期' = ANY(roles)
ORDER BY name;
```

Compute `week_start` = the Monday of the week the skill is being run for. Use the existing system clock: if today is Mon → today; otherwise → previous Monday. Same convention as `/internal/kanban/advisors/[name]/weekly` page.

### Step 3: spawn N Sonnet subagents in PARALLEL — one per advisor

This is the heart of the skill. In a **single message**, emit one `Agent` tool call per advisor. All N must be in the same message so they run concurrently. (Sequential spawning defeats the purpose.)

Each `Agent` call:

```
subagent_type: "general-purpose"
model: "sonnet"
description: "Advisor weekly advice · <name>"
prompt: <see template below>
```

Subagent prompt template — be specific so the subagent doesn't need to ask follow-ups:

```
You are generating "本周建议跟进" for 中期顾问 「<ADVISOR_NAME>」 for the week starting <WEEK_START_YYYY_MM_DD>.

STEP 1 — Fetch this advisor's in-scope students by running this SQL via mcp__supabase__execute_sql:

  SELECT id, name, stage, enroll_years, target_regions, last_contact_at,
         contracts, contract_details, major_intention, current_school
  FROM students
  WHERE '<ADVISOR_NAME>' = ANY(mid_advisors)
    AND (stage IS NULL OR stage NOT IN ('已结案','退费','已完成'))
    AND EXISTS (
      SELECT 1 FROM unnest(coalesce(enroll_years, ARRAY[]::text[])) y
      WHERE y ~ '^([0-9]{4})' AND CAST(substring(y from '^([0-9]{4})') AS int) >= 2026
    );

  Skip students whose contracts include '私单' or '私单（非公司合同）' — those are 王世杰's personal book, not company-managed.

STEP 2 — For each student, fetch the latest 3 沟通记录:

  SELECT student_id, note_name, note_date, body_md
  FROM student_notes
  WHERE student_id = ANY(<STUDENT_IDS>)
  ORDER BY note_date DESC NULLS LAST
  LIMIT 3 * <N_STUDENTS>;

  (You can issue a single query bounded by the union of all student_ids.)

STEP 3 — For each student, fetch pending submissions:

  SELECT student_id, type, summary, submitted_at
  FROM submissions
  WHERE processed = false
    AND student_id = ANY(<STUDENT_IDS>);

STEP 4 — Compute days_since_contact = TODAY - last_contact_at::date for each student.
         Group students into three buckets:
           🔴 优先   — stage='后期在途' AND days >= 31  OR  stage in ('中期在途','需对接') AND days >= 28
           🟠 常规   — 14 <= days < (urgent threshold for that stage)
           🆕 待对接 — stage = '待对接' (regardless of days; first contact pending)
         Students with days < 14 are dropped — the page already lists them under 「建议跟进」 from raw data.

STEP 5 — Write the markdown. Format:

  ## 本周建议跟进 · <ADVISOR_NAME>

  **🔴 优先 (N)**
  - <学生名> (<stage> · <enroll_year> · <days>d 未联系): <一句话 why> + <一句话 do-this>
  - ...

  **🟠 常规 (N)**
  - ...

  **🆕 待对接 kickoff (N)**
  - <学生名> (<enroll_year> · <目标地区>): <一句话 do-this>
  - ...

  ALWAYS write the heading even if a bucket is empty — print "(0)" and "本周该顾问该桶下无学生" so the advisor knows it was checked.

QUALITY BAR — your advice must be SPECIFIC. Spend tokens reading the actual 沟通记录 body_md.

  ✓ GOOD: "张三 (中期 · 24F · 32d 未联系): 4/15 沟通记录学生说要试三个夏校但还没选定 → 本周主动 ping，让他给出 4 选 1 名单 + 顺带催 IELTS 4 月模考成绩单"
  ✗ BAD:  "张三 (中期 · 24F · 32d 未联系): 已 30+ 天未联系 → 本周主动跟进"   (空话; days 信息已经在括号里, 跟进是废话)
  ✗ BAD:  "李四: 跟进文书"                                                    (没说为什么、没说做什么)

If the latest 沟通记录 contains an explicit 「下一步」/「Action Items」/「我会...」 section, lift those as the do-this — they're verbatim promises the advisor made and the student is waiting on.

STEP 6 — Return ONLY the markdown. Don't preamble, don't explain — the parent agent (Opus) will collect your markdown and upsert it.
```

Replace `<ADVISOR_NAME>` and `<WEEK_START_YYYY_MM_DD>` per advisor before spawning.

### Step 4: review + UPSERT

After all subagents return, Opus reads each markdown output and does a light review:

- Heading present? `## 本周建议跟进 · {name}` matches the advisor?
- Three buckets present, each with `(N)` count?
- Spot-check 2-3 random items: is the why-then-what format respected? Or is it vague?
- If a subagent returned something off-format, regenerate that one (re-spawn with stricter prompt) — don't write garbage to the DB.

Then for each advisor, run:

```sql
INSERT INTO advisor_weekly_advice (advisor_name, week_start, advice_md, generated_at)
VALUES ($1, $2, $3, now())
ON CONFLICT (advisor_name, week_start)
DO UPDATE SET advice_md = EXCLUDED.advice_md, generated_at = now();
```

via `mcp__supabase__execute_sql`. Parameter binding via `params` is preferred over string interpolation (markdown can contain quotes).

### Step 5: final report

Tell the user:

```
✅ Generated advice for N advisors · week_start = YYYY-MM-DD

| 顾问 | 优先 | 常规 | 待对接 |
| --- | --- | --- | --- |
| 王世杰 | 2 | 5 | 1 |
| 陆梦婕 | 3 | 8 | 0 |
| ... | ... | ... | ... |

Inspect on the site:
  /internal/kanban/advisors/王世杰/weekly
  /internal/kanban/advisors/陆梦婕/weekly
  ...
```

Pull the bucket counts by parsing each subagent's markdown (regex `\((\d+)\)` against the header lines), or count items in each bucket.

## What this skill does NOT do

- Does NOT send email. Persists to DB only. The website renders the advice; the existing 「一键发邮件」 button on the weekly page sends a static reminder (no AI prose).
- Does NOT auto-schedule. User invokes manually each week.
- Does NOT loop over weeks. One run = one `week_start`.
- Does NOT touch advisor profile data, vault YAML, or anything outside `advisor_weekly_advice`.

## Edge cases

- **Advisor with 0 in-scope students** → still spawn the subagent? No — skip. Insert a row with `advice_md = "本周该顾问无 in-管 学生。"` so the page doesn't show a stale advice from last week.
- **Subagent fails / returns empty** → re-spawn once; if still failing, skip that advisor in this run (their old advice remains, the next run will refresh it).
- **MCP supabase tool not loaded** → ToolSearch `select:mcp__supabase__execute_sql` first. If the npx server is broken (zod cache issue), tell the user to clear `~/.npm/_npx/` and restart Claude Code.
- **Markdown contains unbalanced single quotes** → use parameterized SQL (the `params` array on `execute_sql`); avoid raw string interpolation.

## See also

- `scripts/bootstrap.sql` — the `create table if not exists` DDL for `advisor_weekly_advice`. Single source of truth.
- `src/pages/internal/kanban/advisors/[name]/weekly.astro` — the page that consumes this table.
- `src/utils/cohort-filter.ts` — defines the 26F+ cohort floor used in the SQL `enroll_years` predicate above.
- `.claude/skills/morning-digest/SKILL.md` — sibling skill using the same parallel-subagents architecture (different cadence + output).
