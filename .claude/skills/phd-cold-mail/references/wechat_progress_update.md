# WeChat progress-update format (advisor → student)

After a reply-handling round (sweep inbox → classify → reply → update tracker), the student (and the parent/student) usually wants a **plain-language WeChat summary** of where the campaign stands. **Always offer one**: end the round with *"要不要我整理成一条微信消息发给 {学生}？"* — the user (advisor 王世杰's voice) forwards it.

Validated on 潘喆 2026-06-06, then **leaned out on 2026-06-11** when the user edited a draft. Keep it dense on *facts* (every positive: last-contact date + content + next step; declines listed, including ones *we* judge unsuitable like funding) but **cut all editorial padding** — see Tone below. Follow-up rounds can be incremental ("接着上次同步，这两天的新进展：" + only the leads that moved), not a full re-dump.

## Voice
Uses the shared **王世杰 微信口吻** — full voice + hard rules in [`../../_shared/wechat-voice.md`](../../_shared/wechat-voice.md) (第一人称王世杰 / 零破折号(range 用顿号) / 签名 bare `世杰` / 无 markdown 加粗 / 段标题 【】或 ▍ / 不放 emoji / 少用双引号 / 不用比喻式口语). Don't restate the voice here; if it changes, edit the shared file.

This deliverable is the canonical's **事实同步型** register (§二·A): lean, facts-only, under-comment (validated 潘喆 2026-06-06, leaned out 2026-06-11 from the user's own edits). 套磁-specific application:
- Per-person fact line: `Name（校，方向）。{日期} 回信：{要点}`. Ranges use 、 (明年 3、4 月).
- **Cut**: chatty preambles, campaign-internal strategy the student doesn't need (剔除美国/中国大陆, earlier-batch hard-rejects, "更早一轮 N 位" meta-counts), editorial labels ("按热度", "最实的"), reassuring parentheticals ("套磁里很正常").
- **Keep**: every per-person fact + factual parentheticals (dates, places, "NUS 线 Jan 2027"). A strategic judgment affecting the student's own decisions ("学位 10 月才到手 → 主攻 2027") is fact, keep it.

## Structure (4 blocks)

**【一、总体进度】** — honest headline numbers (the trap: handling each reply one by one makes it *feel* like everyone replied). Plain counts only, no internal strategy:
- 发出 `N` (do NOT add region-exclusion meta like 已剔除美国/中国大陆 — that is our strategy, not the student's concern)
- 回信 `R`（正面 `P` / 婉拒 `D`）
- 退信 `B`（split out; one phrase on the cause — a bounce never reached the prof）
- 暂未回 `N-R-B`

**【二、正面回复】** — tier by actionability, NOT by reply date. For each: `Name（校，方向）。{日期} 回信：{要点}。{下一步}`. Cover earlier-round leads too. Plain category headers, no editorial labels:
- ▍明确愿意带
- ▍方向认可 + 有明确下一步（含具体时间窗，如"年底 call""8 月再谈""每年 3/1 call"）
- ▍弱正面 / 走流程

**【三、婉拒 / 我们判断不合适】** — a name list, one-phrase reason each, no "套磁里很正常"-style reassurance:
- 明确婉拒：`{名单 + 一句原因}`
- **我们判断不划算**：positive-sounding but practically dead (funding blockers, timing-out cycles). Goes HERE, not the positive list.
- 退信核查：已离任 / 荣休 / 转业界 → 非在岗博导，剔除。
- (Skip old-batch hard-rejects entirely; the student does not need them.)

**【四、需要你做的】** — the single highest-priority action, concrete. One ask beats five.

## Hard rules for the numbers
1. **Show dates.** Distinguish "newly arrived" (by `date received`) from "newly handled by us". A 3-day-old reply we just processed is NOT "new" — say its real date.
2. **Bounces split out.** Cross-check INBOX for `mailer-daemon` DSNs; a bounced address never reached the prof and must not sit in "已发未回". And a bounce is often **signal** the person left their post (emeritus / firm / industry) — verify current role before any resend; never guess a replacement address (it just bounces again).
3. **Reconcile against the tracker** (`Pan_Zhe_套磁跟踪_数据源.json` style), the persistent source of truth across batches, before quoting any count — the inbox window alone misses earlier-round positives.
4. Every claim traces to a tracker `note` / actual reply. No "I read his work" overclaims; titles default to Dr. unless confirmed full Professor.

## Template skeleton
```
{学生}，套磁整体进展同步（截至 {日期}）：

【一、总体进度】
本轮共发出 {N} 封。
· 回信：{R} 封（正面 {P}、婉拒 {D}）。
· 退信 {B} 封：{核查结论}。
· 暂未回：{X} 封。

【二、正面回复】
▍明确愿意带
1. {Name}（{校}，{方向}）。{日期} 回信{要点}。{下一步}。
…
▍方向认可 + 有明确下一步
…
▍弱正面 / 走流程
…

【三、婉拒 / 我们判断不合适】
· 明确婉拒：{名单 + 一句原因}
· 我们判断不划算：{Name}（{原因，如无 PhD 经费}）
· 退信核查：{Name}（{已离任/荣休/转业}，剔除）

【四、需要你做的】
{最高优先级的一件事，具体到可执行}

世杰
```
