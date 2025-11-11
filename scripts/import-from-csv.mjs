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

// Function to convert markdown to basic Portable Text
const markdownToPortableText = (markdown) => {
  if (!markdown) return [];

  const blocks = markdown.split('\n').filter(Boolean).map(line => {
    let style = 'normal';
    let text = line;

    if (/^###\s/.test(line)) {
      style = 'h3';
      text = line.replace(/^###\s/, '');
    } else if (/^##\s/.test(line)) {
      style = 'h2';
      text = line.replace(/^##\s/, '');
    } else if (/^#\s/.test(line)) {
      style = 'h1';
      text = line.replace(/^#\s/, '');
    }

    const children = [];
    const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);

    parts.forEach(part => {
      if (part.startsWith('**') && part.endsWith('**')) {
        children.push({
          _type: 'span',
          _key: uuidv4(),
          text: part.slice(2, -2),
          marks: ['strong']
        });
      } else {
        children.push({
          _type: 'span',
          _key: uuidv4(),
          text: part,
          marks: []
        });
      }
    });

    return {
      _type: 'block',
      style: style,
      _key: uuidv4(),
      children: children
    };
  });

  return blocks;
};

fs.createReadStream(inputFilePath)
  .pipe(csv())
  .on('data', (data) => {
    const hasEmptyCell = Object.values(data).some(val => val === null || val.toString().trim() === '');
    if (!hasEmptyCell) {
      results.push(data);
    }
  })
  .on('end', () => {
    let ndjson = '';
    results.forEach((row) => {
      const postUUID = uuidv4();
      const postId = `imported-post-${postUUID}`;
      const categoryName = row.categoryId.replace('category-', '');

      // Construct the post object for Sanity
      const post = {
        _type: 'post',
        _id: postId,
        title: row.title,
        slug: {
          _type: 'slug',
          current: `${slugify(row.title)}-${postUUID.substring(0, 8)}`,
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
          url: `https://source.unsplash.com/random/800x600?${categoryName}`,
          alt: row.title,
        },
        excerpt: row.excerpt,
        body: markdownToPortableText(row.body),
      };

      ndjson += JSON.stringify(post) + '\n';
    });

    fs.writeFileSync(outputFilePath, ndjson);
    console.log(`Successfully converted ${results.length} rows from CSV to ${outputFilePath}`);
    console.log('You can now run the Sanity import command.');
  });
