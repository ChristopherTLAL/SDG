import { DIMENSION_LABELS, DIMENSION_COLORS, DIMENSIONS } from '../../lib/mdpa/constants'

interface Props {
  studentName: string
  mbtiType: string
  mbtiStrength: Record<string, number>
  ocean: Record<string, number>
  oceanRaw?: Record<string, number>
  nClusters?: Record<string, number>
  completedAt?: string
  totalQuestions?: number
  durationSeconds?: number
}

export default function OverviewCard({
  studentName, mbtiType, mbtiStrength, ocean, oceanRaw, nClusters,
  completedAt, totalQuestions, durationSeconds,
}: Props) {
  const mbtiAxes = [
    { key: 'EI', labels: ['I 内向', 'E 外向'] },
    { key: 'NS', labels: ['S 实感', 'N 直觉'] },
    { key: 'FT', labels: ['T 思考', 'F 情感'] },
    { key: 'JP', labels: ['P 感知', 'J 判断'] },
  ] as const

  return (
    <section id="overview" className="scroll-mt-24">
      <div className="bg-white rounded-2xl border border-outline-variant/15 p-6 md:p-8 shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h2 className="font-headline font-extrabold text-2xl text-on-surface">{studentName}</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              {completedAt && new Date(completedAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
              {totalQuestions && ` · ${totalQuestions} 道题`}
              {durationSeconds && ` · ${Math.round(durationSeconds / 60)} 分钟`}
            </p>
          </div>
          <div className="bg-primary/5 px-6 py-3 rounded-xl text-center">
            <span className="font-headline font-extrabold text-3xl tracking-[4px] text-primary">{mbtiType}</span>
          </div>
        </div>

        {/* MBTI Strength Bars */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">MBTI 轴向强度</h3>
          <div className="space-y-3">
            {mbtiAxes.map(({ key, labels }) => {
              const v = mbtiStrength[key] ?? 0.5
              const pct = Math.round(Math.abs(v - 0.5) * 200)
              const strength = pct > 60 ? '明确' : pct > 20 ? '较明确' : '边界型'
              const strengthColor = pct > 60 ? 'bg-green-100 text-green-800' : pct > 20 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
              return (
                <div key={key}>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-on-surface-variant w-20">{labels[0]}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${strengthColor}`}>{strength}</span>
                    <span className="text-on-surface-variant w-20 text-right">{labels[1]}</span>
                  </div>
                  <div className="h-4 bg-surface-container-low rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all bg-primary"
                      style={{ width: `${Math.round(v * 100)}%`, opacity: v >= 0.5 ? 1 : 0.4 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* OCEAN Scores */}
        <div>
          <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">OCEAN 大五人格</h3>
          <div className="grid grid-cols-5 gap-3">
            {DIMENSIONS.map((dim) => {
              const score = ocean[dim] ?? 0
              const colors = DIMENSION_COLORS[dim]
              const labels = DIMENSION_LABELS[dim]
              const height = Math.max(8, Math.round(score * 100))
              return (
                <div key={dim} className="text-center">
                  <div className="h-24 flex items-end justify-center mb-2">
                    <div
                      className={`w-10 rounded-t-lg ${colors.light} border ${colors.accent.replace('border', 'border')} transition-all`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <div className="font-mono text-xs font-bold text-on-surface">{dim}</div>
                  <div className="text-[11px] text-on-surface-variant">{labels.zh}</div>
                  <div className="font-mono text-sm font-bold mt-1">{score.toFixed(2)}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Detail-only: raw scores, N clusters */}
        <div data-detail="true" className="mt-6 pt-6 border-t border-outline-variant/15">
          {oceanRaw && (
            <div className="mb-4">
              <h4 className="text-xs font-bold text-on-surface-variant mb-2">原始分（AV校准前）</h4>
              <div className="flex gap-4 text-sm">
                {(['O', 'C', 'E', 'A'] as const).map((d) => (
                  <span key={d} className="font-mono">{d}: {(oceanRaw[d] ?? 0).toFixed(3)}</span>
                ))}
              </div>
            </div>
          )}
          {nClusters && (
            <div>
              <h4 className="text-xs font-bold text-on-surface-variant mb-2">N 子维度</h4>
              <div className="flex gap-4 text-sm">
                <span className="font-mono">反刍 ar: {(nClusters.ar ?? 0).toFixed(2)}</span>
                <span className="font-mono">压力 sv: {(nClusters.sv ?? 0).toFixed(2)}</span>
                <span className="font-mono">情绪 er: {(nClusters.er ?? 0).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
