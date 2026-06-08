#!/usr/bin/env python3
"""Phase 2.55 — citation verification prep + local provenance gate.

Two jobs:
  1. LOCAL GATE (no web, instant): for every draft, pull the quoted work-titles
     out of the email body and check each against the draft's own
     research.papers[] (which must each carry a source_url). A title named in
     the body but absent from the verified papers list = a body-only citation
     with NO provenance = the exact fabrication signature (e.g. an invented
     "...2026..." title). These are flagged BLOCKING before any web call.
  2. EXTRACT + BATCH: write per-draft {name,email,variant,eng} (eng = the
     paragraph that cites the recipient's work) into batches of N, to feed the
     parallel `references/verify_citations_prompt.md` web-verification subagents.

Usage:
    python3 verify_citations.py DIR_OF_JSON_DRAFTS [--batch 10] [--out /tmp]
    python3 verify_citations.py manifest.json       [--batch 10] [--out /tmp]

Accepts either a directory of per-supervisor JSON drafts (canonical skill
schema: {supervisor.name, contact.email, email.body, research.papers[]}) OR a
single JSON array manifest ({name,email,variant,subject,body[,papers]}).
"""
import argparse, json, re, sys, os, glob
import urllib.request, urllib.parse, unicodedata, time
import concurrent.futures


def load_drafts(path):
    """Normalize either format to a list of {name,email,variant,body,papers}."""
    out = []
    if os.path.isdir(path):
        files = [f for f in sorted(glob.glob(os.path.join(path, "*.json")))
                 if os.path.basename(f) != "MANIFEST.json"]
        for f in files:
            try:
                r = json.load(open(f, encoding="utf-8"))
            except Exception as e:
                print(f"  ⚠️ unreadable {f}: {e}", file=sys.stderr); continue
            sup = r.get("supervisor", {})
            em = r.get("email", {})
            papers = (r.get("research", {}) or {}).get("papers", []) or []
            out.append({
                "name": sup.get("name") or r.get("name", "?"),
                "email": (r.get("contact", {}) or {}).get("email") or r.get("email", ""),
                "variant": r.get("variant", "cold"),
                "body": em.get("body") or r.get("body", ""),
                "papers": papers,
                "_file": os.path.basename(f),
            })
    else:
        data = json.load(open(path, encoding="utf-8"))
        for r in (data if isinstance(data, list) else data.get("drafts", [])):
            out.append({
                "name": r.get("name", "?"),
                "email": r.get("email", ""),
                "variant": r.get("variant", "cold"),
                "body": r.get("body", ""),
                "papers": r.get("papers", []) or [],
                "_file": r.get("email", ""),
            })
    return out


QUOTE_RE = re.compile(r'[\"“”「」『』]([^\"“”「-』]{6,140})[\"“”「」『』]')
# words that are quoted but are NOT work-titles (concepts/terms in scare quotes)
NOT_A_TITLE = re.compile(r'^(non-expressive|fair use|hedonic|carrot and stick|person skilled|[a-z ]{1,18})$', re.I)


def body_titles(body):
    """Quoted strings in the body that look like work titles (Title Case / long)."""
    titles = []
    for m in QUOTE_RE.finditer(body):
        t = m.group(1).strip()
        if len(t) < 8:
            continue
        if NOT_A_TITLE.match(t):
            continue
        # a title usually has multiple capitalized words
        caps = sum(1 for w in t.split() if w[:1].isupper())
        if caps >= 2 or len(t) > 40:
            titles.append(t)
    return titles


def in_papers(title, papers):
    """Is this title represented in the verified papers list?"""
    key = re.sub(r'[^a-z0-9]', '', title.lower())[:40]
    for p in papers:
        cit = (p.get("citation", "") if isinstance(p, dict) else str(p)).lower()
        if key and key in re.sub(r'[^a-z0-9]', '', cit):
            return True
    return False


def best_para(body):
    paras = [p.strip() for p in body.split("\n") if p.strip()]
    cands = []
    for p in paras:
        if "I have attached" in p or p.startswith(("Dear ", "Best regard", "With warm", "Sincerely", "Zhe Pan", "Kind regard")):
            continue
        score = 0
        if re.search(r'[\"“「]', p): score += 3
        if re.search(r'\byour\b', p, re.I): score += 1
        if re.search(r'(19|20)\d\d', p): score += 1
        if re.search(r'article|book|chapter|monograph|paper|piece|consultation|response|commentary|handbook|chapter|Review|Journal', p, re.I): score += 1
        if score >= 2: cands.append((score, p))
    if cands:
        cands.sort(key=lambda t: -t[0]); return cands[0][1]
    return "[FULL BODY] " + body


