---
name: process-inbox
description: Archive the unprocessed entries in the internal dashboard's submissions inbox (`/internal/submissions` → Supabase `submissions` table) into Shijie's Obsidian vault, INLINE in the current foreground session — write a proper student-facing 沟通记录 (vault meeting-minutes treatment for STT/录音, §3.1 internal-meta scrubbed), do the 4 required vault writes (沟通记录 / 学生档案双链 + 最后沟通时间 / 日报-{中期顾问} / 待办看板), run the meeting-minutes lint (0 ERROR), then mark `processed=true` in Supabase and commit the vault. Use whenever the user says "处理 inbox / submissions", "看一下 submission", "归档 submissions", "处理一下提交", references a specific submission id, or vaguely wants the inbox / employee uploads cleared. Special case `type='录音'` (auto-transcribed Voice Memos, `student_name_raw='【待确定，请和主管确认】'`): resolve the student via the TickTick calendar (recording filename timestamp ↔ that day's appointment) before archiving. Always run inline — the old headless-subagent and launchd-auto paths are dead post-OAuth-ban.
---

# Process Inbox skill

## TL;DR — how this actually runs (2026-06 reality)

`/internal/submissions` collects employee entries (沟通记录 / 重要comment / 状态更新 / 会议 / 录音 / 其他, + optional attachments) into Supabase `submissions`. Each unprocessed row gets archived into the Obsidian vault with the vault's own intelligence (meeting-minutes for STT, summarize for long content).

**You run this INLINE, in the current foreground Claude session.** Don't spawn subagents / TeamCreate / vault `claude -p` for this — inline is simpler, fully visible, and avoids env-inheritance surprises. (The launchd `com.sdg.inbox-auto` auto-archiver IS dead: its `claude -p` 403s under the 2026-04-04 OAuth ban. Note `claude -p` itself still works from an *interactive* Desktop session — only launchd/remote contexts are banned — but the per-student subagent orchestration is removed regardless as unnecessary overhead. Memory: `headless_claude_oauth_broken.md`.) The live trigger is `com.sdg.inbox-sentinel` (no-LLM Bark push to Shijie's iPhone on new IDs); after the push, Shijie runs this skill inline.

Pattern B (sdg-html CLAUDE.md): for vault skills you `Read` the vault `CLAUDE.md` + the relevant `_agents/skills/<skill>/SKILL.md`, then execute the steps yourself with Read/Edit/Write on vault paths.

## Critical paths

- **Vault root**: `/Users/shijie/Obsidian/规划看板`
- **Vault `CLAUDE.md`**: vault root — 三条铁律 + skill 触发表 (not auto-loaded here; Read it when doing vault-skill work)
- **meeting-minutes SKILL**: `_agents/skills/meeting-minutes/SKILL.md`
- **meeting-minutes lint**: `_agents/skills/meeting-minutes/scripts/lint_minutes.py` (run it, must be 0 ERROR — it catches format breakage that silently eats content)
- **TickTick lookup** (bundled): `.claude/skills/process-inbox/scripts/ticktick_lookup.py <YYYY-MM-DD>` — 录音 归属；查当天 TickTick 预约（**含已完成**，走 MCP `mcp.dida365.com`，无 ±18 天窗口限制）；token 从 `.env` `TICKTICK_API_TOKEN` 读（**勿写进本 public repo**）
- **Supabase**: project `sdcubejyamnghhhxzvco`; query/update via `mcp__supabase__execute_sql`
- **.env** (Supabase keys etc.): `~/Code/sdg-html/.env`
- **sync script**: `~/Code/sdg-html/scripts/sync-students-to-supabase.mjs` (run from MAIN repo — worktrees lack .env)

## Step-by-step (inline)

### 1. Pull the unprocessed queue

```sql
SELECT s.id, s.type, s.submitted_at, s.submitted_by, s.summary,
       length(s.content) AS content_len, left(s.content, 500) AS preview,
       s.attachment_url IS NOT NULL AS has_attach, s.audio_url IS NOT NULL AS has_audio,
       s.student_id, s.student_name_raw,
       st.name AS student_name, st.mid_advisor, st.mid_advisors, st.stage, st.obsidian_path
FROM submissions s LEFT JOIN students st ON st.id = s.student_id
WHERE s.processed IS NOT TRUE
ORDER BY s.submitted_at;
```

