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
| `N8N_WEBHOOK_URL` | `https://n8n.undp.ac.cn/webhook/…` (optional, later) | Production, Preview |

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

## 9. n8n transcription (later)

Two ways to hook up your Aliyun transcription workflow:

### A. Via Astro API (push)

Set `N8N_WEBHOOK_URL` env var. Whenever audio is uploaded, our API POSTs to n8n:

```json
{
  "event": "submission.audio_uploaded",
  "submission_id": 42,
  "audio_path": "audio/1745493123-x7k2.mp3"
}
```

Your n8n workflow:
1. Receives webhook → downloads file from Supabase Storage (signed URL)
2. Uploads to Aliyun → polls for transcript
3. Deletes Aliyun copy
4. Updates `submissions.ai_transcript` via Supabase REST API

### B. Via Supabase Database Webhook (pull)

In Supabase → **Database → Webhooks** → create a new webhook:
- Table: `submissions`
- Events: `INSERT`
- Conditions: `type = 录音 AND audio_url IS NOT NULL`
- URL: your n8n webhook endpoint
- Method: POST

This decouples Astro from n8n entirely.

## 10. Adding more employees

CF Access → Zero Trust → **Access → Applications** → your app → **Policies** → edit the "Allowed Employees" policy → add more emails.

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
