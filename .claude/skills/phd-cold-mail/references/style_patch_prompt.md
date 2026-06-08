# Style-patch subagent prompt

> Use this on EXISTING per-supervisor draft JSONs to apply mechanical style fixes after the initial drafting pass. Each subagent handles one draft, modifying ONLY `email.body` in place, writing back to the same JSON.
>
> Coordinator: substitute `{JSON_PATH}` and (optionally) `{HEDGING_FLAG}` / `{OPENING_DUP_FLAG}` to focus the subagent. The default 4 patches apply to every draft and are idempotent (no-op if already clean).

---

You are patching ONE existing cold-mail draft. Read the JSON at the path below, modify ONLY `email.body`, write back. Preserve everything else (subject, signature, research notes, contact, etc.).

**JSON file**: `{JSON_PATH}`

## Patches (apply in order)

### Patch 1 — Remove em-dashes (HARD: zero tolerance)

Replace every `—` and `–` in `email.body`. Strategy:

- **Parenthetical clauses** (`X — Y — Z`): use parentheses or commas. e.g. `dataset — clean and quantified — under X-ray` → `dataset (clean and quantified) under X-ray`
- **Subordinate explanation** (`X — which Y`): split into 2 sentences with a period, OR demote to comma+relative-clause. e.g. `the mechanism — invisible to my methods` → `the mechanism. It is invisible to my methods` or `the mechanism, which my methods cannot resolve`
- **Transition / colon-like** (`X — Y`): use colon, semicolon, or period. e.g. `the gap is concrete — a pivot to simulation` → `the gap is concrete: a pivot to simulation`

Goal: `body.count("—") + body.count("–") == 0` in your output. Meaning preserved; rhythm slightly different is acceptable.

(Note: the email Subject is allowed to keep em-dashes — only patch the body.)

### Patch 2 — Ensure paragraph 4 (ASK) contains all 4 elements

Paragraph 4 (the ask paragraph at the end of the body) MUST contain:

| Element | Example phrasing |
|---|---|
| a. PhD slot ask for Fall 2027 | "Are you taking PhD students for Fall 2027?" / "If you have openings for Fall 2027..." |
| b. **Explicit meeting ask** | "I would welcome a brief Zoom call (15-25 min)" / "If you have 15-25 minutes for an online conversation..." |
| c. **Self-funding / CSC mention** | "I am also exploring CSC fellowship funding if your funded slots are limited" / "I am eligible for CSC co-funding" — the student is a Chinese MSc applicant, CSC-eligible |
| d. **Attachments line** | "I have attached my CV and research proposal" |

**DO NOT add a fallback "recommend a colleague" sentence**. Past audits showed this creates a mass-mailing-detection risk when many supervisors at the same school cross-check. The fallback is dropped from the standard ask. (Keep this out even if past drafts had it.)

### Patch 3 — Replace hedging "I would be grateful" if present

If body contains "I would be grateful" or "deeply grateful", rewrite as a direct phrasing:

- ❌ "I would be grateful to know whether you are recruiting"
- ✅ "Are you taking students for Fall 2027?"
- ❌ "I would be grateful for any suggestions"
- ✅ "Let me know either way"

(Only apply this patch if the phrase appears.)

### Patch 4 — Vary opening if it matches the duplicate UPenn-cluster opening

If the FIRST sentence of `email.body` (skipping the "Dear Prof X," salutation) is EXACTLY or near-exactly:

> "I am writing to ask whether you are recruiting PhD students for Fall 2027."

Rewrite to vary phrasing while keeping the same direct intent. Examples:

- "I am a second-year MSc at Soochow University writing to inquire about Fall 2027 PhD openings in your group."
- "I am applying for PhD admission in Fall 2027 and wanted to ask whether your group has openings."

(Only apply if the opening matches the duplicate pattern.)

## Constraints (all patches)

- Body length stays under 350 words. Trim para 2 or 3 if Patch 2 expanded para 4 too much.
- **Preserve every paper citation, DOI, method name (MD, MC, CG, MARTINI, MATILDA.FT, ReaxFF, etc.), and concrete data point** (e.g. "2.55 nm/Gy", "0-30 Gy") from the existing draft. Do NOT introduce new claims or invent facts.
- No AI tells: no "I would be honored", "honored to", "deeply impressed", "groundbreaking", "world-class", "exceptional", "I hope this email finds you well".
- Preserve the existing tone (concise, direct, no throat-clearing). Don't add filler.

## Self-critique before writing

Before calling Edit/Write on the JSON, check your draft:
1. `body.count("—") == 0` and `body.count("–") == 0`?
2. Para 4 has elements a + b + c + d? (no fallback recommend sentence)
3. No "I would be grateful" / "honored" / "privilege"?
4. Body word count ≤ 350?
5. Every paper citation from the original still present?

If any check fails, iterate before writing.

## Output

Use Edit or Write to update the JSON at `{JSON_PATH}`. Set ONLY `email.body` (don't touch other fields).

Return ONLY this 1-line status:

`✅ <Name> | em-dash=0 | meeting:✓ | self-fund:✓ | words=<N>` (success)

`⚠️ <Name> | <issue> | partial` (something couldn't be applied, e.g. para 4 too small to expand)

`❌ <Name> | <error>` (couldn't read/write JSON)
