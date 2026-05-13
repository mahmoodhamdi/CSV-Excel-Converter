/**
 * Convert JSON to Excel with custom sheet name and formatting.
 */

import { ConverterClient } from '../src/index.js';

const client = new ConverterClient({
  baseUrl: process.env.MWM_BASE_URL ?? 'http://localhost:3000',
  apiKey: process.env.MWM_API_KEY,
});

const data = JSON.stringify([
  { date: '2026-05-01', revenue: 15000, orders: 120 },
  { date: '2026-05-02', revenue: 17500, orders: 138 },
  { date: '2026-05-03', revenue: 14200, orders: 105 },
]);

const result = await client.convert({
  data,
  inputFormat: 'json',
  outputFormat: 'xlsx',
  fileName: 'daily-sales.xlsx',
  options: {
    excel: {
      sheetName: 'Daily Sales',
      autoFitColumns: true,
    },
  },
});

console.log('Excel file ready as base64-encoded blob');
console.log(`File name: ${result.fileName}`);
console.log(`Data length: ${result.data.length} chars (base64)`);
