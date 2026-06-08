# WeChat progress-update format (advisor → student)

After a reply-handling round (sweep inbox → classify → reply → update tracker), the student (and the parent/student) usually wants a **plain-language WeChat summary** of where the campaign stands. **Always offer one**: end the round with *"要不要我整理成一条微信消息发给 {学生}？"* — the user (advisor 王世杰's voice) forwards it.

Validated on 潘喆 2026-06-06. The user's explicit ask: information-dense, every positive explained with **last-contact date + content**, earlier rounds included, declines listed (including the ones *we* judge unsuitable, e.g. funding).

## Voice
First person as the **advisor** (王世杰), warm + direct, no hype. Sign with just `世杰` (no name dash). Plain text, no markdown bold (WeChat won't render it). Section headers with 【】 or ▍. Emoji sparingly OK.

**🚫 No 破折号 (em-dash `——`) anywhere, and no en-dash `–` in ranges.** The user explicitly dislikes them (潘喆 2026-06-06). Restructure with 句号 / 逗号 / 冒号: `Name（校，方向）。{日期} 回信：{要点}`. Ranges use 、 (e.g. 明年 3、4 月), not `3–4 月`. Sign-off is bare `世杰`, never `——世杰`. This mirrors the English-side zero-em-dash hard rule and applies to Chinese deliverables for this user too.

## Structure (4 blocks)

**【一、总体进度】** — honest headline numbers. The trap: handling each reply individually makes it *feel* like everyone replied. State it plainly:
- 发出 `N`（注明已剔除的地区/类别，如美国/中国大陆）
- 回信 `R`（其中正面 `P` / 婉拒 `D`）
- 退信 `B`（**bounces are NOT silent-no-reply** — split them out; see below）
- 暂未回 `N-R-B`（点明"发出才几天，长尾正常"）
- 早一轮仍在跟的正面线索 `E` 位

**【二、正面回复】** — tier by *heat/actionability*, NOT by reply date. For each: name (校, 一句方向) — `日期`：回信内容要点 + 下一步。Cover earlier-round leads too (mark "更早一轮…，已再去信待回").
- ▍最实的（明确愿意带）
- ▍方向认可 + 有明确下一步（含具体时间窗，如"年底 call""8 月再联系""每年 3/1 一次 call"）
- ▍弱正面 / 走流程（公开招聘、程序性引导、鼓励性 — 保持联系别抱大期望）

**【三、婉拒 / 我们判断不合适】** — a name list with one-phrase reasons. Include:
- 明确婉拒（名额满 / 方向差一点 / 无名额 — 注明"套磁里很正常"）
- **我们判断不划算**：positive-sounding but practically dead — funding blockers (no PhD funding / self-fund only), timing-out cycles, etc. The user wants these HERE, not inflating the positive list.
- 退信核查结果（已离任 / 荣休 / 转业界 → 非在岗博导，剔除不补发）
- 更早批次硬拒一句带过

**【四、需要你做的】** — the single highest-priority action for the student, stated concretely (e.g. "确认 Vesala 的贡献框定对不对，点头我就发回信 + 安排 RP 修订"). One ask beats five.

## Hard rules for the numbers
1. **Show dates.** Distinguish "newly arrived" (by `date received`) from "newly handled by us". A 3-day-old reply we just processed is NOT "new" — say its real date.
2. **Bounces split out.** Cross-check INBOX for `mailer-daemon` DSNs; a bounced address never reached the prof and must not sit in "已发未回". And a bounce is often **signal** the person left their post (emeritus / firm / industry) — verify current role before any resend; never guess a replacement address (it just bounces again).
3. **Reconcile against the tracker** (`Pan_Zhe_套磁跟踪_数据源.json` style), the persistent source of truth across batches, before quoting any count — the inbox window alone misses earlier-round positives.
4. Every claim traces to a tracker `note` / actual reply. No "I read his work" overclaims; titles default to Dr. unless confirmed full Professor.

## Template skeleton
```
{学生}，套磁整体进展同步（截至 {日期}），信息量有点大，你慢慢看：

【一、总体进度】
本轮共发出 {N} 封（已剔除 {地区}）。
· 回信：{R} 封（正面 {P}、婉拒 {D}）
· 退信 {B} 封——{核查结论}
· 暂未回：{X} 封（长尾正常）
另有更早一轮仍在跟的正面线索 {E} 位。

【二、正面回复】（按热度）
▍最实的（明确愿意带）
1. {Name}（{校}，{方向}）—— {日期}：{要点} + {下一步}。
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
