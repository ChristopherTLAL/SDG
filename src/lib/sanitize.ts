import createDOMPurify from 'dompurify';
import { Window } from 'happy-dom';

// Server-side HTML sanitizer for markdown→HTML output (marked / MDPA parseMarkdown /
// Obsidian callouts + wikilinks) before it reaches set:html / dangerouslySetInnerHTML.
//
// DOMPurify needs a DOM. We back it with happy-dom rather than jsdom: jsdom 27
// require()s the ESM-only parse5, which throws ERR_REQUIRE_ESM on Node < 22.12 — i.e.
// Vercel's serverless runtime — taking down every page that renders markdown
// (2026-05-21 prod incident). happy-dom has its own parser (no require(esm)) and,
// unlike linkedom, implements the DOM bits DOMPurify probes for (document.implementation
// .createHTMLDocument, NodeFilter) so DOMPurify.isSupported stays true — without that
// DOMPurify silently passes input through unsanitized.
//
// All current inputs are trusted (vault-authored notes, AI-generated MDPA reports),
// so this is defense-in-depth: it neutralizes <script>, on*-handlers, and
// javascript:/data: URLs the day any web-form text flows through these renderers,
// while preserving the structural HTML those renderers emit — headings with `id`s,
// callout <aside>/<header>/<div>/<span> (class + data-type), wikilink <a>/<span>
// (class + href + title), tables, and the MDPA `data-detail` section wrappers.
// DOMPurify keeps those by default; we only need to re-allow `target` on links.
// happy-dom's Window provides the DOM surface DOMPurify needs at runtime; the cast
// just bridges the nominal type gap with DOMPurify's WindowLike.
const DOMPurify = createDOMPurify(new Window() as any);

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ADD_ATTR: ['target'], ALLOW_DATA_ATTR: true });
}
