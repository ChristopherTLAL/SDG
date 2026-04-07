// src/utils/illustrations.ts
// Sequential illustration cycling — posts get illustrations by their
// chronological index, cycling through all 44 images in order.

const illustrations = [
  'payment-exchange',
  'nature-hands',
  'olive-branch',
  'partnership-gears',
  'cafe-study',
  'handwashing',
  'solar-energy',
  'building-blocks',
  'solidarity-hands',
  'diversity-circle',
  'transport-logistics',
  'housing-community',
  'biodiversity-dna',
  'piggy-bank',
  'plant-nurture',
  'ocean-coral',
  'package-sharing',
  'urban-transport',
  'tree-planting',
  'content-editing',
  'sustainable-growth',
  'key-access',
  'economic-balance',
  'carbon-footprint',
  'food-bowl',
  'institution-governance',
  'education-books',
  'handshake',
  'community-wellbeing',
  'healthcare',
  'puzzle-collaboration',
  'gender-equality',
  'water-pouring',
  'energy-innovation',
  'document-writing',
  'climate-change',
  'collective-growth',
  'sdg-collaboration',
  'unity-circle',
  'electric-plug',
  'infrastructure-build',
  'technology-device',
  'forest-ecosystem',
  'wildlife-ecosystem',
];

/**
 * Get an illustration path by numeric index.
 * Cycles through all 44 illustrations in order, then repeats.
 */
export function getIllustration(index: number): string {
  return `/images/illustrations/${illustrations[index % illustrations.length]}.png`;
}

// Alias kept for backwards compatibility
export const getIllustrationByIndex = getIllustration;

export { illustrations };