def _deaccent(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").lower()


def _name_cands(supname):
    """Surname candidates for matching against a CrossRef author list. Returns a
    set of deaccented strings. Handles the cases that broke exact matching:
      - multi-word Western surnames: 'De Angelis'→{angelis, de angelis}, 'Olvera
        de la Cruz'→{cruz, olvera de la cruz} (the author family is the long form;
        we match by substring on the joined author string).
      - CJK surname-first: 'Loh Xian Jun'→ include first token 'loh' too.
      - honorifics/initials/suffixes stripped so 'Dr'→drucker etc. can't false-match."""
    n = re.sub(r"[（(].*?[)）]", "", supname or "")
    n = re.sub(r"\b(Dr|Prof|Professor|Mr|Ms|Mrs|Mx|Sir)\.?\b", "", n, flags=re.I)
    n = re.sub(r"\b(III|II|IV|Jr|Sr)\.?\b", "", n)
    parts = [_deaccent(p) for p in n.split() if len(p.strip(".")) >= 2 and "." not in p]
    cands = set()
    if parts:
        cands.add(parts[-1])                      # Western surname (last)
        cands.add(parts[0])                       # CJK surname-first
        if len(parts) >= 2:
            cands.add(" ".join(parts[-2:]))       # 'de angelis'
        if len(parts) >= 3:
            cands.add(" ".join(parts[-3:]))       # 'olvera de la cruz'
    return {c for c in cands if len(c) >= 2}


def _supervisor_is_author(supname, author_families):
    """True if any surname candidate matches an author. Hyphens are normalised to
    spaces on BOTH sides, so a 'Fernandez-Nieves' candidate matches a
    'fernandez-nieves' byline (don't split one side only — that regressed and
    falsely flagged a real author). Matching is then token-aware so short CJK
    surnames ('ni','ngai') can't substring-match unrelated names ('antonni'): a
    single-word candidate must EQUAL an author token; a multi-word candidate must be
    a substring of the joined family string ('de angelis', 'olvera de la cruz')."""
    norm = lambda s: re.sub(r"-+", " ", s).strip()
    fams = [norm(f) for f in author_families if f]
    joined = " ".join(fams)
    tokens = set(joined.split())
    for c in _name_cands(supname):
        cn = norm(c)
        if " " in cn:
            if cn in joined:
                return True
        elif cn in tokens:
            return True
    return False


def _doi_of(paper):
    """Pull a DOI out of a research.papers[] entry (its 'doi' field or its citation)."""
    if not isinstance(paper, dict):
        return ""
    raw = paper.get("doi") or paper.get("citation", "")
    m = re.search(r"10\.\d{4,9}/[^\s\"')]+", raw or "")
    return m.group(0).rstrip(".,)") if m else ""


_CR_CACHE = {}
# CrossRef is reachable China-direct; do NOT route it through the HTTPS_PROXY env
# var (that proxy exists only for Anthropic's geo-unblock and makes 150 sequential
# API calls crawl). This opener ignores all env proxies → fast direct requests.
_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))
# CrossRef from China is ~4s/request, so 150 sequential calls = ~10min. Persist the
# cache to disk (re-runs instant) and pre-warm it in parallel (~8x speedup).
_CACHE_FILE = os.path.join(os.path.expanduser("~"), ".phd_crossref_cache.json")


def _cache_load():
    try:
        _CR_CACHE.update(json.load(open(_CACHE_FILE, encoding="utf-8")))
    except Exception:
        pass


def _cache_save():
    # persist only SUCCESSFUL lookups; never cache 'ERR' (a transient network blip
    # would otherwise permanently mark a DOI unresolved). Failures retry next run.
    def ok(v):
        if v == "ERR":
            return False
        if isinstance(v, (list, tuple)) and len(v) == 3 and v[1] == "ERR":
            return False
        return True
    try:
        keep = {k: v for k, v in _CR_CACHE.items() if ok(v)}
        json.dump(keep, open(_CACHE_FILE, "w", encoding="utf-8"), ensure_ascii=False)
    except Exception:
        pass


