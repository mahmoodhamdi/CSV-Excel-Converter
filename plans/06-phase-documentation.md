# Phase 6: Documentation & API Docs

## Priority: MEDIUM
## Estimated Effort: Medium
## Dependencies: Phase 1, Phase 2

---

## Overview

This phase adds comprehensive documentation including API documentation with OpenAPI/Swagger, developer guide, architecture documentation, and inline code documentation.

---

## Checklist

### 6.1 API Documentation (OpenAPI/Swagger)
- [ ] Create OpenAPI 3.0 specification
- [ ] Add Swagger UI page at /api-docs
- [ ] Document all endpoints
- [ ] Add request/response examples
- [ ] Add error response schemas

### 6.2 Developer Guide
- [ ] Create CONTRIBUTING.md
- [ ] Document development setup
- [ ] Document testing procedures
- [ ] Document deployment process
- [ ] Add troubleshooting guide

### 6.3 Architecture Documentation
- [ ] Create ARCHITECTURE.md
- [ ] Document data flow
- [ ] Document component structure
- [ ] Document state management
- [ ] Add diagrams

### 6.4 Code Documentation
- [ ] Add JSDoc to converter functions
- [ ] Add JSDoc to React components
- [ ] Add JSDoc to hooks
- [ ] Add JSDoc to store

### 6.5 API Usage Examples
- [ ] Add cURL examples
- [ ] Add JavaScript/TypeScript examples
- [ ] Add Python examples
- [ ] Add batch processing examples

### 6.6 Update Existing Docs
- [ ] Update README.md
- [ ] Update CLAUDE.md
- [ ] Add CHANGELOG.md
- [ ] Add SECURITY.md

---

## Detailed Implementation

### 6.1 OpenAPI Specification

