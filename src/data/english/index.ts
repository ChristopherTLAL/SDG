// Auto-discovers any sibling YYYY-MM-DD.ts file that exports `article`.
// New articles drop in via the daily-english skill — no edits here.
import type { Article } from './types';

const modules = import.meta.glob<{ article: Article }>('./*.ts', { eager: true });
const EXCLUDE = new Set(['./types.ts', './index.ts']);

export const articles: Article[] = Object.entries(modules)
  .filter(([path]) => !EXCLUDE.has(path))
  .map(([, mod]) => mod.article)
  .filter((a): a is Article => Boolean(a))
  .sort((a, b) => b.meta.date.localeCompare(a.meta.date));

export const articlesBySlug: Record<string, Article> = Object.fromEntries(
  articles.map((a) => [a.meta.date, a]),
);

// CEFR descriptors used by the landing page and article meta.
export const CEFR_LABELS: Record<string, { tier: string; bridge: string }> = {
  A2: { tier: 'Elementary',          bridge: 'Foundation vocabulary' },
  B1: { tier: 'Lower-intermediate',  bridge: 'CET4 territory' },
  B2: { tier: 'Upper-intermediate',  bridge: 'CET6 / IELTS 6.0' },
  C1: { tier: 'Advanced',            bridge: 'IELTS 7+ / TOEFL 100+' },
  C2: { tier: 'Mastery',             bridge: 'Near-native register' },
};
