// Schema for an article in the Daily English library.
// The future content-generation skill produces JSON conforming to this shape.
//
// VocabLevel is a numeric tier scoped to each article: 1 = the easiest words
// in this article, 4 = the hardest. The reader UI lets a user pick a level
// floor and highlights all words at or above it (e.g. picking Level 2 keeps
// shades on Level 2-4 words, hides Level 1).

export type VocabLevel = 1 | 2 | 3 | 4;

export interface Sentence {
  id: string;
  en: string;
  zh: string;
}

export interface Paragraph {
  id: string;
  sentences: Sentence[];
}

export interface VocabEntry {
  id: string;
  word: string;
  lemma: string;
  sentenceId: string;
  level: VocabLevel;
  pos: string;
  ipa: string;
  defZh: string;
  defEn: string;
  example: string;
  exampleZh?: string;
}

export interface Collocation {
  id: string;
  phrase: string;
  sentenceId: string;
  meaningZh: string;
  example: string;
  exampleZh?: string;
}

export interface GrammarPoint {
  id: string;
  title: string;
  pattern: string;
  explanationZh: string;
  sentenceIds: string[];
  examples: string[];
}

export interface SentencePattern {
  id: string;
  skeleton: string;
  original: string;
  sentenceId: string;
  hint: string;
}

export interface QuizQuestion {
  id: string;
  q: string;
  options: string[];
  answer: number;
  explanation: string;
  sentenceId?: string;
}

export interface ArticleMeta {
  date: string;
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
