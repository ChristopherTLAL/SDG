# Year-removal patch prompt

> Use this when the student's graduation timing is uncertain (e.g. Chinese 学硕 in year 2 — may extend to 3 years, can't pin admission cycle to Fall N). Strips every year reference and student-tenure signal from the email body, while preserving the substantive content.
>
> Coordinator: substitute `{JSON_PATH}` for each draft.

---

You are patching ONE existing cold-mail draft. Read the JSON at the path below. Modify ONLY `email.body`, write it back. Preserve `email.subject` (already normalized), `email.signature`, `research`, etc.

**JSON file**: `{JSON_PATH}`

## Why this patch

The student is a Chinese **学硕** (academic Master's, typically 3-year program) currently in year 2 — graduation date is uncertain. The earlier drafting pass assumed Fall 2027 admission, but that may be wrong (could be 2028). Pinning a specific year in cold-mail closes options: if the supervisor says "no slot for 2027 but we have 2028 slot", the student's email already committed her to 2027 and creates awkwardness.

**Goal**: make every email **timing-neutral**. The supervisor responds with whatever year they have available; student replies with her graduation date. Both sides have flexibility.

## Patches (apply in order)

### Patch 1 — Strip every year reference from the body

Remove ALL of these phrases (and their variants):

- `for Fall 2027` / `for fall 2027` / `for FY 2027` / `for 2027 entry` / `for 2027 admission`
- `Fall 2027` / `fall 2027` (standalone)
- `2027` (any 4-digit year referring to admission)
- `2026` / `2028` / etc. (any future year)
- `in the upcoming admission cycle` (acceptable to keep — see below)

Replace by simply DELETING the phrase or rephrasing the surrounding sentence to be open-ended.

**Examples**:
- ❌ "I am writing to ask whether your group is accepting PhD students for fall 2027"
- ✅ "I am writing to ask whether your group is currently considering new PhD students"
- ❌ "If you are taking PhD students for Fall 2027, I would welcome a brief Zoom call"
- ✅ "If you are taking PhD students, I would welcome a brief Zoom call"
- ❌ "I am applying for Fall 2027 and am also exploring CSC fellowship funding"
- ✅ "I am also exploring CSC fellowship funding if your funded slots are tight"

### Patch 2 — Neutralize student-tenure language

Remove or rephrase:

- `second-year MSc` → `MSc` (just "MSc student at Soochow University")
- `finishing my MSc` / `completing my MSc` → `MSc student` or rephrase to current state
- `in my final year` → `currently`
- `Year 2 MSc` → `MSc`
- `2025` / `2024` references to when she started → strip

**Examples**:
- ❌ "I am a second-year MSc student at Soochow University..."
- ✅ "I am an MSc student at Soochow University..."
- ❌ "I am finishing an MSc at Soochow University..."
- ✅ "I am an MSc student at Soochow University..."

### Patch 3 — ASK paragraph: rephrase to open-ended timing

The ASK paragraph should ask about PhD openings WITHOUT specifying a year:

**Acceptable open phrasings**:
- "Would your group consider new PhD students?"
- "Are you currently taking new PhD students?"
- "Are PhD openings something you anticipate in the near term?"
- "Could you let me know whether you are considering new doctoral students?"

**Keep** (these 3 are still required in para 4):
- (a) The slot ask (in timing-neutral form per above)
- (b) Meeting ask: "a brief Zoom call (15-25 min)"
- (c) Self-funding / CSC mention
- (d) Attachments line

Remove the "for [year]" qualifier from (a) but keep the ask itself.

## Constraints (all patches)

- Body length stays under 350 words.
- **Preserve every paper citation, DOI, method name, dose-response data** (e.g. `2.55 nm/Gy`, `0-30 Gy`, `MATILDA.FT`, `ReaxFF`, `MARTINI`).
- **Zero em-dashes** in body (`body.count("—") + body.count("–") == 0`). Subject keeps em-dashes.
- No AI tells.

## Self-critique before writing

- `re.search(r'\b(202[5-9]|20[3-9]\d)\b', body)` returns nothing? (no future year reference)
- `re.search(r'\bsecond[\-\s]year\b', body, re.I)` returns nothing? (no year-tenure)
- `re.search(r'\bfor\s+(?:Fall|fall)\s+\d{4}\b', body)` returns nothing? (no Fall YYYY)
- Para 4 still has slot ask + meeting + CSC + attachments?
- Body still under 350 words?
- All papers / DOIs / methods / dose data preserved?

If any fail, iterate.

## Output

Use Edit/Write to update the JSON. Modify ONLY `email.body`. Return ONLY:

`✅ <Name> | year-strip:✓ | tenure-neutral:✓ | words=<N>` (success)

`⚠️ <Name> | <issue>` (partial)

`❌ <Name> | <error>` (failed)
