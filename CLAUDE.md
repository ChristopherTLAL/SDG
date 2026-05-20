# Chinese SDGs Institute — Astro repo

This repo is **two things sharing one codebase**:

1. **Public website** (`/`, `/research`, `/dialogues`, `/projects`, `/tools/*`, `/verify`) — Sanity-backed news / research / projects / interactive tools. Anyone can hit it.
2. **Internal dashboard** (`/internal/*`) — Supabase-backed advisor workspace for the study-abroad consulting business. Cloudflare Access OTP gated. Source of truth for students lives in Shijie's Obsidian vault and syncs in.

The two halves use different data layers, different design tokens, and different auth. Treat them as separate products that happen to deploy together.

## Stack
Astro 5 SSR (`output: 'server'`) · React 19 (interactive bits via `client:load`) · Tailwind 3 · Sanity CMS (project `waxbya4l`, dataset `production`) · Supabase (project `sdcubejyamnghhhxzvco`) · Cloudflare Access · Vercel (`@astrojs/vercel`) · Manrope + Inter (Google Fonts) · Material Symbols Outlined.

## Commands
- `npm run dev` — dev server at localhost:4321
- `npm run build` — production build (local builds are flaky on this machine; prefer pushing to Vercel and letting it build)
- `npm run preview` — preview production build
- `npm run sync-students` — pull Obsidian vault YAML + 沟通记录 → Supabase. See "Cron / scheduling" below for how it actually runs.
- `npm run reconcile-cf-access` — sync `advisors.emails[]` → Cloudflare Access OTP allowlist.

## Routes
- **Top-level public pages** — [src/pages/](src/pages/): `{index, about, team, contact, publications, search, privacy, terms, 404}.astro` (plus `rss.xml.ts`, `sitemap.xml.ts`).
- **Public route groups** — [projects/](src/pages/projects/) (`index.astro` + `[slug].astro` + `all.astro` editorial listing), [research/](src/pages/research/) and [dialogues/](src/pages/dialogues/) (each `index.astro` + `[slug].astro`), [verify/](src/pages/verify/) (single-page `index.astro`).
- **Tools** — [src/pages/tools/](src/pages/tools/): `index.astro` (hub), `{personality, gpa-calculator, budget-calculator, interview, hku-interview, doc-generator}.astro`, plus `personality/[id].astro` (MDPA result viewer) and `guides/[slug].astro`.
- **Internal dashboard** — [src/pages/internal/](src/pages/internal/): `index.astro` (overview), `submit.astro`, `submissions.astro`, `students.astro` (list) + `students/[id].astro` (detail), `kanban/{advisors,contracts}/[name].astro`, `daily-reports/[advisor].astro`, `api/` (`me.ts` viewer probe + form POSTs + processed toggle).

## Data layers
- **Sanity** (public site): types `post`, `project`, `dialogue`, `author`. Schemas live in cloud-hosted Studio (no local `sanity-studio/`); the website consumes already-shaped `{ en, zh }` objects — the `localizedString` / `localizedText` / `localizedBlockContent` types are Studio-side, not in this repo. Reads via [src/lib/sanity/client.ts](src/lib/sanity/client.ts); the **one website→Sanity write path** is [src/pages/api/mdpa-submit.json.ts](src/pages/api/mdpa-submit.json.ts) using `writeClient` for MDPA result persistence.
- **Supabase** (internal): tables `students`, `student_notes`, `submissions`, `advisors`, `daily_reports`. [db/supabase-schema.sql](db/supabase-schema.sql) is partial — `advisors` and `daily_reports` were added live via Supabase MCP and never backported, so recreating the DB from that file alone leaves auth broken. End-to-end setup in [db/INTERNAL_SETUP.md](db/INTERNAL_SETUP.md).
- **Obsidian vault** at `/Users/shijie/Obsidian/规划看板` is the source of truth. YAML + main `<name>.md` body + `沟通记录/*.md` + `02_Project Manager/顾问/<name>.md` get synced to Supabase. Web pages are read-only views; never write back to vault from web — vault writes are done from a foreground Claude session on this Mac (inline, see Pattern B below), not from the web app.
- **Static data** — [src/data/contract-sops.ts](src/data/contract-sops.ts) (合同模板 + deliverable email bodies + `substitute()` helper for `{{学生姓名}}` / `{{中期顾问}}`), [src/data/student-tools.ts](src/data/student-tools.ts) (顾问对学生的话术), `guides-meta.ts`, `publications-meta.ts`, `budget-data.json`, `oxbridge-interview-questions.json`, plus [src/data/guides/](src/data/guides/) (~40 per-guide content `.ts` files).

