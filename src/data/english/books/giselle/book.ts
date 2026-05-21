import type { BookMeta } from '../types';

export const meta: BookMeta = {
  id: 'giselle',
  title: 'Giselle: Inside aespa',
  titleZh: '走近 aespa 的 Giselle',
  blurb:
    "Read real news about aespa and Giselle, from comebacks and world tours to fashion and the AI world of KWANGYA, at an intermediate level with vocabulary, grammar, listening, and writing built in.",
  blurbZh:
    '用真实新闻读懂 aespa 与 Giselle：回归、世界巡演、时尚代言、KWANGYA 的 AI 世界。B1 难度，配生词、语法、听力与写作。',
  cefr: 'B1',
  accent: '#7c3aed', // placeholder violet; tune with the cover later
  tts: {
    voice: 'nova',
    instructions:
      'Read as a warm, friendly English teacher for a B1 (intermediate) learner. Speak at a clear, measured pace, slightly slower than natural conversation but never robotic. Use natural intonation and brief pauses at sentence boundaries. Clean, neutral accent. Encouraging tone.',
  },
};
