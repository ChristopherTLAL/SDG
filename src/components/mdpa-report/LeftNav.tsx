import { DIMENSION_LABELS, DIMENSION_COLORS, type Dimension } from '../../lib/mdpa/constants'

interface Props {
  activeSection: string
  expandedDims: Dimension[]
  onNavigate: (id: string) => void
}

const NAV_ITEMS = [
  { id: 'overview', label: '概览', icon: 'dashboard' },
  { id: 'interactions', label: '维度交互解读', icon: 'hub' },
  { id: 'dimensions', label: '五大人格深度', icon: 'psychology_alt', children: (['O', 'C', 'E', 'A', 'N'] as Dimension[]) },
  { id: 'personal', label: '个人化深度分析', icon: 'person' },
]

export default function LeftNav({ activeSection, expandedDims, onNavigate }: Props) {
  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => (
        <div key={item.id}>
          <button
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === item.id || (item.children && item.children.some(d => activeSection === `dim-${d}`))
                ? 'bg-primary/8 text-primary'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{item.icon}</span>
            {item.label}
          </button>
          {item.children && (
            <div className="ml-4 mt-1 space-y-0.5">
              {item.children.map((dim) => {
                const colors = DIMENSION_COLORS[dim]
                const labels = DIMENSION_LABELS[dim]
                const isActive = activeSection === `dim-${dim}`
                return (
                  <button
                    key={dim}
                    onClick={() => onNavigate(`dim-${dim}`)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all border-l-2 ${
                      isActive
                        ? `${colors.accent} ${colors.text} ${colors.bg}`
                        : 'border-transparent text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold">{dim}</span>
                    {labels.zh}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}
