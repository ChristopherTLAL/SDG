import type { APIRoute } from 'astro';
import { getResearchPosts } from '../../lib/sanity/queries';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const lang = url.searchParams.get('lang') || 'en';
  const posts = await getResearchPosts(lang);
  return new Response(JSON.stringify(posts), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
