// Leaflet is loaded from a CDN <script> in the page (classic script, runs before this
// deferred module), so the global `L` is available by the time any of these modules run.
// Kept untyped (the CDN build ships no types and we avoid an npm dep).
export const L: any = (globalThis as any).L;
