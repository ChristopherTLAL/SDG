// GET /internal/api/me — returns the resolved viewer or 401 anonymously.
//
// This endpoint sits under /internal/api which is gated by Cloudflare Access OTP.
// The dashboard (publicly visible) makes a client-side fetch to this URL: if the
// browser carries a valid CF Access cookie, the request flows through, middleware
// resolves the viewer, and we return their identity. Otherwise CF redirects to
// the login page (cross-origin → fetch effectively errors out → caller silently
// keeps the "登录" button).
//
// Cookies on the public dashboard request itself can't be read for identity
// (CF Access cookies are HttpOnly and only injected on protected paths). This
// endpoint is the only way to get identity from a bypassed page.

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const viewer = locals?.viewer ?? null;
  if (!viewer) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ ok: true, viewer }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  });
};
