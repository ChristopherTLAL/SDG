# Style Pack — Dark Techno（深色科技风）

> 深底 + 霓虹高亮 + 几何感强 + 等宽字体点缀。投资人 deck / TMT 产品发布 / TGV 风格。

## 视觉基调

- 关键词：tech / cinematic / high-contrast / neon-on-dark / geometric / a16z-pitch-deck-energy
- 适用：投资人路演、产品发布、TMT 公司 deck、AI / SaaS / Crypto 项目、数据科技公司
- 不适用：教育 / 留学规划（太"卷"）、严肃学术（太"营销"）、品牌叙事（太冷）
- 灵感：Stripe Press / Linear / Vercel / a16z pitch deck / Apple "One More Thing" 暗场页

## 配色系统

### Hex 速查

| 角色 | Hex | 自然语言描述 |
|:--|:--|:--|
| Canvas | `#0A0A0F` 或 `#000000` | near-black with a hint of cool blue (preferred) |
| Surface elevated | `#16161D` | slightly raised dark surface for cards / modules |
| Surface border | `#2A2A35` | subtle dark border to delineate sections |
| Primary text | `#FFFFFF` | pure white |
| Body text | `#E5E5EA` | clearly legible bright off-white (never faded) |
| Secondary | `#A1A1AA` | mid-bright grey, fully readable at small sizes |
| Passive data | `#9CA3AF` | medium grey — minimum brightness for any visible content; never go below this |
| **Accent — Electric Cyan** | `#00D9FF` | bright electric cyan, primary highlight |
| Accent secondary | `#A78BFA` | electric violet (used for variety on data pages) |
| Accent danger | `#FF4D4F` | vivid red for "risk" / "loss" callouts only |
| Accent success | `#10B981` | crisp green for "gain" / "growth" callouts only |

### 用色原则

- **深底色**：建议 #0A0A0F（带极微弱蓝调）而非纯黑——纯黑在大屏上"死"
- **高对比**：所有文字必须清晰可读，包括非高亮内容。body 文字用 bright off-white（E5E5EA），secondary 用 mid-bright grey（A1A1AA），最暗的可见文字也不能低于 medium grey（9CA3AF）
- 🔴 **对比度铁律（首次 demo Image 7 暴露的教训）**：dark-techno 的视觉层次**靠颜色区分**（cyan 一档 vs off-white 一档），**绝对不要靠亮度区分**（cyan 亮 vs 灰色暗）。后者会把非高亮内容渲染得几乎不可见。
  - ❌ **禁用词**：在描述非高亮文字 / 线条 / 元素时，绝对不能用 `soft`、`faint`、`faded`、`dim`、`subtle`、`ghost`、`barely visible`、`quiet`、`muted to the point of`——这些词会触发模型把内容渲染得 illegible
  - ✅ **替换为**：`clearly legible`、`fully readable`、`bright off-white`、`visible mid-grey`、`distinct from the background`
- Accent 霓虹色用于：① 1-2 个核心数据 ② 关键 callout 边框 / 发光 ③ 图表的 highlight 序列
- Cyan 是主，violet / red / green 是辅，**一页最多用 2 种 accent**
- **辉光效果**（halo / bloom）是 dark-techno 的签名，但**颜色本身已经够显眼，glow 是辅助不是主体**——line glow 控制在 12-16 px，numeral glow 控制在 6-10 px，过度 glow 会让其他文字相对暗淡看不清
- 绝对禁忌：低对比的灰底灰字（看不清）、暖色调（warm grey / cream / ochre），与基调不符

## 字体规则

- **中文主字体**：思源黑体 Source Han Sans（紧凑字距）—— Bold 偏好
- **英文主字体**：
  - 主体（H1 / H2）：Inter（首选）、Söhne、Geist Sans
  - 等宽（数据 / code / 装饰）：JetBrains Mono、Söhne Mono、Geist Mono
  - **等宽字体是 dark-techno 的视觉签名**——数据、版本号、时间戳、章节编号常用
