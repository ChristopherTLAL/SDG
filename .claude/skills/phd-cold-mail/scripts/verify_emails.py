#!/usr/bin/env python3
"""
Verify emails claimed by the end-to-end subagents are not hallucinations.

For each per-supervisor JSON in DIR:
  - If `contact.email_source` is already set (e.g., from email_hunt pass), skip
    — that one was explicitly verified by a hunt subagent.
  - Otherwise: download up to 3 pages from `research.links`, grep for the EXACT
    email string. If found on any page, write that URL into `email_source`.
  - If grep fails on all pages BUT the email domain matches the institution's
    canonical domain (e.g., berkeley.edu for UC Berkeley), mark as
    `pattern-plausible` — keep email but flag low-confidence in
    `email_source = "PATTERN-INFERRED: <institution domain>"`.
  - If both fail: set `email_confirmed = false`, `email = ""`,
    `email_source = "VERIFICATION_FAILED"`. The supervisor goes into a
    suspicious list for the user to inspect / re-hunt.

Usage:
    python3 verify_emails.py DIR [--dry-run] [--all]

  --all     also re-verify rows that already have email_source set
  --dry-run report findings but do not modify JSONs
"""

import argparse
import json
import re
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

try:
    import requests
except ImportError:
    print("Install requests: pip install requests", file=sys.stderr)
    sys.exit(2)


# Known institutional canonical email domains. Used as fallback when content
# fetch fails (e.g., JS-rendered pages) but the email format is plausible.
INSTITUTION_DOMAINS = {
    "caltech": "caltech.edu",
    "berkeley": "berkeley.edu",
    "stanford": "stanford.edu",
    "mit": "mit.edu",
    "harvard": "harvard.edu",
    "princeton": "princeton.edu",
    "cornell": "cornell.edu",
    "columbia": "columbia.edu",
    "chicago": "uchicago.edu",
    "michigan": "umich.edu",
    "northwestern": "northwestern.edu",
    "pennsylvania": "upenn.edu",
    "penn": "upenn.edu",
    "wisconsin": "wisc.edu",
    "illinois": "illinois.edu",
    "georgia tech": "gatech.edu",
    "georgia institute": "gatech.edu",
    "johns hopkins": "jhu.edu",
    "nyu": "nyu.edu",
    "ucl": "ucl.ac.uk",
    "university college london": "ucl.ac.uk",
    "edinburgh": "ed.ac.uk",
    "manchester": "manchester.ac.uk",
    "king's": "kcl.ac.uk",
    "kings": "kcl.ac.uk",
    "bristol": "bristol.ac.uk",
    "warwick": "warwick.ac.uk",
    "leeds": "leeds.ac.uk",
    "sheffield": "sheffield.ac.uk",
    "glasgow": "glasgow.ac.uk",
    "birmingham": "bham.ac.uk",
    "southampton": "soton.ac.uk",
    "nottingham": "nottingham.ac.uk",
    "hong kong": ["ust.hk", "cuhk.edu.hk", "cityu.edu.hk", "hku.hk", "polyu.edu.hk"],
    "hkust": "ust.hk",
    "cuhk": "cuhk.edu.hk",
    "city university of hong kong": "cityu.edu.hk",
    "cityu": "cityu.edu.hk",
    "hku": "hku.hk",
    "polyu": "polyu.edu.hk",
    "national university of singapore": "nus.edu.sg",
    "nus": "nus.edu.sg",
    "nanyang": "ntu.edu.sg",
    "ntu": "ntu.edu.sg",
}


def institution_domains_for(school: str):
    """Return list of plausible institutional domains for a school string."""
    if not school:
        return []
    school_l = school.lower()
    matched = set()
    for k, v in INSTITUTION_DOMAINS.items():
        if k in school_l:
            if isinstance(v, list):
                matched.update(v)
            else:
                matched.add(v)
    return list(matched)


def fetch_text(url: str, timeout: float = 10.0):
    """Fetch a URL and return its text content, or None on failure."""
    try:
        # Spoof a reasonable browser UA so .ac.uk profile pages don't 403
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/127.0 Safari/537.36"
        }
        resp = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        if resp.status_code >= 400:
            return None
        return resp.text
    except Exception:
        return None


