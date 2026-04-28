// POST /internal/api/submissions/:id/processed  { processed: boolean }
import type { APIRoute } from 'astro';
import { supabase } from '../../../../../lib/supabase/client';

export const POST: APIRoute = async ({ params, request, locals }) => {
  // Mark-processed is only meaningful from the inbox, which is admin-only.
  const viewer = locals?.viewer ?? null;
  if (!viewer || !viewer.isAdmin) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    });
  }

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return new Response('invalid id', { status: 400 });
  }
  const body = await request.json().catch(() => ({}));
  const processed = Boolean(body?.processed);

  const { error } = await supabase
    .from('submissions')
    .update({
      processed,
      processed_at: processed ? new Date().toISOString() : null,
    })
    .eq('id', id);

  if (error) {
    return new Response(error.message, { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true, id, processed }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
