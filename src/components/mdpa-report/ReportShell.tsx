import { useState, useEffect, useRef, useCallback } from 'react'
import type { TocEntry } from '../../lib/mdpa/parseMarkdown'
import type { Dimension } from '../../lib/mdpa/constants'
import { DIMENSIONS } from '../../lib/mdpa/constants'
import ModeLanding from './ModeLanding'
import ModeToggle from './ModeToggle'
import LeftNav from './LeftNav'
import RightSubNav from './RightSubNav'
import OverviewCard from './OverviewCard'
import ContentSection from './ContentSection'
import DimensionSection from './DimensionSection'

interface DimensionData {
  html: string
  toc: TocEntry[]
}

export interface ReportShellProps {
  studentName: string
  mbtiType: string
  mbtiStrength: Record<string, number>
  ocean: Record<string, number>
  oceanRaw?: Record<string, number>
  nClusters?: Record<string, number>
  completedAt?: string
  totalQuestions?: number
  durationSeconds?: number
  dimensions: Record<string, DimensionData>
  interactions: { html: string; toc: TocEntry[] }
  personal: { html: string; toc: TocEntry[] }
}

// Map section IDs to their TOC entries
function getTocForSection(
  section: string,
  props: ReportShellProps
): TocEntry[] {
  if (section === 'interactions') return props.interactions.toc
  if (section === 'personal') return props.personal.toc
  if (section.startsWith('dim-')) {
    const dim = section.replace('dim-', '')
    return props.dimensions[dim]?.toc || []
  }
  return []
}

export default function ReportShell(props: ReportShellProps) {
  const [mode, setMode] = useState<'landing' | 'simple' | 'full'>('landing')
  const [activeSection, setActiveSection] = useState('overview')
  const [activeHeading, setActiveHeading] = useState('')
  const [expandedDims, setExpandedDims] = useState<Dimension[]>([])
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // IntersectionObserver for section tracking
  useEffect(() => {
    if (mode === 'landing') return

    const sections = contentRef.current?.querySelectorAll('section[id]')
    if (!sections) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [mode, expandedDims])

  // IntersectionObserver for heading tracking within active section
  useEffect(() => {
    if (mode === 'landing') return

    const headings = contentRef.current?.querySelectorAll('h2[id], h3[id]')
    if (!headings) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id)
          }
        }
      },
      { rootMargin: '-100px 0px -70% 0px', threshold: 0 }
    )

    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [mode, expandedDims])

  const scrollTo = useCallback((id: string) => {
    // If it's a dimension section, expand it first
    if (id.startsWith('dim-')) {
      const dim = id.replace('dim-', '') as Dimension
      if (!expandedDims.includes(dim)) {
        setExpandedDims((prev) => [...prev, dim])
      }
    }
    // If it's the "dimensions" nav group, just scroll to the first dimension
    if (id === 'dimensions') {
      const firstDim = expandedDims[0] || 'O'
      if (!expandedDims.includes(firstDim as Dimension)) {
        setExpandedDims((prev) => [...prev, firstDim as Dimension])
      }
      setTimeout(() => {
        document.getElementById(`dim-${firstDim}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
      return
    }
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    setMobileNavOpen(false)
  }, [expandedDims])

  const toggleDim = useCallback((dim: Dimension) => {
    setExpandedDims((prev) =>
      prev.includes(dim) ? prev.filter((d) => d !== dim) : [...prev, dim]
    )
  }, [])

  const handleModeSelect = useCallback((m: 'simple' | 'full') => {
    setMode(m)
    // Expand all dimensions by default
    setExpandedDims([...DIMENSIONS])
  }, [])

  // Landing screen
  if (mode === 'landing') {
    return (
      <ModeLanding
        onSelect={handleModeSelect}
        studentName={props.studentName}
        mbtiType={props.mbtiType}
      />
    )
  }

  const currentToc = getTocForSection(activeSection, props)

  return (
    <div
      data-mode={mode === 'full' ? 'full' : 'simple'}
      className="relative"
    >
      {/* CSS for mode-based hiding */}
      <style>{`
        [data-mode="simple"] [data-detail="true"] { display: none; }
      `}</style>

      {/* Three-panel layout */}
      <div className="lg:grid lg:grid-cols-[220px_1fr_200px] lg:gap-6 max-w-[1400px] mx-auto px-4 md:px-6">
        {/* Left nav — sticky, hidden on mobile */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto py-4">
            <LeftNav
              activeSection={activeSection}
              expandedDims={expandedDims}
              onNavigate={scrollTo}
            />
          </div>
        </aside>

        {/* Main content */}
        <main ref={contentRef} className="min-w-0 py-6">
          {/* Mode toggle bar */}
          <div className="flex items-center justify-between mb-8 sticky top-[72px] z-10 bg-surface/95 backdrop-blur-sm py-3 -mx-2 px-2 rounded-lg">
            <ModeToggle mode={mode === 'full' ? 'full' : 'simple'} onToggle={(m) => setMode(m)} />
            <a href={`#`} onClick={(e) => { e.preventDefault(); setMode('landing') }}
              className="text-sm text-on-surface-variant hover:text-primary transition-colors">
              切换模式
            </a>
          </div>

          {/* Overview */}
          <div className="mb-8">
            <OverviewCard
              studentName={props.studentName}
              mbtiType={props.mbtiType}
              mbtiStrength={props.mbtiStrength}
              ocean={props.ocean}
              oceanRaw={props.oceanRaw}
              nClusters={props.nClusters}
              completedAt={props.completedAt}
              totalQuestions={props.totalQuestions}
              durationSeconds={props.durationSeconds}
            />
          </div>

          {/* Interactions */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl border border-outline-variant/15 p-6 md:p-8 shadow-sm">
              <ContentSection id="interactions" html={props.interactions.html} />
            </div>
          </div>

          {/* Dimensions prompt */}
          <div className="mb-6" id="dimensions">
            <div className="text-center py-6">
              <h2 className="font-headline font-bold text-xl text-on-surface mb-2">
                想深入了解五大人格吗？
              </h2>
              <p className="text-sm text-on-surface-variant">
                点击展开每个维度的详细分析
              </p>
            </div>
          </div>

          {/* Dimension sections */}
          <div className="space-y-4 mb-8">
            {DIMENSIONS.map((dim) => (
              <DimensionSection
                key={dim}
                dim={dim}
                score={props.ocean[dim] ?? 0}
                html={props.dimensions[dim]?.html || ''}
                expanded={expandedDims.includes(dim)}
                onToggle={() => toggleDim(dim)}
              />
            ))}
          </div>

          {/* Personal analysis */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl border border-outline-variant/15 p-6 md:p-8 shadow-sm">
              <ContentSection id="personal" html={props.personal.html} />
            </div>
          </div>
        </main>

        {/* Right sub-nav — sticky, hidden on mobile */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto py-4">
            <RightSubNav
              toc={currentToc}
              activeHeading={activeHeading}
              onNavigate={(id) => {
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            />
          </div>
        </aside>
      </div>

      {/* Mobile FAB for nav */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined">{mobileNavOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute bottom-20 right-6 w-72 max-h-[60vh] bg-white rounded-2xl shadow-xl overflow-y-auto p-4">
            <LeftNav
              activeSection={activeSection}
              expandedDims={expandedDims}
              onNavigate={scrollTo}
            />
          </div>
        </div>
      )}
    </div>
  )
}