- **层级**：
  - H1 主标题：Inter Bold 或 Black，紧凑字距，纯白
  - H2 区块标题：Inter Medium，全大写或首字母大写，cyan 或白
  - Body：Inter Regular，off-white，行高紧凑（1.4-1.5）
  - 数据标签：JetBrains Mono Regular，tabular figures
  - 章节编号 / 装饰：JetBrains Mono Bold，可加 `>` `>` `_` 等极客装饰符号（**作为内容本身，不是 markup**）

## 密度规则

| 页型 | 留白率 | 模块数 | 主图 / 辅图 |
|:--|:--|:--|:--|
| cover | 40-50%（黑底 + 大字 + cyan accent）| 1-2 元素 | 几何抽象 / 网格底图 |
| toc | 25-35% | 5-8 章节 | 章节号（等宽）+ 标题 |
| section_divider | 50%+（大编号 + glow）| 1-2 元素 | cyan glow accent |
| content | 15-25%（信息密度高）| 网格 4-6 模块 | 2-3 几何图表 |
| data | 15-25%（数据 dashboard 感）| 主图 + 多 stat | 1 主 + 3-5 KPI cards |
| comparison | 20-25% | 2-3 栏 | 对称几何 |
| process | 20-30% | 编号节点 + glow | 线性流程 + 高亮 |
| quote | 50%+ | 大字 + 来源 | 0 或几何装饰 |
| summary | 25-30% | 编号 takeaway | KPI 行 + glow |

## 可视化偏好

- **鼓励**：Bar / Line / Area（深底浅色变体）、Network Diagram、Sankey、Heatmap、Scatter / Bubble、Stat Card 矩阵、Big Number with sparkline、Funnel、Cohort 矩阵
- **慎用**：Pyramid / Iceberg / Bridge（隐喻太"软"）、watercolor 风格的任何东西、卡通 icon
- **禁用**：3D 任何图表（伪科技反而 amateur）、Pie Chart、彩虹色 categorical、纸质质感
- **特殊**：可大量使用 **glow effect / soft bloom** 在数据高亮处；**网格背景**（极淡 grid pattern）作为底层结构

## Prompt 骨架

```
A dark-mode tech presentation slide, 16:9 aspect ratio, with the cinematic high-contrast 
energy of a Linear, Vercel, or a16z pitch deck. The background is near-black with a 
hint of cool blue undertone (avoiding the deadness of pure black). The overall mood is 
precise, technological, high-contrast, and confident.

This is a {{page_type_natural_language}} page. {{narrative_position_descriptor}}.

The layout is built on a precise grid; module boundaries are defined by subtle elevated 
dark surfaces (slightly lighter than the canvas) with thin border lines, rather than 
by white space alone. {{grid_or_card_layout_description}}

Title "{{title_zh}}"{{title_en_inline_suffix}} is set in Inter Bold (with Source Han 
Sans for Chinese characters) in pure white, with tight letter spacing. The title is 
positioned according to the page layout — typically upper-left or upper-center.

{{main_content_block_natural_language}}

{{accent_treatment_with_glow}}

{{data_or_monospace_block}}

Typography combines Inter (for primary text) with JetBrains Mono or a similar 
monospaced typeface for data labels, version markers, timestamps, and decorative tech 
elements. Source Han Sans handles Chinese characters with weight matching the 
surrounding Latin text. Body text is in clearly legible bright off-white, fully 
readable against the dark canvas. Secondary text and data labels are in mid-bright 
grey, fully readable at small sizes — never dim, never faded. The minimum brightness 
for any visible content on this slide is a clearly readable medium grey; nothing on 
the page is rendered illegibly.

The primary accent — an electric cyan — is used to highlight one or two critical data 
points or callouts per page, with a moderate glow effect (line halos 12 to 16 pixels, 
numeral halos 6 to 10 pixels) around the highlighted element. Color difference is the 
primary visual signal; glow is a supplementary anchor, never strong enough to make 
non-highlighted content appear comparatively dim. A secondary accent (electric violet) 
may appear on data pages for chart variety.

A grid pattern may appear in the background as a structural texture at very low 
contrast but must not interfere with content legibility. Geometric shapes and thin 
neon lines may serve as decorative anchors. No 3D effects (which read as amateur in 
this style), no warm tones, no paper textures, no cartoon icons. {{logo_clause}} 
{{page_number_clause}} {{footer_clause}}

NEGATIVE PROMPT (do not render any of these as visible text in the image): square 
brackets like [Module 1] or [Title], hex color codes like #00D9FF or #0A0A0F, 
percentage values like 30% or 50/50, words like "Module", "Section", "Layout", 
"Grid", "Instructions", "Visual elements", "Heading is", "Glow", "Accent", or any 
structural markup or meta-commentary. Do not render placeholder text like "Your Title 
Here" or terminal-style fake commands ("$ npm install ...") unless that command IS the 
actual presentation content. Do not introduce warm color tones (cream, ochre, beige) 
or pastel colors. Do not add corporate-style flat icons. The image must feel like a 
cutting-edge SaaS keynote, not a generic tech template.
```

