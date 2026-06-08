#!/usr/bin/env python3
"""
Load per-supervisor cold-mail drafts (JSON) into macOS Mail.app Drafts folder
of the student's bound email account, with RP+CV attached.

This is the cleanest send pipeline: the student opens Mail.app → Drafts →
reviews each pre-populated draft (recipient, subject, body, attachments) →
clicks Send one-by-one (or batched). No external Gmail forwarding ritual.

Requires:
- macOS Mail.app
- The student's email account already configured in Mail.app
- The student's account name (e.g. "B. 学生 - 刘锦楠") OR account email
- AppleScript permission for Terminal/iTerm to control Mail.app
  (first run will trigger macOS permission prompt)

Usage:
    python3 load_to_mail_drafts.py DIR \
        --sender "Jinnan Liu <cpusuda@outlook.com>" \
        --rp "/path/to/RP.pdf" \
        --cv "/path/to/CV.pdf" \
        [--only "001,002,003" | --only-top N] \
        [--skip "u036" ] \
        [--rate-limit 0.5]
"""

import argparse
import json
import re
import subprocess
import sys
import time
from pathlib import Path


def aps_escape(s: str) -> str:
    """Escape a Python string for use in an AppleScript double-quoted literal."""
    return s.replace("\\", "\\\\").replace('"', '\\"')


def _to_recipient_block(to_field: str) -> str:
    """Build AppleScript snippet adding all comma-separated TO recipients.

    `contact.email` in JSON can be a single email or comma-separated list
    (e.g. legacy + current institution for relocated faculty — see
    style_lessons.md Lesson 9). All addresses are added as primary TO
    recipients.
    """
    addrs = [a.strip() for a in to_field.split(",") if a.strip() and "@" in a]
    return "\n        ".join(
        f'make new to recipient at end of to recipients with properties {{address:"{a}"}}'
        for a in addrs
    )


def build_create_script(*, sender: str, subject: str, body: str, to: str, rp: str, cv: str) -> str:
    """Build AppleScript that creates ONE draft in Mail.app.

    Empirical finding (2026-05-24 debug session): when Drafts mailbox is in a
    clean state at the start of a batch, ONE `make new outgoing message` +
    `save` creates exactly ONE draft. The "2 drafts per call" issue observed
    earlier was caused by leftover state from previous test runs (Outlook IMAP
    syncing back drafts from prior attempts), NOT by Mail.app autosaving a
    shadow.

    Attachments are processed asynchronously by Mail.app — `count of mail
    attachments of m` may return 0 right after `save msg` and only become
    correct after 5-15 seconds. This is fine; the attachment IS present in
    the saved draft, just hasn't been indexed yet.
    """
    to_block = _to_recipient_block(to)
    return f'''
tell application "Mail"
    set msg to make new outgoing message with properties {{¬
        sender:"{aps_escape(sender)}", ¬
        subject:"{aps_escape(subject)}", ¬
        content:"{aps_escape(body)}", ¬
        visible:false ¬
    }}
    tell msg
        {to_block}
        tell content
            make new attachment with properties {{file name:POSIX file "{rp}"}} at after last paragraph
            make new attachment with properties {{file name:POSIX file "{cv}"}} at after last paragraph
        end tell
    end tell
    save msg
end tell
return "OK"
'''


def build_cleanup_script(*, account_name: str, drafts_name: str = "草稿") -> str:
    """Final dedup pass run ONCE at end of batch.

    For any subject with duplicate drafts (e.g. from re-running the script),
    keep the one with the max attachment count, delete the rest. Uses
    delete-by-ID (not by-index) which is the only deletion pattern that
    reliably survives Mail.app's async re-indexing during sync.
    """
    return f'''
tell application "Mail"
    set acct to account "{aps_escape(account_name)}"
    set draftsMb to mailbox "{aps_escape(drafts_name)}" of acct
    set allSubjects to {{}}
    set allCounts to {{}}
    set allIds to {{}}
    -- Collect snapshot
    repeat with m in (messages of draftsMb)
        set end of allSubjects to (subject of m)
        set end of allCounts to (count of mail attachments of m)
        set end of allIds to (id of m)
    end repeat
    -- For each unique subject, find max-att index; mark others for deletion
    set toDelete to {{}}
    set seenSubjects to {{}}
    repeat with i from 1 to count of allSubjects
        set sub to item i of allSubjects
        if seenSubjects does not contain sub then
            set end of seenSubjects to sub
            -- Find max-att index for this subject
            set maxAtt to -1
            set maxIdx to 0
            repeat with j from 1 to count of allSubjects
                if item j of allSubjects is sub then
                    if (item j of allCounts) > maxAtt then
                        set maxAtt to (item j of allCounts)
                        set maxIdx to j
                    end if
                end if
            end repeat
            -- Mark all OTHER same-subject indices for deletion
            repeat with j from 1 to count of allSubjects
                if item j of allSubjects is sub and j is not maxIdx then
                    set end of toDelete to (item j of allIds)
                end if
            end repeat
        end if
    end repeat
    -- Delete by ID
    set deletedCount to 0
    repeat with msgId in toDelete
        try
            delete (first message of draftsMb whose id is msgId)
            set deletedCount to deletedCount + 1
        end try
    end repeat
    return "Dedup: deleted " & deletedCount & " duplicate(s); remaining: " & (count of messages of draftsMb)
end tell
'''


