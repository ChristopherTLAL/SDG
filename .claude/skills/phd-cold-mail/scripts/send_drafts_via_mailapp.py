import subprocess, time
ACCT="潘喆"; SENDER="Zhe Pan <wenansamascholar@gmail.com>"
def osa(s,t=120): return subprocess.run(["osascript","-e",s],capture_output=True,text=True,timeout=t)
def aps(s): return s.replace("\\","\\\\").replace('"','\\"')

# 1) metadata list (id|||subject|||to) — safe to parse
meta=osa(f'''tell application "Mail"
    set mb to mailbox "Drafts" of account "{aps(ACCT)}"
    set out to ""
    repeat with m in messages of mb
        set t to ""
        try
            set t to address of (item 1 of (to recipients of m))
        end try
        set out to out & (id of m) & "|||" & (subject of m) & "|||" & t & linefeed
    end repeat
    return out
end tell''',60).stdout
rows=[ln.split("|||") for ln in meta.splitlines() if ln.count("|||")>=2]
print(f"to send: {len(rows)}")
sent=0
for did, subj, to in rows:
    did=did.strip(); to=to.strip()
    # read this draft's content -> file
    c=osa(f'tell application "Mail" to return (content of (first message of (mailbox "Drafts" of account "{aps(ACCT)}") whose id is {did}))',60)
    open("/tmp/_reply_body.txt","w").write(c.stdout.rstrip("\n"))
    # build fresh outgoing msg from that content + send + delete the staged draft
    r=osa(f'''with timeout of 60 seconds
set bodyText to (read (POSIX file "/tmp/_reply_body.txt") as «class utf8»)
tell application "Mail"
    set msg to make new outgoing message with properties {{sender:"{aps(SENDER)}", subject:"{aps(subj)}", content:bodyText, visible:false}}
    tell msg
        make new to recipient at end of to recipients with properties {{address:"{aps(to)}"}}
    end tell
    send msg
    try
        delete (first message of (mailbox "Drafts" of account "{aps(ACCT)}") whose id is {did})
    end try
    return "SENT"
end tell
end timeout''',70)
    ok = "SENT" in r.stdout
    if ok: sent+=1
    print(f"  {'✅ SENT' if ok else '❌ '+r.stderr.strip()[:50]} → {to}")
    # outbox drain (circuit breaker)
    stuck=True
    for _ in range(12):
        time.sleep(3)
        ob=osa('tell application "Mail" to return (count of messages of mailbox "Outbox")',20).stdout.strip()
        if ob=="0": stuck=False; break
    if stuck: print(f"  🛑 OUTBOX STUCK after {to} — halting"); break
    time.sleep(8)
d=osa(f'tell application "Mail" to return (count of messages of (mailbox "Drafts" of account "{aps(ACCT)}"))',20).stdout.strip()
ob=osa('tell application "Mail" to return (count of messages of mailbox "Outbox")',20).stdout.strip()
print(f"\nsent {sent}/{len(rows)} | final Drafts:{d} Outbox:{ob}")
