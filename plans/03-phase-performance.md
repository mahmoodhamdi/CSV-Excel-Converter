# Phase 3: Performance Optimization

## Priority: HIGH
## Estimated Effort: High
## Dependencies: Phase 1, Phase 2

---

## Overview

This phase addresses performance issues including memory management, large file handling, rendering optimization, and overall application responsiveness.

---

## Checklist

### 3.1 Implement Streaming for Large Files
- [ ] Add streaming CSV parser for files > 10MB
- [ ] Implement chunked processing
- [ ] Add progress indicators for large files
- [ ] Limit memory usage to 512MB

### 3.2 Add Virtual Scrolling for Data Preview
- [ ] Install @tanstack/react-virtual
- [ ] Implement virtualized table rows
- [ ] Optimize column rendering
- [ ] Add lazy loading for off-screen data

### 3.3 Optimize State Updates
- [ ] Add useMemo for expensive calculations
- [ ] Add useCallback for event handlers
- [ ] Implement selective re-rendering
- [ ] Add React.memo to pure components

### 3.4 Implement Web Workers
- [ ] Create worker for CSV parsing
- [ ] Create worker for JSON processing
- [ ] Add worker communication protocol
- [ ] Handle worker errors gracefully

### 3.5 Add Caching
- [ ] Implement conversion result caching
- [ ] Add parsed data caching
- [ ] Use localStorage for small results
- [ ] Add cache invalidation strategy

### 3.6 Optimize Bundle Size
- [ ] Analyze bundle with webpack-bundle-analyzer
- [ ] Implement dynamic imports for large libraries
- [ ] Remove unused exports
- [ ] Add tree-shaking optimizations

### 3.7 Add Loading States
- [ ] Add skeleton loaders
- [ ] Implement progressive loading
- [ ] Add cancellation for long operations
- [ ] Show progress percentage

### 3.8 Database/Memory Optimizations
- [ ] Implement row pagination
- [ ] Add column virtualization for wide datasets
- [ ] Optimize Excel column width calculation
- [ ] Use typed arrays where possible

---

## Detailed Implementation

### 3.1 Streaming CSV Parser

```typescript
// src/lib/converter/csv-stream.ts
import Papa from 'papaparse';
import type { ParsedData } from '@/types';

interface StreamParseOptions {
  onProgress?: (progress: number) => void;
  onChunk?: (rows: Record<string, unknown>[]) => void;
  chunkSize?: number;
  maxRows?: number;
}

export async function parseCSVStream(
  file: File,
  options: StreamParseOptions = {}
): Promise<ParsedData> {
  const { onProgress, onChunk, chunkSize = 1000, maxRows = 100000 } = options;

  return new Promise((resolve, reject) => {
    const headers: string[] = [];
    const rows: Record<string, unknown>[] = [];
    let totalBytes = 0;
    let rowCount = 0;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      chunkSize: chunkSize * 100, // bytes per chunk
      chunk: (results, parser) => {
        if (headers.length === 0 && results.meta.fields) {
          headers.push(...results.meta.fields);
        }

        const chunkRows = results.data as Record<string, unknown>[];

        if (rowCount + chunkRows.length > maxRows) {
          const remaining = maxRows - rowCount;
          rows.push(...chunkRows.slice(0, remaining));
          parser.abort();
          return;
        }

        rows.push(...chunkRows);
        rowCount += chunkRows.length;

        if (onChunk) {
          onChunk(chunkRows);
        }

        if (onProgress) {
          totalBytes += results.meta.cursor - totalBytes;
          onProgress(Math.min(100, (totalBytes / file.size) * 100));
        }
      },
      complete: () => {
        resolve({
          headers,
          rows,
          format: 'csv',
          metadata: {
            rowCount: rows.length,
            columnCount: headers.length,
            fileName: file.name,
            fileSize: file.size,
          },
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

// Check if file needs streaming
export function needsStreaming(file: File): boolean {
  const STREAMING_THRESHOLD = 10 * 1024 * 1024; // 10MB
  return file.size > STREAMING_THRESHOLD;
}
```

### 3.2 Virtual Table Implementation

