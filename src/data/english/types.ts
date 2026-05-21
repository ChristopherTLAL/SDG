// Schema for an article in the Daily English library.
// The future content-generation skill produces JSON conforming to this shape.

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

// Grammar example with optional translation + a teaching note.
export interface GrammarExample {
  en: string;
  zh?: string;
  note?: string;
}

export interface GrammarPoint {
  id: string;
  title: string;              // student-facing learning headline (NOT a linguistic term)
  pattern: string;            // technical schematic, shown alongside title in collapsed state
  sentenceIds: string[];
  explanationZh: string[];    // multi-paragraph deep explanation
  examples: GrammarExample[]; // 4-6 worked examples
  commonMistake?: string;     // typical errors a Chinese learner makes
  vsSimilar?: string;         // comparison with similar constructions
  adaptingTip?: string;       // optional guidance on adapting the construction
}

// Pattern example, with brief context to anchor where it would deploy.
export interface PatternExample {
  context: string;            // brief setup ("写一篇申请文书时...")
  text: string;
  zh?: string;
  note?: string;
}

export interface SentencePattern {
  id: string;
  useCase: string;            // student-facing intent ("命名一个新现象，把它装进有节奏的开篇句")
  skeleton: string;           // abstract template
  original: string;           // the article sentence
  sentenceId: string;
  whyItWorks: string[];       // multi-paragraph rhetorical analysis
  examples: PatternExample[]; // 3-5 worked examples
  adaptingTip: string;        // longer guidance about adapting to your own writing
  commonMistake?: string;
  vsSimilar?: string;         // optional comparison with a similar pattern
}

export interface QuizQuestion {
  id: string;
  q: string;
  options: string[];
  answer: number;
  explanation: string;
  sentenceId?: string;
}

// ── Listening + Writing (book chapters only) ──────────────────────────────
// The 听·填·写 flow: listen to the chapter audio, fill an info-gap table by
// extracting facts (cue in Chinese, answer in English), then use the completed
// table as a scaffold to write, reusing the chapter's own sentence patterns.

export interface InfoGapRow {
  id: string;
  cueZh: string;        // 中文提示 — what fact to find
  answer: string;       // the English value to extract from the audio/text
  sentenceId: string;   // where it is in the passage (self-check + reveal-in-text)
  prefilled?: boolean;  // given as a worked example
}

export interface WritingTask {
  promptZh: string;
  promptEn: string;
  targetWords: number;
  starters?: string[];        // sentence openers to scaffold the response
  usePatternIds?: string[];   // patterns from THIS article the student should reuse
  modelAnswer: string;        // revealed after the student attempts
  modelAnswerZh?: string;
}

export interface ListeningWriting {
  infoGap: InfoGapRow[];
  writing: WritingTask;
}

export interface ArticleMeta {
  date: string;
  title: string;
  titleZh?: string;             // short Chinese subtitle, shown on the card and at the top of the article page
  cefr: 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  wordCount: number;
  readingMinutes: number;
  editorsNote?: string;
  audioUrl?: string;            // hosted MP3 narration (book chapters); flat articles omit it
}

export interface Article {
  meta: ArticleMeta;
  paragraphs: Paragraph[];
  vocab: VocabEntry[];
  collocations: Collocation[];
  grammar: GrammarPoint[];
  patterns: SentencePattern[];
  quiz: QuizQuestion[];
  listeningWriting?: ListeningWriting;   // book chapters only
}
