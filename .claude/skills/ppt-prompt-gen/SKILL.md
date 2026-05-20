---
name: ppt-prompt-gen
description: |
  PPT prompt 批量生成工具：把任意原始素材（学生材料、规划方案、研究纪要、数据报告、产品文档、研究论文）转化为一份可直接喂给下游生图 AI（nano-banana-pro / Imagen / Flux / 等）的结构化 prompt 集，输出 JSON。
  本 skill 不生图，只生 prompt——专注于"内容分析 + 结构规划 + 风格化 prompt 生成"，下游交给图像模型。
  4 阶段硬阻断流程：Phase 0 输入消化 → Phase 1 意图对齐（用户确认才进 2）→ Phase 2 Outline 规划（用户确认才进 3）→ Phase 3 批量 prompt 生成 + page-level QA。
  风格作为可换插件（references/styles/{style}.md），目前内置 soft-dusty-purple / swiss-international / apple-keynote / dark-techno，新增风格 = 加一个 md 文件即可，主流程零改动。
  触发信号："做 PPT"、"做幻灯片"、"做个 deck"、"做汇报"、"做演示文稿"、"生成幻灯片 prompt"、"PPT prompt"、"slide deck"、"路演 PPT"、"宣讲材料"、"扔给 nano-banana"、"扔给生图"、"做 ppt prompts"、"幻灯片 prompt 流"。
  即使用户只是粘贴一堆原始材料 + 说"做个 PPT"，也应该触发本 skill。
  如果用户在触发时直接说了风格名（"瑞士风"、"杂志风"、"soft dusty purple"、"swiss"、"editorial" 等），跳过风格询问直接进入 Phase 1。
---

# PPT Prompt Gen — 批量幻灯片 prompt 生成

## 为什么这样设计

把"做 PPT"拆成两个问题：① 这一份 deck 该讲什么、怎么讲（**叙事 + 结构**）② 每一页长什么样（**视觉风格**）。这两件事正交，可独立替换。

- **叙事层稳定**：无论什么风格、什么受众，"先对齐意图，再排 outline，再逐页填" 这套流程不变
- **风格层插件化**：每个风格独立成一个 md（配色 / 字体 / 密度规则 / prompt 骨架），主流程读取后填充。换风格 = 换文件，主流程零改动
- **硬阻断**：意图没对齐就出 outline 容易跑偏，outline 没定就出 prompts 一定是垃圾。每个阶段必须用户显式确认才能进下一阶段，宁可多回合也不要返工
- **输出 JSON**：下游可能是 n8n workflow 直接消费，也可能是人手动粘贴。JSON 两边都吃得下，比 markdown 健壮
- **防泄露**：image model 经常把 `[Module 1]`、`#7B7393`、`width: 30%` 这种结构标记当文字渲染到图里。本 skill 在 Phase 3 用纯自然语言描述布局，并显式 negative prompt 兜底

---

## 工作流（4 阶段，2 个硬阻断点）

### Phase 0：输入消化（内部，自动）

接到任务后内部做一次：
1. 列出**已知信息**（用户给了什么材料、提到了什么数字 / 学生 / 项目 / 主张）
2. 列出**待补缺口**（受众？时长？想达成什么？必须包含哪些点？）
3. 如果用户触发时已经说了风格名，记住，跳过 Phase 1 的风格选择步骤

不输出 Phase 0 内部摘要给用户——直接进 Phase 1 问问题。

### Phase 1：意图对齐 — ⏸️ 硬阻断点 1

读取 [`references/phase1_intake.md`](references/phase1_intake.md)，按里面的 9 项清单问用户。**不要一次性把 9 个问题甩出去**——根据 Phase 0 已知信息只问缺的，能从材料推出来的先推、再让用户确认。

风格选择特殊处理：列出 `references/styles/` 下所有可用风格，让用户选 1 个（或允许"我没想好，你推荐"——这种情况看受众/场景推荐 1 个并说明理由）。

**离开 Phase 1 的前提**：9 项全部 explicit 落地（哪怕某项是 "无 / 默认 / 待定"）。用户回 "ok / 可以 / 继续" 才进 Phase 2。

### Phase 2：Outline 规划 — ⏸️ 硬阻断点 2

读取 [`references/phase2_outline.md`](references/phase2_outline.md)。产出三样东西给用户看：

1. **总页数推荐**（带依据：场景时长 × 受众 × 信息密度 → 推荐区间）
2. **Narrative arc**（从 narrative arc 库里选 1 个或自定义；标出每一页在 arc 上的位置）
3. **逐页 outline 表**：页码 / 页型（参考 [`references/page_types.md`](references/page_types.md)）/ 页标题 / 核心信息 1 句 / 推荐图表（2-3 个候选 + 选型理由，参考 [`references/visualization_library.md`](references/visualization_library.md)）

用户可能改：加页、删页、换图表、换叙事顺序、改标题。改完再确认才进 Phase 3。**严禁未确认就生 prompts**——出了 prompts 再返工是巨大的浪费。

