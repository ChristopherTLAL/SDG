# Style Pack — Soft Dusty Purple

> 高端咨询风，优雅克制，灰紫为骨。

## 视觉基调

- 关键词：airy / gentle / intellectual / sophisticated / restrained-elegant
- 适用：客户汇报、教育规划、高端咨询、女性向品牌、医疗 / 法律 / 教育行业
- 不适用：投资人路演（不够 punchy）、TMT 产品发布（太柔）、年轻向消费品（太成熟）

## 配色系统

### Hex 速查（仅本 skill 内部参考，**绝对不要让 hex 进入 prompt_en**）

| 角色 | Hex | 自然语言描述 |
|:--|:--|:--|
| Canvas | `#FFFFFF` | pure white |
| Structure block bg | `#F9F9FB` | a very faint warm-grey with the barest hint of lavender |
| Separator | `#E0E0E0` | light grey |
| Primary text | `#2D2D2D` | soft charcoal (avoiding pure black) |
| Body text | `#4A4A4A` | deep grey |
| Secondary / meta | `#808080` | mid grey |
| Passive data | `#C0C0C0` | silver grey |
| **Accent — Soft Dusty Purple** | `#7B7393` | a soft, dusty, muted purple — neither vibrant nor cool, dignified |
| Accent dark | `#5E5770` | a deeper muted slate-purple |
| Accent pale bg | `#EEEBF2` | a barely-there pale lilac, used as a subtle background tint for emphasis blocks |

### 用色原则（写入 prompt 的描述方式）

- **背景永远纯白**；F9F9FB 用于模块分区背景（描述为 "extremely faint warm-grey blocks delineating modules"）
- **文字三阶灰**：标题用 soft charcoal，正文用 deep grey，辅助文字用 mid grey
- **Accent 仅用于"故事点"**：每页 1-2 个核心数据 / 关键文本用 soft dusty purple 高亮，其他全灰
- **Pale lilac 用于"insight bar"**：每页底部如果有总结性洞察，用 pale lilac 作为微弱背景条带
- **绝对禁忌**：饱和的紫（霓虹紫 / 紫罗兰）、对比强烈的双色调、彩虹色 categorical palette

## 字体规则

- **中文主字体**：思源黑体（Source Han Sans）
- **英文 fallback**：Inter / Helvetica Neue（两者均可，按上下文）
- **层级**：
  - H1 主标题：思源黑体 Bold，soft charcoal `#2D2D2D`
  - H2 区块标题：思源黑体 Medium 或 Bold，deep grey `#4A4A4A`
  - Body：思源黑体 Regular，deep grey
  - Data Highlight：思源黑体 Bold，soft dusty purple
  - Block highlight：pale lilac 背景 + 思源黑体 deep slate

## 密度规则（按页型差异化）

| 页型 | 留白率 | 模块数 | 主图 / 辅图 |
|:--|:--|:--|:--|
| cover | 50-60% | 1-2 元素 | 0 图表 |
| toc | 35-40% | 4-7 章节 | 0 图表（导航条/序号）|
| section_divider | 50-60% | 1-2 元素 | 0 图表 |
| content | **15-20%**（密度高，杂志级排版感）| 3-5 模块 | 2-3 图表组合 |
| data | 25-30% | 主图 + 2 辅 | 1 主 + 1-2 辅 |
| comparison | 20-25% | 2-3 栏 | 对称图表组合 |
| process | 25-30% | 节点 + 描述 | 1 主流程图 |
| quote | 60%+ | 1 大字 | 0 图表 |
| summary | 25-35% | 3-5 takeaway | 编号 / icon |

## 可视化偏好

- **鼓励**：Harvey Balls、Waterfall、Slope Graph、Marimekko、Donut、Treemap、Funnel、2×2 Matrix、Pyramid、Radar（多维评分）、Big Number
- **慎用**：饱和色的 categorical palette（改同色系深浅）、复杂 network 图（太"工程"）
- **禁用**：简单 Pie Chart（一律改 Donut）、3D 任何图表、卡通 icon、彩虹色

