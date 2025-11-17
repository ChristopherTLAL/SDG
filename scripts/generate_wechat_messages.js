import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonlFilePath = path.resolve(__dirname, '../public/verify/certificate_data.jsonl');
const outputFilePath = path.resolve(__dirname, 'wechat_messages.txt');

try {
  const jsonlContent = fs.readFileSync(jsonlFilePath, 'utf8');
  const lines = jsonlContent.split('\n').filter(line => line.trim() !== '');

  const messages = lines.map(line => {
    try {
      const record = JSON.parse(line);
      const { id, reason, recipient } = record;

      if (!reason) {
        return null; // Skip if reason is not present
      }

      // Regex to extract Title, Book Name, and ISBN
      const titleRegex = /chapter titled: ([\s\S]*?) in the internationally published book/;
      const bookNameRegex = /book\n'([\s\S]*?)'/;
      const isbnRegex = /\(ISBN: ([\s\S]*?)\)/;

      const titleMatch = reason.match(titleRegex);
      const bookNameMatch = reason.match(bookNameRegex);
      const isbnMatch = reason.match(isbnRegex);

      const title = titleMatch ? titleMatch[1].replace(/\n/g, ' ').trim() : 'N/A';
      const bookName = bookNameMatch ? bookNameMatch[1].replace(/\n/g, ' ').trim() : 'N/A';
      const isbn = isbnMatch ? isbnMatch[1].trim() : 'N/A';
      
      // Handle cases where the regex might not match (e.g., for non-book certificates)
      if (title === 'N/A' || bookName === 'N/A') {
          // This is not a book chapter certificate, so we will skip it.
          return null;
      }

      const message = `恭喜${recipient}署名的文章（${title}） 
已经编入${bookName}这本书（ISBN：${isbn}），目前可在亚马逊购买（美国亚马逊地址：https://www.amazon.com/dp/1955662096）。
发表证书请登录 https://sdg.undp.ac.cn/verify 输入证书编号 ${id} 获取电子版证书。若网站在中国大陆地区无法打开，请咨询工作人员获取帮助。`;
      
      return message;
    } catch (e) {
      console.error(`Could not parse line: ${line}`, e);
      return null;
    }
  }).filter(Boolean); // Filter out any null entries from parsing errors or skips

  fs.writeFileSync(outputFilePath, messages.join('\n\n---\n\n'), 'utf8');
  console.log(`Successfully generated ${messages.length} messages and saved to ${outputFilePath}`);

} catch (error) {
  console.error('Error processing file:', error);
}
