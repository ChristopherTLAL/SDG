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

## Shape of a pattern entry (NOT the content)

The structure your entry should follow. **Do not copy any of these placeholder texts or any examples from the reference docs — pick patterns from YOUR article's actual rhetoric and write fresh worked examples.**

```ts
{
  id: 'pt<N>',
  useCase: '<student-facing intent: "what helps me write" — derived from THIS pattern as it appears in YOUR article>',
  skeleton: '<deployable template with [slot] placeholders>',
  original: '<the verbatim sentence from YOUR article that exemplifies this pattern — must match byte-for-byte>',
  sentenceId: '<the sentenceId that quote came from>',
  whyItWorks: [
    '<paragraph 1: the structural mechanic — what contrast or rhythm makes this work>',
    '<paragraph 2: the implicit promise — what does the reader trust about the writer when they see this>',
    '<paragraph 3: when this works best — genre / context / position in a piece>',
    '<paragraph 4 (optional): a subtle constraint that makes the pattern break if violated>',
  ],
  examples: [
    // 3-5 worked deployments. Each `text` MUST be a sentence YOU write fresh.
    // Each `context` should be a real writing situation (op-ed,申请文书, news report
    // opener, reflection piece, etc). Vary contexts so the student sees the pattern's
    // range. Do not lift any sentence from these reference docs or from other articles
    // in src/data/english/.
    { context: '<situation 1>', text: '<your sentence 1>', zh: '<translation>' },
    { context: '<situation 2>', text: '<your sentence 2>', zh: '<...>' },
    // ...
  ],
  adaptingTip: '<longer practical guidance: what kind of words go in each slot, what strength differential matters, where in the article to use it>',
  commonMistake: '<optional: a specific way the pattern fails when adapted>',
}
```

## Quality bar (objective)

Your entry passes if a Chinese learner could:
1. Tell what writing situation calls for this pattern
2. Adapt the skeleton to a different topic without losing its rhetorical force
3. Recognize the pattern in another writer's prose

If the entry feels like a generic writing tip ("be specific!"), it's too thin. If it walks the student through *why this construction has the effect it has*, it's at the right depth.

## How patterns differ from grammar

| Grammar entry | Pattern entry |
|---|---|
| Teaches a structure (what-cleft, reduced relative) | Teaches a rhetorical move |
| `title` is "把焦点放在'东西'上" | `useCase` is "命名一个新现象，把它装进有节奏的开篇句" |
| `pattern` is the schema (`What [clause] is/was [emphasis]`) | `skeleton` is the deployable template |
| `examples` show the structure in different sentences | `examples` show the pattern deployed in different writing contexts |
| `commonMistake` / `vsSimilar` callouts | `adaptingTip` (always) + `commonMistake` (optional) |

You can have grammar and patterns that overlap (e.g., what-cleft as both a grammar entry and a pattern entry) — but if you do, give them different angles. Grammar tells the student how to construct it. Patterns tell the student when and why to deploy it.
