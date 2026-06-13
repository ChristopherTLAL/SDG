# Worked example: 初二, Giselle book Ch.1 Listen & Write

The canonical example to imitate. Two things to notice: the feedback is grounded in the chapter (it names patterns `pt2` and `pt1` from `usePatternIds` and shows the student skipped both), and it is written in the WeChat style by default: flowing paragraphs, full-width Chinese punctuation, no emoji, no markdown, almost no quotes, no conceptual metaphor, zero em-dash, and NO sign-off.

## The setup

- Student: 初二, goal = lift overall language + sound more insightful, not hard grammar. Wants tidbit-style, easy-to-take content.
- Task: Listen & Write from `src/data/english/books/giselle/01-comeback.ts` (B1). Prompt: ~60 words introducing aespa's comeback to a friend. `usePatternIds: ['pt2', 'pt1']`.
  - `pt2` skeleton: `Part of what makes [主体] special is [原因].`
  - `pt1` skeleton: `[一件事] is more than [表面意义]. It is [更大的意义].`
  - Model answer ends: This comeback is more than new songs. It is a promise that aespa is here to stay.

## What the student wrote

> Aespa is a four-member K-pop group, and Giselle is their main rapper. In 2026, SM announced their second studio album, hoped to come out in May. Fans love their cool story where each member has an avatar in a world called KWANGYA. This comeback is a promise that aespa is here to stay

## The key insight

The student reproduced the model answer's content almost perfectly, but folded `pt1` in half (kept the promise, dropped the is-more-than first beat) and replaced `pt2` with a chatty Fans-love-their-cool-story line. The two patterns the task was built to teach are exactly the two they skipped. That is the spine of the feedback.

## The feedback (output, WeChat style: this is the default form)

> 这次 aespa 那段写得挺好，该有的信息一个没落：四人团、Giselle 是主 rapper、SM、第二张正规专辑、五月、还有 KWANGYA 这个设定，顺序也清楚，听得很认真。下面几个地方调一调就能更好，都不难。
>
> 最值得说的是结尾。你现在写的是 This comeback is a promise that aespa is here to stay，这句本身就不错，只是课文教的那个写法你只用了一半。完整的是两句：
>
> This comeback is more than new songs. It is a promise that aespa is here to stay.
>
> 先说大家一眼会想到的那一层，也就是新歌，再说出它更重要的意思，也就是一个承诺。这样收尾比直接给一句结论更清楚，读的人也更容易记住。这个 is more than 后面接 it is 的写法，以后写读后感、写作文结尾都用得上，你只差把前半句补回去。
>
> 开头也可以再讲究一点。你写 Fans love their cool story，意思没问题，但读起来有点随意。课文给的说法更正式：Part of what makes the group special is their story。加一个 part of，等于在说原因不止一个，显得你想得更周全，开头也更正式。
>
> 还有一个最快见效的小习惯：英文标点后面要空一格。你有几处连在一起了，比如 group 后面那个逗号、rapper 后面那个句号、还有 May 和 Fans 中间。中文标点不空格，但英文的句号、逗号后面都要空一格，改完整段看起来会整齐很多。
>
> 再说三个小知识。第一，你写 album, hoped to come out in May，读起来像是专辑自己在期待，其实英文里 -ed 短语贴着哪个名词，就是在描述那个名词，这里期待的是 SM，写成 which they hope to release in May 会更准确。第二，aespa 其实是官方故意全部小写的，跟 adidas、iPhone 一样，是品牌特意的写法，除了句首，平时都写小写。第三，cool 这个词可以换得更准，那个故事不只是有意思，它是一整个虚拟世界的设定，想夸它可以用 unique 或者 imaginative。
>
> 把你自己的话稍微调一下，基本没动你写的内容，就成了这样：
>
> aespa is a four-member K-pop group, and Giselle is their main rapper. In 2026, SM announced their second studio album, which they hope to release in May. Part of what makes the group special is their story, where each member has an avatar in an online world called KWANGYA. This comeback is more than new songs. It is a promise that aespa is here to stay.
>
> 整体已经稳定在 B1 水平了，正好是这一章的难度。下次重点练一件事：每段结尾，试着用一次 is more than 接 it is 的写法。多练几次，你的句子会明显更地道。

## Why this works (for the skill author)

- WeChat style, not a display doc: flowing paragraphs, full-width Chinese punctuation, no emoji, no markdown bold/headers, no one-line-per-point. This is the DEFAULT (2026-06-13 correction: an emoji/markdown version read as 差很多).
- No sign-off: relayed student feedback does not get a 世杰 落款 (that is only for A-register messages 王世杰 sends as himself).
- Almost no quotes: English examples sit on their own line; Chinese strong points are stated plainly.
- No conceptual metaphor in the tutor's own writing: an earlier draft said 落差一出来结尾就有力气 and 句子质感往上走; both were cut for plain wording (更清楚、更好记). The feedback teaches clarity, so it must practice it. See `../../_shared/wechat-voice.md` rule 8 + memory `ps_writing_craft_principles`.
- 先肯定 first and specific (信息点全抓到了, 几乎复现模范答案).
- Every 招式 traces to the chapter (pt1 / pt2 from `usePatternIds`): their line, the upgraded line, why it is clearer.
- 范文 keeps the student's own words (iron rule `do_not_modify_student_content`): it restores the taught two-beat ending and fixes spacing, but changes no facts and rewrites no sentences wholesale.
- Zero em-dash.
