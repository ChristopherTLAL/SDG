// english-book-pipeline (dynamic Workflow)
//
// Generates English-learning BOOK chapters as drop-in `Article` .ts files for the
// /tools/english/books reader. One agent per chapter: research -> write -> tag
// vocab -> design grammar + patterns -> quiz -> self-validate -> write the .ts.
//
// Why a Workflow and not an Agent-tool fan-out (the old way):
//   - RESUME: a network drop only costs the one in-flight chapter. Relaunch with
//     Workflow({scriptPath, resumeFromRunId}) and every finished chapter returns
//     from cache instantly; only the dead one re-runs.
//   - A dead agent resolves to `null`, it does NOT kill the run. The other
//     chapters keep going; you resume to fill the gaps.
//   - Each agent self-validates via validate.py, so almost nothing bounces back
//     to the orchestrator.
//
// HOW TO RUN: read references/workflow-mode.md. Replace the DATA BLOCK below
// (inline the chapters; do NOT rely on `args` -- it is unreliable in this env),
// then call Workflow({script: <this file's contents>}). Iterate by editing the
// persisted scriptPath the tool returns and re-invoking Workflow({scriptPath}).

export const meta = {
  name: 'english-book-pipeline',
  description: 'Generate English-learning book chapters as drop-in Article .ts files; resumable under flaky networks',
  phases: [
    { title: 'Generate', detail: 'one agent per chapter: research, write, tag vocab, design grammar+patterns, quiz, self-validate via validate.py, write the .ts file' },
    { title: 'Fact-check', detail: 'a second agent verifies the hard facts in each chapter via WebSearch and surgically corrects verifiable errors, then re-validates' },
  ],
};

// ===========================================================================
// DATA BLOCK -- REPLACE PER RUN. Inline everything; do NOT use `args`.
// (Currently: Jay Chou ch.5-18, the full remaining batch on Sonnet + fact-check.)
// ===========================================================================
const BOOK = {
  id: 'jay-chou',
  cefr: 'B2',
  register: 'b-level',     // 'b-level' -> references/article-writing.md ; 'c-level' -> references/c-level-writing.md
  noListening: true,       // true -> omit listeningWriting AND meta.audioUrl (jay-chou has no audio)
  modelFile: 'src/data/english/books/jay-chou/01-son-of-the-sun.ts',  // gold-standard sample: copy its FORMAT/REGISTER/DEPTH, not its content
  agentModel: 'sonnet',    // 'sonnet' for bulk runs: cheaper + shorter generations survive flaky net better. Set undefined to inherit the session model (Opus) for max grammar/pattern depth.
};

// Shared avoid-list: every construction chapters 1-4 already taught. Each chapter
// appends a distinct fresh anchor so the 14 parallel chapters do not collide.
const AVOID = 'Chapters 1 to 4 already taught these grammar points, do NOT reuse any: past-perfect-for-background, "X rather than Y" contrast, relative clauses (who/that/when), "so that" purpose clauses, reduced passive relatives, "not X but Y", negative inversion ("Never before had"), sentence-initial "Yet", comma appositives, "Once [condition]" result clauses, fronting a place phrase to the front of the sentence, and "the + comparative, the + comparative". They already taught these patterns, do NOT reuse: "is never simply X, it is Y", a colon-reveal closer, an appositive "a [noun] meant to [purpose]", a "usually the norm; chose almost the opposite" opener, "stops feeling like X and starts feeling like Y", a semicolon series of parallel examples, a "with no [X] released ...: [reveal]" opener, a "set of permissions: X, Y, Z" tricolon, a "made a different judgment: perceived then behaved" pattern, a per-city data listing, a "the pattern repeated:" sentence, and a "less of an X and more of a Y" closer. Pick THREE FRESH grammar points and THREE FRESH patterns that arise naturally from your own text.';
const AV = (g, p) => AVOID + ' For THIS chapter, keep book-wide variety: lead your grammar with ' + g + ', and lead your patterns with ' + p + '. Fill the remaining grammar and pattern slots with other fresh constructions NOT in the list above. Every example must come from your own text.';

