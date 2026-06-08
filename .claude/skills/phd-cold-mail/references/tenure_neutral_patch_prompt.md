# Tenure-neutral patch prompt (narrow)

> Use this when the admission year is correct but the student's own graduation timing is uncertain (e.g. Chinese 学硕 who may extend to a 3rd year). Strips ONLY the student-tenure signals; keeps every admission-year reference intact.

---

You are patching ONE cold-mail draft. Read JSON, modify ONLY `email.body`, write it back. Preserve subject, signature, research notes.

**JSON file**: `{JSON_PATH}`

## Why this narrow patch

The student is targeting **Fall 2027 admission** — that part is fine and should stay. The problem is when the draft mentions the student's own tenure ("second-year MSc", "finishing my MSc"), it implies a specific graduation date (mid-2027), which the supervisor may then build expectations around. The student is 学硕 and could extend to 2028 graduation. Better to omit any signal of HER timeline; let her clarify her actual schedule in a follow-up email or interview.

## Patch 1 — REMOVE only student-tenure signals

Strip these (and variants), without replacement OR by rewording to drop the year/seniority hint:

- "second-year MSc" / "Y2 MSc" / "Year 2 MSc" / "2nd-year MSc" → just "MSc"
- "finishing my MSc" / "completing my MSc" / "graduating in 2027" → "currently an MSc student at..."
- "in my final year" / "in my last year of MSc" → drop or "currently"
- "after I complete my MSc" / "upon graduation" → "for my PhD" (no implied year)
- "started my MSc in 2024" / "joined the lab in 2024" → drop

Examples:
- ❌ "I am a second-year MSc student at Soochow University..."
- ✅ "I am an MSc student at Soochow University..."

- ❌ "I am finishing an MSc at Soochow University's School of Radiation Medicine..."
- ✅ "I am an MSc student at Soochow University's School of Radiation Medicine..."

## Patch 2 — KEEP every admission-year reference (Fall 2027) intact

Do NOT remove or change any of these — they refer to the ADMISSION target, not student's graduation:

- "for Fall 2027" / "for fall 2027" — KEEP
- "applying for Fall 2027" — KEEP
- "PhD students for Fall 2027" — KEEP
- "openings for Fall 2027" — KEEP
- Supervisor's paper years (e.g. "your 2022 PNAS paper") — KEEP

If the body lost the Fall 2027 admission reference (e.g. an over-patched earlier pass), restore one mention in paragraph 4 (the ASK paragraph):
- "Are you taking PhD students for Fall 2027?"
- "If you have openings for Fall 2027..."

## Patch 3 — Verify the 4 ASK elements still present in para 4

Paragraph 4 must still contain:
- (a) Direct slot ask **for Fall 2027** (rephrase if missing year)
- (b) Brief Zoom meeting (15-25 min)
- (c) CSC / self-funding mention
- (d) Attachments line ("I have attached my CV and research proposal")

No "recommend a colleague" fallback (mass-mailing-detection risk).

## Constraints (all patches)

- Body length stays ≤ 350 words.
- Preserve every paper citation, DOI, method name (MARTINI, ReaxFF, MATILDA.FT, etc.), data point (e.g. "2.55 nm/Gy", "0-30 Gy").
- Zero em-dashes in body (`body.count("—") + body.count("–") == 0`). Subject keeps em-dashes.
- No AI tells.

## Self-critique

- `re.search(r'\bsecond[\-\s]year\b', body, re.I)` returns None?
- `re.search(r'\b(finishing|completing)\s+(my|an?)\s+MSc\b', body, re.I)` returns None?
- "Fall 2027" appears at least once in body (typically in para 4 ASK)?
- All paper citations preserved?
- 0 em-dashes in body?

## Output

Edit/Write the JSON. Return ONLY:

`✅ <Name> | tenure-stripped:✓ | Fall2027:✓ | words=<N>` (success)
`⚠️ <Name> | <issue>` (partial)
`❌ <Name> | <error>` (failed)