```yaml
# src/app/api/openapi.yaml
openapi: 3.0.3
info:
  title: CSV Excel Converter API
  description: |
    REST API for converting between CSV, JSON, Excel, XML, TSV, and SQL formats.

    ## Features
    - Multiple format support
    - Batch conversion
    - Format auto-detection
    - Customizable options
  version: 1.0.0
  contact:
    email: mwm.softwars.solutions@gmail.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: http://localhost:3000
    description: Development server
  - url: https://your-domain.com
    description: Production server

paths:
  /api/convert:
    post:
      summary: Convert data between formats
      description: Converts data from one format to another with optional configuration
      operationId: convertData
      tags:
        - Conversion
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ConvertRequest'
            examples:
              csvToJson:
                summary: Convert CSV to JSON
                value:
                  data: "name,age\nJohn,30\nJane,25"
                  inputFormat: csv
                  outputFormat: json
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                outputFormat:
                  type: string
                  enum: [csv, tsv, json, xlsx, xls, xml, sql]
                options:
                  type: string
                  description: JSON string of conversion options
      responses:
        '200':
          description: Successful conversion
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ConvertResponse'
            application/octet-stream:
              schema:
                type: string
                format: binary
        '400':
          $ref: '#/components/responses/BadRequest'
        '413':
          $ref: '#/components/responses/PayloadTooLarge'
        '500':
          $ref: '#/components/responses/InternalError'

  /api/parse:
    post:
      summary: Parse data and return structured result
      description: Parses input data and returns headers, rows, and metadata
      operationId: parseData
      tags:
        - Parsing
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ParseRequest'
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
      responses:
        '200':
          description: Successful parsing
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ParseResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '500':
          $ref: '#/components/responses/InternalError'

  /api/formats:
    get:
      summary: Get supported formats
      description: Returns list of supported input and output formats
      operationId: getFormats
      tags:
        - Formats
      responses:
        '200':
          description: List of supported formats
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FormatsResponse'

  /api/health:
    get:
      summary: Health check
      description: Returns server health status
      operationId: healthCheck
      tags:
        - Health
      responses:
        '200':
          description: Server is healthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthResponse'

components:
  schemas:
    ConvertRequest:
      type: object
      required:
        - data
        - outputFormat
      properties:
        data:
          type: string
          description: Data to convert
          maxLength: 52428800
        inputFormat:
          type: string
          enum: [csv, tsv, json, xlsx, xls, xml]
          description: Input format (auto-detected if not provided)
        outputFormat:
          type: string
          enum: [csv, tsv, json, xlsx, xls, xml, sql]
          description: Desired output format
        options:
          $ref: '#/components/schemas/ConvertOptions'

    ConvertOptions:
      type: object
      properties:
        csv:
          $ref: '#/components/schemas/CsvOptions'
        json:
          $ref: '#/components/schemas/JsonOptions'
        excel:
          $ref: '#/components/schemas/ExcelOptions'
        sql:
          $ref: '#/components/schemas/SqlOptions'

    CsvOptions:
      type: object
      properties:
        delimiter:
          type: string
          default: ","
          maxLength: 1
        hasHeader:
          type: boolean
          default: true
        skipEmptyLines:
          type: boolean
          default: true
        trimValues:
          type: boolean
          default: true

    JsonOptions:
      type: object
      properties:
        prettyPrint:
          type: boolean
          default: true
        indentation:
          type: integer
          minimum: 0
          maximum: 8
          default: 2
        arrayFormat:
          type: string
          enum: [arrayOfObjects, objectOfArrays]
          default: arrayOfObjects

    ExcelOptions:
      type: object
      properties:
        sheetName:
          type: string
          default: Sheet1
          maxLength: 31
        autoFitColumns:
          type: boolean
          default: true
        freezeHeader:
          type: boolean
          default: false

    SqlOptions:
      type: object
      properties:
        tableName:
          type: string
          default: my_table
          pattern: "^[a-zA-Z_][a-zA-Z0-9_]*$"
        includeCreate:
          type: boolean
          default: false
        batchSize:
          type: integer
          minimum: 1
          maximum: 10000
          default: 100
        dialect:
          type: string
          enum: [mysql, postgresql, sqlite, mssql]
          default: postgresql

    ConvertResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: string
          description: Converted data (for text formats)
        format:
          type: string
        metadata:
          type: object
          properties:
            inputFormat:
              type: string
            outputFormat:
              type: string
            rowCount:
              type: integer
            columnCount:
              type: integer
        requestId:
          type: string
          format: uuid

    ParseRequest:
      type: object
      required:
        - data
      properties:
        data:
          type: string
          maxLength: 52428800
        format:
          type: string
          enum: [csv, tsv, json, xlsx, xls, xml]

    ParseResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: object
          properties:
            headers:
              type: array
              items:
                type: string
            rows:
              type: array
              items:
                type: object
            metadata:
              type: object

    FormatsResponse:
      type: object
      properties:
        input:
          type: array
          items:
            type: object
            properties:
              format:
                type: string
              extensions:
                type: array
                items:
                  type: string
              mimeTypes:
                type: array
                items:
                  type: string
        output:
          type: array
          items:
            type: object

    HealthResponse:
      type: object
      properties:
        status:
          type: string
          enum: [healthy, degraded, unhealthy]
        timestamp:
          type: string
          format: date-time
        version:
          type: string

    ErrorResponse:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: string
        code:
          type: string
        requestId:
          type: string
          format: uuid

  responses:
    BadRequest:
      description: Invalid request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            success: false
            error: "Validation failed"
            code: "VALIDATION_ERROR"
            requestId: "550e8400-e29b-41d4-a716-446655440000"

    PayloadTooLarge:
      description: File too large
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            success: false
            error: "File too large. Maximum size is 50MB"
            code: "FILE_TOO_LARGE"

    InternalError:
      description: Internal server error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'

tags:
  - name: Conversion
    description: Data conversion endpoints
  - name: Parsing
    description: Data parsing endpoints
  - name: Formats
    description: Format information endpoints
  - name: Health
    description: Health check endpoints
```

### 6.2 Swagger UI Page

