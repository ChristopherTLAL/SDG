import { supabase } from './supabase/client';
import { buildWikilinkIndex } from '../utils/wikilinks';

type WikilinkIndex = ReturnType<typeof buildWikilinkIndex>;

const PRIVATE_CONTRACTS = ['私单', '私单（非公司合同）'];

// The wikilink index (every student + every note, for resolving [[links]]) is the
// same for all viewers and rarely changes, but the three pages that render student
// markdown each used to full-scan both tables on every request. Build it once and
// cache per warm instance for a short window; newly-synced rows become linkable
// within TTL_MS. The two independent fetches run in parallel.
let cache: { index: WikilinkIndex; expiresAt: number } | null = null;
const TTL_MS = 30 * 1000;

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
      isPrivate: Array.isArray(s.contracts) && s.contracts.some((c: string) => PRIVATE_CONTRACTS.includes(c)),
    })),
    notes: notes.data ?? [],
  });
  cache = { index, expiresAt: now + TTL_MS };
  return index;
}
