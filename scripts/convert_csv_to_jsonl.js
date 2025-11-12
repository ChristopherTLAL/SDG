import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvFilePath = path.join(__dirname, 'certificate_data.csv');
const jsonlFilePath = path.resolve(__dirname, '../public/verify/certificate_data.jsonl');

async function convertCsvToJsonl() {
    try {
        const csvContent = await fs.readFile(csvFilePath, 'utf8');
        const lines = csvContent.split('\n').filter(line => line.trim() !== '');

        if (lines.length === 0) {
            console.log('CSV file is empty.');
            return;
        }

        const headers = lines[0].split(',').map(header => header.trim());
        const jsonlRecords = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            // Regex to correctly split CSV row, handling quotes
            const regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
            const values = (line.match(regex) || []).map(val => val.trim());

            const record = {};
            for (let j = 0; j < headers.length; j++) {
                let value = values[j] || '';
                // Remove surrounding quotes if present
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }
                record[headers[j]] = value;
            }
            jsonlRecords.push(JSON.stringify(record));
        }

        await fs.writeFile(jsonlFilePath, jsonlRecords.join('\n'), 'utf8');
        console.log(`Successfully converted ${csvFilePath} to ${jsonlFilePath}`);
    } catch (error) {
        console.error('Error converting CSV to JSONL:', error);
    }
}

convertCsvToJsonl();
