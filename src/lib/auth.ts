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
  name: string;        // advisor display name from advisors table, or email-prefix fallback
  isAdmin: boolean;
  isAdvisor: boolean;  // true iff email matched a row in the advisors table
};

// Hardcoded admin emails. The xdf.cn one is 王世杰's work email; the outlook
// one is his personal account, used as a permanent escape hatch when the
// XDF email gateway prefetches CF OTP magic links and burns the PIN before
// he can use it. Both resolve to the same admin identity (王世杰).
const ADMIN_EMAILS = new Set<string>([
  'wangshijie11@xdf.cn',
  'christophertlal@outlook.com',
]);

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

  const isHardcodedAdmin = ADMIN_EMAILS.has(email);

  // Try direct email match first.
  let advisorRow: { name: string; is_admin: boolean | null } | null = null;
  {
    const { data } = await supabase
      .from('advisors')
      .select('name, is_admin')
      .ilike('email', email)
      .maybeSingle();
    advisorRow = data;
  }

  // Hardcoded admin with no email match (e.g. christophertlal@outlook.com,
  // which isn't in the advisors table) → look up the admin-flagged advisor
  // row so display name reads "王世杰" rather than "christophertlal".
  if (!advisorRow && isHardcodedAdmin) {
    const { data } = await supabase
      .from('advisors')
      .select('name, is_admin')
      .eq('is_admin', true)
      .limit(1)
      .maybeSingle();
    advisorRow = data;
  }

  let viewer: Viewer;
  if (advisorRow) {
    viewer = {
      email,
      name: advisorRow.name,
      isAdmin: !!advisorRow.is_admin || isHardcodedAdmin,
      // If we resolved an admin row via the hardcoded-admin fallback, the
      // viewer is acting AS the admin advisor — give them advisor-tier
      // access posture too (submit / inbox / daily reports all open).
      isAdvisor: true,
    };
  } else {
    // Authenticated XDF colleague with no advisor row — guest viewer. They
    // see the dashboard and roster (with 私单 hidden) but can't submit etc.
    viewer = {
      email,
      name: email.split('@')[0],
      isAdmin: isHardcodedAdmin,
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
