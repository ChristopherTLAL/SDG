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

import { supabase } from './supabase/client';

export type Viewer = {
  email: string;
  name: string;        // advisor display name from advisors table
  isAdmin: boolean;
};

const ADMIN_EMAIL = 'wangshijie11@xdf.cn';

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

  // Local dev / no CF in front: optional bypass via env (only for development convenience).
  // Don't enable in prod — CF Access is the source of truth.

  const cached = CACHE.get(email);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.viewer;

  const { data } = await supabase
    .from('advisors')
    .select('name, email, is_admin')
    .ilike('email', email)
    .maybeSingle();

  let viewer: Viewer | null = null;
  if (data) {
    viewer = {
      email,
      name: data.name,
      isAdmin: !!data.is_admin || email === ADMIN_EMAIL,
    };
  } else {
    // Email passed CF Access but isn't in our advisors table — still a verified
    // employee per CF policy, so let them in but with a generic display label.
    viewer = {
      email,
      name: email.split('@')[0],
      isAdmin: email === ADMIN_EMAIL,
    };
  }

  CACHE.set(email, { viewer, expiresAt: now + CACHE_TTL_MS });
  return viewer;
}

// Convenience: did this viewer log in (vs. anonymous dashboard visitor)
export function isAuthed(viewer: Viewer | null): viewer is Viewer {
  return viewer !== null;
}
