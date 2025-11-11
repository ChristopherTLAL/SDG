
import { client } from '../src/lib/sanity/client.ts';

async function listPosts() {
  const posts = await client.fetch('*[_type == "post"]{_id, title}');
  if (posts.length === 0) {
    console.log('No posts found.');
    return;
  }
  console.log(`Found ${posts.length} posts:`);
  posts.forEach(post => {
    console.log(`- ID: ${post._id}, Title: ${post.title}`);
  });
}

listPosts().catch(console.error);
