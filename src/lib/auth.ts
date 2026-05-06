// Auth helper — identifies the logged-in advisor via the Cloudflare Access JWT
// header set by the upstream gateway. Returns null for anonymous (dashboard) visitors.
//
// CF Access injects two headers when a request passes its policy:
//   Cf-Access-Authenticated-User-Email    — the verified email
//   Cf-Access-Jwt-Assertion               — full JWT (we don't need to verify locally
//                                            since CF already did)
//
// We trust the email header as long as the request came through CF. Public dashboard
// path is exempted in CF Access config, so requests there have no header → anonymous.
//
// Identity resolution: each advisor row in `advisors` has an `emails text[]` column
// (synced from the vault YAML `邮箱` field, which accepts a single string or a list).
// We match the CF email against any element of that array — so 王世杰 logging in via
// his outlook fallback resolves to the same advisor row as his xdf email.

import { supabase } from './supabase/client';

export type Viewer = {
  email: string;
  name: string;        // advisor display name from advisors table, or email-prefix fallback
  isAdmin: boolean;
  isAdvisor: boolean;  // true iff email matched a row in the advisors table
};

// In-memory cache so we don't hit Supabase on every request.
// 5-minute TTL is fine — if a name changes via vault sync, refresh kicks in soon.
const CACHE = new Map<string, { viewer: Viewer | null; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function cleanEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  return s.length ? s : null;
}

export async function resolveViewer(request: Request): Promise<Viewer | null> {
  const email = cleanEmail(request.headers.get('cf-access-authenticated-user-email'));
  if (!email) return null;

  const cached = CACHE.get(email);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.viewer;

  const { data: advisorRow } = await supabase
    .from('advisors')
    .select('name, is_admin')
    .contains('emails', [email])
    .maybeSingle();

  let viewer: Viewer;
  if (advisorRow) {
    viewer = {
      email,
      name: advisorRow.name,
      isAdmin: !!advisorRow.is_admin,
      isAdvisor: true,
    };
  } else {
    // Authenticated XDF colleague with no advisor row — guest viewer. They
    // see the dashboard and roster (with 私单 hidden) but can't submit etc.
    viewer = {
      email,
      name: email.split('@')[0],
      isAdmin: false,
      isAdvisor: false,
    };
  }

  CACHE.set(email, { viewer, expiresAt: now + CACHE_TTL_MS });
  return viewer;
}

// Convenience: did this viewer log in (vs. anonymous dashboard visitor)
export function isAuthed(viewer: Viewer | null): viewer is Viewer {
  return viewer !== null;
}
