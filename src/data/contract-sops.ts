// Contract-specific SOPs and email templates.
//
// To edit a template, change the strings here and push — they render server-side
// and a refresh of the student detail page picks up the new copy.
//
// Placeholders inside emailSubject / emailBody:
//   {{学生姓名}}   — student's name
//   {{中期顾问}}   — mid_advisor name (falls back to "顾问")
//   {{合同编号}}   — ERP contract number (e.g. JSSZYZ202501028) for this specific
//                    contract; used in 结案 / 交付凭证类邮件以便客户留档
// Add more placeholders by extending the substitute() function below.

export type Deliverable = {
  key: string;
  title: string;
  // For deliverables that repeat with the same template (e.g. 11 monthly
  // reports). When > 1, we render a "× N" badge instead of duplicating rows.
  repeats?: number;
  emailSubject: string;
  emailBody: string;
};

export type ContractSOP = {
  id: string;
  displayName: string;
  // Substring patterns. The first SOP in SOPS that has any pattern matching the
  // contract string wins, so list more-specific patterns first.
  matchPatterns: string[];
  deliverables: Deliverable[];

  // ── Group + variant ──
  // groupName is the umbrella product (跃领计划 / 格物计划) that the kanban
  // donut aggregates by — so 跃领-Standard / Pro / Max all show as one "跃领
  // 计划" slice in the chart, but each variant keeps its own SOP entry with
  // its own deliverables and emails.
  // variant is the sub-tier label (Standard / Pro / Max for 跃领, 一年期 /
  // 半年期 for 格物). Renders as a small badge on the per-contract profile.
  groupName?: string;
  variant?: string;

  // ── Tier-aware routing (for 跃领 系) ──
  // 跃领 vault YAML 合同 字段全是 "跃领"（不带 Max/Pro/标准 区分）；分级在
  // 单独字段 跃领分级（Max / Pro / 标准 / 博士 / 本科）。这个字段让 SOP 按
  // 学生实际分级路由：findSOPsForStudent(contracts, yuelingTier) 时只匹配
  // tierMatch === yuelingTier 的 SOP；findSOPByContract（无 tier context）
  // 跳过有 tierMatch 的 SOP，落到 yueling-default catch-all。
  tierMatch?: string;

  // ── Hero fields (rendered on /internal/kanban/contracts/[name]) ──
  // All optional — placeholder shown if missing. Fill in as you confirm
  // the values; safe to ship with these blank.
  description?: string;       // 1-2 sentence elevator pitch
  pricing?: string;           // e.g. "¥18,800（半年）" — free-form for now
  durationMonths?: number;    // service window length
  targetAudience?: string;    // e.g. "高一上学期及以前 / 想留学但还在探索方向"
};

// ─── Reusable deliverable builders ─────────────────────────

// 生涯规划方案 — 用 vault skill `planning-roadmap` 产出的 7-sheet Excel
// （封面+总时间线+5轨道详情，含周级负载热力图）作为这份方案的载体。
// 注意：合同名是「生涯规划方案」，不要改。
const careerPlan: Deliverable = {
  key: 'career-plan',
  title: '生涯规划方案',
  emailSubject: '【苏州前途·格物计划】{{学生姓名}} 生涯规划方案',
  emailBody: `{{学生姓名}} 与 {{学生姓名}} 家长，

您好！

我是 {{学生姓名}} 的中期规划顾问 {{中期顾问}}。感谢你们对苏州前途的信任与配合。基于前期沟通和职业测评结果，中期规划团队完成了 {{学生姓名}} 的《生涯规划方案》初稿，详见附件 Excel 文件。

▎方案概览（共 7 个工作表）
• 封面 — 学生信息、课纲分析、5 大轨道终极目标，附 52 周课业基础负载热力图（绿→红渐变，让你直观看到哪些周可以安排额外活动）
• 总时间线 — 每年一个甘特图，5-6 个轨道并排，看清整体节奏
• 校内成绩 — 必修/选修课规划 + 学习技巧 + 推荐资源
• 语言标化 — 雅思/托福备考节点 + 专业相关英文素材
• 学术软背景 — 2-3 段递进式科研 + 3 个深度方向解析
• 实践软背景 — 2-3 段递进式实习 + 行业招聘周期
• 价值观软背景 — 2 个 SDGs 相关经历

▎设计核心
- 「7 个硬核经历」框架：科研 + 实习 + 价值观经历总数控制在 7 段，避免「填满每周」
- 段与段之间有成长性递进与主题关联
- 安排时机对照基础负载热力图，避开学校考试 / 论文密集周
- 申请轨道嵌入总时间线（不单独一 sheet），DDL 节点已对齐

▎下一步
- 建议你和 {{学生姓名}} 一起完整读一遍，把疑问、不认同、想增加 / 删掉的部分整理出来
- 下次沟通我们一起对齐调整
- 调整确认后，月度规划报告会围绕这份方案的节点逐月推进

如有任何问题随时联系。

祝好
{{中期顾问}}
苏州前途中期规划团队`,
};

