// src/lib/sanity/pt.ts
import { toHTML } from '@portabletext/to-html';

export function portableTextToHtml(body: any) {
  return toHTML(body ?? []);
}
