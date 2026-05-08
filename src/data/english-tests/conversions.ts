// Conversion + matching engine for English-test cross-walk.

import { CROSS_WALK, TEST_META, matchCefr } from './cross-walk';
import { PROGRAMMES } from './programmes';
import type {
  TestKey, CEFRBand, CrossWalkRow,
  Programme, FitResult, UserScores, Region, Tier,
} from './types';

const CEFR_ORDER: CEFRBand[] = ['A1', 'A2', 'A2+', 'B1', 'B1+', 'B2-', 'B2', 'B2+', 'C1', 'C1+', 'C2'];

export function cefrIndex(cefr: CEFRBand): number {
  return CEFR_ORDER.indexOf(cefr);
}

/**
 * Given a user's score on one test, return the matching CEFR row + all
 * equivalent scores on every other test in that CEFR row.
 */
export function convertScore(testKey: TestKey, score: number | string): {
  matched: CrossWalkRow | null;
  cefrIndex: number;
} {
  const row = matchCefr(testKey, score);
  return {
    matched: row,
    cefrIndex: row ? cefrIndex(row.cefr) : -1,
  };
}

/**
 * For a given programme requirement, compute fit status against user scores.
 * Picks the test in user scores that matches the requirement; if user took a
 * different test, falls back to converting via CEFR.
 */
export function programmeFit(
  programme: Programme,
  user: UserScores,
): FitResult {
  // Direct match by test key first.
  const req = programme.requirement;
  let directReq: number | null = null;
  let directKey: keyof typeof req | null = null;

  if (user.test === 'ielts' && req.ielts)              { directReq = req.ielts.overall; directKey = 'ielts'; }
  else if (user.test === 'toefl-ibt-legacy' && req.toeflIbtLegacy) { directReq = req.toeflIbtLegacy.overall; directKey = 'toeflIbtLegacy'; }
  else if (user.test === 'toefl-ibt-new' && req.toeflIbtNew)       { directReq = req.toeflIbtNew.overall; directKey = 'toeflIbtNew'; }
  else if (user.test === 'pte' && req.pte)             { directReq = req.pte.overall; directKey = 'pte'; }
  else if (user.test === 'det' && req.det)             { directReq = req.det.overall; directKey = 'det'; }
  else if (user.test === 'cambridge-scale' && req.cambridgeScale) { directReq = req.cambridgeScale.overall; directKey = 'cambridgeScale'; }

  // If programme explicitly doesn't accept this test, mark as below.
  if (programme.notAccepted?.includes(user.test)) {
    return {
      programme,
      status: 'below',
      gapDescription: `${TEST_META[user.test].shortName} 不被接受`,
      acceptedTestsList: listAcceptedTests(programme),
      notAcceptedFlags: [`${TEST_META[user.test].shortName} 不接受`],
    };
  }

  // If we have a direct test match, compare directly.
  if (directReq != null && typeof user.overall === 'number') {
    const overall = user.overall;
    const diff = overall - directReq;
    const status: FitResult['status'] =
      diff >= 0.5 ? 'qualified'
      : diff >= 0  ? 'borderline'
      : 'below';

    // Per-skill check (if requirement has perSkill / minPerSkill)
    let weakest: string | undefined;
    let perSkillFail = false;
    if (user.perSkill) {
      const perSkillReq = (req[directKey!] as any)?.perSkill;
      const minPerSkill = (req[directKey!] as any)?.minPerSkill;
      const skills = ['L', 'R', 'W', 'S'] as const;
      for (const sk of skills) {
        const userVal = user.perSkill?.[sk];
        if (userVal == null) continue;
        const reqVal = perSkillReq?.[sk] ?? minPerSkill;
        if (reqVal != null && userVal < reqVal) {
          perSkillFail = true;
          weakest = weakest && (user.perSkill[weakest as 'L'] ?? Infinity) < userVal ? weakest : sk;
        }
      }
    }

    const finalStatus: FitResult['status'] =
      status === 'qualified' && perSkillFail ? 'borderline'
      : status === 'borderline' && perSkillFail ? 'below'
      : status;

    let gapDescription = '';
    if (finalStatus === 'qualified') {
      gapDescription = `你 ${TEST_META[user.test].shortName} ${overall} ≥ 要求 ${directReq}（缓冲 ${diff > 0 ? '+' : ''}${diff.toFixed(1)}）`;
      if (perSkillFail) gapDescription += `，但 ${weakest} 项不达小分`;
    } else if (finalStatus === 'borderline') {
      gapDescription = `你 ${TEST_META[user.test].shortName} ${overall} = 要求 ${directReq}（擦线，无缓冲）`;
      if (perSkillFail) gapDescription += `；${weakest} 项还差小分`;
    } else {
      const gap = directReq - overall;
      gapDescription = `你 ${TEST_META[user.test].shortName} ${overall} < 要求 ${directReq}（缺口 ${gap.toFixed(1)} 分）`;
      if (perSkillFail) gapDescription += `；含 ${weakest} 小分缺口`;
    }

    return {
      programme,
      status: finalStatus,
      gapDescription,
      weakestSkill: weakest,
      prepWeeksEstimate: estPrepWeeks(diff, user.test, perSkillFail),
      acceptedTestsList: listAcceptedTests(programme),
      notAcceptedFlags: programme.notAccepted?.map((t) => `${TEST_META[t].shortName} 不接受`) ?? [],
    };
  }

  // Fallback: convert user score to CEFR, then to the programme's primary test (IELTS).
  const cefr = matchCefr(user.test, user.overall);
  if (!cefr) {
    return {
      programme,
      status: 'below',
      gapDescription: `分数无法对齐 CEFR`,
      acceptedTestsList: listAcceptedTests(programme),
      notAcceptedFlags: [],
    };
  }
  const ieltsEquiv = cefr.scores['ielts']?.min ?? 0;
  if (req.ielts) {
    const diff = ieltsEquiv - req.ielts.overall;
    const status: FitResult['status'] =
      diff >= 0.5 ? 'qualified'
      : diff >= 0  ? 'borderline'
      : 'below';
    return {
      programme,
      status,
      gapDescription: `换算后 IELTS ≈ ${ieltsEquiv.toFixed(1)} vs 要求 ${req.ielts.overall}`,
      acceptedTestsList: listAcceptedTests(programme),
      notAcceptedFlags: programme.notAccepted?.map((t) => `${TEST_META[t].shortName} 不接受`) ?? [],
      prepWeeksEstimate: estPrepWeeks(diff, 'ielts', false),
    };
  }
  return {
    programme,
    status: 'below',
    gapDescription: '无法对齐到学校接受的测试',
    acceptedTestsList: listAcceptedTests(programme),
    notAcceptedFlags: [],
  };
}

