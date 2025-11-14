import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvFilePath = path.join(__dirname, 'certificate_data.csv');
const jsonlFilePath = path.resolve(__dirname, '../public/verify/certificate_data.jsonl');

const results = [];

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (data) => {
    const headers = Object.keys(data);
    let hasBlankData = false;
    // Only check the first 5 columns for blank data
    for (let i = 0; i < 5 && i < headers.length; i++) {
      const header = headers[i];
      if (data[header] === null || data[header].toString().trim() === '') {
        hasBlankData = true;
        break;
      }
    }

    if (!hasBlankData) {
      results.push(data);
    }
  })
  .on('end', () => {
    try {
      const jsonlRecords = results.map(record => JSON.stringify(record));
      fs.writeFileSync(jsonlFilePath, jsonlRecords.join('\n'), 'utf8');
      console.log(`Successfully converted ${results.length} records from ${csvFilePath} to ${jsonlFilePath}`);
    } catch (error) {
      console.error('Error writing to JSONL file:', error);
    }
  });
