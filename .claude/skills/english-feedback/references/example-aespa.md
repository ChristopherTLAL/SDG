# Worked example: 初二, Giselle book Ch.1 Listen & Write

The canonical example to imitate. Two things to notice: the feedback is grounded in the chapter (it names patterns `pt2` and `pt1` from `usePatternIds` and shows the student skipped both), and it is written in the WeChat style by default: flowing paragraphs, no emoji, no markdown, almost no quotes, zero em-dash, signed 世杰.

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

> 这次 aespa 那段写得挺好,该有的信息一个没落:四人团、Giselle 是主 rapper、SM、第二张正规专辑、五月、还有 KWANGYA 这个设定,顺序清楚,听得很认真。下面几个地方调一调,就能更上一档,都不难。
>
> 最值得说的是结尾。你现在写的是 This comeback is a promise that aespa is here to stay,这句本身就不错,只是课文教的那个招式你只用了一半。完整的写法是两拍:
>
> This comeback is more than new songs. It is a promise that aespa is here to stay.
>
> 先说它不只是表面那一层,也就是新歌,停一下,再点出它真正的分量,一个承诺。先小后大,落差一出来,结尾立刻有力气。这个 is more than 后面接 it is 的结构,以后写读后感、写作文结尾都好用,你只差把前半句补回去。
>
> 开头也能再讲究一点。你写 Fans love their cool story,意思到了,但读着有点像聊天。课文给的说法更稳:Part of what makes the group special is their story。一个 part of 就显得你很沉着,像在说原因还不止一个,一上来就有点小作家的味道。
>
> 还有个最快见效的小习惯,英文标点后面要空一格。你有几处粘在一起了,比如 group 后面那个逗号、rapper 后面那个句号、还有 May 和 Fans 中间,中文标点不用空格,但英文的句号逗号后面都得空,这条改完整段会清爽很多。
>
> 再顺手说三个小知识。一是你写 album, hoped to come out in May,读起来有点像专辑自己在期待,其实英文里 -ed 短语贴着哪个名词就是在描述那个名词,这里期待的是 SM,写成 which they hope to release in May 会更顺。二是 aespa 其实是官方故意全小写的,跟 adidas、iPhone 一样,是品牌的个性,除了句首平时都写小写。三是 cool 这个词可以换得更准,那个故事不只是酷,它是一整个虚拟世界的设定,想夸它可以用 unique 或者 imaginative。
>
> 把你自己的话稍微调一下,基本没动你写的内容,就成了这样:
>
> aespa is a four-member K-pop group, and Giselle is their main rapper. In 2026, SM announced their second studio album, which they hope to release in May. Part of what makes the group special is their story, where each member has an avatar in an online world called KWANGYA. This comeback is more than new songs. It is a promise that aespa is here to stay.
>
> 整体已经稳稳在 B1 了,正好是这一章的水平。下次先盯一个小目标:每段结尾,试着用一次 is more than 接 it is 的两拍写法,练顺了句子的质感会明显往上走。
>
> 世杰

## Why this works (for the skill author)

- WeChat style, not a display doc: flowing paragraphs, no emoji, no markdown bold/headers, no one-line-per-point. This is the DEFAULT, not an afterthought (2026-06-13 correction from the user: an emoji/markdown version read as "差很多").
- Almost no quotes: English examples sit on their own line; Chinese strong points are stated plainly, not wrapped in 引号.
- 先肯定 first and specific (信息点全抓到了, 几乎复现模范答案).
- Every 招式 traces to the chapter (pt1 / pt2 from `usePatternIds`): their line, the upgraded line, why it is stronger.
- 范文 keeps the student's own words (iron rule `do_not_modify_student_content`): it restores the taught two-beat ending and fixes spacing, but changes no facts and rewrites no sentences wholesale.
- Zero em-dash. Signed 世杰.
