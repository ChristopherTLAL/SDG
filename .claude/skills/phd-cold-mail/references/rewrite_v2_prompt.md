# Rewrite v2 prompt (when student profile is updated mid-project)

> Use this when student's CV / RP got materially updated after the initial Mode B drafting (new published paper, new research project, new contact email, data corrections) and the 132 drafts in JSON need full body rewrite to absorb the changes. Reuses the existing supervisor research + alignment notes already captured per-draft; ONLY rewrites `email.body`.

---

You are rewriting ONE cold-mail draft because the student's profile materially changed since the initial drafting pass. Read the existing JSON, do NOT re-research the supervisor (already captured), but **fully rewrite paragraphs 2 and 3** of `email.body` to authentically reflect the updated student profile. Preserve everything else (subject, signature, research notes, recipient).

**JSON file**: `{JSON_PATH}`

## Updated student profile (the same for all 132 drafts — internalize this before writing)

### Identity
- Jinnan Liu, MSc student at Soochow University, School of Radiation Medicine and Protection
- Supervisor: Prof. Liang Hu
- Email (canonical, matches Mail.app sender): **cpusuda@outlook.com**

### Published / accepted papers
1. **Liu, J. (Co-First Author), Wang, Y. (Co-First Author), Hu, R., Hu, L. (2026).** Harnessing vinylferrocene microgel-based photonic interferometers for clinical X-ray sensing. *Analytica Chimica Acta*, 1406, 345507. DOI: 10.1016/j.aca.2026.345507. (Q1, IF ≈ 6.1)
   - **Real data** (use these numbers, NOT the older 2.55 / 0-30 Gy from earlier drafts):
     - PVFc microgels + Au-PVFc MG-Au photonic interferometer
     - **Sensitivity ~4 nm/Gy, linear in dose range 0.1-20 Gy**
     - 95% accuracy, dose-rate independent (0.847-5.085 Gy/min), reversible
     - Mechanism: water radiolysis OH radicals oxidize ferrocene, microgel swelling redshifts the optical signal
2. Wang, Y., Liu, J. (Second Author), ... (2025). A Recent Review on Stimuli-Responsive Hydrogel Photonic Materials. *Macromolecular Rapid Communications*, 2500002. (Q2, IF = 4.3)

### Current core project (Oct 2025 - present) — RISI hydrogel
Carboxymethyl Chitosan / Oxidized Tannic Acid / Fe³⁺ Composite Hydrogel for Radiation-Induced Skin Injury (RISI) repair.

- Multi-bond assembly: covalent + metal coordination + hydrogen bonding
- Simultaneously targets four core RISI pathologies: oxidative stress, inflammation, bacterial infection, impaired re-epithelialization
- **Validated experimentally:**
  - Antioxidant: DCFH-DA, DPPH, H₂O₂ pseudo-enzyme assays — dose-dependent ROS clearance under 3 Gy
  - NIR-triggered photothermal antibacterial: **95.08 ± 2.10% inhibition vs. *P. aeruginosa*** at CMTA2.5/Fe³⁺ + NIR
  - Pro-fibroblast migration (in vitro scratch assay, 12 h & 24 h)
  - Pro-angiogenesis (tube formation assay)
- **Next stage (2026):** in vivo mouse RISI model with histology, immunofluorescence, and SDF-1α/CXCR4/MAPK → TGF-β/Smad pathway dissection

### Manuscripts in preparation (both Q1 targets)
3. Liu, J. (Co-First). CMCS / OTA / Fe³⁺ Composite Hydrogel for RISI Repair.
4. Liu, J. (First Author). Novel Hydrogel Spacer for Rectal Sparing and Intraoperative Imaging in Prostate Cancer Radiotherapy.

## Rewrite rules

### What to KEEP (do NOT modify)
- `email.subject` (already normalized: `PhD inquiry (Fall 2027) — <topic> — Jinnan Liu`)
- `email.signature` (3 lines: Jinnan Liu / MSc Candidate, School of Radiation Medicine and Protection / Soochow University)
- All `research.*` fields (supervisor research notes already captured)
- All `contact.*`, `supervisor.*`, `meta.*` fields
- The ASK paragraph's structure: keep all 4 elements (Fall 2027 slot ask + 15-25 min Zoom + CSC/self-funding + attachments)

### What to REWRITE (the core of this patch)
- **Paragraph 1 (opening)**: 1-2 sentences. Brief intro + writing about Fall 2027 PhD. Keep mostly as-is in tone, just make sure the email account context flows naturally.

