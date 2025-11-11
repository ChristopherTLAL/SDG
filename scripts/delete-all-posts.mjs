
import { client } from '../src/lib/sanity/client.ts';

async function deleteAllPosts() {
  console.log('Fetching all post IDs...');
  const ids = await client.fetch('*[_type == "post"]._id');

  if (ids.length === 0) {
    console.log('No posts to delete.');
    return;
  }

  console.log(`Found ${ids.length} posts. Deleting in batches...`);

  const batchSize = 100;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    console.log(`Deleting batch ${i / batchSize + 1}...`);
    
    const transaction = client.transaction();
    batch.forEach(id => {
      transaction.delete(id);
    });
    
    await transaction.commit();
    console.log(`Batch ${i / batchSize + 1} deleted.`);
  }

  console.log('All posts have been successfully deleted.');
}

deleteAllPosts().catch(console.error);
