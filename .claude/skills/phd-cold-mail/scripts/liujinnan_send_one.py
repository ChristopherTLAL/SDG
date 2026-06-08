#!/usr/bin/env python3
"""Send EXACTLY ONE next-unsent cold-mail draft for 刘锦楠 — hardened v3.

Post-mortem (2026-05-31): an unattended loop re-sent draft 001 (zgw@caltech.edu)
27 times, piling 37 identical copies in Outbox. Three compounding bugs + a proxy:
  (A) ledger lived in /tmp -> wiped on reboot -> script thought nothing was sent.
  (B) sent-mailbox name hardcoded "已发送"/"Sent" but the real Exchange name is
      "已发送邮件" -> verify query ALWAYS failed -> 001 re-picked forever.
  (C) Outbox backlog (the script PRINTED Outbox=11..37) was treated as a per-mail
      "FAILED, keep draft, retry next round" instead of a GLOBAL circuit-break.
  (+) 松果 proxy (SOCKS 127.0.0.1:7892) ate SMTP -> every send stuck in Outbox.

Hardening here:
  1. Persistent ledger at ~/.liujinnan_send/sent.txt, REBUILT from the real Sent
     mailbox every run (self-heals if the file is lost). Survives reboot.
  2. Sent mailbox found DYNAMICALLY (name contains 发送 or Sent) — never hardcoded.
  3. CIRCUIT BREAKER:
       - pre-send: if Outbox already > 0 -> touch STOP + abort (don't pile on).
       - post-send: if not in Sent AND Outbox > 0 -> touch STOP + abort (SMTP/proxy
         is broken; do NOT retry, do NOT keep looping).
       - consecutive-unconfirmed counter; >= MAX_CONSEC -> touch STOP permanently.
Exit codes: 0 ok/ALL_SENT · 1 soft-fail (draft kept) · 2 GLOBAL STOP · 3 Mail dead.
"""
import json, subprocess, sys, time
from pathlib import Path

base = Path("/Users/shijie/Obsidian/规划看板/01_Student/刘锦楠/个性化材料/PhD套磁/邮件草稿/")
RP = "/Users/shijie/Obsidian/规划看板/01_Student/刘锦楠/文书材料/Liu Jinnan_RP_260525.docx"
CV = "/Users/shijie/Obsidian/规划看板/01_Student/刘锦楠/文书材料/Liu Jinnan_CV_260525.pdf"
ACCT = "B. 学生 - 刘锦楠"

STATE = Path.home() / ".liujinnan_send"
STATE.mkdir(exist_ok=True)
LEDGER = STATE / "sent.txt"
CONSEC = STATE / "consecutive_fail"          # persisted consecutive-unconfirmed count
STOP = Path("/tmp/liujinnan_send.STOP")
MAX_CONSEC = 2                                # >= this many in a row -> permanent STOP

def aps(s):
    return s.replace("\\", "\\\\").replace('"', '\\"')

def osa(script, timeout=60):
    return subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=timeout)

def read_consec():
    try:
        return int(CONSEC.read_text().strip())
    except Exception:
        return 0

def write_consec(n):
    CONSEC.write_text(str(n))

def trip_stop(reason):
    STOP.write_text(reason + "\n")

def outbox_count():
    r = osa('tell application "Mail"\n try\n  return (count of messages of mailbox "Outbox") as text\n on error\n  try\n   return (count of messages of mailbox "发件箱") as text\n  on error\n   return "0"\n  end try\n end try\nend tell', timeout=30)
    try:
        return int(r.stdout.strip())
    except Exception:
        return 0

# ---- 0. Mail.app health ping (20s) -> exit 3 lets wrapper restart Mail ----
try:
    ping = osa('tell application "Mail" to return (name of account 1)', timeout=20)
    if ping.returncode != 0:
        print(f"FAILED - - | Mail.app unresponsive: {ping.stderr.strip()[:80]}")
        sys.exit(3)
except subprocess.TimeoutExpired:
    print("FAILED - - | Mail.app ping timeout (needs restart)")
    sys.exit(3)

# ---- 1. dynamic Sent-mailbox name ----
mb_r = osa(f'''
tell application "Mail"
    set acct to account "{aps(ACCT)}"
    repeat with mb in (mailboxes of acct)
        set nm to name of mb
        if (nm contains "发送") or (nm contains "Sent") then return nm
    end repeat
    return "NONE"
end tell
''', timeout=40)
SENT_MB = mb_r.stdout.strip()
if SENT_MB in ("", "NONE") or mb_r.returncode != 0:
    print(f"FAILED - - | cannot locate Sent mailbox ({mb_r.stderr.strip()[:60]})")
    sys.exit(1)

# ---- 2. rebuild ledger = persistent file ∪ live Sent recipients (self-heal) ----
ledger = set()
if LEDGER.exists():
    ledger |= {ln.strip().lower() for ln in LEDGER.read_text().splitlines() if "@" in ln}
sent_live = osa(f'''
tell application "Mail"
    set acct to account "{aps(ACCT)}"
    set sm to mailbox "{aps(SENT_MB)}" of acct
    set out to ""
    repeat with m in (messages of sm)
        try
            repeat with rcp in (to recipients of m)
                set out to out & (address of rcp) & linefeed
            end repeat
        end try
    end repeat
    return out
end tell
''', timeout=90)
if sent_live.returncode == 0:
    ledger |= {ln.strip().lower() for ln in sent_live.stdout.splitlines() if "@" in ln}
