# Visualization Library — 全谱系图表库 + 选型决策

本库被所有风格共享。AI 在 Phase 2 / Phase 3 选图表时根据**数据形态 × 沟通意图 × 风格偏好**三维度组合决定。先用决策表快速锁定 2-3 个候选，再细看每个图表的"何时用 / 何时避"。

---

## Part 1：选型决策表（先查这个）

读懂这张表 = 80% 选型决策完成。

### 横轴：沟通意图（你想让受众看到什么）

| 意图 | 信号词 |
|:--|:--|
| **构成** | "占比"、"组成"、"分解为"、"几大块" |
| **对比** | "vs"、"对照"、"哪个更"、"差距" |
| **趋势** | "随时间"、"变化"、"增长"、"下降" |
| **流程** | "步骤"、"阶段"、"先后"、"流向" |
| **分布** | "范围"、"集中度"、"离群"、"散点" |
| **关系** | "因果"、"相关"、"连接"、"网络" |
| **框架** | "矩阵"、"维度"、"模型"、"分类" |
| **进度** | "完成度"、"状态"、"达成率" |
| **地理** | "区域"、"国家"、"分布在哪" |

### 纵轴：数据形态

| 形态 | 例子 |
|:--|:--|
| 1 个数 | 转化率 73% |
| 多个分类数（< 10） | 5 个产品的销售额 |
| 多个分类数（> 10） | 50 个国家的 GDP |
| 时间序列 | 12 个月的 MRR |
| 2 个连续变量 | 价格 vs 销量 |
| 层级结构 | 公司部门 → 团队 → 个人 |
| 流向 / 关系 | 用户从来源 A 流到目的 B |
| 完成度 / 比例 | 项目进度 67% |

### 主决策表

| 意图 \ 数据 | 1 个数 | 分类（少）| 分类（多）| 时间序列 | 2 连续 | 层级 | 流向 | 比例 |
|:--|:--|:--|:--|:--|:--|:--|:--|:--|
| **构成** | Donut / Waffle | Stacked Bar / Donut | Treemap | Stacked Area | — | Treemap / Sunburst | Sankey | Waffle |
| **对比** | Big Number / Gauge | Clustered Bar / Slope | Dot Plot | Slope Graph | Scatter | — | — | Harvey Balls |
| **趋势** | Sparkline | — | — | Line / Area / Step | Connected Scatter | — | Streamgraph | — |
| **流程** | — | Chevron / Process | — | Gantt / Timeline | — | Decision Tree | Flowchart / Swimlane | Progress Bar |
| **分布** | — | Box Plot | Histogram | — | Scatter / Bubble | — | — | — |
| **关系** | — | — | Heatmap | — | Scatter / Bubble | Network / Tree | Chord / Sankey | — |
| **框架** | — | 2×2 / 3×3 Matrix | — | — | — | Pyramid / Funnel | Venn | — |
| **进度** | Progress Ring / Gauge | Harvey Balls | — | Burndown | — | — | — | Stacked Progress |
| **地理** | — | Choropleth | Bubble Map | — | — | — | Connection Map | Cartogram |

**用法**：在 Phase 2 outline 里给每页填 chart 类型时，先定位意图列 + 数据行，给出 2-3 个候选，让用户选。

---

## Part 2：图表全谱系（按家族分组）

### A. 比较与构成（Comparison & Composition）

#### A1. Clustered Bar / Grouped Bar Chart（分组柱状图）
- **用于**：3-7 个分类的并列对比，每类下 2-4 个子项
- **避免**：分类 > 8（条数太多看不清，改 dot plot）、子项 > 4（颜色超载）
- **替代**：Slope Graph（如果是"两时间点对比"）

#### A2. Stacked Bar / Stacked Column Chart（堆叠柱状图）
- **用于**：总量 + 组成的同时展示
- **避免**：组成项 > 5（识别困难，改 100% Stacked 或 Treemap）
- **替代**：100% Stacked Bar（只关心占比不关心绝对值）

#### A3. 100% Stacked Bar
- **用于**：纯占比对比，跨多个分类
- **避免**：单一时间点 + 单一对象（用 Donut 反而清楚）

#### A4. Waterfall Chart（瀑布图）
- **用于**：增减项分解（"从 100 到 87 是怎么减下来的"）
- **避免**：项数 > 8、增减项无明显归类

