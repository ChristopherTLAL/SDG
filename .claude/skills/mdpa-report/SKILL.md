---
name: mdpa-report
description: Generate a rich, humanistic MDPA personality analysis Excel report from a student's test result stored in Sanity. Use this skill when the user asks to "generate a report", "analyze MDPA result", "做报告", "生成人格报告", or references an MDPA result ID. IMPORTANT — only run when the user explicitly requests it, as it spawns multiple agents and consumes significant tokens.
---

# MDPA Report Generation

Generate a professional, multi-sheet Excel personality report from a student's MDPA (Multi-Dimensional Personality Dynamic Assessment) test result. The report combines data analysis with warm, humanistic narrative writing that makes students feel deeply understood.

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
                                    Excel Generation (Python)
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
3. Instructions to write in warm, insightful Chinese

The report for each dimension must include:
- **Data portrait** (数据画像): calibrated score, raw score, AV adjustment, what it means
- **Behavioral evidence** (行为证据): walk through specific SIT, PAIR, POL, and AV items with reaction times. Quote the actual choices the student made. Interpret RT — fast choices = high certainty, slow choices = internal conflict
- **Inner narrative** (内心叙事): a vivid, metaphorical description of how this dimension manifests in the student's life
- **Growth tips** (成长提示): 3-4 actionable suggestions contextualized to the student's background

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

Agent B writes two files:

### report_interactions.md — Dimension Interactions
Analyze emergent patterns when dimensions combine:
- High O + Low C tension
- Low A + E social style
- High O + Low A intellectual honesty
- N sub-cluster interactions
- Low C + Low N relaxed quality
- E + O + A combined archetype
- Overall profile coherence

### report_personal.md — Personalized Deep Analysis
Connect the profile to the student's specific life context:
- Their professional persona (based on their stated background)
- Career development path (short/mid/long term)
- Management potential (honest assessment)
- Interpersonal relationship patterns
- A warm closing letter with 5 actionable suggestions

## Step 5: Generate Excel

Update the Excel generation script if needed to point to the new result ID, then run:

```bash
python3 scripts/generate_excel_report.py
```

The script reads all report files and overview JSON, then generates a professional 8-sheet Excel workbook:

1. **概览与行政** — Overview, student info, OCEAN chart, MBTI, RT analysis, disclaimer
2. **开放性** — Openness deep analysis
3. **尽责性** — Conscientiousness deep analysis
4. **外向性** — Extraversion deep analysis
5. **宜人性** — Agreeableness deep analysis
6. **神经质** — Neuroticism deep analysis
7. **维度交互** — Cross-dimension interactions
8. **个人化深度分析** — Personalized letter

Design: deep emerald (#042f24) primary, per-dimension accent colors, Markdown→Excel rendering with proper formatting.

## Step 6: Deliver

Tell the user where the Excel file is. The file will be at:
`scripts/mdpa_processed/<resultId>/MDPA_Report_<studentName>.xlsx`

## Important Notes

- The Excel generation script (`generate_excel_report.py`) currently has the result ID hardcoded. When processing a new student, update `BASE_DIR` and `OUTPUT_FILE` in the script.
- The preprocessing script may also need the result ID updated.
- Consider making both scripts accept command-line arguments for the result ID to improve reusability.
- All agents write in Chinese with English terminology in parentheses.
- Quality bar: every behavioral claim must be backed by specific item IDs and reaction times from the data.
