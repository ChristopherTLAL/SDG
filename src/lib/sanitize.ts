import DOMPurify from 'isomorphic-dompurify';

// Server-side HTML sanitizer for markdown→HTML output (marked / MDPA parseMarkdown /
// Obsidian callouts + wikilinks) before it reaches set:html / dangerouslySetInnerHTML.
//
// All current inputs are trusted (vault-authored notes, AI-generated MDPA reports),
// so this is defense-in-depth: it neutralizes <script>, on*-handlers, and
// javascript:/data: URLs the day any web-form text flows through these renderers,
// while preserving the structural HTML those renderers emit — headings with `id`s,
// callout <aside>/<header>/<div>/<span> (class + data-type), wikilink <a>/<span>
// (class + href + title), tables, and the MDPA `data-detail` section wrappers.
// DOMPurify keeps those by default; we only need to re-allow `target` on links.
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ADD_ATTR: ['target'], ALLOW_DATA_ATTR: true });
}