def _prewarm(drafts, doi_only):
    """Fetch every unique DOI (and, unless doi_only, every no-DOI citation's title
    resolution) concurrently to fill the cache before the gate loop reads it.
    Turns a ~10min sequential crawl into ~1-2min."""
    dois, cites = set(), []
    for d in drafts:
        if not _name_cands(d["name"]):
            continue
        for p in d["papers"]:
            doi = _doi_of(p)
            if doi:
                if doi not in _CR_CACHE:
                    dois.add(doi)
            elif not doi_only:
                cites.append(p.get("citation", "") if isinstance(p, dict) else str(p))
    jobs = len(dois) + len(cites)
    if not jobs:
        return
    print(f"  …pre-warming CrossRef cache: {len(dois)} DOIs + {len(cites)} title-searches (parallel)", flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
        futs = [ex.submit(_crossref_authors, doi) for doi in dois]
        futs += [ex.submit(_crossref_resolve, c) for c in cites]
        concurrent.futures.wait(futs)


def _crossref_authors(doi):
    """Return accent-folded family names for a DOI, or 'ERR' if CrossRef can't resolve it."""
    if doi in _CR_CACHE:
        return _CR_CACHE[doi]
    try:
        req = urllib.request.Request(
            f"https://api.crossref.org/works/{urllib.parse.quote(doi)}",
            headers={"User-Agent": "phd-cold-mail-refcheck/1.0 (mailto:noreply@example.com)"})
        with _OPENER.open(req, timeout=20) as r:
            m = json.load(r)["message"]
        fams = [_deaccent(a.get("family", "")) for a in m.get("author", [])]
        _CR_CACHE[doi] = fams
    except Exception:
        _CR_CACHE[doi] = "ERR"
    time.sleep(0.25)
    return _CR_CACHE[doi]


_TITLE_OF = re.compile(r'[\"“”「」『』]([^\"“”「」』]{8,200})[\"“”「」』]')


def _query_title(citation):
    """Best guess at the work TITLE inside a citation string, for a CrossRef
    bibliographic search. Prefer a quoted span; else drop the leading 'Authors
    (year).' and take the next sentence-ish chunk."""
    m = _TITLE_OF.search(citation or "")
    if m:
        return m.group(1).strip()
    c = re.sub(r"^.*?\(\d{4}[a-z]?\)\.?\s*", "", citation or "")   # strip 'Authors (2024). '
    c = re.split(r"\.\s|\bdoi\b|https?://|\bIn\b", c)[0]
    return c.strip()[:200]


def _title_sim(a, b):
    """Token Jaccard on alnum word sets — cheap title-match confidence."""
    wa = set(re.findall(r"[a-z0-9]+", _deaccent(a or "")))
    wb = set(re.findall(r"[a-z0-9]+", _deaccent(b or "")))
    wa -= {"the", "a", "an", "of", "and", "for", "in", "on", "to"}
    wb -= {"the", "a", "an", "of", "and", "for", "in", "on", "to"}
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / len(wa | wb)


def _crossref_resolve(citation):
    """No-DOI fallback: search CrossRef by the citation's title and return
    (doi, author_families, title_similarity) for the best hit, or (None,'ERR',0).
    Lets the gate machine-check authorship even when the draft carries no DOI."""
    title = _query_title(citation)
    ck = "Q::" + title[:120]
    if ck in _CR_CACHE:
        return _CR_CACHE[ck]
    res = (None, "ERR", 0.0)
    # CrossRef indexes Supporting-Info ('component', DOI ...s001), peer-review
    # reports ('peer-review', DOI .../v1/review3), datasets, grants — all SHARE the
    # article title but carry no/foreign author lists. Skip them or they false-flag
    # the real article's author as a misattribution. Keep only real work types.
    GOOD_TYPES = {"journal-article", "proceedings-article", "book-chapter", "book",
                  "monograph", "posted-content", "reference-entry", "report",
                  "dissertation", "reference-book", "other"}
    def _is_subrecord(doi):
        return bool(re.search(r"\.s\d+$|/v\d+/(review|decision|author-response)", doi or "", re.I))
    try:
        q = urllib.parse.urlencode({"query.bibliographic": title, "rows": 5})
        req = urllib.request.Request(
            f"https://api.crossref.org/works?{q}",
            headers={"User-Agent": "phd-cold-mail-refcheck/1.0 (mailto:noreply@example.com)"})
        with _OPENER.open(req, timeout=25) as r:
            items = json.load(r)["message"].get("items", [])
        # first item that is a real work record (not SI / review / dataset)
        best = next((it for it in items
                     if it.get("type", "") in GOOD_TYPES and not _is_subrecord(it.get("DOI", ""))),
                    None)
        if best:
            fams = [_deaccent(a.get("family", "")) for a in best.get("author", [])]
            sim = _title_sim(title, (best.get("title") or [""])[0])
            res = (best.get("DOI", ""), fams, sim)
    except Exception:
        pass
    _CR_CACHE[ck] = res
    time.sleep(0.25)
    return res


def crossref_attribution_gate(drafts, doi_only=False):
    """DETERMINISTIC attribution gate: for every research.papers[] entry that has a
    DOI, confirm the supervisor is actually in the author list. Catches the worst
    failure mode the local gate misses — a REAL, on-topic paper attributed to the
    wrong author (e.g. a 2023 Nature Communications ML paper credited to Saiani
    that is actually by a different group). The local gate only checks the body
    title appears in research.papers[]; it cannot tell if that paper is theirs.

    doi_only=True skips the (slow, network-heavy) no-DOI title resolution: papers
    with no DOI go straight to the hand-verify bucket. Fast full-corpus pass for
    dual-track work; the no-DOI papers are then cleared by the web subagents."""
    mode = "DOI-only" if doi_only else "DOI + no-DOI title resolution"
    print(f"\n=== CROSSREF GATE ({mode}): is the supervisor actually an author of EVERY cited paper? ===")
    _cache_load()
    _prewarm(drafts, doi_only)
    # misattrib = DOI-based, DETERMINISTIC, hard-blocking (the DOI pins the exact
    # paper). review = no-DOI title-resolution flags — LOW confidence (the title
    # search can land on a different same-titled paper, esp. for generic titles), so
    # these are "web-check", NOT auto-blocking. manual = no-DOI, couldn't resolve.
    misattrib, review, unresolved, manual, ok = [], [], [], [], 0
    SIM = 0.45   # title-match confidence needed to trust a no-DOI resolution
    for d in drafts:
        if not _name_cands(d["name"]):
            continue
        searched = "/".join(sorted(_name_cands(d["name"])))
        for p in d["papers"]:
            cit = (p.get("citation", "") if isinstance(p, dict) else str(p))[:70]
            doi = _doi_of(p)
            if doi:
                fams = _crossref_authors(doi)
                if fams == "ERR":
                    unresolved.append((d["name"], doi, cit))
                elif not _supervisor_is_author(d["name"], fams):
                    misattrib.append((d["name"], searched, doi, cit, fams[:6]))
                else:
                    ok += 1
            elif doi_only:
                manual.append((d["name"], cit, "no DOI (--doi-only: web-verify authorship)"))
            else:
                # NO DOI — try to resolve the title on CrossRef and check authorship.
                rdoi, fams, sim = _crossref_resolve(p.get("citation", "") if isinstance(p, dict) else str(p))
                if fams == "ERR" or sim < SIM:
                    manual.append((d["name"], cit, f"no DOI; CrossRef title-search inconclusive (sim={sim:.2f})"))
                elif not _supervisor_is_author(d["name"], fams):
                    review.append((d["name"], searched, f"{rdoi} (sim={sim:.2f})", cit, fams[:6]))
                else:
                    ok += 1
    print(f"  ✅ author-confirmed: {ok}  (incl. no-DOI papers resolved by title)")
    if misattrib:
        print(f"  🔴 MISATTRIBUTION ({len(misattrib)}) — DOI's author list does NOT contain the supervisor (BLOCKING):")
        for name, fam, doi, cit, fams in misattrib:
            print(f"     {name} (searched: {fam}) | {doi}")
            print(f"        actual authors: {fams}")
            print(f"        our citation:   {cit}")
    if review:
        print(f"  🟡 REVIEW ({len(review)}) — no-DOI paper title-resolved to a record WITHOUT this author (LOW confidence: title-search may have hit a different same-titled paper; web-check, not auto-blocking):")
        for name, fam, doi, cit, fams in review:
            print(f"     {name} | resolved {doi} | authors {fams}")
            print(f"        our citation:   {cit}")
    if manual:
        print(f"  ⚠️ NO-DOI, not machine-confirmable ({len(manual)}) — MUST web-verify authorship by hand:")
        for name, cit, why in manual:
            print(f"     {name} | {cit} | {why}")
    if unresolved:
        print(f"  🟠 DOI unresolved on CrossRef ({len(unresolved)}) — verify by hand (wrong DOI, arXiv, or not indexed):")
        for name, doi, cit in unresolved:
            print(f"     {name} | {doi} | {cit}")
    if not misattrib and not review and not manual and not unresolved:
        print("  ✅ every cited paper is correctly attributed to its supervisor")
    _cache_save()
    # misattribution (DOI) is hard-blocking; review + no-DOI-manual are must-verify
    # (unconfirmed) — surfaced together so nothing ships author-unchecked.
    return len(misattrib), len(review) + len(manual)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("path", help="directory of JSON drafts OR a manifest.json array")
    ap.add_argument("--batch", type=int, default=10)
    ap.add_argument("--out", default="/tmp")
    ap.add_argument("--no-crossref", action="store_true", help="skip the CrossRef author-attribution gate (offline)")
    ap.add_argument("--doi-only", action="store_true", help="fast: only check DOI'd papers directly; no-DOI papers go to the hand-verify bucket (no slow title resolution). Use for full-corpus dual-track passes.")
    args = ap.parse_args()

    drafts = load_drafts(args.path)
    print(f"loaded {len(drafts)} drafts\n")

    # ---- LOCAL PROVENANCE GATE ----
    print("=== LOCAL GATE: body-named works missing from verified research.papers[] ===")
    blocking = 0
    have_papers = sum(1 for d in drafts if d["papers"])
    for d in drafts:
        titles = body_titles(d["body"])
        if not titles:
            continue
        # only enforce provenance if this draft pipeline actually carries a papers list
        if not d["papers"]:
            continue
        missing = [t for t in titles if not in_papers(t, d["papers"])]
        # also flag papers lacking source_url
        no_src = [p.get("citation", "?")[:50] for p in d["papers"]
                  if isinstance(p, dict) and not p.get("source_url")]
        if missing:
            blocking += 1
            print(f"  🔴 {d['name']} <{d['email']}> — body cites work(s) NOT in research.papers[]:")
            for t in missing:
                print(f"        “{t[:80]}”")
        if no_src:
            print(f"  🟠 {d['name']} — research.papers[] entries with NO source_url: {no_src}")
    if not have_papers:
        print("  (drafts carry no research.papers[] list — local provenance gate skipped; rely on web verification)")
    elif blocking == 0:
        print("  ✅ every quoted body title is backed by a verified paper in research.papers[]")

    # ---- CROSSREF ATTRIBUTION GATE (deterministic; catches misattribution) ----
    cr_block = cr_manual = 0
    if not args.no_crossref:
        try:
            cr_block, cr_manual = crossref_attribution_gate(drafts, doi_only=args.doi_only)
        except Exception as e:
            print(f"\n  🟠 CrossRef gate skipped (network?): {e}")
    # both count as must-clear-before-ship: misattribution = proven wrong;
    # no-DOI-manual = unconfirmed, and the rule is EVERY citation gets confirmed.
    blocking += cr_block + cr_manual

    # ---- EXTRACT + BATCH for web verification ----
    rows = [{"name": d["name"], "email": d["email"], "variant": d["variant"],
             "eng": best_para(d["body"])} for d in drafts]
    outdir = args.out
    os.makedirs(outdir, exist_ok=True)
    n = len(rows); per = args.batch; nb = (n + per - 1) // per
    for i in range(nb):
        chunk = rows[i * per:(i + 1) * per]
        fp = os.path.join(outdir, f"cite_batch_{i+1}.json")
        json.dump(chunk, open(fp, "w"), ensure_ascii=False, indent=2)
    print(f"\n=== wrote {nb} web-verification batches to {outdir}/cite_batch_*.json (~{per} drafts each) ===")
    print("Next: spawn one general-purpose subagent per batch with references/verify_citations_prompt.md")
    print(f"      (substitute {{BATCH_PATH}} = {outdir}/cite_batch_N.json). BLOCK on NOT_FOUND / MISCHARACTERIZED / unresolved UNCERTAIN.")
    if blocking:
        bits = []
        if cr_block:
            bits.append(f"{cr_block} misattribution")
        if cr_manual:
            bits.append(f"{cr_manual} need-verify (no-DOI / low-confidence)")
        extra = f" [{', '.join(bits)}]" if bits else ""
        print(f"\n🔴 {blocking} blocking citation issue(s){extra} — every cited work must be author-confirmed (DOI or title-resolved or hand-verified) before shipping, regardless of web-verification results.")
        sys.exit(2)


if __name__ == "__main__":
    main()
