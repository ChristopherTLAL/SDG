# Style Pack — Apple Keynote（苹果发布会风）

> 极致干净。SF Pro 大字 + 大量留白 + 单一英雄元素。Apple WWDC / Keynote 范式。

## 视觉基调

- 关键词：clean / spacious / premium / restrained / hero-focused / SF-Pro-monospace-of-corporate-style
- 适用：高端发布、教育规划成果展示、家长汇报（要"高级感不抢眼"）、产品介绍、品牌叙事中的关键节点
- 不适用：数据密集 dashboard（密度跟不上）、严肃学术（太"产品发布"感）、长流程图（节奏不合）
- 灵感：Apple WWDC keynote slides、Apple education keynote、Apple Park 内部 deck、Steve Jobs era "one big thing per slide"

## 配色系统

### Hex 速查（内部参考，不进 prompt）

| 角色 | Hex | 自然语言描述 |
|:--|:--|:--|
| Canvas | `#FFFFFF` | pure white |
| Primary text | `#1D1D1F` | near-black with a faint warmth, Apple's signature text color |
| Body text | `#3A3A3C` | warm dark grey |
| Secondary / caption | `#6E6E73` | muted neutral grey |
| Disabled / passive | `#AEAEB2` | light system grey |
| **Accent — Apple Blue** | `#007AFF` | a clean, confident tech blue — Apple's system blue |
| Accent muted | `#5E5CE6` | system indigo (used very sparingly when blue is not appropriate) |

### 用色原则

- **纯白底色**——无暖色、无 lilac、无 cream。任何"温度偏移"都破坏这个风格的"干净"
- **零色块分区**——绝对不用色块分模块，只靠**留白 + typography 层级** 建立结构（这是和 soft-dusty-purple 的关键区别）
- **Accent 极致克制**：一页最多 1 个 Apple Blue 高亮点，永远不超过 2 处。可以完全没有 accent（纯黑白灰）
- **无渐变 / 无阴影 / 无装饰**——比 swiss 还要极简（swiss 还会用红色 + 网格细线，apple-keynote 连这些都省）
- 绝对禁忌：饱和色、warm tone、card / pill / chip 形状、彩虹色

## 字体规则

- **中文主字体**：苹方 PingFang SC（首选，Apple 中文系统字体）或思源黑体作为 fallback
- **英文主字体**：SF Pro Display（首选）或 Inter / Helvetica Neue 作为 fallback
- **等宽**：SF Mono（用于数据 / 时间戳 / 章节编号，但比 dark-techno 用得少）
- **层级**：
  - H1 主标题：SF Pro Display Bold 或 Black，**极大字号**（占页面 H 的 12-18%），常**居中或左对齐**
  - H2 区块标题：SF Pro Display Medium 或 Semibold
  - Body：SF Pro Text Regular 或 苹方 Regular，行高宽松（1.5-1.6）
  - Caption：SF Pro Text Regular 小字，muted grey
  - 数据 / 时间戳：SF Mono Regular，tabular figures

## 密度规则

| 页型 | 留白率 | 模块数 | 主图 / 辅图 |
|:--|:--|:--|:--|
| cover | **60-70%**（一行大字 + 一行 tagline 全页中央）| 1-2 元素 | 0 图表（可有抽象 hero 视觉）|
| toc | 40-50% | 5-8 章节，左对齐编号 | 0 图表 |
| section_divider | **70%+**（整页 1-2 行大字 + 章节号）| 1-2 元素 | 极少 |
| content | **35-45%** | 2-3 模块 | 0-1 图表（少 + 大）|
| data | **35-45%**（单一英雄图表）| 主图 + 1 caption | **1 个**主图占主导，无辅图 |
| comparison | 35-40% | 2 栏对称 | 极简对比 |
| process | 35-40% | 3-5 节点（编号大字）| 大字 + 细线 |
| quote | **70%+** | 大字引言 | 0 |
| summary | 40-50% | 3-5 编号 takeaway | 编号 + 大字 |

**核心原则**：一页只讲一件事。如果你想塞两个图表 + 三段文字 + 一个 KPI 行，**改用 swiss-international 或 soft-dusty-purple**——这页不是 apple-keynote 的活。

## 可视化偏好

- **鼓励**：Big Number（巨大单数字 + 一句话 caption，Apple keynote 的代表性页型）、单一 Line Chart（极细线，无填充）、单一 Bar Chart（最多 5 个 bar）、Slope Graph、Timeline（极简）、Stat 三连横排
- **慎用**：复杂图表（Marimekko、Sankey、Network）、密集数据表、多变量散点
- **禁用**：3D 任何图表、卡通 icon、Pictograph、彩虹色 categorical palette、复杂矩阵、Pyramid / Iceberg / Temple 等隐喻图（太"咨询"，不"产品"）

## Prompt 骨架

