#!/usr/bin/env python3
# ============================================================================
# reconcile_sends.py — after each send batch, reconcile ledger × Drafts × Sent.
# Catches MISSING (Mail silently dropped a draft → recreate+resend), leftover
# strays (draft to an already-sent recipient → --clean removes), dupes/not-active;
# emits a warm-first remaining-to-send todo. NEVER skip between batches — this is
# the safety net that gave 0 silent loss across 87 sends (Lesson 18).
# PARAMETERIZE: ACCT, MANIFEST, LEDGER.
# ============================================================================
"""Reconcile 潘喆 Drafts vs (active manifest − ledger of sent). Reports + cleans
leftover-to-sent strays; lists any MISSING (expected but absent) for recreate."""
import json, subprocess, sys
from pathlib import Path
LED=Path.home()/".panzhe_send"/"sent.txt"
man=json.load(open('/tmp/panzhe_manifest.json'))
active={x['email'].lower() for x in man if not x.get('paused')}
sent={l.strip().lower() for l in LED.read_text().splitlines() if '@' in l} if LED.exists() else set()
r=subprocess.run(['osascript','-e','with timeout of 60 seconds\ntell application "Mail"\nset mb to mailbox "Drafts" of account "潘喆"\nset out to ""\nrepeat with m in messages of mb\nset toA to ""\ntry\nset toA to address of (item 1 of (to recipients of m))\nend try\nset out to out & toA & linefeed\nend repeat\nreturn out\nend tell\nend timeout'],capture_output=True,text=True,timeout=90)
cur=[l.strip().lower() for l in r.stdout.splitlines() if '@' in l]
curset=set(cur)
expected=active-sent
missing=sorted(expected-curset)
leftover=sorted(curset & sent)        # drafts to already-sent recipient
notactive=sorted(curset-active)
dupes=sorted({e for e in curset if cur.count(e)>1})
print(f"active:{len(active)} sent(ledger):{len(sent)} expected-drafts:{len(expected)} | current-drafts:{len(cur)}(distinct {len(curset)})")
print(f"MISSING(recreate): {missing or 'none'}")
print(f"leftover-to-sent: {leftover or 'none'}")
print(f"not-active: {notactive or 'none'}  dupes: {dupes or 'none'}")
if '--clean' in sys.argv and leftover:
    for e in leftover:
        s='tell application "Mail"\nset mb to mailbox "Drafts" of account "潘喆"\nset ids to {}\nrepeat with m in messages of mb\nset t to ""\ntry\nset t to address of (item 1 of (to recipients of m))\nend try\nignoring case\nif t is "%s" then set end of ids to (id of m)\nend ignoring\nend repeat\nrepeat with i in ids\ntry\ndelete (first message of mb whose id is i)\nend try\nend repeat\nreturn "ok"\nend tell'%e
        subprocess.run(['osascript','-e',s],capture_output=True,text=True,timeout=60)
    print(f"cleaned {len(leftover)} leftover-to-sent")
# emit remaining-to-send (expected minus what's missing, i.e. present drafts not yet sent), warm-first
pri={'reply':0,'followup':1,'cold':2}
byemail={x['email'].lower():x for x in man}
todo=sorted([e for e in (expected & curset)], key=lambda e:(pri.get(byemail[e]['variant'],3), e))
open('/tmp/panzhe_todo.txt','w').write(",".join(todo))
print(f"\nremaining-to-send (in Drafts, not yet sent): {len(todo)}  → /tmp/panzhe_todo.txt")