## Prompt 骨架（喂给生图 AI 的英文 prompt 模板）

填充占位符（`{{...}}`）后即为最终 `prompt_en`。占位符替换后**绝不能留 `{{...}}` 字符在最终字符串里**。

```
A consulting-grade presentation slide, 16:9 aspect ratio, with elegant soft-dusty-purple 
and grayscale aesthetics. Background is pure white. The overall mood is airy, gentle, 
intellectual, and sophisticated — like a McKinsey or BCG deck softened with editorial 
restraint.

This is a {{page_type_natural_language}} page. {{narrative_position_descriptor}}.

Title at the top reads "{{title_zh}}"{{title_en_inline_suffix}}, set in Source Han Sans 
Bold in soft charcoal — substantial but not overpowering.

{{main_content_block_natural_language}}

{{accent_treatment}}

{{insight_bar_or_takeaway}}

Typography: Source Han Sans throughout (with Inter as the English fallback for any 
Latin characters). Three levels of grey are used — soft charcoal for headings, deep 
grey for body text, mid grey for axis labels and meta information. Passive data uses 
silver grey. Module backgrounds, where present, are an extremely faint warm-grey with 
the barest hint of lavender. Separators are thin light grey lines.

The accent color — a soft, dusty, muted purple, dignified rather than vibrant — is 
used exclusively to highlight the story-critical data points. Pale lilac may appear 
as a faint background tint behind emphasis blocks, but never as a foreground color.

Flat design, no gradients, no shadows, no 3D effects. Sophisticated chart styling, 
with thin grey lines and minimalist linear icons where icons appear. Information 
density is high — generous use of grey blocks for modular separation rather than 
relying on white space alone. {{logo_clause}} {{page_number_clause}} {{footer_clause}}

NEGATIVE PROMPT (do not render any of these as visible text in the image): square 
brackets like [Module 1] or [Title], hex color codes like #7B7393 or #FFFFFF, 
percentage values like 30% or 50/50, words like "Module", "Section", "Layout", 
"Instructions", "Visual elements", "Heading is", "Bottom Insight Bar", or any other 
structural markup or meta-commentary. Do not render placeholder text like "Your Title 
Here" or bracketed instructions. The image should contain only the actual presentation 
content: titles, body text, data labels, and chart elements.
```

## 占位符填充指南

| 占位符 | 怎么填 |
|:--|:--|
| `{{page_type_natural_language}}` | 用 `page_types.md` 里该页型的自然语言描述。例 cover → "an opening cover slide"；content → "a content slide with three to five parallel modules" |
| `{{narrative_position_descriptor}}` | 一句话说明本页在叙事弧上的位置。例 "This slide opens the problem section by establishing the current state" |
| `{{title_zh}}` | Phase 2 outline 里的中文标题，原样填 |
| `{{title_en_inline_suffix}}` | 中英混排时填 ` (English Title)`；纯中文时填空字符串 |
| `{{main_content_block_natural_language}}` | 描述本页主体——用了哪些图表 / 模块 / 数据点。**核心**：要包含每个图表的视觉细节、数据点的具体值、模块之间的空间关系（用 "top-left"、"a horizontal row"、"the central area" 等位置词，不用 "Module 1" 这种标签） |
| `{{accent_treatment}}` | 明确说哪些数据 / 文本用 accent 色高亮。例 "The 'IELTS' dimension is highlighted in soft dusty purple to draw attention to it being the primary risk" |
| `{{insight_bar_or_takeaway}}` | 如果本页有底部洞察条，描述 "At the bottom, a thin pale-lilac band contains a single line of insight text reading '...'"。没有就填空 |
| `{{logo_clause}}` | deck_invariants.logo_position 非 null → 描述位置 + logo 内容；null → 填空 |
| `{{page_number_clause}}` | 同上 |
| `{{footer_clause}}` | 同上 |

## 风格特定的 anti-leakage 追加项

无追加（标准 negative prompt 已覆盖）。

## 一句话风格指纹

"像 Kinfolk 杂志和 McKinsey 报告的私生子——理性的版式骨架，搭配最克制的奢华感。"
