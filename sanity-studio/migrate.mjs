// sanity-studio/migrate.mjs
import { createReadStream, createWriteStream } from 'fs';
import { client } from '../src/lib/sanity/client.ts';
import ndjson from 'ld-jsonstream';
import axios from 'axios';

async function fetchImage(url) {
  const response = await axios.get(url, { responseType: 'stream' });
  return response.data;
}

async function main() {
  const stream = createReadStream('import.ndjson').pipe(ndjson());
  const newFile = createWriteStream('import-fixed.ndjson');

  for await (const doc of stream) {
    if (doc._type === 'post' && doc.mainImage?.asset?.url) {
      try {
        const imageStream = await fetchImage(doc.mainImage.asset.url);
        const asset = await client.assets.upload('image', imageStream, {
          filename: doc.slug.current + '.jpg',
        });
        doc.mainImage.asset._ref = asset._id;
        delete doc.mainImage.asset.url;
      } catch (err) {
        console.error('Failed to import image for post:', doc.title, err);
      }
    }
    newFile.write(JSON.stringify(doc) + '\n');
  }

  console.log('Finished processing images. New file is import-fixed.ndjson');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
