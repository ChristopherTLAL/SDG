// Canonical university dataset — the single source of truth.
//
// Edit `universities.json` (hand-maintainable) to update ranks / add schools.
// Everything downstream (schools map, budget calculator, vault rankings export)
// reads from here, so a rank change in one place propagates everywhere.
//
// Seeded once by scripts/build-universities.mjs (merge of budget-data + vault QS).
// QS numbers are refreshed each edition by scripts/ingest-qs-ranks.py (currently QS2027).

import data from './universities.json';
import type { University, RankTier } from './types';

export type { University, RankTier, RankTierKey, CountryCode } from './types';

export const UNIVERSITIES: University[] = data as University[];

/** Rank tiers — drive marker/legend color on the schools map (≤10 / ≤50 / ≤100 / ≤200 / beyond). */
export const RANK_TIERS: RankTier[] = [
  { key: 'top10', label: 'QS 前 10', color: '#6d28d9', max: 10 },
  { key: 'top50', label: 'QS 前 50', color: '#2563eb', max: 50 },
  { key: 'top100', label: 'QS 前 100', color: '#0891b2', max: 100 },
  { key: 'top200', label: 'QS 前 200', color: '#0d9488', max: 200 },
  { key: 'beyond', label: '200+ / 未排名', color: '#94a3b8', max: Infinity },
];

/** U.S. News National Universities tiers — used for the US overview (US market uses USNews, not QS). */
export const USNEWS_TIERS: RankTier[] = [
  { key: 'top10', label: 'USNews 前 10', color: '#6d28d9', max: 10 },
  { key: 'top25', label: 'USNews 前 25', color: '#2563eb', max: 25 },
  { key: 'top50', label: 'USNews 前 50', color: '#0891b2', max: 50 },
  { key: 'top100', label: 'USNews 前 100', color: '#0d9488', max: 100 },
  { key: 'beyond', label: '100+ / 未排名', color: '#94a3b8', max: Infinity },
];

const BEYOND = RANK_TIERS[RANK_TIERS.length - 1];

/** Map a QS rank to its tier (null / >200 → "beyond"). */
export function rankTier(qsRank: number | null | undefined): RankTier {
  if (qsRank == null) return BEYOND;
  return RANK_TIERS.find((t) => qsRank <= t.max) ?? BEYOND;
}

export function byId(id: string): University | undefined {
  return UNIVERSITIES.find((u) => u.id === id);
}

export function byCountry(country: string): University[] {
  return UNIVERSITIES.filter((u) => u.country === country);
}

/** Universities that have lat/lng — i.e. placeable on the map. */
export function mappable(country?: string): University[] {
  return UNIVERSITIES.filter(
    (u) => u.lat != null && u.lng != null && (country ? u.country === country : true)
  );
}