// 简历梳理报告 — 用 vault skill `cv_writer` 产出的 LaTeX/PDF 学术简历
// （AI 补充内容黄色高亮，可双语 EN+CN）作为这份报告的载体。
// 注意：合同名是「简历梳理报告」，不要改。
const resumeReport: Deliverable = {
  key: 'resume-report',
  title: '简历梳理报告',
  emailSubject: '【苏州前途·格物计划】{{学生姓名}} 简历梳理报告',
  emailBody: `{{学生姓名}} 与 {{学生姓名}} 家长，

您好！

附件是为 {{学生姓名}} 准备的《简历梳理报告》PDF（含中英双语两份），按英美院校学术简历惯例排版，作为后续文书 / 推荐信 / 申请材料的基础素材。

▎简历内容
- 教育背景（含高中 / 大学 / 交换 / 暑校）
- 学术研究 / 项目经历
- 实习与课外活动
- 标化成绩与语言能力
- 奖项与发表
- 技能（语言 / 软件 / 实验技术等）

▎风控说明（重要！）
为了保证信息真实，所有不在原始材料中、由我们补充推断的内容（如经历的具体动词、量化成果的合理推算等），都用 **黄色高亮** 标记。请你和 {{学生姓名}} 一起逐条审核：
- 高亮内容是事实 → 保留
- 高亮内容偏差或不准确 → 告诉我们，我们改正后重新生成

▎使用建议
- 中英文两版内容一一对应，建议同步审核
- 后续文书 / 推荐信会以这份简历为骨架，所以这一步的精度很重要
- 如有新的奖项 / 经历，随时告诉我们更新

祝好
{{中期顾问}}
苏州前途中期规划团队`,
};

function monthlyReport(repeats: number): Deliverable {
  return {
    key: 'monthly',
    title: '月度规划报告',
    repeats,
    emailSubject: `【苏州前途·格物计划】{{学生姓名}} 月度规划报告`,
    emailBody: `{{学生姓名}} 与 {{学生姓名}} 家长，

您好！

附件是 {{学生姓名}} 本月的规划执行报告，请查阅。本月报告对照《生涯规划方案》中本月份的轨道节点逐项跟进。

▎本月已完成
- ……
- ……

▎本月反思
- 哪些动作有效 / 无效
- {{学生姓名}} / 家长反馈

▎下月重点
- ……
- ……

▎需要家长配合
- ……

如有疑问随时联系。

祝好
{{中期顾问}}
苏州前途中期规划团队`,
  };
}

// 服务结案 · 一次性补交所有材料。在服务期内某些材料未能逐项发送时使用，
// 用一封邮件汇总所有交付物（附件 1-N），用于报完成留档。
// 半年/一年期 SOP 月报件数不同 → 参数化 monthlyCount。
function gewuServiceCompletion(monthlyCount: number): Deliverable {
  return {
    key: 'service-completion',
    title: '特殊·服务后补交所有材料（结案邮件）',
    emailSubject: '【苏州前途·格物计划】{{学生姓名}} 服务结案 · 全部材料汇总',
    emailBody: `{{学生姓名}} 与 {{学生姓名}} 家长，

您好！

{{学生姓名}} 的格物计划服务期已圆满结束（合同编号 {{合同编号}}）。本邮件一次性汇总本期所有交付材料，便于你们留档，也作为本次服务的正式结案。

▎附件清单
1. 《生涯规划方案》（详见附件）
2. 《简历梳理报告》（详见附件）
3. 《月度规划报告 ×${monthlyCount}》（详见附件）

感谢你们一直以来的信任与配合。如有任何疑问，欢迎随时联系。

祝好
{{中期顾问}}
苏州前途中期规划团队`,
  };
}

// ─── 跃领计划 deliverable templates ────────────────────────
//
// Source: ~/Downloads/2026_01_22_2025英国跃领计划研究生Pro版/*.msg
// (extracted via python3 extract_msg, see /tmp/yueling-emails.json)
//
// Standard / Pro / Max share most deliverables (kickoff, 职业测评, CSAP
// 访谈, 专业解析, 头脑风暴, CSAP 总结, 文书头脑风暴, 海外学术导师). Pro
// adds 职业发展指导课程 + 国内教授科研项目. Max adds 生涯规划指导课程 +
// 海外教授科研项目.

function yuelingKickoff(variantLabel: '标准版' | 'Pro版' | 'Max版'): Deliverable {
  return {
    key: 'yl-kickoff',
    title: '服务开启 · 团队建群',
    emailSubject: `【新东方前途英国跃领计划研究生-${variantLabel}】高端留学申请服务开启`,
    emailBody: `{{学生姓名}}同学：

你好！

感谢你对前途的信任！欢迎加入英国跃领计划，我是你的规划导师{{中期顾问}}，接下来我们将携手为你的留学做出更科学的规划，更充分的准备，一起成就你的精彩人生！

我们的工作离不开你的支持，通过我们不久前的沟通，跃领团队已经对目前的申请情况有了基本的了解。

为了提供更加科学与个性化的规划方案，请补充以下材料：
1. 已完成学年成绩单电子版，无需正式开具的纸质成绩单，电子成绩单或网页截图即可
2. 未来（大一至大四）要修的课程表，包括必修和选修；如选修课比较多，单独做一个文件即可；如院校有培养方案，也可以下载发给我
3. （如有）个人简历及其他与学术、留学申请相关的资料（如论文、证书、竞赛成果、课上大作业等）

为便于你了解接下来我们的服务安排，请查阅跃领计划${variantLabel}服务流程图（附件）。

跃领计划服务团队成员职责如下：
• 顾问老师：咨询、签约、全程跟盯、确定选校与选专业方案、背景提升项目推荐与签约、规划进度跟盯与提醒、日常资料整理与发送
• 跃领规划师：专业解析、CSAP 四维访谈、头脑风暴、规划方案制定、兴趣阅读推荐、季度成长高光时刻、文书素材收集整理
• 跃领文书导师：文书及申请材料指导、院校申请及后续离境前服务
• 跃领海外学术导师：来自英国名校的学长学姐，通过跃领海外导师课程，分享个人学习与申请经历，介绍专业或申请相关

有问题请随时联系我。

祝好
{{中期顾问}}
跃领规划师`,
  };
}