Print a one-line summary per row (id / type / 学生 / 一句话). If empty, say so and stop. For >1 row, you can just proceed (the user already asked you to process); for a big batch ask which to do.

### 2. Triage each row

| Case | How to tell | Action |
|---|---|---|
| **Normal note** (`type` 沟通记录/重要comment/状态更新/会议) with `student_id` | linked student | full archive (step 3) |
| **录音** (`type='录音'`, `student_name_raw='【待确定…】'`) | `submitted_by='录音自动'`, `student_id=null` | **resolve student via TickTick first** (see §录音), then full archive |
| **Duplicate** | same `student_id` + ~identical `content` + submitted seconds apart | mark processed, **no file** (`processed_path='(与 id X 重复提交…)'`) |
| **Empty** | `content` NULL / empty | mark processed, **no file** (`processed_path='(空白提交…)'`) |
| **New client** | `student_id IS NULL` and not a 录音 | ask user for 姓名 + key YAML before onboarding; else skip (leave `processed=false`) |

Pull the FULL `content` (not just preview) for rows you'll write up: `SELECT content FROM submissions WHERE id IN (...)`. For a duplicate suspicion, compare full content of the two ids.

### 3. Archive a normal/录音 submission

For each linked submission, `Read` the student's `<name>.md` first (background + current YAML), then:

**a. Write the 沟通记录** → `01_Student/<name>/沟通记录/<name> 规划沟通 YYYY-MM-DD.md`
- **Date = the CONVERSATION date, not the submission date.** Backfills: a `summary` like `26.3.5` = 2026-03-05 (古淑婷 uses `YY.M.D`); content that's forward-looking from an earlier month is a backfill — name the file by that date. 录音: use the filename timestamp date.
- Treat it with the vault **meeting-minutes** structure (read its SKILL.md): 30-80 字摘要 → `### 模块` sections → `>` quote / `> [!Callout｜标题]` (two-line!) per section → final Action Items table. For 录音/STT also do 纠错 / 角色判断 (顾问老师/学生/家长, NOT `[Speaker N]`) / 议题重组. For a genuinely tiny note (1-2 points) a short but still-structured 纪要 is fine.
- **§3.1 SCRUB** (see below) — this file may be forwarded to students/parents.

