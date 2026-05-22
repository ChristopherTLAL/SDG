// src/data/decks-meta.ts — Deck (slide) knowledge base metadata. Mirrors guides-meta.ts.
//
// Auth model (decided 2026-05-21): the CATALOG lives at /internal/decks (Cloudflare
// Access gated — only advisors see what exists + how it's organized). Each DECK opens
// at a PUBLIC url /decks/<id> whose `id` is an unguessable random slug (share-with-client
// friendly; noindex). Deck CONTENT lives at public/deck-files/<id>/ — deck.pdf (pdf) or
// index.html + assets (html). (Under /deck-files/ NOT /decks/: /decks/<id> is the
// prerendered viewer route, whose index.html would collide with an HTML deck's.)
// Adding a deck = drop the folder in public/deck-files/ + add one entry here.
//
// Taxonomy is 2-level like the english tool: stage (前期/中期/后期) → theme.

export type DeckStage = '前期' | '中期' | '后期' | '补充知识';
export type DeckFormat = 'pdf' | 'html';

export interface Deck {
  id: string;            // unguessable slug = public URL key AND public/decks/<id>/ folder name
  title: string;
  titleEn?: string;
  stage: DeckStage;
  theme: string;         // 2nd-level category (must be one of DECK_THEMES[stage])
  format: DeckFormat;    // 'pdf' → deck.pdf ; 'html' → index.html
  srcUrl?: string;       // if set, viewer embeds this URL directly (e.g. a Supabase Storage PDF) instead of /deck-files/<id>/
  cover?: string;        // /images/... thumbnail; falls back to an accent block
  summary?: string;
  updated?: string;      // YYYY-MM-DD
  placeholder?: boolean; // true = no real content yet; viewer shows a 16:9 placeholder
}

// Proposed theme taxonomy — EDIT FREELY. Level 1 fixed (前期/中期/后期), level 2 open.
export const DECK_THEMES: Record<DeckStage, string[]> = {
  前期: ['留学规划入门', '专业与职业探索', '背景提升', '时间线与节奏'],
  中期: ['选校定位', '文书策略', '推荐信', '面试准备', '标化与语言', '课程与考试局'],
  后期: ['Offer 解读与决策', '签证指南', '行前准备', '入学与适应', '名校申请', '转学', '面试辅导'],
  补充知识: ['背景提升', '夏校', '考研后申请', '设计参考'],
};

export const STAGE_ORDER: DeckStage[] = ['前期', '中期', '后期', '补充知识'];

// PDF decks are hosted on Supabase Storage (public bucket `decks`), NOT in git —
// course PDFs are tens of MB. Pending: 2 PDFs (剑桥 Advanced Diploma 68MB / 约翰洛克
// 夏校 71MB) exceed the 50MB Storage limit (raise limit or compress); 2 PPTX (中外合办 /
// 西浦 SURF) need PDF conversion before they can be embedded.
const SB = 'https://sdcubejyamnghhhxzvco.supabase.co/storage/v1/object/public/decks';
export const decks: Deck[] = [
  { id: 'alevel-boards-9c4f2a1b', title: '国际版 A-Level 三大考试局合分机制深度解析', titleEn: 'CAIE · Edexcel · OxfordAQA', stage: '中期', theme: '课程与考试局', format: 'html', summary: '交互对比矩阵 + 三局可展开深读（HTML 试做版）', updated: '2026-05-22' },
  { id: 'alevel-boards-pdf-3f1a', title: 'A-Level 三大考试局合分（PDF 原版）', stage: '中期', theme: '课程与考试局', format: 'pdf', srcUrl: `${SB}/alevel-boards-pdf-3f1a.pdf`, summary: 'PPT 原版导出,可与上面 HTML 试做版对照', updated: '2026-02-19' },
  { id: 'hku-mero-apply-8b2c', title: '港大多元卓越申请 26', stage: '后期', theme: '名校申请', format: 'pdf', srcUrl: `${SB}/hku-mero-apply-8b2c.pdf`, updated: '2026-03-19' },
  { id: 'hku-interview-7c4f', title: '港大多元卓越面试辅导 26', stage: '后期', theme: '面试辅导', format: 'pdf', srcUrl: `${SB}/hku-interview-7c4f.pdf`, updated: '2026-03-15' },
  { id: 'ug-transfer-1d9e', title: '英美本科转学', stage: '后期', theme: '转学', format: 'pdf', srcUrl: `${SB}/ug-transfer-1d9e.pdf`, updated: '2026-02-22' },
  { id: 'postgrad-global-5a2b', title: '考研后全球申请 26', stage: '补充知识', theme: '考研后申请', format: 'pdf', srcUrl: `${SB}/postgrad-global-5a2b.pdf`, updated: '2026-02-28' },
  { id: 'color-design-9e6d', title: '颜色与设计', stage: '补充知识', theme: '设计参考', format: 'pdf', srcUrl: `${SB}/color-design-9e6d.pdf`, updated: '2026-03-15' },
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
