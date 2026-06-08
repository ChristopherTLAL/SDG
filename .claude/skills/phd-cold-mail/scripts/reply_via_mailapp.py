import subprocess, time, re
ACCT="潘喆"; SENDER="Zhe Pan <wenansamascholar@gmail.com>"
def osa(s,t=120): return subprocess.run(["osascript","-e",s],capture_output=True,text=True,timeout=t)
def aps(s): return s.replace("\\","\\\\").replace('"','\\"')

def latest_reply(email):
    el=aps(email)
    s=f'''
with timeout of 90 seconds
tell application "Mail"
    set ib to mailbox "INBOX" of account "{aps(ACCT)}"
    set latest to missing value
    set latestD to missing value
    repeat with m in messages of ib
        try
            if (extract address from (sender of m)) is "{el}" then
                if latest is missing value or (date received of m) > latestD then
                    set latest to m
                    set latestD to (date received of m)
                end if
            end if
        end try
    end repeat
    if latest is missing value then return "NONE"
    return (subject of latest) & "|||SPLIT|||" & (content of latest)
end tell
end timeout'''
    r=osa(s,120).stdout.strip()
    if r=="NONE" or "|||SPLIT|||" not in r: return None
    subj,content=r.split("|||SPLIT|||",1)
    low=subj.lower().lstrip()
    re_subj=subj if low.startswith(("re:","sv:","aw:","re :","答复:","回复:")) else "Re: "+subj
    quoted="\n".join("> "+ln for ln in content.split("\n"))
    return re_subj, "\n\n\n\n"+quoted

def make_reply(email, body):
    nq=latest_reply(email)
    if nq is None: return f"NOORIG {email}"
    re_subj, quote = nq
    full=body.rstrip()+quote
    open("/tmp/_draft_body.txt","w").write(full)
    s=f'''
with timeout of 90 seconds
set bodyText to (read (POSIX file "/tmp/_draft_body.txt") as «class utf8»)
tell application "Mail"
    set newMsg to make new outgoing message with properties {{sender:"{aps(SENDER)}", subject:"{aps(re_subj)}", content:bodyText, visible:false}}
    tell newMsg
        make new to recipient at end of to recipients with properties {{address:"{aps(email)}"}}
    end tell
    delay 1
    save newMsg
    return "OK"
end tell
end timeout'''
    r=osa(s,100)
    return f"{'✅' if 'OK' in r.stdout else '❌'} {email} | {re_subj[:55]}"

REPLIES = {
"p.upreti@qub.ac.uk": """Dear Dr. Upreti,

Thank you for the quick and candid reply, and for the kind words about the project. To answer your question directly: I am concentrating my applications on positions that come with funding, so given that QUB does not have PhD funding available at the moment, I do not think it would be right to take up more of your time at this stage. I am grateful for your openness, and I will keep following your work on IP in international investment and the post-pandemic IP order with interest.

With best wishes,
Zhe Pan""",

"asa.bhl@cbs.dk": """Dear Professor Savin,

Thank you, that is genuinely helpful, and I am glad to hear there are open positions. I have looked at the CBS call and intend to apply. One question before I submit: are the posts tied to predefined topics, or is there room to propose a project on the sui generis database right for AI training data? I ask because your earlier note mentioned that advertisements are sometimes title-specific, and I want to frame the proposal so it sits well with both the call and your dataset-law work.

Thank you again for pointing me to it.

Best regards,
Zhe Pan""",

"cgeiger@luiss.it": """Dear Professor Geiger,

Thank you for the encouraging words, and for letting me know about the timing. I will prepare an application for the next LUISS call around March or April, and I would be glad to keep you updated as the dissertation develops in the meantime. Your statutory remuneration argument is one I expect to engage with closely as the work matures.

With kind regards,
Zhe Pan""",

"frantzeska.papadopoulou@juridicum.su.se": """Dear Professor Papadopoulou Skarp,

Thank you for the kind reply and for the clear pointer to the timing. I will prepare an application for the March call and aim to have the strongest possible proposal ready by then. I appreciate you taking the time, and I look forward to the possibility of developing this work at Stockholm.

Best regards,
Zhe Pan""",

"liliia.oprysk@uib.no": """Dear Dr. Oprysk,

Thank you for the reply and for pointing me to the current call. I will follow your suggestion and check with hrjur@uib.no about eligibility before I apply. I appreciate your openness, and I hope to be able to put together a strong application.

Best regards,
Zhe Pan""",

"d.clifford1@lse.ac.uk": """Dear Dr. Clifford,

Thank you for the reply and for explaining how the LSE process works. I will prepare an application for the general call later this year. I appreciate you taking the time, and I hope the proposal will be a good fit for the panel.

Best regards,
Zhe Pan""",

"mivevi@utu.fi": """Dear Professor Viljanen,

Thank you for the generous reply, and for taking the project seriously enough to point me in the right direction. I have in fact already written to Professor Mylly and Dr. Vesala, so it is encouraging to hear you suggest them. I am grateful both for your candour about fit and for the careful reading of the argument.

With kind regards,
Zhe Pan""",

"a.fiske@tum.de": """Dear Dr. Fiske,

Thank you for the quick reply, and there is no need to apologise. I appreciate you letting me know, and I will keep following your work on embedded ethics.

With best wishes,
Zhe Pan""",

"liane.colonna@juridicum.su.se": """Dear Professor Colonna,

Thank you for the reply, and for the kind words. I understand completely, and I will keep an eye on your LinkedIn for any future openings.

With best wishes,
Zhe Pan""",

"katja.devries@jur.uu.se": """Dear Professor de Vries,

Thank you for the reply, and for taking the time to read the proposal. I understand, and I appreciate the encouragement. I hope our paths cross as the field develops.

With best wishes,
Zhe Pan""",
}
# em-dash guard
for e,b in REPLIES.items():
    assert '—' not in b and '–' not in b, f"em-dash in {e}"
print(f"creating {len(REPLIES)} reply drafts...")
for e,b in REPLIES.items():
    print("  "+make_reply(e,b)); time.sleep(2)
