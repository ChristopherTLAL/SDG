#!/usr/bin/env python3
"""Load thread-aware cold-mail drafts into Mail.app — cold / followup / reply.

This is the quote-capable companion to `load_to_mail_drafts.py` (which is
cold-only). Use it when the campaign has prior history:
  - cold     : fresh first contact (no quote)
  - followup : student sent earlier, no reply → quote the student's ORIGINAL
               (found in the account's "Sent Mail")
  - reply    : professor replied → quote the professor's reply
               (found in "INBOX")

HARD-WON RULES baked in (see references/style_lessons.md Lessons 13-15):
  • followup finder searches ONLY mailboxes whose name contains "Sent"
    — NEVER "All Mail". Gmail's "All Mail" virtual folder INCLUDES Drafts,
    so on a re-load the finder grabs a PRIOR DRAFT instead of the real
    original → nested-quote pollution (the followup body appears twice).
  • reply finder searches INBOX for sender == professor (drafts are
    from=student so never false-match).
  • Some sent originals have a subject field literally prefixed "Subject: "
    → strip it before building "Re: ".
  • Stable delete = collect ids first, then delete-by-id (iterating
    `delete (every message whose ...)` invalidates handles → -1728).
  • Verify attachment count == 2 after save; Mail's async attach
    occasionally drops the 2nd → one rebuild retry.
  • PRIOR-CONTACT TRUTH: before trusting a "followup" classification, the
    caller MUST confirm the recipient is actually in Sent Mail. A campaign
    tracker's "已套磁/contacted" flag is NOT proof — originals misdirected to
    a wrong address, or never sent, mean the professor never received
    anything, so "I wrote to you earlier" is a FALSE claim. Reclassify
    those to cold. (This script just reports NOORIG; the caller decides.)

Manifest format: a single JSON file = array of objects:
    {"name": "...", "email": "...", "variant": "cold|followup|reply",
     "subject": "...", "body": "..."}

Usage:
    python3 load_with_quote.py MANIFEST.json \
        --account "潘喆" --sender "Zhe Pan <x@gmail.com>" \
        --rp /path/RP.docx --cv /path/CV.pdf \
        [--emails a@x,b@y]      # only these recipients (else all)
        [--test]                # dry-run the finder only (no delete/create)
"""
import argparse, json, subprocess, sys, time, re


def osa(script, timeout=120):
    return subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=timeout)


def aps(s):
    return s.replace("\\", "\\\\").replace('"', '\\"')


