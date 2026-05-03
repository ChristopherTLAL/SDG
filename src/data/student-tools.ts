// Student-detail "推荐工具" — 顾问可以一键复制、发微信的话术 / 工具邀请。
//
// 跟 contract-sops.ts 不同的地方：
//   - 这些不挂在合同上，每个学生都可以用
//   - 短、口语化、面向 WeChat 直接粘贴
//   - 占位符同样支持 {{学生姓名}} / {{中期顾问}}（复用 substitute()）
//
// 添加新工具：在下面的 STUDENT_TOOLS 数组里追加一项即可。学生详情页左侧
// 边栏底部会自动多一个折叠项。

export type StudentTool = {
  id: string;
  title: string;          // 折叠项的标题（短）
  description?: string;   // 一句话说明，渲染在展开后的话术上方
  scriptBody: string;     // 实际话术文本，支持 {{学生姓名}} / {{中期顾问}}
};

export const STUDENT_TOOLS: StudentTool[] = [
  {
    id: 'mdpa-invite',
    title: 'MDPA 人格测试邀请',
    description: '布置 MDPA 多维人格测评（114 题，MBTI + 大五 + 情绪倾向），方便后续选校 / 选专业 / 文书素材挖掘对齐性格特点。',
    scriptBody: `{{学生姓名}}，给你布置一个小任务～

MDPA 多维人格测评，15 分钟 / 114 题，覆盖 MBTI 类型 + 大五人格 + 情绪倾向三个维度（4000+ 同学已完成）。这是我们后续规划留学方向、选专业、挖文书素材的重要参考。

📍 测评链接：https://sdg.undp.ac.cn/tools/personality

做完之后系统会自动生成一份网页报告，分两种阅读模式：
• 「性格解析」简版 — 适合你和家人快速过一遍
• 「数据分析报告」详版 — 我会用这版来跟你深入聊

测完把报告链接发我，下次沟通一起解读。有问题随时找我！`,
  },
];
