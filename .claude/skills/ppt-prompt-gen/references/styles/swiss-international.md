# Style Pack — Swiss International（瑞士国际主义）

> 网格至上，几何为骨，黑白红三色定乾坤。

## 视觉基调

- 关键词：grid-based / objective / rationalist / asymmetric / functionalist / Müller-Brockmann
- 适用：学术报告、数据密集汇报、技术文档、严肃议题、设计 / 建筑 / 工程行业
- 不适用：销售 deck（太冷）、教育 / 儿童内容（太严肃）、品牌叙事（太"工具感"）
- 灵感：Josef Müller-Brockmann、Helvetica、Massimo Vignelli、Documenta 海报

## 配色系统

### Hex 速查

| 角色 | Hex | 自然语言描述 |
|:--|:--|:--|
| Canvas | `#FFFFFF` | pure white |
| Primary text | `#000000` | true black (no softening) |
| Body text | `#1A1A1A` | near-black |
| Grid lines / dividers | `#D4D4D4` | light grey |
| Secondary | `#737373` | mid grey |
| **Accent — Signal Red** | `#E60012` | a precise, signal-red, like the Swiss flag |
| Accent alternate | `#0066CC` | precise rationalist blue (used sparingly when red is not appropriate) |

### 用色原则

- **黑、白、灰、红——四色封闭系统**，绝对不引入第五色
- 红色仅用于：① 1-2 个核心数据高亮 ② 章节编号 ③ 关键 callout 边框
- 文字用真黑（不软化）—— Swiss 风的严肃感来自这点
- 模块分区**不用色块**，用细线 / 网格 / 留白
- 绝对禁忌：渐变、阴影、半透明、装饰性色块

## 字体规则

- **中文主字体**：思源黑体 Source Han Sans（紧凑字距）
- **英文主字体**：Helvetica Neue（首选）或 Inter（fallback）—— Swiss 风的灵魂
- **层级**：
  - H1 主标题：Helvetica Neue Bold 或 Black，紧凑字距，常**左对齐**且不居中
  - H2 区块标题：Helvetica Neue Medium，全大写或首字母大写
  - Body：Helvetica Neue Regular，行高紧凑（1.3-1.4），左对齐
  - 数据标签：Helvetica Neue Light 或 Regular，常**等宽数字**
  - 章节编号：超大字号（H0），常占页面 30%+ 面积

## 密度规则

| 页型 | 留白率 | 模块数 | 主图 / 辅图 |
|:--|:--|:--|:--|
| cover | 30-50%（左下角大号 typography）| 1 大标题 + 1 章节号 | 0 |
| toc | 25-35% | 5-10 章节 | 章节号 + 标题 + 页码 |
| section_divider | 40-50%（大号章节号占主导）| 1-2 元素 | 0 |
| content | 15-25% | 网格化 4-6 模块 | 2-3 图表（geometric）|
| data | 15-25%（数据密集，留白来自网格）| 主图 + 数据表 | 1 主 + 表格 / sparkline |
| comparison | 20-25% | 严格对称栏 | 对称几何图 |
| process | 25-30% | 编号步骤 | 线性流程 |
| quote | 30-40% | 大字 + 来源 | 0 |
| summary | 25-30% | 编号 list | 0 或极简 |

## 可视化偏好

- **鼓励**：Bar Chart（极简，无装饰）、Line Chart（细线，无填充）、Slope Graph、Dot Plot、Scatter、Histogram、Box Plot、Stacked Bar、Sparkline、Heatmap（黑白灰）、严肃的 Sankey / Network
- **慎用**：Donut / Pie（不够 rationalist）、卡通 icon、隐喻图（Pyramid / Iceberg / Temple）
- **禁用**：3D 任何图表、watercolor 风格、装饰性 infographic、Pictograph、Waffle Chart（除非数据严肃）

## Prompt 骨架

