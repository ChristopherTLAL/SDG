// src/utils/vip.ts — SINGLE SOURCE OF TRUTH for VIP (private-contract) visibility.
//
// VIP students (formerly 私单 / "private order") are off-company-books contracts.
// Only 王世杰 and admins may see them; every other viewer — other advisors,
// guests, anonymous — must never see their name, count, notes, or existence.
//
// Before this module the rule was copy-pasted inline across ~10 pages, so a few
// pages forgot it and leaked. Now every page imports `filterVIP` / `canSeeVIP`
// from here, so the rule lives in exactly one place. To change who can see VIP,
// or what marks a student VIP, edit ONLY this file.

import type { Viewer } from '../lib/auth';

// Contract labels that mark a student as VIP. Matches both the new "VIP"
// convention and the legacy "私单" values so the filter stays correct before,
// during, and after the data migration — never remove the 私单 entries unless
// you have confirmed zero rows still carry them.
export const VIP_CONTRACTS = ['VIP', 'VIP（非公司合同）', '私单', '私单（非公司合同）'] as const;

// Human-facing label for a VIP contract (only ever shown to privileged viewers).
export const VIP_LABEL = 'VIP';

/** Only 王世杰 and admins may see VIP students. Everyone else never does. */
export function canSeeVIP(viewer: Viewer | null | undefined): boolean {
  return !!viewer && (viewer.isAdmin || viewer.name === '王世杰');
}

/** Is this student's contracts array a VIP contract? */
export function isVIP(contracts: unknown): boolean {
  return Array.isArray(contracts)
    && contracts.some((c) => (VIP_CONTRACTS as readonly string[]).includes(c as string));
}

/**
 * Drop VIP students from a list unless the viewer is allowed to see them.
 * Every page that fetches students MUST pass the rows through this (with
 * `contracts` selected) before counting, listing, or rendering them.
 */
export function filterVIP<T extends { contracts?: unknown }>(
  students: T[],
  viewer: Viewer | null | undefined,
): T[] {
  if (canSeeVIP(viewer)) return students;
  return students.filter((s) => !isVIP(s.contracts));
}
