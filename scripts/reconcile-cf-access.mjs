// Reconcile the Cloudflare Access "Allowed Employees" policy against the
// `advisors` table.
//
// What this does:
//   1. Reads every active advisor's `emails` array from Supabase
//   2. Drops anything `@xdf.cn` (already covered by the email_domain wildcard)
//   3. PUTs the policy include list = email_domain(xdf.cn) + one entry per
//      remaining (non-xdf) personal-account email
//
// Run after editing a vault advisor md when:
//   - You add/remove a personal-account alias on someone's `邮箱` array
//   - An advisor leaves (active: false) and their personal alias should be
//     revoked at the CF gate
//
// Usage:
//   node scripts/reconcile-cf-access.mjs           # dry-run, prints diff
//   node scripts/reconcile-cf-access.mjs --apply   # actually PUT the policy
//
// Requires env vars (already in .env):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   CF_API_TOKEN, CF_ACCOUNT_ID, CF_ACCESS_OTP_POLICY_ID

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const {
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
  CF_API_TOKEN, CF_ACCOUNT_ID, CF_ACCESS_OTP_POLICY_ID,
} = process.env;

for (const [k, v] of Object.entries({
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
  CF_API_TOKEN, CF_ACCOUNT_ID, CF_ACCESS_OTP_POLICY_ID,
})) {
  if (!v) { console.error(`Missing env: ${k}`); process.exit(1); }
}

const APPLY = process.argv.includes('--apply');
const POLICY_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/access/policies/${CF_ACCESS_OTP_POLICY_ID}`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── 1. Pull desired emails from advisors table ──────────────────────────────
const { data: rows, error } = await supabase
  .from('advisors')
  .select('name, emails, active')
  .eq('active', true);

if (error) { console.error('Supabase query failed:', error.message); process.exit(1); }

const desired = new Set();
for (const r of rows ?? []) {
  for (const e of r.emails ?? []) {
    const em = String(e).trim().toLowerCase();
    if (!em.includes('@')) continue;
    if (em.endsWith('@xdf.cn')) continue;   // covered by wildcard
    desired.add(em);
  }
}

// ── 2. Read current CF policy ───────────────────────────────────────────────
const cfHeaders = {
  'Authorization': `Bearer ${CF_API_TOKEN}`,
  'Content-Type': 'application/json',
};

const getRes = await fetch(POLICY_URL, { headers: cfHeaders });
const getJson = await getRes.json();
if (!getJson.success) {
  console.error('CF policy GET failed:', JSON.stringify(getJson.errors));
  process.exit(1);
}

const current = getJson.result;
const currentEmails = new Set(
  (current.include ?? [])
    .map(x => x?.email?.email)
    .filter(Boolean)
    .map(s => s.toLowerCase()),
);

// ── 3. Diff ─────────────────────────────────────────────────────────────────
const toAdd    = [...desired].filter(e => !currentEmails.has(e)).sort();
const toRemove = [...currentEmails].filter(e => !desired.has(e)).sort();

console.log(`Current xdf.cn wildcard: ${current.include?.some(x => x?.email_domain?.domain === 'xdf.cn') ? 'yes' : 'NO (will be added)'}`);
console.log(`Currently allowlisted (non-xdf): ${[...currentEmails].sort().join(', ') || '(none)'}`);
console.log(`Desired (non-xdf):              ${[...desired].sort().join(', ') || '(none)'}`);
console.log();
console.log(`+ to add:    ${toAdd.join(', ') || '(none)'}`);
console.log(`- to remove: ${toRemove.join(', ') || '(none)'}`);

if (toAdd.length === 0 && toRemove.length === 0) {
  console.log('\n✓ Already in sync — nothing to do.');
  process.exit(0);
}

if (!APPLY) {
  console.log('\nDry-run. Re-run with --apply to PUT the policy.');
  process.exit(0);
}

// ── 4. Apply ────────────────────────────────────────────────────────────────
const newInclude = [
  { email_domain: { domain: 'xdf.cn' } },
  ...[...desired].sort().map(em => ({ email: { email: em } })),
];

const putRes = await fetch(POLICY_URL, {
  method: 'PUT',
  headers: cfHeaders,
  body: JSON.stringify({
    name: current.name || 'Allowed Employees',
    decision: 'allow',
    include: newInclude,
    // Preserve any existing require/exclude rules (e.g. MFA) — hardcoding []
    // silently wiped them on every --apply.
    require: current.require ?? [],
    exclude: current.exclude ?? [],
  }),
});
const putJson = await putRes.json();

if (!putJson.success) {
  console.error('\n✗ CF policy PUT failed:', JSON.stringify(putJson.errors, null, 2));
  process.exit(1);
}

console.log(`\n✓ Policy updated. Include list now has ${putJson.result.include.length} entries.`);
