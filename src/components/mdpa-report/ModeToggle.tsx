interface Props {
  mode: 'simple' | 'full'
  onToggle: (mode: 'simple' | 'full') => void
}

export default function ModeToggle({ mode, onToggle }: Props) {
  return (
    <div className="flex items-center gap-1 bg-surface-container rounded-full p-1">
      <button
        onClick={() => onToggle('simple')}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
          mode === 'simple'
            ? 'bg-primary text-white shadow-sm'
            : 'text-on-surface-variant hover:text-on-surface'
        }`}
      >
        性格解析
      </button>
      <button
        onClick={() => onToggle('full')}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
          mode === 'full'
            ? 'bg-primary text-white shadow-sm'
            : 'text-on-surface-variant hover:text-on-surface'
        }`}
      >
        数据分析报告
      </button>
    </div>
  )
}
