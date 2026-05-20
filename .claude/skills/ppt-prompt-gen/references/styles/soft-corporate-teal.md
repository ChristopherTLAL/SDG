# Style Pack — Soft Corporate Teal

> 高端咨询风的"公司版" — 继承 soft-dusty-purple 的骨架，把灰紫换成新东方前途 FY26 苏州模板的青绿/薄荷主色。
> 适合：内部述职、年度汇报、放进公司模板里做主图的高级感视觉。

## 视觉基调

- 关键词：airy / gentle / intellectual / corporate-restrained / teal-mint-accent
- 适用：新东方前途内部述职 / 年度评估 / 跨条线汇报 / 任何要放进 FY26 公司模板的内容
- 不适用：投资人路演（不够 punchy）、TMT 产品发布（太柔）、需要"商业 aggressive 感"的场景
- 灵感：保留 soft-dusty-purple 的 Kinfolk × McKinsey 气质 — 但把灰紫的"sophisticated lady"调性，换成公司视觉系统的青绿"clinical premium"调性

## 配色系统

### Hex 速查（仅本 skill 内部参考，**绝对不要让 hex 进入 prompt_en**）

| 角色 | Hex | 自然语言描述 |
|:--|:--|:--|
| Canvas | `#FFFFFF` | pure white |
| Structure block bg | `#F4F9F7` | an extremely faint cool-grey with the barest hint of mint-teal |
| Separator | `#DCE5E1` | very light mint-grey, almost neutral |
| Primary text | `#2D2D2D` | soft charcoal (avoiding pure black) |
| Body text | `#4A4A4A` | deep grey |
| Secondary / meta | `#808080` | mid grey |
| Passive data | `#C0C0C0` | silver grey |
| **Accent — Corporate Teal** | `#1E99C1` | a clean, confident teal-cyan — the brand-identity color, used as the single story-point accent |
| **Accent dark** | `#409486` | a deeper forest-teal, used for emphasis weight |
| **Accent secondary** | `#63C8AE` | a fresh mint, used very sparingly for secondary highlights |
| Accent pale bg | `#DBF0DB` | a barely-there pale mint, used as a subtle background tint for emphasis blocks / insight bars |

### 用色原则（写入 prompt 的描述方式）

- **背景永远纯白**；`#F4F9F7` 用于模块分区背景（描述为 "extremely faint cool-grey blocks with the barest mint hint, delineating modules"）
- **文字三阶灰**：标题用 soft charcoal，正文用 deep grey，辅助文字用 mid grey
- **Accent 仅用于"故事点"**：每页 1-2 个核心数据 / 关键文本用 corporate teal 高亮，其他全灰
- **三个青绿层级使用规则**：
  - `#1E99C1`（teal-cyan）= 主 accent，故事点 / 数据高亮 / 顶部色带
  - `#409486`（forest teal）= 次级强调，标题装饰线 / 重要数据 second tier
  - `#63C8AE`（mint）= sparingly — 仅用于次次级或图表系列中的第二色
- **Pale mint `#DBF0DB` 用于"insight bar"**：每页底部如果有总结性洞察，用 pale mint 作为微弱背景条带
- **绝对禁忌**：饱和的纯青、霓虹蓝、对比强烈的双色调、彩虹色 categorical palette、绿色变得太"healthcare"或"environmental"

## 字体规则

- **中文主字体**：Microsoft YaHei（微软雅黑）— 这是公司模板的原生字体，图像层与文本层视觉无缝
  - 在 prompt_en 中描述为 "a clean modern Chinese sans-serif resembling Microsoft YaHei (微软雅黑) — neutral, slightly humanist, optimized for corporate-screen reading"
- **英文 fallback**：Arial / Helvetica（公司模板英文也是 Arial）
- **层级**：
  - H1 主标题：YaHei Bold，soft charcoal `#2D2D2D`
  - H2 区块标题：YaHei Medium 或 Bold，deep grey `#4A4A4A`
  - Body：YaHei Regular，deep grey
  - Data Highlight：YaHei Bold，corporate teal
  - Block highlight：pale mint 背景 + YaHei deep slate

## 密度规则（按页型差异化）

完全继承 soft-dusty-purple：

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

- **鼓励**：Harvey Balls、Waterfall、Slope Graph、Marimekko、Donut、Treemap、Funnel、2×2 Matrix、Pyramid、Radar（多维评分）、Big Number、Roadmap timeline、Layered architecture diagram
- **慎用**：饱和色的 categorical palette（改用同色系深浅 — 主 teal → forest teal → mint 三层）、复杂 network 图（太"工程"）
- **禁用**：简单 Pie Chart（一律改 Donut）、3D 任何图表、卡通 icon、彩虹色、emoji（与公司模板调性冲突）

## Prompt 骨架（喂给生图 AI 的英文 prompt 模板）