const yuelingCareerAssessment: Deliverable = {
  key: 'yl-career-assessment',
  title: '职业测评 · 完成后需反馈报告',
  emailSubject: '【新东方前途英国跃领计划研究生】职业测评【完成后需反馈报告】',
  emailBody: `{{学生姓名}}同学：

你好！

我是你的规划师{{中期顾问}}，很高兴与你携手共同进行未来的留学申请规划准备。

目前，我们的服务已经进入开启阶段，在进一步深入规划英国硕士申请前，需要你完成一项重要任务 —— 职业测评。

这项测评是后续英国硕士申请规划服务指导的关键基础，它能精准洞察你的职业兴趣、优势和发展方向，帮助我们为你量身定制最契合的留学规划。比如，通过测评结果，我们能更好地筛选出与你职业目标高度匹配的英国院校和专业，让你的留学投资获得最大回报。

1. 【请扫描附件二维码】在 2 日内完成职业测评。若在测评过程中有任何疑问，如不清楚某些问题的含义、提交结果遇到困难等，随时与我联系。
2. 【职业测评产出报告的补充说明】完成职业测评后，系统仅支持查看一次。建议测试后直接保存为图片（手机端）/下载 pdf（电脑端），发送规划师。
   - 优先使用电脑端测试，测试后可直接下载报告发送给规划师（如无法下载，截图发送即可）。
   - 如通过手机端进行测试，测试后可直接保存长图发送给规划师。

期待你顺利完成职业测评，我们携手开启英国硕士申请的精彩篇章！

{{中期顾问}}
跃领规划师`,
};

const yuelingCsapInterview: Deliverable = {
  key: 'yl-csap-interview',
  title: 'CSAP 四维访谈反馈',
  emailSubject: '【新东方前途英国跃领计划研究生】CSAP四维访谈反馈',
  emailBody: `{{学生姓名}}同学：

你好！

我是你的规划师{{中期顾问}}，很高兴与你一起完成了我们的 CSAP 四维访谈！也很感谢你在访谈中提供了很多信息，相信未来我们的合作能够帮助你顺利申请到理想的学校。

通过 C（career）/ S（specialization）/ A（academics）/ P（professional）四维访谈，我已对申请人基本情况有了系统了解，并就以下内容进行了详细沟通和梳理：

1. 申请人对未来的职业兴趣探索与规划方向
2. 后续申请的专业大方向与目标院校梳理
3. 学术能力（GPA / 标化 / 核心课程）与提升节奏
4. 个人特质 / 综合素质亮点

附件为本次访谈的完整反馈报告（含目标院校列表、专业匹配度分析、后续行动项），请你与家人一起阅读，把疑问和需要调整的地方整理出来，下次沟通时一起对齐。

{{中期顾问}}
跃领规划师`,
};

const yuelingMajorDeepDive: Deliverable = {
  key: 'yl-major-deepdive',
  title: '专业解析指导',
  emailSubject: '【新东方前途英国跃领计划研究生】专业解析指导',
  emailBody: `{{学生姓名}}同学：

你好！

我是你的规划师{{中期顾问}}，结合 CSAP 四维访谈对你的兴趣方向和能力定位的梳理，本次专业解析指导将帮助你完成「目标专业」的精准锚定与拓展。

专业解析将围绕以下方向展开：
1. 目标专业课程结构、核心模块、进阶方向
2. 同名专业在不同院校的差异（培养目标 / 师资 / 就业去向）
3. 跨学科与延展专业方向建议（避免单点押注）
4. 对应职业路径与典型雇主梳理

请查看附件【专业解析指导反馈表】，按要求完成准备工作后回复我，我们一起推进。

{{中期顾问}}
跃领规划师`,
};

const yuelingBrainstormFeedback: Deliverable = {
  key: 'yl-brainstorm-feedback',
  title: '规划头脑风暴反馈 + 年度规划表',
  emailSubject: '【新东方前途英国跃领计划研究生】规划头脑风暴反馈与年度规划表',
  emailBody: `{{学生姓名}}同学：

你好！

我是你的规划师{{中期顾问}}，今天与你完成了第一次申请规划头脑风暴，关于头脑风暴的内容，我这边整理一个简单的小结：

▎院校及专业调研
- 目标院校梯度（冲刺 / 主申 / 保底）
- 核心专业要求：成绩 / 专业课程 / 申请竞争力
- 学术 / 职业相关人脉与背景资源

▎申请人现有能力分析
- 学术背景提升（核心课程攻坚、跨学科补充）
- 学术软实力（科研 / 实习 / 竞赛 / 论文）
- 推荐人选择建议

附件为头脑风暴会议的详细笔记 + 跃领年度规划表（执行方案）。如有任何问题、或者还有未尽方面想要讨论，可以与我即时沟通。

{{中期顾问}}
跃领规划师`,
};