/**
 * Find all programmes (filtered by region/tier) and group by fit status.
 */
export function findProgrammeFits(
  user: UserScores,
  filter: { regions?: Region[]; tiers?: Tier[] },
): { qualified: FitResult[]; borderline: FitResult[]; below: FitResult[] } {
  const filtered = PROGRAMMES.filter((p) => {
    if (filter.regions?.length && !filter.regions.includes(p.region)) return false;
    if (filter.tiers?.length && !filter.tiers.includes(p.tier)) return false;
    return true;
  });

  const fits = filtered.map((p) => programmeFit(p, user));

  return {
    qualified: fits.filter((f) => f.status === 'qualified'),
    borderline: fits.filter((f) => f.status === 'borderline'),
    below:      fits.filter((f) => f.status === 'below'),
  };
}

/**
 * Estimate prep weeks needed to reach the required score.
 */
function estPrepWeeks(diff: number, test: TestKey, perSkillIssue: boolean): [number, number] | undefined {
  if (diff >= 0 && !perSkillIssue) return undefined;
  // Rough heuristic: 1 IELTS band = 8-12 weeks; per-skill add 3-4 weeks.
  const ieltsGap = test === 'ielts' ? Math.abs(diff) : 0.5;
  const baseMin = Math.max(2, Math.round(ieltsGap * 8));
  const baseMax = Math.max(4, Math.round(ieltsGap * 12));
  if (perSkillIssue) {
    return [baseMin + 3, baseMax + 4];
  }
  return [baseMin, baseMax];
}

function listAcceptedTests(p: Programme): string[] {
  const list: string[] = [];
  if (p.requirement.ielts)          list.push(`IELTS ${p.requirement.ielts.overall}` + (p.requirement.ielts.minPerSkill ? ` / 各项 ${p.requirement.ielts.minPerSkill}+` : ''));
  if (p.requirement.toeflIbtLegacy) {
    const r = p.requirement.toeflIbtLegacy;
    let s = `TOEFL ${r.overall}`;
    if (r.minPerSkill) s += ` / 各项 ${r.minPerSkill}+`;
    if (r.perSkill) {
      const pieces = Object.entries(r.perSkill).map(([k, v]) => `${k}${v}`).join(' ');
      if (pieces) s += ` (${pieces})`;
    }
    list.push(s);
  }
  if (p.requirement.toeflIbtNew)    list.push(`TOEFL 新 ${p.requirement.toeflIbtNew.overall}`);
  if (p.requirement.pte)            list.push(`PTE ${p.requirement.pte.overall}`);
  if (p.requirement.det)            list.push(`DET ${p.requirement.det.overall}`);
  if (p.requirement.cambridgeScale) list.push(`Cambridge ${p.requirement.cambridgeScale.overall}`);
  return list;
}

/**
 * Strategy mode: given target tier + current scores, suggest action plan.
 */
export interface StrategyResult {
  targetCefr: CEFRBand;
  targetCefrLabel: string;
  currentCefr: CEFRBand | null;
  currentCefrLabel: string;
  gapInBands: number;     // 0 = at target; >0 = below; <0 = above
  weakestSkill?: string;
  recommendedTest: TestKey;
  reasoning: string[];     // bullet points
  prepWeeks: [number, number];
  validityWarning?: string;
}

