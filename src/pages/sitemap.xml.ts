import type { APIRoute } from 'astro';
import { getAllPostSlugs, getAllProjectSlugs, getDialogues } from '../lib/sanity/queries';

const SITE = 'https://sdg.undp.ac.cn';

const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/research', priority: '0.9', changefreq: 'daily' },
  { path: '/projects', priority: '0.8', changefreq: 'weekly' },
  { path: '/dialogues', priority: '0.8', changefreq: 'weekly' },
  { path: '/tools', priority: '0.7', changefreq: 'monthly' },
  { path: '/tools/interview', priority: '0.6', changefreq: 'monthly' },
  { path: '/tools/hku-interview', priority: '0.6', changefreq: 'monthly' },
  { path: '/tools/personality', priority: '0.6', changefreq: 'monthly' },
  { path: '/tools/budget-calculator', priority: '0.6', changefreq: 'monthly' },
  { path: '/tools/gpa-calculator', priority: '0.6', changefreq: 'monthly' },
  { path: '/tools/doc-generator', priority: '0.6', changefreq: 'monthly' },
  { path: '/publications', priority: '0.8', changefreq: 'monthly' },
  { path: '/team', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', priority: '0.5', changefreq: 'yearly' },
  { path: '/search', priority: '0.4', changefreq: 'yearly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms', priority: '0.3', changefreq: 'yearly' },
];

function urlEntry(path: string, priority: string, changefreq: string, lastmod?: string) {
  const lm = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
  return `  <url><loc>${SITE}${path}</loc>${lm}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

export const GET: APIRoute = async () => {
  const [postSlugs, projectSlugs, dialogues] = await Promise.all([
    getAllPostSlugs().catch(() => []),
    getAllProjectSlugs().catch(() => []),
    getDialogues('en').catch(() => []),
  ]);

  const urls: string[] = [];

  for (const r of staticRoutes) {
    urls.push(urlEntry(r.path, r.priority, r.changefreq));
  }

  for (const slug of postSlugs) {
    urls.push(urlEntry(`/research/${slug}`, '0.7', 'monthly'));
  }

  for (const slug of projectSlugs) {
    urls.push(urlEntry(`/projects/${slug}`, '0.6', 'monthly'));
  }

  for (const d of dialogues as any[]) {
    if (d?.slug) {
      const lm = d.date ? new Date(d.date).toISOString().split('T')[0] : undefined;
      urls.push(urlEntry(`/dialogues/${d.slug}`, '0.6', 'monthly', lm));
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};
