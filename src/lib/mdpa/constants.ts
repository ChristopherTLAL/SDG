// MDPA Report display constants

// Morandi-inspired muted palette
export const DIMENSION_COLORS: Record<string, { bg: string; text: string; accent: string; light: string }> = {
  O: { bg: 'bg-[#f5f0e8]', text: 'text-[#8a7a5e]', accent: 'border-[#b5a68a]', light: 'bg-[#ede6d8]' },
  C: { bg: 'bg-[#eaeff5]', text: 'text-[#5d708a]', accent: 'border-[#8da4b8]', light: 'bg-[#dde5ef]' },
  E: { bg: 'bg-[#f5eced]', text: 'text-[#8a6068]', accent: 'border-[#c0959c]', light: 'bg-[#eddfe1]' },
  A: { bg: 'bg-[#edf2ee]', text: 'text-[#5e7a62]', accent: 'border-[#9ab59e]', light: 'bg-[#e0ebe2]' },
  N: { bg: 'bg-[#f0ecf3]', text: 'text-[#736082]', accent: 'border-[#a898b5]', light: 'bg-[#e5dfe9]' },
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