const yuelingCsapSummary: Deliverable = {
  key: 'yl-csap-summary',
  title: 'CSAP 总结报告 + 申请季开启',
  emailSubject: '【新东方前途英国跃领计划研究生】CSAP总结报告&申请季开启',
  emailBody: `{{学生姓名}}同学：

你好！

我是你的规划师{{中期顾问}}，恭喜你完成了完整的跃领计划规划阶段。在阶段收尾之时，我们将完成 CSAP 总结报告，进入申请季的正式准备阶段。

附件为完整的 CSAP 总结报告，涵盖：
1. 你过去一年（或服务期内）的学术能力提升轨迹
2. 个人特质与软实力的成长复盘
3. 目标院校 / 专业的最终锁定与备选方案
4. 申请季时间表与关键里程碑

接下来我们正式进入申请季阶段：文书素材头脑风暴、个人陈述与推荐信打磨、网申递交、面试辅导、签证服务等都将陆续启动。请与家人一起仔细查阅这份总结报告，作为接下来申请季的指南。

{{中期顾问}}
跃领规划师`,
};

const yuelingPSBrainstorm: Deliverable = {
  key: 'yl-ps-brainstorm',
  title: '文书头脑风暴反馈',
  emailSubject: '【新东方前途英国跃领计划研究生】文书头脑风暴反馈',
  emailBody: `{{学生姓名}}同学：

你好！

我是你的规划师{{中期顾问}}，感谢今天抽时间参加文书头脑风暴。下面是本次头脑风暴的一些反馈：

1. Why program 及 Why school 的部分：请参考文书阅读素材 sample 找一两个项目进行个性化挖掘，建议从每个学校相关专业官方介绍着手（课程设置、校友网络、求职后渠道等），方便之后在文书 why school / program 部分体现个性化思考

2. 职业规划部分：明确头脑风暴的边界与目标，针对本次申请的职业目标做出个性化的解析与计划

3. 学术研究部分：把过往学术研究 / 实习经历整合进申请故事线

4. 实习实践部分：补充实习中的关键产出 / 技能习得 / 跨团队协作

5. 推荐人选择：根据已经梳理的推荐人列表，确认每位推荐人能从哪个维度强化你的画像，避免过度集中

附件为本次头脑风暴的完整反馈材料。请与家人一起阅读、把不清楚的地方整理出来，下次沟通时一起对齐。

{{中期顾问}}
跃领规划师`,
};

const yuelingOverseasMentorBooking: Deliverable = {
  key: 'yl-overseas-mentor',
  title: '海外学术导师课程预约',
  emailSubject: '【新东方前途英国跃领计划研究生】海外学术导师课程预约',
  emailBody: `{{学生姓名}}同学：

你好！

我是你的规划导师{{中期顾问}}，我们的申请规划进入到重要阶段，接下来我将会为你匹配合适的海外学术导师并进行相关课程的安排。

请查看下方的【英国跃领计划海外学术导师课程表】从课程中任选一个主题，并按照下方流程进行后续课程安排。

▎课程主题
1. 申请课程：文书素材挖掘（同专业海外导师）
2. 申请课程：留学申请面试常见问题解析与答题技巧（同专业海外导师）
3. 规划课程：专业方向探索（同专业海外导师）

▎海外学术课程安排（Classin）
1. 反馈你计划参加的课程主题
2. 下载 Classin 软件并完成注册（账号为手机号、昵称为真实姓名），将注册信息反馈给跃领团队
3. 在你方便的时间段内打钩，请尽量多（至少 5 个时间段）地选择可上课的时间（北京时间）

▎课程建议
- 旷课不补，请提前在 Classin App 上设置课程提醒
- 如无法按预期上课，请至少提前 24 小时与规划师沟通并在 App 内留言调整
- 课前可提出与课程大纲相关的问题，由跃领团队转发给导师
- 借助这次机会，认真准备问题、做好课后总结

{{中期顾问}}
跃领规划师`,
};

// Pro-only: 职业发展指导课程
const yuelingProCareerCourse: Deliverable = {
  key: 'yl-pro-career-course',
  title: '职业发展指导课程预约（Pro 专属）',
  emailSubject: '【新东方前途英国跃领计划研究生-Pro版】职业发展指导课程预约',
  emailBody: `{{学生姓名}}同学：

你好！

我是你的规划导师{{中期顾问}}，结合前期职业测评反馈和 CSAP 深度访谈沟通，我对你的背景情况已经有了进一步了解。为了帮助你在留学申请准备过程中做好长期的职业发展规划，接下来我将为你匹配合适的职业导师并进行相关职业课程的安排。

请查看下方的【职业发展课程表】，从课程中任选两个主题（建议：1. 行业定位 + 2. 岗位梳理）。

▎课程主题
1. 行业定位：导师将结合学员兴趣、专业背景和职业目标，分析当前行业发展趋势和就业机会，明确适合的行业方向
2. 岗位梳理：结合学员的职业目标和个人优势，梳理优选岗位与次选岗位，明确能力提升方向
3. 简历诊断：诊断学员简历不足点，并提供精修指导，产出可投递版本
4. 实习/科研建议：根据职业目标和能力水平，提供方向建议，避免盲目投递

▎职业导师课程安排（新东方云教室）
- 反馈你计划参加的两个课程主题
- 在你方便的时间段内打钩（请至少选 5 个时段）
- 课程安排好后，请提前 10 分钟登录【新东方云教室】测试

请使用报名时记录的手机号登录-选择自动登录。

{{中期顾问}}
跃领规划师`,
};

