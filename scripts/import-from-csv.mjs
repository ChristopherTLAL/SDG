import fs from 'fs';
import csv from 'csv-parser';
import { v4 as uuidv4 } from 'uuid';
import { remark } from 'remark';
import { inspect } from 'util';

const results = [];
const outputFilePath = './sanity-studio/import.ndjson';
const inputFilePath = './data.csv';

// A simple function to generate a slug from a title
const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

// --- Comprehensive Markdown to Portable Text Converter ---

// Helper to convert a remark AST node to a Sanity span
function nodeToSpan(node) {
  const marks = [];
  if (node.type === 'strong') marks.push('strong');
  if (node.type === 'emphasis') marks.push('em');
  
  if (node.children && node.children.length > 0) {
    // Handle nested styles like **_bold italic_**
    return node.children.map(nodeToSpan).flat();
  }

  return {
    _type: 'span',
    _key: uuidv4(),
    text: node.value || (node.children && node.children[0] ? node.children[0].value : '') || '',
    marks: marks,
  };
}

// Main conversion function
const markdownToPortableText = (markdown) => {
  if (!markdown) return [];

  const tree = remark().parse(markdown);
  const blocks = [];

  tree.children.forEach(node => {
    const block = {
      _type: 'block',
      _key: uuidv4(),
      children: [],
    };

    switch (node.type) {
      case 'heading':
        block.style = `h${node.depth}`;
        block.children = node.children.map(child => {
            if (child.type === 'link') {
                return {
                    _type: 'span',
                    _key: uuidv4(),
                    text: child.children[0].value,
                    marks: [uuidv4()]
                }
            }
            return nodeToSpan(child)
        }).flat();
        break;

      case 'paragraph':
        block.style = 'normal';
        block.children = node.children.map(child => {
            if (child.type === 'link') {
                return {
                    _type: 'span',
                    _key: uuidv4(),
                    text: child.children[0].value,
                    marks: [uuidv4()]
                }
            }
            return nodeToSpan(child)
        }).flat();
        break;
        
      case 'list':
        node.children.forEach(listItem => {
          const listBlock = {
            ...block,
            _key: uuidv4(),
            listItem: node.ordered ? 'number' : 'bullet',
            level: 1, // Basic implementation, doesn't handle nested lists
            children: listItem.children[0].children.map(nodeToSpan).flat(),
          };
          blocks.push(listBlock);
        });
        return; // Skip pushing the main block

      case 'blockquote':
        block.style = 'blockquote';
        block.children = node.children[0].children.map(nodeToSpan).flat();
        break;

      default:
        // For other node types, just try to get the text value
        block.style = 'normal';
        block.children.push({
            _type: 'span',
            _key: uuidv4(),
            text: node.value || (node.children && node.children[0] ? node.children[0].value : '') || '',
            marks: []
        });
        break;
    }
    blocks.push(block);
  });

  return blocks;
};


// --- Main Script Logic ---

fs.createReadStream(inputFilePath)
  .pipe(csv())
  .on('data', (data) => {
    // Skip row if any cell is empty
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

      const post = {
        _type: 'post',
        _id: postId,
        title: row.title,
        slug: {
          _type: 'slug',
          current: `${slugify(row.title)}-${postUUID.substring(0, 8)}`,
        },
        author: { _type: 'reference', _ref: row.authorId },
        category: { _type: 'reference', _ref: row.categoryId },
        publishedAt: row.publishedAt,
        excerpt: row.excerpt,
        body: markdownToPortableText(row.body),
      };

      ndjson += JSON.stringify(post) + '\n';
    });

    fs.writeFileSync(outputFilePath, ndjson);
    console.log(`Successfully converted ${results.length} rows from CSV to ${outputFilePath}`);
    console.log('You can now run the Sanity import command.');
  });