const CHAPTERS = [
  {
    order: 5,
    slug: '05-the-greatest-work-of-art',
    title: 'The Greatest Work of Art',
    angleZh: '2022 年专辑《最伟大的作品》，尤其是同名主打的 MV：它虚构了一场二十世纪初艺术家的相聚，把一支流行 MV 拍成了一堂流动的艺术史课。聚焦专辑与这支 MV 本身的艺术性，不泛讲他的复出。',
    angleEn: 'The 2022 album Greatest Works of Art, and above all its title-track music video, which stages an imagined meeting of early twentieth-century artists and turns a pop video into a kind of moving art-history lesson. Focus on the album and that video as art, not on his comeback in general.',
    searchTerms: ['周杰伦 最伟大的作品 MV 艺术家 钢琴 2022', 'Jay Chou Greatest Works of Art 2022 album title track video', 'Jay Chou Greatest Works of Art music video artists references'],
    avoidConstructions: AV('a wh-cleft ("What the video does is ...")', 'defining a term (what counts as a work of art) and then complicating it'),
  },
  {
    order: 6,
    slug: '06-east-wind',
    title: 'East Wind',
    angleZh: '「中国风」，那个成了他标志的融合风格：五声音阶旋律、二胡与古筝等传统乐器，叠在 R&B 与嘻哈的制作之上。看东方与西方如何在一首歌里相遇。',
    angleEn: 'Zhongguo Feng (China Wind), the fusion style that became his signature: pentatonic melodies and traditional instruments such as the erhu and guzheng layered over R&B and hip-hop production. How East meets West inside a single song.',
    searchTerms: ['周杰伦 中国风 二胡 古筝 五声音阶', 'Jay Chou Zhongguo Feng China Wind style erhu guzheng pentatonic', 'Jay Chou East West fusion Mandopop signature sound'],
    avoidConstructions: AV('an -ing participle clause for simultaneous action ("layering an erhu over a beat, he ...")', 'a "the kind of sound that ..." characterization'),
  },
  {
    order: 7,
    slug: '07-the-words-behind-the-music',
    title: 'The Words Behind the Music',
    angleZh: '方文山，那位用电影感、古典味的文字为许多歌曲赋予画面的词人。一位作曲者，与他最具画面感歌词背后那支笔之间的合作。',
    angleEn: 'Vincent Fang (Fang Wenshan), the lyricist whose cinematic, classically flavored words gave many of the songs their imagery. The partnership between a composer and the writer behind his most painterly lyrics.',
    searchTerms: ['方文山 周杰伦 作词 素颜韵脚诗 中国风', 'Vincent Fang Fang Wenshan Jay Chou lyricist collaboration', 'Jay Chou Fang Wenshan Chinese style lyrics cinematic imagery'],
    avoidConstructions: AV('the relative pronoun "whose" to attach a quality to a person', 'opening on a quotation (a single lyric line) as the hook'),
  },
  {
    order: 8,
    slug: '08-mojito',
    title: 'Mojito',
    angleZh: '2020 年的单曲《Mojito》，一首阳光、带古巴风味的歌，展现了一个更轻盈、年长了的周杰伦。一个以厚重精巧著称的歌手，如何在简单里找到了魅力。',
    angleEn: 'The 2020 single Mojito, a sunny, Cuban-flavored song that showed a lighter, older Jay Chou. How an artist known for heavy, intricate songs found charm in something simple.',
    searchTerms: ['周杰伦 Mojito 2020 古巴 单曲 哈瓦那', 'Jay Chou Mojito 2020 single Cuban Havana', 'Jay Chou Mojito light late career charm'],
    avoidConstructions: AV('the emphatic auxiliary "do/did" for stress ("he did keep one thing")', 'a before-and-after time pivot ("For years his songs were heavy. Then came something lighter.")'),
  },
  {
    order: 9,
    slug: '09-the-art-of-not-being-heard',
    title: 'The Art of Not Being Heard',
    angleZh: '他那著名的含糊、半吞半吐的咬字，起初被嘲笑，后来被视为刻意的签名。为什么「听不太清的演唱」成了魅力的一部分，而非缺陷。',
    angleEn: 'His famously slurred, half-swallowed diction, mocked at first and later treated as a deliberate signature. Why singing that is hard to make out became part of the appeal rather than a flaw.',
    searchTerms: ['周杰伦 咬字 含糊 唱腔 风格 争议', 'Jay Chou mumbling slurred diction singing style criticism', 'Jay Chou unclear enunciation signature vocal style'],
    avoidConstructions: AV('a concessive clause with "even as" or "although"', 'an "it is tempting to X, but Y" move'),
  },
  {
    order: 10,
    slug: '10-from-the-piano-bench',
    title: 'From the Piano Bench',
    angleZh: '那个受过古典训练的钢琴少年，如何成了自制唱片的作曲与编曲人：在当时罕见地，自己写、自己编、自己制作。从钢琴课到控制室。',
    angleEn: 'The classically trained pianist who became a self-producing composer and arranger, writing, arranging, and producing his own records when that was rare for a young artist. From piano lessons to the control room.',
    searchTerms: ['周杰伦 钢琴 古典 作曲 编曲 制作', 'Jay Chou classical piano training composer producer arranger', 'Jay Chou piano prodigy self produced records'],
    avoidConstructions: AV('an -ed participle clause as a sentence opener ("Trained as a pianist, he ...")', 'building to a number as the punchline'),
  },
  {
    order: 11,
    slug: '11-secret',
    title: 'Secret',
    angleZh: '2007 年的电影《不能说的秘密》，由周杰伦自编、自导、自演，一段围绕钢琴展开的穿越恋曲。他从音乐跨入电影的一步，以及那场成了招牌的「斗琴」。',
    angleEn: 'The 2007 film Secret, which Jay Chou wrote, directed, and starred in, a time-slipping romance built around a piano. His step from music into filmmaking, and the piano duel that became its signature scene.',
    searchTerms: ['不能说的秘密 周杰伦 电影 2007 斗琴', 'Jay Chou Secret 2007 film wrote directed piano duel', 'Jay Chou Secret movie time travel romance'],
    avoidConstructions: AV('a conditional (third or mixed: "if he had not ..., ... would have ...")', 'a circular ending whose final line echoes the opening image'),
  },
  {
    order: 12,
    slug: '12-songs-for-home',
    title: 'Songs for Home',
    angleZh: '《稻香》《听妈妈的话》这类温柔、扎根的歌，写的是家人、故乡与慢下来。一个以炫技著称的歌手，更安静的那一面。',
    angleEn: 'The gentle, rooted songs such as Rice Field and Listen to Mother, about family, home, and slowing down. The quieter side of an artist better known for spectacle.',
    searchTerms: ['周杰伦 稻香 听妈妈的话 歌词 家 母亲', 'Jay Chou Rice Field Dao Xiang Listen to Mom family songs', 'Jay Chou gentle songs home simple roots'],
    avoidConstructions: AV('a nominalization as a heavy subject ("His refusal to rush meant ...")', 'a list of concrete specifics that then lifts into one abstraction'),
  },
  {
    order: 13,
    slug: '13-the-ktv-king',
    title: 'The KTV King',
    angleZh: '他在华语世界 KTV 点歌簿上长达数十年的统治。为什么二十多年过去，一晚的 KTV 仍然绕回他的歌。',
    angleEn: 'His decades-long dominance of karaoke songbooks across the Chinese-speaking world. Why, more than twenty years on, a night at KTV still circles back to his songs.',
    searchTerms: ['周杰伦 KTV 点歌 必点 经典 合唱', 'Jay Chou KTV karaoke most sung songs', 'Jay Chou karaoke staple Chinese songbook decades'],
    avoidConstructions: AV('"Not only ... but also ..." with inversion', 'a "there are two kinds of X" framing'),
  },
  {
    order: 14,
    slug: '14-soundtrack-of-a-youth',
    title: 'The Soundtrack of a Youth',
    angleZh: '他的作品如何成了伴随一代人长大的青春怀旧配乐，以及「一整代人用他的专辑来标记自己的青春」意味着什么。',
    angleEn: 'How his catalogue became the nostalgia soundtrack for a generation that grew up with it, and what it means that a whole cohort dates its youth by his albums.',
    searchTerms: ['周杰伦 青春 怀旧 一代人 回忆', 'Jay Chou nostalgia generation youth soundtrack', 'Jay Chou music millennials growing up nostalgia China'],
    avoidConstructions: AV('the present perfect for present relevance ("his songs have become ...")', 'opening on one small anecdote, then zooming out to the thesis'),
  },
  {
    order: 15,
    slug: '15-streaming-the-phenomenon',
    title: 'Streaming the Phenomenon',
    angleZh: '出道数十年后，他在流媒体时代创下的纪录，以及围绕他的粉丝经济：每逢新歌或门票出现时的疯抢。老派巨星与新平台的相遇。',
    angleEn: 'His record-setting numbers in the streaming era and the fan economy around him decades after his debut, including the scramble whenever new music or tickets appear. Old-school stardom meeting new platforms.',
    searchTerms: ['周杰伦 流媒体 数字专辑 销量 纪录', 'Jay Chou streaming records digital album sales fan economy', 'Jay Chou QQ Music records fans streaming era'],
    avoidConstructions: AV('the passive voice used to shift focus onto the result ("the record was broken in hours")', 'a rhetorical question as the opener'),
  },
  {
    order: 16,
    slug: '16-mandopop-goes-global',
    title: 'Mandopop Goes Global',
    angleZh: '他如何帮助把华语流行带出华语市场，在亚洲乃至更远的地方吸引人群。一个从未改用英文演唱的巨星，影响力能走多远。',
    angleEn: 'How he helped carry Mandarin pop beyond Chinese-speaking markets, drawing crowds across Asia and at stops further afield. The reach of a star who never switched to singing in English.',
    searchTerms: ['周杰伦 海外 影响力 华语流行 国际 巡演', 'Jay Chou global international Mandopop reach overseas audiences', 'Jay Chou world tour international Mandarin pop'],
    avoidConstructions: AV('a comparative of the "not so much X as Y" or "no less ... than" kind', 'direct second-person address to the reader ("You have probably heard ...")'),
  },
  {
    order: 17,
    slug: '17-the-last-king',
    title: 'The Last King of an Era',
    angleZh: '「天王」现象，以及一种说法：在受众被互联网打散之前，他是一个时代最后的超级巨星。为什么如此多的注意力会汇聚到一个人身上。',
    angleEn: 'The "tian wang" (heavenly king) phenomenon, and the argument that he was the last superstar of an era before audiences fragmented across the internet. Why so much attention converged on one artist.',
    searchTerms: ['周杰伦 天王 时代 巨星 华语乐坛', 'Jay Chou tian wang heavenly king superstar era', 'Jay Chou last superstar pre-internet Mandopop'],
    avoidConstructions: AV('a fronted "Only when ..." or "Only after ..." with inversion', 'a "for all its X, Y" concession opener'),
  },
  {
    order: 18,
    slug: '18-the-inheritors',
    title: 'The Inheritors',
    angleZh: '他对追随其后那一代音乐人的影响：许多人在他的音乐中长大，如今作品里带着他的指纹。更年轻的华语流行，欠二十五年前那张出道专辑些什么。',
    angleEn: 'His influence on the generation of artists who followed, many of whom grew up on his music and now carry its fingerprints. What a younger Mandopop owes to one debut twenty-five years ago.',
    searchTerms: ['周杰伦 影响 新生代 音乐人 致敬', 'Jay Chou influence younger artists Mandopop generation', 'Jay Chou legacy new singers inspired by'],
    avoidConstructions: AV('a modal perfect of speculation ("might have ...", "would never have ...")', 'a "what X understood, and others did not, was Y" reveal'),
  },
];
// ===========================================================================

