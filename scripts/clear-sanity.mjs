// scripts/clear-sanity.mjs
// Delete all old posts, categories, and authors from Sanity
import { createClient } from '@sanity/client';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'waxbya4l',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-10-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

async function clearAll() {
  const types = ['post', 'category', 'author'];

  for (const type of types) {
    const docs = await client.fetch(`*[_type == "${type}"]{ _id }`);
    console.log(`Found ${docs.length} ${type} documents`);

    if (docs.length === 0) continue;

    // Delete in batches of 100
    for (let i = 0; i < docs.length; i += 100) {
      const batch = docs.slice(i, i + 100);
      const tx = client.transaction();
      batch.forEach(doc => {
        tx.delete(doc._id);
        // Also delete draft versions
        tx.delete(`drafts.${doc._id}`);
      });
      await tx.commit();
      console.log(`  Deleted batch ${Math.floor(i/100) + 1} (${batch.length} docs)`);
    }

    console.log(`✓ All ${type} documents deleted`);
  }

  console.log('\nDone! All old content cleared.');
}

clearAll().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
