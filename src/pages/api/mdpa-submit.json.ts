import type { APIRoute } from 'astro';
import { writeClient } from '../../lib/sanity/writeClient';

// Simple in-memory rate limiter: max 5 submissions per IP per hour
const rateMap = new Map<string, number[]>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateMap.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) return true;
  timestamps.push(now);
  rateMap.set(ip, timestamps);
  return false;
}

// Generate a URL-safe random ID (12 chars)
function generateId(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789'; // no ambiguous chars
  let id = '';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 12; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return id;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    if (isRateLimited(ip)) {
      return new Response(JSON.stringify({ error: 'Too many submissions. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.analysis || !body.analysis.mbti || !body.analysis.lambda_cal) {
      return new Response(JSON.stringify({ error: 'Invalid result data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const resultId = generateId();
    const a = body.analysis;

    // Compute N score from clusters
    const cls = a.n_clusters || {};
    let nTotal = 0, nN = 0;
    for (const k of Object.keys(cls)) {
      nTotal += cls[k].t || 0;
      nN += cls[k].n || 0;
    }
    const nRatio = nTotal > 0 ? nN / nTotal : 0.5;

    // Sanitize student info (trim, limit length)
    const studentName = typeof body.studentName === 'string' ? body.studentName.trim().slice(0, 100) : '';
    const studentEmail = typeof body.studentEmail === 'string' ? body.studentEmail.trim().slice(0, 200) : '';
    const studentBackground = typeof body.studentBackground === 'string' ? body.studentBackground.trim().slice(0, 2000) : '';

    // Build document — only store computed scores, not raw question text
    const doc = {
      _type: 'mdpaResult',
      resultId,
      completedAt: body.time || new Date().toISOString(),
      studentName: studentName || undefined,
      studentEmail: studentEmail || undefined,
      studentBackground: studentBackground || undefined,
      mbtiType: a.mbti.type,
      mbtiStrength: a.mbti.strength,
      ocean: {
        O: round(a.lambda_cal.O),
        C: round(a.lambda_cal.C),
        E: round(a.lambda_cal.E),
        A: round(a.lambda_cal.A),
        N: round(nRatio), // 0-1 scale
      },
      oceanRaw: {
        O: round(a.lambda_raw?.O),
        C: round(a.lambda_raw?.C),
        E: round(a.lambda_raw?.E),
        A: round(a.lambda_raw?.A),
      },
      nClusters: {
        ar: round(cls.ar?.r),
        sv: round(cls.sv?.r),
        er: round(cls.er?.r),
      },
      avAdjustments: a.av_adjustments || {},
      qualityChecks: body.qc || [],
      rawResponses: JSON.stringify(body.responses || []),
      totalQuestions: Array.isArray(body.responses) ? body.responses.length : 0,
      durationSeconds: typeof body.durationSeconds === 'number' ? body.durationSeconds : null,
    };

    await writeClient.create(doc);

    return new Response(JSON.stringify({ resultId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('MDPA submit error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save result' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

function round(v: any): number {
  if (v === undefined || v === null) return 0;
  return Math.round(Number(v) * 1000) / 1000;
}
