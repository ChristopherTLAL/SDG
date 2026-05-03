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
    description: '布置 MDPA 测评，方便后续选校 / 选专业 / 文书素材挖掘对齐性格特点。',
    scriptBody: `{{学生姓名}}！

我是中期顾问 {{中期顾问}}，给你布置一个小任务～

我们苏州前途自家有一套 MDPA 人格测评，专门用来辅助留学规划。15 分钟左右就能做完：

📍 测评链接：[此处贴链接]

测完后系统会自动出一份报告，你可以保存图片发给我。下次沟通我们一起看，根据测评结果来调整方向规划。

有任何问题随时找我！`,
  },
];
