---
name: mdpa-report
description: Generate a rich, humanistic MDPA personality analysis report from a student's test result stored in Sanity, publishing it as an interactive web report and optionally as Excel. Use this skill when the user asks to "generate a report", "analyze MDPA result", "做报告", "生成人格报告", or references an MDPA result ID. IMPORTANT — only run when the user explicitly requests it, as it spawns multiple agents and consumes significant tokens.
---

# MDPA Report Generation

Generate a professional personality analysis report from a student's MDPA (Multi-Dimensional Personality Dynamic Assessment) test result. Reports are published as interactive web pages at `/tools/personality/<resultId>` with two reading modes (性格解析 simple / 数据分析报告 full), and optionally as Excel workbooks. The report combines data analysis with warm, humanistic narrative writing that makes students feel deeply understood.

## When to Use

ONLY when the user explicitly asks you to generate a report for a specific MDPA result. Never run proactively — this pipeline spawns multiple agents and is token-intensive.

## Prerequisites

- Python 3 with `xlsxwriter` installed
- Sanity MCP configured (project `waxbya4l`, dataset `production`)
- The preprocessing script at `scripts/mdpa_preprocess.py`
- The Excel generation script at `scripts/generate_excel_report.py`

## Pipeline Overview

```
Sanity Query → Raw JSON → Preprocessing → 5 Dimension Agents (parallel)
                                              ↓
                                    Agent B (cross-dimension + personal)
                                              ↓
                                    Patch reports to Sanity → Publish
                                              ↓
                                    (Optional) Excel Generation
```

## Step 1: Fetch the Result from Sanity

Query the MDPA result document using the Sanity MCP:

```groq
*[_type == "mdpaResult" && resultId == $resultId][0]{
  resultId, studentName, studentEmail, studentBackground,
  mbtiType, mbtiStrengths, oceanScores, nClusters,
  rawResponses, completedAt
}
```

Parse `rawResponses` from string to JSON array if needed. Save the full result as `scripts/mdpa_processed/<resultId>/raw_result.json`.

## Step 2: Preprocess Data

Run the preprocessing script to generate per-dimension structured data:

```bash
python3 scripts/mdpa_preprocess.py <resultId>
```

This produces `00_overview.json` and `dim_O.json`, `dim_C.json`, `dim_E.json`, `dim_A.json`, `dim_N.json` in `scripts/mdpa_processed/<resultId>/`.

If the script doesn't accept command-line args yet, update it to do so, or manually set the result ID.

## Step 3: Spawn Dimension Analysis Agents (Parallel)

Spawn 5 agents in parallel, one per OCEAN dimension. Each agent:
- Reads the dimension JSON file and overview data
- Writes a rich, humanistic analysis in Chinese (with English terms in parentheses)
- Saves to `scripts/mdpa_processed/<resultId>/report_<dim>.md`

### Agent Prompt Template for Each Dimension

Each dimension agent should receive:
1. The dimension JSON data (all items, scores, RT data)
2. The overview data (student info, other dimension scores for cross-reference)
3. The writing style guide below

The report for each dimension must include these four H2 sections:

- **`## 数据画像`**: calibrated score, raw score, AV adjustment, what it means. Write clearly and accessibly — explain technical terms in plain language so a non-psychology reader can follow. Use analogies to make numbers tangible.
- **`## 行为证据`**: walk through specific SIT, PAIR, POL, and AV items with reaction times. Quote the actual choices the student made. Interpret RT — fast choices = high certainty, slow choices = internal conflict. **This section stays analytical and precise** — data-driven, structured, with clear item-by-item analysis. No literary flourishes needed here; accuracy and thoroughness are the priority.
- **`## 内心叙事`**: This is where the writing becomes literary. Write with precision and spiritual aliveness (灵性). Use vivid sensory metaphors, unexpected juxtapositions, and images that linger. The goal is to make the reader feel seen at a level deeper than data can reach. Don't overdo it; one perfectly placed metaphor is worth more than five. Keep the best lines rare so they land with full weight. **CRITICAL: Never name or quote any literary figure as a style reference. The literary quality must be internalized, not signaled. Mentioning style inspirations is prompt leaking.**
- **`## 成长提示`**: 3-4 actionable suggestions contextualized to the student's background. Write warmly but practically — each tip should feel like advice from a wise friend, not a textbook.