// Max-only: 生涯规划指导课程（录播）
const yuelingMaxLifeCareerCourse: Deliverable = {
  key: 'yl-max-life-career',
  title: '生涯规划指导课程（Max 专属）',
  emailSubject: '【新东方前途英国跃领计划研究生-Max版】生涯规划指导课程安排',
  emailBody: `{{学生姓名}}同学：

你好！

我是你的规划导师{{中期顾问}}，结合前期职业测评反馈和 CSAP 四维访谈沟通，我对你的背景情况和未来发展计划已经有了进一步了解。为了帮助你做好长期的生涯发展规划，我们安排了以下四个主题的录播课程：

第一讲：学习风格和从经验中学习
第二讲：思维发展和构建发展主义
第三讲：设计思维和生涯设计
第四讲：主观能动性、成长思维和终身发展

请查看附件【课程海报】，扫码完成课程。完成课程后，请通过附件进行相关课程的反馈总结，更好地通过本阶段的课程提升自己的软性实力，并在长期生涯规划中有更好的成长。

{{中期顾问}}
跃领规划师`,
};

// Pro-only: 国内教授科研项目（vault YAML 合同明细 中对应 "境内科研" / "【就业力】*国内导师科研" 系列）
const yuelingProDomesticResearch: Deliverable = {
  key: 'yl-pro-domestic-research',
  title: '国内教授科研项目预约（Pro 专属，需反馈）',
  emailSubject: '【新东方前途英国跃领计划研究生-Pro版】国内教授科研项目预约（需反馈）',
  emailBody: `{{学生姓名}}同学：

你好！

我是你的规划导师{{中期顾问}}，接下来为了更好的帮助你进行后续的申请规划提升，我们将会为你安排合适的国内教授科研项目。国内科研项目导师（来自 C9 / 中科院）将在线指导，通过项目制及研究性学习的方式，增进学生的研究能力、批判性思维、交流与合作、科研能力及陈述总结技能。

结合前期的沟通反馈，我为你筛选了相关科研项目（详见附件项目海报）。请尽快反馈最终计划参加的项目，以便后续顺利开启。

▎本项目特殊说明
1. 若第一次投递后录用失败，本项目论文导师会协助申请人选择合适的 EI/CPCI/Scopus/ProQuest/Crossref/EBSCO 或同等级别国际会议进行重投，最多不超过 3 次
2. 申请人需获得论文导师书面认可的投递确认书后方可投递，否则不再协助二次投递
3. 如按要求投递但失败，项目方会在首次失败 1 周内免费指导学生根据编辑意见完善论文，申请人需在修改完成后 1 周内进行第二次投递
4. 如因个人原因，在第一次论文指导后 8 周内不能完成（含全文写作、修改与投递），则项目服务终止
5. 在导师指导下按时、按质、按量完成全部服务内容
6. 严禁任何违背学术道德的行为（代写、数据造假、抄袭等）

{{中期顾问}}
跃领规划师`,
};

// Max-only: 海外教授科研项目（vault YAML 合同明细 中对应 跃领-科研addon = 海外名校导师远程科研）
const yuelingMaxOverseasResearch: Deliverable = {
  key: 'yl-max-overseas-research',
  title: '海外教授科研项目预约（Max 专属，需反馈）',
  emailSubject: '【新东方前途英国跃领计划研究生-Max版】海外教授科研项目预约（需反馈）',
  emailBody: `{{学生姓名}}同学：

你好！

我是你的规划导师{{中期顾问}}，接下来为了更好的帮助你进行后续的申请规划提升，我们将为你安排合适的海外教授科研项目。海外教授导师（来自 G5/QS TOP30）为学生提供灵活多元的项目参与模式，以满足不同领域学生的专业化学习需求。学生在 12 个月的时间内，通过在线项目制学习环境，围绕选题完成科学系统的学术项目，打磨实战经验、扩充科研经历，从而增进个人能力。

结合前期的沟通反馈，我为你筛选了相关科研项目（详见附件项目介绍）。请尽快反馈最终计划参加的项目。

▎本项目特殊说明
1. 申请人选择项目课题后，可任选小组共同一作或唯一作者投递与发表指导，需要在正式开课前确认，确认后无法更改
2. 学术指导老师会指导申请人选择合适的国际英文会议进行文章投递，最多不超过 3 次
3. 申请人可以选择参与或不参与配套论文服务；若参与，前途公司不因此额外收取费用；若不参与，亦不退费
4. 在导师指导下，按时、按质、按量完成导师布置的各项任务，完成科研项目的全部服务内容
5. 严禁任何违背学术道德的行为（代写、数据造假、抄袭等），一旦发现将立即终止项目服务

{{中期顾问}}
跃领规划师`,
};

// ─── SOP definitions ───────────────────────────────────────
//
// matchPatterns are substring-tested against vault YAML 合同 list items.
// Vault stores simplified category labels post-2026-05-06 financial sync (e.g.
// '跃领', '跃领-博士版', '亚洲英语系高端', '就业力addon'). Specific variants
// must come BEFORE their generic parent — '跃领-博士版' is substring of
// itself but '跃领' alone is also substring of '跃领-博士版', so yueling-phd
// must precede yueling.