const TIER_TARGET_CEFR: Record<Tier, CEFRBand> = {
  TOP:      'C1+',
  STRONG:   'C1',
  MID:      'B2+',
  STANDARD: 'B2',
};

const TIER_TARGET_LABEL: Record<Tier, string> = {
  TOP:      'C1+ / IELTS 7.5 / TOEFL 102+ / PTE 73+',
  STRONG:   'C1 / IELTS 7.0 / TOEFL 94+ / PTE 65+',
  MID:      'B2+ / IELTS 6.5 / TOEFL 86+ / PTE 58+',
  STANDARD: 'B2 / IELTS 6.0 / TOEFL 79+ / PTE 59+',
};

export function strategy(
  user: UserScores,
  targetTier: Tier,
  examTakenAt?: Date,        // when user took the test (optional, for validity)
  unconditionalNeededBy?: Date, // when offer needs to be unconditional
): StrategyResult {
  const targetCefr = TIER_TARGET_CEFR[targetTier];
  const targetCefrLabel = TIER_TARGET_LABEL[targetTier];
  const currentMatched = matchCefr(user.test, user.overall);
  const currentCefr = currentMatched?.cefr ?? null;
  const currentCefrLabel = currentMatched?.cefrLabel ?? '无法对齐';
  const gapInBands = currentCefr
    ? cefrIndex(targetCefr) - cefrIndex(currentCefr)
    : 99;

  // Weakest skill detection
  let weakestSkill: string | undefined;
  let weakestVal = Infinity;
  if (user.perSkill) {
    for (const [k, v] of Object.entries(user.perSkill)) {
      if (typeof v === 'number' && v < weakestVal) {
        weakestVal = v;
        weakestSkill = k;
      }
    }
  }

  const reasoning: string[] = [];
  if (gapInBands === 0) {
    reasoning.push('当前分数已达到目标档 CEFR floor。重点：保 small-print（per-skill 小分）+ 考前热身。');
  } else if (gapInBands > 0) {
    reasoning.push(`你当前 ${currentCefrLabel}，目标档需要 ${targetCefr} (${targetCefrLabel})`);
    reasoning.push(`差距 ${gapInBands} 个 CEFR band（约 ${gapInBands * 0.5}-${gapInBands * 1.0} IELTS overall）`);
  } else {
    reasoning.push(`当前 ${currentCefrLabel} 已超过目标 ${targetCefr}，重心可放在 per-skill polish`);
  }

  if (weakestSkill && user.perSkill) {
    const overall = user.overall;
    const weakDiff = overall - (weakestVal as number);
    if (weakDiff >= 1.0) {
      reasoning.push(`⚠ ${weakestSkill} = ${weakestVal} 与 overall ${overall} 差 ${weakDiff.toFixed(1)} — 单项瓶颈，考虑专项 6 周突破`);
    }
  }

  // Test switch suggestion
  let recommendedTest: TestKey = user.test;
  if (gapInBands > 0 && targetTier !== 'TOP' && user.test === 'ielts' && weakestSkill === 'S') {
    recommendedTest = 'pte';
    reasoning.push('口语弱 → PTE Academic 机考无人面试，可能更稳；但牛剑/HKU/Toronto SGS 优先 IELTS');
  } else if (gapInBands > 1 && user.test === 'ielts' && (targetTier === 'MID' || targetTier === 'STANDARD')) {
    recommendedTest = 'det';
    reasoning.push('差距较大 + 中档目标 → DET 30 分钟 + 立即出分，迭代更快；但前提是目标校接受');
  }

  // Prep weeks
  const prepBase = Math.max(0, gapInBands) * 8;
  const prepMax = Math.max(0, gapInBands) * 12;
  const skillBoost = (weakestSkill && user.perSkill && (user.overall - (weakestVal as number)) >= 1.0) ? 6 : 0;
  const prepWeeks: [number, number] = [
    Math.max(2, prepBase + skillBoost),
    Math.max(4, prepMax + skillBoost),
  ];

  // Validity warning
  let validityWarning: string | undefined;
  if (examTakenAt && unconditionalNeededBy) {
    const expiry = new Date(examTakenAt);
    expiry.setFullYear(expiry.getFullYear() + 2);
    if (expiry < unconditionalNeededBy) {
      validityWarning = `你的 ${TEST_META[user.test].shortName} 在 ${expiry.getFullYear()}-${String(expiry.getMonth() + 1).padStart(2, '0')} 失效；目标 unconditional 日期 ${unconditionalNeededBy.getFullYear()}-${String(unconditionalNeededBy.getMonth() + 1).padStart(2, '0')} 之后 → **必须重考**`;
    }
  }

  return {
    targetCefr,
    targetCefrLabel,
    currentCefr,
    currentCefrLabel,
    gapInBands,
    weakestSkill,
    recommendedTest,
    reasoning,
    prepWeeks,
    validityWarning,
  };
}

export { matchCefr, CROSS_WALK, TEST_META, PROGRAMMES };
export { CEFR_ORDER };