class Loader:
    def __init__(self, account, sender, rp, cv):
        self.account, self.sender, self.rp, self.cv = account, sender, rp, cv

    def delete_existing(self, email):
        el = aps(email)
        script = f'''
with timeout of 90 seconds
tell application "Mail"
    set acct to account "{aps(self.account)}"
    set mb to mailbox "Drafts" of acct
    set ids to {{}}
    repeat with m in messages of mb
        set toAddr to ""
        try
            set toAddr to address of (item 1 of (to recipients of m))
        end try
        ignoring case
            if toAddr is equal to "{el}" then set end of ids to (id of m)
        end ignoring
    end repeat
    repeat with theId in ids
        try
            delete (first message of mb whose id is theId)
        end try
    end repeat
    return (count of ids) as string
end tell
end timeout'''
        return osa(script).stdout.strip()

    def get_native_quote(self, email, variant):
        el = aps(email)
        if variant == "reply":
            finder = f'''
        try
            set mb to mailbox "INBOX" of acct
            repeat with m in messages of mb
                if (sender of m) contains "{el}" then
                    set origMsg to m
                    exit repeat
                end if
            end repeat
        end try'''
        else:  # followup: ONLY "Sent Mail" — never "All Mail" (it contains Drafts)
            finder = f'''
        repeat with mb in mailboxes of acct
            if (name of mb) contains "Sent" then
                try
                    repeat with m in messages of mb
                        set toAddr to ""
                        try
                            repeat with r in (to recipients of m)
                                set toAddr to toAddr & (address of r) & ","
                            end repeat
                        end try
                        ignoring case
                            if toAddr contains "{el}" then
                                set origMsg to m
                                exit repeat
                            end if
                        end ignoring
                    end repeat
                end try
            end if
            if origMsg is not missing value then exit repeat
        end repeat'''
        script = f'''
with timeout of 110 seconds
tell application "Mail"
    set acct to account "{aps(self.account)}"
    set origMsg to missing value
    {finder}
    if origMsg is missing value then return "NOORIG"
    set origSubj to (subject of origMsg)
    set origContent to (content of origMsg)
    return origSubj & "|||SPLIT|||" & origContent
end tell
end timeout'''
        out = osa(script, timeout=120).stdout.strip()
        if out == "NOORIG" or "|||SPLIT|||" not in out:
            return None
        subj, content = out.split("|||SPLIT|||", 1)
        subj = re.sub(r'^\s*subject:\s*', '', subj, flags=re.I)  # Geiger quirk
        low = subj.lower().lstrip()
        re_subj = subj if low.startswith(("re:", "sv:", "aw:", "答复:", "回复:")) else "Re: " + subj
        quoted = "\n".join("> " + ln for ln in content.split("\n"))
        return re_subj, "\n\n\n\n" + quoted

    def create_draft(self, subject, body, to_email):
        with open("/tmp/_draft_body.txt", "w") as f:
            f.write(body)
        script = f'''
with timeout of 90 seconds
set bodyText to (read (POSIX file "/tmp/_draft_body.txt") as «class utf8»)
tell application "Mail"
    set newMsg to make new outgoing message with properties {{sender:"{aps(self.sender)}", subject:"{aps(subject)}", content:bodyText, visible:false}}
    tell newMsg
        make new to recipient at end of to recipients with properties {{address:"{aps(to_email)}"}}
        tell content
            make new attachment with properties {{file name:POSIX file "{self.rp}"}} at after last paragraph
            make new attachment with properties {{file name:POSIX file "{self.cv}"}} at after last paragraph
        end tell
    end tell
    delay 1
    save newMsg
    return "OK"
end tell
end timeout'''
        return osa(script, timeout=100)

    def att_count(self, email):
        el = aps(email)
        script = f'''
tell application "Mail"
    set mb to mailbox "Drafts" of account "{aps(self.account)}"
    set n to -1
    repeat with m in messages of mb
        set toAddr to ""
        try
            set toAddr to address of (item 1 of (to recipients of m))
        end try
        ignoring case
            if toAddr is equal to "{el}" then
                set n to (count of mail attachments of m)
                exit repeat
            end if
        end ignoring
    end repeat
    return n as string
end tell'''
        try:
            return int(osa(script).stdout.strip())
        except ValueError:
            return -1


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("manifest")
    ap.add_argument("--account", required=True)
    ap.add_argument("--sender", required=True)
    ap.add_argument("--rp", required=True)
    ap.add_argument("--cv", required=True)
    ap.add_argument("--emails", help="comma-separated recipients to process (default: all)")
    ap.add_argument("--test", action="store_true", help="dry-run finder only (no delete/create)")
    args = ap.parse_args()

    drafts = json.load(open(args.manifest))
    by_email = {x["email"].lower(): x for x in drafts}
    emails = [e.strip() for e in args.emails.split(",")] if args.emails else [x["email"] for x in drafts]
    L = Loader(args.account, args.sender, args.rp, args.cv)

    if args.test:
        print("=== FINDER TEST (no delete/create) ===")
        for e in emails:
            x = by_email.get(e.lower())
            if not x:
                print(f"  ❌ {e} not in manifest"); continue
            if x["variant"] == "cold":
                print(f"  [cold]     {e}  (no finder)"); continue
            nq = L.get_native_quote(e, x["variant"])
            if nq is None:
                print(f"  ❌ [{x['variant']}] {e} → NOORIG (would downgrade to cold; CONFIRM prior-contact, see Lesson 15)")
            else:
                rs, q = nq
                print(f"  ✅ [{x['variant']}] {e}\n        re_subj: {rs[:75]}\n        quote#1: {q.strip().splitlines()[0][:70]}")
        return

    print(f"=== LOAD {len(emails)} drafts ===")
    for i, e in enumerate(emails):
        x = by_email.get(e.lower())
        if not x:
            print(f"[{i+1}] ❌ {e} not in manifest"); continue
        nm, variant = x["name"], x["variant"]
        dn = L.delete_existing(e); time.sleep(2)
        if variant in ("followup", "reply"):
            nq = L.get_native_quote(e, variant)
            if nq is None:
                subj, full, note = x["subject"], x["body"], "⚠️NOORIG→cold (verify prior-contact!)"
            else:
                rs, quote = nq
                subj, full, note = rs, x["body"].rstrip() + "\n" + quote, "quote✓"
        else:
            subj, full, note = x["subject"], x["body"], "cold"
        r = L.create_draft(subj, full, e); time.sleep(3)
        ac = L.att_count(e)
        if ac < 2:
            L.delete_existing(e); time.sleep(2)
            r = L.create_draft(subj, full, e); time.sleep(3); ac = L.att_count(e)
            note += " (att-retry)"
        ok = r.returncode == 0 and "OK" in r.stdout
        print(f"[{i+1}/{len(emails)}] {variant:8s} {nm} <{e}> del={dn} att={ac} {note} {'✅' if ok and ac >= 2 else '❌ ' + r.stderr.strip()[:60]}", flush=True)


if __name__ == "__main__":
    main()