#### A5. Butterfly Chart / Tornado Chart（蝴蝶图）
- **用于**：左右严格对比（男 vs 女、产品 A vs B 各项指标）
- **避免**：对比维度 < 4（用 clustered bar 就够）

#### A6. Marimekko / Mosaic Plot
- **用于**：市场份额 × 市场规模（双维度构成）
- **避免**：受众不懂 mekko（学术 / 老板友好，公众不友好）

#### A7. Donut Chart（环形图）
- **用于**：单一对象的 2-5 个组成（**优先于 Pie，中心可放总数 / 关键百分比**）
- **避免**：组成项 > 5、需要精确对比扇区大小（人眼读角度不准）

#### A8. Treemap（矩形树图）
- **用于**：层级 + 占比双重（部门 → 团队 → 个人销售额）
- **避免**：层级 > 3、最小单元面积 < 总面积 1%（看不见）

#### A9. Waffle Chart（华夫格图）
- **用于**：具象化百分比（10×10 格子，填多少格表示百分之多少）
- **优势**：直观、可爱、易记
- **避免**：精度要求高（无法表示 67.3%）

#### A10. Dot Plot / Cleveland Dot Plot
- **用于**：分类多（> 10）的排名对比，比柱状图更省空间
- **避免**：分类 < 5（用 bar 反而清楚）

#### A11. Big Number / KPI Card
- **用于**：单一关键数字 + 简短上下文（"+ 23% YoY"）
- **必备**：数字本身字号巨大；上下文文字 ≤ 1 行
- **常用组合**：3-4 个 KPI card 横向排列

---

### B. 趋势与变动（Trend & Change）

#### B1. Line Chart（折线图）
- **用于**：时间序列连续变化，1-5 条线对比
- **避免**：线条 > 5（视觉混乱，改 small multiples）、X 轴不是有序变量

#### B2. Area Chart
- **用于**：单一序列的累积量感（强调"总量"而非"变化率"）
- **避免**：多条线堆叠（改 stacked area）

#### B3. Stacked Area Chart
- **用于**：多个序列的累积演化（每层是构成项）
- **避免**：组成项 > 5、中间层难以读出绝对值

#### B4. Sparklines（迷你折线）
- **用于**：嵌入表格 / KPI card 旁的小型趋势暗示
- **必备**：无坐标轴、无图例，只展示形状
- **常见组合**：表格每行一个 sparkline，体现该项的近期走势

#### B5. Step Line Chart（阶梯图）
- **用于**：离散更新的时间序列（利率变化、版本号发布）
- **避免**：连续平滑变化的数据（用普通 line）

#### B6. Slope Graph（斜率图）
- **用于**：两时间点 / 两状态间的多对象对比（"2023 vs 2024 排名变化"）
- **优势**：在小空间里展示大量对象的方向变化
- **避免**：中间过程重要（改 line chart）

#### B7. Streamgraph
- **用于**：多个时间序列的有机流动感（文化趋势 / 话题热度）
- **避免**：精确读值（streamgraph 是"感觉派"，不读数）、严肃商业场景

#### B8. Connected Scatter Plot
- **用于**：两个连续变量随时间演化的轨迹
- **避免**：受众不熟悉、点数 > 15（轨迹乱）

---

### C. 流程与进度（Process & Timeline）

#### C1. Chevron Process（箭头流程）
- **用于**：3-7 个线性步骤
- **必备**：每个 chevron 内有步骤编号 + 标题
- **避免**：步骤 > 7（折成两行或换 swimlane）

#### C2. Timeline（时间线）
- **用于**：标注关键事件的时间分布（项目里程碑、历史大事）
- **变体**：水平 timeline（多事件）/ 垂直 timeline（叙事感强）

#### C3. Gantt Chart（甘特图）
- **用于**：多任务在时间轴上的并行 / 顺序关系
- **避免**：任务 > 15（信息超载，分阶段）

#### C4. Circular Process（环形流程）
- **用于**：循环 / 迭代步骤（PDCA / OKR cycle）
- **避免**：线性流程硬掰成循环（叙事不诚实）

#### C5. Flywheel Model（飞轮模型）
- **用于**：自增强的循环动力（Amazon flywheel）
- **必备**：每个节点是一个"因"，箭头表示"导致"
- **避免**：节点 < 3 或 > 6