填充占位符（`{{...}}`）后即为最终 `prompt_en`。占位符替换后**绝不能留 `{{...}}` 字符在最终字符串里**。

```
A consulting-grade presentation slide, 16:9 aspect ratio, with elegant corporate-teal
and grayscale aesthetics — the visual language of a Chinese education-corporation
internal annual report deck, premium but restrained. Background is pure white. The
overall mood is airy, gentle, intellectual, and quietly confident — like a McKinsey
report wearing the brand colors of a clinical-premium education group.

This is a {{page_type_natural_language}} page. {{narrative_position_descriptor}}.

Title at the top reads "{{title_zh}}"{{title_en_inline_suffix}}, set in a clean modern
Chinese sans-serif resembling Microsoft YaHei (微软雅黑) Bold in soft charcoal —
substantial but not overpowering.

{{main_content_block_natural_language}}

{{accent_treatment}}

{{insight_bar_or_takeaway}}

Typography: Microsoft YaHei (微软雅黑) for Chinese text and Arial for any English
characters, both at matched weights. Three levels of grey are used — soft charcoal
for headings, deep grey for body text, mid grey for axis labels and meta information.
Passive data uses silver grey. Module backgrounds, where present, are an extremely
faint cool-grey with the barest hint of mint-teal. Separators are thin very-light
mint-grey lines, almost neutral.

The accent color — a clean confident teal-cyan, brand-identity rather than vibrant —
is used exclusively to highlight the story-critical data points. A deeper forest-teal
is used very sparingly for secondary emphasis (titles, key dividers). A fresh mint
appears only when a chart needs a clearly-secondary series color. Pale mint may
appear as a faint background tint behind emphasis blocks or insight bars, but never
as a foreground color.

Flat design, no gradients (a single subtle horizontal teal band at the top edge is
acceptable as a brand-identity nod, but no gradients elsewhere), no shadows, no 3D
effects. Sophisticated chart styling, with thin grey lines and minimalist linear
icons where icons appear. Information density is high — generous use of faint
mint-tinted blocks for modular separation rather than relying on white space alone.
{{logo_clause}} {{page_number_clause}} {{footer_clause}}

NEGATIVE PROMPT (do not render any of these as visible text in the image): square
brackets like [Module 1] or [Title], hex color codes like #1E99C1 or #FFFFFF,
percentage values like 30% or 50/50, words like "Module", "Section", "Layout",
"Instructions", "Visual elements", "Heading is", "Bottom Insight Bar", or any other
structural markup or meta-commentary. Do not render placeholder text like "Your
Title Here" or bracketed instructions. The image should contain only the actual
presentation content: titles, body text, data labels, and chart elements. Avoid any
"healthcare", "environmental", or "wellness brand" connotations — the teal here is
corporate-education, not pharma or eco.
```

## 占位符填充指南

完全沿用 soft-dusty-purple 的占位符指南（同 schema），唯一不同：

| 占位符 | 此 pack 的注意点 |
|:--|:--|
| `{{accent_treatment}}` | 描述高亮时，用 "highlighted in the corporate teal-cyan accent" 或 "drawn in the deeper forest-teal for emphasis"，**不要**写 hex 码 |
| `{{insight_bar_or_takeaway}}` | "At the bottom, a thin pale-mint band contains a single line of insight text reading '...'" — 把 lilac 换成 mint |
| `{{title_en_inline_suffix}}` | 同 soft-dusty-purple |
| 其他 | 与 soft-dusty-purple 一致 |

## 风格特定的 anti-leakage 追加项

- **不要在图里渲染色相关键词**：禁止出现 "teal"、"cyan"、"mint"、"forest green" 这种英文色彩词作为图中可见文字
- **不要让"健康/环保/医疗"视觉元素混入**：青绿色容易触发 AI 联想到 wellness / hospital / sustainability，要在 negative prompt 里显式排除（已在骨架中）

## 一句话风格指纹

"像新东方公司年报的杂志精装版 — 把 Kinfolk × McKinsey 的优雅，换成 clinical premium 的青绿语言。"

## 与 soft-dusty-purple 的差异表

| 维度 | soft-dusty-purple | soft-corporate-teal |
|:--|:--|:--|
| 主 accent | `#7B7393` 灰紫 | `#1E99C1` 青绿 |
| 深 accent | `#5E5770` 灰紫深 | `#409486` 森林青 |
| 次 accent | — | `#63C8AE` 薄荷（图表第二色） |
| Pale 背景 | `#EEEBF2` 雾紫 | `#DBF0DB` 雾薄荷 |
| 中文字体 | 思源黑体 | 微软雅黑（贴合公司模板） |
| 英文字体 | Inter / Helvetica | Arial / Helvetica |
| 调性形容 | sophisticated lady | clinical premium |
| 风险词 | — | "healthcare/wellness/eco" 联想要排除 |
| 其他规则 | — | 顶部允许 1 道 subtle horizontal teal 色带，模拟公司模板的封面带 |
