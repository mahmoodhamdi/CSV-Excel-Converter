# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev              # Start development server on http://localhost:3000

# Build & Production
npm run build            # Build for production
npm run start            # Start production server

# Linting
npm run lint             # Run ESLint

# Testing
npm run test             # Run vitest in watch mode (unit, performance, security)
npm run test:unit        # Run unit tests once (vitest run)
npm run test:integration # Run integration tests (vitest, separate config)
npm run test:e2e         # Run E2E tests (playwright, requires build first)
npm run test:coverage    # Run tests with coverage report

# Run a single test file
npx vitest run __tests__/unit/lib/csv.test.ts
npx playwright test __tests__/e2e/convert.spec.ts
```

## Architecture

### Data Flow

1. **Input**: Files uploaded via `FileUpload` component or text pasted directly
2. **Parsing**: Data flows through `parseData()` in `src/lib/converter/index.ts` which auto-detects format and delegates to format-specific parsers
3. **State**: Parsed data stored in Zustand store (`src/stores/converter-store.ts`)
4. **Conversion**: `convertData()` transforms `ParsedData` to target format
5. **Output**: Result downloaded via FileSaver or displayed in preview

### Converter Library (`src/lib/converter/`)

Central conversion engine with format-specific modules:
- `csv.ts` - CSV/TSV parsing (PapaParse) and writing
- `json.ts` - JSON parsing and pretty-printing
- `excel.ts` - Excel parsing and writing (xlsx/SheetJS)
- `xml.ts` - XML parsing and writing (fast-xml-parser)
- `sql.ts` - SQL INSERT statement generation
- `detect.ts` - Auto-detection of format from content, filename, or MIME type
- `csv-stream.ts` / `csv-worker-wrapper.ts` - Web Worker support for large CSV files
- `index.ts` - Main entry points: `parseData()`, `convertData()`, `getOutputFilename()`

### State Management

Single Zustand store (`useConverterStore`) manages:
- Input data and parsed result
- Selected input/output formats
- Format-specific options (CSV delimiter, JSON indentation, SQL table name, etc.)
- Conversion state and errors

### Pages (`src/app/[locale]/`)

- `/` - Main converter page
- `/batch` - Batch file conversion
- `/transform` - Data transformation (filter, deduplicate, column mapping)
- `/history` - Conversion history
- `/api-docs` - Interactive Swagger UI API documentation

### API Routes (`src/app/api/`)

REST endpoints for programmatic access:
- `POST /api/convert` - Convert data between formats
- `POST /api/parse` - Parse data and return structured result
- `GET /api/formats` - List supported formats
- `GET /api/health` - Health check
- `GET /api/openapi` - OpenAPI 3.0 specification

### Middleware (`src/middleware.ts`)

Handles two concerns:
- **API routes**: Rate limiting (Redis via Upstash with in-memory fallback) + security headers
- **Page routes**: `next-intl` locale routing + CSP + security headers

### Internationalization

- Uses `next-intl` with locale routing (`/en`, `/ar`)
- Translation files in `src/messages/{en,ar}.json`
- RTL support for Arabic
- Locale config in `src/i18n/config.ts`, routing navigation helpers in `src/i18n/routing.ts`

### Key Types (`src/types/index.ts`)

- `InputFormat`: csv | tsv | json | xlsx | xls | xml
- `OutputFormat`: InputFormat + sql
- `ParsedData`: { headers, rows, format, metadata }
- `ConversionResult`: { success, data, format, error, metadata }

### Environment Variables

All optional. Copy `.env.example` to `.env.local`. Key ones:
- `NEXT_PUBLIC_BASE_URL` - Base URL for OG/sitemap
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` - Redis rate limiting (falls back to in-memory)
- `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_ORG` / `SENTRY_PROJECT` - Sentry error tracking (disabled if unset)

## Testing Structure

- `__tests__/unit/` - Unit tests for converter library, store, and hooks
- `__tests__/integration/` - API route integration tests (separate vitest config: `vitest.integration.config.ts`)
- `__tests__/performance/` - Performance tests for large file handling
- `__tests__/security/` - Security tests (input validation, SQL injection)
- `__tests__/e2e/` - Playwright browser tests (Chromium only, runs against `npm run start`)
- E2E tests require production build (`npm run build` before `npm run test:e2e`)

## Path Alias

`@/` maps to `src/` directory (configured in tsconfig.json and both vitest configs).
