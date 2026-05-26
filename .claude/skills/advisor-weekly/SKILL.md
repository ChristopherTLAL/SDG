---
name: advisor-weekly
description: Generate AI-written "this-week follow-up suggestions" for every active 中期 advisor, then persist to Supabase so the website (/internal/advisors/[name]/weekly) shows the suggestions at the top of each advisor's weekly reminder page. Uses agent-teams architecture — Opus orchestrates, one Sonnet subagent per advisor reads that advisor's students (recent comm notes + pending submissions + contracts + days-since-contact) in parallel and writes 「本周建议跟进」 markdown, Opus then UPSERTs each into `advisor_weekly_advice`. Trigger whenever the user says "/advisor-weekly", "本周顾问建议", "顾问周报建议", "每周顾问 AI 建议", "advisor weekly advice", "跑一下顾问 AI 周报", "更新顾问本周提醒", "刷新本周 AI 建议", or any phrasing implying "let AI generate this week's advisor action list and push it to the site". Don't undertrigger.
---

# advisor-weekly

## What this skill does

Walks every active 中期 advisor, reads each one's in-管 students (近 3 条沟通记录全文 + 待处理 submissions + 合同状态 + 距上次沟通天数 + stage / 入学届 / 意向 / 在读学校), and asks a per-advisor Sonnet subagent to write a **specific** 「本周建议跟进」markdown — "why → do-this" format, no empty phrases.

The output is persisted to Supabase table `advisor_weekly_advice` (key = `advisor_name, week_start`). The website's per-advisor weekly reminder page (`/internal/advisors/[name]/weekly`) reads this row and shows it at the top.

**Cadence:** the user runs this manually once per week (typically Monday morning). UPSERT means re-running within the same week overwrites; older weeks stay in the table as history.

## Critical context

- **Supabase project ref**: `sdcubejyamnghhhxzvco`
- **Env vars** (live in `~/Code/sdg-html/.env`, MUST be sourced before running scripts):
  - `SUPABASE_URL` — REST API base
  - `SUPABASE_SERVICE_ROLE_KEY` — service-role key (bypasses RLS)
