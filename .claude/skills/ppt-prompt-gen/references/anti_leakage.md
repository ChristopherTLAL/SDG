# Anti-Leakage Protocol — 防泄露协议

## 什么是"prompt 泄露"

下游生图 AI（nano-banana-pro / Imagen / Flux / Midjourney）拿到 prompt 后，**有时会把 prompt 里的指令性文字直接当成可见内容渲染进图里**。例如：

- prompt 里写 `[Module 1: Bar Chart at 30% width]` → 图里真的出现 "[Module 1]" 几个字
- prompt 里写 `Use color #7B7393 for highlight` → 图里出现 "#7B7393" 文本
- prompt 里写 `Heading is "[在此填入区域标题]"` → 图里渲染出 "[在此填入区域标题]"

一旦泄露 → 整页废掉，全 deck 风格连锁污染（因为 batch 生成）。这是 image gen 的高频翻车原因。

## 双层防御

### 第一层：消除结构性 markup（首要）

**所有 prompt 内容必须用纯自然语言英文描述**，不要让任何结构标记 / 占位符 / 元指令出现在 prompt 字符串里。

#### 禁用语法（绝对不能出现在最终 prompt 里）

| 类型 | 错误示例 | 正确写法 |
|:--|:--|:--|
| 方括号占位符 | `Title: "[在此填入]"` | `Title: "Q3 Revenue Analysis"`（直接填实际文字）|
| 花括号变量 | `{TITLE}`、`{HIGHLIGHT_COLOR}` | 在生成 prompt 时已全部替换 |
| 编号 module 标签 | `[Module 1]`、`[Section A]` | `The top-left area shows...` `The right column contains...` |
| Hex 色号 | `#7B7393`、`#FFFFFF` | `soft dusty purple tone`、`pure white background` |
| 百分比布局 | `30% width`、`50/50 split` | `taking about one-third of the page`、`evenly split into two columns` |
| Markdown 语法 | `**bold**`、`# Heading` | `displayed in bold weight`、`as a large headline` |
| 程序员符号 | `→`、`<flow>`、`/* comment */` | `flowing into`、`with`、（删除注释）|
| 元指令前缀 | `Instructions:`、`Visual elements:`、`Layout:` | 直接陈述视觉内容，不加 label |

#### 自检：把 prompt 念一遍

写完 prompt 后假设自己是图像 AI，问"如果我老老实实把 prompt 里每个字符都当成应该在图里出现的内容，会不会有任何技术性 token 被渲染？" 如果答案不是"100% 不会"，重写。

### 第二层：显式 negative prompt（兜底）

每页 prompt 末尾必须附上一段固定的 negative 描述，明确告诉 AI 哪些字符串绝对不能出现在图里：

```
NEGATIVE PROMPT (do not render any of these as visible text in the image):
square brackets like [Module 1] or [Title], hex color codes like #7B7393 or #FFFFFF,
percentage values like 30% or 50/50, words like "Module", "Section", "Layout", "Instructions",
"Visual elements", "Heading is", "Bottom Insight Bar", or any other structural markup or meta-commentary.
The image should contain only the actual presentation content: titles, body text, data labels, and chart elements.
```

这段在每页 prompt 都要带，**作为安全网**——即使第一层有疏漏，第二层兜住。

## Phase 3 写 prompt 时的具体规则

### 规则 1：先写"可见内容"，再写"视觉指令"

把 prompt 分成两段清晰区分：

```
[CONTENT BLOCK — describes only what is visible in the image]
A consulting-style slide titled "Q3 Revenue Breakdown". The main area shows a waterfall 
chart with five bars: revenue starts at 12.4M, decreases by 1.8M for refunds, decreases 
by 0.6M for discounts, increases by 0.4M for upsells, ending at 10.4M net. The middle 
"refunds" bar is highlighted in soft dusty purple while the others are in light grey. 
Below the chart sits a single insight line reading "Refunds drove 78% of total leakage".

[STYLING BLOCK — visual instructions, NOT content to render]
Typography uses Source Han Sans throughout. Background is pure white. Generous white 
space with maximum 20% density. Flat design, no gradients or shadows. Sophisticated 
chart styling without 3D effects.

[NEGATIVE PROMPT — what must NOT appear as text]
... (see above)
```

注意：styling block 用陈述句（"Typography uses..."），不用指令式标签（不写 `Typography:` 后面跟内容）。

### 规则 2：填充占位符的时机

在主流程内的 prompt 模板里可以用 `{STUDENT_NAME}` / `{KEY_INSIGHT}` 这种占位符——但 **Phase 3 输出 JSON 前必须 100% 替换**。检查方法：

```bash
# 在 prompt 字符串里搜索这些模式 — 任何一个命中就是 bug
grep -E '\{[A-Z_]+\}|\[在此|\[填入|\[Add|\[TODO|\[here\]|<your_|<insert' 
```

QA checklist 里有这一条，每页必查。

### 规则 3：把"位置描述"自然语言化

需要表达布局位置时，用人话不用代码：

| 想表达 | 错（容易泄露）| 对 |
|:--|:--|:--|
| 左上角 | `top-left module width: 30%` | `In the top-left corner, occupying roughly one-third of the page width` |
| 三栏布局 | `3 columns 33/33/34` | `The page is divided into three equal vertical columns` |
| 一行多 KPI | `[KPI 1][KPI 2][KPI 3]` | `A horizontal row of three large statistic blocks` |
| 上下分割 | `top: chart, bottom: text` | `The upper two-thirds of the page contains the chart; below it sits a single line of insight text` |

## 风格 pack 内的特殊适配

不同风格的 negative prompt 可能需要追加专属禁字。每个风格 pack 的 `prompt_template` 字段允许 override 或追加 negative 描述。例如：

- `dark-techno` 风格因为常用等宽字体 + 代码感装饰，要在 negative 里追加：`do not render code snippets, terminal prompts ($), or programming syntax as decorative text unless it is part of the actual content`
- `editorial-magazine` 因为大字 typography 是核心，要追加：`do not render placeholder words like "Headline Goes Here" or "Subhead" — only actual content`

## 故障案例库

实际跑过的翻车案例，整理在这里供后续 prompt 改进参考：

> **case 1（待跑过补充）**：某次用 nano-banana-pro 生 4 页 deck，第 3 页底部 insight bar 渲染成了 "INSIGHT: [真实的一句话核心总结]" —— prompt 里残留了 `[真实的一句话核心总结]` 占位符没替换。
> **教训**：QA 自检脚本要硬阻断，不能依赖肉眼。

（首次实际使用本 skill 后，把发现的 leakage 案例补到这里）
