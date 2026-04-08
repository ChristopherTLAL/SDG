interface Props {
  id: string
  html: string
  className?: string
}

export default function ContentSection({ id, html, className = '' }: Props) {
  return (
    <section id={id} className={`scroll-mt-24 ${className}`}>
      <div
        className="prose prose-slate max-w-none prose-headings:font-headline prose-headings:text-on-surface prose-p:text-on-surface/85 prose-p:leading-relaxed prose-strong:text-on-surface prose-blockquote:border-primary/30 prose-blockquote:text-on-surface-variant prose-a:text-primary"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  )
}
