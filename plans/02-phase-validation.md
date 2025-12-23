# Phase 2: Input Validation & Error Handling

## Priority: HIGH
## Estimated Effort: High
## Dependencies: Phase 1

---

## Overview

This phase implements comprehensive input validation using Zod schemas, improves error handling throughout the application, and ensures consistent error responses.

---

## Checklist

### 2.1 Create Zod Validation Schemas
- [ ] Create `src/lib/validation/schemas.ts` with all input schemas
- [ ] Add schema for ConvertOptions
- [ ] Add schema for ParseOptions
- [ ] Add schema for API request bodies
- [ ] Add schema for file metadata
- [ ] Export type inference from schemas

### 2.2 Implement API Route Validation
- [ ] Update `/api/convert` with Zod validation
- [ ] Update `/api/parse` with Zod validation
- [ ] Create consistent error response format
- [ ] Add request ID tracking
- [ ] Implement proper HTTP status codes

### 2.3 Add Error Boundaries
- [ ] Create global error boundary component
- [ ] Add error boundary to converter page
- [ ] Add error boundary to batch page
- [ ] Add error boundary to transform page
- [ ] Implement error recovery UI

### 2.4 Improve Converter Error Handling
- [ ] Add try-catch to all parser functions
- [ ] Create custom error classes
- [ ] Add error codes for different failure types
- [ ] Implement error recovery suggestions
- [ ] Add logging for errors

### 2.5 Add Form Validation
- [ ] Validate ConvertOptions form inputs
- [ ] Validate SQL options (table name format)
- [ ] Validate Excel options (sheet name)
- [ ] Add real-time validation feedback
- [ ] Add aria-invalid for accessibility

### 2.6 Implement Type Guards
- [ ] Create type guards for ParsedData
- [ ] Create type guards for ConversionResult
- [ ] Add runtime type checking at boundaries
- [ ] Document type guard usage

### 2.7 Add Timeout Handling
- [ ] Add conversion timeout (30 seconds)
- [ ] Add parsing timeout (60 seconds)
- [ ] Add API request timeout
- [ ] Show timeout errors to users

### 2.8 Create Error Tests
- [ ] Test invalid input handling
- [ ] Test timeout scenarios
- [ ] Test validation error messages
- [ ] Test error boundary rendering

---

## Detailed Implementation

### 2.1 Zod Schemas

```typescript
// src/lib/validation/schemas.ts
import { z } from 'zod';

// Base format schemas
export const inputFormatSchema = z.enum(['csv', 'tsv', 'json', 'xlsx', 'xls', 'xml']);
export const outputFormatSchema = z.enum(['csv', 'tsv', 'json', 'xlsx', 'xls', 'xml', 'sql']);

// Option schemas
export const csvOptionsSchema = z.object({
  delimiter: z.string().length(1).default(','),
  hasHeader: z.boolean().default(true),
  skipEmptyLines: z.boolean().default(true),
  trimValues: z.boolean().default(true),
  encoding: z.string().optional(),
}).partial();

export const jsonOptionsSchema = z.object({
  prettyPrint: z.boolean().default(true),
  indentation: z.number().min(0).max(8).default(2),
  flattenNested: z.boolean().default(false),
  arrayFormat: z.enum(['arrayOfObjects', 'objectOfArrays']).default('arrayOfObjects'),
}).partial();

export const excelOptionsSchema = z.object({
  sheetName: z.string().min(1).max(31).regex(/^[^*?:/\\[\]]+$/, 'Invalid sheet name characters').default('Sheet1'),
  selectedSheet: z.union([z.number(), z.string()]).optional(),
  includeFormulas: z.boolean().optional(),
  autoFitColumns: z.boolean().default(true),
  freezeHeader: z.boolean().default(false),
  headerStyle: z.boolean().default(true),
}).partial();

export const sqlOptionsSchema = z.object({
  tableName: z.string()
    .min(1)
    .max(128)
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Table name must start with letter or underscore')
    .default('my_table'),
  includeCreate: z.boolean().default(false),
  batchSize: z.number().min(1).max(10000).default(100),
  dialect: z.enum(['mysql', 'postgresql', 'sqlite', 'mssql']).default('postgresql'),
}).partial();

// Convert options schema
export const convertOptionsSchema = z.object({
  inputFormat: inputFormatSchema.optional(),
  outputFormat: outputFormatSchema,
  csv: csvOptionsSchema.optional(),
  json: jsonOptionsSchema.optional(),
  excel: excelOptionsSchema.optional(),
  sql: sqlOptionsSchema.optional(),
});

// API request schemas
export const convertRequestSchema = z.object({
  data: z.string().min(1, 'Data is required').max(50 * 1024 * 1024, 'Data too large'),
  inputFormat: inputFormatSchema.optional(),
  outputFormat: outputFormatSchema,
  options: convertOptionsSchema.partial().optional(),
});

export const parseRequestSchema = z.object({
  data: z.string().min(1, 'Data is required').max(50 * 1024 * 1024, 'Data too large'),
  format: inputFormatSchema.optional(),
});

// Type exports
export type InputFormat = z.infer<typeof inputFormatSchema>;
export type OutputFormat = z.infer<typeof outputFormatSchema>;
export type ConvertOptions = z.infer<typeof convertOptionsSchema>;
export type ConvertRequest = z.infer<typeof convertRequestSchema>;
export type ParseRequest = z.infer<typeof parseRequestSchema>;
```

