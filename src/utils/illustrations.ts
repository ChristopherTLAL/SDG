// src/utils/illustrations.ts
// Deterministic illustration assignment — same slug always gets the same image,
// different slugs spread across the pool to minimize visible repetition.

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

// SDG tag → best-fit illustrations (used when SDG tag is available)
const sdgMap: Record<string, string[]> = {
  'SDG 1':  ['economic-balance', 'piggy-bank', 'payment-exchange', 'housing-community'],
  'SDG 2':  ['food-bowl', 'plant-nurture', 'tree-planting', 'sustainable-growth'],
  'SDG 3':  ['healthcare', 'handwashing', 'community-wellbeing', 'carbon-footprint'],
  'SDG 4':  ['education-books', 'document-writing', 'key-access', 'cafe-study'],
  'SDG 5':  ['gender-equality', 'solidarity-hands', 'collective-growth', 'puzzle-collaboration'],
  'SDG 6':  ['water-pouring', 'ocean-coral', 'handwashing', 'nature-hands'],
  'SDG 7':  ['solar-energy', 'energy-innovation', 'electric-plug', 'climate-change'],
  'SDG 8':  ['partnership-gears', 'collective-growth', 'sustainable-growth', 'piggy-bank'],
  'SDG 9':  ['infrastructure-build', 'technology-device', 'building-blocks', 'partnership-gears'],
  'SDG 10': ['diversity-circle', 'puzzle-collaboration', 'solidarity-hands', 'gender-equality'],
  'SDG 11': ['urban-transport', 'housing-community', 'infrastructure-build', 'building-blocks'],
  'SDG 12': ['package-sharing', 'content-editing', 'sustainable-growth', 'carbon-footprint'],
  'SDG 13': ['climate-change', 'solar-energy', 'forest-ecosystem', 'carbon-footprint'],
  'SDG 14': ['ocean-coral', 'water-pouring', 'wildlife-ecosystem', 'nature-hands'],
  'SDG 15': ['forest-ecosystem', 'wildlife-ecosystem', 'biodiversity-dna', 'tree-planting'],
  'SDG 16': ['institution-governance', 'handshake', 'olive-branch', 'key-access'],
  'SDG 17': ['handshake', 'sdg-collaboration', 'unity-circle', 'partnership-gears'],
};

/**
 * Simple hash from string → number (djb2)
 */
function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Get an illustration path for a post.
 * If sdgTag is provided, picks from relevant images.
 * Falls back to full pool using slug hash.
 */
export function getIllustration(slug: string, sdgTag?: string): string {
  const pool = (sdgTag && sdgMap[sdgTag]) || illustrations;
  const index = hash(slug) % pool.length;
  return `/images/illustrations/${pool[index]}.png`;
}

/**
 * Get illustration by numeric index (for fallback cards with no slug).
 * Uses modulo to cycle through all illustrations.
 */
export function getIllustrationByIndex(index: number): string {
  return `/images/illustrations/${illustrations[index % illustrations.length]}.png`;
}

export { illustrations };
