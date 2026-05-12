-- advisor_weekly_advice — one row per (advisor, week_start)
-- Idempotent: re-running this SQL is a no-op.
-- See ../SKILL.md for usage.

create table if not exists public.advisor_weekly_advice (
  advisor_name  text        not null,
  week_start    date        not null,       -- ISO Monday of the reporting week
  advice_md     text        not null,       -- the AI-generated 「本周建议跟进」 markdown
  generated_at  timestamptz not null default now(),
  primary key (advisor_name, week_start)
);

-- Helpful index for "what's the latest advice for this advisor?" lookups.
create index if not exists advisor_weekly_advice_by_advisor_desc
  on public.advisor_weekly_advice (advisor_name, week_start desc);

-- Service role bypasses RLS, so no policies needed for the skill's UPSERTs.
-- But the website reads this via the same service role (server-rendered),
-- so leave RLS disabled too. If RLS ever gets enabled on this schema,
-- add an `auth.role() = 'service_role'` policy.
alter table public.advisor_weekly_advice disable row level security;
