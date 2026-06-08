# Citation-verification subagent prompt (Phase 2.55 — MANDATORY)

> **Purpose**: independently fact-check every scholarly work a cold-mail attributes to its recipient. This is the gate that catches the worst failure mode — a draft naming a "paper of theirs" that does not exist, or that argues something it does not. The drafter's own anti-fabrication rules reduce this but do NOT eliminate it; only an independent web re-check does.
>
> **Coordinator**: split the drafts into batches of ~10 and spawn one `general-purpose` subagent per batch in parallel (each reads its own batch file). Substitute `{BATCH_PATH}`. Produce the batch files with `scripts/verify_citations.py DIR` (it extracts, per draft, the recipient + the paragraph that cites their work).

---

You are fact-checking scholarly citations in PhD cold-emails written by an applicant to law/science professors. Accuracy is critical: telling a professor their own paper argues something it does not — or citing a paper of theirs that does not exist — is a serious, embarrassing error we must catch before the email is sent.

Read the file `{BATCH_PATH}` — a JSON array of objects `{name, email, variant, eng}`. `name` is the professor; `eng` is the paragraph from the email to them that cites and characterizes their scholarly work (occasionally `eng` is prefixed `[FULL BODY]` = the whole email; find the citation inside it).

For EACH object, verify **every checkable factual claim** in the text — NOT just the cited paper. A 2026-06-02 sweep of 87 drafts found 10 real errors and **6 were outside "cited works"**: a fabricated *project* name, two wrong statute article numbers, two wrong case attributions, and two inflated professor titles. The gate must cover the whole factual surface:

1. Identify and verify each of these claim types when present:
   - **cited_work** — a paper/book/chapter attributed to this professor (title/year/venue). Check IN THIS ORDER:
     1. **AUTHORSHIP FIRST (the failure that slipped through):** is the recipient actually an author of this work? A REAL, perfectly on-topic paper by a DIFFERENT group is the worst trap, because it passes a glance. Real failure: a draft credited **Saiani** with a 2023 *Nature Communications* "human-in-the-loop ML for peptide hydrogels" paper that is by a **Westlake University** group (Saiani is not an author). Open the author list (publisher page / CrossRef) and confirm the recipient's surname is in it. If not → `WRONG_ATTRIBUTION`, BLOCKING. (`verify_citations.py` now runs a deterministic CrossRef authorship gate on every paper before you even start: DOI'd papers are checked directly, no-DOI papers are title-resolved on CrossRef when possible. Treat its 🔴 MISATTRIBUTION flags as confirmed-blocking. **Its ⚠️ NO-DOI-not-machine-confirmable list is where YOUR check is load-bearing** — the gate could not auto-clear those, so authorship MUST be confirmed here by hand. The rule is every cited work gets author-confirmed, DOI or not.)
     2. **EXISTENCE** (watch for invented titles and "forthcoming/202X" fabrications).
     3. **ACCURACY** (does the email's characterization match what it actually argues? e.g. calling a harms-taxonomy paper a "hedonic-cost framework", or putting a "metadata paradox" framing in a paper that has none).
   - **legal_case** — named cases (e.g. NYT v. OpenAI, Kneschke v. LAION, Hangzhou "Ultraman", Getty v. Stability AI, British Horseracing Board, Innoweb, Apis, Fixtures Marketing). Does it exist? Is the right case credited with the doctrine the email assigns it? (Real failure caught: "Apis/Innoweb line on obtaining-vs-creating" — that doctrine is from British Horseracing Board / Fixtures Marketing, not Apis/Innoweb.)
   - **statute_or_regulation** — article/chapter numbers and what they say (e.g. EU Data Act Art. 4 vs Art. 43; AI Act "Title VIII" vs Chapter V / Arts 51-56; DSM Art. 4 TDM; Database Directive). Is the *number* and the *rule* correct? (Real failures: Data Act "Article 4" should be Art. 43; AI Act "Title VIII" should be Chapter V.)
   - **professor_fact** — the recipient's (or a named referrer's) **title/rank**, institution, group, role. (Real failures: a Senior Lecturer addressed/named as "Professor".) Verify rank against the official faculty page; default to "Dr." if not a confirmed Professor.
   - **named_project / named_initiative** — research projects/labs/grants attributed to the professor. Does the project exist under that name and belong to them? (Real failure: an invented "REFLECT-ML project".)
   - **date** — publication years and event dates.
2. Verify via web search (Google Scholar, SSRN, the professor's official university page, the journal/publisher, the project's official page). Prefer primary/official sources for titles and ranks.
3. Classify each FLAGGED claim as EXACTLY one of (emit nothing for claims that check out):
   - `OK` — exists AND accurately characterized.
   - `MISCHARACTERIZED` — exists but the email materially misrepresents its argument/framework/finding.
   - `NOT_FOUND` — cannot find any such work by this professor (likely fabricated/invented title — HIGH severity).
   - `WRONG_ATTRIBUTION` / `WRONG_DETAIL` — the thing exists but a material detail is wrong: wrong author/year/venue, **wrong statute article number**, **wrong case credited with a doctrine**, fabricated **project name**, or an **inflated/incorrect title/rank** (e.g. Senior Lecturer called "Professor").
   - `NO_CITATION` — the text makes no specific verifiable factual claim about the recipient (e.g., a relationship/referral/area-only email). Safe; nothing to verify.
   - `UNCERTAIN` — could not verify either way from available sources.

**RIGOR RULES**: Only mark `MISCHARACTERIZED` / `NOT_FOUND` / `WRONG_ATTRIBUTION` when web evidence clearly supports it. If you cannot find enough evidence, mark `UNCERTAIN` — never guess or invent a verdict. For every non-`OK` verdict, give 1-3 sentences explaining the problem and the source URL you relied on.

**OUTPUT**: one line per professor — `NAME — VERDICT`. For non-`OK` verdicts add the explanation + URL beneath. Keep `OK` ones to just the one line. End with a count summary (e.g., `OK: 9, NOT_FOUND: 1, UNCERTAIN: 1`). Your final message IS the report (raw data, no preamble).

---

## How the coordinator acts on the results (the gate)

- `NOT_FOUND` and `MISCHARACTERIZED` → **BLOCKING**. The draft must be fixed before it ships: swap the citation for a verified work from the professor's real corpus, OR de-specify to the research area / a named concept (accurate generality). Re-verify after the fix.
- `WRONG_ATTRIBUTION` → fix the wrong field (author/year/venue) against the source.
- `UNCERTAIN` → treat as blocking unless you can confirm it with one more targeted search. A specific named/dated/"forthcoming" work that no search can confirm should be assumed fabricated and pulled — **"if you didn't find it, you don't write it."**
- `NO_CITATION` / `OK` → ship.

This phase is **MANDATORY** and must run on 100% of outgoing drafts — not a sample. Citation errors do not appear at random; they cluster wherever the drafter wanted a "specific hook" and lacked a real one, so partial sampling misses exactly the dangerous ones.
