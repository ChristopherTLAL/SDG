# Pattern entry design

Patterns are reusable **sentence-level skeletons** the student can borrow for their own writing. The grammar tab teaches "what is happening grammatically"; the patterns tab teaches "how do I deploy this in my own writing". They are different kinds of lesson and complement each other.

Default 3-4 patterns per article.

## What counts as a pattern

A pattern is a sentence-shaped skeleton with **rhetorical force** that the writer chose. Not a grammar rule. Not a single word.

Good pattern candidates:
- A bicolon with parallel structure (`What X did, Y can also do`)
- A move that combines clauses with a specific effect (`A is a kind of B. And B, in its own way, can C.`)
- A signature opener / closer (`For about ten years, X has been Y...`)
- A rhetorical question reframed as statement (`It is a strange irony of X that Y`)
- An intensifier construction (`X is willing to A, even B, to C`)

Bad pattern candidates:
- Simple grammar (covered in the grammar tab)
- A vocabulary item or collocation (covered in vocab)
- Generic structures with no rhetorical lift (`X is Y` — that's just a sentence, not a pattern)

## useCase — the headline

The `useCase` field is **what the student wants to express**. Phrase it as the situation, intent, or effect — not the structure name.

| Don't | Do |
|---|---|
| `Bicolon with parallel structure` | `收尾金句：先承认错误，再提出可行的小步行动` |
| `What-cleft as opener` | `命名一个新现象，把它装进有节奏的开篇句` |
| `Concessive transition` | `先承认对方观点（Of course），再用 Still 转折` |
| `Intensifier with even` | `用 even 把第二个代价"升级"上去` |

The student reads the useCase, knows immediately whether they need this lesson today, and clicks if interested.

## skeleton — the abstract template

The skeleton uses `[X]`, `[verb-ing]`, `[clause]`, etc., as slots. Keep slot names descriptive; the student should be able to fill them without re-reading the explanation.

| Bad slot names | Good slot names |
|---|---|
| `[X]`, `[Y]`, `[Z]` | `[domain]`, `[observation]`, `[verb-1]`, `[unit]` |
| `[noun]` (without context) | `[obvious benefit]`, `[abstract concept]` |

## original — the article quote

The verbatim sentence from the article that exemplifies the pattern. Italicized in the front-end. **Must match the article body byte-for-byte** (otherwise the front-end can't link to it).

## whyItWorks — multi-paragraph rhetorical analysis

This is what separates a pattern entry from a grammar entry. You're explaining **why this construction has the effect it has** — the reading experience, the rhythm, the implicit promise made to the reader. 3-4 paragraphs, each ~80-120 Chinese characters.

Structure:

**Paragraph 1 — the rhythm or contrast**
What's the structural mechanic? Often it's a contrast between two parts of the sentence (size of [X] vs. simplicity of [verb-ing], familiar word vs. strange-but-true claim, etc.).

**Paragraph 2 — the implicit promise**
What does this construction signal to the reader? Confidence? Surprise? Restraint? Why does the reader trust it?

**Paragraph 3 — when this works best**
Genre / context fit. Op-ed closer? Report opener? Personal essay middle? Academic register? Help the student place the pattern.

**Paragraph 4 (optional) — a non-obvious detail**
A subtle constraint that makes the pattern work — and breaks if you violate it.

## examples — 3-5 worked deployments WITH context

Each example is `{ context, text, zh?, note? }`.

- `context` is a brief setup (`写一篇慢食运动的引言`, `申请文书里写为什么愿意做某事`, `公益倡议结尾`). It anchors the example in a real writing situation.
- `text` is the deployed pattern in that context.
- `zh` is the Chinese translation of the text (recommended).
- `note` is optional teaching commentary; use sparingly.

Pick contexts the student will plausibly write in:
- Op-ed / commentary
- Personal essay (申请文书)
- News report opener
- Persuasive piece
- Reflection / book review
- Academic abstract

Don't use 3 examples about the same topic. Vary contexts so the student sees the pattern's range.

## adaptingTip — the practical guidance

This is the long form of `useCase`. ~80-150 Chinese characters. Tell the student **how to bend this pattern to their own writing**:

- What kind of words go in each slot (`[X] 一定要选有重量感的词，别用 trend / fad 这种轻飘的词`)
- What strength differential matters (`第二个 action 必须明显比第一个更"非分"`)
- Where in the article to use it (`这是评论文 / 倡议性文章的结尾模板`)
- What variations are okay (`one X at a time 的 X 一定要是一个具体、可执行的小单位`)

Avoid generic advice (`be sure to use this carefully`). Specific. Actionable.

## commonMistake — optional callout

Use when there's a specific way the pattern fails when adapted. Lead with the wrong version, then the right.

Examples:
- Pattern fails when slots aren't strong enough: `如果 [verb-ing] 已经是一个明显复杂的动作（programming, investing），整个反差就失效。`
- Pattern fails when used out of context: `这个句式情绪含量很高，不适合中间段落。它是收尾用的，用得太早，会让后续论证显得多余。`
- Pattern fails grammatically: `even 后面接的动词要和 to 之后的动词形式对齐（保持光秃 infinitive 形式）。`

## A complete example (B2 pattern entry)

```ts
{
  id: 'pt3',
  useCase: '为整篇文章给出一个反讽式的情感落点',
  skeleton: 'It is a strange irony of [domain] that [observation].',
  original: 'It is a strange irony of modern life that what we once shared as common heritage, a sky full of stars, has become a destination.',
  sentenceId: 's23',
  whyItWorks: [
    '这个句式的关键不在描述事实，而在给事实"命名"。当你把矛盾命名为 irony，读者立刻被请进一个反思的角度，你不是在说"X 现在变成了 Y"，你是在说"X 居然变成了 Y，而且这件事本身值得品味"。',
    '"a strange irony" 用 strange 作修饰，比单说 irony 更柔和、更具有人性，它不指控，只是邀请读者一起看这个矛盾。',
    'of [domain] 把这个 irony 锚定在一个明确的语境里（modern life / our age / today\'s economy / contemporary politics），让读者知道讨论的范围。',
    '[observation] 部分通常是一个对比性的陈述。本文里就是 "what we once shared ... has become a destination"，把"曾共有"与"现在是目的地"这个对比写出来。',
  ],
  examples: [
    { context: '评论科技和孤独', text: 'It is a strange irony of digital life that the more connected we are, the lonelier we feel.', zh: '数字生活的一种奇妙讽刺是：我们连接得越紧密，反而越孤独。' },
    { context: '讨论教育普及', text: 'It is a strange irony of mass education that students now have access to everything and patience for almost nothing.', zh: '大众教育的一种奇妙讽刺是：学生现在能接触到一切，却几乎对一切都没有耐心。' },
    { context: '环境议题文章结尾', text: 'It is a strange irony of environmental thinking that we praise the wild while paving over the last of it.', zh: '环境思维的一种奇妙讽刺是：我们一边赞美原野，一边把最后剩下的也铺成水泥。' },
  ],
  adaptingTip: '这个句式适合点题 / 收尾，不适合开头（开头用它显得过早下结论）。建议留到全文 80% 以后用，让读者已经被你的论证带到一个能"看出 irony"的位置。',
  commonMistake: '[observation] 部分要写成一个有内在矛盾的陈述。如果只是普通描述（如 "It is a strange irony of modern life that we have many cars"，这只是描述，没有 irony），整个句式就没有意义。',
}
```

This is the depth target. Match it.

## How patterns differ from grammar

| Grammar entry | Pattern entry |
|---|---|
| Teaches a structure (what-cleft, reduced relative) | Teaches a rhetorical move |
| `title` is "把焦点放在'东西'上" | `useCase` is "命名一个新现象，把它装进有节奏的开篇句" |
| `pattern` is the schema (`What [clause] is/was [emphasis]`) | `skeleton` is the deployable template |
| `examples` show the structure in different sentences | `examples` show the pattern deployed in different writing contexts |
| `commonMistake` / `vsSimilar` callouts | `adaptingTip` (always) + `commonMistake` (optional) |

You can have grammar and patterns that overlap (e.g., what-cleft as both a grammar entry and a pattern entry) — but if you do, give them different angles. Grammar tells the student how to construct it. Patterns tell the student when and why to deploy it.
