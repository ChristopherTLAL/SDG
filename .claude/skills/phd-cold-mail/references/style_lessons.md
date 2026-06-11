# Style lessons — accumulated from past runs

> Append-only file. New lessons go on top with date + student-batch context. Drafting prompts (`email_prompt.md`, `end_to_end_prompt.md`) reference this file via inline lessons so each new run benefits.

---

## 2026-06-02 · 刘锦楠 — Lesson 13: outlook.com consumer accounts have a ~20/day send cap; the "ban" was never a ban

**What it actually was**: after sending 21 cold emails in a day, outlook.com blocked the 22nd and emailed the account: *"Outlook.com has blocked your message — The daily message limit helps us free the world from spammers."* This is a **soft daily quota**, not a suspension, not a WASCL reputation ban, not a geography flag. The whole multi-day "被封" saga was, at its core, (a) the 松果 SOCKS proxy eating SMTP on 5/31, and (b) this daily-limit on 6/2.

**The number**: this consumer outlook.com account caps at **~20 recipient-messages/day** (newer / low-reputation accounts get a low cap; established ones get up to ~300/day). Hitting it produces the block email + the message stuck in Outbox (never reaches Sent).

**Operational rule for bulk cold-mail from outlook.com**:
- Budget **≤18 sends/day** and spread over as many days as needed (132 emails ≈ 5–7 days). Add a `MAX` daily-quota arg to the sender loop (`liujinnan_send_continuous.sh 90 60 18`) so it stops cleanly before the block.
- The limit is roughly a rolling 24h window — resume ~24h after the last block, not just "next morning."
- Deliverability was fine throughout (3 professors replied within a day), so the cap is the ONLY real constraint once the proxy is off and sending from the account's home region.
- The Outbox circuit breaker (Lesson 12) catches the block correctly: the blocked message sits in Outbox → breaker trips STOP at 1, zero duplicates. This is the payoff of Lesson 12's fix.

**Don't misdiagnose again**: a send that doesn't reach Sent + an Outbox item + a "blocked your message / daily limit" inbox email = quota, wait a day. It is NOT a ban and does NOT need account recovery/verification.

## 2026-06-05 · 刘锦楠 — Lesson 13: a paused launchd agent RESURRECTS on reboot; /tmp kill-switches get wiped

**What happened**: after the 37-dupe incident the send loop was "paused" by (a) `touch /tmp/liujinnan_send.STOP` and (b) `launchctl unload` the agent. Both were defeated by a reboot:
1. **`/tmp` is wiped on macOS reboot** → the STOP kill-switch file vanished → the wrapper's `if [ -f STOP ]` guard no longer fired.
2. **`launchctl unload` does NOT persist across reboot** → at login, launchd re-reads `~/Library/LaunchAgents/*.plist` and auto-loads every agent there (unless `Disabled`). The send agent came back from the dead and resumed firing every 15 min.

Result: after the user rebooted, the agent quietly sent 5 cold mails (u024-u028) unsupervised over ~70 min. No real harm this time (all were legit shortlist recipients, no dupes, China-direct so they delivered), but it was exactly the "autopilot when the human wanted control" failure we'd sworn off.

**The reboot-proof way to disable a launchd agent**:
- `launchctl unload` alone is NOT enough. Either:
  - **Rename/move the plist** out of `~/Library/LaunchAgents` (e.g. `mv …plist …plist.DISABLED`) so launchd can't find it at boot, OR
  - `launchctl disable gui/$(id -u)/<label>` (persists a disabled flag), OR
  - add `<key>Disabled</key><true/>` to the plist.
- Put any kill-switch / state file in a **persistent** dir (`~/.something/`), never `/tmp` (wiped on reboot — same root cause as the ledger loss in Lesson 12).

**Standing decision for this campaign**: no unattended launchd autopilot for sending. Supervised batches only (`liujinnan_send_batch.sh`, human watching), so a reboot can never silently resume a blast.

## 2026-05-31 · 刘锦楠 — Lesson 12: an unattended send-loop MUST circuit-break on Outbox backlog (37-dupe incident)

**What happened**: the launchd auto-send loop re-sent draft 001 (zgw@caltech.edu, Caltech) **27 times over 8 hours**, piling 37 identical copies in Mail.app's Outbox. Only luck (a proxy blocking SMTP) stopped the professor from receiving 37 emails — they never left the machine. Had the proxy been off, this was a student-reputation disaster.

**Four compounding causes**:
1. **Ledger in `/tmp` wiped on reboot** → script's "what's been sent" memory vanished → it thought nothing was sent → re-picked 001 as "next unsent" every cycle. FIX: persistent ledger at `~/.liujinnan_send/sent.txt`, AND rebuild it from the real Sent mailbox every run (self-heal).
2. **Sent mailbox name hardcoded** as `"已发送"`/`"Sent"`, but the live Exchange name was `"已发送邮件"` → the post-send verify query `messages of mailbox "已发送" whose subject is X` always errored→empty → every send judged "not in Sent" → FAILED→keep draft→retry. FIX: discover the sent mailbox dynamically (`name contains "发送" or "Sent"`), never hardcode.
3. **No circuit breaker on Outbox backlog** — the script literally printed `Outbox=11,12,…37` each cycle but treated it as a *per-mail* failure ("keep draft, try next round") instead of a *global* "SMTP is down, HALT everything" signal. FIX: post-send, if the mail isn't in Sent AND Outbox>0 → `touch STOP` + exit immediately. Pre-send, if Outbox already >0 → refuse to send. Consecutive-unconfirmed counter ≥2 → permanent STOP.
4. **System proxy (松果加速器, SOCKS 127.0.0.1:7892) blackholed SMTP** → every `send msg` queued to Outbox and never transmitted. FIX: wrapper pre-flight detects an active :7892 proxy via `scutil --proxy` and refuses to send (touch STOP) while it's on.

