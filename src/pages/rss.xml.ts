import type { APIRoute } from 'astro';
import { getLatestPosts } from '../lib/sanity/queries';

const SITE = 'https://sdg.undp.ac.cn';

// Wrap text in CDATA, splitting any literal "]]>" so it can't terminate the section early.
const cdata = (s: string) => `<![CDATA[${String(s ?? '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

export const GET: APIRoute = async () => {
  const posts = await getLatestPosts('en', 20);

  const items = posts.map((p: any) => {
    const title = typeof p.title === 'string' ? p.title : p.title?.en || '';
    const excerpt = typeof p.excerpt === 'string' ? p.excerpt : p.excerpt?.en || '';
    return `
    <item>
      <title>${cdata(title)}</title>
      <link>${SITE}/research/${p.slug}</link>
      <guid>${SITE}/research/${p.slug}</guid>
      <pubDate>${new Date(p.publishedAt || Date.now()).toUTCString()}</pubDate>
      <description>${cdata(excerpt)}</description>
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>Chinese SDGs Institute — News &amp; Research</title>
      <link>${SITE}/</link>
      <description>Critical analysis, scientific breakthroughs, and policy frameworks driving sustainable development.</description>
      ${items}
    </channel>
  </rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
};