export const SOPS: ContractSOP[] = [
  // ── 跃领系（specific variants first, generic last） ──
  {
    id: 'yueling-research-addon',
    displayName: '跃领海外名校导师远程科研',
    groupName: '跃领计划',
    variant: '科研addon',
    matchPatterns: ['跃领-科研addon'],
    deliverables: [],
    description: '跃领搭售的科研 add-on：G5/QS TOP30 海外教授指导的远程科研项目，独立 / 共同一作产出论文。',
    pricing: 'TBD',
    targetAudience: '已签跃领、需补强科研背景的研究生申请人',
  },
  {
    id: 'yueling-phd',
    displayName: '英国跃领计划博士版',
    groupName: '跃领计划',
    variant: '博士版',
    matchPatterns: ['跃领-博士版'],
    deliverables: [],
    description: '英国跃领计划博士版：聚焦 PhD 申请的全流程指导。Deliverable 模板待补充。',
    pricing: 'TBD',
    targetAudience: '英国博士申请人',
  },
  {
    id: 'yueling-bachelor',
    displayName: '英国跃领计划本科版',
    groupName: '跃领计划',
    variant: '本科版',
    matchPatterns: ['跃领-本科版'],
    deliverables: [],
    description: '英国跃领计划本科版：本科直读 / 转学的全流程指导。Deliverable 模板待补充。',
    pricing: 'TBD',
    targetAudience: '英国本科申请人',
  },
  // 跃领硕士 — 按学生 跃领分级 字段路由 Max/Pro/标准 不同 deliverable 套餐：
  //   Max: 标准 8 件 + 生涯规划录播课 + 海外教授科研项目（境外）
  //   Pro: 标准 8 件 + 职业发展课程（任选 2）+ 国内教授科研项目（境内）
  //   标准: 标准 8 件
  // tierMatch 让 findSOPsForStudent 按学生 跃领分级 选对 SOP；findSOPByContract
  // 没 tier 上下文，跳过 tierMatch SOPs，落到 yueling-default catch-all。
  {
    id: 'yueling-max',
    displayName: '英国跃领计划研究生 · Max版',
    groupName: '跃领计划',
    variant: 'Max版',
    matchPatterns: ['跃领'],
    tierMatch: 'Max',
    deliverables: [
      yuelingKickoff('Max版'),
      yuelingCareerAssessment,
      yuelingCsapInterview,
      yuelingMaxLifeCareerCourse,
      yuelingMajorDeepDive,
      yuelingBrainstormFeedback,
      yuelingMaxOverseasResearch,
      yuelingCsapSummary,
      yuelingPSBrainstorm,
      yuelingOverseasMentorBooking,
    ],
    description: '英国跃领计划最高阶：标准版 + 生涯规划指导录播课 + G5/QS TOP30 海外教授指导的远程科研项目。',
    pricing: 'TBD',
    targetAudience: '冲刺英国 G5、需要海外科研背景的研究生申请人',
  },
  {
    id: 'yueling-pro',
    displayName: '英国跃领计划研究生 · Pro版',
    groupName: '跃领计划',
    variant: 'Pro版',
    matchPatterns: ['跃领'],
    tierMatch: 'Pro',
    deliverables: [
      yuelingKickoff('Pro版'),
      yuelingCareerAssessment,
      yuelingCsapInterview,
      yuelingProCareerCourse,
      yuelingMajorDeepDive,
      yuelingBrainstormFeedback,
      yuelingProDomesticResearch,
      yuelingCsapSummary,
      yuelingPSBrainstorm,
      yuelingOverseasMentorBooking,
    ],
    description: '英国跃领计划进阶：标准版 + 职业发展课程（4 主题任选 2）+ C9 / 中科院导师指导的国内科研项目。',
    pricing: 'TBD',
    targetAudience: '目标英国 TOP10、希望强化职业方向 + 国内科研背景的研究生申请人',
  },
  {
    id: 'yueling-standard',
    displayName: '英国跃领计划研究生 · 标准版',
    groupName: '跃领计划',
    variant: '标准版',
    matchPatterns: ['跃领'],
    tierMatch: '标准',
    deliverables: [
      yuelingKickoff('标准版'),
      yuelingCareerAssessment,
      yuelingCsapInterview,
      yuelingMajorDeepDive,
      yuelingBrainstormFeedback,
      yuelingCsapSummary,
      yuelingPSBrainstorm,
      yuelingOverseasMentorBooking,
    ],
    description: '英国跃领计划基础版：LEAD 四大维度赋能（学术 / 职业 / 协同 / 文书）+ 海外学术导师课程，覆盖从规划到递交全流程。',
    pricing: 'TBD',
    targetAudience: '目标英国 TOP30 名校、希望系统化规划的研究生申请人',
  },
  {
    id: 'yueling-default',
    displayName: '英国跃领计划研究生',
    groupName: '跃领计划',
    matchPatterns: ['跃领'],
    // catch-all：当学生 跃领分级 为空 / 跳过 / 未匹配（罕见）时使用，
    // 也用于 kanban donut 聚合（findSOPByContract 跳过 tierMatch SOPs）。
    deliverables: [
      yuelingKickoff('标准版'),
      yuelingCareerAssessment,
      yuelingCsapInterview,
      yuelingMajorDeepDive,
      yuelingBrainstormFeedback,
      yuelingCsapSummary,
      yuelingPSBrainstorm,
      yuelingOverseasMentorBooking,
    ],
    description: '英国跃领计划研究生（学生分级未指定）— 默认按标准版交付清单匹配。',
    pricing: 'TBD',
    targetAudience: '英国硕士留学申请人',
  },

  // ── 格物（半年 / 一年期 — 财务名里明确，sync 脚本拆开后大类分别为 格物-半年 / 格物-一年） ──
  {
    id: 'gewu-half',
    displayName: '格物计划（半年期）',
    groupName: '格物计划',
    variant: '半年期',
    matchPatterns: ['格物-半年'],
    deliverables: [careerPlan, monthlyReport(5), resumeReport, gewuServiceCompletion(5)],
    description: '中期规划服务半年期：一份生涯规划方案 + 5 期月度规划报告 + 阶段性简历梳理。适合短线方向不明、需要先做出框架的家庭。',
    pricing: 'TBD',
    durationMonths: 6,
    targetAudience: '初一至高一阶段、需要快速建立留学规划框架的学生',
  },
  {
    id: 'gewu-1y',
    displayName: '格物计划（一年期）',
    groupName: '格物计划',
    variant: '一年期',
    // '格物' 兜底：vault-only 学生历史 [格物计划] 写法保持工作（落到一年期变体）
    matchPatterns: ['格物-一年', '格物'],
    deliverables: [careerPlan, monthlyReport(11), resumeReport, gewuServiceCompletion(11)],
    description: '中期规划服务一年期：节奏与半年期相同但延续 11 个月，能覆盖一个完整学年的执行 + 调整。',
    pricing: 'TBD',
    durationMonths: 12,
    targetAudience: '需要全学年陪跑的学生 / 家长',
  },

  // ── 主品类（按签约学生数降序） ──
  {
    id: 'jingying',
    displayName: '美研菁英计划',
    groupName: '菁英计划',
    matchPatterns: ['菁英'],
    deliverables: [],
    description: '美国研究生菁英服务（含菁英+ 进阶版 / 精英预备课程历史命名）。Deliverable 模板待补充。',
    pricing: 'TBD',
    targetAudience: '美国硕士留学申请人',
  },
  {
    id: 'ouya-elite',
    displayName: '亚洲英语系高端申请',
    groupName: '亚洲英语系高端',
    matchPatterns: ['亚洲英语系高端'],
    deliverables: [],
    description: '港 / 新 / 马 等亚洲英语系院校高端申请服务（含 23 财年"亚洲英文授课"系列 / 26 财年 A 计划）。Deliverable 模板待补充。',
    pricing: 'TBD',
    targetAudience: '港新马等亚洲英语系院校申请人',
  },
  {
    id: 'xingangao-coalition',
    displayName: '新港澳联合申请',
    groupName: '新港澳联申',
    matchPatterns: ['新港澳联申'],
    deliverables: [],
    description: '新加坡 + 香港 + 澳门联合申请服务（授课式研究生 / 本科）。Deliverable 模板待补充。',
    pricing: 'TBD',
    targetAudience: '同时申请新港澳的学生',
  },
  {
    id: 'qihang',
    displayName: '美国研究生启航',
    groupName: '启航',
    matchPatterns: ['启航'],
    deliverables: [],
    description: '美国研究生启航留学申请合同（硕士 / 长线版）。Deliverable 模板待补充。',
    pricing: 'TBD',
    targetAudience: '美国研究生申请人（启航产品线）',
  },
  {
    id: 'us-ms-quick',
    displayName: '美国研究生快捷当季',
    groupName: '美国研究生快捷',
    matchPatterns: ['美国研究生快捷'],
    deliverables: [],
    description: '美国研究生当季快捷申请（定校 10 所、申请 5 所等组合）。Deliverable 模板待补充。',
    pricing: 'TBD',
    targetAudience: '美国研究生申请人（快捷急案）',
  },
  {
    id: 'zunxiang',
    displayName: '美研尊享',
    groupName: '尊享',
    matchPatterns: ['尊享'],
    deliverables: [],
    description: '美国研究生尊享服务委托合同（高客单价、高定制）。Deliverable 模板待补充。',
    pricing: 'TBD',
    targetAudience: '美研高端定制客户',
  },

  // ── 区域单申请 ──
  {
    id: 'au-app',
    displayName: '澳洲申请',
    groupName: '澳洲申请',
    matchPatterns: ['澳洲申请'],
    deliverables: [],
    description: '澳大利亚院校申请服务（授课型硕士 / 本科 / 澳新联合等）。Deliverable 模板待补充。',
    pricing: 'TBD',
    targetAudience: '澳大利亚 / 澳新留学申请人',
  },
  {
    id: 'ca-app',
    displayName: '加拿大申请',
    groupName: '加拿大申请',
    matchPatterns: ['加拿大申请'],
    deliverables: [],
    description: '加拿大院校申请服务（优跃 / 优享本科基础 / 同步指导）。Deliverable 模板待补充。',
    pricing: 'TBD',
    targetAudience: '加拿大留学申请人',
  },
  {
    id: 'hk-app',
    displayName: '港申请',
    groupName: '港申请',
    matchPatterns: ['港申请'],
    deliverables: [],
    description: '香港单独申请服务（本科联申 / 授课式研究生 / DSE 等）。Deliverable 模板待补充。',
    pricing: 'TBD',
    targetAudience: '香港留学申请人',
  },
  {
    id: 'uk-bachelor',
    displayName: '英国本科',
    groupName: '英国本科',
    matchPatterns: ['英国本科'],
    deliverables: [],
    description: '英国本科直读全程版 / 学术指导 Club（本科）等。Deliverable 模板待补充。',
    pricing: 'TBD',
    targetAudience: '英国本科申请人',
  },
  {
    id: 'uk-msphd',
    displayName: '英国硕博',
    groupName: '英国硕博',
    matchPatterns: ['英国硕博'],
    deliverables: [],
    description: '英国研究生 / 博士留学全程申请指导（含 LSE / IC 等高端院校）。Deliverable 模板待补充。',
    pricing: 'TBD',
    targetAudience: '英国硕博留学申请人',
  },
  {
    id: 'us-pre-college',
    displayName: '美国本科预备',
    groupName: '美国本科预备',
    matchPatterns: ['美国本科预备'],
    deliverables: [],
    description: '美国线上中学高阶课程等本科预备类项目。Deliverable 模板待补充。',
    pricing: 'TBD',
    targetAudience: '美本前置准备阶段学生',
  },
  {
    id: 'asia-phd',
    displayName: '亚洲博士',
    groupName: '亚洲博士',
    matchPatterns: ['亚洲博士'],
    deliverables: [],
    description: '亚洲英文授课博士 + 硕士联合申请。Deliverable 模板待补充。',
    pricing: 'TBD',
    targetAudience: '港新等亚洲博士申请人',
  },
  {
    id: 'eu-phd',
    displayName: '欧洲博士',
    groupName: '欧洲博士',
    matchPatterns: ['欧洲博士'],
    deliverables: [],
    description: '欧洲英语系博士联合申请服务。Deliverable 模板待补充。',
    pricing: 'TBD',
    targetAudience: '欧洲博士申请人',
  },
  {
    id: 'yunzhongxue',
    displayName: '英伦云中学',
    groupName: '云中学',
    matchPatterns: ['云中学'],
    deliverables: [],
    description: '英伦云中学常规版 / 一年制（一门班课）— 苏州班当地签约。Deliverable 模板待补充。',
    pricing: 'TBD',
    targetAudience: '初高中阶段需要英伦体系课程的学生',
  },

  // ── Add-ons / 单项产品 ──
  // 财务 ERP 同步出来的 add-on 合同名直接作为 vault 大类（细粒度，~30 种），
  // 不再聚合成 "就业力addon" / "学术指导addon" 这种粗 group。
  // 学生详情页 SOP 区只显示主合同 SOP；add-on 在 合同明细 字段里能看完整名 / 金额 / 优惠。
  // 后续做 "产品 donut" 时直接读 vault YAML 合同 list 项，不依赖 SOP groupName。
  // 当某个 add-on 需要专门 deliverable 流程时，再在这里加对应 SOP（matchPatterns 用清理后的合同名）。

  // ── 私单（公司外部合同，不在 ERP 财务表中） ──
  {
    id: 'sidan',
    displayName: '私单',
    groupName: '私单',
    matchPatterns: ['私单'],
    deliverables: [],
    description: '私单（非公司合同）— 王世杰个人接触的体系外服务。具体 variant 待王世杰另行设计。',
    pricing: 'TBD',
    targetAudience: '非公司合同体系学生',
  },
];

