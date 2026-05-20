# Phase 3 — 批量 Prompt 生成 + Page-level QA

## 目标

把 Phase 2 确认的 outline 转化为一份完整 JSON（符合 `output_schema.json`），每页一段可直接喂给生图 AI 的英文 prompt。

## 总流程

```
1. 读取 references/styles/{用户选的风格}.md  →  得到 prompt_template + visual rules
2. 读取 references/anti_leakage.md           →  得到 negative prompt 段落
3. 对 outline 里每一页，按风格 template 填充  →  生成 prompt_en
4. 对每页跑 page-level QA checklist          →  填 qa_passed + qa_warnings
5. 组装成符合 output_schema.json 的 JSON
6. 写入 /tmp/{deck_slug}_prompts.json
7. 报告给用户：路径 + 总览 + 任何 warning
```

## Part 1 — 填充规则

风格 pack 里的 `prompt_template` 是一段带占位符的英文骨架。逐页填充时，按以下顺序处理：

### Step 1：从 outline 提取每页的"原料"

| 字段 | 从哪里来 |
|:--|:--|
| `title_zh` / `title_en` | outline 表的"标题"列；title_en 在中英混排时按需生成 |
| `core_message` | outline 表的"核心信息"列 |
| `data_points` | Phase 1 收集的"必含数据"中分配给本页的部分；从原始材料抽真实数据 |
| `chart_types` | outline 表的"图表"列（用户确认后的版本）|
| `highlights` | core_message + data_points 中真正的"故事点"（用 accent 色） |
| `page_type` | outline 表的"页型"列 |
| `narrative_position` | outline 表的"Narrative"列 |

### Step 2：套风格模板填充

每个风格 pack 提供 `prompt_template` 字段，里面用 `{{...}}` 标记占位符（注意：这是模板里的占位，**生成的最终 prompt_en 字符串里不能含 `{{...}}`**）。填充示例：

```
模板（在 style pack 里）：
  "{{page_type_description}}, 16:9, {{background}}, elegant aesthetics 
   using {{color_palette_natural_lang}}.
   Title: '{{title_zh}}'{{title_en_suffix}}.
   {{main_content_block}}
   {{accent_block}}
   Typography: {{typography_rules}}.
   {{negative_prompt}}"

填充后（最终 prompt_en）：
  "A professional consulting slide with a single main chart, 16:9, pure white 
   background, elegant aesthetics using soft dusty purple highlights against 
   a grayscale base.
   Title: '当前状况诊断' (Current Status Diagnosis).
   The main area is a horizontal Harvey Ball row showing three dimensions—...
   The 'IELTS' dimension is highlighted with soft dusty purple to draw the eye, ...
   Typography uses Source Han Sans throughout with Inter as English fallback.
   NEGATIVE PROMPT (...)"
```

### Step 3：注入 deck-level invariants

每页 prompt 末尾（在 negative prompt 之前）embed 这些：

- Logo 位置 + 描述（如果 deck_invariants.logo_position 非 null）
- 页码样式（如果 deck_invariants.page_number_style 非 null）
- 页眉 / 页脚（如果非 null）

这些是 deck-wide 一致的视觉锚点，每页都要带，不能因为"这页是 content 页"就省略。

### Step 4：附加 negative prompt

直接复制 `references/anti_leakage.md` 里 Part 2 的标准 negative prompt 段落。如果风格 pack 有专属追加项，合并。

## Part 2 — Page-level QA Checklist

每页 prompt 生成完，**立即**跑一遍这个 checklist。任何一项失败 → 当场修，不要拖。

### 检查 1：占位符残留（HARD FAIL）

`prompt_en` 字符串里搜：
- `{` `}`（花括号）
- `[在此` `[填入` `[Add` `[TODO` `[here]`
- `<your_` `<insert` `<example`
- `{{` `}}`（模板占位）

任何一个命中 = 残留 = 立刻重新填充。这是最常见的 bug 来源。

### 检查 2：高亮的是不是真核心数据

读 `prompt_en` 里描述 accent 色高亮的部分，对照 `core_message` 和 `data_points`，判断：

- ❌ 错：高亮了 "data is shown in the chart"（太泛）
- ✅ 对：高亮了 "the 78% conversion rate"（具体数据点）
- ❌ 错：高亮了所有数据（accent 失去强调作用）
- ✅ 对：只高亮 1-2 个最故事性的数据

### 检查 3：字体规则完整

- 中文主字体（如思源黑体）是否在 prompt 里明示
- 英文 fallback（如 Inter / Helvetica Neue）是否提到
- 中英混排页（含 jargon）是否说明了 fallback