// Light, flat report schema (scalars + one string array). Deliberately NOT the
// heavy nested Article shape -- nested-array StructuredOutput tends to fail.
const REPORT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['order', 'slug', 'outputPath', 'ok', 'errors'],
  properties: {
    order: { type: 'integer' },
    slug: { type: 'string' },
    title: { type: 'string' },
    outputPath: { type: 'string' },
    ok: { type: 'boolean', description: 'true ONLY if validate.py finally printed {"ok": true}' },
    alreadyDone: { type: 'boolean', description: 'true if the chapter was already committed in git and was skipped (no regeneration)' },
    wordCount: { type: 'integer' },
    sentenceCount: { type: 'integer' },
    vocabCount: { type: 'integer' },
    validatorOutput: { type: 'string', description: 'the raw JSON line validate.py printed on the final attempt' },
    errors: { type: 'array', items: { type: 'string' }, description: 'unresolved problems; [] when ok' },
  },
};

function chapterPrompt(book, ch) {
  const registerRef = book.register === 'c-level'
    ? '.claude/skills/daily-english/references/c-level-writing.md'
    : '.claude/skills/daily-english/references/article-writing.md';
  const listeningClause = book.noListening
    ? 'This book has NO audio and NO listening apparatus. Do NOT add a listeningWriting field and do NOT set meta.audioUrl. End the object after quiz (with collocations: []).'
    : 'After the 7 steps add a listeningWriting field per references/listening-writing.md. Leave meta.audioUrl absent (the TTS script fills it later).';
  const outPath = 'src/data/english/books/' + book.id + '/' + ch.slug + '.ts';
  return [
    'You are ONE chapter of an English-learning book for the /tools/english/books reader. Working directory: /Users/shijie/Code/sdg-html',
    '',
    'IDEMPOTENCY (check FIRST): run `git ls-files --error-unmatch ' + outPath + '` via Bash. If it succeeds (exit 0, the file is already committed), this chapter is fully done. Return immediately with ok:true and alreadyDone:true (fill stats from the file if cheap, else 0), and do NO other work. Only if that command FAILS (file untracked or missing) do you proceed to generate below.',
    '',
    'Produce EXACTLY ONE chapter as a drop-in TypeScript Article file, then self-validate it. Your final answer is a StructuredOutput report (schema-enforced), NOT prose. The orchestrator sets your model; ignore any note in pipeline.md about which model you run on.',
    '',
    'CHAPTER',
    '  book id:    ' + book.id,
    '  cefr:       ' + book.cefr,
    '  order:      ' + ch.order,
    '  slug:       ' + ch.slug,
    '  title:      ' + ch.title,
    '  angle (zh): ' + ch.angleZh,
    '  angle (en): ' + ch.angleEn,
    '  outputPath: ' + outPath,
    '',
    'READ THESE FIRST (in order), then follow them exactly:',
    '  1. .claude/skills/daily-english/agents/pipeline.md        (the 7-step contract)',
    '  2. .claude/skills/daily-english/references/schema.md       (the TS shape)',
    '  3. .claude/skills/daily-english/references/style-guide.md  (no-em-dash + tone)',
    '  4. ' + registerRef + '   (CEFR-specific calibration)',
    '  5. .claude/skills/daily-english/references/vocab-tagging.md',
    '  6. .claude/skills/daily-english/references/grammar-design.md',
    '  7. .claude/skills/daily-english/references/pattern-design.md',
    '  8. ' + book.modelFile + '   (gold-standard sample: copy its FORMAT, REGISTER, and DEPTH, never its content)',
    '',
    'BOOK-CHAPTER DELTAS (vs a flat article):',
    "  - Import: import type { Article } from '../../types';   (two levels up, NOT ./types)",
    '  - meta.date = the REAL news/event date this chapter covers (must be <= today), found during research. NOT the chapter number.',
    '  - collocations: []',
    '  - ' + listeningClause,
    '',
    'RESEARCH: use WebSearch with 1-3 focused queries to ground facts, and especially DATES. Start from: ' + JSON.stringify(ch.searchTerms) + '. Do not over-research; most of this is stable cultural fact. Absorb context, do not cite.',
    '',
    'BOOK COHERENCE (variety): ' + (ch.avoidConstructions || 'Pick grammar and pattern constructions that arise naturally from your own text; do not force a particular one.'),
    '',
    'HARD RULES (validate.py rejects violations; do not produce them):',
    '  - NO em-dash character (U+2014) and NO doubled Chinese em-dash (U+2014 U+2014) in ANY field. Use commas, periods, colons, or parentheses. Hyphens in compounds like dark-sky are fine.',
    '  - Each vocab.word must match its sentence via the regex \\bword\\b, case-sensitive surface form (lending, not lend). Avoid choosing a sentence-initial word as vocab (capitalization breaks the match).',
    '  - vocab.level is an integer 1-4, spread across all four levels (at least two L1 and at least one L4).',
    '  - Counts: 18-22 vocab, 3 grammar, 3 patterns, 5 quiz. Match the DEPTH of the model sample (multi-paragraph explanationZh and whyItWorks).',
    '  - Grammar title and pattern useCase are learning-centered Chinese headlines, never linguistics jargon.',
    '',
    'QUOTING IN .ts STRINGS: straight ASCII quotes and Chinese full-width quotes are both fine in these data files. Watch apostrophes inside single-quoted strings (escape as \\\' or switch that string to double quotes). Be consistent.',
    '',
    'THEN SELF-VALIDATE (do not skip):',
    '  1. Write the file to outputPath with the Write tool.',
    '  2. Run: python3 .claude/skills/daily-english/scripts/validate.py ' + outPath,
    '  3. If it prints {"ok": false, ...}, read the errors, FIX the file, and re-run. Up to 3 attempts.',
    '  4. As a final check, grep your own file for the em-dash character to be certain none slipped in.',
    '',
    'RETURN the StructuredOutput report: order, slug, title, outputPath, ok (true only if validate.py finally printed "ok": true), wordCount, sentenceCount, vocabCount, validatorOutput (the final JSON line), errors (unresolved issues, else []).',
    '',
    'Do NOT commit, push, deploy, or edit any file other than outputPath. Do NOT update topics.json.',
  ].join('\n');
}

