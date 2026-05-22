// src/data/decks-meta.ts — Deck (slide) knowledge base metadata. Mirrors guides-meta.ts.
//
// Auth model (decided 2026-05-21): the CATALOG lives at /internal/decks (Cloudflare
// Access gated — only advisors see what exists + how it's organized). Each DECK opens
// at a PUBLIC url /decks/<id> whose `id` is an unguessable random slug (share-with-client
// friendly; noindex). Deck CONTENT lives at public/decks/<id>/ — deck.pdf (pdf) or
// index.html + assets (html). Adding a deck = drop the folder + add one entry here.
//
// Taxonomy is 2-level like the english tool: stage (前期/中期/后期) → theme.

export type DeckStage = '前期' | '中期' | '后期';
export type DeckFormat = 'pdf' | 'html';

export interface Deck {
  id: string;            // unguessable slug = public URL key AND public/decks/<id>/ folder name
  title: string;
  titleEn?: string;
  stage: DeckStage;
  theme: string;         // 2nd-level category (must be one of DECK_THEMES[stage])
  format: DeckFormat;    // 'pdf' → /decks/<id>/deck.pdf ; 'html' → /decks/<id>/index.html
  cover?: string;        // /images/... thumbnail; falls back to an accent block
  summary?: string;
  updated?: string;      // YYYY-MM-DD
  placeholder?: boolean; // true = no real content yet; viewer shows a 16:9 placeholder
}

// Proposed theme taxonomy — EDIT FREELY. Level 1 fixed (前期/中期/后期), level 2 open.
export const DECK_THEMES: Record<DeckStage, string[]> = {
  前期: ['留学规划入门', '专业与职业探索', '背景提升', '时间线与节奏'],
  中期: ['选校定位', '文书策略', '推荐信', '面试准备', '标化与语言'],
  后期: ['Offer 解读与决策', '签证指南', '行前准备', '入学与适应'],
};

export const STAGE_ORDER: DeckStage[] = ['前期', '中期', '后期'];

export const decks: Deck[] = [
  { id: 'demo-html-2b8e1d4f', title: '示例 · HTML Deck（占位）', stage: '前期', theme: '留学规划入门', format: 'html', summary: '占位：交互式 HTML deck 会嵌在这里', updated: '2026-05-21', placeholder: true },
  { id: 'demo-pdf-7f3a9c2e',  title: '示例 · PDF Deck（占位）',  stage: '中期', theme: '选校定位',     format: 'pdf',  summary: '占位：PDF deck 会嵌在这里',        updated: '2026-05-21', placeholder: true },
];

export const getDeckById = (id: string): Deck | undefined => decks.find((d) => d.id === id);

// decks grouped stage → theme → Deck[], for the catalog page.
export function decksByStageTheme(): Record<DeckStage, Record<string, Deck[]>> {
  const out = {} as Record<DeckStage, Record<string, Deck[]>>;
  for (const stage of STAGE_ORDER) {
    out[stage] = {};
    for (const theme of DECK_THEMES[stage]) out[stage][theme] = [];
  }
  for (const d of decks) {
    (out[d.stage] ??= {} as Record<string, Deck[]>);
    (out[d.stage][d.theme] ??= []).push(d);
  }
  return out;
}