LEDGER.write_text("\n".join(sorted(ledger)) + "\n")

# ---- 3a. PRE-SEND circuit breaker: Outbox must be empty ----
ob = outbox_count()
if ob > 0:
    trip_stop(f"pre-send Outbox backlog={ob} (SMTP/proxy stuck) @startup")
    print(f"STOP pre-send | Outbox={ob} not empty -> SMTP/proxy stuck; touched STOP, aborting")
    sys.exit(2)

# ---- 4. pick next unsent (ANY address in ledger => already contacted) ----
files = sorted([f for f in base.glob("*.json") if f.name != "MANIFEST.json"])
remaining = []
nxt = None
for f in files:
    rec = json.load(open(f))
    addrs = [a.strip().lower() for a in rec["contact"]["email"].split(",") if "@" in a]
    if addrs and any(a in ledger for a in addrs):
        continue
    remaining.append(f)
    if nxt is None:
        nxt = (f, rec)

if nxt is None:
    write_consec(0)
    print("ALL_SENT")
    sys.exit(0)

f, rec = nxt
rid = rec["id"]
name = rec["supervisor"]["name"]
to_field = rec["contact"]["email"].strip()
addrs = [a.strip() for a in to_field.split(",") if "@" in a]
subj = rec["email"]["subject"]
body = rec["email"]["body"] + "\n\n" + rec["email"].get("signature", "")
n_remaining_before = len(remaining)

# ---- 5. send fresh outgoing message ----
to_block = "\n        ".join(
    f'make new to recipient at end of to recipients with properties {{address:"{a}"}}'
    for a in addrs
)
send_script = f'''
tell application "Mail"
    set msg to make new outgoing message with properties {{¬
        sender:"Jinnan Liu <cpusuda@outlook.com>", ¬
        subject:"{aps(subj)}", ¬
        content:"{aps(body)}", ¬
        visible:false ¬
    }}
    tell msg
        {to_block}
        tell content
            make new attachment with properties {{file name:POSIX file "{RP}"}} at after last paragraph
            make new attachment with properties {{file name:POSIX file "{CV}"}} at after last paragraph
        end tell
    end tell
    delay 6
    send msg
end tell
return "OK"
'''
try:
    sr = osa(send_script, timeout=120)
except subprocess.TimeoutExpired:
    c = read_consec() + 1; write_consec(c)
    if c >= MAX_CONSEC:
        trip_stop(f"send timeout x{c} on {rid}")
    print(f"FAILED {rid} {addrs[0]} | send osascript timeout (consec={c})")
    sys.exit(2 if c >= MAX_CONSEC else 1)
if "OK" not in sr.stdout:
    c = read_consec() + 1; write_consec(c)
    if c >= MAX_CONSEC:
        trip_stop(f"send err x{c} on {rid}: {sr.stderr.strip()[:60]}")
    print(f"FAILED {rid} {addrs[0]} | {sr.stderr.strip()[:120]} (consec={c})")
    sys.exit(2 if c >= MAX_CONSEC else 1)

# ---- 6. verify it landed in the CORRECT Sent mailbox (poll ~70s) ----
verify_script = f'''
tell application "Mail"
    set acct to account "{aps(ACCT)}"
    set sm to mailbox "{aps(SENT_MB)}" of acct
    try
        if (count of (messages of sm whose subject is "{aps(subj)}")) > 0 then return "VERIFIED"
    end try
    return "NO"
end tell
'''
verified = False
for _ in range(8):       # 8 x 9s ≈ 72s
    time.sleep(9)
    try:
        vr = osa(verify_script, timeout=45)
    except subprocess.TimeoutExpired:
        continue
    if "VERIFIED" in vr.stdout:
        verified = True
        break

# ---- 7. post-send circuit breaker ----
if not verified:
    ob2 = outbox_count()
    c = read_consec() + 1; write_consec(c)
    # Outbox backlog after a send == SMTP/proxy broken -> GLOBAL STOP immediately.
    if ob2 > 0 or c >= MAX_CONSEC:
        trip_stop(f"post-send unconfirmed: {rid} not in Sent, Outbox={ob2}, consec={c}")
        print(f"STOP {rid} {addrs[0]} | not in Sent, Outbox={ob2}, consec={c} -> touched STOP, halting (SMTP/proxy/WASCL)")
        sys.exit(2)
    print(f"FAILED {rid} {addrs[0]} | not in Sent (Outbox=0, consec={c}); draft kept, will retry guarded")
    sys.exit(1)

# ---- 8. verified -> reset counter, append ledger, delete stale draft ----
write_consec(0)
with open(LEDGER, "a") as fp:
    for a in addrs:
        fp.write(a.lower() + "\n")
del_script = f'''
tell application "Mail"
    set acct to account "{aps(ACCT)}"
    set d to mailbox "草稿" of acct
    set ids to {{}}
    repeat with m in (messages of d)
        try
            if (address of item 1 of to recipients of m) is "{aps(addrs[0])}" then set end of ids to (id of m)
        end try
    end repeat
    set k to 0
    repeat with mid in ids
        try
            delete (first message of d whose id is mid)
            set k to k + 1
        end try
    end repeat
    return "deleted " & k
end tell
'''
try:
    deln = osa(del_script, timeout=60).stdout.strip()
except subprocess.TimeoutExpired:
    deln = "delete-timeout(harmless)"
print(f"SENT {rid} {addrs[0]} | {name} | draft-{deln} | REMAINING {n_remaining_before - 1}")
sys.exit(0)
