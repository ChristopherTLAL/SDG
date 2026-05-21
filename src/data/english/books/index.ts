// Auto-discovers books. Each subfolder of books/ is one book:
//   books/<id>/book.ts      exports `meta: BookMeta`
//   books/<id>/NN-slug.ts   each exports `article: Article` (a chapter)
// Chapter order comes from the NN- filename prefix. New chapters drop in via
// the daily-english skill (book mode); no edits needed here.
//
// NOTE: the flat daily library loader (../index.ts) globs './*.ts' which only
// matches files directly in src/data/english/, so this books/ subtree never
// pollutes the flat library and vice-versa.
import type { Article } from '../types';
import type { BookMeta, BookEntry, ChapterEntry } from './types';

const metaModules = import.meta.glob<{ meta: BookMeta }>('./*/book.ts', { eager: true });
const chapterModules = import.meta.glob<{ article: Article }>('./*/*.ts', { eager: true });

// "./giselle/01-comeback.ts" -> { folder: "giselle", file: "01-comeback" }
function parsePath(path: string): { folder: string; file: string } {
  const m = path.match(/^\.\/([^/]+)\/([^/]+)\.ts$/);
  return m ? { folder: m[1], file: m[2] } : { folder: '', file: '' };
}

const books: Record<string, BookEntry> = {};

// 1. seed each book from its manifest
for (const [path, mod] of Object.entries(metaModules)) {
  const { folder } = parsePath(path);
  if (!folder || !mod.meta) continue;
  books[folder] = { meta: mod.meta, chapters: [] };
}

// 2. attach chapters (skip the book.ts manifest and any non-article module)
for (const [path, mod] of Object.entries(chapterModules)) {
  const { folder, file } = parsePath(path);
  if (!folder || file === 'book' || !mod.article) continue;
  const book = books[folder];
  if (!book) continue;
  const order = parseInt(file.slice(0, 2), 10);
  book.chapters.push({
    slug: file,
    order: Number.isNaN(order) ? 999 : order,
    article: mod.article,
  });
}

// 3. order chapters by their NN- prefix
for (const b of Object.values(books)) {
  b.chapters.sort((a, c) => a.order - c.order);
}

export const bookEntries: BookEntry[] = Object.values(books).sort((a, b) =>
  a.meta.title.localeCompare(b.meta.title),
);
export const booksById: Record<string, BookEntry> = books;