def parse_filter(spec: str):
    """Parse --only / --skip comma-separated list of IDs (e.g. '001,u036,012')."""
    if not spec:
        return set()
    return {x.strip() for x in spec.split(",") if x.strip()}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("folder", help="Directory of per-supervisor JSON drafts")
    ap.add_argument("--sender", required=True, help='Mail.app sender like "Jinnan Liu <user@domain.com>"')
    ap.add_argument("--account-name", required=True, help='Mail.app account name like "B. 学生 - 刘锦楠" — needed for autosave-shadow cleanup')
    ap.add_argument("--drafts-name", default="草稿", help='Drafts mailbox name within the account. Defaults to 草稿 (Chinese localization); English Mail.app uses "Drafts".')
    ap.add_argument("--rp", required=True, help="Path to RP file (will be attached)")
    ap.add_argument("--cv", required=True, help="Path to CV file (will be attached)")
    ap.add_argument("--only", help="Comma-separated list of IDs to include (e.g. '001,002,u012')")
    ap.add_argument("--only-top", type=int, help="Only drafts where top_rank <= N")
    ap.add_argument("--skip", help="Comma-separated list of IDs to skip")
    ap.add_argument("--rate-limit", type=float, default=0.5, help="Seconds to sleep between drafts (default: 0.5)")
    ap.add_argument("--dry-run", action="store_true", help="Print what would be created without invoking Mail.app")
    args = ap.parse_args()

    folder = Path(args.folder)
    rp = Path(args.rp).resolve()
    cv = Path(args.cv).resolve()
    if not rp.exists():
        print(f"ERROR: RP not found: {rp}", file=sys.stderr)
        sys.exit(1)
    if not cv.exists():
        print(f"ERROR: CV not found: {cv}", file=sys.stderr)
        sys.exit(1)

    only_ids = parse_filter(args.only)
    skip_ids = parse_filter(args.skip)
    files = sorted([f for f in folder.iterdir() if f.suffix == ".json" and f.name != "MANIFEST.json"])

    succeed = 0
    failed = []
    skipped = []
    for f in files:
        r = json.loads(f.read_text(encoding="utf-8"))
        file_id = r["id"]
        rank = r.get("top_rank")

        # Apply filters
        if only_ids and file_id not in only_ids:
            continue
        if args.only_top is not None and (not rank or rank > args.only_top):
            continue
        if skip_ids and file_id in skip_ids:
            skipped.append(file_id)
            continue

        to = r["contact"].get("email", "").strip()
        if not to or "@" not in to:
            failed.append((file_id, "no email"))
            continue

        subject = r["email"]["subject"]
        body = r["email"]["body"] + "\n\n" + r["email"].get("signature", "")

        if args.dry_run:
            print(f"[dry] {file_id}  →  {to}  |  {subject[:80]}")
            succeed += 1
            continue

        create_script = build_create_script(
            sender=args.sender, subject=subject, body=body, to=to,
            rp=str(rp), cv=str(cv),
        )
        try:
            result = subprocess.run(["osascript", "-e", create_script], capture_output=True, text=True, timeout=30)
            if result.returncode == 0 and "OK" in result.stdout:
                succeed += 1
                print(f"✅ {file_id}  →  {to}  |  {r['supervisor']['name']}")
            else:
                failed.append((file_id, result.stderr.strip() or "non-OK return"))
                print(f"❌ {file_id}  →  {to}  |  {result.stderr.strip()[:100]}")
        except subprocess.TimeoutExpired:
            failed.append((file_id, "timeout"))
            print(f"⏱ {file_id}  →  timeout")
        time.sleep(args.rate_limit)

    # Final dedup pass: in case of re-runs or shadows, dedupe same-subject drafts
    if not args.dry_run and succeed > 0:
        print("\nWaiting 5s for Mail.app to settle before dedup sweep...")
        time.sleep(5)
        cleanup_script = build_cleanup_script(account_name=args.account_name, drafts_name=args.drafts_name)
        cleanup_result = subprocess.run(["osascript", "-e", cleanup_script], capture_output=True, text=True, timeout=60)
        print(f"Cleanup: {cleanup_result.stdout.strip() or cleanup_result.stderr.strip()}")

    print()
    print(f"=== SUMMARY ===")
    print(f"  Loaded as drafts: {succeed}")
    print(f"  Skipped: {len(skipped)}")
    print(f"  Failed: {len(failed)}")
    for fid, err in failed:
        print(f"    {fid}: {err}")
    print()
    print(f"Drafts now live in Mail.app under the sender account's Drafts mailbox.")
    print(f"Open Mail.app to review and send.")


if __name__ == "__main__":
    main()
