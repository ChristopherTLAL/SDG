interface Props {
  onSelect: (mode: 'simple' | 'full') => void
  studentName: string
  mbtiType: string
}

export default function ModeLanding({ onSelect, studentName, mbtiType }: Props) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-primary/5 text-primary px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
          <span className="material-symbols-outlined text-[14px]">psychology</span>
          MDPA Report
        </div>
        <h1 className="font-headline font-extrabold text-3xl md:text-4xl text-on-surface tracking-tight mb-2">
          {studentName}的人格报告
        </h1>
        <p className="text-on-surface-variant">
          {mbtiType} · 请选择阅读模式
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
        <button
          onClick={() => onSelect('simple')}
          className="group bg-white rounded-2xl border border-outline-variant/15 p-8 text-left shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
        >
          <span className="material-symbols-outlined text-4xl text-primary mb-4 block">self_improvement</span>
          <h3 className="font-headline font-bold text-lg text-on-surface mb-2">性格解析</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            聚焦内心叙事与成长建议，以温暖的笔触帮你理解自己的人格特质。适合初次阅读。
          </p>
        </button>

        <button
          onClick={() => onSelect('full')}
          className="group bg-white rounded-2xl border border-outline-variant/15 p-8 text-left shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
        >
          <span className="material-symbols-outlined text-4xl text-primary mb-4 block">analytics</span>
          <h3 className="font-headline font-bold text-lg text-on-surface mb-2">数据分析报告</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            完整呈现数据画像、行为证据与反应时间分析。内容丰富，适合深度探索。
          </p>
        </button>
      </div>
    </div>
  )
}