## 占位符填充指南

| 占位符 | 怎么填 |
|:--|:--|
| `{{grid_or_card_layout_description}}` | 描述本页的卡片 / 网格分布。例 "The page is divided into a left two-thirds chart canvas and a right one-third sidebar of three stacked KPI cards"。section_divider 可以是 "The section number '03_' in oversize JetBrains Mono dominates the left half, glowing faintly in electric cyan" |
| `{{accent_treatment_with_glow}}` | 明示 cyan / violet 用在哪 + glow 强度量化。⚠️ **glow 强度区间**：line 12-16 px，numeral 6-10 px。⚠️ 第二翻车教训（Image 7 → 8）：glow 不能太强，强到让其他文字相对发暗。**颜色差是主信号，glow 是辅助**。<br>❌ 弱（最初翻车）："glowing faintly"<br>❌ 过强（第二次翻车）："halo extending 24 to 32 pixels"——非高亮内容相对变得 illegible<br>✅ 平衡："The slope line representing '95 to 5' is drawn in electric cyan at approximately 1.5 times the weight of the non-emphasized lines, with a moderate cyan halo extending approximately 12 to 16 pixels along its length — clearly visible but not overpowering the rest of the slide. The non-emphasized slope lines remain clearly readable in bright off-white, fully legible, distinct from the background — they are non-emphasized, not invisible."<br>例 KPI："The numeral '5' is rendered in large Inter Bold electric cyan, with a moderate cyan halo extending roughly 8 to 10 pixels around it." |
| `{{data_or_monospace_block}}` | 如果本页有 monospace 装饰（如时间戳、章节编号、版本号、code-style 序列） → 描述位置和内容。例 "A small JetBrains Mono timestamp '2026.05.11 — 14:23 UTC' sits in the lower-right corner in dim grey, lending a real-time data feel"。无则填空 |

其他占位符同 `soft-dusty-purple.md`。

## 风格特定的 anti-leakage 追加项

追加 negative prompt：

```
do not render visible code, terminal prompts, or programming syntax (like "$ command", 
"function() {}", "import ...") as decoration unless that code IS the actual content;
do not introduce warm colors (cream, ochre, beige, brown) — they break the dark-mode mood;
do not use serif typefaces or script fonts;
do not render the words "Glow", "Bloom", "Neon", "Grid" as themselves (they describe 
effects, not text content);
do not add fake "loading" or "processing" UI elements unless intentional;
the image must read as a polished tech keynote, not a hacker-aesthetic theme.
```

## 一句话风格指纹

"Linear 和 a16z 联合主演——深蓝黑底配 cyan 辉光，等宽字体是行业暗号。"