### 2.2 API Validation Implementation

```typescript
// src/app/api/convert/route.ts - Updated
import { NextRequest, NextResponse } from 'next/server';
import { convertRequestSchema } from '@/lib/validation/schemas';
import { ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';

interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: unknown;
  requestId: string;
}

interface ApiSuccess<T> {
  success: true;
  data: T;
  requestId: string;
}

function createErrorResponse(
  error: string,
  code: string,
  status: number,
  requestId: string,
  details?: unknown
): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error, code, details, requestId },
    { status }
  );
}

export async function POST(request: NextRequest) {
  const requestId = uuidv4();

  try {
    const body = await request.json();

    // Validate request body
    const validatedData = convertRequestSchema.parse(body);

    // Process conversion...
    const result = await convertData(validatedData);

    return NextResponse.json({
      success: true,
      data: result,
      requestId,
    });

  } catch (error) {
    if (error instanceof ZodError) {
      return createErrorResponse(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        requestId,
        error.errors
      );
    }

    if (error instanceof Error) {
      // Log error for monitoring
      console.error(`[${requestId}] Conversion error:`, error);

      return createErrorResponse(
        error.message,
        'CONVERSION_ERROR',
        500,
        requestId
      );
    }

    return createErrorResponse(
      'An unexpected error occurred',
      'INTERNAL_ERROR',
      500,
      requestId
    );
  }
}
```

### 2.3 Error Boundary Implementation

```typescript
// src/components/ErrorBoundary.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    // Log to error tracking service
    console.error('Error boundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="m-4 border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              An error occurred while rendering this component.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                {this.state.error.message}
                {this.state.errorInfo?.componentStack}
              </pre>
            )}
            <Button onClick={this.handleReset} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
```

### 2.4 Custom Error Classes