### 检查 4：deck-level invariants 已注入

- logo 位置（如果有）✓
- 页码样式 ✓
- 页眉 / 页脚（如果有）✓

漏注入 → 整套 deck 视觉不一致，必须补。

### 检查 5：图表类型完整描述

`chart_types` 里的每个图表类型，在 `prompt_en` 里要有**视觉描述**而不只是名字：

- ❌ 错：`"includes a waterfall chart"`（生图 AI 不知道画啥）
- ✅ 对：`"a waterfall chart with 5 bars: starting value, three decreasing steps in light grey, one increasing step, and the final net value highlighted"`

### 检查 6：负面 prompt 已附

末尾必须有 NEGATIVE PROMPT 段落。

### 检查 7：内容自洽

`core_message` 和 `prompt_en` 里描述的内容是否一致？有没有 prompt 写了 core_message 没提的元素（多余）？有没有 core_message 提了 prompt 没体现的（漏）？

### 检查 8：禁忌符号

`prompt_en` 里不应出现：
- `#` 后跟 hex 色（写自然语言）
- `%` 表示百分比布局（写"one-third"等）
- `→` 箭头符号（写"flowing into"等）
- Markdown 语法（`**bold**` / `# heading`）

### 检查 9：布局术语显式化（模型默认偏好 grid）

历史教训（首次 demo Image 2 暴露）：写 "a vertical stack of 6 cards" → 模型自作主张排成 2 列 × 3 行的网格，甚至可能复制卡片凑数。原因：image gen 模型在 ambiguous 布局表述下默认 fallback 到最常见的"grid of cards"模式。

**修正规则**：所有布局描述必须**显式量化方向 + 数量**，禁用模糊词。

| ❌ 禁用模糊词 | ✅ 替换为 |
|:--|:--|
| "a vertical stack of N cards" | "a single vertical column of N cards, **one card per row, stacked top to bottom**, no horizontal pairing" |
| "a grid of cards" | "an **M-column by N-row** grid of cards (specify M and N explicitly)" |
| "a row of stat blocks" | "**N stat blocks arranged horizontally in a single row**, evenly spaced" |
| "arranged in a layout" | 删除这种废话短语，直接描述具体形状 |
| "modules" | "**N modules** in a [specific arrangement]" |

写完检查：prompt 里所有提到布局的句子都能回答"M × N 几个？方向是什么？"——回答不出来就重写。

### 检查 10：Accent 多实例显式枚举

历史教训（首次 demo Image 1 暴露）：写 "appears in two locations: the 7.0 header, and the TOEFL row in both columns" → 模型把 "both columns" 算作 1 location 复用，结果 7.0 header 没染色，只染了 TOEFL 行。

**修正规则**：当 accent 应用于**多个独立实例**（多栏/多行/多对象的"同一种"元素）时，必须用**编号列表**显式列出每一处。

❌ 错的写法：
- "The accent appears in two locations: the 7.0 header and the TOEFL row in both columns"（模型理解："2 处" 当成了既定数目，"in both columns" 当成属性而非分别实例）

✅ 对的写法（用 (1)(2)(3) 数字编号枚举每一处独立实例）：
- "The accent appears in **exactly three locations**: 
  (1) the right-column '7.0' header numeral, set entirely in signal red; 
  (2) the left-column 'TOEFL iBT new (1-6)' row label and value, set in signal red; 
  (3) the right-column 'TOEFL iBT new (1-6)' row label and value, set in signal red."

规则：累计总数（"three locations"）+ 编号列表（(1)(2)(3)）+ 每一项物理位置 + 应用到哪个具体元素。三者缺一就重写。

### 检查 11：Glow / Bloom 强度量化（适用于带 glow 的风格如 dark-techno）

历史教训（两次翻车）：
- 首次（Image 4）：写 "glowing faintly" → 线条 glow 几乎不可见
- 二次（Image 7）：矫枉过正，写 "halo 24-32 px" → cyan 抢眼但其他文字相对暗淡 illegible

**修正规则**：glow 必须**量化但不可过度**。颜色差是主信号，glow 是次要点缀。

| 元素 | Glow 强度区间 |
|:--|:--|
| 数字 / 文字 / 小元素 | **6-10 px** |
| 线条 / 流向 | **12-16 px**（线条略加粗以增可见性，但不靠 glow 抢戏）|
| 整页底纹 / 大面积 | 用 grid 纹理或暗色 surface 代替，不用 glow |

写法示例：
> "The slope line representing '95 to 5' is drawn in electric cyan at approximately 1.5 times the weight of the non-emphasized lines, with a moderate cyan halo extending approximately 12 to 16 pixels along its length — clearly visible but not overpowering."