```typescript
// src/app/[locale]/api-docs/page.tsx
'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">API Documentation</h1>
      <div className="bg-white rounded-lg shadow">
        <SwaggerUI url="/api/openapi.yaml" />
      </div>
    </div>
  );
}

// src/app/api/openapi.yaml/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'src/app/api/openapi.yaml');
  const content = fs.readFileSync(filePath, 'utf-8');

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'application/yaml',
    },
  });
}
```

### 6.3 CONTRIBUTING.md

```markdown
# Contributing to CSV Excel Converter

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 20+
- npm or yarn
- Git

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/CSV-Excel-Converter.git
   cd CSV-Excel-Converter
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

## Project Structure

```
src/
├── app/              # Next.js App Router
│   ├── [locale]/     # Internationalized pages
│   └── api/          # API routes
├── components/       # React components
│   ├── ui/           # Base UI components (shadcn/ui)
│   ├── converter/    # Converter-specific components
│   └── layout/       # Layout components
├── lib/              # Core libraries
│   └── converter/    # Conversion logic
├── hooks/            # Custom React hooks
├── stores/           # Zustand stores
├── i18n/             # Internationalization config
├── messages/         # Translation files
└── types/            # TypeScript types
```

## Development Workflow

### Creating a Feature

1. Create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Write tests:
   - Unit tests in `__tests__/unit/`
   - Integration tests in `__tests__/integration/`
   - E2E tests in `__tests__/e2e/`

4. Run tests:
   ```bash
   npm run test:unit
   npm run test:integration
   npm run test:e2e
   ```

5. Run linting:
   ```bash
   npm run lint
   ```

6. Commit your changes:
   ```bash
   git commit -m "feat: add your feature"
   ```

7. Push and create a pull request

### Commit Message Format

We use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance

### Running Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests (requires build)
npm run build
npm run test:e2e

# All tests with coverage
npm run test:coverage
```

### Adding a New Format

1. Create parser in `src/lib/converter/`
2. Add to `src/lib/converter/index.ts`
3. Update types in `src/types/index.ts`
4. Add format detection in `src/lib/converter/detect.ts`
5. Write tests
6. Update translations

## Code Style

- Use TypeScript
- Follow existing patterns
- Use functional components
- Prefer composition over inheritance
- Keep components small and focused

## Pull Request Guidelines

- Fill out the PR template
- Include tests
- Update documentation
- Ensure CI passes
- Request review

## Reporting Issues

Use GitHub Issues with:
- Clear title
- Steps to reproduce
- Expected vs actual behavior
- Environment details

## Questions?

- Email: mwm.softwars.solutions@gmail.com
- GitHub Issues
```

### 6.4 ARCHITECTURE.md

```markdown
# Architecture Documentation

## Overview

CSV Excel Converter is a Next.js 14 application using the App Router, TypeScript, and Tailwind CSS.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Upload    │  │   Preview   │  │      Convert        │  │
│  │  Component  │──│  Component  │──│     Component       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         │                │                    │              │
│         └────────────────┼────────────────────┘              │
│                          │                                   │
│                  ┌───────▼───────┐                          │
│                  │  Zustand Store │                          │
│                  │  (converter)   │                          │
│                  └───────────────┘                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Converter Library                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │
│  │   CSV   │ │  JSON   │ │  Excel  │ │   XML   │ │  SQL  │ │
│  │ Parser  │ │ Parser  │ │ Parser  │ │ Parser  │ │Writer │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. File Upload

```
User drops file
      │
      ▼
FileUpload component
      │
      ▼
Detect format (detect.ts)
      │
      ▼
Parse data (index.ts → format parser)
      │
      ▼
Store in Zustand (parsedData)
      │
      ▼
Render DataPreview
```

### 2. Conversion

```
User clicks Convert
      │
      ▼
ConvertButton triggers
      │
      ▼
Get options from store
      │
      ▼
convertData(parsedData, options)
      │
      ▼
Format-specific writer
      │
      ▼
Store result in Zustand
      │
      ▼
Render ConvertResult
```