```
A Swiss International Style presentation slide, 16:9 aspect ratio, in the rationalist 
tradition of Josef Müller-Brockmann and Helvetica typography. Background is pure white. 
The mood is precise, objective, grid-based, and functionalist — no decoration, no 
softening, only structure and signal.

This is a {{page_type_natural_language}} page. {{narrative_position_descriptor}}.

The layout is built on a strict modular grid. {{grid_description}} Asymmetric balance 
is preferred over centered symmetry — content sits where the grid demands, not where 
sentiment would place it.

Title "{{title_zh}}"{{title_en_inline_suffix}} is set in Helvetica Neue Bold (with 
Source Han Sans for Chinese characters), left-aligned, in true black. The title sits 
in the upper-left or upper-third of the page following the grid.

{{main_content_block_natural_language}}

{{accent_treatment_red}}

{{section_number_if_applicable}}

Typography is exclusively Helvetica Neue for Latin characters and Source Han Sans for 
Chinese, with tight letter spacing and a line height of approximately 1.3. Data labels 
use a monospaced variant or tabular-figure setting for numerical alignment. All text is 
true black (#000000-equivalent), with mid-grey used only for secondary metadata and 
axis labels. Light grey thin lines define the grid and dividers.

The accent color — a precise signal red, evocative of the Swiss flag — appears only 
in two or three controlled locations per page: highlighting a single core data point, 
marking the section number, or framing one critical callout. Nothing else is colored. 
No gradients, no shadows, no 3D effects, no decorative shapes.

Charts are geometric and stripped of ornamentation: bars are flat rectangles, lines 
are thin and unfilled, axes have minimal tick marks. Icons, if any, are pure linear 
geometry — no fills, no flourishes. {{logo_clause}} {{page_number_clause}} 
{{footer_clause}}

NEGATIVE PROMPT (do not render any of these as visible text in the image): square 
brackets like [Module 1] or [Title], hex color codes like #E60012 or #FFFFFF, 
percentage values, words like "Module", "Section", "Layout", "Grid", "Instructions", 
"Visual elements", "Heading is", or any structural markup or meta-commentary. Do not 
render placeholder text like "Your Title Here". Do not introduce additional colors 
beyond black, white, grey, and signal red. Do not add decorative elements, gradients, 
or shadows. The image must contain only actual presentation content set in the 
prescribed typography.
```

## 占位符填充指南

| 占位符 | 怎么填 |
|:--|:--|
| `{{grid_description}}` | 描述本页布局，**用自然语言空间词，不要反复说 "column N"**。🔴 翻车教训（Image 5 暴露）：prompt 里 column 提多了（"columns 1-6"、"columns 7-12"、"column six and a half"、"left-column"、"right-column"等），模型会把列号渲染成画布上的可见刻度（ruler tick marks），违反"grid 不可见"原则。<br>❌ 错（密集 column 提及）："A 12-column grid is implied; content uses columns 1-7 for the main chart, columns 8-12 for sidebar, with a vertical rule at column 7"<br>✅ 对（自然语言空间词）："The page is divided into a left two-thirds chart area and a right one-third sidebar, with a single thin vertical rule between them"<br>✅ 对（asymmetric halves）："The page is split into asymmetric halves — the section number occupies the left third in oversize Helvetica Bold, the section title sits in the right two-thirds in smaller weight"<br>规则：用 "left half / right third / upper portion / lower edge / vertical rule" 这种空间词；"column 数字" 全 deck 累计不超过 1 次，超了就重写 |
| `{{accent_treatment_red}}` | **必须显式列举每一处独立的红色位置**（最多 3 处）。⚠️ 关键：如果同一个元素出现在多列/多行（如"两栏都高亮 TOEFL 行"），**每一栏算作独立的一处**，不能合并表述为"两处"。<br>❌ 错（之前翻车的写法）："The accent appears in two locations: the 7.0 header, and the TOEFL new row in both columns"<br>✅ 对（必须这样写）："The accent appears in exactly three locations: (1) the right-column '7.0' header numeral set in signal red, (2) the left-column 'TOEFL iBT new (1-6)' row label and value set in signal red, (3) the right-column 'TOEFL iBT new (1-6)' row label and value set in signal red."<br>—— 用编号列表 + 各位置用具体的元素描述 + 重复列出每个实例。模型才会一处不漏 |
| `{{section_number_if_applicable}}` | 内容页：` ` (空)。section_divider 页：" The section number '02' is the dominant visual element, occupying roughly one-third of the page in oversize Helvetica Bold, in true black or signal red" |

其他占位符同 `soft-dusty-purple.md` 用法。

## 风格特定的 anti-leakage 追加项

追加 negative prompt：

```
do not introduce any color beyond the four-color palette (black, white, grey, signal red);
do not render decorative icons or illustrations beyond pure geometric forms;
do not use serif typefaces or script fonts;
do not center-align body text;
do not render the word "Grid", "Column", or any column numbers as visible text;
do not render ruler tick marks, design-software canvas guides, measurement marks, or numerical column indicators along the page edges — the grid is a structural alignment device only, never a visible decoration;
do not draw horizontal or vertical grid lines as decorative texture; the only permitted lines on the page are: (a) the single thin rule beneath the title, and (b) row separator lines within data tables.
```

## 一句话风格指纹

"Müller-Brockmann 给你做的 deck——每一像素都在网格里，红色是唯一的允许的小情绪。"
