/**
 * Process multiple files in parallel with rate-limit-aware concurrency.
 */

import { ConverterClient, ConverterApiError } from '../src/index.js';

const client = new ConverterClient({
  baseUrl: process.env.MWM_BASE_URL ?? 'http://localhost:3000',
  apiKey: process.env.MWM_API_KEY,
});

const files = [
  { name: 'q1-sales.csv', data: 'date,amount\n2026-01-01,1000\n2026-01-02,1500' },
  { name: 'q2-sales.csv', data: 'date,amount\n2026-04-01,2000\n2026-04-02,2200' },
  { name: 'q3-sales.csv', data: 'date,amount\n2026-07-01,1800\n2026-07-02,1900' },
];

// Limit concurrency to stay under per-minute rate
async function pmap<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  const executing = new Set<Promise<void>>();
  for (const item of items) {
    const p = fn(item).then((r) => {
      results.push(r);
    });
    const wrapped = p.finally(() => executing.delete(wrapped));
    executing.add(wrapped);
    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);
  return results;
}

async function main() {
  const results = await pmap(files, 5, async (file) => {
    try {
      const result = await client.convert({
        data: file.data,
        inputFormat: 'csv',
        outputFormat: 'json',
        fileName: file.name,
      });
      return { name: file.name, ok: true, rows: result.metadata.rowCount };
    } catch (err) {
      if (err instanceof ConverterApiError) {
        return { name: file.name, ok: false, error: `${err.code}: ${err.message}` };
      }
      throw err;
    }
  });

  console.table(results);
}

main().catch(console.error);
