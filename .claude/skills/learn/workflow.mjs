export const meta = {
  name: 'learn-research',
  description: '博学伴读 · 深搜（只搜不写）：对一个元素做 fan-out 广度搜索，多个 agent 各查一个角度并按 实/争/俗 核实，汇成厚实分档的连接素材档 + 候选主线。写稿留给主窗口 inline 按 voice.md 挑一条线平铺写。',
  phases: [
    { title: '深搜', detail: 'fan-out：每个角度一个 agent，深挖 + 核实' },
    { title: '汇总', detail: '合并去重、分档、给候选主线' },
  ],
}

const TOPIC_INLINE = '' // ← 兜底：写死对象（如 '正山小种'）绕过 args
let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch { A = { topic: A } } }
const topic = TOPIC_INLINE || (A && (A.topic || A.object)) || ''
const note  = (A && A.note) ? `（${A.note}）` : ''
if (!topic) { log('⚠️ 没拿到 topic。把对象写进 TOPIC_INLINE 再 Workflow({scriptPath}) 重跑。'); return { error: 'no topic' } }

log(`博学伴读 · 深搜 · ${topic}${note}`)

const ANGLES = [
  { key: '源',       q: '起源、最早记载、产地 / 出处；以及流传的起源故事本身可靠不可靠（哪些是传说、哪些有史料）' },
  { key: '工艺/构造', q: '它怎么做成 / 构成的、之所以成为这一类的关键一步、跟最邻近的同类在这点上的区别' },
  { key: '名',       q: '名字与术语的来历、字面意思、外语名、方言读音、容易混的近名或假同源' },
  { key: '传播/历史', q: '它怎么传播开、在贸易 / 历史中扮演的角色、卷入过的具名真实事件、对世界的影响' },
  { key: '谱系',     q: '它的来源谱系与后代 / 衍生、在更大类别里的位置（鼻祖？分支？），具名的衍生物' },
  { key: '跨域连接',  q: '反直觉的跨语言 / 跨学科 / 跨文化连接，具名的人物 / 事件 / 作品；以及一个该破的常见假连接' },
]

phase('深搜')
const found = await parallel(ANGLES.map(a => () =>
  agent(
`你在为「博学伴读」做深度资料搜集。对象：「${topic}」${note}。你只负责一个角度：

【${a.key}】${a.q}

用 WebSearch 深挖，多查几轮，挖到具名的人 / 事 / 作品 / 确切年代和事实，不要泛泛而谈。每条断言标置信度：实（学界 / 权威共识）、争（有争议 / 一般认为但未定）、俗（民间附会、常见但站不住）。词源类按 etymonline / OED 思路核。最好听的连接往往是假的，宁可标存疑，绝不编。

输出 markdown：这个角度查到的分档事实点 + 值得注意的连接线索。只搜不写文章、不上语气。`,
    { label: '搜:' + a.key, phase: '深搜' }
  )
))

phase('汇总')
const dossier = await agent(
`把下面 ${ANGLES.length} 份分角度资料合并成一份「连接素材档」，给下游写稿人用：
- 去重，保留 实 / 争 / 俗 分档。
- 把彼此呼应的连接线索归到一起。
- 最后单列「候选主线」2-3 条（每条一句话）：哪条线最有潜力贯穿全文、读完落一个完整认识。写稿人会挑一条、砍掉其余。
只整理事实和线索，不写文章、不上语气。

${found.filter(Boolean).map((f, i) => '【' + ANGLES[i].key + '】\n' + f).join('\n\n')}`,
  { phase: '汇总' }
)

return { topic, dossier }