### Writing Style Hierarchy

**Priority 1: Accuracy of meaning (含义传达的准确).** Never sacrifice precision for style. When technical terms, English psychological concepts, or code-switching serves clarity, break out of any stylistic constraint. A well-placed English term in parentheses is better than a forced Chinese paraphrase that loses nuance.

**Priority 2: Humanistic warmth (人文关怀).** The reader should feel understood, not studied. Write TO the person, not ABOUT them. The data is just a lens — what matters is the human story it reveals.

**Priority 3: Evocative reading experience (有灵性的阅读体验).** Earned through restraint, not excess. One resonant image per section is enough. The prose should flow naturally — if a sentence requires re-reading to understand, simplify it. Accessibility is non-negotiable; the target reader is an educated non-specialist, not a psychology PhD.

### Reader-Friendliness Rules

- Write at a level that a smart college student can follow without specialized knowledge
- When introducing a psychological concept, explain it in one plain sentence before going deeper
- Avoid jargon walls: if you must use 3+ technical terms in a paragraph, intersperse with plain-language interpretation
- Use short paragraphs (3-5 sentences) for web readability
- Use `**bold**` to highlight key insights so skimmers can extract the main points
- Numbers and data should be contextualized: don't just report "0.286", say what that means in human terms
- **BAN em-dashes (——).** Do not use Chinese em-dashes. They make prose feel choppy and formulaic. Use commas, periods, semicolons, colons, or restructure sentences instead. Natural Chinese flows without em-dash crutches.

Target length: 1500-2500 words per dimension. The tone should make the student feel "这个报告好懂我".

### Dimension-Specific Guidance

**O (Openness):** Focus on curiosity patterns, what sparks their interest, how they handle ambiguity, N-S axis correspondence.

**C (Conscientiousness):** Focus on structure vs flexibility, when they DO show discipline, J-P axis correspondence, energy-driven vs schedule-driven patterns.

**E (Extraversion):** Focus on social energy source (people vs ideas), ambivert patterns if applicable, E-I axis, social battery management.

**A (Agreeableness):** Focus on how they show care (analytical vs emotional), relationship patterns, F-T axis correspondence, exceptions to low-A behavior.

**N (Neuroticism):** Focus on the 3 sub-clusters (ar/sv/er), emotional flash-and-release patterns, behavioral gates, the difference between feeling and acting.

## Step 4: Spawn Cross-Dimension & Personal Agent

After all 5 dimension reports are complete, spawn Agent B with:
- All 5 dimension reports
- Overview data
- Student background

Agent B writes two files. Follow the same Writing Style Hierarchy from Step 3 (accuracy > warmth > evocative experience). The interactions report should be insightful but accessible; the personal report is where the literary voice shines brightest.

### report_interactions.md — Dimension Interactions
Analyze emergent patterns when dimensions combine. Use H2 headings for each interaction pattern:
- High O + Low C tension
- Low A + E social style
- High O + Low A intellectual honesty
- N sub-cluster interactions
- Low C + Low N relaxed quality
- E + O + A combined archetype
- Overall profile coherence

Write each interaction as a self-contained insight — explain what the dimension combination means in practical terms, then illustrate with specific behavioral evidence from the data. Avoid abstract psychological theorizing; ground everything in "what does this look like in their daily life?"

### report_personal.md — Personalized Deep Analysis
Connect the profile to the student's specific life context. Use H2 headings for each section:
- Their professional persona (based on their stated background)
- Career development path (short/mid/long term)
- Management potential (honest assessment)
- Interpersonal relationship patterns
- A warm closing letter with 5 actionable suggestions

The closing letter is the emotional climax of the entire report. Write something that stays with the reader. One perfectly crafted closing image is worth more than five generic inspirational lines. The emotional resonance must come from the specificity of THIS person's data, not from generic uplift. **Never name or quote literary figures as style references.**

## Step 5: Patch Reports to Sanity

After all 7 markdown reports are generated (`report_O.md` through `report_N.md`, `report_interactions.md`, `report_personal.md`), patch them into the Sanity document and publish.

