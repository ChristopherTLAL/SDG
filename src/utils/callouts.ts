// Obsidian-style callout preprocessor.
//
// Converts blockquote-prefixed callouts of these shapes:
//   > [!type] body...
//   > [!type] Title
//   > body
//   > [!type｜Title]
//   > body
//
// into styled <aside class="callout"> HTML. Body markdown is rendered via
// the caller-supplied marked.parse so wikilinks / lists / etc. still work
// inside the callout.
//
// 全角 ｜ (U+FF5C) and ASCII | are both accepted as the in-bracket
// type-vs-title separator, since the vault uses ｜ by convention.

import { marked } from 'marked';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

const CALLOUT_RE = /^>\s*\[!\s*([^\]｜|]+?)(?:\s*[｜|]\s*([^\]]+?))?\s*\](?:\s+([^\n]*))?\n((?:>.*(?:\n|$))*)/gm;

export function preprocessCallouts(md: string): string {
  return md.replace(CALLOUT_RE, (_match, type: string, titleIn: string | undefined, titleAfter: string | undefined, body: string) => {
    const cleanBody = (body || '')
      .split('\n')
      .map(l => l.replace(/^>\s?/, ''))
      .join('\n')
      .trim();
    const innerHtml = cleanBody ? (marked.parse(cleanBody) as string) : '';
    const title = ((titleIn ?? titleAfter) ?? '').trim();
    const cleanType = type.trim();

    return [
      '',
      `<aside class="callout" data-type="${escapeAttr(cleanType)}">`,
      `<header class="callout__header">`,
      `<span class="callout__type">${escapeHtml(cleanType)}</span>`,
      title ? `<span class="callout__title">${escapeHtml(title)}</span>` : '',
      `</header>`,
      innerHtml ? `<div class="callout__body">${innerHtml}</div>` : '',
      `</aside>`,
      '',
    ].filter(Boolean).join('\n');
  });
}
