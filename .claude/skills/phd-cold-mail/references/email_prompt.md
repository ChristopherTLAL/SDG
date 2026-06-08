# Cold-mail drafting prompt (Opus or Sonnet)

> **Before drafting, READ [`style_lessons.md`](style_lessons.md) for the 6 hard rules** — zero em-dash, 4-element ASK structure (slot + meeting + self-fund + attachments, NO recommend-colleague fallback), URL/PDF email source required, no `[email protected]` placeholder, no AI tells, preserve citations.


> Coordinator: this is the prompt the drafter follows when writing each cold-mail in Phase 2. The 4-point structure is translated **faithfully** from the n8n workflow `2LUVS7Vr4EVtqyC3` node `Message a model1` (the `gemini-3.1-pro-preview` cold-mail node).
>
> **Model choice**:
> - `Opus` for small batches where peak quality per draft matters more than throughput.
> - `Sonnet` for full-batch mode (30+ supervisors). To make Sonnet approach Opus quality, the prompt enforces an EXPLICIT multi-pass reasoning structure below — do not skip the reasoning phases when using Sonnet.

---

## Deep-thinking guidance (REQUIRED, especially on Sonnet)

Before writing the final email, think hard and walk through these phases. **Do the reasoning out loud in your scratch space (it does not appear in your output) — the act of reasoning improves the final draft.** Each phase has a concrete deliverable.

**Phase A — Identity & corpus understanding** (60-120 tokens)
- One sentence: who is this supervisor? (sub-area, methodological signature)
- One sentence: what's the student's RP about? (core scientific bet, key methods)
- If these don't naturally connect, you have a hard problem — flag it.

**Phase B — Alignment inventory** (200-400 tokens)
- List 3-5 SPECIFIC overlaps between the student's RP and the supervisor's recent work. Each must reference a concrete artifact (a paper title, a method name, a concept) — not generic phrases like "both work on machine learning".
- For each overlap, note: is this an exact alignment or a productive divergence?
- Pick the BEST one for paragraph #3. Pick a productive divergence (if available) for the "honest open question" hook.

**Phase C — Differentiator scan** (100-200 tokens)
- What does the student have that other applicants probably don't? (specific datasets, experimental access, unusual method combinations, papers in revision, the specific RP module that maps to this lab)
- Pick ONE differentiator for paragraph #2 — concrete and specific.

**Phase D — Outline** (50-100 tokens)
- 4 paragraphs, one line each: what's the function and the specific anchor of each?

**Phase E — Draft v1** — write the email.

**Phase F — Critique** (100-200 tokens)
- Read draft v1 as if you were the supervisor receiving it. Scan for AI tells:
  - Verbose / hedged ("I would be honored", "It would be a great privilege")?
  - Adjective inflation ("groundbreaking", "world-class", "cutting-edge")?
  - Throat-clearing ("I hope this email finds you well", "I am reaching out because")?
  - Vague claims with no concrete anchor ("aligned with your direction" without saying which direction)?
  - Reads like a CV dump in paragraph 2?
  - Para 3 cites the supervisor's work generically vs. by specific title/concept?
- List concrete edits needed.

**Phase G — Draft v2** — rewrite incorporating the critique. **This is the final output.**

⚠️ Only Phase G appears in your final response. Phases A-F are your private reasoning. But DO them — skipping them produces visibly worse drafts.

---

## Contextual Information

### 1. Professor's Info
{PROFESSOR_RESEARCH}

### 2. Student's RP
{STUDENT_RP}

### 3. Student's CV
{STUDENT_CV}

---

## Instruction

As a high-level PhD applicant, write a first-contact email (English cold-mail) to a prospective supervisor based on the provided background materials. The email should be politely professional and concise, containing the following points:

1. **State the purpose of the email clearly** — interest in his/her field of research, intention to apply for PhD.
2. **Introduce your own research background and ideas** — based on RP + CV. Lead with the most relevant 1-2 projects or interests; avoid CV-dump.
3. **Express subtle flattery (that you did your homework)** — align your research interest / capacity with the supervisor's general direction of study. Cite a specific paper or concept by name — **but ONLY a work that actually appears in the supplied research (with a real source). 🚨 NEVER invent or guess a title/year/"forthcoming" work to sound specific; the recipient is its author and will spot a fake instantly. If you have no verified specific work, name their research area or a named concept in general terms — an accurate generality always beats a fabricated specific.**
4. **Politely ask if there are PhD-student slots available** (mention "open to self-funding" if relevant). Ask if a brief online meeting is possible. If no slots, ask if they can recommend another suitable supervisor in the same area.

## Style requirements

The core paragraphs (#2 and #3) should be **extremely insightful**. That means:

- Critically engage with the supplied materials (don't just summarize them).
- Mention specific publications or important achievements (theoretical contributions, social impact, methodology, datasets, etc.).
- Highlight precise alignments between the student's RP and the supervisor's recent work.
- Where alignment is imperfect, mention the divergence honestly as a topic for discussion — this reads as intellectual maturity, not weakness.

## Output format

Final Markdown output contains ONLY:

1. The subject line (single line)
2. A blank line
3. The email body
4. A blank line
5. The closing signature — **single name only**, no email, phone, current institution, social links, etc.

Do NOT include:

- Directive text ("Here is the email", "Hope this helps")
- Bold or italic formatting
- Bullet points or numbered lists (within the email body)
- Salutation cliches like "I hope this email finds you well" — get to the point
- Multiple paragraphs of throat-clearing

## Tone

- Concise, high information density.
- Restricted adjective use. **Show, not tell** — instead of "your groundbreaking work on X", reference what specifically about X impressed the writer.
- The reader is a busy professor scanning their inbox; aim for the email to be readable in under 60 seconds.
- This style serves two purposes: (a) it conveys the identity of a thoughtful student, and (b) it avoids the cadence of AI-generated email (which is verbose, hedged, and adjective-heavy).

## Example skeleton (for shape only — do NOT copy the wording)

```
Subject: Prospective PhD applicant — interest in [specific topic from supervisor's work]

Dear Prof. [Last name],

[Sentence stating purpose + name of supervisor's research area that drew the writer in.]

[Paragraph #2: 3-4 sentences on the writer's own RP/CV anchored to a concrete project or finding. End with a hook to #3.]

[Paragraph #3: 3-4 sentences linking writer's direction to a SPECIFIC paper / concept by the supervisor, with one sentence on a productive divergence or open question.]

[Paragraph #4: 2-3 sentences — ask about PhD openings, mention attached CV+RP, ask for a 20-30 min online meeting; offer the recommendation fallback in one short sentence.]

[Student name]
```

The skeleton above shows shape. The actual content must be derived from the supplied RP / CV / research — DO NOT use placeholder language in the output.