// Fact-check stage report: light + flat. Lists exactly what was changed.
const FACTCHECK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['order', 'slug', 'validatorOk', 'corrections'],
  properties: {
    order: { type: 'integer' },
    slug: { type: 'string' },
    claimsChecked: { type: 'integer', description: 'how many discrete factual claims were verified' },
    corrections: { type: 'array', items: { type: 'string' }, description: 'each: "claim: was X, now Y (source/reason)"; [] if nothing was wrong' },
    unresolved: { type: 'array', items: { type: 'string' }, description: 'plausible claims that could not be confirmed or denied; left as-is and flagged' },
    validatorOk: { type: 'boolean', description: 'validate.py still passes after the edits' },
  },
};

function factCheckPrompt(book, ch, gen) {
  const outPath = (gen && gen.outputPath) || ('src/data/english/books/' + book.id + '/' + ch.slug + '.ts');
  return [
    'You are a FACT-CHECKER for one chapter of an English-learning book. Working directory: /Users/shijie/Code/sdg-html',
    'A chapter file was just written by another agent. Verify its HARD FACTS against real sources, correct ONLY verifiable errors, then re-validate. Your final answer is a StructuredOutput report, NOT prose.',
    '',
    'FILE:  ' + outPath,
    'TOPIC: ' + ch.title + ' -- ' + (ch.angleEn || ''),
    '',
    'STEP 1 -- Read the file and list every HARD factual claim: people, songs, albums, films, places; dates; numbers (sales, attendance, chart positions, counts, money); a song or track position on an album; who-wrote/produced/directed-what; and superlatives ("the first", "never before", "highest-grossing", "only"). Ignore opinions, prose style, translation quality, and the teaching framing.',
    '',
    'STEP 2 -- Verify each claim with WebSearch (WebFetch if needed). Be most skeptical of the details that are easy to get wrong: a track\'s position in an album, exact release dates, exact figures, attribution of credit, and superlatives.',
    '',
    'STEP 3 -- Correct ONLY claims you can show are wrong. This is surgical fact-correction, NOT a rewrite:',
    '  - Change the minimum words needed to make the fact true, in BOTH the English and the paired zh of that sentence.',
    '  - If the same wrong fact also appears inside a grammar/pattern explanation or example, fix it there too so they stay consistent.',
    '  - If a claim is plausible but you cannot confirm it, do NOT change it; put it under unresolved.',
    '  - Do NOT alter: sentence IDs, the number of sentences, any vocab.word (each must still appear in its sentence via the regex \\bword\\b), the vocab/grammar/pattern/quiz counts, or the register. If a needed fix would drop a vocab word from its sentence, rephrase so the word stays, or repoint that vocab entry to a different word that is present.',
    '  - NEVER introduce an em-dash (U+2014) or a doubled Chinese em-dash. Use commas, periods, or colons.',
    '',
    'STEP 4 -- Re-run: python3 .claude/skills/daily-english/scripts/validate.py ' + outPath,
    '  If it prints {"ok": false}, you broke something during editing; fix until it prints {"ok": true}. Also grep the file for the em-dash character to be sure none slipped in.',
    '',
    'RETURN the report: order=' + ch.order + ', slug=' + JSON.stringify(ch.slug) + ', claimsChecked (int), corrections (array of "claim: was X, now Y (why)", or [] if none), unresolved (array of claims you could not confirm), validatorOk (true ONLY if validate.py finally printed ok:true).',
    '',
    'Do NOT commit, push, or edit any file other than ' + outPath + '. Keep every change minimal and strictly factual.',
  ].join('\n');
}