```typescript
// src/lib/errors.ts
export class ConversionError extends Error {
  code: string;
  recoverable: boolean;
  suggestion?: string;

  constructor(
    message: string,
    code: string,
    options: { recoverable?: boolean; suggestion?: string } = {}
  ) {
    super(message);
    this.name = 'ConversionError';
    this.code = code;
    this.recoverable = options.recoverable ?? false;
    this.suggestion = options.suggestion;
  }
}

export class ParseError extends Error {
  code: string;
  line?: number;
  column?: number;

  constructor(
    message: string,
    code: string,
    position?: { line?: number; column?: number }
  ) {
    super(message);
    this.name = 'ParseError';
    this.code = code;
    this.line = position?.line;
    this.column = position?.column;
  }
}

export class ValidationError extends Error {
  code: string;
  field?: string;

  constructor(message: string, code: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.field = field;
  }
}

export class TimeoutError extends Error {
  code: string;
  timeout: number;

  constructor(message: string, timeout: number) {
    super(message);
    this.name = 'TimeoutError';
    this.code = 'TIMEOUT';
    this.timeout = timeout;
  }
}

// Error codes
export const ErrorCodes = {
  // Parse errors
  INVALID_CSV: 'INVALID_CSV',
  INVALID_JSON: 'INVALID_JSON',
  INVALID_XML: 'INVALID_XML',
  INVALID_EXCEL: 'INVALID_EXCEL',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',

  // Conversion errors
  CONVERSION_FAILED: 'CONVERSION_FAILED',
  OUTPUT_TOO_LARGE: 'OUTPUT_TOO_LARGE',

  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED: 'MISSING_REQUIRED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',

  // System errors
  TIMEOUT: 'TIMEOUT',
  MEMORY_EXCEEDED: 'MEMORY_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
```

### 2.5 Form Validation

```typescript
// src/components/converter/ConvertOptions.tsx - Updated
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sqlOptionsSchema, excelOptionsSchema } from '@/lib/validation/schemas';

export function ConvertOptions() {
  const { sqlOptions, setSqlOptions, excelOptions, setExcelOptions } = useConverterStore();

  const sqlForm = useForm({
    resolver: zodResolver(sqlOptionsSchema),
    defaultValues: sqlOptions,
    mode: 'onChange',
  });

  const excelForm = useForm({
    resolver: zodResolver(excelOptionsSchema),
    defaultValues: excelOptions,
    mode: 'onChange',
  });

  return (
    <div>
      {/* SQL Options */}
      <form onChange={sqlForm.handleSubmit((data) => setSqlOptions(data))}>
        <div>
          <Label htmlFor="tableName">Table Name</Label>
          <Input
            id="tableName"
            {...sqlForm.register('tableName')}
            aria-invalid={!!sqlForm.formState.errors.tableName}
            aria-describedby="tableName-error"
          />
          {sqlForm.formState.errors.tableName && (
            <p id="tableName-error" className="text-destructive text-sm">
              {sqlForm.formState.errors.tableName.message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
```

### 2.6 Type Guards

```typescript
// src/lib/type-guards.ts
import type { ParsedData, ConversionResult, InputFormat, OutputFormat } from '@/types';

export function isParsedData(value: unknown): value is ParsedData {
  if (typeof value !== 'object' || value === null) return false;

  const obj = value as Record<string, unknown>;

  return (
    Array.isArray(obj.headers) &&
    obj.headers.every((h) => typeof h === 'string') &&
    Array.isArray(obj.rows) &&
    obj.rows.every((r) => typeof r === 'object' && r !== null)
  );
}

export function isConversionResult(value: unknown): value is ConversionResult {
  if (typeof value !== 'object' || value === null) return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.success === 'boolean' &&
    typeof obj.format === 'string'
  );
}

export function isInputFormat(value: string): value is InputFormat {
  return ['csv', 'tsv', 'json', 'xlsx', 'xls', 'xml'].includes(value);
}

export function isOutputFormat(value: string): value is OutputFormat {
  return ['csv', 'tsv', 'json', 'xlsx', 'xls', 'xml', 'sql'].includes(value);
}

export function assertParsedData(value: unknown): asserts value is ParsedData {
  if (!isParsedData(value)) {
    throw new Error('Invalid ParsedData structure');
  }
}
```

### 2.7 Timeout Implementation

```typescript
// src/lib/timeout.ts
import { TimeoutError } from './errors';

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new TimeoutError(
        `${operation} timed out after ${timeoutMs}ms`,
        timeoutMs
      ));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

// Usage in converter
export async function parseDataWithTimeout(
  data: string | ArrayBuffer,
  format?: InputFormat
): Promise<ParsedData> {
  return withTimeout(
    parseData(data, format),
    60000, // 60 second timeout
    'Data parsing'
  );
}

export async function convertDataWithTimeout(
  parsedData: ParsedData,
  options: ConvertOptions
): Promise<ConversionResult> {
  return withTimeout(
    Promise.resolve(convertData(parsedData, options)),
    30000, // 30 second timeout
    'Data conversion'
  );
}
```