### Phase 3：批量 Prompt 生成

读取这些文件（按需）：
- [`references/phase3_builder.md`](references/phase3_builder.md) — 总规则 + page-level QA checklist
- [`references/styles/{用户选的风格}.md`](references/styles/) — 风格 pack
- [`references/anti_leakage.md`](references/anti_leakage.md) — 防泄露协议（每页都套用）
- [`references/visualization_library.md`](references/visualization_library.md) — 具体页要用某图表时查这个
- [`references/output_schema.json`](references/output_schema.json) — 最终 JSON schema

逐页生成：每页一段完整英文 prompt（喂给生图 AI 直接用），并在 JSON 里同时带上 metadata（页号 / 页型 / 标题 / narrative position / 核心信息 / 数据点 / 图表类型 / QA 是否通过）。

**Page-level QA**（每页生成完做一次自检，详见 `phase3_builder.md`）：
- 占位符是否全替换（不能有 `[在此填入...]` 漏到 prompt 里）
- 高亮的是不是真正的核心数据
- 字体规则是否完整（中文 + 英文 fallback）
- deck-level invariants 是否注入（logo / 页码 / 页眉页脚）
- 防泄露 negative prompt 是否附上

QA 全过 → 写入 JSON。任何一页 QA 没过 → 当场修，不要拖到最后。

**输出位置**：`/tmp/{deck_slug}_prompts.json`，文件名用 deck 主标题的 slug。如果输入材料属于某个学生（`01_Student/{姓名}/...`），同时询问是否复制一份到该学生目录下（学生交付物存档）。

输出后告诉用户：
1. JSON 文件路径
2. 总页数 + 风格 + narrative arc 概要
3. 任何 QA 警告（如某页核心数据缺失需补、某页图表类型 fallback 了等）
4. 怎么交给下游（n8n / 复制粘贴）的简短提示

---

## 风格选择规则

`references/styles/` 下每个 md 是一个独立风格 pack，schema 一致（配色 / 字体 / 密度 / 可视化偏好 / Prompt 骨架）。当前可选：

| 风格 | 适用场景 | 关键词 |
|:--|:--|:--|
| `soft-dusty-purple` | 高端咨询 / 教育规划 / 客户汇报 | 优雅、轻盈、灰紫、思源黑体 |
| `soft-corporate-teal` | 新东方前途内部述职 / 公司模板配套 / 教育集团年报 | 优雅 + 公司青绿、微软雅黑、clinical premium（继承 soft-dusty-purple 骨架） |
| `swiss-international` | 学术 / 极简 / 数据密集 | 网格、Helvetica/Inter、不对称、红色 accent |
| `apple-keynote` | 高端发布 / 家长汇报 / 品牌叙事关键节点 | 纯白、SF Pro、超大留白、单一英雄元素、Apple Blue |
| `dark-techno` | 科技 / 投资人 deck / 产品发布 | 深底、霓虹高亮、几何、等宽辅助 |

新增风格只需要新加一个 md 文件并遵循 `references/styles/soft-dusty-purple.md` 里的 schema。SKILL.md 不需要改（但建议在上表加一行让自己以后好找）。

---

## 核心原则（写在脑子里）

1. **信任内容判断，锁死视觉规范**——叙事 / 结构由你和用户每次共创；视觉 100% 由风格 pack 决定，不要发明新配色字体
2. **每页 prompt 是 self-contained 的**——下游生图 AI 一页一次调用，不能依赖跨页 context。所以 deck-level 元素（logo / 页码 / 字体规则 / 防泄露协议）每页都要 embed
3. **叙事连贯靠 outline，不靠祈祷**——Phase 2 把 narrative arc 钉死，每页 prompt 显式带 `narrative_position` 字段，下游或后续修改时能精确定位
4. **占位符必须 0 残留**——`[在此填入...]`、`{TITLE}`、`<your_text>` 这种东西出现在最终 JSON 里就是 bug，Phase 3 QA 是兜底
5. **中文内容 + 英文指令**——prompt 里指挥生图 AI 的部分用英文（更易遵循），但要渲染到图里的文字内容默认中文（除非用户说做英文 deck，或 jargon 必须英文）

---

## 何时**不**触发本 skill

- 用户要的是**实际的 .pptx 文件**而非 prompts → 用 `anthropic-skills:pptx`
- 用户要写**单页静态图**（一张海报 / 一张 infographic）而非整套 deck → 直接和图像模型对话，本 skill 杀鸡用牛刀
- 用户要的是**审/改已有 PPT**（文本润色 / 标点修订）而非从 0 生成 prompts → 用 `doc-polisher` 或 `word-editor`
- 用户其实想要**规划方案 / 选校表 / 文书** → 用对应 skill（`planning-roadmap` / `school-plan` / `ps_writer` 等），生成之后再问要不要做 PPT
