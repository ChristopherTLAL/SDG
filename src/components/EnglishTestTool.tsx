// English Test Cross-walk + Strategy tool — public-site design tokens.
// Two tabs: 换算 + 策略. PNG export = separate beautiful card (1080×1440).

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CROSS_WALK, TEST_META, CEFR_ORDER,
  matchCefr, strategy,
} from '../data/english-tests/conversions';
import { TIER_LABEL } from '../data/english-tests/programmes';
import type {
  TestKey, CEFRBand, Tier,
} from '../data/english-tests/types';

type Tab = 'convert' | 'strategy';

// CEFR color spectrum — used for badges + scale strips + export accent
const CEFR_COLORS: Record<CEFRBand, {
  bg: string; text: string; border: string; bar: string;
  // export-card colors (hex for inline style + html-to-image fidelity)
  exportBg: string;
  exportFg: string;
  exportAccent: string;
  exportGradFrom: string;
  exportGradTo: string;
}> = {
  'A1':  { bg: 'bg-rose-50',     text: 'text-rose-900',     border: 'border-rose-200',   bar: 'bg-rose-400',
           exportBg: '#fff1f2', exportFg: '#881337', exportAccent: '#fb7185', exportGradFrom: '#ffe4e6', exportGradTo: '#fecdd3' },
  'A2':  { bg: 'bg-orange-50',   text: 'text-orange-900',   border: 'border-orange-200', bar: 'bg-orange-400',
           exportBg: '#fff7ed', exportFg: '#7c2d12', exportAccent: '#fb923c', exportGradFrom: '#ffedd5', exportGradTo: '#fed7aa' },
  'A2+': { bg: 'bg-amber-50',    text: 'text-amber-900',    border: 'border-amber-200',  bar: 'bg-amber-400',
           exportBg: '#fffbeb', exportFg: '#78350f', exportAccent: '#fbbf24', exportGradFrom: '#fef3c7', exportGradTo: '#fde68a' },
  'B1':  { bg: 'bg-yellow-50',   text: 'text-yellow-900',   border: 'border-yellow-200', bar: 'bg-yellow-500',
           exportBg: '#fefce8', exportFg: '#713f12', exportAccent: '#eab308', exportGradFrom: '#fef9c3', exportGradTo: '#fef08a' },
  'B1+': { bg: 'bg-lime-50',     text: 'text-lime-900',     border: 'border-lime-200',   bar: 'bg-lime-500',
           exportBg: '#f7fee7', exportFg: '#365314', exportAccent: '#84cc16', exportGradFrom: '#ecfccb', exportGradTo: '#d9f99d' },
  'B2-': { bg: 'bg-green-50',    text: 'text-green-900',    border: 'border-green-200',  bar: 'bg-green-500',
           exportBg: '#f0fdf4', exportFg: '#14532d', exportAccent: '#22c55e', exportGradFrom: '#dcfce7', exportGradTo: '#bbf7d0' },
  'B2':  { bg: 'bg-emerald-50',  text: 'text-emerald-900',  border: 'border-emerald-200',bar: 'bg-emerald-500',
           exportBg: '#ecfdf5', exportFg: '#064e3b', exportAccent: '#10b981', exportGradFrom: '#d1fae5', exportGradTo: '#a7f3d0' },
  'B2+': { bg: 'bg-teal-50',     text: 'text-teal-900',     border: 'border-teal-200',   bar: 'bg-teal-500',
           exportBg: '#f0fdfa', exportFg: '#134e4a', exportAccent: '#14b8a6', exportGradFrom: '#ccfbf1', exportGradTo: '#99f6e4' },
  'C1':  { bg: 'bg-cyan-50',     text: 'text-cyan-900',     border: 'border-cyan-200',   bar: 'bg-cyan-600',
           exportBg: '#ecfeff', exportFg: '#164e63', exportAccent: '#0891b2', exportGradFrom: '#cffafe', exportGradTo: '#a5f3fc' },
  'C1+': { bg: 'bg-blue-50',     text: 'text-blue-900',     border: 'border-blue-200',   bar: 'bg-blue-600',
           exportBg: '#eff6ff', exportFg: '#1e3a8a', exportAccent: '#2563eb', exportGradFrom: '#dbeafe', exportGradTo: '#bfdbfe' },
  'C2':  { bg: 'bg-indigo-50',   text: 'text-indigo-900',   border: 'border-indigo-200', bar: 'bg-indigo-600',
           exportBg: '#eef2ff', exportFg: '#312e81', exportAccent: '#4f46e5', exportGradFrom: '#e0e7ff', exportGradTo: '#c7d2fe' },
};

const SOURCE_BADGE: Record<string, string> = {
  OFFICIAL:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  CONVENTIONAL: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROXIMATE:  'bg-zinc-50 text-zinc-600 border-zinc-200',
};

const SOURCE_LABEL: Record<string, string> = {
  OFFICIAL:     '官方',
  CONVENTIONAL: '约定',
  APPROXIMATE:  '近似',
};