---

## Testing Requirements

```typescript
// __tests__/unit/lib/validation.test.ts
import { convertRequestSchema, sqlOptionsSchema } from '@/lib/validation/schemas';

describe('Validation Schemas', () => {
  describe('convertRequestSchema', () => {
    it('should accept valid request', () => {
      const result = convertRequestSchema.safeParse({
        data: 'name,age\nJohn,30',
        outputFormat: 'json',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty data', () => {
      const result = convertRequestSchema.safeParse({
        data: '',
        outputFormat: 'json',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid output format', () => {
      const result = convertRequestSchema.safeParse({
        data: 'test',
        outputFormat: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('sqlOptionsSchema', () => {
    it('should accept valid table name', () => {
      const result = sqlOptionsSchema.safeParse({ tableName: 'my_table' });
      expect(result.success).toBe(true);
    });

    it('should reject table name starting with number', () => {
      const result = sqlOptionsSchema.safeParse({ tableName: '123table' });
      expect(result.success).toBe(false);
    });

    it('should reject table name with special characters', () => {
      const result = sqlOptionsSchema.safeParse({ tableName: 'my-table!' });
      expect(result.success).toBe(false);
    });
  });
});

// __tests__/unit/components/ErrorBoundary.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should render error UI when error thrown', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('should reset on button click', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Try again'));
    // Component will throw again, but state was reset
    spy.mockRestore();
  });
});
```

---

## Files to Create/Modify

### New Files:
- `src/lib/validation/schemas.ts`
- `src/lib/validation/index.ts`
- `src/lib/errors.ts`
- `src/lib/type-guards.ts`
- `src/lib/timeout.ts`
- `src/components/ErrorBoundary.tsx`
- `__tests__/unit/lib/validation.test.ts`
- `__tests__/unit/lib/errors.test.ts`
- `__tests__/unit/components/ErrorBoundary.test.tsx`

### Modified Files:
- `src/app/api/convert/route.ts`
- `src/app/api/parse/route.ts`
- `src/lib/converter/index.ts`
- `src/lib/converter/csv.ts`
- `src/lib/converter/json.ts`
- `src/lib/converter/xml.ts`
- `src/lib/converter/excel.ts`
- `src/components/converter/ConvertOptions.tsx`
- `src/app/[locale]/layout.tsx` (wrap with ErrorBoundary)
- `package.json` (add @hookform/resolvers if needed)

---

## Prompt for Claude Code

```
Execute Phase 2: Input Validation & Error Handling for CSV-Excel-Converter

Read the plan at plans/02-phase-validation.md and implement:

1. Create Zod validation schemas:
   - Create src/lib/validation/schemas.ts with all schemas
   - Export type inference from schemas
   - Add validation for all input formats and options

2. Update API routes with validation:
   - Add Zod validation to /api/convert
   - Add Zod validation to /api/parse
   - Create consistent error response format with request IDs
   - Return proper HTTP status codes

3. Create error handling infrastructure:
   - Create src/lib/errors.ts with custom error classes
   - Create src/lib/type-guards.ts with runtime type checks
   - Create src/lib/timeout.ts with timeout wrapper

4. Add ErrorBoundary component:
   - Create src/components/ErrorBoundary.tsx
   - Wrap main layout with ErrorBoundary
   - Add error recovery UI

5. Update converter library:
   - Add try-catch to all parsers
   - Use custom error classes
   - Add timeout to parsing and conversion

6. Add form validation:
   - Update ConvertOptions with form validation
   - Add real-time validation feedback
   - Add aria-invalid for accessibility

7. Create tests:
   - __tests__/unit/lib/validation.test.ts
   - __tests__/unit/lib/errors.test.ts
   - __tests__/unit/components/ErrorBoundary.test.tsx

8. Update translation files with error messages

Run all tests after implementation.
```