// Convenience: resolve the umbrella group label for a contract name.
// Returns SOP.groupName when matched, the contract name otherwise.
// 注意：聚合用，不传 tier — 跃领系任意 tier 都聚合到 '跃领计划' 一个 group。
export function resolveContractGroup(contractName: string): string {
  const sop = findSOPByContract(contractName);
  return sop?.groupName ?? contractName;
}

// All distinct variants under a given group name (in SOPS declaration order).
export function variantsForGroup(groupName: string): ContractSOP[] {
  return SOPS.filter(s => s.groupName === groupName);
}

// Find the SOP matching an arbitrary contract name (or null if none).
// 当 yuelingTier 传入时，匹配 tierMatch === yuelingTier 的 SOP；否则跳过所有
// 有 tierMatch 的 SOP（落到 default catch-all）。这样 kanban 聚合 / 通用页
// 调用不传 tier 时仍能拿到稳定结果，学生详情页传 tier 时能拿到精准 SOP。
export function findSOPByContract(
  contractName: string,
  yuelingTier?: string | null,
): ContractSOP | null {
  for (const sop of SOPS) {
    if (sop.tierMatch && sop.tierMatch !== yuelingTier) continue;
    if (sop.matchPatterns.some(p => contractName.includes(p))) return sop;
  }
  return null;
}

