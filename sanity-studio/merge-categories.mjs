// sanity-studio/merge-categories.mjs
import { client } from '../src/lib/sanity/client.ts';

async function mergeDuplicateCategories() {
  console.log('Fetching all categories...');
  const allCategories = await client.fetch('*[_type == "category"]');

  // Group categories by title
  const categoriesByTitle = allCategories.reduce((acc, category) => {
    if (!acc[category.title]) {
      acc[category.title] = [];
    }
    acc[category.title].push(category);
    return acc;
  }, {});

  console.log('Finding duplicates...');
  for (const title in categoriesByTitle) {
    const categories = categoriesByTitle[title];
    if (categories.length > 1) {
      console.log(`Found ${categories.length} duplicates for "${title}". Merging...`);

      // 1. Choose one category as the canonical one (we'll use the first one)
      const canonicalCategory = categories[0];
      const duplicateCategories = categories.slice(1);
      const duplicateIds = duplicateCategories.map(c => c._id);

      console.log(`  - Canonical ID: ${canonicalCategory._id}`);
      console.log(`  - Duplicate IDs: ${duplicateIds.join(', ')}`);

      // 2. Find all posts that refer to the duplicate categories
      const referringPosts = await client.fetch(
        '*[_type == "post" && category._ref in $duplicateIds]',
        { duplicateIds }
      );

      if (referringPosts.length > 0) {
        console.log(`  - Found ${referringPosts.length} posts to update. Patching...`);
        // 3. Create a transaction to update all referring posts
        const transaction = client.transaction();
        referringPosts.forEach(post => {
          transaction.patch(post._id, {
            set: { 'category._ref': canonicalCategory._id }
          });
        });
        await transaction.commit();
        console.log('  - Successfully updated posts.');
      } else {
        console.log('  - No posts found referring to these duplicates.');
      }

      // 4. Create a transaction to delete the duplicate categories
      console.log('  - Deleting duplicate categories...');
      const deleteTransaction = client.transaction();
      duplicateIds.forEach(id => {
        deleteTransaction.delete(id);
      });
      await deleteTransaction.commit();
      console.log('  - Successfully deleted duplicates.');
    }
  }

  console.log('\nMerge process completed!');
}

mergeDuplicateCategories().catch(err => {
  console.error('An error occurred:', err);
  process.exit(1);
});
