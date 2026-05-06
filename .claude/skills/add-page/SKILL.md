---
name: add-page
description: Create a new Astro page for the Chinese SDGs Institute public website following the Digital Curator design system. Use this skill when the user wants to add a new page, tool, or section to the website. Covers correct layout, design tokens, typography, and component patterns. NOTE — this skill is for the **public site only**; internal dashboard pages live under `src/pages/internal/` and use a different layout (`InternalLayout.astro`) and palette. Pages are English-only — the project removed Chinese pages and now uses a Google Translate banner in `Header.astro` for zh; do NOT create `src/pages/zh/...` versions.
---

# Add a New Page

Create new pages for the Chinese SDGs Institute public website following the Digital Curator design system.

> **English-only pages.** Earlier versions of this skill produced bilingual `src/pages/section/page.astro` + `src/pages/zh/section/page.astro` pairs. The Chinese pages have been removed; the site now uses a Google Translate banner in `Header.astro` to localize on demand. Sanity content keeps field-level `{en, zh}` shapes, but the Astro page tree is single-language.

## Design System Quick Reference

### Colors (Tailwind classes)
- Primary: `text-primary`, `bg-primary` (deep emerald #042f24)
- Surface hierarchy: `bg-surface`, `bg-surface-container-low`, `bg-surface-container`, `bg-surface-container-high`
- Text: `text-on-surface`, `text-on-surface-variant`, `text-on-primary`
- Borders: `border-outline-variant/10` or `/15`

### Typography
- Headlines: `font-headline font-extrabold` (Manrope)
- Body: `font-body` (Inter)
- Labels: `font-label` with `tracking-[0.2em] uppercase text-[10px]`

### Icons
Material Symbols Outlined: `<span class="material-symbols-outlined">icon_name</span>`

### Layout
- Max width: `max-w-6xl mx-auto px-6 md:px-12`
- Section spacing: `py-32`
- Page top padding: `pt-40 pb-32` (accounts for fixed header)

## File Structure

A single Astro file per page, English copy:
```
src/pages/section/page.astro        # e.g. src/pages/tools/my-tool.astro
```

Do NOT create a `src/pages/zh/...` mirror — Chinese pages were removed; Google Translate handles zh.

## Template

```astro
---
import MainLayout from '../../layouts/MainLayout.astro';
---

<MainLayout title="Page Title | Chinese SDGs Institute" description="..." lang="en">
  <main class="pt-40 pb-32">
    <!-- Hero -->
    <section class="max-w-6xl mx-auto px-6 md:px-12 mb-32">
      <div class="inline-flex items-center gap-2 bg-primary/5 text-primary px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-8">
        <span class="material-symbols-outlined text-[14px]">icon_name</span>
        Section Label
      </div>
      <h1 class="font-headline font-extrabold text-5xl md:text-6xl text-on-surface tracking-tighter leading-[1.02] mb-8">
        Page <span class="text-primary">Title</span>
      </h1>
      <p class="font-body text-xl text-on-surface-variant leading-relaxed max-w-xl">
        Description text.
      </p>
    </section>

    <!-- Content sections... -->
  </main>
</MainLayout>
```

## Common Patterns

### Card grid
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  <!-- Cards with: bg-white rounded-2xl border border-outline-variant/15 p-8 -->
</div>
```

### CTA banner (dark emerald)
```html
<div class="bg-primary rounded-[2rem] p-12 md:p-20 relative overflow-hidden shadow-2xl shadow-primary/20">
  <!-- White text content -->
</div>
```

### Glassmorphic sections
```html
<section class="bg-surface-container-low py-32 border-y border-outline-variant/10">
```

## Interactive Tools (with inline JS)

For tools with client-side JavaScript:
- Write all JS inside a `<script>` tag at the bottom of the Astro file
- Use `document.getElementById()` for DOM access
- Chinese smart quotes `"..."` break esbuild -- use corner brackets `「...」` instead
- Use `client:load` directive only for React components (ContentView)

## Checklist
1. Create the page at `src/pages/section/page.astro` (English copy; lang="en")
2. Add navigation links in `Header.astro` if the new page warrants top-nav placement
3. Add a card/link on the parent index page (e.g. `tools/index.astro`) so the new route is discoverable
4. Test with `npm run dev` — verify the page renders, mobile breakpoint OK, Google Translate banner toggles zh
5. Build with `npm run build` — verify no esbuild errors (watch for straight `"..."` in inline `<script>` blocks; use `「...」`)