// ─── Matcher ────────────────────────────────────────────────

export type MatchedSOP = {
  sop: ContractSOP;
  contractName: string;  // the original contract string from the YAML
};

export function findSOPsForStudent(
  contracts: string[] | null | undefined,
  yuelingTier?: string | null,
): MatchedSOP[] {
  if (!contracts || contracts.length === 0) return [];
  const matched: MatchedSOP[] = [];
  const seenSopIds = new Set<string>();
  for (const c of contracts) {
    for (const sop of SOPS) {
      // tierMatch 路由：只匹配 tierMatch === yuelingTier 的 SOP；
      // 没 tierMatch 的 SOP 是 fallback / 跃领系外的常规 SOP，照常匹配。
      if (sop.tierMatch && sop.tierMatch !== yuelingTier) continue;
      if (sop.matchPatterns.some(p => c.includes(p))) {
        if (!seenSopIds.has(sop.id)) {
          matched.push({ sop, contractName: c });
          seenSopIds.add(sop.id);
        }
        break;
      }
    }
  }
  return matched;
}

// ─── Substitution ───────────────────────────────────────────

export function substitute(
  template: string,
  vars: { studentName: string; midAdvisor: string | null; contractNumber?: string | null },
): string {
  return template
    .replaceAll('{{学生姓名}}', vars.studentName)
    .replaceAll('{{中期顾问}}', vars.midAdvisor ?? '顾问')
    .replaceAll('{{合同编号}}', vars.contractNumber || '—');
}