## Cron / scheduling
**There is no Vercel cron and no GitHub Actions in this repo.** Production scheduling lives in **Shijie's local `crontab -e`** on this Mac, plus one **launchd LaunchAgent**:

**crontab**:
- `*/30 * * * * cd ~/Code/sdg-html && node scripts/sync-students-to-supabase.mjs` — vault → Supabase sync.
- `*/20 * * * * pgrep -f "n8n" > /dev/null || open -a "/Applications/n8n Pro.app"` — keeps the local n8n (send-email backend) alive.

**launchd LaunchAgents** (two are loaded; both `StartInterval` 120s, both poll the Supabase `submissions` queue):
- `com.sdg.inbox-sentinel` (`~/Library/LaunchAgents/com.sdg.inbox-sentinel.plist`) — **the live one.** Runs [scripts/inbox-sentinel.sh](scripts/inbox-sentinel.sh): a no-LLM poller (two curls) that Bark-pushes Shijie's iPhone when a *new* unprocessed submission ID appears; you then clear it with manual `/process-inbox`. Log: `~/Library/Logs/sdg-inbox-sentinel.log`. This is the post-OAuth-ban replacement for inbox-auto.
- `com.sdg.inbox-auto` (`~/Library/LaunchAgents/com.sdg.inbox-auto.plist`) — **superseded, but still loaded & unpaused.** Runs [scripts/process-inbox-auto.sh](scripts/process-inbox-auto.sh): would auto-archive self-student happy-path submissions via a paranoid-restricted headless `claude -p` (`Read,Edit,Write` only, no MCP/Bash, `--add-dir` vault only, neutral cwd). ⚠️ **Its `claude -p` will fail on the next real submission** (headless OAuth banned 2026-04-04 — see memory `headless_claude_oauth_broken.md`); it's only seen an empty queue lately so hasn't errored yet. Recommend pausing (`touch ~/Code/sdg-html/.inbox-auto-paused`) so it stops double-polling the sentinel. Status: `bash scripts/inbox-auto-status.sh`. Log: `~/Library/Logs/sdg-inbox-auto.log`. Full notes: memory `inbox_auto_operations.md`.

If this Mac is asleep, all of these stall. The 30-min sync cadence is documented as a *suggestion* in [db/INTERNAL_SETUP.md](db/INTERNAL_SETUP.md); actual cadence = whatever the crontab says.