- **Paragraph 2 (background)** — **FULLY REWRITE** to weave BOTH research streams:
  - Lead with whichever stream most aligns with THIS supervisor (use `research.alignment_notes` in the JSON to decide)
  - **Cite the published Analytica Chimica Acta paper** explicitly with real numbers (~4 nm/Gy, 0.1-20 Gy)
  - **Mention the current RISI hydrogel project** with at least one concrete validated finding (the 95.08% antibacterial is solid; or the multi-bond architecture; or the planned in vivo work)
  - Show methodological range: photonic + multi-component bio-hydrogel + reactive radical chemistry
  - Goal: supervisor reading para 2 should see a student who has *executed real published experiments* AND is doing *substantive ongoing work*, not just "interested in" things

- **Paragraph 3 (alignment)** — **FULLY REWRITE** using `research.alignment_notes`:
  - Cite ONE specific paper/concept of the supervisor's by name (from `research.papers` or `research.alignment_notes`)
  - Show concrete overlap between student's experimental track record (Analytica paper + RISI hydrogel) and supervisor's computational/theoretical direction
  - Include ONE open question or productive divergence (not generic flattery)
  - The hook is "experimental student with published Q1 data + ongoing biomaterials project pivoting to computational" — this is more credible than the earlier framing of "experimental student wanting to pivot"

- **Paragraph 4 (ASK)** — keep current structure (most drafts have it):
  - "Are you taking PhD students for Fall 2027?"
  - "I would welcome a brief Zoom call (15-25 min)"
  - "I am also exploring CSC fellowship co-funding"
  - "I have attached my CV and research proposal"
  - NO "recommend a colleague" fallback

### Hard rules (from past lessons — non-negotiable)
- [ ] Zero em-dashes in body: `body.count("—") + body.count("–") == 0`
- [ ] No student-tenure signals: no "second-year MSc", "finishing my MSc", "graduating in 2027", "in my final year"
- [ ] No AI tells: no "I would be honored / privilege / grateful / groundbreaking / world-class / cutting-edge / state-of-the-art / I hope this finds you well / deeply impressed"
- [ ] Body word count 220–320 words (slightly longer than before is OK because we're packing in both research streams; but cap at 320)
- [ ] **Numbers must be real**: ~4 nm/Gy not 2.55, 0.1-20 Gy not 0-30 Gy, 95.08% antibacterial. If supervisor research notes contain other numbers, leave those alone (they're about the supervisor's work).
- [ ] **🚨 Material name must be CMCS or "carboxymethyl chitosan", NEVER abbreviate to CMC**. The bare abbreviation "CMC" in chemistry overwhelmingly means **carboxymethyl cellulose** (a different polymer entirely). Writing "CMC/Fe³⁺" makes the supervisor read it as a cellulose system, not chitosan. Always use either the full term "carboxymethyl chitosan" or the disambiguated abbreviation "CMCS". This applies whether mentioned alone or in compound notation (e.g., "CMCS/OTA/Fe³⁺", "CMCS/Fe³⁺", "CMCS-OTA hydrogel" — all OK; "CMC/Fe³⁺", "CMC/OTA/Fe³⁺", "CMC-OTA" — FORBIDDEN).
- [ ] No PII other than the email cpusuda@outlook.com (sender). NEVER write `[email protected]` placeholder.
- [ ] Preserve every supervisor paper citation that was in the original draft (don't drop them)

## Self-critique before writing JSON

After drafting v2 body, check ALL:
1. `body.count("—") == 0` and `body.count("–") == 0`?
2. Para 2 mentions BOTH the published Analytica paper AND the RISI hydrogel project?
3. Numbers used: ~4 nm/Gy (not 2.55) and 0.1-20 Gy (not 0-30)?
4. Para 3 cites at least ONE specific supervisor paper/concept by name?
5. Para 4 has all 4 ASK elements (Fall 2027 slot + Zoom + CSC + attachments)?
6. No second-year / finishing MSc / hedging?
7. Word count 220-320?
8. No fallback "recommend a colleague" sentence?
9. **Material name check**: search body for the regex `\bCMC\b` (uppercase bare CMC) — must return ZERO hits. The bare abbreviation `CMC` reads as carboxymethyl cellulose to chemists. Only `CMCS`, `carboxymethyl chitosan`, or compound forms containing `CMCS` (e.g., `CMCS/OTA/Fe³⁺`, `CMTA2.5/Fe³⁺` where CMTA is the synthesis intermediate) are acceptable.

If any check fails, iterate before writing.

## Output

Use Edit or Write to update the JSON at `{JSON_PATH}`. Modify ONLY `email.body`. Return ONLY:

`✅ <Name> | analytica:✓ | RISI:✓ | em-dash=0 | words=<N>` (success)
`⚠️ <Name> | <missing element>` (partial)
`❌ <Name> | <error>` (failed)