Use the Sanity MCP `patch_document_from_json` tool to patch the document, then `publish_documents` to make it live. The document ID can be found by querying:

```groq
*[_type == "mdpaResult" && resultId == $resultId][0]._id
```

The 7 fields to patch:
- `reportO` ← contents of `report_O.md`
- `reportC` ← contents of `report_C.md`
- `reportE` ← contents of `report_E.md`
- `reportA` ← contents of `report_A.md`
- `reportN` ← contents of `report_N.md`
- `reportInteractions` ← contents of `report_interactions.md`
- `reportPersonal` ← contents of `report_personal.md`

**For large text fields**, the MCP patch tool can be painful with inline parameters. Alternative: use a Node.js script with `@sanity/client` + `SANITY_TOKEN` from `.env`:

```js
import { createClient } from '@sanity/client'
const client = createClient({
  projectId: 'waxbya4l', dataset: 'production',
  token: process.env.SANITY_TOKEN, apiVersion: '2024-01-01', useCdn: false
})
await client.patch(documentId).set({ reportO, reportC, ... }).commit()
```

After patching, always call `publish_documents` via MCP to publish the draft.

Once published, the interactive report is live at `/tools/personality/<resultId>`.

## Step 6: (Optional) Generate Excel

If the user also wants an Excel report, update the Excel generation script and run:

```bash
python3 scripts/generate_excel_report.py
```

The Excel file will be at: `scripts/mdpa_processed/<resultId>/MDPA_Report_<studentName>.xlsx`

## Step 7: Deliver

Tell the user:
1. The interactive web report is live at `/tools/personality/<resultId>`
2. (If Excel was generated) The Excel file location

## Web Content Quality Guidelines

The markdown reports are rendered as interactive HTML on the web report page (`/tools/personality/[id]`). The page uses CSS-based mode switching — sections under certain headings are wrapped in `<div data-detail="true">` and hidden in "性格解析" (simple) mode.

### Heading Structure Requirements

Each dimension report (`report_O.md` through `report_N.md`) MUST use this H2 heading structure:

```markdown
## 数据画像
(calibrated score, raw score, AV adjustment — hidden in simple mode)

## 行为证据
(specific item analysis with RT data — hidden in simple mode)

## 内心叙事
(vivid metaphorical description — always visible)

## 成长提示
(actionable suggestions — always visible)
```

**Critical:** The headings `数据画像` and `行为证据` MUST use these exact Chinese characters. The page's `parseMarkdown` utility uses regex patterns to detect these headings and wrap their sections in `data-detail` divs. If the heading text doesn't match, the section won't be hidden in simple mode.

The following patterns trigger `data-detail` wrapping (defined in `src/lib/mdpa/constants.ts`):
- `/数据画像/`
- `/行为证据/`
- `/AV|锚定|校准/`
- `/POL_|SIT_|PAIR_|N_SIT/`

### Content Formatting for Web

- Use H2 (`##`) for major sections, H3 (`###`) for subsections — these appear in the right-side TOC
- Use `**bold**` for key phrases and personality traits
- Keep paragraphs moderate length (3-5 sentences) for comfortable web reading
- Use bullet lists for growth tips and actionable items
- Avoid H1 (`#`) headings — the page provides its own title

### Interactions Report (`report_interactions.md`)

Use H2 headings for each interaction pattern (e.g., `## 高开放性与低尽责性的张力`). These headings appear in the left nav under "维度交互解读". All content is always visible (not affected by mode switching).

### Personal Report (`report_personal.md`)

Use H2 headings for major sections (e.g., `## 职业发展路径`, `## 人际关系模式`). All content is always visible.

## Important Notes

- The Excel generation script (`generate_excel_report.py`) currently has the result ID hardcoded. When processing a new student, update `BASE_DIR` and `OUTPUT_FILE` in the script.
- The preprocessing script may also need the result ID updated.
- Consider making both scripts accept command-line arguments for the result ID to improve reusability.
- All agents write in Chinese with English terminology in parentheses.
- Quality bar: every behavioral claim must be backed by specific item IDs and reaction times from the data.
- After patching Sanity, always publish — `patch_document_from_json` creates drafts, not published docs.
