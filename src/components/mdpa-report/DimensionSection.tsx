import { DIMENSION_COLORS, DIMENSION_LABELS, type Dimension } from '../../lib/mdpa/constants'

interface Props {
  dim: Dimension
  score: number
  html: string
  expanded: boolean
  onToggle: () => void
}

export default function DimensionSection({ dim, score, html, expanded, onToggle }: Props) {
  const colors = DIMENSION_COLORS[dim]
  const labels = DIMENSION_LABELS[dim]

  return (
    <section id={`dim-${dim}`} className="scroll-mt-24">
      <div className={`bg-white rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden`}>
        {/* Header — always visible */}
        <button
          onClick={onToggle}
          className={`w-full flex items-center justify-between p-5 md:p-6 border-l-4 ${colors.accent} hover:bg-surface-container-lowest transition-colors`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${colors.light} flex items-center justify-center`}>
              <span className={`font-mono font-bold text-lg ${colors.text}`}>{dim}</span>
            </div>
            <div className="text-left">
              <h3 className="font-headline font-bold text-lg text-on-surface">
                {labels.zh} <span className="text-on-surface-variant font-normal text-sm">{labels.en}</span>
              </h3>
              <p className="text-sm text-on-surface-variant mt-0.5">
                校准分: <span className="font-mono font-bold">{score.toFixed(3)}</span>
              </p>
            </div>
          </div>
          <span className={`material-symbols-outlined text-2xl text-on-surface-variant transition-transform ${expanded ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {/* Content — expandable */}
        {expanded && (
          <div className={`p-5 md:p-8 pt-0 md:pt-0 border-l-4 ${colors.accent}`}>
            <div
              className="prose prose-slate max-w-none prose-headings:font-headline prose-headings:text-on-surface prose-p:text-on-surface/85 prose-p:leading-relaxed prose-strong:text-on-surface prose-blockquote:border-primary/30 prose-blockquote:text-on-surface-variant prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        )}
      </div>
    </section>
  )
}
