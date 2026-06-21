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
import { createRemoteJWKSet, jwtVerify } from 'jose';

// ── Cloudflare Access JWT verification ──────────────────────────────────────
// The custom domain (sdg.undp.ac.cn) is gated by CF Access, but the raw Vercel
// origin (*.vercel.app) is NOT — so without verifying CF's signed assertion,
// anyone hitting the origin directly could forge the Cf-Access-Authenticated-
// User-Email header and impersonate any user (confirmed exploitable 2026-06-21).
// We verify the Cf-Access-Jwt-Assertion against the team's public keys (JWKS);
// a forged email header with no CF-signed JWT is rejected. Team domain `sw985`
// is stable and hardcoded so a missing env var can never lock everyone out.
const JWKS = createRemoteJWKSet(
  new URL('https://sw985.cloudflareaccess.com/cdn-cgi/access/certs'),
);
// Optional hardening: the /internal/* CF app's AUD tag is
// cd69c115452f22e75a5e0ad7e4c1bdd73419527aee96bf12e6a99e40481d8522 — set
// CF_AUD to additionally pin the audience claim (signature+exp already suffice).
const CF_AUD: string | undefined = undefined;

export type Viewer = {
  email: string;
  name: string;        // advisor display name from advisors table, or email-prefix fallback
  isAdmin: boolean;
  isAdvisor: boolean;  // true iff email matched a row in the advisors table
};

// In-memory cache so we don't hit Supabase on every request (per warm Vercel
// instance). TTL is deliberately short: it bounds how long a *demoted* admin —
// or a removed advisor — keeps stale privileges after the change lands in
// Supabase. 60s is a negligible query load at this scale.
const CACHE = new Map<string, { viewer: Viewer | null; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000;

function cleanEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  return s.length ? s : null;
}

export async function resolveViewer(request: Request): Promise<Viewer | null> {
  const email = cleanEmail(request.headers.get('cf-access-authenticated-user-email'));
  if (!email) return null;

  // The email header is only trustworthy if backed by a CF-signed JWT. CF Access
  // always pairs the two on a gated path; a direct origin hit has neither a valid
  // assertion nor (legitimately) the email header. Reject anything unverifiable.
  const assertion = request.headers.get('cf-access-jwt-assertion');
  if (!assertion) return null;
  try {
    const { payload } = await jwtVerify(assertion, JWKS, CF_AUD ? { audience: CF_AUD } : {});
    const jwtEmail = cleanEmail(typeof payload.email === 'string' ? payload.email : undefined);
    if (!jwtEmail || jwtEmail !== email) return null;
  } catch {
    return null;
  }

  const cached = CACHE.get(email);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.viewer;

  const { data: advisorRow } = await supabase
    .from('advisors')
    .select('name, is_admin, active')
    .contains('emails', [email])
    .maybeSingle();

  let viewer: Viewer;
  // An advisor row matches AND active is not explicitly false → full advisor.
  // active=false (former / off-boarded advisor) → demote to guest viewer:
  // CF Access already authenticated them via the xdf.cn wildcard or OTP, but
  // they no longer get advisor privileges (submit / 私单 visibility / caseload
  // attribution). This is the auth-layer enforcement of vault YAML `active`.
  if (advisorRow && advisorRow.active !== false) {
    viewer = {
      email,
      name: advisorRow.name,
      isAdmin: !!advisorRow.is_admin,
      isAdvisor: true,
    };
  } else {
    // Authenticated XDF colleague with no (or inactive) advisor row — guest viewer.
    // They see the dashboard and roster (with 私单 hidden) but can't submit etc.
    viewer = {
      email,
      name: advisorRow ? advisorRow.name : email.split('@')[0],
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
