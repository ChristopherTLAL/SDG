import type { TocEntry } from '../../lib/mdpa/parseMarkdown'

interface Props {
  toc: TocEntry[]
  activeHeading: string
  onNavigate: (id: string) => void
}

export default function RightSubNav({ toc, activeHeading, onNavigate }: Props) {
  if (!toc.length) return null

  return (
    <nav className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-3 px-2">
        本节目录
      </p>
      {toc.map((entry) => (
        <button
          key={entry.id}
          onClick={() => onNavigate(entry.id)}
          className={`w-full text-left px-2 py-1.5 rounded text-sm transition-all ${
            entry.level === 3 ? 'pl-5' : ''
          } ${
            activeHeading === entry.id
              ? 'text-primary font-medium bg-primary/5'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {entry.text}
        </button>
      ))}
    </nav>
  )
}
