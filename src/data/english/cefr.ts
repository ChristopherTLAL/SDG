// CEFR descriptors used by the English landing page + article meta.
// Deliberately in its own module (not english/index.ts): index.ts eager-globs
// every article, so importing CEFR_LABELS from there would drag the whole
// article corpus into the bundle. Keep this leaf-light so SSR pages can import
// it freely. See the 2026-05-21 serverless-function bloat fix.
export const CEFR_LABELS: Record<string, { tier: string; bridge: string }> = {
  A2: { tier: 'Elementary',          bridge: 'Foundation vocabulary' },
  B1: { tier: 'Lower-intermediate',  bridge: 'CET4 territory' },
  B2: { tier: 'Upper-intermediate',  bridge: 'CET6 / IELTS 6.0' },
  C1: { tier: 'Advanced',            bridge: 'IELTS 7+ / TOEFL 100+' },
  C2: { tier: 'Mastery',             bridge: 'Near-native register' },
};
