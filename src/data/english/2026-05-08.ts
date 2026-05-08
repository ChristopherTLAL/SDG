// B1 sample — friendly, plain prose, mostly CET4 vocabulary.
import type { Article } from './types';

export const article: Article = {
  meta: {
    date: '2026-05-08',
    title: 'Why Some Libraries Now Lend Tools, Not Just Books',
    source: { name: 'Atlas Obscura (sample)', url: 'https://www.atlasobscura.com/' },
    cefr: 'B1',
    wordCount: 287,
    readingMinutes: 4,
    editorsNote:
      'A friendly B1-level piece on the spread of tool-lending libraries — short sentences, mostly CET4 vocabulary, a few CET6 phrasal verbs (wear out) and softly idiomatic adverbs (steadily). Watch the rhetorical move at the end where the writer turns the tool-as-metaphor.',
  },
  paragraphs: [
    {
      id: 'p1',
      sentences: [
        { id: 's1', en: 'At a small library in Berkeley, California, the most popular item is not a book.', zh: '在加州伯克利的一家小图书馆里，最受欢迎的东西并不是书。' },
        { id: 's2', en: 'It is a power drill.', zh: '而是一把电钻。' },
        { id: 's3', en: 'For about ten years, the library has been lending tools to its members, the same way it lends novels.', zh: '过去十年里，这家图书馆一直把工具借给会员，就像借小说一样。' },
        { id: 's4', en: 'Today, more than 500 libraries around the world have started doing the same thing.', zh: '如今，全世界已有超过 500 家图书馆开始这么做。' },
      ],
    },
    {
      id: 'p2',
      sentences: [
        { id: 's5', en: 'The idea is simple.', zh: '想法很简单。' },
        { id: 's6', en: 'Many people only need a tool once or twice a year.', zh: '很多人一年只用一两次工具。' },
        { id: 's7', en: 'Buying a drill, a ladder, or a saw can be expensive, and most homes do not have enough space to store them.', zh: '买电钻、梯子或锯子可能很贵，而大多数家里也没有足够的地方存放。' },
        { id: 's8', en: 'A "tool library" lets people borrow what they need, use it, and bring it back.', zh: '"工具图书馆"让人们借走所需的工具，用完再还回来。' },
      ],
    },
    {
      id: 'p3',
      sentences: [
        { id: 's9', en: 'The benefits go beyond saving money.', zh: '它的好处不仅仅是省钱。' },
        { id: 's10', en: 'When fewer tools are made and bought, less waste is produced.', zh: '工具被生产和购买得少了，垃圾也就少了。' },
        { id: 's11', en: 'People also share knowledge: experienced volunteers often help beginners learn how to use a new tool safely.', zh: '人们也会分享知识：经验丰富的志愿者常常帮新手学习如何安全使用新工具。' },
        { id: 's12', en: 'For some, this is the first time they have ever fixed something themselves.', zh: '对一些人来说，这是他们第一次亲手修好东西。' },
      ],
    },
    {
      id: 'p4',
      sentences: [
        { id: 's13', en: 'Tool libraries also build community.', zh: '工具图书馆还能凝聚社区。' },
        { id: 's14', en: 'A neighbor borrowing a sander often stops to chat, and small repair workshops have grown up around many of these libraries.', zh: '来借砂磨机的邻居常会停下聊几句，许多这样的图书馆周围还慢慢办起了小型维修工作坊。' },
        { id: 's15', en: 'In a few cities, the local government even pays part of the cost, because the libraries help reduce household costs and waste at the same time.', zh: '在一些城市里，当地政府甚至会承担一部分费用，因为这些图书馆同时减轻了家庭开支与垃圾。' },
      ],
    },
    {
      id: 'p5',
      sentences: [
        { id: 's16', en: 'Of course, there are challenges.', zh: '当然，也有挑战。' },
        { id: 's17', en: 'Tools wear out faster than books, and someone has to repair them.', zh: '工具比书更容易磨损，需要有人去修。' },
        { id: 's18', en: 'Insurance can be tricky, and not every neighborhood has the volunteers to keep things running.', zh: '保险也有些麻烦，并不是每个社区都有足够的志愿者来维持运转。' },
        { id: 's19', en: 'Still, the model is spreading, slowly but steadily.', zh: '尽管如此，这种模式仍在缓慢却稳步地扩散。' },
      ],
    },
    {
      id: 'p6',
      sentences: [
        { id: 's20', en: 'It is a quiet idea, but a useful one.', zh: '这是一个安静的点子，但很有用。' },
        { id: 's21', en: 'A library, in the end, is a place that lends things people need.', zh: '说到底，图书馆就是一个把人们需要的东西借出去的地方。' },
        { id: 's22', en: 'A book is a kind of tool — and a tool, in its own way, can teach.', zh: '书本身就是一种工具——而工具，也以自己的方式教人。' },
      ],
    },
  ],
  vocab: [
    { id: 'v1', word: 'lending', lemma: 'lend', sentenceId: 's3', level: 1, pos: 'v.', ipa: '/ˈlendɪŋ/', defZh: '借出（给别人）', defEn: 'giving something to someone for a short time', example: 'My friend is lending me his bike for the weekend.', exampleZh: '朋友周末把自行车借给我。' },
    { id: 'v2', word: 'expensive', lemma: 'expensive', sentenceId: 's7', level: 1, pos: 'adj.', ipa: '/ɪkˈspensɪv/', defZh: '昂贵的', defEn: 'costing a lot of money', example: 'Good cameras are expensive.', exampleZh: '好相机很贵。' },
    { id: 'v3', word: 'store', lemma: 'store', sentenceId: 's7', level: 1, pos: 'v.', ipa: '/stɔːr/', defZh: '存放；储存', defEn: 'to keep something in a place until it is needed', example: 'We store winter coats in the closet during summer.', exampleZh: '夏天我们把冬大衣放在壁橱里。' },
    { id: 'v4', word: 'borrow', lemma: 'borrow', sentenceId: 's8', level: 1, pos: 'v.', ipa: '/ˈbɒrəʊ/', defZh: '借（向别人借入）', defEn: 'to take something from someone, planning to give it back', example: 'Can I borrow your pen?', exampleZh: '我能借你的笔用一下吗？' },
    { id: 'v5', word: 'waste', lemma: 'waste', sentenceId: 's10', level: 1, pos: 'n.', ipa: '/weɪst/', defZh: '废弃物；浪费', defEn: 'material that is no longer useful and is thrown away', example: 'The city is trying to reduce food waste.', exampleZh: '这座城市正在努力减少食物浪费。' },
    { id: 'v6', word: 'experienced', lemma: 'experienced', sentenceId: 's11', level: 1, pos: 'adj.', ipa: '/ɪkˈspɪəriənst/', defZh: '有经验的；熟练的', defEn: 'having a lot of knowledge from doing something for a long time', example: 'She is an experienced teacher.', exampleZh: '她是一位经验丰富的老师。' },
    { id: 'v7', word: 'volunteers', lemma: 'volunteer', sentenceId: 's11', level: 1, pos: 'n.', ipa: '/ˌvɒlənˈtɪərz/', defZh: '志愿者', defEn: 'people who do work without being paid', example: 'The festival is run entirely by volunteers.', exampleZh: '这个节日完全由志愿者运营。' },
    { id: 'v8', word: 'beginners', lemma: 'beginner', sentenceId: 's11', level: 1, pos: 'n.', ipa: '/bɪˈɡɪnərz/', defZh: '初学者；新手', defEn: 'people who are starting to learn something', example: 'This class is for beginners.', exampleZh: '这门课是为初学者开设的。' },
    { id: 'v9', word: 'community', lemma: 'community', sentenceId: 's13', level: 1, pos: 'n.', ipa: '/kəˈmjuːnəti/', defZh: '社区；社群', defEn: 'a group of people who live in the same area or share interests', example: 'The community held a fundraiser for the school.', exampleZh: '社区为学校办了一场筹款活动。' },
    { id: 'v10', word: 'neighbor', lemma: 'neighbor', sentenceId: 's14', level: 1, pos: 'n.', ipa: '/ˈneɪbər/', defZh: '邻居', defEn: 'someone who lives next to or near you', example: 'Our neighbor watches our cat when we travel.', exampleZh: '我们出差时邻居会帮我们看猫。' },
    { id: 'v11', word: 'workshops', lemma: 'workshop', sentenceId: 's14', level: 2, pos: 'n.', ipa: '/ˈwɜːrkʃɒps/', defZh: '工作坊；研讨班', defEn: 'meetings where people learn or practice a skill together', example: 'The library runs free coding workshops on Saturdays.', exampleZh: '图书馆每周六举办免费的编程工作坊。' },
    { id: 'v12', word: 'household', lemma: 'household', sentenceId: 's15', level: 2, pos: 'adj.', ipa: '/ˈhaʊshəʊld/', defZh: '家庭的；家用的', defEn: 'relating to a house and the people in it', example: 'Energy is a major household expense.', exampleZh: '能源是家庭主要支出之一。' },
    { id: 'v13', word: 'reduce', lemma: 'reduce', sentenceId: 's15', level: 1, pos: 'v.', ipa: '/rɪˈdjuːs/', defZh: '减少；降低', defEn: 'to make something smaller or less', example: 'We are trying to reduce paper use in the office.', exampleZh: '我们在努力减少办公室的用纸。' },
    { id: 'v14', word: 'challenges', lemma: 'challenge', sentenceId: 's16', level: 1, pos: 'n.', ipa: '/ˈtʃælɪndʒɪz/', defZh: '挑战；难题', defEn: 'difficult tasks that test someone\'s ability', example: 'Learning a new language has its challenges.', exampleZh: '学一门新语言会遇到不少挑战。' },
    { id: 'v15', word: 'wear out', lemma: 'wear out', sentenceId: 's17', level: 2, pos: 'phr. v.', ipa: '/wer aʊt/', defZh: '磨损；用坏', defEn: 'to become damaged from being used a lot', example: 'These running shoes wear out in about six months.', exampleZh: '这双跑鞋大概半年就会磨坏。' },
    { id: 'v16', word: 'repair', lemma: 'repair', sentenceId: 's17', level: 1, pos: 'v.', ipa: '/rɪˈpeər/', defZh: '修理；修补', defEn: 'to fix something that is broken', example: 'The shop can repair almost any kind of bike.', exampleZh: '这家店几乎能修任何一种自行车。' },
    { id: 'v17', word: 'insurance', lemma: 'insurance', sentenceId: 's18', level: 2, pos: 'n.', ipa: '/ɪnˈʃʊərəns/', defZh: '保险', defEn: 'an arrangement that protects you against loss or damage', example: 'Most cars need insurance.', exampleZh: '大多数车都需要保险。' },
    { id: 'v18', word: 'tricky', lemma: 'tricky', sentenceId: 's18', level: 2, pos: 'adj.', ipa: '/ˈtrɪki/', defZh: '棘手的；有难度的', defEn: 'difficult to deal with', example: 'Parking in this city can be tricky.', exampleZh: '在这座城市里停车有点麻烦。' },
    { id: 'v19', word: 'spreading', lemma: 'spread', sentenceId: 's19', level: 2, pos: 'v.', ipa: '/ˈspredɪŋ/', defZh: '扩散；传开', defEn: 'reaching more places or people', example: 'The new style is spreading from Tokyo to Seoul.', exampleZh: '这种新风格正从东京传到首尔。' },
    { id: 'v20', word: 'steadily', lemma: 'steadily', sentenceId: 's19', level: 2, pos: 'adv.', ipa: '/ˈstedɪli/', defZh: '稳步地；持续地', defEn: 'in a slow and continuous way', example: 'Her English is improving steadily.', exampleZh: '她的英语在稳步进步。' },
  ],
  collocations: [
    { id: 'c1', phrase: 'go beyond', sentenceId: 's9', meaningZh: '超出（某事的范围）；不止于', example: 'Her interests go beyond classical music.', exampleZh: '她的兴趣不止于古典音乐。' },
    { id: 'c2', phrase: 'in the end', sentenceId: 's21', meaningZh: '最终；说到底', example: 'In the end, what matters is honesty.', exampleZh: '说到底，重要的是诚实。' },
    { id: 'c3', phrase: 'in its own way', sentenceId: 's22', meaningZh: '以自己的方式', example: 'Each city is interesting in its own way.', exampleZh: '每座城市各有各的有趣之处。' },
  ],
  grammar: [
    {
      id: 'g1',
      title: 'Present perfect continuous',
      pattern: '[Subject] has/have been + V-ing',
      explanationZh: '强调一个动作从过去开始一直持续到现在（甚至还会继续）。和一般完成时（has done）相比，多了"持续性"的味道。',
      sentenceIds: ['s3'],
      examples: [
        'I have been studying English for five years.',
        'They have been building the bridge since last winter.',
      ],
    },
    {
      id: 'g2',
      title: 'Causative "let" + bare infinitive',
      pattern: '[Subject] lets [object] + bare verb',
      explanationZh: '"let + 宾语 + 动词原形"表示"让某人做某事"，是日常英语里最常用的使役结构之一。注意 let 后的动词不带 to。',
      sentenceIds: ['s8'],
      examples: [
        'My parents let me choose my own university.',
        'The app lets you save articles for later.',
      ],
    },
    {
      id: 'g3',
      title: 'Equative metaphor with "a kind of"',
      pattern: 'X is a kind of Y',
      explanationZh: '把一个事物归到另一个范畴里，是一种很轻巧的隐喻方式，常用在结尾句来收束议论。比 "X is Y" 更克制。',
      sentenceIds: ['s22'],
      examples: [
        'A diary is a kind of conversation with yourself.',
        'Cooking, for him, is a kind of meditation.',
      ],
    },
    {
      id: 'g4',
      title: 'Concession with "Of course" / "Still"',
      pattern: 'Of course, [acknowledge]. Still, [counter-claim].',
      explanationZh: '先承认对方观点（Of course），再用 Still 引出转折，是议论文里的经典让步—反驳结构。比直接说 "But" 更有礼貌、更成熟。',
      sentenceIds: ['s16', 's19'],
      examples: [
        'Of course, the plan has flaws. Still, it is the best we have.',
        'Of course, change is slow. Still, every step matters.',
      ],
    },
  ],
  patterns: [
    {
      id: 'pt1',
      useCase: '用时间把一个长期持续的现象沉下来 — 议论文 / 报道开篇',
      skeleton: 'For about [time], [subject] has been [verb-ing] X.',
      original: 'For about ten years, the library has been lending tools to its members.',
      sentenceId: 's3',
      hint: '把时间状语放到句首，立刻给文章一种"这件事已经发生很久"的稳重感。配合现在完成进行时（has been V-ing），强调动作还在持续，不只是一段历史。新闻报道里非常常用。',
    },
    {
      id: 'pt2',
      useCase: '从浅显的好处带到更深的论点 — 承上启下',
      skeleton: 'The benefits go beyond [obvious benefit].',
      original: 'The benefits go beyond saving money.',
      sentenceId: 's9',
      hint: '"go beyond X" 是一种把读者从表面意义引到深层意义的桥梁句。前面已经讲了一个浅显好处，下一步要展开"还不止于此"的内容时，这个结构最干脆。议论文段落之间的过渡好用。',
    },
    {
      id: 'pt3',
      useCase: '收尾金句：把主词归到一个范畴，再赋予新意义',
      skeleton: 'X is a kind of Y — and Y, in its own way, can [verb].',
      original: 'A book is a kind of tool — and a tool, in its own way, can teach.',
      sentenceId: 's22',
      hint: '前半句把主词归类（"X 是 Y 的一种"），后半句反身给那个类别赋予新能力。轻巧、有回响、不说教 — 是议论文 / 散文结尾的稳健选择。"in its own way" 的存在让句子保有一种谦逊的余地。',
    },
  ],
  quiz: [
    {
      id: 'q1',
      q: 'According to the article, what is the most popular item at the Berkeley library described?',
      options: ['A novel', 'A power drill', 'A laptop', 'A children\'s book'],
      answer: 1,
      explanation: 'The opening lines tell us the most popular item is not a book — it is a power drill.',
      sentenceId: 's2',
    },
    {
      id: 'q2',
      q: 'Why do tool libraries make sense for many people?',
      options: ['Tools are illegal to own', 'Tools are difficult to find in shops', 'People use tools rarely and lack space to store them', 'Tools cost the same as books'],
      answer: 2,
      explanation: 'The article explains people often need a tool only once or twice a year and most homes lack storage space.',
      sentenceId: 's7',
    },
    {
      id: 'q3',
      q: 'Which benefit is NOT mentioned in the article?',
      options: ['Saving money', 'Reducing waste', 'Increasing household income', 'Building community'],
      answer: 2,
      explanation: 'The article mentions saving money, less waste, and community-building. Increasing household income is not discussed.',
    },
    {
      id: 'q4',
      q: 'What is one challenge tool libraries face?',
      options: ['Books are too heavy to lend', 'Tools wear out faster than books', 'Members never return items', 'Cities ban them'],
      answer: 1,
      explanation: 'Tools wear out faster than books, and someone has to repair them — this is one of the listed challenges.',
      sentenceId: 's17',
    },
    {
      id: 'q5',
      q: 'The closing tone of the article can best be described as:',
      options: ['Sceptical of the idea', 'Quietly approving', 'Frustrated with bureaucracy', 'Indifferent'],
      answer: 1,
      explanation: 'Phrases like "a quiet idea, but a useful one" and the gentle metaphor at the end signal quiet approval.',
    },
  ],
};