#### C6. Flowchart（流程图）
- **用于**：包含决策分支的复杂流程
- **避免**：分支 > 3 层（受众跟不上）

#### C7. Swimlane Diagram（泳道图）
- **用于**：跨部门 / 跨角色的协作流程
- **必备**：横向泳道代表角色 / 部门，纵向是时间
- **避免**：泳道 > 5

#### C8. Value Stream Map（价值流图）
- **用于**：精益生产 / 业务流程优化场景
- **避免**：非制造业 / 非流程优化的场景（杀鸡用牛刀）

#### C9. Gauge / Speedometer（仪表盘）
- **用于**：单一指标对达成目标的位置（KPI 达成率）
- **避免**：多个 gauge 并列（改 progress bar 行）

#### C10. Progress Bar（进度条）
- **用于**：多项任务 / 多个指标的完成度对比
- **必备**：百分比标签、起点终点清晰

#### C11. Harvey Balls（哈维球 ●◐◑○）
- **用于**：定性评分（"高 / 中高 / 中 / 低"）跨多个维度
- **优势**：节省空间，矩阵式呈现
- **避免**：精确数值（定性才用）

#### C12. Burndown / Burnup Chart
- **用于**：敏捷 / 项目剩余工作量随时间变化
- **避免**：非项目管理场景

---

### D. 战略与框架（Strategy & Frameworks）

#### D1. 2×2 Matrix
- **用于**：在两个二分维度下分类对象（重要 vs 紧急 / 高低风险 × 高低收益）
- **必备**：四象限有命名、对象 / 点的位置有依据
- **避免**：维度选择牵强、对象 > 12（散乱）

#### D2. 3×3 Matrix / GE-McKinsey Matrix
- **用于**：3 档评分的双维度（业务吸引力 × 业务实力）
- **避免**：维度无法分三档

#### D3. Ansoff Matrix（安索夫矩阵）
- **用于**：增长战略（新 / 旧产品 × 新 / 旧市场）
- **典型四格**：市场渗透 / 市场开发 / 产品开发 / 多元化

#### D4. Pyramid / Hierarchy
- **用于**：层级展示（马斯洛需求 / 信息架构 / 决策权力链）
- **避免**：层级 > 5、各层占比误读（金字塔本身有"基础广上层窄"的隐喻）

#### D5. Funnel（漏斗图）
- **用于**：转化漏斗 / 销售漏斗（每阶段的留存）
- **必备**：每阶段标注绝对值 + 转化率
- **避免**：阶段 > 7

#### D6. Decision Tree
- **用于**：决策路径 / 分类逻辑
- **避免**：分支 > 4 层（受众抓不住）

#### D7. Radar / Spider Chart（雷达图）
- **用于**：单一对象在 4-8 个维度的评分
- **避免**：对象 > 3（雷达重叠看不清）、维度尺度不一致（要标准化）

#### D8. Venn Diagram（韦恩图）
- **用于**：2-3 个集合的交集 / 并集（产品功能重叠 / 受众重叠）
- **避免**：圆 > 3（图形混乱）

#### D9. Iceberg Model（冰山模型）
- **用于**：表层 vs 深层结构（行为 vs 价值观）
- **必备**：水面分割线、上下两层 typography 差异

#### D10. Bridge Model
- **用于**：当前 → 未来的过渡战略（"我们现在在 A 岸，需要这座桥到 B 岸"）

#### D11. Pillars / Temple（神庙 / 支柱模型）
- **用于**："X 个支柱支撑 Y 个目标"的战略框架
- **必备**：屋顶 = 目标，支柱 = 关键能力 / 战略

---

### E. 分布与关系（Distribution & Relationship）

#### E1. Histogram（直方图）
- **用于**：单一连续变量的分布形态
- **避免**：分类变量（用 bar）

#### E2. Box & Whisker Plot（箱线图）
- **用于**：跨组比较中位数 + 四分位 + 离群点
- **避免**：受众不懂箱线图（学术 / 数据团队友好，公众陌生）

#### E3. Scatter Plot（散点图）
- **用于**：两连续变量的相关性 / 趋势
- **必备**：点数 > 10 才有意义；可加趋势线