function genOpts(ch) {
  const o = { label: 'gen:ch' + ch.order, phase: 'Generate', agentType: 'general-purpose', schema: REPORT_SCHEMA };
  if (BOOK.agentModel) o.model = BOOK.agentModel;
  return o;
}
function factOpts(ch) {
  const o = { label: 'fact:ch' + ch.order, phase: 'Fact-check', agentType: 'general-purpose', schema: FACTCHECK_SCHEMA };
  if (BOOK.agentModel) o.model = BOOK.agentModel;
  return o;
}

phase('Generate');
log('Producing ' + CHAPTERS.length + ' chapter(s) for "' + BOOK.id + '" (' + BOOK.cefr + ', register=' + BOOK.register + ', model=' + (BOOK.agentModel || 'session-default') + '): generate -> fact-check, pipelined.');

// Pipeline: each chapter flows generate -> fact-check independently (no barrier).
// A chapter whose generation failed skips fact-check and passes through.
const results = await pipeline(
  CHAPTERS,
  (ch) => agent(chapterPrompt(BOOK, ch), genOpts(ch)),
  (gen, ch) => {
    if (!gen || !gen.ok) return { gen: gen, fact: null, skippedFactCheck: true };
    if (gen.alreadyDone) return { gen: gen, fact: null, alreadyDone: true };
    return agent(factCheckPrompt(BOOK, ch, gen), factOpts(ch)).then((fact) => ({ gen: gen, fact: fact }));
  }
);

