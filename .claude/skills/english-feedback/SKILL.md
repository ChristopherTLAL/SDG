---
name: english-feedback
description: Write warm, insightful feedback on a student's English writing, grounded in the matching article/chapter from the /tools/english/ library (src/data/english/). Locates the exact chapter the student is practicing, reads its taught patterns/vocab/model answer, and points out where the student missed or could use the very moves that chapter teaches. Output is encouraging and tidbit-style ("招式 + 小知识 + 范文"), not a hard grammar lecture, tuned for middle/high-school learners. Voice + hard rules inherit the shared 王世杰 微信口吻 (B 反馈建议型). Use whenever the user says "给学生写 feedback", "点评/批改这篇英语作文", "英语写作反馈", "改一下这篇英语", "English writing feedback", "看看学生写的英语", or pastes a student's English writing and asks for comments. Also use when the writing is a Listen & Write / 仿写 from a tools chapter. Don't undertrigger.
---

# english-feedback

Take a student's piece of English writing and produce feedback that reads like a generous, sharp tutor, not a red pen. The whole point: **ground it in the tools content the student is actually working from**, so the feedback teaches the exact moves that chapter was designed to teach.

This skill exists because the value is in the alignment. A generic "your essay has some grammar issues" is worthless. "You reproduced the model answer almost perfectly, but the two signature patterns this Listen & Write was built to teach are the two you skipped" is gold.

## Inputs

The user gives you the **student's writing** (pasted, screenshot, or a file path: `.docx` / `.md` / `.txt`). Often also:
- Which **chapter / article / 题目** it came from (or it is obvious from the content).
- The student's **grade / level** and a **target** ("现在 B1, 想冲 B2"). Default audience: middle-school (初中), so keep it tidbit-friendly.

If the user only pasted writing with no context, transcribe it first (if a screenshot), then run the locate step.

## Process

### 1. Locate the matching chapter (the spine)

Find the article/chapter the writing is based on. Search both:
- flat articles: `src/data/english/YYYY-MM-DD.ts`
- book chapters: `src/data/english/books/<book>/NN-slug.ts` (these have `listeningWriting` = Listen & Write tasks, the common feedback case)

How: grep by distinctive content (proper nouns, topic, a quoted phrase), or by the writing **pattern** the prompt gave (e.g. `is more than ... It is ...`). Example: `grep -rli "aespa\|KWANGYA" src/data/english/`.

If the student wrote freely with no matching chapter, skip to generic CEFR-uplift mode (still do steps 3-6, just without chapter-specific patterns).

### 2. Read the chapter's teaching skeleton

From the matched file, read (see `src/data/english/types.ts` for the shape):
- `listeningWriting.writing`: the `promptZh`, `usePatternIds`, and `modelAnswer`. **The `usePatternIds` are the patterns the task wanted the student to use**: check whether the student used them.
- `patterns[]`: each has `skeleton`, `useCase`, `whyItWorks`, `commonMistake`. These are your "招式".
- `grammar[]`: `commonMistake` / `vsSimilar` for Chinese-learner pitfalls.
- `vocab[]`: leveled words (1-4) for upgrade suggestions.

Compare the student's writing against the model answer + the intended patterns. The single most insightful finding is usually: **which taught move did they skip or fold in half?**

### 3. Place it on CEFR

Where does the writing sit (A2-C2) vs the chapter's `meta.cefr` and the user's target? Be concrete and encouraging.

### 4. Compose the feedback (B 反馈建议型 register)

Voice + hard rules: inherit the shared **王世杰 微信口吻**, register B, from `../_shared/wechat-voice.md`. Most load-bearing for this skill:
- **先肯定 → 列问题 → 鼓励**. Open by naming specifically what they nailed.
- honest but constructive, with warmth (the student is often a kid / a not-yet-signed lead).
- 敏感点站学生一边.
- **零破折号 anywhere** (no `——`, no `–` in ranges; use 句号/逗号/冒号/顿号). This is a hard rule and applies to every deliverable.

Structure (this skill's own shape, written for a middle-schooler, "好接受"):
1. **总评**: 先肯定, specific ("信息点全抓到了 / 几乎复现了模范答案").
2. **招式 (1-3)**: the chapter's signature patterns the student missed or could deploy. For each: their line → the upgraded line → why it is stronger → where else to use it. Frame as a "招式" to learn, not a rule they broke. Lead with the one that matters most (often the `usePatternIds` they skipped).
3. **小习惯** (only if needed): group mechanical fixes gently (e.g. 英文标点后空一格). One short paragraph, not a list of shame.
4. **小知识彩蛋 (2-3)**: insightful, fun tidbits they can show off: who is actually doing the action in a dangling `-ed` phrase; brand styling (aespa is intentionally lowercase, like adidas); a precise word for a vague one. This is the "像小知识介绍" feel the user wants.
5. **词汇升级**: weak / casual words → more precise upgrades with a short example each.
6. **范文**: a lightly polished version of **their own writing**, bilingual. 🚨 **Iron rule: keep the student's own words and content.** Fix spacing/grammar, restore the taught pattern, swap a weak word, but do NOT rewrite their sentences wholesale, invent new content, or change any facts/data. The goal is "your words, nudged up a notch", so they see the small distance. (See assistant memory `do_not_modify_student_content`.)
7. **CEFR 定位 + 下一步**: one concrete thing to practice next ("每段结尾试一次 'is more than... It is...'").

### 5. Output format

Default deliverable = a **formatted feedback** for the teacher to read / show on screen / paste into a doc: markdown headers + sparing emoji section markers are fine here, and read nicely. Keep the zero-em-dash rule regardless.

If the feedback is going **out as a WeChat message** to the student/parent, also offer a plain-text version per the canonical hard rules: no markdown bold (WeChat will not render it), 段标题用【】或▍, bare `世杰` sign-off, zero em-dash. End the round with: *"要发微信的话,我把它转成纯文本版?"*

### 6. Tune to the learner

- 初中 / 初高 (default): tidbit-style, 3-ish 招式 max, lots of warmth, no jargon. The aespa example is the model.
- 高中 / 标化备考: can go denser, name patterns more directly, tie to the target band.

## Reference

- [`references/example-aespa.md`](references/example-aespa.md): full worked example (初二 student, Giselle book Ch.1 Listen & Write). Imitate its feel and structure.
- `../_shared/wechat-voice.md`: shared 王世杰 voice + hard rules (register B applies here).
- `src/data/english/types.ts`: the chapter content model you are reading from.
