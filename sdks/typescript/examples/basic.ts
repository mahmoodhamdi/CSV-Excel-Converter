/**
 * Basic example: CSV → JSON
 *
 * Run with: npx tsx examples/basic.ts
 */

import { ConverterClient } from '../src/index.js';

async function main() {
  const client = new ConverterClient({
    baseUrl: process.env.MWM_BASE_URL ?? 'http://localhost:3000',
    apiKey: process.env.MWM_API_KEY,
  });

  const csv = [
    'product,price,stock',
    'Widget A,9.99,150',
    'Widget B,19.99,75',
    'Widget C,4.99,300',
  ].join('\n');

  const result = await client.convert({
    data: csv,
    inputFormat: 'csv',
    outputFormat: 'json',
    options: {
      json: { prettyPrint: true, indent: 2 },
    },
  });

  console.log('Converted output:');
  console.log(result.data);
  console.log('');
  console.log('Metadata:', result.metadata);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
