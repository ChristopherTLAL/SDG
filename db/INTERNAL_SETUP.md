# Internal Dashboard Setup

Step-by-step to get `sdg.undp.ac.cn/internal/*` running.

---

## 1. Create Supabase project

1. [supabase.com](https://supabase.com) → Sign up → **New Project**
2. Name: `sdg-internal`, Region: **Singapore** or **Tokyo** (closer to CN)
3. Generate a strong DB password (save it — you'll need it for migrations)
4. Free tier: 500 MB DB, 1 GB Storage, 5 GB bandwidth. Plenty for us.

Once the project finishes provisioning (~2 min):

- Go to **Settings → API**. Copy:
  - **Project URL** → this is your `SUPABASE_URL`
  - **service_role** key (under "Project API keys") → this is `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Never commit `service_role` to git.** It bypasses row-level security.

## 2. Run the schema

1. **SQL Editor** → paste contents of `db/supabase-schema.sql` → Run
2. Verify in **Table Editor** that `students` and `submissions` tables exist

## 3. Create the Storage bucket

1. **Storage** → **New bucket**
2. Name: `submissions`
3. Public bucket: **OFF** (we use signed URLs)
4. Save

## 4. Add env vars (Vercel)

In Vercel project settings → **Environment Variables**:

| Name | Value | Environments |
|---|---|---|
| `SUPABASE_URL` | `https://xxxxxx.supabase.co` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJh…` (service_role) | Production, Preview, Development |

Re-deploy after adding.

## 5. Add env vars (local, for sync script)

Create `.env` in repo root (already gitignored):

```bash
SUPABASE_URL=https://xxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh...
OBSIDIAN_VAULT_ROOT=/Users/shijie/Library/CloudStorage/OneDrive-Personal/Obsidian/规划看板
```

## 6. Install deps + run first sync

```bash
cd ~/Documents/.../Website/HTML
npm install
npm run sync-students
```

You should see:

```
Reading vault at /Users/…/规划看板/01_Student …
Parsed 91 student records.

✅ Upserted 91 rows into students.
   刘昱彤    · 中期在途 · 2026-04-17
   …
```

Go to Supabase **Table Editor → students** and verify.

## 7. Verify the pages

Once deployed:

1. Open `https://sdg.undp.ac.cn/internal/` — should hit CF Access login, OTP to your email, then land on Overview
2. `/internal/submit` — pick a student, fill the form, submit — check it appears in `/internal/submissions`
3. `/internal/students` — 91 students with radar column
4. Mark a submission as processed → should move to "Processed" filter

---

## 8. Re-sync students (whenever you edit Obsidian YAML)

```bash
npm run sync-students
```

Options for automation:
- **Manual**: run when you change YAML (simplest)
- **Obsidian Git plugin + hook**: on push, run the script
- **cron**: `*/30 * * * * cd /path && npm run sync-students >> sync.log 2>&1`

## 9. Audio uploads — disabled

Audio recording uploads are intentionally turned off. Reason: Supabase free
tier gives us 1 GB Storage, and a handful of multi-minute recordings would
burn through it in weeks. The `submission_type` enum still has `录音` for
historical compatibility but the form no longer offers it and the API
rejects POSTs of that type.

The original n8n + Aliyun transcription workflow (previously documented
here) is parked. If we ever revive it, we'll either move to a paid
Supabase tier first or pipe audio directly to Aliyun without storing it
in Supabase.

## 10. Adding more employees

CF Access → Zero Trust → **Access → Applications** → your app → **Policies** → edit the "Allowed Employees" policy → add more emails.

## 11. Public dashboard, gated everything else (auth setup)

The `/internal` dashboard is publicly viewable; every other `/internal/*` page requires CF Access OTP login. Identity (when present) is read from the `Cf-Access-Authenticated-User-Email` header injected by CF Access and resolved against the `advisors` table.

### What you need to do in Cloudflare Zero Trust

1. **Access → Applications** → your app for `sdg.undp.ac.cn/internal/*`
2. **Add a new "Bypass" policy** (or edit the existing app to split into two paths):
   - **Bypass policy**: matches `sdg.undp.ac.cn/internal` exact (no trailing slash, or both `/internal` and `/internal/`). Action: Bypass. Audience: everyone.
   - **OTP policy**: matches `sdg.undp.ac.cn/internal/*` (trailing wildcard). Action: Allow. Audience: your "Allowed Employees" email list. Identity providers: Email OTP.
3. Order matters — the Bypass policy should evaluate first so the dashboard is open.

After this, hitting the dashboard goes through with no auth; clicking any nav tab triggers the OTP flow.

### How identity works in the app

- `src/middleware.ts` reads `Cf-Access-Authenticated-User-Email` on every `/internal/*` request and resolves it to a `Viewer { email, name, isAdmin }` via the `advisors` table.
- Pages access the viewer via `Astro.locals.viewer` (null = anonymous, non-null = authenticated).
- `viewer.isAdmin` is true for `wangshijie11@xdf.cn` or any advisor row with `admin: true` in their YAML.
- 私单 students appear only when the current viewer can see them (王世杰 / admin). For everyone else they're filtered out silently.

---

## File layout reference

```
db/
├── supabase-schema.sql      ← run this in Supabase SQL editor
└── INTERNAL_SETUP.md        ← this file

scripts/
└── sync-students-to-supabase.mjs   ← Obsidian → Supabase sync

src/
├── lib/supabase/client.ts           ← Supabase server client
├── layouts/InternalLayout.astro     ← shared chrome for /internal
└── pages/internal/
    ├── index.astro                  ← Overview
    ├── submit.astro                 ← employee form
    ├── submissions.astro            ← your inbox
    ├── students.astro               ← student roster (read-only)
    └── api/
        ├── submissions.ts                       ← POST handler
        └── submissions/[id]/processed.ts        ← mark processed
```
