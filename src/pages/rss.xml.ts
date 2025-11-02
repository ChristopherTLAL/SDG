import type { APIRoute } from 'astro';
import { client } from '../lib/sanity/client';
import { LATEST_POSTS_QUERY } from '../lib/sanity/queries';

export const GET: APIRoute = async () => {
  const posts = await client.fetch(LATEST_POSTS_QUERY);

  const items = posts.map((p: any) => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>https://YOUR_DOMAIN/${p.slug}</link>
      <guid>https://YOUR_DOMAIN/${p.slug}</guid>
      <pubDate>${new Date(p.publishedAt || Date.now()).toUTCString()}</pubDate>
      <description><![CDATA[${p.excerpt || ''}]]></description>
    </item>
  `).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>Your Intercept-like News</title>
      <link>https://YOUR_DOMAIN/</link>
      <description>Independent journalism</description>
      ${items}
    </channel>
  </rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
};