## Component Architecture

### UI Components (src/components/ui/)

Base components from shadcn/ui:
- Button, Card, Input, Select, Tabs, Toast, etc.
- Styled with Tailwind CSS
- Accessible by default

### Converter Components (src/components/converter/)

| Component | Purpose |
|-----------|---------|
| FileUpload | File input, drag-drop, URL import |
| DataPreview | Table view of parsed data |
| FormatSelector | Input/output format dropdowns |
| ConvertOptions | Format-specific options |
| ConvertButton | Triggers conversion |
| ConvertResult | Shows result, download button |

### Layout Components (src/components/layout/)

| Component | Purpose |
|-----------|---------|
| Header | Navigation, theme, language |
| Footer | Links, copyright |
| ThemeProvider | Dark/light mode |
| LanguageSwitcher | EN/AR toggle |

## State Management

### Zustand Store (src/stores/converter-store.ts)

```typescript
interface ConverterState {
  // Input
  inputData: string | ArrayBuffer | null;
  inputFormat: InputFormat | null;
  fileName: string | null;

  // Parsed
  parsedData: ParsedData | null;
  isParsing: boolean;
  parseError: string | null;

  // Output
  outputFormat: OutputFormat;
  result: ConversionResult | null;
  isConverting: boolean;

  // Options
  csvOptions: CsvOptions;
  jsonOptions: JsonOptions;
  excelOptions: ExcelOptions;
  sqlOptions: SqlOptions;
}
```

## Converter Library

### Parse Flow

```
parseData(data, format?)
      │
      ├─── Binary? ──► parseExcel(data)
      │
      ├─── format given? ──► use specified
      │
      └─── detectFormat(data)
                │
                ├─── JSON detected ──► parseJson
                ├─── XML detected ──► parseXml
                ├─── TSV detected ──► parseCsv('\t')
                └─── default ──► parseCsv(',')
```

### Convert Flow

```
convertData(parsedData, options)
      │
      ├─── json ──► writeJson
      ├─── csv ──► writeCsv(',')
      ├─── tsv ──► writeCsv('\t')
      ├─── xlsx/xls ──► writeExcel
      ├─── xml ──► writeXml
      └─── sql ──► writeSql
```

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| /api/convert | POST | Convert data |
| /api/parse | POST | Parse and return structured data |
| /api/formats | GET | List supported formats |
| /api/health | GET | Health check |

## Internationalization

### Structure

```
src/
├── i18n/
│   ├── config.ts      # Locale configuration
│   ├── request.ts     # Server-side i18n
│   └── routing.ts     # Locale routing
├── messages/
│   ├── en.json        # English translations
│   └── ar.json        # Arabic translations
└── middleware.ts      # Locale detection
```

### Usage

```typescript
import { useTranslations } from 'next-intl';

function Component() {
  const t = useTranslations('namespace');
  return <p>{t('key')}</p>;
}
```

## Security Considerations

1. **XXE Protection** - XML parser configured securely
2. **SQL Injection** - Proper identifier escaping
3. **SSRF Prevention** - URL validation for imports
4. **File Size Limits** - 50MB maximum
5. **Input Validation** - Zod schemas

## Performance Optimizations

1. **Streaming** - Large CSV files parsed in chunks
2. **Virtualization** - Large tables use virtual scrolling
3. **Web Workers** - Heavy parsing off main thread
4. **Caching** - Conversion results cached
5. **Dynamic Imports** - Large libraries loaded on demand
```

### 6.5 JSDoc Examples

```typescript
// src/lib/converter/csv.ts

