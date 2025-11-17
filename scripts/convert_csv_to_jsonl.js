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
const expectedHeaders = ['', 'id', 'reason', 'recipient', 'body', 'date']; // Added empty string for the leading comma

fs.createReadStream(csvFilePath)
  .pipe(csv({ headers: expectedHeaders, skipLines: 1 })) // Use predefined headers and skip the original header row
  .on('data', (data) => {
    let hasBlankData = false;
    // Check the actual data columns for blank data
    const dataHeadersToCheck = ['id', 'reason', 'recipient', 'body', 'date'];
    for (const header of dataHeadersToCheck) {
      if (data[header] === null || data[header].toString().trim() === '') {
        hasBlankData = true;
        break;
      }
    }

    if (!hasBlankData) {
      delete data['']; // Remove the empty key from the data object
      results.push(data);
    }
  })
  .on('end', () => {
    try {
      const jsonlRecords = results.map(record => JSON.stringify(record));
      fs.appendFileSync(jsonlFilePath, '\n' + jsonlRecords.join('\n'), 'utf8');
      console.log(`Successfully converted ${results.length} records from ${csvFilePath} to ${jsonlFilePath}`);
    } catch (error) {
      console.error('Error writing to JSONL file:', error);
    }
  });
