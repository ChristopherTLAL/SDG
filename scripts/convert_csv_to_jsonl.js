import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvFilePath = path.join(__dirname, 'certificate_data.csv');
const jsonlFilePath = path.resolve(__dirname, '../public/verify/certificate_data.jsonl');

const results = [];
// Corrected order of headers based on observation of the CSV content
const expectedHeaders = ['id', 'reason', 'recipient', 'body', 'date'];

fs.createReadStream(csvFilePath)
  .pipe(csv({ headers: expectedHeaders, skipLines: 1 })) // Use predefined headers and skip the original header row
  .on('data', (data) => {
    let hasBlankData = false;
    // Check the first 5 columns for blank data using the expected headers
    for (let i = 0; i < 5; i++) {
      const header = expectedHeaders[i];
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
