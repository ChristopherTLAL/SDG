// English Test Cross-walk + Programme-fit + Strategy tool.
// Three-tab single-page UI. Public-site design tokens.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CROSS_WALK, TEST_META, PROGRAMMES, CEFR_ORDER,
  matchCefr, convertScore, programmeFit, findProgrammeFits, strategy,
} from '../data/english-tests/conversions';
import { REGION_LABEL, TIER_LABEL } from '../data/english-tests/programmes';
import type {
  TestKey, CEFRBand, Region, Tier, UserScores, FitResult,
} from '../data/english-tests/types';

type Tab = 'convert' | 'fit' | 'strategy';

// CEFR color spectrum: A1 red → C2 indigo
const CEFR_COLORS: Record<CEFRBand, { bg: string; text: string; border: string; bar: string }> = {
  'A1':  { bg: 'bg-rose-50',     text: 'text-rose-900',     border: 'border-rose-200',   bar: 'bg-rose-400'    },
  'A2':  { bg: 'bg-orange-50',   text: 'text-orange-900',   border: 'border-orange-200', bar: 'bg-orange-400'  },
  'A2+': { bg: 'bg-amber-50',    text: 'text-amber-900',    border: 'border-amber-200',  bar: 'bg-amber-400'   },
  'B1':  { bg: 'bg-yellow-50',   text: 'text-yellow-900',   border: 'border-yellow-200', bar: 'bg-yellow-500'  },
  'B1+': { bg: 'bg-lime-50',     text: 'text-lime-900',     border: 'border-lime-200',   bar: 'bg-lime-500'    },
  'B2-': { bg: 'bg-green-50',    text: 'text-green-900',    border: 'border-green-200',  bar: 'bg-green-500'   },
  'B2':  { bg: 'bg-emerald-50',  text: 'text-emerald-900',  border: 'border-emerald-200',bar: 'bg-emerald-500' },
  'B2+': { bg: 'bg-teal-50',     text: 'text-teal-900',     border: 'border-teal-200',   bar: 'bg-teal-500'    },
  'C1':  { bg: 'bg-cyan-50',     text: 'text-cyan-900',     border: 'border-cyan-200',   bar: 'bg-cyan-600'    },
  'C1+': { bg: 'bg-blue-50',     text: 'text-blue-900',     border: 'border-blue-200',   bar: 'bg-blue-600'    },
  'C2':  { bg: 'bg-indigo-50',   text: 'text-indigo-900',   border: 'border-indigo-200', bar: 'bg-indigo-600'  },
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

export default function EnglishTestTool() {
  const [tab, setTab] = useState<Tab>('convert');

  // Shared state across tabs
  const [test, setTest] = useState<TestKey>('ielts');
  const [score, setScore] = useState<string>('6.5');
  const [showPerSkill, setShowPerSkill] = useState(false);
  const [perSkill, setPerSkill] = useState<{ L: string; R: string; W: string; S: string }>({
    L: '', R: '', W: '', S: '',
  });

  // Tab 2 state
  const [regions, setRegions] = useState<Region[]>(['UK']);
  const [tiers, setTiers] = useState<Tier[]>(['TOP', 'STRONG']);

  // Tab 3 state
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
          { key: 'fit',      label: '学校匹配', sub: 'Programme fit', icon: 'school' },
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
      {tab === 'fit' && (
        <FitTab
          test={test} setTest={setTest}
          score={score} setScore={setScore}
          showPerSkill={showPerSkill} setShowPerSkill={setShowPerSkill}
          perSkill={perSkill} setPerSkill={setPerSkill}
          regions={regions} setRegions={setRegions}
          tiers={tiers} setTiers={setTiers}
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
        UK / US / HK / SG / AU / CA 主流学校录取门槛匹配 + 备考策略建议。
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
  const exportRef = useRef<HTMLDivElement>(null);

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
                {showPerSkill ? '收起' : '展开'} per-skill 小分（顾问铁律：从来不只看 overall）
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
          <p className="mt-2 text-[11px] leading-snug">官方 = test publisher 验证；约定 = 业界共识；近似 = 研究估算（GRE/SAT/CET 等）</p>
        </div>
      </aside>

      {/* Result column */}
      <div className="md:col-span-8 space-y-6" ref={exportRef}>
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
                <ExportButton targetRef={exportRef} filename={`english-test-convert-${test}-${score}`} />
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
// Tab 2: Programme Fit
// ─────────────────────────────────────────────────────────────────────────

function FitTab(props: {
  test: TestKey; setTest: (t: TestKey) => void;
  score: string; setScore: (s: string) => void;
  showPerSkill: boolean; setShowPerSkill: (v: boolean) => void;
  perSkill: { L: string; R: string; W: string; S: string };
  setPerSkill: (p: { L: string; R: string; W: string; S: string }) => void;
  regions: Region[]; setRegions: (r: Region[]) => void;
  tiers: Tier[]; setTiers: (t: Tier[]) => void;
}) {
  const { test, setTest, score, setScore, showPerSkill, setShowPerSkill, perSkill, setPerSkill, regions, setRegions, tiers, setTiers } = props;
  const exportRef = useRef<HTMLDivElement>(null);

  const numScore = parseFloat(score);
  const fits = useMemo(() => {
    if (isNaN(numScore)) return null;
    const ps = (showPerSkill && (perSkill.L || perSkill.R || perSkill.W || perSkill.S))
      ? {
        L: parseFloat(perSkill.L) || undefined,
        R: parseFloat(perSkill.R) || undefined,
        W: parseFloat(perSkill.W) || undefined,
        S: parseFloat(perSkill.S) || undefined,
      } : undefined;
    return findProgrammeFits(
      { test, overall: numScore, perSkill: ps },
      { regions, tiers },
    );
  }, [test, numScore, perSkill.L, perSkill.R, perSkill.W, perSkill.S, showPerSkill, regions, tiers]);

  const toggleRegion = (r: Region) => {
    setRegions(regions.includes(r) ? regions.filter((x) => x !== r) : [...regions, r]);
  };
  const toggleTier = (t: Tier) => {
    setTiers(tiers.includes(t) ? tiers.filter((x) => x !== t) : [...tiers, t]);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
      <aside className="md:col-span-4 space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">你的考试 + 分数</label>
          <select
            value={test}
            onChange={(e) => setTest(e.target.value as TestKey)}
            className="w-full px-3 py-2.5 mb-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <optgroup label="主流">
              {PRIMARY_TESTS.map((k) => (
                <option key={k} value={k}>{TEST_META[k].display}</option>
              ))}
            </optgroup>
            <optgroup label="次要">
              {SECONDARY_TESTS.map((k) => (
                <option key={k} value={k}>{TEST_META[k].display}</option>
              ))}
            </optgroup>
          </select>
          <ScoreInput test={test} value={score} onChange={setScore} />

          {TEST_META[test].perSkill && (
            <div className="mt-3">
              <button
                onClick={() => setShowPerSkill(!showPerSkill)}
                className="text-[12px] text-primary font-semibold flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-[14px]">{showPerSkill ? 'expand_less' : 'expand_more'}</span>
                {showPerSkill ? '收起' : '展开'} per-skill
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
          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">地区</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(['UK', 'US', 'HK', 'SG', 'AU', 'CA'] as Region[]).map((r) => (
              <button
                key={r}
                onClick={() => toggleRegion(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  regions.includes(r)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'
                }`}
              >
                {REGION_LABEL[r].split(' ')[0]}
              </button>
            ))}
          </div>

          <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">档位</div>
          <div className="flex flex-col gap-1.5">
            {(['TOP', 'STRONG', 'MID', 'STANDARD'] as Tier[]).map((t) => (
              <button
                key={t}
                onClick={() => toggleTier(t)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left transition-colors leading-tight ${
                  tiers.includes(t)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'
                }`}
              >
                {TIER_LABEL[t]}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="md:col-span-8 space-y-6" ref={exportRef}>
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-extrabold text-lg">匹配结果</h3>
          {fits && <ExportButton targetRef={exportRef} filename={`english-test-fit-${test}-${score}`} />}
        </div>

        {!fits && <div className="text-slate-500 text-sm">输入分数后查看</div>}
        {fits && fits.qualified.length === 0 && fits.borderline.length === 0 && fits.below.length === 0 && (
          <div className="text-slate-500 text-sm">所选地区/档位无匹配项目，请调整 filter</div>
        )}

        {fits && (
          <>
            <FitGroup title="稳过门槛" subtitle="overall ≥ 要求 + 0.5 缓冲" tone="qualified" fits={fits.qualified} />
            <FitGroup title="擦线 / 风险" subtitle="overall = 要求；或 per-skill 缺口" tone="borderline" fits={fits.borderline} />
            <FitGroup title="不够 / 暂不达标" subtitle="overall 未达 要求" tone="below" fits={fits.below} />
          </>
        )}
      </div>
    </div>
  );
}

function FitGroup({ title, subtitle, tone, fits }: { title: string; subtitle: string; tone: 'qualified' | 'borderline' | 'below'; fits: FitResult[] }) {
  const styles = {
    qualified:  { bg: 'bg-emerald-50',  border: 'border-emerald-200', icon: 'check_circle',     iconColor: 'text-emerald-600' },
    borderline: { bg: 'bg-amber-50',    border: 'border-amber-200',   icon: 'warning_amber',    iconColor: 'text-amber-600' },
    below:      { bg: 'bg-rose-50',     border: 'border-rose-200',    icon: 'cancel',           iconColor: 'text-rose-600' },
  }[tone];

  if (fits.length === 0) {
    return (
      <div className={`rounded-2xl border ${styles.border} ${styles.bg} p-4 opacity-50`}>
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined ${styles.iconColor} text-[20px]`}>{styles.icon}</span>
          <span className="font-bold text-sm">{title}</span>
          <span className="text-xs text-slate-500">— 无</span>
        </div>
      </div>
    );
  }
  return (
    <div className={`rounded-2xl border ${styles.border} ${styles.bg} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`material-symbols-outlined ${styles.iconColor} text-[22px]`}>{styles.icon}</span>
        <span className="font-headline font-extrabold text-base">{title}</span>
        <span className="ml-1 px-2 py-0.5 rounded-full bg-white text-xs font-bold border">{fits.length}</span>
        <span className="text-xs text-slate-500 ml-2">{subtitle}</span>
      </div>
      <div className="space-y-2">
        {fits.map((f) => (
          <FitCard key={f.programme.id} fit={f} tone={tone} />
        ))}
      </div>
    </div>
  );
}

function FitCard({ fit, tone }: { fit: FitResult; tone: 'qualified' | 'borderline' | 'below' }) {
  const p = fit.programme;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
      <div className="flex flex-wrap items-baseline gap-2 mb-1.5">
        <h4 className="font-bold text-sm text-slate-900">{p.university}</h4>
        <span className="text-xs text-slate-500">— {p.level}</span>
        <span className="ml-auto text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {REGION_LABEL[p.region].split(' ')[0]} · {p.tier}
        </span>
      </div>
      <div className="text-xs text-slate-600 leading-relaxed mb-2">{fit.gapDescription}</div>
      {fit.prepWeeksEstimate && (
        <div className="text-[11px] text-slate-500 mb-1">
          📚 备考估算：{fit.prepWeeksEstimate[0]}-{fit.prepWeeksEstimate[1]} 周
        </div>
      )}
      <div className="text-[11px] text-slate-500 leading-tight mt-1">
        <span className="font-semibold">接受测试：</span>{fit.acceptedTestsList.join(' · ')}
      </div>
      {fit.notAcceptedFlags.length > 0 && (
        <div className="text-[11px] text-rose-600 mt-1.5 leading-tight">
          ⚠ {fit.notAcceptedFlags.join(' / ')}
        </div>
      )}
      {p.notes && (
        <div className="text-[11px] text-slate-500 mt-1.5 italic leading-tight">注：{p.notes}</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Tab 3: Strategy
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
  const exportRef = useRef<HTMLDivElement>(null);

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

      <div className="md:col-span-8 space-y-5" ref={exportRef}>
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-extrabold text-lg">策略建议</h3>
          {result && <ExportButton targetRef={exportRef} filename={`english-test-strategy-${test}-${score}`} />}
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Export PNG button
// ─────────────────────────────────────────────────────────────────────────

function ExportButton({ targetRef, filename }: { targetRef: React.RefObject<HTMLDivElement | null>; filename: string }) {
  const [busy, setBusy] = useState(false);
  const handleExport = async () => {
    if (!targetRef.current) return;
    setBusy(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(targetRef.current, {
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
      disabled={busy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
    >
      <span className="material-symbols-outlined text-[16px]">{busy ? 'hourglass_empty' : 'download'}</span>
      导出 PNG
    </button>
  );
}