// Tests visible in cross-walk grid (ordered by relevance for consultants)
const PRIMARY_TESTS: TestKey[] = [
  'ielts',
  'toefl-ibt-new',
  'toefl-ibt-legacy',
  'pte',
  'det',
  'cambridge-scale',
];

const SECONDARY_TESTS: TestKey[] = [
  'trinity-ise',
  'languagecert',
  'oxford-test',
  'linguaskill',
  'aptis',
  'itep',
  'toefl-itp',
  'toefl-essentials',
  'toeic-lr',
  'eiken',
  'cet6',
  'tem8',
  'sat-ebrw',
  'act-eng',
  'gre-v',
  'gmat-v',
];

// Export card key tests (most-used 6 for sharing)
const EXPORT_PRIMARY: TestKey[] = [
  'ielts',
  'toefl-ibt-new',
  'toefl-ibt-legacy',
  'pte',
  'det',
  'cambridge-scale',
];

export default function EnglishTestTool() {
  const [tab, setTab] = useState<Tab>('convert');

  // Shared state across tabs
  const [test, setTest] = useState<TestKey>('ielts');
  const [score, setScore] = useState<string>('6.5');
  const [showPerSkill, setShowPerSkill] = useState(false);
  const [perSkill, setPerSkill] = useState<{ L: string; R: string; W: string; S: string }>({
    L: '', R: '', W: '', S: '',
  });

  // Tab 3 (Strategy) state
  const [targetTier, setTargetTier] = useState<Tier>('STRONG');
  const [examTaken, setExamTaken] = useState<string>('');
  const [unconditionalBy, setUnconditionalBy] = useState<string>('');
  const [showSecondary, setShowSecondary] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 pb-24">
      <Header />

      {/* Tab nav */}
      <nav className="flex gap-1 mb-8 border-b border-slate-200 overflow-x-auto">
        {([
          { key: 'convert',  label: '换算',   sub: 'Convert',     icon: 'sync_alt' },
          { key: 'strategy', label: '策略',   sub: 'Strategy',    icon: 'bolt' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as Tab)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            <span>{t.label}</span>
            <span className="text-[10px] opacity-60 uppercase tracking-wider hidden sm:inline">{t.sub}</span>
          </button>
        ))}
      </nav>

      {tab === 'convert' && (
        <ConvertTab
          test={test} setTest={setTest}
          score={score} setScore={setScore}
          showPerSkill={showPerSkill} setShowPerSkill={setShowPerSkill}
          perSkill={perSkill} setPerSkill={setPerSkill}
          showSecondary={showSecondary} setShowSecondary={setShowSecondary}
        />
      )}
      {tab === 'strategy' && (
        <StrategyTab
          test={test} setTest={setTest}
          score={score} setScore={setScore}
          showPerSkill={showPerSkill} setShowPerSkill={setShowPerSkill}
          perSkill={perSkill} setPerSkill={setPerSkill}
          targetTier={targetTier} setTargetTier={setTargetTier}
          examTaken={examTaken} setExamTaken={setExamTaken}
          unconditionalBy={unconditionalBy} setUnconditionalBy={setUnconditionalBy}
        />
      )}

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <div className="pt-24 md:pt-32 pb-8 md:pb-12">
      <div className="inline-flex items-center gap-2 bg-primary/5 text-primary px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6">
        <span className="material-symbols-outlined text-[14px]">translate</span>
        English Test Cross-walk
      </div>
      <h1 className="font-headline font-extrabold text-3xl sm:text-4xl md:text-5xl text-on-surface tracking-tighter leading-[1.05] mb-4">
        语言考试 <span className="text-primary">换算 &amp; 决策</span>
      </h1>
      <p className="font-body text-base md:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
        IELTS / TOEFL（含 2026 新制 1-6）/ PTE / DET / Cambridge / 等 21 种考试 ↔ CEFR 双向换算 +
        备考策略建议。导出 PNG 直接转发。
      </p>
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-16 border-t border-slate-200 pt-8 text-xs text-slate-500 leading-relaxed">
      <div className="font-bold uppercase tracking-wider mb-2 text-slate-700">数据来源 &amp; 校准日期</div>
      <p className="mb-3">
        ETS TOEFL Score Scale Update 2026 / Cambridge English Scale 2015 / Pearson PTE Academic 2025-07
        update / Duolingo English Test Concordance 2024 / IELTS-CEFR Partners 2024 / NEEA CSE-IELTS
        Linkage 2019。最后校准：2026-05。
      </p>
      <p>
        <span className="font-bold text-amber-700">⚠</span> CET-6 / TEM-8 / GRE-V / GMAT-V / SAT-EBRW
        与 CEFR 的对齐为研究约定，非官方授权；海外院校申请不可替代 IELTS / TOEFL。各校录取门槛年度更新，
        每次申请请回原校官网核对。
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Tab 1: Convert
// ─────────────────────────────────────────────────────────────────────────

function ConvertTab(props: {
  test: TestKey; setTest: (t: TestKey) => void;
  score: string; setScore: (s: string) => void;
  showPerSkill: boolean; setShowPerSkill: (v: boolean) => void;
  perSkill: { L: string; R: string; W: string; S: string };
  setPerSkill: (p: { L: string; R: string; W: string; S: string }) => void;
  showSecondary: boolean; setShowSecondary: (v: boolean) => void;
}) {
  const { test, setTest, score, setScore, showPerSkill, setShowPerSkill, perSkill, setPerSkill, showSecondary, setShowSecondary } = props;
  const exportCardRef = useRef<HTMLDivElement>(null);

  const numericScore = parseFloat(score);
  const cellMatch = isNaN(numericScore)
    ? matchCefr(test, score)
    : matchCefr(test, numericScore);

  const cefrIdx = cellMatch ? CEFR_ORDER.indexOf(cellMatch.cefr) : -1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
      {/* Form column */}
      <aside className="md:col-span-4 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">
            考试类型
          </label>
          <select
            value={test}
            onChange={(e) => setTest(e.target.value as TestKey)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm font-medium bg-white"
          >
            <optgroup label="主流">
              {PRIMARY_TESTS.map((k) => (
                <option key={k} value={k}>{TEST_META[k].display}</option>
              ))}
            </optgroup>
            <optgroup label="次要 / 中国系 / 美国学术 (近似)">
              {SECONDARY_TESTS.map((k) => (
                <option key={k} value={k}>{TEST_META[k].display}</option>
              ))}
            </optgroup>
          </select>
          {TEST_META[test].hint && (
            <p className="mt-2 text-[11px] text-slate-500 leading-snug">{TEST_META[test].hint}</p>
          )}

          <div className="mt-5">
            <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">
              整体分 / Overall <span className="text-slate-400 normal-case">{TEST_META[test].scale}</span>
            </label>
            <ScoreInput test={test} value={score} onChange={setScore} />
          </div>

          {TEST_META[test].perSkill && (
            <div className="mt-4">
              <button
                onClick={() => setShowPerSkill(!showPerSkill)}
                className="text-[12px] text-primary font-semibold flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-[14px]">{showPerSkill ? 'expand_less' : 'expand_more'}</span>
                {showPerSkill ? '收起' : '展开'} per-skill 小分
              </button>
              {showPerSkill && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {(['L', 'R', 'W', 'S'] as const).map((sk) => (
                    <div key={sk}>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">{sk}</label>
                      <input
                        type="number"
                        step={TEST_META[test].inputStep}
                        min={TEST_META[test].inputMin}
                        max={TEST_META[test].inputMax}
                        value={perSkill[sk]}
                        onChange={(e) => setPerSkill({ ...perSkill, [sk]: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-md border border-slate-300 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Source legend */}
        <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-600">
          <div className="font-bold mb-2 text-slate-700">来源标识</div>
          <div className="flex flex-wrap gap-1.5">
            {(['OFFICIAL', 'CONVENTIONAL', 'APPROXIMATE'] as const).map((s) => (
              <span key={s} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ${SOURCE_BADGE[s]}`}>
                {SOURCE_LABEL[s]}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-snug">官方 = test publisher 验证；约定 = 业界共识；近似 = 研究估算</p>
        </div>
      </aside>

      {/* Result column */}
      <div className="md:col-span-8 space-y-6">
        {!cellMatch ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900">
            <strong>无法对齐</strong>：请检查分数是否在合理范围内（{TEST_META[test].inputMin}–{TEST_META[test].inputMax}）。
          </div>
        ) : (
          <>
            <CEFRBadge row={cellMatch} />
            <CEFRScale activeIndex={cefrIdx} />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-headline font-extrabold text-lg">主要等价分</h3>
                <ExportButton
                  cardRef={exportCardRef}
                  filename={`english-test-convert-${test}-${score}`}
                  enabled={!!cellMatch}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PRIMARY_TESTS.filter((k) => k !== test).map((k) => (
                  <ScoreCard key={k} testKey={k} row={cellMatch} highlight={false} />
                ))}
              </div>
            </div>

            <details open={showSecondary} onToggle={(e: any) => setShowSecondary(e.currentTarget.open)} className="bg-white rounded-2xl border border-slate-200 p-5">
              <summary className="cursor-pointer font-headline font-extrabold text-lg text-slate-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">expand_more</span>
                次要测试 + 中国系 + 美国学术近似
              </summary>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {SECONDARY_TESTS.filter((k) => k !== test && cellMatch.scores[k]).map((k) => (
                  <ScoreCard key={k} testKey={k} row={cellMatch} highlight={false} />
                ))}
              </div>
            </details>

            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-700 leading-relaxed">
              <div className="font-bold mb-1">{cellMatch.cefrLabel}</div>
              <p>{cellMatch.cefrEnglish}</p>
            </div>
          </>
        )}
      </div>

      {/* Off-screen export card (rendered for html-to-image to capture) */}
      {cellMatch && (
        <OffscreenCard cardRef={exportCardRef}>
          <ConvertExportCard
            test={test}
            score={score}
            row={cellMatch}
          />
        </OffscreenCard>
      )}
    </div>
  );
}

function ScoreInput({ test, value, onChange }: { test: TestKey; value: string; onChange: (v: string) => void }) {
  const meta = TEST_META[test];
  if (meta.inputType === 'select') {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm bg-white"
      >
        <option value="">选择档位...</option>
        {(meta.inputOptions ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }
  return (
    <input
      type="number"
      step={meta.inputStep}
      min={meta.inputMin}
      max={meta.inputMax}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm font-mono"
    />
  );
}

function CEFRBadge({ row }: { row: typeof CROSS_WALK[0] }) {
  const c = CEFR_COLORS[row.cefr];
  return (
    <div className={`rounded-2xl border-2 ${c.border} ${c.bg} p-6 md:p-8`}>
      <div className="text-[10px] uppercase tracking-widest font-bold text-slate-600 mb-2">CEFR 等级</div>
      <div className={`font-headline font-extrabold text-4xl md:text-5xl ${c.text} tracking-tighter mb-2`}>{row.cefr}</div>
      <div className={`text-base font-semibold ${c.text}`}>{row.cefrLabel}</div>
    </div>
  );
}

function CEFRScale({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3">CEFR 谱系</div>
      <div className="flex h-3 rounded-full overflow-hidden">
        {CEFR_ORDER.map((band, i) => {
          const c = CEFR_COLORS[band];
          const isActive = i === activeIndex;
          return (
            <div
              key={band}
              className={`flex-1 ${c.bar} ${isActive ? 'opacity-100 ring-2 ring-offset-2 ring-slate-700 rounded-sm' : 'opacity-40'}`}
              title={band}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-11 gap-0 mt-1.5 text-[9px] text-slate-500 text-center font-mono">
        {CEFR_ORDER.map((band) => <div key={band}>{band}</div>)}
      </div>
    </div>
  );
}

function ScoreCard({ testKey, row, highlight }: { testKey: TestKey; row: typeof CROSS_WALK[0]; highlight: boolean }) {
  const cell = row.scores[testKey];
  const meta = TEST_META[testKey];
  if (!cell) return null;
  return (
    <div className={`rounded-xl border p-3 ${highlight ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">{meta.shortName}</div>
        <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${SOURCE_BADGE[cell.source]}`}>
          {SOURCE_LABEL[cell.source]}
        </span>
      </div>
      <div className="font-mono font-bold text-lg text-slate-900 leading-tight">{cell.display}</div>
      {cell.notes && <div className="text-[10px] text-slate-500 mt-1 leading-snug">{cell.notes}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Tab 2: Strategy
// ─────────────────────────────────────────────────────────────────────────

function StrategyTab(props: {
  test: TestKey; setTest: (t: TestKey) => void;
  score: string; setScore: (s: string) => void;
  showPerSkill: boolean; setShowPerSkill: (v: boolean) => void;
  perSkill: { L: string; R: string; W: string; S: string };
  setPerSkill: (p: { L: string; R: string; W: string; S: string }) => void;
  targetTier: Tier; setTargetTier: (t: Tier) => void;
  examTaken: string; setExamTaken: (s: string) => void;
  unconditionalBy: string; setUnconditionalBy: (s: string) => void;
}) {
  const { test, setTest, score, setScore, showPerSkill, setShowPerSkill, perSkill, setPerSkill, targetTier, setTargetTier, examTaken, setExamTaken, unconditionalBy, setUnconditionalBy } = props;
  const exportCardRef = useRef<HTMLDivElement>(null);

  const numScore = parseFloat(score);
  const result = useMemo(() => {
    if (isNaN(numScore)) return null;
    const ps = (showPerSkill && (perSkill.L || perSkill.R || perSkill.W || perSkill.S))
      ? {
        L: parseFloat(perSkill.L) || undefined,
        R: parseFloat(perSkill.R) || undefined,
        W: parseFloat(perSkill.W) || undefined,
        S: parseFloat(perSkill.S) || undefined,
      } : undefined;
    return strategy(
      { test, overall: numScore, perSkill: ps },
      targetTier,
      examTaken ? new Date(examTaken) : undefined,
      unconditionalBy ? new Date(unconditionalBy) : undefined,
    );
  }, [test, numScore, perSkill, showPerSkill, targetTier, examTaken, unconditionalBy]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
      <aside className="md:col-span-4 space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">当前考试 + 分数</div>
          <select
            value={test}
            onChange={(e) => setTest(e.target.value as TestKey)}
            className="w-full px-3 py-2.5 mb-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            {PRIMARY_TESTS.map((k) => (
              <option key={k} value={k}>{TEST_META[k].display}</option>
            ))}
          </select>
          <ScoreInput test={test} value={score} onChange={setScore} />

          {TEST_META[test].perSkill && (
            <div className="mt-3">
              <button
                onClick={() => setShowPerSkill(!showPerSkill)}
                className="text-[12px] text-primary font-semibold flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-[14px]">{showPerSkill ? 'expand_less' : 'expand_more'}</span>
                per-skill
              </button>
              {showPerSkill && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(['L', 'R', 'W', 'S'] as const).map((sk) => (
                    <div key={sk}>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">{sk}</label>
                      <input
                        type="number"
                        step={TEST_META[test].inputStep}
                        value={perSkill[sk]}
                        onChange={(e) => setPerSkill({ ...perSkill, [sk]: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-md border border-slate-300 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3">目标档位</div>
          <div className="flex flex-col gap-1.5">
            {(['TOP', 'STRONG', 'MID', 'STANDARD'] as Tier[]).map((t) => (
              <button
                key={t}
                onClick={() => setTargetTier(t)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left transition-colors leading-tight ${
                  targetTier === t
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'
                }`}
              >
                {TIER_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">考试有效期检查（可选）</div>
          <label className="block text-[11px] text-slate-600 mb-1">已考时间</label>
          <input
            type="date"
            value={examTaken}
            onChange={(e) => setExamTaken(e.target.value)}
            className="w-full px-3 py-1.5 mb-3 rounded-md border border-slate-300 text-sm"
          />
          <label className="block text-[11px] text-slate-600 mb-1">Unconditional 截止日</label>
          <input
            type="date"
            value={unconditionalBy}
            onChange={(e) => setUnconditionalBy(e.target.value)}
            className="w-full px-3 py-1.5 rounded-md border border-slate-300 text-sm"
          />
          <p className="text-[10px] text-slate-500 mt-2 leading-snug">
            考试 2 年内有效；如目标 unconditional 日早于过期日，则要重考
          </p>
        </div>
      </aside>

      <div className="md:col-span-8 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-extrabold text-lg">策略建议</h3>
          {result && <ExportButton cardRef={exportCardRef} filename={`english-test-strategy-${test}-${score}`} enabled={!!result} />}
        </div>

        {!result && <div className="text-slate-500 text-sm">输入分数后查看建议</div>}

        {result && (
          <>
            <div className="bg-white rounded-2xl border-2 border-primary p-5 md:p-6">
              <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1">当前 → 目标</div>
                  <div className="font-headline font-extrabold text-2xl text-slate-900">
                    {result.currentCefr ?? '?'} <span className="text-slate-400 mx-1">→</span> {result.targetCefr}
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                  result.gapInBands <= 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : result.gapInBands <= 1
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {result.gapInBands <= 0 ? '已达标' : `差距 ${result.gapInBands} 个 CEFR`}
                </div>
              </div>
              <div className="text-sm text-slate-600">{result.targetCefrLabel}</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h4 className="font-headline font-extrabold text-base mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">target</span>
                诊断
              </h4>
              <ul className="space-y-2 text-sm text-slate-700 leading-relaxed">
                {result.reasoning.map((r, i) => (
                  <li key={i} className="flex gap-2"><span className="text-primary mt-1.5 flex-shrink-0 w-1 h-1 rounded-full bg-primary" />{r}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h4 className="font-headline font-extrabold text-base mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
                备考估算
              </h4>
              <div className="font-mono font-bold text-2xl text-slate-900 mb-1">
                {result.prepWeeks[0]}–{result.prepWeeks[1]} 周
              </div>
              <p className="text-xs text-slate-500 leading-snug">
                按"1 IELTS overall ≈ 8-12 周"基线 + 单项瓶颈每项加 6 周。实际节奏看学生强度。
              </p>
              {result.weakestSkill && (
                <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <strong>弱项：</strong>{result.weakestSkill} 需要单项专题；otherwise overall 难再涨
                </div>
              )}
            </div>

            {result.recommendedTest !== TEST_META[test].key && (
              <div className="bg-cyan-50 rounded-2xl border border-cyan-200 p-5">
                <h4 className="font-headline font-extrabold text-base mb-2 flex items-center gap-2 text-cyan-900">
                  <span className="material-symbols-outlined text-cyan-700 text-[20px]">swap_horiz</span>
                  考虑切换测试
                </h4>
                <div className="text-sm text-cyan-900 mb-1 font-semibold">
                  当前 {TEST_META[test].shortName} → 推荐 {TEST_META[result.recommendedTest].shortName}
                </div>
                <p className="text-xs text-cyan-800 leading-relaxed">
                  注意：先确认目标校接受新测试。Oxbridge / HKU MPhil / Toronto SGS 通常只认 IELTS / TOEFL iBT。
                </p>
              </div>
            )}

            {result.validityWarning && (
              <div className="bg-rose-50 rounded-2xl border border-rose-200 p-5">
                <h4 className="font-headline font-extrabold text-base mb-2 flex items-center gap-2 text-rose-900">
                  <span className="material-symbols-outlined text-rose-700 text-[20px]">event_busy</span>
                  有效期警报
                </h4>
                <p className="text-sm text-rose-900 leading-relaxed">{result.validityWarning}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Off-screen export card */}
      {result && (
        <OffscreenCard cardRef={exportCardRef}>
          <StrategyExportCard
            test={test}
            score={score}
            targetTier={targetTier}
            result={result}
          />
        </OffscreenCard>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Off-screen export card container
// ─────────────────────────────────────────────────────────────────────────

function OffscreenCard({ cardRef, children }: { cardRef: React.RefObject<HTMLDivElement | null>; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: '-99999px',
        pointerEvents: 'none',
        zIndex: -1,
      }}
      aria-hidden
    >
      <div ref={cardRef} style={{ width: 1080 }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Convert Export Card — small-red-book aesthetic, 1080×variable height
// ─────────────────────────────────────────────────────────────────────────

function ConvertExportCard({ test, score, row }: {
  test: TestKey;
  score: string;
  row: typeof CROSS_WALK[0];
}) {
  const c = CEFR_COLORS[row.cefr];
  const meta = TEST_META[test];

  // Pick the 5 most-used "other tests" (skip the one user took)
  const showTests = EXPORT_PRIMARY.filter((k) => k !== test);

  return (
    <div
      style={{
        width: 1080,
        background: `linear-gradient(180deg, ${c.exportGradFrom} 0%, #ffffff 50%, #ffffff 100%)`,
        fontFamily: 'Manrope, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        padding: '60px 60px 50px 60px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header: brand strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#042f24',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 20,
              letterSpacing: -0.5,
            }}
          >
            S
          </div>
          <div style={{ lineHeight: 1.15 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#042f24', letterSpacing: -0.3 }}>
              Chinese SDGs Institute
            </div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
              语言考试换算 · 工具集
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: c.exportFg,
            background: c.exportBg,
            padding: '6px 14px',
            borderRadius: 999,
            border: `1px solid ${c.exportAccent}30`,
          }}
        >
          CEFR Cross-walk
        </div>
      </div>

      {/* Input echo: which test, what score */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: '#94a3b8',
            marginBottom: 10,
          }}
        >
          你的分数 · Your score
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#475569' }}>
            {meta.shortName}
          </div>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              color: '#042f24',
              letterSpacing: -3,
              fontFamily: 'Manrope, "SF Mono", monospace',
              lineHeight: 1,
            }}
          >
            {score}
          </div>
        </div>
        <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
          {meta.display}
        </div>
      </div>

      {/* Big CEFR badge */}
      <div
        style={{
          background: c.exportBg,
          border: `2px solid ${c.exportAccent}`,
          borderRadius: 24,
          padding: '40px 48px',
          marginBottom: 36,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: c.exportAccent,
            opacity: 0.08,
          }}
        />
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: c.exportFg,
            marginBottom: 6,
          }}
        >
          CEFR 等级
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
          <div
            style={{
              fontSize: 130,
              fontWeight: 800,
              color: c.exportFg,
              lineHeight: 0.9,
              letterSpacing: -5,
            }}
          >
            {row.cefr}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: c.exportFg,
              opacity: 0.85,
            }}
          >
            {row.cefrLabel.replace(/^[A-Z][12]\+?[-]?\s*—\s*/, '')}
          </div>
        </div>
      </div>

      {/* CEFR scale strip */}
      <div style={{ marginBottom: 40 }}>
        <div
          style={{
            display: 'flex',
            height: 12,
            borderRadius: 999,
            overflow: 'hidden',
            marginBottom: 8,
          }}
        >
          {CEFR_ORDER.map((band) => {
            const cc = CEFR_COLORS[band];
            const isActive = band === row.cefr;
            return (
              <div
                key={band}
                style={{
                  flex: 1,
                  background: cc.exportAccent,
                  opacity: isActive ? 1 : 0.25,
                  borderRight: '1px solid white',
                  height: isActive ? 16 : 12,
                  marginTop: isActive ? -2 : 0,
                  borderRadius: isActive ? 6 : 0,
                  boxShadow: isActive ? `0 4px 12px ${cc.exportAccent}40` : 'none',
                }}
              />
            );
          })}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(11, 1fr)',
            fontSize: 11,
            color: '#94a3b8',
            fontFamily: '"SF Mono", monospace',
            textAlign: 'center',
            fontWeight: 600,
          }}
        >
          {CEFR_ORDER.map((band) => (
            <div
              key={band}
              style={{
                color: band === row.cefr ? c.exportAccent : '#cbd5e1',
                fontWeight: band === row.cefr ? 800 : 500,
              }}
            >
              {band}
            </div>
          ))}
        </div>
      </div>

      {/* Equivalent scores grid (5 cards: skip the one user took) */}
      <div style={{ marginBottom: 36 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: '#94a3b8',
            marginBottom: 16,
          }}
        >
          等价分 · Equivalent scores
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 14,
          }}
        >
          {showTests.map((k) => {
            const cell = row.scores[k];
            const tm = TEST_META[k];
            if (!cell) return null;
            return (
              <div
                key={k}
                style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  padding: '20px 22px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                      color: '#475569',
                    }}
                  >
                    {tm.shortName}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: cell.source === 'OFFICIAL' ? '#ecfdf5' : cell.source === 'CONVENTIONAL' ? '#fffbeb' : '#fafafa',
                      color: cell.source === 'OFFICIAL' ? '#065f46' : cell.source === 'CONVENTIONAL' ? '#92400e' : '#52525b',
                      border: `1px solid ${cell.source === 'OFFICIAL' ? '#a7f3d0' : cell.source === 'CONVENTIONAL' ? '#fde68a' : '#e4e4e7'}`,
                    }}
                  >
                    {SOURCE_LABEL[cell.source]}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: '#0f172a',
                    fontFamily: 'Manrope, "SF Mono", monospace',
                    letterSpacing: -1,
                    lineHeight: 1,
                  }}
                >
                  {cell.display}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          paddingTop: 28,
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: '#94a3b8',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: '#475569' }}>校准日期 2026-05</div>
          <div style={{ marginTop: 2 }}>
            ETS · Cambridge · Pearson · Duolingo · IELTS Partners
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, color: '#042f24' }}>sdg.undp.ac.cn</div>
          <div style={{ marginTop: 2 }}>/tools/english-test</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Strategy Export Card
// ─────────────────────────────────────────────────────────────────────────

function StrategyExportCard({ test, score, targetTier, result }: {
  test: TestKey;
  score: string;
  targetTier: Tier;
  result: NonNullable<ReturnType<typeof strategy>>;
}) {
  const meta = TEST_META[test];
  const targetC = result.targetCefr ? CEFR_COLORS[result.targetCefr] : CEFR_COLORS['B2'];
  const currentC = result.currentCefr ? CEFR_COLORS[result.currentCefr] : null;

  const gapStatus =
    result.gapInBands <= 0 ? 'qualified'
    : result.gapInBands <= 1 ? 'borderline'
    : 'below';

  const statusColor = {
    qualified:  { bg: '#ecfdf5', fg: '#065f46', accent: '#10b981', label: '已达标' },
    borderline: { bg: '#fffbeb', fg: '#78350f', accent: '#f59e0b', label: `差距 ${result.gapInBands} 个 CEFR` },
    below:      { bg: '#fff1f2', fg: '#881337', accent: '#f43f5e', label: `差距 ${result.gapInBands} 个 CEFR` },
  }[gapStatus];

  return (
    <div
      style={{
        width: 1080,
        background: `linear-gradient(180deg, ${targetC.exportGradFrom} 0%, #ffffff 35%, #ffffff 100%)`,
        fontFamily: 'Manrope, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        padding: '60px 60px 50px 60px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: '#042f24', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 20, letterSpacing: -0.5,
            }}
          >
            S
          </div>
          <div style={{ lineHeight: 1.15 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#042f24', letterSpacing: -0.3 }}>
              Chinese SDGs Institute
            </div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
              语言考试备考策略 · 工具集
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
            color: targetC.exportFg, background: targetC.exportBg,
            padding: '6px 14px', borderRadius: 999,
            border: `1px solid ${targetC.exportAccent}30`,
          }}
        >
          Study Strategy
        </div>
      </div>

      {/* Current → Target hero */}
      <div
        style={{
          background: 'white',
          border: '2px solid #042f24',
          borderRadius: 24,
          padding: '36px 40px',
          marginBottom: 28,
        }}
      >
        <div
          style={{
            fontSize: 13, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase',
            color: '#042f24', marginBottom: 14,
          }}
        >
          当前 → 目标
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 84, fontWeight: 800, lineHeight: 0.9,
                color: currentC?.exportFg ?? '#94a3b8',
                letterSpacing: -3,
              }}
            >
              {result.currentCefr ?? '?'}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginTop: 8 }}>
              {meta.shortName} {score}
            </div>
          </div>
          <div style={{ fontSize: 64, color: '#cbd5e1', fontWeight: 300 }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 84, fontWeight: 800, lineHeight: 0.9,
                color: targetC.exportFg,
                letterSpacing: -3,
              }}
            >
              {result.targetCefr}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginTop: 8 }}>
              {result.targetCefrLabel.split(' / ')[0]}
            </div>
          </div>
          <div
            style={{
              marginLeft: 'auto', textAlign: 'center',
              padding: '14px 24px', borderRadius: 16,
              background: statusColor.bg, color: statusColor.fg,
              border: `1px solid ${statusColor.accent}40`,
              fontSize: 16, fontWeight: 800, letterSpacing: 0.5,
            }}
          >
            {statusColor.label}
          </div>
        </div>
      </div>

      {/* Two-column: 备考估算 | 弱项 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 28 }}>
        <div
          style={{
            background: 'white', border: '1px solid #e2e8f0', borderRadius: 20,
            padding: '24px 26px',
          }}
        >
          <div
            style={{
              fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
              color: '#94a3b8', marginBottom: 10,
            }}
          >
            备考估算
          </div>
          <div
            style={{
              fontSize: 48, fontWeight: 800, color: '#0f172a',
              fontFamily: 'Manrope, "SF Mono", monospace', letterSpacing: -2, lineHeight: 1,
            }}
          >
            {result.prepWeeks[0]}–{result.prepWeeks[1]}
          </div>
          <div style={{ fontSize: 16, color: '#475569', fontWeight: 600, marginTop: 4 }}>周</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, lineHeight: 1.4 }}>
            按 1 IELTS overall ≈ 8-12 周基线
          </div>
        </div>
        <div
          style={{
            background: result.weakestSkill ? '#fffbeb' : 'white',
            border: `1px solid ${result.weakestSkill ? '#fde68a' : '#e2e8f0'}`,
            borderRadius: 20, padding: '24px 26px',
          }}
        >
          <div
            style={{
              fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
              color: result.weakestSkill ? '#92400e' : '#94a3b8', marginBottom: 10,
            }}
          >
            弱项检测
          </div>
          {result.weakestSkill ? (
            <>
              <div
                style={{
                  fontSize: 48, fontWeight: 800, color: '#78350f',
                  fontFamily: 'Manrope, "SF Mono", monospace', letterSpacing: -2, lineHeight: 1,
                }}
              >
                {result.weakestSkill}
              </div>
              <div style={{ fontSize: 16, color: '#92400e', fontWeight: 600, marginTop: 4 }}>需要单项专题</div>
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize: 48, fontWeight: 800, color: '#10b981',
                  fontFamily: 'Manrope, "SF Mono", monospace', letterSpacing: -2, lineHeight: 1,
                }}
              >
                ——
              </div>
              <div style={{ fontSize: 16, color: '#475569', fontWeight: 600, marginTop: 4 }}>未填 per-skill</div>
            </>
          )}
        </div>
      </div>

      {/* Diagnosis bullets */}
      <div
        style={{
          background: 'white', border: '1px solid #e2e8f0', borderRadius: 20,
          padding: '24px 28px', marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
            color: '#042f24', marginBottom: 12,
          }}
        >
          诊断 · Diagnosis
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {result.reasoning.slice(0, 4).map((r, i) => (
            <li
              key={i}
              style={{
                display: 'flex', gap: 12, fontSize: 15, color: '#334155',
                lineHeight: 1.55, marginBottom: 10,
              }}
            >
              <span
                style={{
                  flexShrink: 0, marginTop: 8, width: 6, height: 6,
                  borderRadius: '50%', background: targetC.exportAccent,
                }}
              />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Test switch / validity warning if applicable */}
      {result.recommendedTest !== test && (
        <div
          style={{
            background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 20,
            padding: '20px 26px', marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
              color: '#155e75', marginBottom: 6,
            }}
          >
            考虑切换测试
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0e7490' }}>
            {meta.shortName} → {TEST_META[result.recommendedTest].shortName}
          </div>
          <div style={{ fontSize: 12, color: '#155e75', marginTop: 4 }}>
            注意：先确认目标校接受新测试
          </div>
        </div>
      )}

      {result.validityWarning && (
        <div
          style={{
            background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 20,
            padding: '20px 26px', marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase',
              color: '#9f1239', marginBottom: 6,
            }}
          >
            有效期警报
          </div>
          <div style={{ fontSize: 14, color: '#881337', lineHeight: 1.5 }}>
            {result.validityWarning}
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          paddingTop: 28, borderTop: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 12, color: '#94a3b8',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: '#475569' }}>校准日期 2026-05</div>
          <div style={{ marginTop: 2 }}>
            目标档：{TIER_LABEL[targetTier].split(' — ')[0]}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, color: '#042f24' }}>sdg.undp.ac.cn</div>
          <div style={{ marginTop: 2 }}>/tools/english-test</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Export PNG button (captures the off-screen card)
// ─────────────────────────────────────────────────────────────────────────

function ExportButton({ cardRef, filename, enabled }: { cardRef: React.RefObject<HTMLDivElement | null>; filename: string; enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const handleExport = async () => {
    if (!cardRef.current || !enabled) return;
    setBusy(true);
    try {
      const { toPng } = await import('html-to-image');
      // Wait for fonts (Manrope) to be loaded before rendering.
      if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
        await (document as any).fonts.ready;
      }
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export PNG failed:', err);
      alert('导出失败：请刷新页面重试');
    }
    setBusy(false);
  };
  return (
    <button
      onClick={handleExport}
      disabled={busy || !enabled}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
    >
      <span className="material-symbols-outlined text-[16px]">{busy ? 'hourglass_empty' : 'download'}</span>
      导出 PNG
    </button>
  );
}
