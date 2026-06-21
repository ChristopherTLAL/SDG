import { supabase } from './supabase/client';
import { buildWikilinkIndex } from '../utils/wikilinks';
import { isVIP } from '../utils/vip';

type WikilinkIndex = ReturnType<typeof buildWikilinkIndex>;

// The wikilink index (every student + every note, for resolving [[links]]) is the
// same for all viewers and rarely changes, but the three pages that render student
// markdown each used to full-scan both tables on every request. Build it once and
// cache per warm instance for a short window; newly-synced rows become linkable
// within TTL_MS. The two independent fetches run in parallel.
let cache: { index: WikilinkIndex; expiresAt: number } | null = null;
// 5 min. The vault→Supabase sync only runs every 30 min, so newly-synced rows
// being linkable a few minutes late is invisible — and a warm instance serving
// an advisor's browsing session now reuses one index instead of re-fetching
// ~2,300 rows (505 students + 1,764 notes) every 30s.
const TTL_MS = 5 * 60 * 1000;

export async function getWikilinkIndex(): Promise<WikilinkIndex> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.index;
  const [students, notes] = await Promise.all([
    supabase.from('students').select('id, name, attachments, contracts'),
    supabase.from('student_notes').select('student_id, note_name'),
  ]);
  const index = buildWikilinkIndex({
    students: (students.data ?? []).map((s: any) => ({
      id: s.id,
      name: s.name,
      attachments: s.attachments,
      isPrivate: isVIP(s.contracts),
    })),
    notes: notes.data ?? [],
  });
  cache = { index, expiresAt: now + TTL_MS };
  return index;
}
