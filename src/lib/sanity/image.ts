// src/lib/sanity/image.ts
import imageUrlBuilder from '@sanity/image-url';
import { sanity } from './client';

const builder = imageUrlBuilder(sanity);

export function urlForImage(source: any) {
  return builder.image(source).auto('format').fit('max');
}