## Auth (`/internal/*` only)
- Cloudflare Access. **Two CF apps cover `sdg.undp.ac.cn`:** (a) "Internal Dashboard (Public)" — path `/internal` exact, Bypass policy, no allowlist (don't edit); (b) "SDG Internal Dashboard" — path `/internal/*` wildcard, OTP with editable "Allowed Employees" policy. Order matters; bypass evaluated first. The `.env` IDs (`CF_ACCESS_OTP_APP_ID` / `_POLICY_ID`) point at app (b). On success, app (b) injects `Cf-Access-Authenticated-User-Email`.
- The `/internal` bypass is **purely CF-side**. [src/middleware.ts](src/middleware.ts) runs `resolveViewer()` for any path under `/internal*` and returns `null` cleanly when the header is absent.
- [src/lib/auth.ts](src/lib/auth.ts) resolves the email to `Astro.locals.viewer` with a 5-min in-memory cache (per Vercel instance — admin demotions take up to 5 min × N warm instances to propagate).
- **Identity match:** CF email looked up against `advisors.emails text[]` via Postgres array-contains. The vault YAML `邮箱` field accepts a scalar (legacy) or an array (primary + aliases); sync normalizes both into `emails[]` so an advisor can log in via any address and resolve to the same row.
- **Admin status** comes from the `advisors.is_admin` column. There's no hardcoded admin allowlist — set `admin: true` in the vault YAML to grant.
- **Three viewer states:** `null` (no CF header — only the exempted bare `/internal`); guest (CF-authenticated XDF colleague with no advisor row, sees dashboard + roster but no submit, 私单 hidden); full advisor (matched a row).
- **Private contracts (私单)** filtered unless `viewer.isAdmin || viewer.name === '王世杰'`. The 王世杰 name check is hardcoded inline in 4 pages (`internal/index.astro`, `students.astro`, `kanban/index.astro`, `kanban/contracts/[name].astro`) — if 王世杰's name changes in the vault, update those 4 lines.

## Design tokens
Two palettes — pick the right one for the page you're touching.
- **Public site** ([src/layouts/MainLayout.astro](src/layouts/MainLayout.astro) + [tailwind.config.js](tailwind.config.js)): `--primary: #042f24` (deep teal). Material-Design surface hierarchy in Tailwind config (`bg-surface-container-{low,,high}`, etc.).
- **Internal dashboard** ([src/layouts/InternalLayout.astro](src/layouts/InternalLayout.astro)): `--primary: #000000`, `--primary-dim: #1a1a1a`, `--surface: #fafafa`, `--surface-raised: #ffffff`, plus `--border / --text / --text-muted / --text-soft`, semantic `--danger #dc2626 / --warning #d97706 / --success #059669`. (No multi-tier `--container-*` hierarchy on this side — only `--surface` + `--surface-raised`.)
- Both: Manrope (extrabold/800 headlines), Inter (body 300-600). Material Symbols Outlined: InternalLayout pins `wght 300, FILL 0`; MainLayout loads variable axis so per-element style on the public site is freer. No dark mode. Header `bg-white/90 backdrop-blur-xl`.
- Mobile: warning overlay below 768px, dismissible with persistent badge.
- **i18n:** Chinese pages removed; Google Translate banner in `Header.astro`. Sanity fields keep field-level `{en, zh}`.

## Utilities and helpers
- [src/utils/illustrations.ts](src/utils/illustrations.ts) — sequential cycling by chronological index over 44 PNGs in [public/images/illustrations/](public/images/illustrations/) for posts without `mainImage`. (Old docs claimed djb2-hash / SDG-aware — that's stale; current code is plain `index % 44`.)
- [src/utils/wikilinks.ts](src/utils/wikilinks.ts) — resolves Obsidian `[[target]]` / `[[target|alias]]` / `![[attachment]]` scoped to a student's note set (used on `/internal/students/[id]`). Render classes: `wikilink-student`, `wikilink-note`, `wikilink-attachment`, `wikilink-unresolved`.
- [src/utils/contact-radar.ts](src/utils/contact-radar.ts) — days-since-last-contact tiering: `green <7 / yellow <14 / pink <21 / red <28 / critical ≥28`. `INACTIVE_STAGES = {'已结案', '退费', '已完成'}` are excluded from radar.
- [src/utils/callouts.ts](src/utils/callouts.ts) — Obsidian `> [!info]`-style callouts → HTML; run before `marked.parse` so wikilinks inside callouts still resolve.
- [src/lib/sanity/](src/lib/sanity/) — split read (`client.ts`) vs. write (`writeClient.ts`); `queries.ts` GROQ helpers, `image.ts` URL builder, `pt.ts` Portable Text.
- [src/lib/mdpa/](src/lib/mdpa/) — MDPA result parsing + constants used by `/tools/personality/[id]` and the `mdpa-report` skill.
- `substitute()` in [src/data/contract-sops.ts](src/data/contract-sops.ts) — replaces `{{学生姓名}}` / `{{中期顾问}}`. Reads singular `student.mid_advisor` (= first element of multi-advisor `mid_advisors[]`); multi-advisor students lose the second name in rendered SOPs.

## Skills ([.claude/skills/](.claude/skills/))
Skills handle multi-step workflows; user invokes them via slash command. Don't reimplement these inline — invoke the skill.
- **deploy** — build + commit + push + watch Vercel logs
- **process-inbox** — archive `/internal/submissions` queue into Obsidian vault. ⚠️ Its `SKILL.md` still describes *spawning headless `claude -p` per student* — that path is **broken post-OAuth-ban**; in practice run it **inline** (Pattern B: read vault `CLAUDE.md` + the relevant `_agents/skills/`, then write 沟通记录/档案/日报 yourself; mark Supabase `processed=true` only after a review pass). Now triggered by the `com.sdg.inbox-sentinel` Bark push (see Cron above), not the dead auto-archiver. Use it for: cross-advisor rows, new clients, oversized content, or whenever vault-skill smart treatment (meeting-minutes / summarize) is wanted.
- **morning-digest** — daily per-advisor briefing emails (parallel subagents per advisor; defaults to test-mode that routes everything to 王世杰)
- **send-email** — send via Shijie's local n8n webhook (xdf work address default; automation Gmail when explicitly asked)
- **sanity-content** — CRUD on Sanity posts / projects / dialogues
- **mdpa-report** — generate MDPA personality report from a Sanity result, publish as interactive web report at `/tools/personality/<id>` + optional Excel (multi-agent, token-heavy — explicit request only)
- **add-page** — scaffold new Astro pages following the public-site design system
- **add-illustration** — import + integrate new hand-drawn PNGs
- **write-article** — draft long-form English articles for News / Research / Policy Brief
- **skill-creator** — author / optimize / benchmark new skills

Each skill has its own `SKILL.md` with full triggers and behavior.

## Working with the vault from this conversation

The Obsidian vault is on the same Mac and the same filesystem — there's no separate "vault Claude Code" window anymore. This sdg-html context is the single point of contact for both sides. Use this section as the dispatch table.

- **Vault path**: `/Users/shijie/Obsidian/规划看板` — moved off OneDrive ~2026-05; the old `~/Library/CloudStorage/OneDrive-Personal/Obsidian/规划看板` is **dead**. `OBSIDIAN_VAULT_ROOT` in `.env` is the source of truth.
- **Vault `CLAUDE.md`** (two iron rules + ~25-skill trigger table) — Read once at the start of any vault-touching session; it's not auto-loaded here.
- **Vault skills root**: `_agents/skills/` (NOT `.claude/skills/` — vault uses its own convention)
- **Vault git**: vault is `git init`'d as of 2026-05-06 (main branch). Commit liberally; git is the version-control / revert mechanism (vault no longer lives in OneDrive).

### Pattern A — light vault ops (do directly, no subagent)

For YAML edits, audit scripts, batch renames, `.md` content tweaks, file moves, git operations, Python scripts that read/write vault files — just use Bash/Read/Edit/Write directly on vault paths. **80% of vault work goes here.**

### Pattern B — vault skill invocation (run INLINE; headless `claude -p` is BROKEN)

⚠️ **The old mechanism — spawning a headless `claude -p` into the vault — no longer works.** Claude Code headless OAuth was blocked in the 2026-04-04 ban (assistant memory `headless_claude_oauth_broken.md`); both launchd `claude -p` jobs and `/schedule` remote routines are dead. Do **not** write new flows that shell out to `claude -p`.

When you need a vault skill that depends on the vault's `CLAUDE.md` iron rules + `_agents/skills/` trigger table (meeting-minutes / summarize / planning-roadmap / lor_writer / onboarding / etc.), **execute it inline in this foreground session**:

1. `Read` the vault `CLAUDE.md` (two iron rules — not auto-loaded here).
2. `Read` the skill's `SKILL.md` under `_agents/skills/<skill>/` (iron rule one: always read before executing).
3. Follow its steps yourself with Bash/Read/Edit/Write on vault paths, honouring iron rule two: write all required files (档案 / 沟通记录 / 待办看板 / 日报). **Verify field values against `.claude/rules/student_sop.md` + live Supabase — SKILL.md templates have drifted (e.g. onboarding's `当前进度` enum).**

This is exactly how `onboarding` was run for 李若涵 on 2026-05-20. The alternative is opening a real interactive Claude Code session **inside** the vault directory, where vault `CLAUDE.md` + `_agents/skills/` auto-load.

### Vault skills inventory (run inline per Pattern B when the trigger fires)

~25 skills under `_agents/skills/` in vault. When a trigger below fires, run the skill **inline** (read its `SKILL.md`, then execute the steps yourself):

**学生档案 / 沟通**
- `meeting-minutes` — STT 转写 / 录音文本 → 留学规划会议纪要 (触发: "整理沟通记录" / "整理纪要" / 粘贴大段 STT)
- `onboarding` — 转案 / 新签学生建档（标准文件夹 + YAML + 首次纪要模板 + 待办 + 日报联动）
- `summarize` — 长 URL / PDF / 视频 / 音频内容浓缩
- `exam-prep` — 学生课程考前复习包（触发: "做复习资料" / "期末冲刺包" / "给 XX 课做复习"）

**文书写作（必走 vault 铁律）**
- `appeal-writer` — Appeal Letter / Love Letter（被拒 / waitlist / continued interest）
- `ps_writer` — Personal Statement（社科视角 Theme-driven 高密度写作，交互式 4 阶段）
- `cv_writer` — 学术简历 LaTeX（王世杰风格，AI 美化内容必须 `\highlight`）
- `lor_writer` — Letter of Recommendation（基于推荐人素材表）

**Excel 方案产出**
- `school-plan` — 选校方案 5-sheet Excel（UG/PG，6 阶段 Reconciliation + Review Lead 审核）
- `planning-roadmap` — 留学规划方案 7-sheet Excel（含周级热力图 + 甘特 + Agent Teams 审核）
- `intl-school-pick` — 国际学校择校（光华剑桥 / 领科 / WLSA 等，初/高中转学场景）

**博士专项**
- `phd_supervisor_match` — 博士导师快筛（并行子代理扫各校院系，出短名单表）
- `faculty-deep-dive` — 教授背景 / 论文深挖（每个 100-200 字解读）

**文档处理**
- `doc-polisher` — Word .docx 段落级 review comments（并行子代理）
- `word-editor` — 程式化 .docx 编辑 / track changes / 注释（带作者归属）
- `md2pdf` — Markdown → 高级排版 PDF（含 Obsidian CSS 注入）
- `deai-batch` — 多段文本批量降 AI（n8n 单段 workflow，50 改写 → GPTZero 选最优）
- `visa-funds-audit` — 银行流水 / 担保金 / 签证资金来源审查（触发: "审一下流水" / "担保金" / "GIC" / 丢一摞银行 PDF）
- `ppt-prompt-gen` — 原始素材 → 下游生图 AI 的结构化 PPT prompt 集（触发: "做 PPT" / "扔给 nano-banana"；注: sdg-html 侧也有同名 skill）

**外部工具桥**
- `agent-browser` — Rust headless browser CLI（导航 / 点击 / 截屏）
- `gog` — Google Workspace CLI（Gmail / Calendar / Drive / Sheets / Docs）
- `ticktick` — 滴答清单投递 + 行程查询

**Meta（自我演进）**
- `skill-creator` — 创建 / 修改 / 评估 skill 性能
- `skill-vetter` — skill 安装前的安全审查
- `self-improving-agent` — 失败 / 用户纠正后捕获教训写入 vault 教训库

**Vault commands** (`.claude/commands/`): `morning_check` / `daily_close` / `weekly_report` / `weekly_review` — 通过 `/<name>` 调用，比 skill 更轻量。

### Cross-system contracts to keep in sync

When you change either side, remember the other:
- **vault YAML field renames** → check `scripts/sync-students-to-supabase.mjs` doesn't break
- **sdg-html `src/data/contract-sops.ts` matchPatterns** ↔ vault `合同` YAML values — financial ERP is source of truth for contract names; see audit reports under `02_Project Manager/审计/` in vault
- **王世杰 hardcoded** in 4 sdg-html files (private-contracts visibility) ↔ vault advisor name; rename → grep `viewer.name === '王世杰'` and update both
- **`合同明细`** YAML field is **derived from financial Excel**, not user-edited; sync script regenerates it
- **vault `客户邮箱` field** ↔ Supabase `students.client_email`; field name is stable

## Env vars
Local `.env` (gitignored) — keep in sync on Vercel where applicable.
- **Sanity:** `SANITY_PROJECT_ID` (`waxbya4l`), `SANITY_DATASET` (`production`). **Three different token names** referenced by different files — set the same value to all three: `SANITY_TOKEN` (in scripts), `SANITY_API_TOKEN` ([src/lib/sanity/client.ts](src/lib/sanity/client.ts)), `SANITY_WRITE_TOKEN` ([src/lib/sanity/writeClient.ts](src/lib/sanity/writeClient.ts)).
- **Supabase:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server-only — bypasses RLS).
- **Vault:** `OBSIDIAN_VAULT_ROOT` (defaults to `/Users/shijie/Obsidian/规划看板`).
- **Cloudflare:** `CF_API_TOKEN` (scope: Access Apps + Policies Edit), `CF_ACCOUNT_ID`, `CF_ACCESS_OTP_APP_ID`, `CF_ACCESS_OTP_POLICY_ID`.

## Git: use GitHub MCP, not local git
Local disk I/O on this machine is unreliable (Spotlight indexing + VSCode git extension contention → frequent `.git/index.lock` and mmap timeouts). For commits and pushes, **always go through GitHub MCP**:
- `mcp__github__push_files` for multi-file commits (owner: `ChristopherTLAL`, repo: `SDG`, branch: `main`)
- `mcp__github__create_or_update_file` for single-file (needs `sha` from `get_file_contents`)
- `mcp__github__get_file_contents` to read remote state

Local `git` is fine for `status` / `diff` reads; only fall back to local `git push` if GitHub MCP is unavailable.

## MCP servers (configured in [.mcp.json](.mcp.json))
- **Sanity** (`https://mcp.sanity.io`) — query / patch / publish documents, schema, releases
- **Vercel** (`https://mcp.vercel.com`) — deployments, build & runtime logs
- **GitHub** (`@modelcontextprotocol/server-github`) — read / write files, commits, pushes (use this instead of local git)
- **Supabase** (`@supabase/mcp-server-supabase`) — SQL execution, migrations, edge functions, logs

## Gotchas
- **`CLAUDE.md` and `.mcp.json` are gitignored but already tracked.** Local `git add` silently ignores them. Use `git add -f` or push via GitHub MCP (`create_or_update_file`), which bypasses local `.gitignore`. Same applies to `.claude/settings.json` and `write-article-workspace/`.
- **`PRIVATE_CONTRACTS` (`['私单', '私单（非公司合同）']`) is duplicated inline in 4 files** (`internal/index.astro`, `students.astro`, `kanban/index.astro`, `kanban/contracts/[name].astro`). Adding a new private label = editing all four — consider extracting to `src/utils/` first.
- **esbuild + Chinese punctuation:** straight `"..."` inside inline `<script>` blocks breaks esbuild. Use `「...」` instead.
- **Sanity drafts:** every `patch_document_from_json` creates a draft. Always call `publish_documents` after — patch + publish is a two-step.
- **Verify page** ([src/pages/verify/index.astro](src/pages/verify/index.astro)): uses `MainLayout` but loads jsPDF via CDN `<script is:inline>` and certificate fonts (Crimson Pro, Meddon, Mrs Saint Delafield) via `/verify/embedded_fonts.css`. Classes `.certificate-font` / `.font-recipient` / `.font-body-cert`. Canvas / PDF rendering is brittle — preserve when editing.
- **Audio uploads disabled** at both layers: `submit.astro` form omits the option AND `api/submissions.ts` rejects type `录音` with 400 ("录音上传已停用"). DB `submission_type` enum keeps the value for legacy rows.
- **CF Access policy edits:** PUT `/access/policies/{id}` (NOT `/access/apps/{app_id}/policies/{id}`). Don't drop `email_domain: xdf.cn` from the allowlist without warning the user.
- **n8n send-email contract:** webhook only reads `to / subject / body / html / sender / attachments`; `markdown:true` is silently dropped. Always go through the `send-email` skill (or pre-render HTML).

## Workflow
- For confident changes, push direct to `main`. No CI / branch protection. Vercel is the deployment source of truth — revert via Vercel dashboard if needed.
- For Sanity content edits: patch then publish, always both.
- For multi-step jobs (deploys, inbox processing, daily digests, new pages, articles), **prefer the matching skill** over ad-hoc work.

## See also
- [db/INTERNAL_SETUP.md](db/INTERNAL_SETUP.md) — Supabase + Cloudflare Access + env-var setup walkthrough
- [.claude/skills/](.claude/skills/) — per-skill `SKILL.md` files with triggers and implementation notes
