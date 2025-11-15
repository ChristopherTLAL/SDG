import type { APIRoute } from 'astro';
import { getAllPosts } from '../../lib/sanity/queries';

export const GET: APIRoute = async ({ request }) => {
  const posts = await getAllPosts();
  return new Response(JSON.stringify(posts), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
