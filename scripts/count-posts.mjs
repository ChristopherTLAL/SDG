
import { client } from '../src/lib/sanity/client.ts';

async function countPosts() {
  const count = await client.fetch('count(*[_type == "post"])');
  console.log(`Total number of posts found: ${count}`);
}

countPosts().catch(console.error);
