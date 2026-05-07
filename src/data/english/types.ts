// Schema for a daily English-learning article.
// The future content-generation skill produces JSON conforming to this shape.

export type VocabLevel = 'CET4' | 'CET6' | 'IELTS' | 'GRE';

export interface Sentence {
  id: string;          // stable per-article ID, e.g. "s7"
  en: string;
  zh: string;
}

export interface Paragraph {
  id: string;          // e.g. "p1"
  sentences: Sentence[];
}

export interface VocabEntry {
  id: string;          // unique per-article ID, e.g. "v3"
  word: string;        // surface form as it appears in the article (case-preserved)
  lemma: string;       // dictionary form, lowercase
  sentenceId: string;  // sentence the word appears in
  level: VocabLevel;
  pos: string;         // "n." / "v." / "adj." etc.
  ipa: string;         // "/ˈwɜːrd/"
  defZh: string;
  defEn: string;
  example: string;     // a fresh example sentence (NOT the article sentence)
  exampleZh?: string;
}

export interface Collocation {
  id: string;
  phrase: string;       // "take into account"
  sentenceId: string;
  meaningZh: string;
  example: string;
  exampleZh?: string;
}

export interface GrammarPoint {
  id: string;
  title: string;        // short label, e.g. "What-cleft for emphasis"
  pattern: string;      // schematic, e.g. "What [clause] is/was [emphasis]"
  explanationZh: string;
  sentenceIds: string[]; // sentences in the article that exemplify this point
  examples: string[];    // 1-2 extra examples outside the article
}

export interface SentencePattern {
  id: string;
  skeleton: string;     // "X has emerged around the simple act of [verb-ing]"
  original: string;     // the article sentence
  sentenceId: string;
  hint: string;         // when/how to deploy this in your own writing
}

export interface QuizQuestion {
  id: string;
  q: string;
  options: string[];          // length 4
  answer: number;             // 0-indexed
  explanation: string;
  sentenceId?: string;        // sentence to highlight as evidence
}

export interface ArticleMeta {
  date: string;        // "2026-05-07"
  title: string;
  source: { name: string; url: string };
  cefr: 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  wordCount: number;
  readingMinutes: number;
  editorsNote?: string;
}

export interface Article {
  meta: ArticleMeta;
  paragraphs: Paragraph[];
  vocab: VocabEntry[];
  collocations: Collocation[];
  grammar: GrammarPoint[];
  patterns: SentencePattern[];
  quiz: QuizQuestion[];
}
