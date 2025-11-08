import fs from 'fs';
import csv from 'csv-parser';
import { v4 as uuidv4 } from 'uuid';

const results = [];
const outputFilePath = './sanity-studio/import.ndjson';
const inputFilePath = './data.csv';

// A simple function to generate a slug from a title
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

fs.createReadStream(inputFilePath)
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    let ndjson = '';
    results.forEach((row) => {
      // Create a unique ID for each post
      const postId = `imported-post-${uuidv4()}`;

      // Construct the post object for Sanity
      const post = {
        _type: 'post',
        _id: postId,
        title: row.title,
        slug: {
          _type: 'slug',
          current: slugify(row.title),
        },
        author: {
          _type: 'reference',
          _ref: row.authorId,
        },
        category: {
          _type: 'reference',
          _ref: row.categoryId,
        },
        publishedAt: row.publishedAt,
        mainImage: {
          _type: 'image',
          url: `https://source.unsplash.com/random/800x600?${slugify(row.title)}`,
          alt: row.title,
        },
        excerpt: row.excerpt,
        body: [
          {
            _type: 'block',
            style: 'normal',
            children: [
              {
                _type: 'span',
                text: row.body,
              },
            ],
          },
        ],
      };

      ndjson += JSON.stringify(post) + '\n';
    });

    fs.writeFileSync(outputFilePath, ndjson);
    console.log(`Successfully converted ${results.length} rows from CSV to ${outputFilePath}`);
    console.log('You can now run the Sanity import command.');
  });