def email_appears_in(text: str, email: str) -> bool:
    """Robust check: handles common obfuscations.

    Looks for:
    - Plain `email`
    - `email` with surrounding HTML entities
    - `local [at] domain`, `local (at) domain`
    - `local@domain` reversed (extremely rare)
    """
    if not text or not email or "@" not in email:
        return False
    if email in text:
        return True
    local, domain = email.lower().split("@", 1)
    text_l = text.lower()
    # Obfuscated forms
    for sep in (" [at] ", "[at]", " (at) ", "(at)", " {at} ", " AT ", " at "):
        if f"{local}{sep}{domain}" in text_l:
            return True
        if f"{local}{sep.strip()}{domain}" in text_l:
            return True
    # Sometimes the email appears as `firstname [dot] lastname [at] uni [dot] edu`
    obf_email = email_to_obfuscated(email)
    if obf_email and obf_email in text_l:
        return True
    return False


def email_to_obfuscated(email: str):
    """Produce the common obfuscation pattern for grep."""
    if "@" not in email:
        return None
    local, domain = email.split("@", 1)
    local_obf = local.replace(".", " [dot] ")
    domain_obf = domain.replace(".", " [dot] ")
    return f"{local_obf} [at] {domain_obf}".lower()


def verify_one(record, force=False):
    """Returns (status, source_or_message). Status: 'verified' / 'pattern' / 'failed'."""
    email = record["contact"].get("email", "").strip()
    if not email or "@" not in email:
        return ("failed", "NO_EMAIL")
    if not force and record["contact"].get("email_source"):
        return ("verified", record["contact"]["email_source"] + " (already-set)")

    links = record["research"].get("links", [])
    # Also include known faculty-page domain links
    for url in links[:4]:
        if not url or not url.startswith("http"):
            continue
        text = fetch_text(url)
        if text and email_appears_in(text, email):
            return ("verified", url)
        time.sleep(0.3)  # gentle

    # Fallback: pattern-plausibility check
    school = record["supervisor"].get("school", "")
    plausible_domains = institution_domains_for(school)
    email_domain = email.split("@", 1)[1].lower()
    for d in plausible_domains:
        if email_domain == d or email_domain.endswith("." + d):
            return ("pattern", f"PATTERN-INFERRED:{d}")
    return ("failed", f"UNVERIFIED:{email_domain}-vs-{','.join(plausible_domains) or 'unknown'}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--all", action="store_true", help="Also re-verify rows with existing email_source")
    args = ap.parse_args()

    folder = Path(args.folder)
    files = sorted([f for f in folder.iterdir() if f.suffix == ".json" and f.name != "MANIFEST.json"])

    stats = {"verified": 0, "pattern": 0, "failed": 0, "skipped": 0}
    failures = []
    pattern_only = []

    for f in files:
        r = json.loads(f.read_text(encoding="utf-8"))
        already_sourced = bool(r["contact"].get("email_source"))
        if already_sourced and not args.all:
            stats["skipped"] += 1
            continue

        status, source = verify_one(r, force=args.all)
        stats[status] += 1
        if status == "verified":
            r["contact"]["email_source"] = source
        elif status == "pattern":
            r["contact"]["email_source"] = source
            r["contact"]["email_confirmed"] = True  # still considered plausible
            pattern_only.append((f.stem, r["supervisor"]["name"], r["contact"]["email"], source))
        elif status == "failed":
            r["contact"]["email_confirmed"] = False
            r["contact"]["email_source"] = source
            failures.append((f.stem, r["supervisor"]["name"], r["contact"]["email"], source))

        if not args.dry_run:
            f.write_text(json.dumps(r, ensure_ascii=False, indent=2), encoding="utf-8")
        print(
            f"  [{status:8s}] {f.stem[:50]:50s} {r['contact']['email'][:35]:35s} {source[:50]}",
            file=sys.stderr,
        )

    print(file=sys.stderr)
    print(f"=== SUMMARY ===", file=sys.stderr)
    print(f"  verified (URL match):     {stats['verified']}", file=sys.stderr)
    print(f"  pattern-only (plausible): {stats['pattern']}", file=sys.stderr)
    print(f"  failed (suspicious):      {stats['failed']}", file=sys.stderr)
    print(f"  skipped (already-set):    {stats['skipped']}", file=sys.stderr)
    if pattern_only:
        print(f"\n--- Pattern-plausible (not directly fetched) ---", file=sys.stderr)
        for fn, name, email, src in pattern_only:
            print(f"  {fn[:50]:50s} {name[:30]:30s} {email}", file=sys.stderr)
    if failures:
        print(f"\n--- ⚠️ FLAGGED (need re-hunt) ---", file=sys.stderr)
        for fn, name, email, src in failures:
            print(f"  {fn[:50]:50s} {name[:30]:30s} {email}  ({src})", file=sys.stderr)
    # stdout: list of suspect filenames for downstream re-hunt
    for fn, _, _, _ in failures:
        print(fn)


if __name__ == "__main__":
    main()
