# Architecture Documentation

## Overview

CSV Excel Converter is a Next.js 14 application using the App Router, TypeScript, Tailwind CSS, and Zustand for state management. It provides a web interface and REST API for converting data between multiple formats.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui (Radix primitives) |
| State Management | Zustand |
| Internationalization | next-intl |
| Testing | Vitest + Playwright |
| Form Validation | Zod |

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Client Layer                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │   Upload    │  │   Preview   │  │   Convert   │  │  Result   │  │
│  │  Component  │──│  Component  │──│   Button    │──│ Component │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │
│         │                │                │               │         │
│         └────────────────┴────────────────┴───────────────┘         │
│                                   │                                  │
│                           ┌───────▼────────┐                        │
│                           │  Zustand Store │                        │
│                           │  (converter)   │                        │
│                           └────────────────┘                        │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────┐
│                        Converter Library                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   CSV    │ │   JSON   │ │  Excel   │ │   XML    │ │   SQL    │  │
│  │ Parse/   │ │ Parse/   │ │ Parse/   │ │ Parse/   │ │  Write   │  │
│  │ Write    │ │ Write    │ │ Write    │ │ Write    │ │          │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│         │           │           │           │              │        │
│         └───────────┴───────────┴───────────┴──────────────┘        │
│                                 │                                    │
│                         ┌───────▼───────┐                           │
│                         │   Validation  │                           │
│                         │     (Zod)     │                           │
│                         └───────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────┐
│                          API Layer                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ POST /convert│  │ POST /parse  │  │ GET /formats, /health    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. File Upload Flow

```
User Action              Component               Store                Library
    │                        │                     │                     │
    ├──Drop/Select File─────►│                     │                     │
    │                        │                     │                     │
    │                        ├──setIsParsing(true)─►                     │
    │                        │                     │                     │
    │                        ├──detectFormat()─────────────────────────►│
    │                        │                     │                     │
    │                        │◄──format────────────────────────────────│
    │                        │                     │                     │
    │                        ├──parseData()────────────────────────────►│
    │                        │                     │                     │
    │                        │◄──ParsedData────────────────────────────│
    │                        │                     │                     │
    │                        ├──setParsedData()────►                     │
    │                        │                     │                     │
    │◄──Render Preview───────│                     │                     │
```

### 2. Conversion Flow

```
User Action              Component               Store                Library
    │                        │                     │                     │
    ├──Click Convert────────►│                     │                     │
    │                        │                     │                     │
    │                        ├──setIsConverting()──►                     │
    │                        │                     │                     │
    │                        ├──getOptions()───────►                     │
    │                        │◄─options────────────│                     │
    │                        │                     │                     │
    │                        ├──convertData()──────────────────────────►│
    │                        │                     │                     │
    │                        │◄──ConversionResult──────────────────────│
    │                        │                     │                     │
    │                        ├──setResult()────────►                     │
    │                        │                     │                     │
    │◄──Render Result────────│                     │                     │
```

## Component Architecture

### UI Components (`src/components/ui/`)

Base components from shadcn/ui built on Radix primitives:

- **Button** - Interactive button with variants
- **Card** - Content container
- **Input** - Text input field
- **Select** - Dropdown selection
- **Tabs** - Tab navigation
- **Toast** - Notification toasts
- **Dialog** - Modal dialogs

### Converter Components (`src/components/converter/`)

| Component | Purpose | Props |
|-----------|---------|-------|
| `FileUpload` | File input, drag-drop, paste, URL import | - |
| `DataPreview` | Table view of parsed data with sort/filter | - |
| `FormatSelector` | Input/output format dropdowns | - |
| `ConvertOptions` | Format-specific options panel | - |
| `ConvertButton` | Triggers conversion | - |
| `ConvertResult` | Shows result with download/copy | - |
| `ConversionStatus` | Live status announcements | - |

### Layout Components (`src/components/layout/`)

| Component | Purpose |
|-----------|---------|
| `Header` | Navigation, theme toggle, language switcher |
| `Footer` | Links, copyright, contact info |
| `SkipLink` | Accessibility skip navigation |
| `ThemeProvider` | Dark/light mode context |
| `ErrorBoundaryWrapper` | Error boundary with fallback UI |

## State Management

### Zustand Store (`src/stores/converter-store.ts`)

```typescript
interface ConverterState {
  // Input State
  inputData: string | ArrayBuffer | null;
  inputFormat: InputFormat | null;
  fileName: string | null;
  fileSize: number | null;

  // Parsing State
  parsedData: ParsedData | null;
  isParsing: boolean;
  parseError: string | null;

  // Output State
  outputFormat: OutputFormat;
  result: ConversionResult | null;
  isConverting: boolean;
  convertError: string | null;

  // Options
  csvOptions: CsvOptions;
  jsonOptions: JsonOptions;
  excelOptions: ExcelOptions;
  sqlOptions: SqlOptions;

  // Actions
  setInputData: (data, fileName?, fileSize?) => void;
  setInputFormat: (format) => void;
  setParsedData: (data) => void;
  setOutputFormat: (format) => void;
  setResult: (result) => void;
  setCsvOptions: (options) => void;
  // ... more actions
}
```

