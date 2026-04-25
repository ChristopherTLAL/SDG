-- Supabase schema for /internal (planning dashboard)
-- Run this once in the Supabase SQL editor.
--
-- Tables:
--   students     — synced from Obsidian vault (read-only from web)
--   submissions  — employee uploads (the "inbox" for Shijie to process)
--   contracts    — later
--   leads        — later

-- ─── STUDENTS ────────────────────────────────────────────────
create table if not exists public.students (
  id              bigserial primary key,
  name            text not null unique,           -- 姓名 (YAML key)
  enroll_year     text,                           -- 入学年份 (e.g. "2028 fall")
  stage           text,                           -- 当前进度
  contracts       text[] default '{}',            -- 合同 (array, e.g. [英国跃领, 格物计划])
  contract_type   text,                           -- legacy: 合同类型 (deprecated, kept for migration)
  major_intention text,                           -- 意向专业方向
  major_current   text,                           -- 专业 (在读专业，区别于意向)
  current_school  text,                           -- 目前就读学校
  grade           text,                           -- 年级 (e.g. 高一下, 11年级)
  gpa             text,                           -- GPA (free-form)
  client_email    text,                           -- 客户邮箱
  early_advisor   text,                           -- 前期顾问
  mid_advisor     text,                           -- 中期顾问
  last_contact_at date,                           -- 最后沟通时间
  obsidian_path   text,                           -- 01_Student/{姓名}
  tags            text[] default '{}',
  synced_at       timestamptz default now(),
  created_at      timestamptz default now()
);

-- Migration: add columns if they don't exist (safe to run multiple times)
alter table public.students add column if not exists contracts text[] default '{}';
alter table public.students add column if not exists major_current text;
alter table public.students add column if not exists grade text;
alter table public.students add column if not exists gpa text;
alter table public.students add column if not exists client_email text;
alter table public.students add column if not exists body_md text;
alter table public.students add column if not exists attachments text[] default '{}';

create index if not exists students_stage_idx         on public.students (stage);
create index if not exists students_mid_advisor_idx   on public.students (mid_advisor);
create index if not exists students_last_contact_idx  on public.students (last_contact_at desc);

-- ─── STUDENT NOTES (communication records) ───────────────────
-- One row per file under 01_Student/<name>/沟通记录/*.md
create table if not exists public.student_notes (
  id              bigserial primary key,
  student_id      bigint not null references public.students(id) on delete cascade,
  note_name       text not null,                -- filename without .md (also the wikilink target)
  body_md         text,
  obsidian_path   text,                         -- 01_Student/<name>/沟通记录/<note_name>.md
  note_date       date,                         -- parsed from filename if it contains YYYY-MM-DD
  synced_at       timestamptz default now(),
  unique (student_id, note_name)
);

create index if not exists student_notes_student_id_idx on public.student_notes (student_id);
create index if not exists student_notes_name_idx       on public.student_notes (note_name);
create index if not exists student_notes_date_idx       on public.student_notes (note_date desc);

-- ─── SUBMISSIONS ─────────────────────────────────────────────
do $$ begin
  create type submission_type as enum (
    '沟通记录',
    '录音',
    '重要comment',
    '状态更新',
    '会议',
    '其他'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.submissions (
  id                bigserial primary key,
  student_id        bigint references public.students(id) on delete set null,
  student_name_raw  text,                         -- employee's typed name (fallback for un-synced students)
  type              submission_type not null,
  submitted_at      timestamptz default now(),
  submitted_by      text,                         -- employee name
  summary           text,
  content           text,
  audio_url         text,                         -- Supabase Storage URL
  attachment_url    text,
  ai_transcript     text,                         -- filled by n8n
  ai_summary        text,                         -- filled by n8n
  processed         boolean default false,
  processed_at      timestamptz,
  processed_path    text                          -- e.g. "01_Student/刘昱彤/沟通记录/刘昱彤 规划沟通 2026-04-17.md"
);

create index if not exists submissions_processed_idx  on public.submissions (processed, submitted_at desc);
create index if not exists submissions_student_id_idx on public.submissions (student_id);
create index if not exists submissions_type_idx       on public.submissions (type);

-- ─── STORAGE BUCKET (create via Supabase Dashboard → Storage) ───
-- Bucket name: submissions
-- Access: private (we'll use signed URLs)
-- Allowed MIME types: audio/*, application/pdf, image/*, application/msword,
--                    application/vnd.openxmlformats-officedocument.*
