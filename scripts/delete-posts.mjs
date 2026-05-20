
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

const CONFIRM = process.argv.includes('--confirm') || process.argv.includes('--yes');
if (!CONFIRM) {
  console.error(`⛔ Refusing to run: this permanently deletes ALL posts from the "${client.config().dataset}" Sanity dataset.`);
  console.error('   Re-run with --confirm if you are sure:  node scripts/delete-posts.mjs --confirm');
  process.exit(1);
}

deletePosts().catch(console.error);
