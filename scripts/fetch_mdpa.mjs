import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'
import 'dotenv/config'

const resultId = process.argv[2]
if (!resultId) { console.error('Usage: node fetch_mdpa.mjs <resultId>'); process.exit(1) }

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'waxbya4l',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const query = `*[_type == "mdpaResult" && resultId == $resultId][0]{
  _id, resultId, studentName, studentEmail, studentBackground,
  mbtiType, mbtiStrength, ocean, oceanRaw, avAdjustments, nClusters,
  qualityChecks, rawResponses, completedAt, durationSeconds, totalQuestions
}`
const doc = await client.fetch(query, { resultId })
if (!doc) { console.error('No result found for', resultId); process.exit(1) }

if (typeof doc.rawResponses === 'string') {
  try { doc.rawResponses = JSON.parse(doc.rawResponses) } catch (e) { console.error('rawResponses parse error', e); }
}

const outDir = path.resolve(process.cwd(), 'scripts/mdpa_processed', resultId)
fs.mkdirSync(outDir, { recursive: true })
const outFile = path.join(outDir, 'raw_result.json')
fs.writeFileSync(outFile, JSON.stringify(doc, null, 2))
console.log('Saved', outFile)
console.log('docId:', doc._id, 'student:', doc.studentName, 'mbti:', doc.mbtiType)
