import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'
import 'dotenv/config'

const resultId = process.argv[2]
if (!resultId) { console.error('Usage: node patch_mdpa_reports.mjs <resultId>'); process.exit(1) }

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'waxbya4l',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const docId = await client.fetch(
  `*[_type == "mdpaResult" && resultId == $resultId][0]._id`,
  { resultId }
)
if (!docId) { console.error('No doc found for', resultId); process.exit(1) }
console.log('Patching doc', docId, 'for resultId', resultId)

const dir = path.resolve(process.cwd(), 'scripts/mdpa_processed', resultId)
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8')

const fields = {
  reportO: read('report_O.md'),
  reportC: read('report_C.md'),
  reportE: read('report_E.md'),
  reportA: read('report_A.md'),
  reportN: read('report_N.md'),
  reportInteractions: read('report_interactions.md'),
  reportPersonal: read('report_personal.md'),
}

for (const [k, v] of Object.entries(fields)) {
  console.log(`  ${k}: ${v.length} chars`)
}

// Patch the published doc directly
await client.patch(docId).set(fields).commit()
console.log('Patch committed.')

// If a draft exists, patch that too so publish doesn't overwrite
const draftId = `drafts.${docId}`
const draft = await client.getDocument(draftId).catch(() => null)
if (draft) {
  await client.patch(draftId).set(fields).commit()
  console.log('Draft patched too.')
} else {
  console.log('No draft existed.')
}

console.log('Done.')