const rows = results.filter(Boolean);
const shipReady = rows.filter((r) => r.gen && r.gen.ok && (!r.fact || r.fact.validatorOk !== false));
const withCorrections = rows.filter((r) => r.fact && r.fact.corrections && r.fact.corrections.length);
const nulls = CHAPTERS.length - rows.length;
log('Pipeline done: ' + shipReady.length + ' ship-ready, ' + withCorrections.length + ' had fact corrections, ' + nulls + ' agent-null (resume to refill nulls).');

return {
  book: BOOK.id,
  requested: CHAPTERS.length,
  chapters: rows.map((r) => ({
    order: r.gen && r.gen.order,
    slug: r.gen && r.gen.slug,
    title: r.gen && r.gen.title,
    outputPath: r.gen && r.gen.outputPath,
    wordCount: r.gen && r.gen.wordCount,
    generated: !!(r.gen && r.gen.ok),
    factChecked: !!r.fact,
    validatorOk: r.fact ? r.fact.validatorOk : !!(r.gen && r.gen.ok),
    claimsChecked: r.fact && r.fact.claimsChecked,
    corrections: (r.fact && r.fact.corrections) || [],
    unresolved: (r.fact && r.fact.unresolved) || [],
    genErrors: (r.gen && r.gen.errors) || [],
  })),
  agentNull: nulls,
};