- **MCP**: the `supabase` MCP server is configured in `.mcp.json` and exposes `mcp__supabase__execute_sql`. If the MCP tool isn't loaded yet, fetch it via ToolSearch first.
- **Vault for context augmentation** (optional, only if a student's last sync is stale): `/Users/shijie/Obsidian/规划看板/01_Student/<name>/沟通记录/*.md`. Default to reading `student_notes` rows from Supabase since the sync runs every 30 min.
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

Compute `week_start` = the Monday of the week the skill is being run for. Use the existing system clock: if today is Mon → today; otherwise → previous Monday. Same convention as `/internal/advisors/[name]/weekly` page.

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

STEP 5 — Return STRUCTURED JSON. The parent Opus parses + persists this into TWO tables:
per-student rows go into `student_weekly_advice` (source of truth for the Excel export
and any future per-student UI), and a derived markdown blob still goes into
`advisor_weekly_advice.advice_md` for the existing weekly web page.

Output ONE JSON object matching this schema exactly:

  {
    "advisor_name": "<ADVISOR_NAME>",
    "week_start":   "<WEEK_START_YYYY_MM_DD>",
    "students": [
      {
        "student_id":          <int>,
        "name":                "<学生名 — for log/sanity only, not stored>",
        "bucket":              "urgent" | "normal" | "kickoff",
        "stage":               "<stage from STEP 1 — passed through verbatim>",
        "enroll_year":         "<first element of enroll_years, e.g. '2026 fall'>",
        "days_since_contact":  <int or null>,
        "last_note_date":      "<YYYY-MM-DD or null>",
        "pending_subs_count":  <int>,
        "target_region":       "<first element of target_regions, or null — used by kickoff bullets>",
        "suggestion_md":       "<one or two sentences: why → do-this>"
      },
      ...
    ]
  }

Bucket mapping (same rule as STEP 4):
  - "urgent"  → 🔴 优先   (stage='后期在途' AND days>=31, OR stage in ('中期在途','需对接') AND days>=28)
  - "normal"  → 🟠 常规   (14 <= days < urgent threshold for that stage)
  - "kickoff" → 🆕 待对接 (stage='待对接', regardless of days)

Students with days < 14 AND stage != '待对接' are DROPPED — do NOT include them.
An advisor with zero qualifying students returns `"students": []` and Opus handles it.

QUALITY BAR — `suggestion_md` must be SPECIFIC. Spend tokens reading the actual 沟通记录 body_md.
Bucket / days / 学生姓名 are already in structured fields — DO NOT repeat them in `suggestion_md`.

  ✓ GOOD: "4/15 沟通记录学生说要试三个夏校但还没选定 → 本周主动 ping,让他给出 4 选 1 名单 + 顺带催 IELTS 4 月模考成绩单"
  ✗ BAD:  "已 30+ 天未联系 → 本周主动跟进"   (空话; days 已经在结构化字段里)
  ✗ BAD:  "跟进文书"                       (没说为什么、没说做什么)

If the latest 沟通记录 contains an explicit 「下一步」/「Action Items」/「我会...」 section, lift those as
the do-this — they're verbatim promises the advisor made and the student is waiting on.

STEP 6 — Return ONLY the JSON object. No preamble, no markdown framing, no code-fence —
just the raw JSON so the parent can JSON.parse it directly.
```

Replace `<ADVISOR_NAME>` and `<WEEK_START_YYYY_MM_DD>` per advisor before spawning.

### Step 4: review + dual-table UPSERT

After all subagents return, Opus parses each JSON output and does a light review:

- Valid JSON matching the schema? `advisor_name` + `week_start` match what was requested?
- Each student has `student_id`, `bucket` ∈ {urgent, normal, kickoff}, non-empty `suggestion_md`?
- Spot-check 2-3 random `suggestion_md` values: specific (references actual notes/dates) — or vague ("跟进文书" type)?
- If a subagent returned malformed JSON or vague suggestions, re-spawn that one — don't write garbage.

Then persist to BOTH tables. Use `mcp__supabase__execute_sql` with `params` for parameter binding (suggestion_md / advice_md can contain quotes).

#### (a) Per-student rows into `student_weekly_advice`

The source of truth for the Excel export + any future per-student UI. One row per item in `students[]`. Skip entirely if `students[]` is empty.

```sql
INSERT INTO student_weekly_advice
  (student_id, week_start, advisor_name, bucket, days_since_contact,
   suggestion_md, last_note_date, pending_subs_count, generated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
ON CONFLICT (student_id, week_start, advisor_name) DO UPDATE SET
  bucket             = EXCLUDED.bucket,
  days_since_contact = EXCLUDED.days_since_contact,
  suggestion_md      = EXCLUDED.suggestion_md,
  last_note_date     = EXCLUDED.last_note_date,
  pending_subs_count = EXCLUDED.pending_subs_count,
  generated_at       = now();
```

#### (b) Aggregated markdown into `advisor_weekly_advice`

Backward-compat: the website's `/internal/advisors/[name]/weekly` still renders this. Build the markdown by walking the JSON's `students[]` grouped by `bucket`, using the same shape the old skill produced:

```
## 本周建议跟进 · <advisor>

**🔴 优先 (N)**
- <name> (<stage> · <enroll_year> · <days>d 未联系): <suggestion_md>
- ...

**🟠 常规 (N)**
- ...

**🆕 待对接 kickoff (N)**
- <name> (<enroll_year> · <target_region>): <suggestion_md>
- ...
```

ALWAYS print all three bucket headers with `(N)` even when empty (use `(0)` + "本周该顾问该桶下无学生"). For an advisor with `students: []`, write a single-line advice: `"本周该顾问无 in-管 学生。"`. Then UPSERT:

```sql
INSERT INTO advisor_weekly_advice (advisor_name, week_start, advice_md, generated_at)
VALUES ($1, $2, $3, now())
ON CONFLICT (advisor_name, week_start) DO UPDATE SET
  advice_md = EXCLUDED.advice_md, generated_at = now();
```

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
  /internal/advisors/王世杰/weekly
  /internal/advisors/陆梦婕/weekly
  ...
```

Bucket counts come straight from the JSON: group each subagent's `students[]` by `bucket` and count.

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

- `scripts/bootstrap.sql` — `create table if not exists` DDL for BOTH `advisor_weekly_advice` (the per-advisor markdown blob, fed to the website) AND `student_weekly_advice` (per-student rows, fed to the Excel export). Single source of truth.
- `src/pages/internal/advisors/[name]/weekly.astro` — the per-advisor page; reads `advisor_weekly_advice.advice_md` (markdown).
- `src/pages/internal/advisors/index.astro` — the catalog page; hosts the "导出本周顾问周报 (Excel)" button which reads `student_weekly_advice` for per-student rows.
- `src/utils/cohort-filter.ts` — defines the 26F+ cohort floor used in the SQL `enroll_years` predicate above.
- `.claude/skills/morning-digest/SKILL.md` — sibling skill using the same parallel-subagents architecture (different cadence + output).
