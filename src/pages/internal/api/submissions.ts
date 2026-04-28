// POST /internal/api/submissions — create a new submission row
// Protected by Cloudflare Access (the whole /internal/* path is).
//
// Audio uploads are intentionally disabled to keep us inside Supabase's free
// 1 GB storage tier. PDF/Word/image attachments are still allowed.

import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase/client';

const BUCKET = 'submissions';

async function uploadFile(file: File, subdir: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const key = `${subdir}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (error) {
    console.error(`[submissions] upload failed for ${file.name}:`, error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Return the bucket-relative path; we'll mint signed URLs on the read side.
  return key;
}

export const POST: APIRoute = async ({ request, locals }) => {
  // Submit is for advisors and admin only. XDF guests (any @xdf.cn that isn't
  // in the advisors table) can pass CF Access but can't post here.
  const viewer = locals?.viewer ?? null;
  if (!viewer || (!viewer.isAdvisor && !viewer.isAdmin)) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const fd = await request.formData();

    const studentIdRaw = fd.get('student_id')?.toString().trim() ?? '';
    const studentNameRaw = fd.get('student_name_raw')?.toString().trim() || null;
    const type = fd.get('type')?.toString().trim();
    const submittedBy = fd.get('submitted_by')?.toString().trim() || null;
    const summary = fd.get('summary')?.toString().trim() || null;
    const content = fd.get('content')?.toString().trim() || null;

    const attachFile = fd.get('attachment') as File | null;

    if (!type) {
      return new Response(JSON.stringify({ error: 'type is required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (type === '录音') {
      return new Response(JSON.stringify({ error: '录音上传已停用' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (!studentIdRaw) {
      return new Response(JSON.stringify({ error: 'student_id is required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    let studentId: number | null = null;
    let nameRaw = studentNameRaw;

    if (studentIdRaw === '__new__') {
      if (!nameRaw) {
        return new Response(JSON.stringify({ error: '新客需要填姓名' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        });
      }
      // Don't auto-insert into students — Shijie builds the file in Obsidian then runs sync.
      // We just store student_name_raw for now.
    } else {
      studentId = Number(studentIdRaw);
      if (!Number.isFinite(studentId)) {
        return new Response(JSON.stringify({ error: 'invalid student_id' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        });
      }
    }

    let attachmentUrl: string | null = null;
    if (attachFile && attachFile.size > 0) {
      attachmentUrl = await uploadFile(attachFile, 'attachment');
    }

    const { data, error } = await supabase
      .from('submissions')
      .insert({
        student_id: studentId,
        student_name_raw: nameRaw,
        type,
        submitted_by: submittedBy,
        summary,
        content,
        attachment_url: attachmentUrl,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[submissions] insert failed:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ id: data.id }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[submissions] unhandled error:', err);
    return new Response(
      JSON.stringify({ error: err.message ?? 'unknown error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
};
