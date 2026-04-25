// Days-since-last-contact tiering used across the internal dashboard.
// Boundaries map to "weeks since contact" so day 7 → yellow, day 14 → pink,
// day 21 → red, day 28 → critical.

export type RadarTier = 'green' | 'yellow' | 'pink' | 'red' | 'critical' | 'inactive' | 'unknown';

const INACTIVE_STAGES = new Set(['已结案', '退费', '已完成']);

export function tierFor(daysSince: number | null, stage?: string | null): RadarTier {
  if (stage && INACTIVE_STAGES.has(stage)) return 'inactive';
  if (daysSince === null || daysSince === undefined) return 'unknown';
  if (daysSince < 7) return 'green';
  if (daysSince < 14) return 'yellow';
  if (daysSince < 21) return 'pink';
  if (daysSince < 28) return 'red';
  return 'critical';
}

export type TierStyle = { bg: string; fg: string; border: string };

export function tierStyle(tier: RadarTier): TierStyle {
  switch (tier) {
    case 'green':    return { bg: '#d1fae5', fg: '#065f46', border: '#10b981' };
    case 'yellow':   return { bg: '#fef3c7', fg: '#92400e', border: '#d97706' };
    case 'pink':     return { bg: '#fee2e2', fg: '#b91c1c', border: '#fca5a5' };
    case 'red':      return { bg: '#fecaca', fg: '#7f1d1d', border: '#dc2626' };
    case 'critical': return { bg: '#7f1d1d', fg: '#ffffff', border: '#7f1d1d' };
    case 'inactive': return { bg: 'transparent', fg: '#94a3b8', border: '#e5e7eb' };
    case 'unknown':  return { bg: 'transparent', fg: '#94a3b8', border: '#e5e7eb' };
  }
}

export function tierLabel(tier: RadarTier, daysSince: number | null): string {
  if (tier === 'inactive') return '—';
  if (tier === 'unknown' || daysSince === null) return '?';
  if (tier === 'critical') return `⚠️ ${daysSince}d`;
  return `${daysSince}d`;
}

export function daysSinceToday(d: string | null | undefined): number | null {
  if (!d) return null;
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86400000);
}

// Triage threshold: tiers at this rank or worse appear in the dashboard's
// "act on these now" panel. Pink and worse = 14d+.
export function inTriage(tier: RadarTier): boolean {
  return tier === 'pink' || tier === 'red' || tier === 'critical';
}

// Used for sort: bigger = more urgent.
export function tierRank(tier: RadarTier): number {
  switch (tier) {
    case 'critical': return 5;
    case 'red':      return 4;
    case 'pink':     return 3;
    case 'yellow':   return 2;
    case 'green':    return 1;
    case 'unknown':  return 0;
    case 'inactive': return -1;
  }
}
