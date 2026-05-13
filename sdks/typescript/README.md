# @mwm/csv-converter-sdk

Official TypeScript SDK for the [CSV Excel Converter](https://github.com/mahmoodhamdi/CSV-Excel-Converter) API.

Convert between CSV, JSON, Excel (XLSX/XLS), XML, TSV, and SQL formats from your Node.js, Bun, Deno, or browser code.

## Installation

```bash
npm install @mwm/csv-converter-sdk
# or
pnpm add @mwm/csv-converter-sdk
# or
yarn add @mwm/csv-converter-sdk
```

## Quickstart

### Free tier (no API key)

```ts
import { ConverterClient } from '@mwm/csv-converter-sdk';

const client = new ConverterClient({ baseUrl: 'https://your-deployment.com' });

const result = await client.convert({
  data: 'name,age\nJohn,30\nJane,25',
  inputFormat: 'csv',
  outputFormat: 'json',
});

console.log(result.data);
// '[{"name":"John","age":"30"},{"name":"Jane","age":"25"}]'
```

### Pro tier (with API key)

```ts
import { ConverterClient } from '@mwm/csv-converter-sdk';

const client = new ConverterClient({
  apiKey: process.env.MWM_API_KEY, // mwm_...
});

const result = await client.convert({
  data: '...your data...',
  inputFormat: 'csv',
  outputFormat: 'xlsx',
});
```

Get an API key by generating one on your self-hosted deployment:

```bash
npm run gen-api-key -- --label=my-app --tier=pro
```

## API

### `new ConverterClient(options)`

| Option | Type | Default | Notes |
|---|---|---|---|
| `baseUrl` | `string` | `https://api.csv-excel-converter.com` | Your deployment URL. |
| `apiKey` | `string` | — | Required for `/api/v2/*` endpoints. |
| `fetch` | `typeof fetch` | `globalThis.fetch` | Override for Node < 18 or testing. |
| `timeoutMs` | `number` | `60000` | Per-request timeout. |

### `client.convert(request)`

Converts data between formats.

```ts
const r = await client.convert({
  data: 'a,b\n1,2',
  inputFormat: 'csv',
  outputFormat: 'xml',
  options: {
    csv: { hasHeader: true },
  },
});
```

### `client.parse(data, inputFormat?)`

Parses data and returns structured rows + metadata. Use this when you want
to inspect the data before deciding what to convert it to.

```ts
const r = await client.parse('name,age\nJohn,30');
console.log(r.data.rows); // [{ name: 'John', age: '30' }]
console.log(r.data.headers); // ['name', 'age']
```

### `client.formats()`

Lists supported input and output formats.

### `client.health()`

Health check. Returns `{ status: 'ok', timestamp }`.

### `client.keyInfo()`

Inspect the API key in use (requires `apiKey`):

```ts
const info = await client.keyInfo();
console.log(info.key.tier); // 'pro'
console.log(info.key.callCount); // 1234
console.log(info.limits.perMinute); // 600
```

## Error handling

All errors are thrown as `ConverterApiError`:

```ts
import { ConverterApiError } from '@mwm/csv-converter-sdk';

try {
  await client.convert({ /* ... */ });
} catch (err) {
  if (err instanceof ConverterApiError) {
    console.error(err.code, err.status, err.message);
    console.error('Request ID:', err.requestId);
  }
}
```

Common error codes:

| Code | Meaning |
|---|---|
| `UNAUTHORIZED` | Missing or invalid API key |
| `FILE_TOO_LARGE` | File exceeds 50MB limit |
| `VALIDATION_ERROR` | Request body failed Zod validation |
| `INVALID_CSV` | CSV could not be parsed |
| `INVALID_EXCEL` | Excel file signature invalid |
| `RATE_LIMIT_EXCEEDED` | Tier limit hit |

## Rate limits per tier

| Tier | Per minute | Burst |
|---|---|---|
| Free | 60 | 100 |
| Pro | 600 | 1,000 |
| Scale | 6,000 | 10,000 |
| Enterprise | Unlimited | — |

## TypeScript types

All request and response types are fully typed:

```ts
import type {
  InputFormat,
  OutputFormat,
  ConvertOptions,
  ConvertRequest,
  ConvertResponse,
  ApiErrorResponse,
} from '@mwm/csv-converter-sdk';
```

## Examples

See [`examples/`](./examples/) for runnable demos:

- [`examples/basic.ts`](./examples/basic.ts) — Simple CSV → JSON conversion
- [`examples/streaming-batch.ts`](./examples/streaming-batch.ts) — Batch multiple files
- [`examples/excel-with-options.ts`](./examples/excel-with-options.ts) — Excel output with formatting

## License

MIT. © 2026 MWM Software Solutions.
