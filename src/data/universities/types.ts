// Canonical university dataset — shared types.
// Single source of truth for university identity + rankings + geo.
// Consumed by: schools map (geo view), budget calculator (cost view),
// and exported to the vault school-plan skill (选校表) via scripts/export-rankings.mjs.

export type CountryCode =
  | 'US' | 'UK' | 'AU' | 'CA' | 'HK' | 'SG' | 'JP' | 'KR'
  | 'CH' | 'DE' | 'NL' | 'FR' | 'SE' | 'DK' | 'BE' | 'IE'
  | (string & {});

export interface University {
  /** Stable slug, also the join key used by budget-costs / map detail scenes. */
  id: string;
  name: string;
  nameCn: string;
  country: CountryCode;
  countryCn: string;
  city: string;
  /** Main-campus coordinates. Filled for mapped countries (UK first); null until geocoded. */
  lat: number | null;
  lng: number | null;
  /** QS World rank. Authoritative ranking field. null = unranked. */
  qsRank: number | null;
  /** ARWU / U.S. News kept as strings to allow band values like "101-150" / "N/A"→null. */
  arwuRank: string | null;
  usnewsRank: string | null;
  /** Edition year the ranks reflect (single place to bump when ranks refresh). */
  ranksYear: number;
  /** public | private | national … (from budget data). */
  type: string;
  tags: string[];
}

export type RankTierKey = 'top10' | 'top50' | 'top100' | 'top200' | 'beyond';

export interface RankTier {
  key: RankTierKey;
  label: string;
  /** marker / legend color */
  color: string;
  /** inclusive upper bound of QS rank for this tier */
  max: number;
}
