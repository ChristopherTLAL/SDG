
import { client } from '../src/lib/sanity/client.ts';

async function deletePosts() {
  console.log('Fetching posts to delete...');
  const postIds = await client.fetch('*[_type == "post"]._id');

  if (postIds.length === 0) {
    console.log('No posts found to delete.');
    return;
  }

  console.log(`Found ${postIds.length} posts. Deleting...`);

  const transaction = client.transaction();
  postIds.forEach(id => {
    transaction.delete(id);
  });

  await transaction.commit();
  
  console.log('All posts have been deleted successfully.');
}

deletePosts().catch(console.error);