```typescript
// src/components/converter/VirtualDataPreview.tsx
'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo, useCallback } from 'react';
import type { ParsedData } from '@/types';

interface VirtualDataPreviewProps {
  data: ParsedData;
  maxHeight?: number;
}

export function VirtualDataPreview({ data, maxHeight = 500 }: VirtualDataPreviewProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const { headers, rows } = data;

  // Memoize row data
  const rowData = useMemo(() => rows, [rows]);

  const rowVirtualizer = useVirtualizer({
    count: rowData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // estimated row height
    overscan: 10, // render extra rows for smooth scrolling
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: headers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150, // estimated column width
    overscan: 3,
  });

  // Memoized cell renderer
  const renderCell = useCallback((row: Record<string, unknown>, header: string) => {
    const value = row[header];
    return String(value ?? '');
  }, []);

  return (
    <div
      ref={parentRef}
      className="overflow-auto border rounded"
      style={{ maxHeight }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: `${columnVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {/* Header row */}
        <div
          className="sticky top-0 z-10 bg-muted flex"
          style={{ width: `${columnVirtualizer.getTotalSize()}px` }}
        >
          {columnVirtualizer.getVirtualItems().map((virtualColumn) => (
            <div
              key={virtualColumn.key}
              className="border-r border-b px-3 py-2 font-medium truncate"
              style={{
                position: 'absolute',
                left: virtualColumn.start,
                width: virtualColumn.size,
              }}
            >
              {headers[virtualColumn.index]}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            className="flex absolute"
            style={{
              top: virtualRow.start + 40, // offset for header
              height: virtualRow.size,
            }}
          >
            {columnVirtualizer.getVirtualItems().map((virtualColumn) => (
              <div
                key={virtualColumn.key}
                className="border-r border-b px-3 py-2 truncate"
                style={{
                  position: 'absolute',
                  left: virtualColumn.start,
                  width: virtualColumn.size,
                }}
              >
                {renderCell(rowData[virtualRow.index], headers[virtualColumn.index])}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3.3 Optimized State Updates

```typescript
// src/components/converter/DataPreview.tsx - Optimized
'use client';

import { useMemo, useCallback, memo } from 'react';
import { useConverterStore } from '@/stores/converter-store';

// Memoized row component
const TableRow = memo(function TableRow({
  row,
  headers,
  rowIndex,
}: {
  row: Record<string, unknown>;
  headers: string[];
  rowIndex: number;
}) {
  return (
    <tr className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
      {headers.map((header) => (
        <td key={header} className="px-3 py-2 truncate max-w-xs">
          {String(row[header] ?? '')}
        </td>
      ))}
    </tr>
  );
});

export function DataPreview() {
  const parsedData = useConverterStore((state) => state.parsedData);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Memoize sorted rows
  const sortedRows = useMemo(() => {
    if (!parsedData?.rows) return [];
    if (!sortColumn) return parsedData.rows;

    return [...parsedData.rows].sort((a, b) => {
      const aVal = String(a[sortColumn] ?? '');
      const bVal = String(b[sortColumn] ?? '');
      const comparison = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [parsedData?.rows, sortColumn, sortDirection]);

  // Memoize handlers
  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  if (!parsedData) return null;

  return (
    <div className="overflow-auto max-h-96">
      <table className="w-full">
        <thead className="sticky top-0 bg-muted">
          <tr>
            {parsedData.headers.map((header) => (
              <th
                key={header}
                onClick={() => handleSort(header)}
                className="px-3 py-2 text-left cursor-pointer hover:bg-muted/80"
              >
                {header}
                {sortColumn === header && (
                  <span>{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.slice(0, 100).map((row, index) => (
            <TableRow
              key={index}
              row={row}
              headers={parsedData.headers}
              rowIndex={index}
            />
          ))}
        </tbody>
      </table>
      {sortedRows.length > 100 && (
        <p className="text-center py-2 text-muted-foreground">
          Showing 100 of {sortedRows.length} rows
        </p>
      )}
    </div>
  );
}
```

### 3.4 Web Worker Implementation

```typescript
// src/workers/csv-worker.ts
import Papa from 'papaparse';

interface WorkerMessage {
  type: 'parse' | 'cancel';
  data?: string;
  options?: Record<string, unknown>;
}

interface WorkerResponse {
  type: 'progress' | 'complete' | 'error';
  progress?: number;
  result?: {
    headers: string[];
    rows: Record<string, unknown>[];
  };
  error?: string;
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, data, options } = event.data;

  if (type === 'parse' && data) {
    try {
      const result = Papa.parse(data, {
        header: true,
        skipEmptyLines: true,
        ...options,
      });

      const response: WorkerResponse = {
        type: 'complete',
        result: {
          headers: result.meta.fields || [],
          rows: result.data as Record<string, unknown>[],
        },
      };

      self.postMessage(response);
    } catch (error) {
      const response: WorkerResponse = {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      self.postMessage(response);
    }
  }
};

// src/lib/converter/csv-worker-wrapper.ts
import type { ParsedData } from '@/types';

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/csv-worker.ts', import.meta.url));
  }
  return worker;
}

export function parseCSVWithWorker(data: string): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const w = getWorker();

    const handleMessage = (event: MessageEvent) => {
      const response = event.data;

      if (response.type === 'complete') {
        w.removeEventListener('message', handleMessage);
        resolve({
          headers: response.result.headers,
          rows: response.result.rows,
          format: 'csv',
          metadata: {
            rowCount: response.result.rows.length,
            columnCount: response.result.headers.length,
          },
        });
      } else if (response.type === 'error') {
        w.removeEventListener('message', handleMessage);
        reject(new Error(response.error));
      }
    };

    w.addEventListener('message', handleMessage);
    w.postMessage({ type: 'parse', data });
  });
}

export function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
```

### 3.5 Caching Implementation

```typescript
// src/lib/cache.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  size: number;
}

interface CacheOptions {
  maxSize?: number; // bytes
  maxAge?: number; // milliseconds
}

class ConversionCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize: number;
  private maxAge: number;
  private currentSize = 0;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize ?? 50 * 1024 * 1024; // 50MB default
    this.maxAge = options.maxAge ?? 5 * 60 * 1000; // 5 minutes default
  }

  private generateKey(input: string, options: Record<string, unknown>): string {
    const optionsStr = JSON.stringify(options);
    // Simple hash function
    const hash = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return hash.toString(36);
    };
    return `${hash(input)}_${hash(optionsStr)}`;
  }

  get<T>(input: string, options: Record<string, unknown>): T | null {
    const key = this.generateKey(input, options);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      return null;
    }

    return entry.data;
  }

  set<T>(input: string, options: Record<string, unknown>, data: T): void {
    const key = this.generateKey(input, options);
    const size = JSON.stringify(data).length;

    // Evict old entries if needed
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        const entry = this.cache.get(oldestKey);
        if (entry) {
          this.currentSize -= entry.size;
        }
        this.cache.delete(oldestKey);
      }
    }

    // Don't cache if single entry is too large
    if (size > this.maxSize) return;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size,
    });
    this.currentSize += size;
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }
}

export const conversionCache = new ConversionCache();
```

### 3.6 Dynamic Imports

```typescript
// src/lib/converter/excel.ts - Updated with dynamic import
import type { ParsedData, ExcelOptions } from '@/types';

// Lazy load xlsx library
let xlsxModule: typeof import('xlsx') | null = null;

async function getXlsx() {
  if (!xlsxModule) {
    xlsxModule = await import('xlsx');
  }
  return xlsxModule;
}

export async function parseExcel(data: ArrayBuffer): Promise<ParsedData> {
  const XLSX = await getXlsx();
  const workbook = XLSX.read(data, { type: 'array' });
  // ... rest of implementation
}

export async function writeExcel(
  headers: string[],
  rows: Record<string, unknown>[],
  options: ExcelOptions = {}
): Promise<XLSX.WorkBook> {
  const XLSX = await getXlsx();
  // ... rest of implementation
}
```

### 3.7 Loading States

```typescript
// src/components/ui/skeleton-table.tsx
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="animate-pulse">
      <div className="flex gap-2 mb-2">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-8 bg-muted rounded flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-2 mb-2">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="h-6 bg-muted/50 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// src/components/converter/ProgressIndicator.tsx
export function ProgressIndicator({
  progress,
  label,
  onCancel,
}: {
  progress: number;
  label: string;
  onCancel?: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      {onCancel && (
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </div>
  );
}
```

### 3.8 Optimized Excel Column Width

```typescript
// src/lib/converter/excel.ts - Optimized column width calculation
function calculateColumnWidths(
  headers: string[],
  rows: Record<string, unknown>[],
  maxWidth = 50,
  sampleSize = 100
): { wch: number }[] {
  // Only sample first N rows for performance
  const sampleRows = rows.slice(0, sampleSize);

  return headers.map((header) => {
    let maxLen = header.length;

    for (const row of sampleRows) {
      const value = row[header];
      const len = String(value ?? '').length;
      if (len > maxLen) {
        maxLen = len;
        if (maxLen >= maxWidth) break; // Early exit if max reached
      }
    }

    return { wch: Math.min(maxLen + 2, maxWidth) };
  });
}
```

---

## Testing Requirements

```typescript
// __tests__/performance/large-file.test.ts
import { parseCSVStream, needsStreaming } from '@/lib/converter/csv-stream';

describe('Large File Performance', () => {
  it('should stream files larger than 10MB', () => {
    const largeFile = new File(['a'.repeat(15 * 1024 * 1024)], 'large.csv');
    expect(needsStreaming(largeFile)).toBe(true);
  });

  it('should not crash with 100k rows', async () => {
    const rows = Array.from({ length: 100000 }, (_, i) => `row${i},value${i}`);
    const csv = `header1,header2\n${rows.join('\n')}`;
    const file = new File([csv], 'large.csv');

    const result = await parseCSVStream(file);
    expect(result.rows.length).toBeLessThanOrEqual(100000);
  }, 60000);

  it('should report progress during streaming', async () => {
    const progressValues: number[] = [];
    const csv = Array.from({ length: 10000 }, (_, i) => `row${i},value${i}`).join('\n');
    const file = new File([`h1,h2\n${csv}`], 'test.csv');

    await parseCSVStream(file, {
      onProgress: (p) => progressValues.push(p),
    });

    expect(progressValues.length).toBeGreaterThan(0);
    expect(progressValues[progressValues.length - 1]).toBe(100);
  });
});

// __tests__/performance/render.test.tsx
import { render } from '@testing-library/react';
import { VirtualDataPreview } from '@/components/converter/VirtualDataPreview';

describe('Virtual Table Performance', () => {
  it('should render 10k rows without timeout', () => {
    const data = {
      headers: ['col1', 'col2', 'col3'],
      rows: Array.from({ length: 10000 }, (_, i) => ({
        col1: `value${i}`,
        col2: i,
        col3: `data${i}`,
      })),
    };

    const start = performance.now();
    render(<VirtualDataPreview data={data} />);
    const end = performance.now();

    expect(end - start).toBeLessThan(1000); // Should render in < 1 second
  });
});
```

---

## Files to Create/Modify

### New Files:
- `src/lib/converter/csv-stream.ts`
- `src/lib/cache.ts`
- `src/workers/csv-worker.ts`
- `src/lib/converter/csv-worker-wrapper.ts`
- `src/components/converter/VirtualDataPreview.tsx`
- `src/components/ui/skeleton-table.tsx`
- `src/components/converter/ProgressIndicator.tsx`
- `__tests__/performance/large-file.test.ts`
- `__tests__/performance/render.test.tsx`

### Modified Files:
- `src/lib/converter/csv.ts`
- `src/lib/converter/excel.ts`
- `src/lib/converter/index.ts`
- `src/components/converter/DataPreview.tsx`
- `src/components/converter/FileUpload.tsx`
- `package.json` (add @tanstack/react-virtual)
- `next.config.mjs` (add worker support)

---

## Prompt for Claude Code

```
Execute Phase 3: Performance Optimization for CSV-Excel-Converter

Read the plan at plans/03-phase-performance.md and implement:

1. Streaming CSV parser:
   - Create src/lib/converter/csv-stream.ts
   - Implement chunked processing with PapaParse
   - Add progress callbacks
   - Add row limits

2. Virtual table for large datasets:
   - Install @tanstack/react-virtual
   - Create src/components/converter/VirtualDataPreview.tsx
   - Implement row and column virtualization
   - Add smooth scrolling

3. Optimize existing components:
   - Add useMemo and useCallback to DataPreview
   - Create memoized TableRow component
   - Optimize sorting with useMemo

4. Web Worker for parsing:
   - Create src/workers/csv-worker.ts
   - Create wrapper in src/lib/converter/csv-worker-wrapper.ts
   - Configure next.config.mjs for workers

5. Caching system:
   - Create src/lib/cache.ts
   - Implement LRU-like cache with size limits
   - Add TTL for cache entries

6. Dynamic imports:
   - Update excel.ts to lazy load xlsx library
   - Reduce initial bundle size

7. Loading states:
   - Create SkeletonTable component
   - Create ProgressIndicator component
   - Add loading states to FileUpload

8. Performance tests:
   - Create __tests__/performance/ directory
   - Add large file tests
   - Add render performance tests

Run performance tests after implementation.
```