#### E4. Bubble Chart
- **用于**：散点 + 第三维（点大小）
- **避免**：点数 > 30（重叠混乱）

#### E5. Heatmap（热力图）
- **用于**：矩阵型数据的强弱模式（时间 × 类别）
- **必备**：色阶图例

#### E6. Network Diagram（网络图）
- **用于**：节点 + 连接的关系结构
- **避免**：节点 > 20（变成毛球）

#### E7. Sankey Diagram（桑基图）
- **用于**：流向（用户来源 → 行为 → 转化）
- **必备**：流宽 = 流量大小、流向有明确语义

#### E8. Chord Diagram（弦图）
- **用于**：双向流向（贸易往来 / 国家间迁徙）
- **避免**：节点 > 15

---

### F. 地理（Geography）

#### F1. Choropleth Map（分级填色地图）
- **用于**：行政区单位 + 数值（各省 GDP）
- **必备**：色阶图例 + 区域标签

#### F2. Bubble Map
- **用于**：地理位置 + 数值（各城市的人口）
- **避免**：bubble 太大互相重叠

#### F3. Connection Map（连线地图）
- **用于**：地理间的流向 / 关系（航线 / 贸易）

#### F4. Cartogram
- **用于**：按数值重塑地理面积（按 GDP 重塑国家大小）
- **避免**：受众不熟悉、严肃场合（变形地图易引争议）

---

## Part 3：反模式（绝对避免）

1. **3D Pie / 3D Bar** — 透视扭曲数据，没有任何 information density 优势，看着 amateur
2. **简单 Pie Chart**（除非 ≤ 3 个分类 + 占比差异巨大）— 一律改 Donut
3. **彩虹色 categorical palette** — 7+ 种饱和色并列，视觉混乱；用同色系深浅 + 1 个 accent 色
4. **无标签的图表** — 标题 / 轴标 / 数据来源至少要有
5. **截断的 Y 轴**（用于柱状图）— 视觉欺骗，受众一旦发现信任崩塌
6. **饼图嵌套饼图 / 双 Y 轴 line chart** — 复杂度高于信息密度
7. **过度装饰的 infographic icon** — 学术 / 严肃场合显得不专业（杂志风可以放宽）

---

## Part 4：组合用图（每页 2-3 种图表）

`content` / `data` / `comparison` 页通常用 2-3 种图表组合产生信息层次。组合原则：

- **主图 + 辅图**：主图占视觉重心（页面 50%+），辅图补充细节（小 sparkline / harvey ball）
- **不同维度**：主图讲构成 → 辅图讲趋势 → 第三个讲对比；3 个图表讲同一件事 = 浪费
- **同一视觉语言**：组合的图表必须共用同一配色系统（高亮色仅给"故事的核心数据点"）

### 推荐组合模板

| 模板 | 主图 | 辅图 1 | 辅图 2 |
|:--|:--|:--|:--|
| **市场地图** | Marimekko（份额×规模）| 3 个 KPI Card（增长率）| 1 句洞察 |
| **战略矩阵** | 2×2 Matrix | Harvey Balls（每对象评分）| Donut（重点象限占比）|
| **趋势分解** | Stacked Area | 2-3 个 Slope Graph（关键品类）| Sparklines 行 |
| **流程透视** | Chevron Process | Gantt（时间维度）| Harvey Balls（各阶段进度）|
| **客户旅程** | Sankey | 3 个 KPI Card（转化率）| Funnel（漏斗）|
| **能力评估** | Radar（多维评分）| Bar Chart（关键短板）| Big Number（综合分）|

---

## Part 5：风格 pack 的可视化偏好

风格 pack（`references/styles/*.md`）可在 `visualization_preference` 字段限制使用子集。例如：

- `editorial-magazine` 偏好 typography 主导 + 少量图表（Big Number、Sparkline、简单 Bar）
- `swiss-international` 偏好极简几何（Bar、Line、Dot Plot、Slope Graph），禁用饱和色多分类
- `dark-techno` 偏好高对比 + 几何感强（Network、Heatmap、Sankey），慎用 watercolor 风格的 area
- `soft-dusty-purple` 全谱系可用，但禁简单 Pie，鼓励 Harvey Balls / Waterfall 等"咨询感"图表

Phase 3 生成 prompt 时，先查风格 pack 的 `visualization_preference`，再从本库选具体图表。
