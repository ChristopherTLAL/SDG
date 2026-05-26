-- Two tables, both idempotent (`create table if not exists`).
-- See ../SKILL.md for usage. The skill's bootstrap step runs this whole file.

-- 1. advisor_weekly_advice — one row per (advisor, week_start).
--    Stores the aggregated "本周建议跟进" markdown blob the website renders.
create table if not exists public.advisor_weekly_advice (
  advisor_name  text        not null,
  week_start    date        not null,       -- ISO Monday of the reporting week
  advice_md     text        not null,       -- the AI-generated markdown
  generated_at  timestamptz not null default now(),
  primary key (advisor_name, week_start)
);
create index if not exists advisor_weekly_advice_by_advisor_desc
  on public.advisor_weekly_advice (advisor_name, week_start desc);
alter table public.advisor_weekly_advice disable row level security;

-- 2. student_weekly_advice — one row per (student, week, advisor).
--    Source of truth for the Excel export + any future per-student UI.
--    advisor_name is in the PK so 共带 students get one row per advisor each week.
create table if not exists public.student_weekly_advice (
  student_id          bigint  not null references public.students(id) on delete cascade,
  week_start          date    not null,
  advisor_name        text    not null,
  bucket              text    not null check (bucket in ('urgent','normal','kickoff')),
  days_since_contact  int,
  suggestion_md       text    not null,
  last_note_date      date,
  pending_subs_count  int     default 0,
  generated_at        timestamptz not null default now(),
  primary key (student_id, week_start, advisor_name)
);
create index if not exists idx_swa_advisor_week
  on public.student_weekly_advice (advisor_name, week_start);
-- Per the project's new-table convention (memory: supabase_new_table_grant) —
-- public-schema new tables default to no grants; service_role must be granted
-- and RLS must be enabled in the same migration.
grant all on public.student_weekly_advice to service_role;
alter table public.student_weekly_advice enable row level security;
