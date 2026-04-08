// MDPA Report display constants

export const DIMENSION_COLORS: Record<string, { bg: string; text: string; accent: string; light: string }> = {
  O: { bg: 'bg-amber-50', text: 'text-amber-800', accent: 'border-amber-500', light: 'bg-amber-100' },
  C: { bg: 'bg-blue-50', text: 'text-blue-800', accent: 'border-blue-500', light: 'bg-blue-100' },
  E: { bg: 'bg-rose-50', text: 'text-rose-800', accent: 'border-rose-500', light: 'bg-rose-100' },
  A: { bg: 'bg-green-50', text: 'text-green-800', accent: 'border-green-500', light: 'bg-green-100' },
  N: { bg: 'bg-purple-50', text: 'text-purple-800', accent: 'border-purple-500', light: 'bg-purple-100' },
}

export const DIMENSION_LABELS: Record<string, { zh: string; en: string }> = {
  O: { zh: '开放性', en: 'Openness' },
  C: { zh: '尽责性', en: 'Conscientiousness' },
  E: { zh: '外向性', en: 'Extraversion' },
  A: { zh: '宜人性', en: 'Agreeableness' },
  N: { zh: '神经质', en: 'Neuroticism' },
}

export const DIMENSIONS = ['O', 'C', 'E', 'A', 'N'] as const
export type Dimension = (typeof DIMENSIONS)[number]

// Heading patterns that should be wrapped in data-detail for "simple" mode hiding
export const DETAIL_HEADING_PATTERNS = [
  /数据画像/,
  /行为证据/,
  /AV|锚定|校准/,
  /POL_|SIT_|PAIR_|N_SIT/,
]

// Section IDs for navigation
export const SECTIONS = {
  overview: { id: 'overview', label: '概览' },
  interactions: { id: 'interactions', label: '维度交互解读' },
  dimensions: { id: 'dimensions', label: '五大人格深度' },
  personal: { id: 'personal', label: '个人化深度分析' },
} as const
