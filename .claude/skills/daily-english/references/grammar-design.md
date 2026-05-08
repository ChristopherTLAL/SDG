# Grammar entry design

The grammar tab is where the article earns its keep as a learning tool. Each entry is a **deep dive**, not a flashcard. Default to ~3-4 entries per article.

## Pick grammar that the article actually uses

Don't teach grammar in the abstract. Pick constructions that **appear in the article body**, ideally in interesting or non-obvious ways. Each entry's `sentenceIds` should point to one or more sentences in the article that exemplify the structure.

Good candidates per CEFR:

### A2-B1
- Present perfect (have done) for life experience
- Present perfect continuous (have been doing) for ongoing actions
- Causative `let` / `make` / `have` + bare infinitive
- First conditional (`If X happens, Y will...`)
- Phrasal verb + idiomatic meaning (`wear out`, `give up`, `pick up`)
- Reduced infinitive after `is willing to`, `tend to`, `seem to`
- Concession with "Of course... Still..." or "Although..."
- Equative metaphor (`X is a kind of Y`)

### B2
- What-cleft (`What was lost is...`) for emphasis
- Reduced relative clauses (past participle: `proposals drafted in haste`)
- Inversion after negative adverbials (`Rarely has the country seen...`)
- Concessive `Yet` at sentence start
- "It is a strange irony of X that Y" rhetorical move
- Present perfect continuous for the start-of-an-article time anchor
- Apposition with commas (`X, a side effect of Y, has...`)

### C1-C2
- Subjunctive `were it not for...` / `had it been...`
- Cleft variations (it-cleft, what-cleft, all-cleft, the-thing-cleft)
- Nominalization for academic register
- Fronted adverbials with comma resumption
- Hypothetical conditionals with mixed time reference

## Title (the headline a student reads)

The `title` field is **NOT** the linguistic name. It answers "what does this help me write?".

| Don't | Do |
|---|---|
| What-cleft for emphasis | 把焦点放在"东西"上，而不是"谁做的" |
| Past-participle reduced relative clauses | 把 "who/which is" 省掉，让句子更紧 |
| Concessive "Yet" at sentence start | 用 Yet 起句，比 But 更克制，更书面 |
| Causative "let" + bare infinitive | 用 "let" 让句子说"让人做某事" |
| Equative metaphor with "a kind of" | 用 "a kind of" 把一个东西归到一个范畴里 |

The technical name still appears as the `pattern` field (a small code-style label below the title).

## explanationZh — the deep dive (3-5 paragraphs)

This is the meat of the entry. Aim for **3-5 paragraphs**, each ~80-120 Chinese characters. The structure that works:

**Paragraph 1 — what's the alternative, why this matters**
Set up the comparison. "正常英文语序习惯把...放在最前面..., 但当你想强调...". Show the student the contrast first, then introduce the construction.

**Paragraph 2 — quote the article + explain the choice**
Anchor in the article. Quote the relevant sentence (or refer to it). Explain why the writer chose this construction over the alternative. The student should feel "ahh, I see what they did there."

**Paragraph 3 — when to deploy this**
Generic register / situation guidance. "议论文段落开头用它..." / "新闻报道开篇好用..." / "正式书面，避免在口语里硬塞". Give the student a deployment intuition.

**Paragraph 4 (optional) — a subtle technical note**
Things like agreement (singular `is` after `what`-clause), word-order constraints, special restrictions. The kind of thing the student gets wrong without being told.

Length is a feature. Short explanations read like flashcards; long explanations read like a teacher. Err long.

## examples — 4-6 worked examples

Each example is `{ en, zh?, note? }`.

- **4 minimum**, 5-6 ideal. Not 2.
- Each example shows the structure in a **different context** — don't write 4 variations of the same scenario.
- The `note` field, when present, names what's interesting about THAT specific example. Use it sparingly — if every example has a note, the notes lose meaning. 1-2 examples with a note is the right density.

| Don't | Do |
|---|---|
| 4 examples about the same topic with the same vibe | 1 personal narrative, 1 op-ed line, 1 academic register, 1 with a clever twist |
| `note: 'good example'` | `note: '搭配 not X but Y 形成对比修辞，力度翻倍。'` |

## commonMistake — optional callout

Use when there's a **specific Chinese-learner trap**. Don't write it just to fill the field.

Examples of when to write:
- After-cleft `is`/`are` agreement (`What we lost is...`, NOT `are`)
- `let` + `to V` (drop the `to`)
- Phrasal verb word order (`pick up the phone` vs. `pick the phone up`)

When you write one, lead with the wrong version, then the right version. The student remembers contrast better than rule.

## vsSimilar — optional callout

Use when there's another construction the student might confuse this with. Compare them in 2-3 lines.

Examples:
- `What-cleft` vs `It-cleft` (both emphasize, but different units)
- `However` vs `Yet` vs `Still` vs `Nevertheless` (all roughly synonyms, different registers)
- `make` vs `have` vs `let` vs `allow X to V` (causative chain, different intensities)

## A complete example (B2 grammar entry)

```ts
{
  id: 'g1',
  title: '把焦点放在"东西"上，而不是"谁做的"',
  pattern: 'What [clause] is/was [emphasis]',
  sentenceIds: ['s5'],
  explanationZh: [
    '正常英文语序习惯把动作的执行者（subject）放在最前面：The town lost its summer trade. 这种语序平稳，但当你真正想强调的是"失去了什么"，主词位置就被执行者占走了。',
    '这个句式（What-cleft）把主词位置交给一个 what-clause，让句子的第一个停顿就把"事物"立住。文章里 "But what was lost is now becoming a luxury." 没有写 "The thing we lost is now a luxury"，因为前者书面、有节奏；what 这个词本身带一种"请你留意"的语气。',
    '议论文 / 散文里非常顺手，段落开头用它，立刻把读者的注意力锁在你想强调的那个名词上，再去展开。',
    '注意：what-clause 后面接单数 is/was（即便 clause 实际指多个事物），因为 what-clause 整体被视为 "the thing(s) which..."，语法上是单数主语。',
  ],
  examples: [
    { en: 'What surprised me most was how quiet the room had become.', zh: '最让我意外的，是房间变得多么安静。', note: '把"感到意外"这件事拉到主词位置，比 I was surprised by ... 更聚焦。' },
    { en: 'What this generation has lost is the patience for slow reading.', zh: '这一代人失去的，是慢读的耐心。', note: '议论文段落开头标准用法。' },
    { en: 'What the policy ignores is not the cost but the timing.', zh: '这项政策忽略的，不是成本，而是时机。', note: '搭配 not X but Y 形成对比修辞，力度翻倍。' },
    { en: 'What I admire in her writing is the absence of pretense.', zh: '我欣赏她写作中的，是那份不做作。' },
    { en: 'What changed everything was a single phone call.', zh: '改变一切的，是一通电话。', note: '叙事 / 报道里用来制造转折。' },
  ],
  commonMistake: '不要写成 "What we lost are now luxuries"，即便意指多个事物，is/was 始终单数。要表达复数主语，换成 "The things we lost are now luxuries"。',
  vsSimilar: 'It-cleft（"It is X that..."）也用于强调，但它强调的是具体名词 X；what-cleft 强调的是 整一个 clause 的内容（"我们失去的东西"）。前者锐利，后者更含蓄、更修辞化。',
}
```

This is the depth target. Match it.
