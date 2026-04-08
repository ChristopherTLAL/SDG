import { Marked, Renderer } from 'marked'
import { DETAIL_HEADING_PATTERNS } from './constants'

export interface TocEntry {
  id: string
  text: string
  level: number
}

/**
 * Parse markdown to HTML with heading IDs and TOC extraction.
 * Wraps sections under "数据画像" and "行为证据" headings in data-detail divs
 * so they can be hidden in "simple" mode via CSS.
 */
export function parseMarkdown(md: string): { html: string; toc: TocEntry[] } {
  const toc: TocEntry[] = []
  let detailSectionOpen = false

  const renderer = new Renderer()

  renderer.heading = ({ text, depth }: { text: string; depth: number }) => {
    const plainText = text.replace(/<[^>]+>/g, '')
    const id = plainText
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff]+/g, '-')
      .replace(/^-|-$/g, '')

    if (depth >= 2 && depth <= 3) {
      toc.push({ id, text: plainText, level: depth })
    }

    const isDetail = depth === 2 && DETAIL_HEADING_PATTERNS.some((p) => p.test(plainText))

    let prefix = ''

    if (detailSectionOpen && depth <= 2) {
      prefix = '</div>'
      detailSectionOpen = false
    }

    if (isDetail) {
      prefix += '<div data-detail="true">'
      detailSectionOpen = true
    }

    const tag = `h${depth}`
    return `${prefix}<${tag} id="${id}">${text}</${tag}>\n`
  }

  const instance = new Marked({ renderer, gfm: true, breaks: false })
  let html = instance.parse(md) as string

  if (detailSectionOpen) {
    html += '</div>'
  }

  return { html, toc }
}
