// 全局入学届地板 — 早于这一届的学生不进任何 advisor 计数（chip / 周报 / 看板 / 退费）。
//
// 每年王世杰会告诉 Claude 一次 "升一档"，比如 26 → 27（届时 26F 学生全员退出统计）。
// 改这一处就够，所有 import 这个常量的页面同步生效。
//
// 当前：26F 及之后的学生才算 in-scope（24F / 25F 学生已结案 / 已交付，不再算谁的"book size"）。
export const EARLIEST_TRACKED_COHORT = 26;

// students.enroll_years 满足以下任一即算 in-scope：
//   1. 空 / null / undefined / 长度为 0  → 视作"待定" / "还没填"，保留
//   2. 任一年份解析后 ≥ EARLIEST_TRACKED_COHORT
//   3. 任一年份是 "待定" / "5000 fall" / 空字符串 → 同样保留
//
// 所有年份都解析为早于地板的年才滤掉（典型：24F-only / 25F-only 老学生）。
export function studentHasInScopeCohort(
  years: (string | null | undefined)[] | null | undefined,
): boolean {
  if (!years || years.length === 0) return true;
  return years.some(y => {
    const s = String(y ?? '').trim();
    if (!s || s === '待定' || s.startsWith('5000')) return true;
    const m = s.match(/^(\d{4})/);
    if (!m) return true;  // 解析不出年份 → 不滤
    return parseInt(m[1].slice(2), 10) >= EARLIEST_TRACKED_COHORT;
  });
}
