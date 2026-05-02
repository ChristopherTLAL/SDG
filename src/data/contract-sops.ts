// Contract-specific SOPs and email templates.
//
// To edit a template, change the strings here and push — they render server-side
// and a refresh of the student detail page picks up the new copy.
//
// Placeholders inside emailSubject / emailBody:
//   {{学生姓名}}   — student's name
//   {{中期顾问}}   — mid_advisor name (falls back to "顾问")
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

  // ── Hero fields (rendered on /internal/kanban/contracts/[name]) ──
  // All optional — placeholder shown if missing. Fill in as you confirm
  // the values; safe to ship with these blank.
  description?: string;       // 1-2 sentence elevator pitch
  pricing?: string;           // e.g. "¥18,800（半年）" — free-form for now
  durationMonths?: number;    // service window length
  targetAudience?: string;    // e.g. "高一上学期及以前 / 想留学但还在探索方向"
};

// ─── Reusable deliverable builders ─────────────────────────

const careerPlan: Deliverable = {
  key: 'career-plan',
  title: '生涯规划方案',
  emailSubject: '【苏州前途·格物计划】{{学生姓名}} 生涯规划方案',
  emailBody: `家长您好：

附件是中期规划团队为 {{学生姓名}} 准备的《生涯规划方案》，基于近期与 {{学生姓名}} 的多次深度沟通完成。

方案包含：
1. 兴趣 / 性格 / 学术倾向梳理
2. 中长期专业方向建议（含 1 主选 + 2 备选）
3. 与目标方向匹配的高中阶段学业规划
4. 学术之外的成长路径（科研 / 实习 / 竞赛 / 文体）建议

这份方案是后续所有月度规划的起点，建议家长与 {{学生姓名}} 一起读一遍，把疑问和不认同的部分整理出来，下次沟通时一起调整。

如有任何问题随时联系。

{{中期顾问}}
苏州前途中期规划团队`,
};

const resumeReport: Deliverable = {
  key: 'resume-report',
  title: '简历梳理报告',
  emailSubject: '【苏州前途·格物计划】{{学生姓名}} 简历梳理报告',
  emailBody: `家长您好：

附件是为 {{学生姓名}} 准备的《简历梳理报告》，对当前阶段的所有学术、科研、活动、竞赛、文体经历做了系统化梳理与评估。

报告内容：
1. 经历分类与时间轴（学术 / 科研 / 活动 / 竞赛 / 文体）
2. 每段经历的"亮点 / 待补充 / 申请价值"评估
3. 距离目标方向的差距分析
4. 后续 6–12 个月的补充建议（哪些经历值得继续投入、哪些可以止损）

这份报告也将作为后续撰写文书 / 推荐信 / 申请简历的基础素材。

{{中期顾问}}
苏州前途中期规划团队`,
};

function monthlyReport(repeats: number): Deliverable {
  return {
    key: 'monthly',
    title: '月度规划报告',
    repeats,
    emailSubject: `【苏州前途·格物计划】{{学生姓名}} 月度规划报告`,
    emailBody: `家长您好：

附件是 {{学生姓名}} 本月的规划报告。

▎本月已完成
- ……
- ……

▎本月反思
- 哪些动作有效 / 无效
- 学生 / 家长反馈

▎下月重点
- ……
- ……

▎需要家长配合
- ……

{{中期顾问}}
苏州前途中期规划团队`,
  };
}

// ─── SOP definitions ───────────────────────────────────────

export const SOPS: ContractSOP[] = [
  {
    id: 'gewu-half',
    displayName: '格物计划（半年期）',
    matchPatterns: ['格物半年', '半年期'],
    deliverables: [careerPlan, monthlyReport(5), resumeReport],
    // 占位文案 — 王世杰确认实际数值后替换
    description: '半年期的中期规划服务，覆盖一份生涯规划方案 + 每月规划报告 + 阶段性简历梳理。适合短线方向不明、需要先做出框架的家庭。',
    pricing: 'TBD',
    durationMonths: 6,
    targetAudience: '初一至高一阶段、需要快速建立留学规划框架的学生',
  },
  {
    id: 'gewu-1y',
    displayName: '格物计划（一年期）',
    matchPatterns: ['格物一年', '格物计划', '格物'],
    deliverables: [careerPlan, monthlyReport(11), resumeReport],
    description: '一年期的中期规划服务，节奏与半年期相同但延续 11 个月，能覆盖一个完整学年的执行 + 调整。',
    pricing: 'TBD',
    durationMonths: 12,
    targetAudience: '需要全学年陪跑的学生 / 家长',
  },
];

// Find the SOP matching an arbitrary contract name (or null if none).
// Same precedence rule as findSOPsForStudent — first match wins.
export function findSOPByContract(contractName: string): ContractSOP | null {
  for (const sop of SOPS) {
    if (sop.matchPatterns.some(p => contractName.includes(p))) return sop;
  }
  return null;
}

// ─── Matcher ────────────────────────────────────────────────

export type MatchedSOP = {
  sop: ContractSOP;
  contractName: string;  // the original contract string from the YAML
};

export function findSOPsForStudent(contracts: string[] | null | undefined): MatchedSOP[] {
  if (!contracts || contracts.length === 0) return [];
  const matched: MatchedSOP[] = [];
  const seenSopIds = new Set<string>();
  for (const c of contracts) {
    for (const sop of SOPS) {
      if (sop.matchPatterns.some(p => c.includes(p))) {
        // Don't dedupe by SOP id — a student could legitimately have multiple
        // contracts of the same type (rare). But keep it simple: dedupe.
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

export function substitute(template: string, vars: { studentName: string; midAdvisor: string | null }): string {
  return template
    .replaceAll('{{学生姓名}}', vars.studentName)
    .replaceAll('{{中期顾问}}', vars.midAdvisor ?? '顾问');
}
