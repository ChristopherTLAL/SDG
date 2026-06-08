#!/usr/bin/env python3
# ============================================================================
# send_via_mailapp.py — batch-send reviewed Drafts from a Gmail/IMAP account
# bound to macOS Mail.app (the 潘喆 2026-06-02 validated sender; see Lesson 18).
# PARAMETERIZE per student: ACCT (Mail account name), SENDER, attachment paths,
# MANIFEST, and the LEDGER path. Idempotency + verify both match RECIPIENT+SUBJECT
# (subject alone collides — see Lesson 18). Records to a ledger only after the
# message is confirmed in Sent with attachments + quote intact. STOP-file circuit
# breaker if Outbox sticks. Usage: python3 send_via_mailapp.py --pace 22 e1,e2,...
# ============================================================================
"""潘喆 cold-mail sender — faithful-copy, verify-in-Sent, circuit-breakered.

Sends the EXISTING Mail drafts (reads each draft's exact content incl. quote,
CC, attachment set straight from Mail — NOT rebuilt from manifest), one at a
time, verifying it lands in 潘喆 Sent before deleting the original + send-stray.

Idempotency (correct for a campaign WITH prior history, unlike 刘锦楠 all-cold):
  - a SENT draft is deleted, so "draft still exists" == not yet sent;
  - belt-and-suspenders: skip if the draft's NEW subject is already in Sent
    (the new "Re: …"/cold subject differs from Zhe's old plain original, so a
    followup recipient already in Sent from the Jan/Apr batch is NOT falsely
    skipped).
Proxy rule INVERTED vs 刘锦楠 (Gmail needs the proxy): guard = Outbox must be 0
before & after each send; non-empty Outbox => SMTP stuck => touch STOP + halt.

Usage: python3 panzhe_send_batch.py a@x,b@y[,...] [--pace 25]
"""
import subprocess, sys, time
from pathlib import Path

ACCT = "潘喆"
SENDER = "Zhe Pan <wenansamascholar@gmail.com>"
RP = "/Users/shijie/Obsidian/规划看板/01_Student/潘喆/文书材料/Pan Zhe_RP_251120.docx"
CV = "/Users/shijie/Obsidian/规划看板/01_Student/潘喆/文书材料/Pan Zhe_CV.pdf"
STATE = Path.home() / ".panzhe_send"; STATE.mkdir(exist_ok=True)
LEDGER = STATE / "sent.txt"
STOP = Path("/tmp/panzhe_send.STOP")
BODYTMP = "/tmp/_panzhe_send_body.txt"

def aps(s): return s.replace("\\","\\\\").replace('"','\\"')
def osa(script, timeout=120):
    return subprocess.run(["osascript","-e",script], capture_output=True, text=True, timeout=timeout)

SENT_CLAUSE = '''
        set smb to missing value
        repeat with mb in mailboxes of acct
            if (name of mb) contains "Sent" then set smb to mb
        end repeat'''

def outbox_count():
    r = osa('tell application "Mail"\n try\n  return (count of messages of mailbox "Outbox") as text\n on error\n  return "0"\n end try\nend tell', timeout=30)
    try: return int(r.stdout.strip())
    except: return 0

def already_sent(email, subj):
    """True only if a Sent message matches BOTH this recipient AND subject
    (subject alone collides — several drafts share a subject line)."""
    sj = aps(subj); el = aps(email)
    r = osa(f'''
with timeout of 40 seconds
tell application "Mail"
    set acct to account "{aps(ACCT)}"{SENT_CLAUSE}
    if smb is missing value then return "0"
    repeat with m in (messages of smb whose subject is "{sj}")
        try
            if (address of (item 1 of (to recipients of m))) is "{el}" then return "1"
        end try
    end repeat
    return "0"
end tell
end timeout''', timeout=50)
    return r.stdout.strip() == "1"

def read_draft(email):
    el = aps(email)
    r = osa(f'''
with timeout of 60 seconds
tell application "Mail"
    set mb to mailbox "Drafts" of account "{aps(ACCT)}"
    set target to missing value
    repeat with m in messages of mb
        set toA to ""
        try
            set toA to address of (item 1 of (to recipients of m))
        end try
        ignoring case
            if toA is "{el}" then
                set target to m
                exit repeat
            end if
        end ignoring
    end repeat
    if target is missing value then return "NODRAFT"
    set sj to subject of target
    set ccs to ""
    try
        repeat with c in cc recipients of target
            set ccs to ccs & (address of c) & ","
        end repeat
    end try
    set atts to ""
    try
        repeat with a in mail attachments of target
            set atts to atts & (name of a) & "|"
        end repeat
    end try
    set theC to content of target
    return sj & linefeed & "@@CC@@" & ccs & linefeed & "@@ATT@@" & atts & linefeed & "@@BODY@@" & linefeed & theC
end tell
end timeout''', timeout=90)
    out = r.stdout
    if out.strip() == "NODRAFT" or "@@BODY@@" not in out:
        return None
    head, _, content = out.partition("@@BODY@@\n")
    lines = head.split("\n")
    subj = lines[0]; cc = ""; att = ""
    for ln in lines:
        if ln.startswith("@@CC@@"): cc = ln[len("@@CC@@"):]
        if ln.startswith("@@ATT@@"): att = ln[len("@@ATT@@"):]
    return {"subject": subj,
            "cc": [a.strip() for a in cc.split(",") if "@" in a],
            "att_names": [a for a in att.split("|") if a.strip()],
            "content": content.rstrip("\n")}