### State Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                        Zustand Store                              │
│                                                                   │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │   Input     │────►│   Parsed    │────►│   Output    │        │
│  │   State     │     │   State     │     │   State     │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│        ▲                   ▲                   ▲                 │
│        │                   │                   │                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │   Options   │     │   Errors    │     │  Loading    │        │
│  │   State     │     │   State     │     │   State     │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Converter Library

### Module Structure

```
src/lib/converter/
├── index.ts        # Main exports (parseData, convertData)
├── csv.ts          # CSV parse/write
├── json.ts         # JSON parse/write
├── excel.ts        # Excel parse/write (xlsx)
├── xml.ts          # XML parse/write
├── sql.ts          # SQL write only
├── detect.ts       # Format auto-detection
├── validation.ts   # Input validation schemas
└── types.ts        # TypeScript interfaces
```

### Parse Flow

```
parseData(data, format?)
      │
      ├─── Is ArrayBuffer? ──► parseExcel(data)
      │
      ├─── Format specified? ──► Use specified parser
      │
      └─── Auto-detect ──► detectFormat(data)
                                    │
                                    ├─── Starts with { or [ ──► parseJson
                                    ├─── Starts with < ──► parseXml
                                    ├─── Contains tabs ──► parseCsv('\t')
                                    └─── Default ──► parseCsv(',')
```

### Convert Flow

```
convertData(parsedData, outputFormat, options)
      │
      ├─── json ──► writeJson(data, options.json)
      ├─── csv ──► writeCsv(data, ',', options.csv)
      ├─── tsv ──► writeCsv(data, '\t', options.csv)
      ├─── xlsx ──► writeExcel(data, 'xlsx', options.excel)
      ├─── xls ──► writeExcel(data, 'xls', options.excel)
      ├─── xml ──► writeXml(data, options.xml)
      └─── sql ──► writeSql(data, options.sql)
```

## API Routes

### Route Structure

```
src/app/api/
├── convert/
│   └── route.ts    # POST - Convert data between formats
├── parse/
│   └── route.ts    # POST - Parse and return structured data
├── formats/
│   └── route.ts    # GET - List supported formats
├── health/
│   └── route.ts    # GET - Health check
└── openapi/
    └── route.ts    # GET - OpenAPI specification
```

### Request/Response Flow

```
Client Request
      │
      ▼
┌─────────────────┐
│   Middleware    │──► Rate Limiting
│                 │──► Security Headers
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Route Handler │──► Validate Input (Zod)
│                 │──► Process Request
│                 │──► Format Response
└────────┬────────┘
         │
         ▼
   JSON Response
```

## Internationalization

### Structure

```
src/
├── i18n/
│   ├── config.ts       # Supported locales (en, ar)
│   ├── request.ts      # Server-side locale detection
│   └── routing.ts      # Locale-based routing
├── messages/
│   ├── en.json         # English translations
│   └── ar.json         # Arabic translations
└── middleware.ts       # Locale detection middleware
```

### Translation Usage

```typescript
// In components
import { useTranslations } from 'next-intl';

function Component() {
  const t = useTranslations('namespace');
  return <p>{t('key')}</p>;
}

// With parameters
t('greeting', { name: 'John' })

// In messages/en.json
{
  "namespace": {
    "key": "Translated text",
    "greeting": "Hello, {name}!"
  }
}
```

## Security Architecture

### Input Validation

```
User Input
    │
    ▼
┌─────────────────┐
│  Zod Schemas    │──► Type checking
│                 │──► Size limits
│                 │──► Pattern validation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Sanitization   │──► XXE prevention (XML)
│                 │──► SQL escaping
│                 │──► URL validation
└────────┬────────┘
         │
         ▼
   Safe Processing
```

### Security Measures

| Threat | Mitigation |
|--------|------------|
| XXE Attacks | DOCTYPE rejection, external entity blocking |
| SQL Injection | Identifier escaping, dialect-aware quoting |
| SSRF | URL validation, internal IP blocking |
| File Bombs | 50MB size limit, streaming for large files |
| XSS | React auto-escaping, CSP headers |

## Performance Optimizations

### Client-Side

1. **Code Splitting** - Dynamic imports for large libraries (xlsx, swagger-ui)
2. **Memoization** - React.memo, useMemo, useCallback for expensive operations
3. **Virtual Scrolling** - For large data tables
4. **Debouncing** - Search and filter inputs

### Server-Side

1. **Streaming** - Large CSV files parsed in chunks
2. **Caching** - Static generation for documentation pages
3. **Response Compression** - gzip for text responses

### Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| App Router | Better SSR/SSG, React Server Components |
| Zustand | Simple, performant state management |
| Tailwind | Utility-first, smaller bundle size |
| Vitest | Faster than Jest, ESM native |
| next-intl | First-class Next.js integration |

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CDN (Vercel Edge)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Static    │  │   Images    │  │   Fonts     │             │
│  │   Assets    │  │             │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                      Vercel Functions                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Next.js Application                    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │   │
│  │  │   Pages     │  │   API       │  │  Middleware │      │   │
│  │  │   (SSG)     │  │   Routes    │  │             │      │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Future Considerations

1. **Worker Threads** - Move heavy parsing to Web Workers
2. **Database** - Persistent conversion history
3. **Authentication** - User accounts for saved preferences
4. **Webhooks** - Async notifications for batch processing
5. **File Storage** - S3/R2 for large file handling