**Hard rules for any future auto-send loop** (codified in `liujinnan_send_one.py` v3 + `liujinnan_send_loop.sh`):
- Idempotency state must be **persistent** (survive reboot) AND **reconstructable** from the authoritative source (Sent folder), never solely a temp file.
- Never hardcode localized mailbox names; discover them.
- **Outbox backlog is a GLOBAL hard-fault, not a per-message soft-fail.** Stuck mail = STOP, never retry-in-place.
- Pre-flight: refuse to send if (proxy that can break SMTP is active) OR (Outbox already non-empty).
- Cap consecutive unconfirmed sends; trip a permanent STOP.
- For high-stakes recipients (real professors from a real student's account), **prefer supervised/in-session sending over a fully unattended cron/launchd loop** — the blast-radius of a bug is the student's reputation.

**Also**: the log mislabeled every failure as "(likely WASCL)" when the real cause was the proxy. Don't bake a speculative root-cause into log lines — it sent the human chasing a Microsoft ban that didn't exist.

---

## 2026-05-26 · 刘锦楠 R6 — Lesson 11: subject lines must be globally unique case-INSENSITIVELY across the whole batch

**Observation**: During R6 (132 v2 rewrites + Mail.app push for 刘锦楠), Mail.app's IMAP dedup treats subjects case-insensitively but Python `dict` / our audit-by-subject treats them case-sensitively. Three failure modes hit:

1. **Exact match across drafts** (3+ supervisors got identical subjects from Sonnet drafting — e.g. five JSONs ending up with the two generic strings `"... multiscale simulation of stimuli-responsive hydrogels ..."` and `"... multiscale simulation of responsive polymer networks ..."`): Mail.app dedup deletes all but one; we silently lose the others.
2. **Case-only variant**: 010 Carbone had `"... multiscale simulation of stimuli-responsive hydrogels ..."` (lowercase) and u096 Jang had `"... Multiscale Simulation of Stimuli-Responsive Hydrogels ..."` (Title Case). To Python they're distinct; to Mail.app IMAP they collide → Jang got nuked on every push.
3. **Compound with-vs-without a noun**: e.g. `"... hydrogels"` vs `"... hydrogel networks"` were NOT collisions, but only by luck. Subjects that differ by one trailing noun should be considered fragile.

**Fix in skill**:
- `scripts/audit_drafts.py` (or a new `scripts/audit_subjects.py`) should grep all 132 JSON subjects, lowercase + strip them, and fail-loud on any case-insensitive duplicate **before** any Mail.app push starts. Make it a Phase pre-flight check in `end_to_end_prompt.md`.
- During drafting, if two supervisors are at the same institution and work on closely-related topics, the prompt should explicitly diversify the topic noun (e.g. "single-chain simulation" vs "multiscale simulation" vs "DFT and atomistic study"), not just rephrase capitalization.
- Recovery recipe (2026-05-26): when a collision is detected post-push, patch the colliding JSON's subject to something distinctly different (different lead noun, not just lowercase/uppercase variant), then `--only <id>` re-push.

## 2026-05-26 · 刘锦楠 R6 — Lesson 10: Mail.app server-side IMAP keeps "partial-attachment shadows" alive — UNFIXABLE from AppleScript

**Observation**: One draft (u048 Elena Besley, Outlook IMAP backend) ended up with only 1 of 2 attachments. Subsequent state: persistent 2 drafts for that supervisor — one att=2 (the good one we pushed), one att=1 (the original partial that won't die). Tried delete cycles **7+ times** across 3 Mail.app restarts. Every time, within 10 seconds the **partial-att shadow re-syncs from the Outlook server**. The partial reference exists server-side and our local `delete` never propagates as a real IMAP EXPUNGE — Outlook treats it as a no-op or pushes the local state back.

**Also manifests as UI alerts** during background Mail.app sync:
> "The message '<subject>' could not be moved to the mailbox 'X'. The specified object was not found in the store."

That's Mail.app trying to operate on the local cached reference to a server-side draft that the server says doesn't exist (or vice versa).

**No AppleScript-side fix exists.** What was tried and confirmed broken:
- delete by-ID via `delete (first message of draftsMb whose id is msgId)` — succeeds locally, server re-syncs partial within 10s
- delete + push fresh in same osascript session — partial still re-appears
- pkill -9 Mail.app + relaunch + delete — partial still re-appears
- delete then DON'T push (let server forget) — partial still re-appears

**The only reliable fix is server-side**: log into Outlook Web (outlook.com / office.com) → Drafts → manually delete the partial-att draft → Mail.app sync catches up within ~30s.

**Acceptable shipping state**: 131/132 drafts each have exactly one entry with both attachments + 1 supervisor (the broken one) has TWO drafts: pick the att=2 one to send, ignore/delete the att=1 partial during review. Document this for the user in the handoff.

**Skill enhancement**: `audit_drafts.py` should grep for partial-att drafts AND flag the user with "go to Outlook Web for these N supervisors".

## 2026-05-25 · 刘锦楠 — Lesson 9: cover both legacy + current email for relocated profs

**Observation**: Juan de Pablo moved from UChicago PME to NYU Tandon Executive Dean (2024). UChicago email `depablo@uchicago.edu` still forwards; NYU personal email `j.de.pablo@nyu.edu` (verified via NYU CS faculty directory) is his current active address. Best practice for **relocated faculty** (or anyone with a recent move): include BOTH addresses as TO recipients.

**Schema change**: `contact.email` can now be a comma-separated string for multi-recipient cases:
- single: `"depablo@uchicago.edu"`
- multi: `"depablo@uchicago.edu, j.de.pablo@nyu.edu"`

The `scripts/load_to_mail_drafts.py` should be enhanced to split on comma and create multiple `to recipient` entries in the AppleScript.

**When to use multi-recipient**:
- Faculty who moved institutions in past 2-3 years (e.g. de Pablo NYU; check email_source field for "legacy" or institutional discrepancy)
- Joint appointments (e.g. NTU + A*STAR — Loh Xian Jun has `lohxj@imre.a-star.edu.sg` as institutional but probably also has NTU one)
- Faculty with both personal homepage email + institutional directory email

---

## 2026-05-25 · 刘锦楠 batch — Lesson 8: Mail.app bulk push has hard limits

**Observation**: Pushing 132 drafts to macOS Mail.app via AppleScript in one run, with 1.0s rate-limit, **crashed Mail.app**. After restart: only 98 unique emails + 6 partial-attachment drafts (3 zero-att shadows + 3 one-att, where Mail's IMAP sync to Outlook server failed mid-attachment-upload).

**Recovery path** (worth recording as the canonical recipe):

1. **Dump** current drafts via `osascript`: `id|email|att-count` per line, save to /tmp.
2. **Diff** against expected JSONs (`contact.email` field). Identify (a) missing emails, (b) email-present-but-att<2.
3. **Delete by-email** the partials (loop over `messages of draftsMb whose to-recipient address is X`).
4. **Re-push** missing + deleted using `--only "<id1>,<id2>,..."`. Use **rate-limit 2.5-3.0s** (not 1.0s).
5. **DO NOT trust the auto-dedup** — when two drafts have identical subject AND identical max-att-count (e.g. both have 2 attachments), the "keep max-att" tiebreak is non-deterministic and may delete the real one. Skip dedup entirely; clean shadows manually by `att<2 AND has-att=2-sibling-same-email`.
6. Final cleanup: any draft with att=0 that has a sibling (same recipient email) with att≥2 → delete by ID.

**Fix in skill**:
- `scripts/load_to_mail_drafts.py` should be split into 3 modes:
  - `--push-only`: just create drafts, no dedup (safer for bulk)
  - `--dedup-by-email`: smart dedup: keep at most 1 draft per recipient email, preferring max-att, else most-recent ID
  - `--diff`: dump + compare to JSON dir, list missing/partial
- Bulk push of N>30 should chunk into batches of 30 with a 30s pause between batches to let Mail's IMAP sync drain.

**Hard rule**: never push 100+ drafts in one go without pause-and-check between chunks.

---

## 2026-05-24 · 刘锦楠 batch (cont.) — Lesson 7: don't pin STUDENT's tenure year, only ADMISSION year

**Observation**: After R4 post-review, the 132 drafts all said "I am a second-year MSc student" or "I am finishing my MSc" — Sonnet baked the student's tenure into every body. This implies a specific graduation date (mid-2027 for a typical 2-year MSc). User flagged it as a serious issue because:

- 刘锦楠 is a Chinese **学硕** (academic Master's, often 3 years) — graduation may extend to 2028
- If the supervisor reads "second-year MSc" → infers "graduates 2027, starts 2027" → may commit Fall 2027 slot
- Then student's actual graduation slips → awkward retraction or rejection
- **Better**: don't mention HER tenure at all; let her clarify in follow-up / interview

**The distinction that matters**:
- "Fall 2027" referring to **ADMISSION CYCLE** = ✅ KEEP (the target slot the supervisor needs to commit to)
- "second-year MSc" / "finishing my MSc" referring to **STUDENT'S OWN TIMING** = ❌ STRIP (uncertain, may close future options)

**Fix in skill**:
- `references/tenure_neutral_patch_prompt.md` added — Patch 1 strips tenure signals; Patch 2 preserves Fall 2027; Patch 3 verifies ASK still has 4 elements.
- `end_to_end_prompt.md` and `email_prompt.md` should reference this lesson: when student's graduation timing is uncertain (typical for 学硕 / extended programs), include admission target in subject + ASK but NEVER include student's tenure.
- Pre-flight check: ask whether student's graduation date is firm before drafting. If uncertain, run the tenure-neutral patch as standard.

**For future runs**, the prompt-time check: "Is the student's graduation date 100% firm? If no, exclude all tenure language (no 'Nth-year MSc', no 'finishing my MSc', no 'graduating in YYYY'). Keep admission target ('for Fall YYYY')."

---

## 2026-05-24 · 刘锦楠 batch (132 drafts, Sonnet end-to-end, post-review)

### Lesson 1 — Sonnet abuses em-dashes; bake "ZERO em-dash" into the draft prompt

**Observation**: Initial Mode-B run produced 444 em-dashes (`—`) across 132 drafts, median 3 per draft. All 132/132 drafts had at least one. Sonnet uses em-dashes as default parenthetical / explanation / transition separator.

**Why it matters**: User flagged em-dashes as a marker of AI prose. Recipients (academic supervisors) increasingly associate dense em-dash use with LLM-generated cold emails, hurting reply rate.

**Fix in skill**:
- `end_to_end_prompt.md` Phase G final-draft critique MUST include: `body.count("—") + body.count("–") == 0`. If non-zero, rewrite the offending sentence using commas (parenthetical) / parentheses (mid-clause aside) / colon (transition) / period (subordinate clause becomes new sentence).
- Subject line is allowed to keep em-dashes (template uses them as separators); body cannot.

**Patch script available**: `scripts/normalize_drafts.py` + `scripts/patch_drafts.py` (via subagent batch) for catching residuals.

### Lesson 2 — n8n's "para 4" is 4 distinct ASK elements that Sonnet collapses

**Observation**: Original n8n cold-mail prompt's point 4 explicitly says:

> Ask politely if there are any PhD-student slots available (fine for self-funding), and if it's possible to hold a brief online meeting. If not, can they introduce a suitable supervisor based on their expert evaluation.

This expands to 4 ask elements:
- (a) PhD slot ask for Fall 2027
- (b) **Brief online meeting** (15-25 min Zoom)
- (c) **Self-funding / CSC** option mention
- (d) Attachments (CV + RP)

Initial Sonnet run coverage: (a) ~100%, (b) **50%**, (c) **4%**, (d) 59%. Major drift on b/c.

**Fix in skill**:
- Phase D (outline) of `end_to_end_prompt.md` makes para 4 explicitly a checklist of (a/b/c/d).
- Phase G self-critique includes "para 4 contains all 4 elements?" check.

### Lesson 3 — DROP the n8n "recommend a colleague" fallback for mass batches

**Observation**: n8n original includes a fallback "If not, can they introduce a suitable supervisor". For small batches (5-10), this is fine. For mass batches (30+), this creates **mass-mailing-detection risk**: if 4 UPenn profs each receive an email asking "if you can't, can you recommend someone in this area?", they may compare notes and infer it's a templated mass mail, hurting the student's reputation.

**Fix in skill**:
- For batches > 20: drop the fallback ask entirely.
- For small focused batches: include it (it's good for getting referrals).
- The end_to_end_prompt.md default config drops it (batches are typically full shortlists).

### Lesson 4 — PII redaction trap on Write tool can mask emails as `[email protected]`

**Observation**: 3/132 subagents wrote literal `[email protected]` (markdown autolink placeholder) into the JSON's `email` field instead of the real email like `tfm@caltech.edu`. The platform's PII redaction silently transformed the Write tool input. The drafts looked complete but the email was useless.

**Fix in skill**:
- `email_hunt_prompt.md` and `end_to_end_prompt.md` explicitly warn: "NEVER write `[email protected]` placeholder. If the platform tries to render your email as placeholder for display, write the real characters anyway."
- `scripts/verify_emails.py` catches the trap by greppping for the literal `[email protected]` and flagging as failed.

### Lesson 5 — Pattern-inferred emails are NOT confirmed (12.5% wrong rate)

**Observation** (from Phase 2.5 audit of the same 132): When verifier couldn't grep the email on `research.links` pages, 24 drafts were marked "pattern-plausible" (domain matches institution's pattern). Of those 24, paper-PDF deep hunt caught **3 wrong (12.5%)**: Marenduzzo, Yethiraj, Hu Jinlian — all had Sonnet pattern-guesses that didn't match the actual verified email.

**Fix in skill**:
- Phase 2.5 in `SKILL.md` enforces: every "pattern-plausible" email MUST be escalated to paper-PDF hunt before being marked confirmed.
- `email_hunt_prompt.md` makes paper-PDF channel mandatory before falling back to ORCID/ResearchGate.

### Lesson 6 — Sonnet sometimes catches errors in upstream Excel (good!)

**Observation**: Subagents auto-flagged: ★2 Juan de Pablo had moved from UChicago to NYU Tandon (Excel was stale); u092 was actually Claudia Loebel not Elise Loebel (Excel typo). These corrections were valuable.

**Fix in skill**:
- Keep the disambiguation check in `end_to_end_prompt.md` Step 3.
- Auto-update Excel via separate user-confirmation flow (don't trust subagent to write Excel unilaterally — already happened that the user approved both corrections after independent WebFetch).

---

## Hard rules (codified in prompts)

These are the non-negotiable rules every drafting subagent must enforce. Quoted in `email_prompt.md` and `end_to_end_prompt.md`.

1. **Zero em-dashes in body**: `body.count("—") + body.count("–") == 0`. Subject can keep em-dashes (template uses them).
2. **Para 4 must include**: (a) Fall 2027 slot ask + (b) 15-25 min Zoom meeting ask + (c) CSC/self-funding mention + (d) attachments line. NO "recommend a colleague" fallback for batches > 20.
3. **Email must have URL/PDF source**: `contact.email_confirmed=true` requires `contact.email_source` to be a URL or paper-PDF reference, not empty and not "pattern-inferred".
4. **Never write `[email protected]` placeholder** in any JSON field.
5. **Preserve every paper citation, DOI, method name, dose-response data** from the original draft when applying patches.
6. **No AI tells**: "honored / privilege / grateful / groundbreaking / world-class / cutting-edge / state-of-the-art / I hope this finds you well / I am reaching out".

---

## 2026-06-01 · 潘喆 — Lesson 13: reply-quote 搬运 + 非 "Re:" 回复前缀的坑

**背景**: 潘喆套磁要"接 thread"(followup/reply 类)而非纯新冷邮。用户明确要求"搬运而非语义重写"原邮件 quote。

**验证过的搬运机制**:
- Mail 的 `reply origMsg without opening window` 会生成**原生 quote 草稿**(完整 thread 历史 + From/Date/To/Subject 头,原样字节,比手动拼 `> ` 漂亮)。
- 但 `reply` 返回的对象 id=0(临时),`save` 后引用失效,**不能在 save 前 set content**(丢失),也**不能 save 后 set content**(已落 Drafts 的 message content 只读, -10006)。
- **可行方案**: reply → save(让原生 quote 草稿落 Drafts) → 读出它的 content(纯搬运) → 删掉这个 reply 草稿 → **新建** outgoing message,content = `我的正文 + 搬运的原生quote`(新建 message save 前 content 可写) → 附件 → save。

**两个 bug(降级根因)**:
1. **非 "Re:" 前缀**: 北欧教授回信主题用 `Sv:`(瑞典语)/`AW:`(德语)/`RE:`,我拼 `"Re: " & origSubj` 去 Drafts 找 reply 草稿就对不上(Mail 用它自己的前缀,且 origSubj 已含 `Sv:`)。**修复**: 不靠主题字符串匹配找 reply 草稿 —— reply 后**立即在同一 osascript 内**持有引用读 content,或按"最新 outgoing/最新 Drafts message"定位,不用主题拼接。
2. **followup 找原始发出**: 在 `All Mail` 按 `to recipients contains email` 找潘喆原始发出,偶尔匹配失败(大小写/地址格式)。**修复**: to 匹配用 lowercase + 同时搜 "Sent Mail"/「处理完成」夹;找不到再降级 cold。

**降级处理**: 找不到原邮件的 reply/followup 自动降级 cold 新建(仍有正文+附件,只丢 thread)。降级名单要记录,可后续用修正 finder 补救。

**稳妥删除铁律(再次确认)**: `delete (every message ... whose subject contains X)` 在循环里迭代会句柄失效报 -1728。必须**先收集 id 列表,再逐个 `delete (first message whose id is theId)`**。

---

## 2026-06-01 · 潘喆复查 — Lesson 14: followup quote finder 只能搜 "Sent Mail",**绝不能搜 "All Mail"**(嵌套引文根因)

**背景**: 潘喆 95 封落 Drafts 后做对抗式复查,发现 5 封 followup(Murray/Nordberg/Husovec/Oprysk/Pihlajarinne)的引文**嵌套了一层自己的正文** —— quote 里先是 followup 正文,再才是真原信。

**根因**: Lesson 13 bug#2 的修复写的是"同时搜 Sent Mail / All Mail" —— **这是错的**。Gmail 的虚拟夹 **"All Mail" 把 Drafts 也算进去**。第一次落草稿后,再次跑 load(为修 Ultraman/标题等)时,finder 在 All Mail 里按 `to=email` 找原信,**抓到了上一版草稿**(它=followup正文+原信),于是 requote 就多套了一层。

**正确修复**: followup 的 finder **只遍历名字 contains "Sent" 的夹("Sent Mail")**,排除 "All Mail"。已发件箱**永远不含草稿**,所以只会命中真正的原始发出信。
```applescript
repeat with mb in mailboxes of acct
    if (name of mb) contains "Sent" then   -- 只 Sent Mail,不要 All Mail
        repeat with m in messages of mb ... to recipients contains email ...
    end if
end repeat
```
- reply 类不受影响:它在 INBOX 找 `from=教授`,草稿是 `from=学生` 不会误命中。
- 找不到再降级 cold(见 Lesson 15:降级前必须先确认"到底发没发过")。
- **诊断口诀**: 落完后导出每封 quote 的第 1 行,followup 的 quote#1 应是 `> Dear Professor X,`(真原信开头);若出现 followup 自己的开场白(如 "I wrote to you earlier"),就是嵌套了。可程序化扫:某句正文 unique phrase 在全文出现 ≥2 次 = 嵌套。

**附带坑(Geiger)**: 个别原始发出信的 subject 字段本身带 `Subject: ` 前缀,`"Re: " & subj` 会得到 `Re: Subject: ...`。finder 拿到 subj 后先 `re.sub(r'^\s*subject:\s*','',subj,flags=I)` 再判前缀。

**可复用脚本**: `scripts/load_with_quote.py`(本次潘喆验证版固化)—— followup=Sent Mail finder / reply=INBOX finder / 稳妥删除-by-id / 建后核验附件==2 不足重建 / Geiger Subject: strip / `--test` 干跑 finder 不删不建。

---

## 2026-06-01 · 潘喆复查 — Lesson 15: followup 框架前必须核实"真的发过" —— 否则就是撒谎

**背景**: 同次复查抓到 3 封 followup(曹新明/Domeij/Lundstedt)正文写 "I wrote to you earlier... following up briefly",但**本人从没收到过**:
- 曹新明:原信发去了 `xmcao@must.edu.mo` —— **张冠李戴**,那是另一所学校另一个人;真曹新明(中南)零接触。
- Domeij/Lundstedt:真实发送批次(1/9 + 4/13)两批都完整在已发件箱,这俩查无踪迹 = 实际没发出去。

**铁律**: **followup / "跟进" / "之前发过" 的措辞,必须有客观证据**。判定来源 = 学生账号的 **Sent Mail**(按收件人地址核),不是套磁跟踪表的 `已套磁` 字段(那字段常含推断/批次猜测/发错地址也算"已发")。
- 收件人地址在 Sent Mail 里命中 → 真发过 → followup 合法。
- 地址纠错过(原地址发错人 / 换了新地址)→ 真本人**没收到** → 必须用 **cold 首次联系**,删掉"I wrote to you earlier... following up"。
- 查无踪迹 → 安全起见当 cold(给收过信的人发一封干净首联无害;对没收过的人谎称"跟进"则很尴尬,教授会回"我没收到过你的信")。

**程序化审计**(交付前必跑): 扫所有正文里的 prior-contact 措辞(`wrote to you earlier` / `following up` / `thank you for your (earlier )?reply` / `since we corresponded` ...),逐封校验有 Sent-Mail 记录或被引用的回信背书;无背书的一律降 cold 并报给用户定夺。**这是发错教授级别的严重错误,不是风格问题。**

---

## 2026-06-02 · 潘喆复查 — Lesson 16: 🚨 引用造假是头号铁律 —— "没搜到就不准写",且必须设强制核验闸门

**背景**: 潘喆 87 封终审,联网逐封核引用,抓到 drafting agent **凭空编造导师论文标题**:
- Henrik Udsen ← "your 2026 introduction to the AI Regulation" + "editorial on the Nordic dimension"(查无此文)
- Aurelija Lukoseviciene ← "*Human Agency at the Core: Reassessing Originality and Expression...*" (SSRN 2026)(查无此文;她真实的是 2023《The Invisible 'Gig Authorship'?》)
- 另:Buccafusco ← 把他"危害分类学"论文《Antisocial Innovation》说成"hedonic-cost framework"(真论文、错框架)。

**为什么会发生**: 收件人就是那篇"论文"的作者,一眼识破 → 申请直接判死。根因 = (1) drafting prompt 只禁止 research 列表造假,**没禁止正文引用 research 列表里没有的工作**;(2) agent 想"显得具体"就补一个听起来很合理的标题/年份/"forthcoming";(3) 下游只核了 email 地址(2.5)和文风(2.6),**没有任何一步核引用是否真实存在**。

**铁律(写进 end_to_end / email / research prompt)**:
- **正文点名的具体工作(标题/年份/出处),必须在该 draft 的 `research.papers[]` 里、且每篇带真实 `source_url`(你真的 fetch 过的页面)。** 没有就不准在正文写。
- **绝不"重构"一个貌似合理的标题/年份/"forthcoming 2026"**。哪怕你"觉得它八成存在"。
- 没有可核实的具体工作 → 就泛指其研究领域 / 某个具名概念。**准确的泛述永远胜过编造的具体。** "If you didn't find it, you don't write it."

**强制闸门(SKILL Phase 2.55,100% 跑、不抽样)**:
1. `scripts/verify_citations.py DIR` —— 本地零联网先筛:正文引号里的标题若不在 `research.papers[]`(且 papers 必带 source_url)→ BLOCKING(这正是造假特征)。
2. 并行子代理按 `references/verify_citations_prompt.md` 联网逐条核 存在性 + 转述准确性,判 `OK/MISCHARACTERIZED/NOT_FOUND/WRONG_ATTRIBUTION/NO_CITATION/UNCERTAIN`,每个非 OK 附 source URL,严禁猜。
3. `NOT_FOUND/MISCHARACTERIZED/WRONG_ATTRIBUTION/无法消解的 UNCERTAIN` 一律 BLOCKING:换成该教授真实著作,或泛化到研究领域,再复核。**一个查不到的具名/带年份/"forthcoming"工作,默认当造假撤掉。**

不抽样的原因:引用错误不随机分布,**集中在 drafter 想要"具体钩子"却没有真货的地方** —— 抽样恰好漏掉最危险的那些。

---

## 2026-06-02 · 潘喆复查 — Lesson 17: 事实核验闸门必须覆盖"全事实面",不止引用;用 find→对抗verify workflow 跑

**背景**: 建完 Phase 2.55(只查 cited works)后,对 87 封活跃草稿跑了一次 **find→adversarial-verify workflow**(15 批并行,每条 flag 派独立第二个 agent 复核)。结果 **10 个确认错误 / 0 误报 / 0 存疑**——其中 **6 个不是"引用"类**,只查 citation 的闸门会全部漏掉:

| 类型 | 实例 |
|---|---|
| 编造项目名 | Colonna "REFLECT-ML project"(真实项目是"Ethical and Legal Challenges in...Higher Education");她那篇 Oechtering 2025 unlearning 章节是真的 |
| 法条号写错 | Domeij: Data Act "Article 4" → 实为 **Art. 43**(停用 SGDR 的条款);Mahler: AI Act "Title VIII" → 生效法用 **Chapter V / Arts 51-56**,Title 是 2021 草案的编号 |
| 判例张冠李戴 | Schwemer: obtaining-vs-creating 记成 "Apis/Innoweb line";Tore Lunde: 记成 "BHB and Innoweb" → 该原则实为 **British Horseracing Board (C-203/02) + Fixtures Marketing (2004)**;Innoweb 是 re-utilisation,Apis 是 extraction |
| 头衔注水 | Szkalej 信里把推荐人 Jonas Ledendal 称 "Professor"、Andreasson 抬头 "Dear Professor" → 两人都是 **Senior Lecturer / universitetslektor**(查官方教职页,非 Professor 默认用 "Dr.") |
| 论文年份 | Papadopoulou "Sex of the Author" 写 2024 → 实为 **2023**(2024 是 PDF 重传路径) |
| 转述失真 | Papadopoulou 那篇其实是"瑞典电影中的女性作者身份"(Selma Lagerlöf),被说成泛论"copyright 如何建构作者";Geiger 被安了个"metadata paradox"框架(他那篇 *The Forgotten Creator* 讲的是 opt-out 失灵→法定报酬权) |

**结论**: Phase 2.55 的核验面从"cited works"**扩到全事实面** —— cited works + 法律判例 + 法条号/法条内容 + 教授头衔/任职/项目 + 日期。`verify_citations_prompt.md` 已据此扩写。

**工具**: 批量 > ~20 用 **Workflow**(`find → adversarial-verify` pipeline):Stage1 逐封抽取+联网核每条事实,Stage2 **独立**第二 agent 只复核被 flag 的(滤误报+坐实真错)。对抗第二轮很关键——既挡误报、也防 Stage1 rubber-stamp。87 封那次正是这样跑出 10/0/0。

**头衔小工具规则**: 称呼/提及任何学者前,默认查官方教职页确认 rank;**没确认是 Professor 就用 "Dr."**(把 Senior Lecturer/postdoc 叫 Professor,同圈子的收件人一眼看穿)。

---

## 2026-06-02 · 潘喆发送 — Lesson 18: Gmail-绑-Mail.app 批量发送的铁律(幂等/对账/掉草稿/验Sent)

**背景**: 潘喆套磁号是 **Gmail 绑在本机 Mail.app**(不是刘锦楠的 Outlook,也不走 n8n)。87 封 followup/reply/cold 经审核后逐封 `send`。从 Drafts 直接 `send` 已保存草稿(faithful-copy,不重建——保住 quote+附件原样)。本机 Gmail SMTP **需要本地代理(松果加速器)**,87 封全程 Outbox 没卡一封,断路器没跳——证明该代理可靠承载 Gmail 发送(与早前刘锦楠 runaway 的代理事故相反,那次是代理+逻辑双坏)。

**🚨 幂等必须按"收件人+主题",绝不能只看主题**: 多封草稿**共用主题**(followup 模板 + finder 生成的 `Re: <同一原标题>` 会撞)。"主题是否已在 Sent" 的去重判断**误杀**了 zcyi——他的主题和已发的 Oprysk 撞,被判"已发"→删草稿但**根本没发出去**。修复:Sent 里匹配 **to-recipient AND subject** 才算已发。verify 回读同理(否则读错人的 Sent 副本)。

**每批必 reconcile(ledger vs Drafts vs Sent)**: 一批发完立刻对账,抓三类:
- **MISSING**(期望的草稿不在 Drafts 了)= **Mail 偶发静默掉草稿**(de Vries / stephendu / szkalej 各掉过一次)→ 用 reload 原样重建 → 补发。**掉草稿是真事,reconcile 不是可选项,是安全网。**
- **leftover-to-sent**(草稿的收件人已在 ledger)= 发送残留 → 清掉。
- dupes / not-active。
全程 87 封**零静默丢失**,全靠每批对账兜底。

**记账前先验 Sent**: 只有确认消息已落 Sent(收件人+主题)且 **att==2 + quote 完整**,才往 ledger 追加。ledger 是"已发"唯一真相源。结尾再做一次**独立交叉核**:扫 live Sent(当天)收件人 vs active 全集,别只信 ledger——结果 87/87 坐实、0 误发暂停名单。

**节流 + 断路器**: ~22s/封 + 逐封验证;Outbox 卡住就落 STOP-file 断路(防 Gmail 限流 runaway)。代理稳时无需触发。

**复用脚本**: `scripts/send_via_mailapp.py`(收件人+主题幂等 / 发后验Sent回读 att+quote / STOP断路 / 写ledger)+ `scripts/reconcile_sends.py`(ledger×Drafts×Sent 三方对账 + 清stray + 列MISSING + warm-first todo)。换学生改顶部 ACCT/SENDER/附件路径/manifest/ledger 即可。

**边界诚实**: "已发+Sent坐实" = 交给 Google 出口投递,**不等于进了对方收件箱**(spam 与否取决于对方过滤器,看不到)。Gmail 中转 + 每封个性化 + SPF/DKIM 对齐 → 进 spam 概率低,但不可保证。

---

## 2026-06-08 · 刘锦楠 — Lesson 19: 🚨 引用核验的下一关 = 作者归属(真论文、安错人);CrossRef gate 两边都要跑

**背景**: 给刘锦楠做 Saiani(Manchester)的 call-prep 准备包、核对参考文献时,发现**已经发出去的冷邮件**把一篇 2023 *Nature Communications* 的 human-in-the-loop ML 肽水凝胶论文算成了 Saiani 的 —— 实际作者是**西湖大学**某组(Xu/Wang et al.),Saiani 根本不在署名里。这**不是** Lesson 16 的"造假":论文真实存在、主题完美贴合、source_url 也是真的 —— 它只是**安错了人**(misattribution)。这是比造假更隐蔽的一类,因为一眼看上去全对。

**为什么 Lesson 16 的三道闸门全漏了**:
- research subagent 在 `papers[]` 里就把它写成 `"Saiani, A. et al. (collaborative)"`,带了真 `source_url`(确实能 fetch 到的真实页面) —— 防造假的规则对它无效,因为它不是造的。
- 本地 provenance gate 只查"正文引号里的标题是否出现在 `papers[]`" —— 它**在** papers[] 里,所以过了。本地 gate 只验"来源",不验"是不是他写的"。
- 联网 verify 把 authorship 埋在 `WRONG_ATTRIBUTION` 选项里,不是第一关;agent 容易被"存在性 OK + 转述准确"带过,没专门问"收件人到底是不是作者"。

**根因位置 = research 步骤**。找到一篇主题完美的真论文,**光有 source_url 不等于是他写的**(可能来自主题搜索结果页 / 合作者主页 / 实验室"我们喜欢的论文"列表)。下笔前必须开 byline 确认**本人姓**在署名里。

**修复(CrossRef 作者 gate —— 两边都要有)**:
1. **`research_prompt.md`(源头)**: 加 🚨 第二条铁律 —— 列任何论文前必须 OPEN byline 确认 `{SUPERVISOR_NAME}` 本人在作者列表;不在就删,**哪怕它最贴主题**(宁可换一篇真是他的、主题稍偏的)。输出强制带 DOI,供下游确定性核验。
2. **`scripts/verify_citations.py` Phase 2.55(冷邮件端,确定性)**: 新增 `crossref_attribution_gate()` —— 对每篇带 DOI 的 `papers[]`,拉 `api.crossref.org/works/{DOI}` 的 author 列表,确认导师姓在内;不在 → **BLOCKING**。这是本地 provenance gate 之外**新加的一关**,零 LLM、确定性。
3. **`verify_citations_prompt.md`(联网端)**: 把"收件人是不是作者"提为 `cited_work` 的**第一关**(存在性 / 转述退居其后),附 Saiani 实例,并说明 py gate 的 🔴 flag 视为已坐实-BLOCKING、无 DOI 的引用仍需人工。
4. **`call_prep_style.md` rule 9(call-prep 端)**: 准备包是**照着我们写的冷邮件做的**,会原样继承同一个错。所以同一把 CrossRef 作者 gate 必须在 call-prep 端也跑:**第一关 = 作者归属**(别信冷邮件署名,自己开 CrossRef 看),第二关才是 DOI / 元数据对齐(Graham 2019 那种 DOI 数字幻觉)。

**姓氏匹配的坑(gate 实现,踩了两次)**: 精确匹配会误伤。
- 多词西方姓: `De Angelis`→CrossRef family `"de angelis"`、`Olvera de la Cruz`→`"olvera de la cruz"` —— 精确 `==` 全漏(误判成 misattribution)。
- 连字符姓: `Fernandez-Nieves` —— 第一版我把作者 token 按连字符拆了、候选没拆,`"fernandez-nieves"` 配不上 `{fernandez, nieves}` → **误报一个真作者 3 次**(回归)。
- CJK 姓在前: `Loh Xian Jun`(姓 Loh)、`To Ngai`、`Ran Ni` —— 姓在第一个 token,只取末词会漏。
- 短姓: `ni` / `ngai` 绝**不能用裸子串**匹配 —— 会被 `antonni` / `morton` 吞掉 → **漏报**(把真·安错人放过去,最危险的方向)。

**正确解法**(`_name_cands` × `_supervisor_is_author`): 候选集 = {末词, 首词, 多词后缀(末2/末3), 去敬称/初始/后缀} × **token 感知**匹配 —— 连字符两边都归一成空格;单词候选必须**等于**某作者 token,多词候选才按子串。这样 `angelis` 命中 `de angelis` 的 token、`fernandez nieves` 命中归一后的 byline、`ni` 只在真有 `ni` 作者时命中。

**实测(46 已发 + 86 未发的 papers[] DOI,~200 篇)**: 193 author-confirmed。真问题两类 ——
- **真·安错人(BLOCKING)**: Saiani、Ran Ni(`papers[]` 把别组的 review/NatComms 算到他名下)。
- **DOI 指错(论文真是他们的,但 papers[] 里的 DOI 落到别人论文)**: Dreiss、Harlen、Curk、Yethiraj、To Ngai;Mandadapu 的 CrossRef 作者列表疑似残缺需人工。
- 另有约 13 个 DOI 在 CrossRef 查不到(占位 `XXXXX`/`01xxx`、**arXiv 预印本 CrossRef 不收录**、老 Elsevier 截断 DOI)—— 落 `🟠 unresolved` 桶人工核,不全是错。

**局限 + 全量扫已补做(2026-06-11)**: py gate 只覆盖**带 DOI** 的条目、且只验**作者归属**;正文里无 DOI 的具名引用、以及**真论文被错误转述**(characterization),gate 都看不见。2026-06-11 对全部 132 封跑了一遍**联网正文扫**(7 个 Sonnet 子代理,authorship-first)。结果很说明问题:
- 6 个 DOI-flagged 里 **5 个正文其实没问题** —— Kermode/Falk 是 arXiv 预印本(CrossRef 不收录)= 假警报;Harlen/Mandadapu/Yethiraj 的正文引对了论文,只是 `papers[]` 的 DOI 元数据错(没进正文)。**只有 To Ngai 正文真错**(把 Harrer 的 Langmuir 论文当成他的)。
- 抓到 gate **结构上抓不到的新一类错 = MISCHARACTERIZED(真论文、作者对、但转述错)**:Stefan Bon(把他 GO 模板矿化论文说成"酶/金属螯合可编程水凝胶")、Matthew Tirrell(把他一篇**实验**论文说成"你的粗粒化框架")。CrossRef 作者 gate 对这类完全无效(作者没错)。
- 3 封未发的(To Ngai/Bon/Tirrell)已**逐字改正**(只动错的那句、其余保留);Ran Ni 那封已发、撤不回。

**教训:两道闸都要跑 —— CrossRef 作者 gate 挡 misattribution(真论文安错人),联网正文扫挡 characterization(真论文转述错)。前者确定性、零成本、防最致命;后者才能盖住"作者对但描述错"这一层。**
