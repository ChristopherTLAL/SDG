---
name: add-illustration
description: Import, name, and integrate new hand-drawn illustrations into the Chinese SDGs Institute website. Use this skill when the user provides new illustration images, wants to update the illustration pool, or needs to adjust illustration-to-content mapping. Covers renaming, placement in public/images/illustrations/, and updating the deterministic assignment system.
---

# Add Illustrations

Manage the hand-drawn illustration system for the Chinese SDGs Institute website.

## Current System

44 illustrations live in `public/images/illustrations/` as PNG files with descriptive kebab-case names (e.g., `solar-energy.png`, `ocean-coral.png`).

The assignment system in `src/utils/illustrations.ts` uses:
1. **SDG tag mapping** (`sdgMap`): Each SDG (1-17) maps to a pool of thematically relevant illustration names
2. **djb2 hash**: Deterministic hash of the post slug selects from the pool
3. **Fallback**: If no SDG tag, selects from the full pool of 44 illustrations

## Adding New Illustrations

### Step 1: Review and name
Read each image file to understand its content, then assign a descriptive kebab-case name that captures the illustration's theme (e.g., `digital-literacy.png`, `ocean-cleanup.png`).

### Step 2: Place files
Copy renamed PNGs to `public/images/illustrations/`.

### Step 3: Update illustrations.ts

Add new illustration names to the `illustrations` array in `src/utils/illustrations.ts`.

If illustrations are thematically relevant to specific SDGs, add them to the appropriate `sdgMap` entries:

```typescript
const sdgMap: Record<string, string[]> = {
  'SDG 1': ['piggy-bank', 'economic-balance', 'new-illustration-name'],
  // ...
};
```

### Step 4: Verify
Run `npm run dev` and check that:
- New illustrations appear on posts/pages
- No broken image links
- Assignment remains deterministic (same slug always gets same image)

## SDG Tag Reference
- SDG 1: No Poverty
- SDG 2: Zero Hunger
- SDG 3: Good Health
- SDG 4: Quality Education
- SDG 5: Gender Equality
- SDG 6: Clean Water
- SDG 7: Affordable Energy
- SDG 8: Decent Work
- SDG 9: Industry/Innovation
- SDG 10: Reduced Inequalities
- SDG 11: Sustainable Cities
- SDG 12: Responsible Consumption
- SDG 13: Climate Action
- SDG 14: Life Below Water
- SDG 15: Life on Land
- SDG 16: Peace/Justice
- SDG 17: Partnerships

## Hero Images
Specific pages use specific illustrations as hero images (e.g., tools page uses `document-writing.png`). These are hardcoded in the page template, not assigned by the hash system.