### 检查 12：Dark / 暗色风格的可读性铁律

历史教训（Image 7 暴露）：dark-techno 把 glow 推到 24-32 px 后，cyan 抢戏，其他文字（轴标 / 副文 / passive 数据）全部相对发暗，**用户原话："其他文字根本看不清楚，每个信息都要清晰、有对比度，glow 差不多就行，颜色不一样本身就很显眼"**。

**修正规则**（仅适用于 dark / 暗色风格 pack）：

1. **视觉层次靠颜色差，不靠亮度差**——cyan 一档 + bright off-white 一档；禁止"暗灰做 body / 亮白做高亮"这种 brightness-based hierarchy
2. **禁用词**（描述非高亮内容时绝对禁止）：`soft / faint / faded / dim / subtle / ghost / barely visible / quiet`——dark 风格下这些词被模型解读为"几乎不可见"
3. **替换为**：`clearly legible / fully readable / bright off-white / visible mid-grey / distinct from the background / readable at small sizes`
4. **最低亮度兜底句**：每个 dark 风格的 prompt 末尾建议 embed："The minimum brightness for any visible content on this slide is a clearly readable medium grey; nothing on the page is rendered illegibly."

QA 实操：搜 prompt_en 里有没有 `soft / faint / faded / dim / subtle` 后面紧跟着的是非高亮元素描述。命中 = 改写。

### 通过条件

通过所有 12 项 → `qa_passed: true`。否则填具体警告到 `qa_warnings` 然后修。

## Part 3 — 输出 JSON 文件

### 命名

`/tmp/{deck_slug}_prompts.json`，slug 用 deck 主标题的拼音 / 英文 simplified：

- "王涵润 英国本科申请规划" → `wanghanrun_uk_undergrad_plan_prompts.json`
- "Q3 Revenue Review" → `q3_revenue_review_prompts.json`

### 写入

```bash
# 在生成完整 JSON 后用 Write tool 写入文件
# 文件路径：/tmp/{slug}_prompts.json
```

### 学生场景的额外存档

如果 source_materials 来自某个学生（`01_Student/{姓名}/...`），问用户：
"要不要同时复制一份到 `01_Student/{姓名}/个性化材料/` 下作为交付物存档？"

用户同意 → 复制 + 在该学生档案末尾的 `## 沟通与纪要汇总` 下加双向链接。

## Part 4 — 给用户的最终交付

输出 JSON 文件后，给用户的总结消息要包含：

```
✅ Prompts 已生成

文件：/tmp/wanghanrun_uk_undergrad_plan_prompts.json
总览：14 页 · soft-dusty-purple 风格 · 问题-分析-方案-收益 arc
QA：全过（或：12 页全过，2 页有 warning：见下）

[如果有 warning]
⚠️ Warnings：
- 页 5（data）：核心数据点 "UCL 化工 A-Level 门槛" 在材料里没找到精确数字，prompt 里用了 "approximately A*AA" 占位，下游图生成时可能需要补真实数字
- 页 9（content）：图表类型从 "Pyramid" fallback 至 "3-tier stacked block"（Pyramid 在 soft-dusty-purple 里偏隐喻，简化处理）

下一步：
1. 喂给 nano-banana-pro（2K，16:9）→ JSON 里每个 `prompt_en` 字段对应一页
2. 推荐 batch 方式：parallel / multi-image one-shot
3. 如需调整某页，告诉我页号 + 改什么，我就近修改 JSON
```

## Part 5 — 用户改某页的快速通道

Phase 3 输出后用户经常说"页 5 加个 X" / "页 8 换成 Y 图表"。处理流程：

1. 读取 `/tmp/{slug}_prompts.json` 的对应 page
2. 改 outline 字段（core_message / data_points / chart_types / etc）
3. **重跑 Step 2-4 仅针对该页**（填充 → QA → 注入 invariants → 附 negative）
4. 写回 JSON
5. 告诉用户改完，并提示其他页是否也需要同步改（比如改了主标题就要同步改封面页）

## 常见坑

- **风格 pack 字段名拼错**：每个风格 pack 必须包含 `prompt_template` / `color_palette_natural_lang` / `typography_rules` / `visualization_preference` / `density_rules`，缺一个就填充失败
- **chart_types 留空**：cover / quote / thanks 等页型 chart_types 可以是 `[]`，但 `prompt_en` 要明确说"无图表，纯 typography"，不能默认
- **JSON 写入失败**：先用 `mkdir -p /tmp/` 兜底，再 Write
- **slug 含中文导致路径问题**：slug 必须 ASCII，拼音化 / 英文化
