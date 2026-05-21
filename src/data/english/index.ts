// Auto-discovers any sibling .ts file that exports `article`.
// The FILENAME is the slug (URL key). The article's `meta.date` is the real
// news event date the article reports on, and may differ from the filename.
// New articles drop in via the daily-english skill — no edits here.
import type { Article } from './types';

const modules = import.meta.glob<{ article: Article }>('./*.ts', { eager: true });
const EXCLUDE = new Set(['./types.ts', './index.ts']);

export interface ArticleEntry {
  slug: string;     // filename without extension; the URL key
  article: Article; // article.meta.date is the real news date
}

const filenameOf = (path: string): string => path.replace(/^\.\//, '').replace(/\.ts$/, '');

const entries: ArticleEntry[] = Object.entries(modules)
  .filter(([path]) => !EXCLUDE.has(path))
  .map(([path, mod]) => ({ slug: filenameOf(path), article: mod.article }))
  .filter((e) => Boolean(e.article))
  // Sort newest-first by the article's actual news date.
  .sort((a, b) => b.article.meta.date.localeCompare(a.article.meta.date));

export const articles: Article[] = entries.map((e) => e.article);
export const articleEntries: ArticleEntry[] = entries;
export const articlesBySlug: Record<string, Article> = Object.fromEntries(
  entries.map((e) => [e.slug, e.article]),
);
export const slugByMetaDate: Record<string, string> = Object.fromEntries(
  entries.map((e) => [e.article.meta.date, e.slug]),
);

// CEFR_LABELS moved to ./cefr.ts — importing it from here would pull this
// eager-glob module (every article) into the importer's bundle.
