// Book = a themed, ordered collection of chapters. Each chapter is a regular
// `Article` (so it reuses the whole learning engine) living in its own file
// under books/<id>/. Book-level metadata (cover, level, shared TTS narrator)
// lives in books/<id>/book.ts.
import type { Article } from '../types';

export interface BookMeta {
  id: string;            // folder name = URL key
  title: string;
  titleZh?: string;
  blurb: string;         // shelf + TOC description (English)
  blurbZh?: string;
  cefr: 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  cover?: string;        // /images/... path; falls back to an accent block
  accent?: string;       // theme color hex for the spine/cover
  // TTS config shared by every chapter so the narrator stays consistent.
  tts?: { voice: string; instructions: string };
}

export interface ChapterEntry {
  slug: string;          // filename without extension, e.g. "01-comeback"
  order: number;         // parsed from the NN- filename prefix
  article: Article;
}

export interface BookEntry {
  meta: BookMeta;
  chapters: ChapterEntry[];
}