```
An Apple Keynote-style presentation slide, 16:9 aspect ratio, with the visual language 
of an Apple WWDC or product-launch keynote. Background is pure white. The overall mood 
is clean, spacious, premium, and restrained — every element earns its presence.

This is a {{page_type_natural_language}} page. {{narrative_position_descriptor}}.

The composition is built on extreme generous whitespace — at least 35 to 45 percent 
of the page breathes empty (60 to 70 percent for cover, section divider, or quote 
pages). There is no grid, no card, no color block — structure comes from typography 
hierarchy and spatial rhythm alone. Layout is centered or left-aligned with comfortable 
margins; never edge-to-edge.

Title "{{title_zh}}"{{title_en_inline_suffix}} is set in SF Pro Display Bold (with 
PingFang SC for Chinese characters) in Apple's signature near-black, at a large 
display size — substantial but never crowded. The title sits {{title_position}}.

{{main_content_block_natural_language}}

{{accent_treatment_minimal}}

{{single_caption_or_tagline}}

Typography is exclusively SF Pro Display for display headings, SF Pro Text for body 
copy, and PingFang SC for Chinese characters at matching weights. SF Mono appears 
only when numerical alignment or a deliberate "data" texture is required. Body text 
has generous line height around 1.5. All text is in Apple's near-black; muted neutral 
grey is used only for captions and metadata.

The accent color, Apple's system blue, appears at most one or two times on this 
entire page — used to highlight a single critical data point or a single key insight. 
If the content does not have a clear single hero data point, the page is rendered 
entirely in black, white, and grey without any accent — restraint over decoration.

No color-block backgrounds. No card or pill shapes. No drop shadows. No gradients. 
No decorative icons. No grid lines. Charts, if present, use crisp thin strokes with 
minimal axes and zero ornamentation. {{logo_clause}} {{page_number_clause}} 
{{footer_clause}}

NEGATIVE PROMPT (do not render any of these as visible text in the image): square 
brackets like Module 1 or Title, hex color codes like 007AFF or FFFFFF, percentage 
values like 30 percent or 50/50, words like Module, Section, Layout, Card, Pill, 
Block, Instructions, Visual elements, Heading is, or any structural markup or 
meta-commentary. Do not render placeholder text like Your Title Here. Do not 
introduce warm color tones (cream, ochre, beige) or pastel decorative tints. Do not 
add corporate-style flat icons or illustrated decorations. Do not add card or pill 
container shapes around content blocks. Do not center-align body text into 
infographic-style clusters. The image must feel like a polished Apple keynote slide, 
not a generic presentation template.
```

## 占位符填充指南

| 占位符 | 怎么填 |
|:--|:--|
| `{{title_position}}` | cover / section_divider / quote 页：" centered vertically in the upper-middle of the page, occupying most of the visual focus"。content / data 页：" in the upper-left, with generous margin from the edge"。data 页 hero 数字：" centered horizontally in the upper-third" |
| `{{main_content_block_natural_language}}` | 单一英雄元素描述。**关键**：apple-keynote 一页只一个主元素，不要凑多个 module。例 "The central two-thirds of the page contains a single large statistic '95%' set in SF Pro Display Black at a massive display size, in Apple's near-black, with a single short caption beneath in muted grey: 'of Russell Group programmes require TOEFL Speaking 22 or above'" |
| `{{accent_treatment_minimal}}` | 如果有 1 个 accent → 描述位置 + 物件。例 "The numeral '95' is rendered in Apple's system blue, the single chromatic note on an otherwise monochrome page"。如果完全无 accent → 填 "This page uses no accent color; the composition remains entirely in near-black, white, and muted grey for maximum restraint" |
| `{{single_caption_or_tagline}}` | 底部如果有 tagline / 一句话 caption → 描述位置和内容。例 "Beneath the central content, a single line of SF Pro Text Regular in muted grey reads 'Source: ETS 2026 concordance, May 2026'"。无则填空 |

其他占位符同 `soft-dusty-purple.md`。

## 风格特定的 anti-leakage 追加项

追加 negative prompt：

```
do not render card-shaped containers, pill shapes, rounded background blocks, or any 
boxed visual grouping around content;
do not introduce any color beyond near-black, white, neutral grey, and a single 
sparing use of Apple system blue (and only on data pages where it is clearly motivated);
do not use serif typefaces, script fonts, or condensed typefaces;
do not add subtle decorative gradients, soft shadows, or "glassmorphism" effects;
do not crowd the page — empty space is a deliberate compositional choice, not an 
opportunity to be filled;
the image must read as a single-message Apple keynote slide, not a corporate sales template.
```

## 一句话风格指纹

"Steve Jobs 的 'one more thing' 哲学翻译成 deck——一页一件事，留白是奢侈品，蓝色一抹是点睛而非装饰。"
