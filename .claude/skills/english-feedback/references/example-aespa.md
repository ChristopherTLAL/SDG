# Worked example: 初二, Giselle book Ch.1 Listen & Write

This is the canonical example of the feel and structure to imitate. Study how the feedback is **grounded in the chapter**: it names the two patterns (`pt2`, `pt1`) the Listen & Write task listed in `usePatternIds`, and shows that the student skipped both.

## The setup

- **Student:** 初二, goal = lift overall language + sound more insightful, not hard grammar. Wants "好接受" tidbit-style content.
- **Task:** Listen & Write from `src/data/english/books/giselle/01-comeback.ts` (B1). Prompt: write ~60 words introducing aespa's comeback to a friend. `usePatternIds: ['pt2', 'pt1']`.
  - `pt2` skeleton: `Part of what makes [主体] special is [原因].`
  - `pt1` skeleton: `[一件事] is more than [表面意义]. It is [更大的意义].`
  - Model answer ends: "This comeback is more than new songs. It is a promise that aespa is here to stay."

## What the student wrote

> Aespa is a four-member K-pop group, and Giselle is their main rapper. In 2026, SM announced their second studio album, hoped to come out in May. Fans love their cool story where each member has an avatar in a world called KWANGYA. This comeback is a promise that aespa is here to stay

## The key insight

The student reproduced the model answer's content almost perfectly, but folded `pt1` in half ("is a promise" without the "is more than X" first beat) and replaced `pt2` with the chatty "Fans love their cool story". The two patterns the task was built to teach are exactly the two they skipped. That is the spine of the feedback.

## The feedback (output)

---

**先说结论:你这段写得很棒 👏** 信息一个没漏（四人团、Giselle 是主 rapper、SM、第二张正规专辑、五月、KWANGYA），句子也读得顺。说明你听得很认真。下面几个"再往上一档"的小招式,都不难,学会了以后写什么都能用。

### 🎯 招式一:结尾的"两段式升华"(这章最想教你的一招)

你的结尾是 "This comeback is a promise that aespa is here to stay." 这句本身很好,但你把课文教的招式对折了一半。原版是两拍:

> This comeback **is more than** new songs. **It is** a promise that aespa is here to stay.

先说"它不只是表面的那个东西(新歌)",停一下,再甩出"它真正的意义(一个承诺)"。先小后大,落差一出来,结尾的力量就翻倍。这个句型 `X is more than [表面]. It is [更大的意义].` 写读后感、作文结尾、以后写文书都超好用。你只差把前半句加回来。

### ✨ 招式二:介绍"为什么特别"的高级开头

你写 "Fans love their cool story",意思对,但有点像聊天。课文给了更有质感的说法:

> **Part of what makes** the group special **is** their story, where each member has an avatar in KWANGYA.

`Part of what makes ___ special is ___`（它特别的原因之一是……）。一个 *Part of* 就显得你很冷静客观:"原因不止一个哦"。一上来就有"小作家"的味道。

### ✏️ 一个小习惯:英文标点后面要空一格

你有几处连在一起了:`group,and` / `rapper.In2026,SM` / `May.Fans` / `KWANGYA.This`。中文标点不空格,但英文句号、逗号后面都要空一格。改完整段立刻清爽,这是最快能提分的一个习惯。

### 🧠 三个小知识(读着玩,顺便涨知识)

1. **"谁在 hope?"** 你写 `their second studio album, hoped to come out in May`,读起来像是"专辑自己在期待" 😄。英文里一个 -ed 短语贴在名词后面,描述的就是那个名词。这里期待的其实是 SM,所以更顺的说法是 `which they hope to release in May`。
2. **aespa 为什么是小写 a?** 你开头写了大写 "Aespa",其实官方故意全小写写成 aespa（像 adidas、iPhone 一样,是品牌的个性设计）。除句首外平时都写小写,这是个能在同学面前秀一下的冷知识。
3. **"cool" 可以换更准的词。** 那个故事不只是"酷",它是一整个虚拟世界设定（K-pop 里叫 *concept* / *storyline*）。想夸它可以用 *unique*（独一无二）、*imaginative*（有想象力）。

### 📝 把你的原话稍微一调,就是这样(几乎全是你自己的句子)

> aespa is a four-member K-pop group, and Giselle is their main rapper. In 2026, SM announced their second studio album, which they hope to release in May. Part of what makes the group special is their story, where each member has an avatar in an online world called KWANGYA. **This comeback is more than new songs. It is a promise that aespa is here to stay.**

> aespa 是一个四人 K-pop 组合,Giselle 是主 rapper。2026 年,SM 宣布了第二张正规专辑,希望五月发行。这个组合特别的原因之一,是她们的故事设定:每位成员都有一个生活在名为 KWANGYA 的线上世界里的虚拟形象。这次回归不只是几首新歌,它是一个承诺,说明 aespa 会一直走下去。

### 📊 水平定位

这篇稳稳站在 **B1**（正好是这一章的级别）。把招式一的两段式结尾练熟、再顺手用上招式二的 Part of 开头,你的句子就会有 B1+/B2 的"质感"。下次先盯着一个目标练:每段结尾,试着用一次 "is more than... It is..."。

---

## Why this works (for the skill author)

- **Praise is specific and first** (B register: 先肯定).
- **Every 招式 is traceable to the chapter** (pt1 / pt2 from `usePatternIds`), with their line → upgraded line → why → where-else.
- **小知识** are genuinely insightful and fun, not grammar drills (the user's "像小知识介绍" ask).
- **范文 keeps the student's own words** and only nudges (iron rule `do_not_modify_student_content`): note it preserves "SM announced their second studio album", "Fans"→ folded into pt2 only as the showcase, the closing restored to the taught two-beat. No facts changed.
- **Zero em-dash** throughout (canonical hard rule). The model answer's zh uses a comma, not `——`.