**b. Update `<name>.md`** (the 档案, internal-view):
- `最后沟通时间:` → the 纪要 date (don't regress it below an existing newer date)
- append under `## 沟通与纪要汇总`: `- [[<纪要文件名>]] — <一句话精华>`. Internal YAML changes you made go in THIS link line (e.g. `同步 目标地区→英国`), **never in the 沟通记录 file**.
- **Policy B YAML 校准** — see table below.

**c. Update `02_Project Manager/日报-{中期顾问}.md`** — insert at TOP (after `# 日报-X`), reverse-chronological. ≤4 bullets/entry, end with `→ [[纪要]]`. Route by the student's `中期顾问`; multi-advisor (`mid_advisors=[A,B]`) → write to BOTH. Create the file (`# 日报-X` first line) if missing. **Backfill of an old conversation → put it under a `## <处理日>` section labeled "(补录 M-D)" or in the correct chronological slot, link to the real date** (matches the existing 古淑婷 06-04 补录 convention).

**d. `02_Project Manager/待办任务看板.md`** — only if there are real advisor-actionable TODOs. Student-side todos (报名雅思 etc.) live in the 纪要's Action Items table, not the board. (Skip if board is mid-edit by another session — see commit hygiene.)

### 4. Lint (MANDATORY, 0 ERROR)

```bash
cd /Users/shijie/Obsidian/规划看板 && python3 _agents/skills/meeting-minutes/scripts/lint_minutes.py "01_Student/<name>/沟通记录/<file>.md" [more files...]
```
Must be `✅ 无 ERROR`. The lint catches: single-line callouts (正文被吃), empty callouts, unescaped `A*` (A-Level 星号要 `A\*`), missing `>` per section (W1 — add a `>` insight to each `###`), §3.1 leak terms. Fix and re-run until clean.

### 5. Mark processed

```sql
UPDATE submissions SET processed=true, processed_at=now(),
  processed_path='01_Student/<name>/沟通记录/<file>.md'
WHERE id=<id>;
```
Duplicates/empty get a descriptive `processed_path` instead of a file path.

### 6. Commit the vault (explicit pathspecs only)

```bash
cd /Users/shijie/Obsidian/规划看板
git reset HEAD -- .                       # clear any cross-session pre-staged WIP
git add -- "01_Student/<name>/沟通记录/<file>.md" "01_Student/<name>/<name>.md" "02_Project Manager/日报-X.md"
git -c core.quotePath=false diff --cached --name-status   # eyeball: ONLY your files
git commit -q -F - <<'MSG'
process-inbox: 归档<学生> <日期> <一句话>
…
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
MSG
```
**Never `git add -A`** — the vault routinely carries other sessions' WIP (仇彬钦/李卓玲/胡斌/陆重言/待办看板/日报-王世杰 etc.). Stage only the exact files you wrote. Vault git commands run outside the project dir → use `dangerouslyDisableSandbox: true`.

(YAML-derived Supabase fields — stage/target/major/last_contact — re-sync from vault via the 30-min cron, so a manual `sync-students` run is optional. Run it only if the user needs the dashboard updated immediately.)

---

## 录音 (`type='录音'`) — Voice Memo 自动转写

n8n「自动录音转文字」ships Apple Voice Memos → Dashscope ASR (speaker-diarized) → POSTs raw transcript with `type='录音'`, `submitted_by='录音自动'`, `student_id=null`, `student_name_raw='【待确定，请和主管确认】'`, `summary='【录音自动转写】20260613 132911-XXXX.m4a'`. **No LLM has touched it; no student attribution.**

### Attribution: TickTick calendar (PRIMARY method — don't just guess from content)

The `summary` filename embeds a **timestamp** (`20260613 132911` = 2026-06-13 13:29:11 Beijing). Shijie schedules big/long student meetings in TickTick by time slot, so the appointment covering the recording time IS the student. Look up that day:

```bash
python .claude/skills/process-inbox/scripts/ticktick_lookup.py 2026-06-13
#  [10:00] 张佳琰 ○未完成   [13:00] 陈梓媛 ○未完成   [14:15] 李梓萱 ○未完成 ...
```
(The script queries the TickTick **MCP** — `list_completed_tasks_by_date` + `list_undone_tasks_by_date` — so it returns appointments **including ones already marked 完成**, which the old published-ICS feed silently dropped, and it has no ±18-day rolling-window limit. Token from `.env` `TICKTICK_API_TOKEN`, never inline it — this repo is public.) 🚨 **A録音 transcript often never names the student** (260613 陈梓媛 — pure-content guessing nearly misattributed her to 李子萱). TickTick is the reliable anchor; transcript content (subjects, school, 竞赛 names) is the cross-check. Memory: `recording_attribution_via_ticktick.md`.

If TickTick has no match and content is unidentifiable → ask the user (per the `【待确定，请和主管确认】` literal).

### Then: meeting-minutes + §3.1, keep `type='录音'`

Run full meeting-minutes treatment inline. **Keep `type='录音'` in Supabase** (provenance: `type='录音' AND processed_path IS NOT NULL`). 录音 of parent/strategy meetings are the highest §3.1 risk — see below.

---

## §3.1 输出严禁清单 — 沟通记录 may be forwarded to students/parents

The 沟通记录 file is student/parent-facing. The 学生主档案 (`<name>.md`) is internal. **NEVER let internal meta into the 沟通记录:**

| 严禁 | 改写 / 处理 |
|---|---|
| 岗位名 (中期/前期/后期顾问)、二销、KPI、合同/合同编号、退费、跃领分级(MAX/Pro)、商机、返佣、中介数据 | 用「顾问老师」统一替代；商务/合同/KPI 类完全不写 |
| 系统术语 (档案/YAML/双向链接/最后沟通时间字段/触发/归档)、文件路径 | 删；YAML 字段改动写进**主档案**双链行，不写进纪要 |
| Skill 内部机制 (Phase/Reconciliation/n8n/sender=xdf) | 删 |
| 灰区/合规敏感操作（如「多开账号绕过院校官方流程」「单学期挑高分开排名」「GRE 作弊式刷分」） | **弱化或剔除**（用户 260613 张佳琰录音明确要求弱化）；中性化为正经策略，或只在内部主档案留备注 |
| 家长对学生的负面评价、对比别的孩子、家庭经济/「丢脸」「100万」类原话 | 不写 |

When a 录音/会议 has heavy sensitive content (parent strategy session), **ask the user** whether to (a) 整理但弱化敏感段, (b) 原样保留, or (c) 只标记归档不建文件 — then honor the choice.

**Self-check before commit**: `grep -onE "退费|二销|非标准化|作弊|中介|KPI|跃领|合同编号|低分高录|商机" <纪要>` should return nothing (the lint W3 also covers this).

---

## Policy B — content-side YAML 校准 (半自动)

When the content reveals an EXPLICIT student/advisor decision, update `<name>.md` YAML; note the change in the 双链 line.

| Field | Update WHEN (decisive) | NEVER on (tentative) |
|---|---|---|
| `目标地区` | 决定/锁定/弃 某地区；或合同/校名强暗示 (跃领→英国, 曼大→英国) | "考虑" / "倾向" / "可能" |
| `意向专业方向` | 决定/锁定 某专业；首次明确方向 | "在 A vs B 间纠结" / "下次访谈探索" |
| `当前进度` | stage 明示：需对接→中期在途(首次沟通完成)、进入后期、已结案、退费 | 财务/转交驱动的 stage 慎从 content 推 |
| `专业` / `目前就读学校` | content 明确在读专业/学校 (之前空) | — |

**NEVER auto-update from content**: `合同`/`合同明细`/`客户ID` (只走 import-signings.py)；`中期/前期/后期顾问` (onboarding/转交决定，用户确认才改)；`客户邮箱`. When content mixes decisive + tentative → ask before updating.

---

## Dedup / empty / backfill — quick rules

- **Duplicate** (same student, ~identical content, seconds apart): verify by comparing full `content`; mark processed, no file, `processed_path='(与 id X 重复提交)'`.
- **Empty** (NULL content): mark processed, no file, `processed_path='(空白提交)'`.
- **Backfill date**: 纪要 filename + `最后沟通时间` use the CONVERSATION date (from `summary` like `26.3.5` or 录音 filename), not `submitted_at`. Don't regress `最后沟通时间` below an existing newer note. Put the 日报 entry in the right chronological slot (or a 处理日 section labeled 补录).

## New clients (`student_id IS NULL`, not 录音)

Onboarding is human-judgment — don't auto-create. Ask: 「Submission #X 是新客「<raw>」，要建档吗？给我姓名 + 关键 YAML(合同/中期顾问/入学年份)」. If yes, run the vault `onboarding` skill inline (Read its SKILL.md first; verify field enums against `.claude/rules/student_sop.md` + live Supabase). If no, leave `processed=false`.

## Every non-trivial submission MUST produce a 沟通记录 .md

morning-digest reads `student_notes` (synced from `沟通记录/`) for per-student attention items. Skipping note creation for a "trivial" status update makes the student look inactive. Only duplicates and empty submissions get no file.

## Dead paths (do NOT use)

- **Headless subagent → vault `claude -p`** (the old Step 1-9 orchestration, TeamCreate, per-student payloads, reviewer agent): **removed** — inline is simpler/more reliable. (`claude -p` works from an interactive Desktop session, but a subagent-spawned one may not inherit the first-party env, and the orchestration was overhead either way.) Old design is in git history if ever needed.
- **launchd `com.sdg.inbox-auto`** auto-archiver (`scripts/process-inbox-auto.sh`, `--tools Read,Edit,Write` paranoid sandbox): superseded by `com.sdg.inbox-sentinel` (no-LLM Bark push). Its `claude -p` would 403 on the next real run. Pause with `touch ~/Code/sdg-html/.inbox-auto-paused`.
