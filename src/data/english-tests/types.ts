// English-test cross-walk type definitions.
// All scores anchored to CEFR.

export type CEFRBand =
  | 'A1' | 'A2' | 'A2+'
  | 'B1' | 'B1+'
  | 'B2-' | 'B2' | 'B2+'
  | 'C1' | 'C1+'
  | 'C2';

export type TestKey =
  // primary
  | 'ielts'
  | 'toefl-ibt-new'    // 1-6, since 21-Jan-2026
  | 'toefl-ibt-legacy' // 0-120
  | 'pte'              // PTE Academic, post-July-2025 update
  | 'det'              // Duolingo English Test, current 10-160
  | 'cambridge-scale'  // 80-230, shared by First/Advanced/Proficiency
  // secondary
  | 'toefl-itp'
  | 'toefl-essentials'
  | 'trinity-ise'
  | 'languagecert'
  | 'aptis'
  | 'linguaskill'
  | 'itep'
  | 'oxford-test'
  | 'toeic-lr'
  | 'toeic-sw'
  | 'eiken'
  | 'cet6'   // conventional
  | 'tem8'   // conventional
  | 'sat-ebrw'
  | 'act-eng'
  | 'gre-v'
  | 'gmat-v';

export type SourceQuality = 'OFFICIAL' | 'CONVENTIONAL' | 'APPROXIMATE';

export interface ScoreCell {
  // What to render in tables / cards.
  display: string;
  // Numeric range (when applicable) for matching user input → CEFR.
  // For 'ielts' use 0.5 increments (4.0, 4.5, ...). For 'toefl-ibt-new' use 0.5 increments.
  // String-only tests (Trinity, EIKEN grades) leave numeric undefined.
  min?: number;
  max?: number;
  source: SourceQuality;
  notes?: string;
}

export interface CrossWalkRow {
  cefr: CEFRBand;
  cefrLabel: string;       // human label e.g. "B2 (mid)"
  cefrEnglish: string;     // English description
  scores: Partial<Record<TestKey, ScoreCell>>;
}

export interface TestMeta {
  key: TestKey;
  display: string;          // user-facing test name
  shortName: string;        // table header
  scale: string;            // e.g. "0–9 in 0.5 increments"
  inputType: 'numeric' | 'select';
  inputOptions?: string[];  // for select
  inputStep?: number;
  inputMin?: number;
  inputMax?: number;
  source: SourceQuality;
  hint?: string;
  perSkill: boolean;
}

export type Region = 'UK' | 'US' | 'HK' | 'SG' | 'AU' | 'CA';

export type Tier = 'TOP' | 'STRONG' | 'MID' | 'STANDARD';

export interface ProgrammeRequirement {
  ielts?:            { overall: number; minPerSkill?: number; perSkill?: { L?: number; R?: number; W?: number; S?: number } };
  toeflIbtLegacy?:   { overall: number; minPerSkill?: number; perSkill?: { L?: number; R?: number; W?: number; S?: number } };
  toeflIbtNew?:      { overall: number; minPerSkill?: number; perSkill?: { L?: number; R?: number; W?: number; S?: number } };
  pte?:              { overall: number; minPerSkill?: number; perSkill?: { L?: number; R?: number; W?: number; S?: number } };
  det?:              { overall: number; productionMin?: number };
  cambridgeScale?:   { overall: number; minPerSkill?: number; perSkill?: { L?: number; R?: number; W?: number; S?: number } };
}

export interface Programme {
  id: string;
  region: Region;
  tier: Tier;
  university: string;
  level: string;          // "graduate (default)" / "undergrad" / "graduate Standard" / etc.
  programmeName?: string;
  requirement: ProgrammeRequirement;
  notAccepted?: TestKey[];  // tests NOT accepted (used for risk flags)
  notes?: string;
}

export interface RiskFlag {
  // condition: which tests + which programme conditions trigger it
  appliesIfTests?: TestKey[];   // e.g. ['det'] triggers when user input is DET
  appliesIfProgrammes?: string[]; // programme.id list
  appliesIfRegions?: Region[];
  severity: 'WARN' | 'INFO';
  title: string;
  body: string;
}

export interface FitResult {
  programme: Programme;
  status: 'qualified' | 'borderline' | 'below';
  gapDescription: string;     // "你 IELTS 6.5 / 学校要 7.0 → 缺口 0.5"
  weakestSkill?: string;      // 'W' | 'S' | 'R' | 'L' or undefined
  prepWeeksEstimate?: [number, number]; // [min, max]
  acceptedTestsList: string[];   // user-friendly
  notAcceptedFlags: string[];    // e.g. "DET 不接受"
}

export interface UserScores {
  test: TestKey;
  overall: number;
  perSkill?: { L?: number; R?: number; W?: number; S?: number };
}

export interface CefrMatch {
  cefr: CEFRBand;
  cefrLabel: string;
  row: CrossWalkRow;
}
