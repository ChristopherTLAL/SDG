// Obsidian-style callout preprocessor.
//
// Converts blockquote-prefixed callouts of these shapes (with optional list
// indentation, since vault notes nest callouts inside bullets):
//
//   > [!type]
//   > body...
//
//   > [!type] Title
//   > body
//
//   > [!type｜Title]
//   > body
//
// into <aside class="callout"> HTML. Body markdown is rendered via
// marked.parse so wikilinks / lists / bold inside callouts still work.
//
// 全角 ｜ (U+FF5C) and ASCII | are both accepted as the in-bracket
// type-vs-title separator, since the vault uses ｜ by convention.
//
// Output is intentionally a single line (no internal newlines) so marked's
// CommonMark Type 6 HTML block parser doesn't terminate it early at any
// blank line that would otherwise sneak in from the inner markdown render.

import { marked } from 'marked';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

// `[ \t]*>` allows the callout to be indented inside a list item.
const CALLOUT_RE = /^([ \t]*)>\s*\[!\s*([^\]｜|]+?)(?:\s*[｜|]\s*([^\]]+?))?\s*\](?:\s+([^\n]*))?\n((?:[ \t]*>.*(?:\n|$))*)/gm;

export function preprocessCallouts(md: string): string {
  return md.replace(CALLOUT_RE, (
    _match,
    indent: string,
    type: string,
    titleIn: string | undefined,
    titleAfter: string | undefined,
    body: string,
  ) => {
    const cleanBody = (body || '')
      .split('\n')
      .map(l => l.replace(/^[ \t]*>\s?/, ''))
      .join('\n')
      .trim();
    const innerHtml = cleanBody ? (marked.parse(cleanBody) as string).trim() : '';
    const title = ((titleIn ?? titleAfter) ?? '').trim();
    const cleanType = type.trim();

    const headerInner =
      `<span class="callout__type">${escapeHtml(cleanType)}</span>` +
      (title ? `<span class="callout__title">${escapeHtml(title)}</span>` : '');
    const bodyHtml = innerHtml ? `<div class="callout__body">${innerHtml}</div>` : '';

    // Single line — no embedded newlines means no possibility of CommonMark
    // closing the HTML block prematurely. The leading indent is preserved so
    // the aside still associates with its enclosing list item if any.
    return `${indent}<aside class="callout" data-type="${escapeAttr(cleanType)}"><header class="callout__header">${headerInner}</header>${bodyHtml}</aside>\n`;
  });
}
