import type { APIRoute } from 'astro';
import { getLatestPosts } from '../lib/sanity/queries';

export const GET: APIRoute = async () => {
  const posts = await getLatestPosts('en', 20);

  const items = posts.map((p: any) => {
    const title = typeof p.title === 'string' ? p.title : p.title?.en || '';
    const excerpt = typeof p.excerpt === 'string' ? p.excerpt : p.excerpt?.en || '';
    return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>https://sdg.undp.ac.cn/research/${p.slug}</link>
      <guid>https://sdg.undp.ac.cn/research/${p.slug}</guid>
      <pubDate>${new Date(p.publishedAt || Date.now()).toUTCString()}</pubDate>
      <description><![CDATA[${excerpt}]]></description>
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>Chinese SDGs Institute — News &amp; Research</title>
      <link>https://sdg.undp.ac.cn/</link>
      <description>Critical analysis, scientific breakthroughs, and policy frameworks driving sustainable development.</description>
      ${items}
    </channel>
  </rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
};