/**
 * Parses CSV data into a structured format.
 *
 * @param data - The CSV string to parse
 * @param options - Parsing options
 * @param options.delimiter - Column delimiter (default: ',')
 * @param options.hasHeader - Whether first row is header (default: true)
 * @param options.skipEmptyLines - Skip empty lines (default: true)
 * @param options.trimValues - Trim whitespace from values (default: true)
 * @returns Parsed data with headers and rows
 * @throws {ParseError} If the CSV is invalid or empty
 *
 * @example
 * ```typescript
 * const data = parseCsv('name,age\nJohn,30');
 * // { headers: ['name', 'age'], rows: [{ name: 'John', age: '30' }] }
 * ```
 *
 * @example
 * ```typescript
 * // With custom delimiter
 * const data = parseCsv('name;age\nJohn;30', { delimiter: ';' });
 * ```
 */
export function parseCsv(data: string, options: CsvOptions = {}): ParsedData {
  // ...
}

/**
 * Writes data to CSV format.
 *
 * @param headers - Column headers
 * @param rows - Array of row objects
 * @param options - Writing options
 * @returns CSV string
 *
 * @example
 * ```typescript
 * const csv = writeCsv(['name', 'age'], [{ name: 'John', age: 30 }]);
 * // 'name,age\nJohn,30'
 * ```
 */
export function writeCsv(
  headers: string[],
  rows: Record<string, unknown>[],
  options: CsvOptions = {}
): string {
  // ...
}
```

### 6.6 CHANGELOG.md

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- OpenAPI documentation at /api-docs
- Security headers in middleware
- Rate limiting for API endpoints
- File size validation (50MB limit)
- Comprehensive test coverage

### Changed
- Improved error messages
- Enhanced accessibility (WCAG 2.1 AA)
- Optimized large file handling

### Fixed
- XXE vulnerability in XML parser
- SQL injection in identifier escaping
- SSRF in URL import

### Security
- Added XXE protection
- Added SQL injection prevention
- Added SSRF protection
- Added input validation with Zod

## [1.0.0] - 2024-XX-XX

### Added
- Initial release
- CSV, JSON, Excel, XML, TSV, SQL format support
- Bidirectional conversion
- Live data preview
- Column mapping and filtering
- Batch conversion
- REST API
- Internationalization (EN/AR)
- Dark/light theme
- Docker support
```

### 6.7 SECURITY.md

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by emailing:
- mwm.softwars.solutions@gmail.com

Please include:
1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We will respond within 48 hours and work with you to resolve the issue.

## Security Measures

### Input Validation
- All inputs validated with Zod schemas
- File size limited to 50MB
- File types validated

### XXE Protection
- DOCTYPE declarations rejected
- External entities disabled
- Entity expansion limited

### SQL Injection Prevention
- All identifiers properly quoted
- Parameterized-style escaping
- Reserved words handled

### SSRF Protection
- URL validation for imports
- Internal IPs blocked
- HTTPS enforced

### Headers
- Content-Security-Policy
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
```

---

## Files to Create

- `src/app/api/openapi.yaml`
- `src/app/api/openapi.yaml/route.ts`
- `src/app/[locale]/api-docs/page.tsx` (update existing)
- `CONTRIBUTING.md`
- `ARCHITECTURE.md`
- `CHANGELOG.md`
- `SECURITY.md`
- Update `README.md`
- Update `CLAUDE.md`

---

## Prompt for Claude Code

```
Execute Phase 6: Documentation & API Docs for CSV-Excel-Converter

Read the plan at plans/06-phase-documentation.md and implement:

1. Create OpenAPI specification:
   - Create src/app/api/openapi.yaml with full API docs
   - Document all endpoints, schemas, responses
   - Add examples for each endpoint

2. Add Swagger UI:
   - Install swagger-ui-react
   - Update src/app/[locale]/api-docs/page.tsx
   - Create route to serve openapi.yaml

3. Create documentation files:
   - Create CONTRIBUTING.md with dev setup
   - Create ARCHITECTURE.md with diagrams
   - Create CHANGELOG.md
   - Create SECURITY.md

4. Add JSDoc to code:
   - Add JSDoc to all converter functions
   - Add JSDoc to React components
   - Add JSDoc to hooks

5. Update existing docs:
   - Update README.md with new sections
   - Update CLAUDE.md with new commands

Run build to verify no errors.
```
