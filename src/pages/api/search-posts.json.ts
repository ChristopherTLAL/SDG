import type { APIRoute } from 'astro';
import { searchPosts } from '../../lib/sanity/queries';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const rawTerm = body.q;

    if (!rawTerm || typeof rawTerm !== 'string') {
      return new Response(JSON.stringify({ error: 'Search term is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Cap term length — search terms are short; long input only amplifies the
    // full-corpus pt::text scan.
    const term = rawTerm.slice(0, 100);
    const lang = body.lang || 'en';
    const posts = await searchPosts(term, lang);
    return new Response(JSON.stringify(posts), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in search API:', error);
    if (error instanceof SyntaxError) { // Catches JSON parsing errors
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ error: 'Failed to fetch search results' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
