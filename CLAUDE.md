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
npm run test:unit        # Run unit tests (vitest, __tests__/unit/)
npm run test:integration # Run integration tests (vitest, __tests__/integration/)
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
- `index.ts` - Main entry points: `parseData()`, `convertData()`, `getOutputFilename()`

### State Management

Single Zustand store (`useConverterStore`) manages:
- Input data and parsed result
- Selected input/output formats
- Format-specific options (CSV delimiter, JSON indentation, SQL table name, etc.)
- Conversion state and errors

### API Routes (`src/app/api/`)

REST endpoints for programmatic access:
- `POST /api/convert` - Convert data between formats
- `POST /api/parse` - Parse data and return structured result
- `GET /api/formats` - List supported formats
- `GET /api/health` - Health check

### Internationalization

- Uses `next-intl` with locale routing (`/en`, `/ar`)
- Translation files in `src/messages/{en,ar}.json`
- RTL support for Arabic
- Config in `src/i18n/`

### Key Types (`src/types/index.ts`)

- `InputFormat`: csv | tsv | json | xlsx | xls | xml
- `OutputFormat`: InputFormat + sql
- `ParsedData`: { headers, rows, format, metadata }
- `ConversionResult`: { success, data, format, error, metadata }

## Testing Structure

- `__tests__/unit/` - Unit tests for converter library functions
- `__tests__/integration/` - API route integration tests
- `__tests__/e2e/` - Playwright browser tests
- E2E tests require production build (`npm run build` before `npm run test:e2e`)

## Path Alias

`@/` maps to `src/` directory (configured in tsconfig.json and vitest configs).