def build_and_send(d, to_email):
    Path(BODYTMP).write_text(d["content"])
    cc_block = "\n        ".join(
        f'make new cc recipient at end of cc recipients with properties {{address:"{aps(a)}"}}' for a in d["cc"])
    atts = []
    for nm in d["att_names"]:
        if "RP" in nm: atts.append(f'make new attachment with properties {{file name:POSIX file "{RP}"}} at after last paragraph')
        elif "CV" in nm: atts.append(f'make new attachment with properties {{file name:POSIX file "{CV}"}} at after last paragraph')
    content_block = ("tell content\n            " + "\n            ".join(atts) + "\n        end tell") if atts else ""
    script = f'''
with timeout of 90 seconds
set bodyText to (read (POSIX file "{BODYTMP}") as «class utf8»)
tell application "Mail"
    set msg to make new outgoing message with properties {{sender:"{aps(SENDER)}", subject:"{aps(d["subject"])}", content:bodyText, visible:false}}
    tell msg
        make new to recipient at end of to recipients with properties {{address:"{aps(to_email)}"}}
        {cc_block}
        {content_block}
    end tell
    delay 4
    send msg
    return "OK"
end tell
end timeout'''
    return osa(script, timeout=110)

def verify_and_readback(email, subj):
    sj = aps(subj); el = aps(email)
    for _ in range(12):  # ~60s
        time.sleep(5)
        r = osa(f'''
with timeout of 30 seconds
tell application "Mail"
    set acct to account "{aps(ACCT)}"{SENT_CLAUSE}
    if smb is missing value then return "NOSENT"
    repeat with m in (messages of smb whose subject is "{sj}")
        try
            if (address of (item 1 of (to recipients of m))) is "{el}" then
                set ac to 0
                try
                    set ac to count of mail attachments of m
                end try
                set hasq to "n"
                try
                    if (content of m) contains (linefeed & ">") then set hasq to "y"
                end try
                return "YES|" & ac & "|" & hasq
            end if
        end try
    end repeat
    return "NO"
end tell
end timeout''', timeout=40)
        o = r.stdout.strip()
        if o.startswith("YES"):
            _, ac, hq = o.split("|"); return True, int(ac), (hq == "y")
    return False, -1, False

def delete_drafts(email):
    el = aps(email)
    r = osa(f'''
with timeout of 60 seconds
tell application "Mail"
    set mb to mailbox "Drafts" of account "{aps(ACCT)}"
    set ids to {{}}
    repeat with m in messages of mb
        set toA to ""
        try
            set toA to address of (item 1 of (to recipients of m))
        end try
        ignoring case
            if toA is "{el}" then set end of ids to (id of m)
        end ignoring
    end repeat
    set k to 0
    repeat with theId in ids
        try
            delete (first message of mb whose id is theId)
            set k to k + 1
        end try
    end repeat
    return k as string
end tell
end timeout''', timeout=70)
    return r.stdout.strip()

def main():
    args = sys.argv[1:]; pace = 25
    if "--pace" in args:
        i = args.index("--pace"); pace = int(args[i+1]); del args[i:i+2]
    emails = [e.strip() for e in args[0].split(",") if e.strip()]
    if STOP.exists():
        print(f"STOP present: {STOP.read_text().strip()} — rm it to resume."); sys.exit(2)

    sent_ok = 0
    for idx, e in enumerate(emails):
        tag = f"[{idx+1}/{len(emails)}]"
        d = read_draft(e)
        if d is None:
            print(f"{tag} SKIP {e} — no draft in Drafts (already sent/deleted)"); continue
        if already_sent(e, d["subject"]):
            dn = delete_drafts(e)
            print(f"{tag} SKIP {e} — already sent (recipient+subject in Sent; cleaned {dn} draft)"); continue
        ob = outbox_count()
        if ob != 0:
            STOP.write_text(f"pre-send Outbox={ob} before {e}")
            print(f"{tag} 🔴 STOP — Outbox={ob} before {e} (SMTP/proxy stuck). Halting."); sys.exit(2)
        want = len(d["att_names"])
        r = build_and_send(d, e)
        if "OK" not in r.stdout:
            print(f"{tag} ❌ {e} — send error: {r.stderr.strip()[:100]}"); sys.exit(1)
        ok, ac, hasq = verify_and_readback(e, d["subject"])
        if not ok:
            ob2 = outbox_count()
            STOP.write_text(f"post-send unverified {e} Outbox={ob2}")
            print(f"{tag} 🔴 STOP — {e} not in Sent after 60s, Outbox={ob2}. Halting (proxy?)."); sys.exit(2)
        with open(LEDGER, "a") as fp: fp.write(e.lower() + "\n")
        dn = delete_drafts(e)
        fid = "✅" if ac == want else f"⚠️att {ac}≠{want}"
        sent_ok += 1
        print(f"{tag} SENT {e} | {d['subject'][:50]} | att={ac}/want{want} quote={'y' if hasq else 'n'} {fid} | drafts-del={dn}", flush=True)
        if idx != len(emails) - 1: time.sleep(pace)
    print(f"=== batch done: {sent_ok} sent ===")

if __name__ == "__main__":
    main()
