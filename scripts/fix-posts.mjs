
import { client } from '../src/lib/sanity/client.ts';

async function fixMissingTimestamps() {
  console.log('Fetching posts that are missing timestamps...');
  // Query for posts that do not have a _createdAt field
  const ids = await client.fetch('*[_type == "post" && !defined(_createdAt)]._id');

  if (ids.length === 0) {
    console.log('No posts found missing timestamps. Nothing to do.');
    return;
  }

  console.log(`Found ${ids.length} posts to fix. Patching in batches...`);
  const now = new Date().toISOString();

  const batchSize = 100;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batchIds = ids.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1}...`);

    const transaction = client.transaction();
    batchIds.forEach(id => {
      // Use patch to add the new fields without overwriting the whole document
      transaction.patch(id, (p) => 
        p.set({
          _createdAt: now,
          _updatedAt: now,
        })
      );
    });

    await transaction.commit();
    console.log(`Batch ${i / batchSize + 1} patched successfully.`);
  }

  console.log('All posts have been updated with timestamps.');
}

fixMissingTimestamps().catch(console.error);
