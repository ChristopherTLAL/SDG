// src/middleware.ts — resolve the CF Access viewer once per request and attach
// to Astro.locals so all internal pages can pull it without re-reading headers.
//
// CF Access does the actual auth gating (path-bypass for /internal exact, OTP for
// everything else under /internal/*). This middleware is purely about identity:
// "if a CF JWT is present, who is this person?"

import { defineMiddleware } from 'astro:middleware';
import { resolveViewer } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  // Only resolve for /internal (most cost-effective; other paths don't need it)
  if (context.url.pathname.startsWith('/internal')) {
    context.locals.viewer = await resolveViewer(context.request);
  }
  return next();
});
