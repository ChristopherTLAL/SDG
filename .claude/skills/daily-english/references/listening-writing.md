# Step 8: Listening + Writing (book chapters only)

Flat daily articles skip this step. Book chapters add a `listeningWriting` field
to the `Article` object. It powers the reader's 听·填·写 (Listen · Fill · Write)
mode: the student plays the chapter audio, fills an info-gap table by extracting
facts, then uses the completed table as a scaffold to write, reusing the
chapter's own sentence patterns.

This is the listening↔writing loop. Design it so all three steps reinforce each
other and every answer is anchored in the passage.

## Shape

```ts
listeningWriting: {
  infoGap: [
    {
      id: 'ig1',
      cueZh: '专辑预计发行的月份',          // Chinese cue: WHAT fact to find
      answer: 'May',                       // the English value, extractable from the audio/text
      sentenceId: 's3',                    // the sentence where this fact lives
      prefilled: true,                     // OPTIONAL: give 1 row as a worked example
    },
    // ...5-8 rows total
  ],
  writing: {
    promptZh: '用表格里的信息，写一段约 60 词的短文，介绍 aespa 这次回归的看点。',
    promptEn: 'Using the facts in your table, write about 60 words on what makes this aespa comeback worth watching.',
    targetWords: 60,
    starters: ['After a long wait, ...', 'What makes this comeback special is ...'],
    usePatternIds: ['pt1', 'pt2'],         // 2-3 pattern ids FROM THIS chapter to reuse
    modelAnswer: 'After a long wait, aespa is finally back ...',  // ~targetWords, uses the patterns + facts
    modelAnswerZh: '等了很久之后，aespa 终于回归……',           // optional
  },
}
```

## Rules for the info-gap table (5-8 rows)

- Answers are **short, extractable facts**: numbers, dates, names, places, short
  noun phrases. This is IELTS table-completion, not comprehension prose. Never a
  full sentence.
- Every `answer` must be **stated in or directly derivable from** its
  `sentenceId` sentence. The reader self-checks against `answer` and the
  "reveal in text" button highlights `sentenceId`, so a wrong `sentenceId`
  breaks the feature.
- Match the surface wording where reasonable so a listener can catch it. If the
  sentence says "about eleven months", `answer: 'eleven months'` (or 'about
  eleven months') is fine; 'almost a year' is not.
- Order rows in the sequence the facts appear in the passage (so the student can
  fill while listening straight through).
- Mark exactly **one** row `prefilled: true` as a worked example (the easiest /
  first one), unless the chapter is very short.
- Spread the rows across the passage, not all from one paragraph.

## Rules for the writing task

- `promptZh` + `promptEn`: one concrete task that **consumes the table facts**
  ("use the facts in your table to ..."). Keep it to one paragraph of output.
- `targetWords`: 50-80 for B1.
- `usePatternIds`: list 2-3 `id`s of patterns you wrote in THIS chapter's
  `patterns` array. The reader surfaces those pattern cards as required
  structures, so they must exist.
- `starters`: 2-3 sentence openers (optional but recommended for B1).
- `modelAnswer`: a real ~`targetWords` paragraph that (a) uses the listed
  patterns, (b) draws on the info-gap facts, (c) has NO em-dashes. The student
  compares against it after attempting. `modelAnswerZh` optional.

## QA before you ship this field

- Each `infoGap[].sentenceId` exists in `paragraphs`.
- Each `infoGap[].answer` is genuinely findable in that sentence.
- Each `writing.usePatternIds[]` matches a real `patterns[].id`.
- `modelAnswer` actually deploys those patterns and stays em-dash-free.
