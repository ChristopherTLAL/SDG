// Supabase clients for /internal dashboard.
// Service-role key is used for all server-side reads/writes.
// Client-side code must never import this file directly — always go through
// the Astro API routes under /internal/api/*.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.SUPABASE_URL;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.warn('[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — /internal will not work');
}

export const supabase: SupabaseClient = createClient(
  url ?? '',
  serviceKey ?? '',
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);

// ── Types matching the schema ────────────────────────────────
export type Student = {
  id: number;
  name: string;
  enroll_year: string | null;
  stage: string | null;
  contract_type: string | null;
  major_intention: string | null;
  current_school: string | null;
  early_advisor: string | null;
  mid_advisor: string | null;
  last_contact_at: string | null; // YYYY-MM-DD
  obsidian_path: string | null;
  tags: string[];
  synced_at: string;
  created_at: string;
};

export type SubmissionType =
  | '沟通记录'
  | '录音'
  | '重要comment'
  | '状态更新'
  | '会议'
  | '其他';

export type Submission = {
  id: number;
  student_id: number | null;
  student_name_raw: string | null;
  type: SubmissionType;
  submitted_at: string;
  submitted_by: string | null;
  summary: string | null;
  content: string | null;
  audio_url: string | null;
  attachment_url: string | null;
  ai_transcript: string | null;
  ai_summary: string | null;
  processed: boolean;
  processed_at: string | null;
  processed_path: string | null;
};
