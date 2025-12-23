# Phase 8: Advanced Features

## Priority: LOW
## Estimated Effort: High
## Dependencies: All previous phases

---

## Overview

This phase adds advanced features including batch processing improvements, data transformation, history persistence, and additional format support.

---

## Checklist

### 8.1 Enhanced Batch Processing
- [ ] Add parallel file processing
- [ ] Add progress tracking per file
- [ ] Add error recovery (continue on failure)
- [ ] Add batch result summary
- [ ] Add zip download for results
- [ ] Add drag-and-drop reordering

### 8.2 Data Transformation
- [ ] Add column renaming
- [ ] Add column type conversion
- [ ] Add data filtering with multiple conditions
- [ ] Add data sorting
- [ ] Add duplicate removal with options
- [ ] Add find and replace
- [ ] Add column merging/splitting
- [ ] Add formula support (basic)

### 8.3 History & Persistence
- [ ] Persist conversion history to localStorage
- [ ] Add history pagination
- [ ] Add history search
- [ ] Add history export
- [ ] Add "re-convert" from history
- [ ] Add data preview in history

### 8.4 Additional Formats
- [ ] Add YAML format support
- [ ] Add Markdown table support
- [ ] Add HTML table support
- [ ] Add LaTeX table support
- [ ] Add PDF export (read-only)

### 8.5 Advanced Options
- [ ] Add encoding selection
- [ ] Add date format customization
- [ ] Add number format customization
- [ ] Add null value handling options
- [ ] Add custom delimiter support

### 8.6 UI Enhancements
- [ ] Add column resizing
- [ ] Add column visibility toggle
- [ ] Add cell editing
- [ ] Add undo/redo
- [ ] Add keyboard shortcuts
- [ ] Add command palette

### 8.7 Export Improvements
- [ ] Add copy to clipboard
- [ ] Add share link generation
- [ ] Add email export
- [ ] Add cloud storage integration (optional)

### 8.8 API Enhancements
- [ ] Add batch API endpoint
- [ ] Add webhook notifications
- [ ] Add API key authentication
- [ ] Add rate limiting per key

---

## Detailed Implementation

### 8.1 Enhanced Batch Processing

```typescript
// src/lib/batch/processor.ts
import { parseData, convertData, getOutputFilename } from '@/lib/converter';
import type { ConvertOptions, ConversionResult, ParsedData } from '@/types';

interface BatchFile {
  id: string;
  file: File;
  status: 'pending' | 'parsing' | 'converting' | 'success' | 'failed';
  progress: number;
  parsedData?: ParsedData;
  result?: ConversionResult;
  error?: string;
}

interface BatchOptions extends ConvertOptions {
  continueOnError?: boolean;
  parallelLimit?: number;
}

interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
}

type ProgressCallback = (progress: BatchProgress, files: BatchFile[]) => void;

export async function processBatch(
  files: File[],
  options: BatchOptions,
  onProgress?: ProgressCallback
): Promise<BatchFile[]> {
  const batchFiles: BatchFile[] = files.map((file, index) => ({
    id: `file-${index}`,
    file,
    status: 'pending',
    progress: 0,
  }));

  const { parallelLimit = 3, continueOnError = true } = options;
  const progress: BatchProgress = {
    total: files.length,
    completed: 0,
    failed: 0,
  };

  // Process in parallel with limit
  const chunks = chunkArray(batchFiles, parallelLimit);

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (batchFile) => {
        try {
          progress.current = batchFile.file.name;
          onProgress?.(progress, batchFiles);

          // Parse
          batchFile.status = 'parsing';
          batchFile.progress = 25;
          onProgress?.(progress, batchFiles);

          const data = await readFileContent(batchFile.file);
          batchFile.parsedData = await parseData(data);

          // Convert
          batchFile.status = 'converting';
          batchFile.progress = 75;
          onProgress?.(progress, batchFiles);

          batchFile.result = convertData(batchFile.parsedData, options);

          // Complete
          batchFile.status = 'success';
          batchFile.progress = 100;
          progress.completed++;

        } catch (error) {
          batchFile.status = 'failed';
          batchFile.error = error instanceof Error ? error.message : 'Unknown error';
          progress.failed++;

          if (!continueOnError) {
            throw error;
          }
        }

        onProgress?.(progress, batchFiles);
      })
    );
  }

  return batchFiles;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function readFileContent(file: File): Promise<string | ArrayBuffer> {
  if (file.name.match(/\.(xlsx|xls)$/i)) {
    return file.arrayBuffer();
  }
  return file.text();
}

// Zip download
export async function downloadBatchAsZip(
  files: BatchFile[],
  outputFormat: string
): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const { saveAs } = await import('file-saver');

  const zip = new JSZip();

  for (const file of files) {
    if (file.status === 'success' && file.result?.data) {
      const filename = getOutputFilename(file.file.name, outputFormat as any);

      if (file.result.data instanceof Blob) {
        zip.file(filename, file.result.data);
      } else {
        zip.file(filename, file.result.data);
      }
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `converted-files-${Date.now()}.zip`);
}
```

```typescript
// src/components/converter/BatchProcessor.tsx
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { processBatch, downloadBatchAsZip } from '@/lib/batch/processor';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  FileArchive
} from 'lucide-react';

export function BatchProcessor() {
  const t = useTranslations('batch');
  const [files, setFiles] = useState<File[]>([]);
  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BatchProgress | null>(null);

  const handleProcess = useCallback(async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress({ total: files.length, completed: 0, failed: 0 });

    try {
      const results = await processBatch(
        files,
        {
          outputFormat: 'json',
          parallelLimit: 3,
          continueOnError: true,
        },
        (prog, bFiles) => {
          setProgress(prog);
          setBatchFiles([...bFiles]);
        }
      );

      setBatchFiles(results);
    } finally {
      setIsProcessing(false);
    }
  }, [files]);

  const handleDownloadAll = useCallback(async () => {
    await downloadBatchAsZip(batchFiles, 'json');
  }, [batchFiles]);

  const successCount = batchFiles.filter(f => f.status === 'success').length;

  return (
    <div className="space-y-6">
      {/* File list */}
      <div className="space-y-2">
        {batchFiles.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 border rounded"
          >
            <div className="flex items-center gap-3">
              {file.status === 'success' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {file.status === 'failed' && (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              {(file.status === 'parsing' || file.status === 'converting') && (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
              <span>{file.file.name}</span>
            </div>

            {file.status !== 'pending' && (
              <Progress value={file.progress} className="w-24" />
            )}

            {file.error && (
              <span className="text-sm text-destructive">{file.error}</span>
            )}
          </div>
        ))}
      </div>

      {/* Progress summary */}
      {progress && (
        <div className="text-center">
          <p>
            {t('progress', {
              completed: progress.completed,
              total: progress.total,
              failed: progress.failed,
            })}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={handleProcess} disabled={isProcessing || files.length === 0}>
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('processing')}
            </>
          ) : (
            t('processAll')
          )}
        </Button>

        {successCount > 0 && (
          <Button variant="outline" onClick={handleDownloadAll}>
            <FileArchive className="h-4 w-4 mr-2" />
            {t('downloadZip', { count: successCount })}
          </Button>
        )}
      </div>
    </div>
  );
}
```

### 8.2 Data Transformation

```typescript
// src/lib/transform/index.ts
import type { ParsedData, TransformOptions, FilterRule, ColumnMapping } from '@/types';

export function transformData(
  data: ParsedData,
  options: TransformOptions
): ParsedData {
  let { headers, rows } = data;

  // Apply column selection
  if (options.selectedColumns?.length) {
    headers = options.selectedColumns;
    rows = rows.map((row) => {
      const newRow: Record<string, unknown> = {};
      for (const col of options.selectedColumns!) {
        newRow[col] = row[col];
      }
      return newRow;
    });
  }

  // Apply column mappings (rename)
  if (options.columnMappings?.length) {
    const mappingMap = new Map(
      options.columnMappings.map((m) => [m.original, m])
    );

    headers = headers.map((h) => mappingMap.get(h)?.mapped || h);

    rows = rows.map((row) => {
      const newRow: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        const mapping = mappingMap.get(key);
        const newKey = mapping?.mapped || key;
        newRow[newKey] = convertValue(value, mapping?.type);
      }
      return newRow;
    });
  }

  // Apply filters
  if (options.filters?.length) {
    rows = rows.filter((row) => {
      return options.filters!.every((filter) => applyFilter(row, filter));
    });
  }

  // Remove duplicates
  if (options.removeDuplicates) {
    const seen = new Set<string>();
    rows = rows.filter((row) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Trim whitespace
  if (options.trimWhitespace) {
    rows = rows.map((row) => {
      const newRow: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        newRow[key] = typeof value === 'string' ? value.trim() : value;
      }
      return newRow;
    });
  }

  return {
    ...data,
    headers,
    rows,
    metadata: {
      ...data.metadata,
      rowCount: rows.length,
      columnCount: headers.length,
    },
  };
}

function applyFilter(row: Record<string, unknown>, filter: FilterRule): boolean {
  const value = String(row[filter.column] ?? '');
  const filterValue = filter.value;

  switch (filter.operator) {
    case 'equals':
      return value === filterValue;
    case 'notEquals':
      return value !== filterValue;
    case 'contains':
      return value.includes(filterValue);
    case 'startsWith':
      return value.startsWith(filterValue);
    case 'endsWith':
      return value.endsWith(filterValue);
    case 'greaterThan':
      return parseFloat(value) > parseFloat(filterValue);
    case 'lessThan':
      return parseFloat(value) < parseFloat(filterValue);
    case 'isEmpty':
      return value === '';
    case 'isNotEmpty':
      return value !== '';
    default:
      return true;
  }
}

function convertValue(value: unknown, type?: string): unknown {
  if (value === null || value === undefined) return value;

  switch (type) {
    case 'number':
      return parseFloat(String(value)) || 0;
    case 'boolean':
      return ['true', '1', 'yes'].includes(String(value).toLowerCase());
    case 'date':
      return new Date(String(value)).toISOString();
    case 'string':
    default:
      return String(value);
  }
}

// Find and replace
export function findAndReplace(
  data: ParsedData,
  find: string,
  replace: string,
  options: { caseSensitive?: boolean; wholeWord?: boolean; columns?: string[] } = {}
): ParsedData {
  const { caseSensitive = false, wholeWord = false, columns } = options;

  const regex = new RegExp(
    wholeWord ? `\\b${escapeRegex(find)}\\b` : escapeRegex(find),
    caseSensitive ? 'g' : 'gi'
  );

  const rows = data.rows.map((row) => {
    const newRow: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (columns && !columns.includes(key)) {
        newRow[key] = value;
        continue;
      }
      if (typeof value === 'string') {
        newRow[key] = value.replace(regex, replace);
      } else {
        newRow[key] = value;
      }
    }
    return newRow;
  });

  return { ...data, rows };
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

### 8.3 History Persistence

```typescript
// src/stores/history-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConversionHistoryItem } from '@/types';

interface HistoryState {
  items: ConversionHistoryItem[];
  addItem: (item: Omit<ConversionHistoryItem, 'id' | 'timestamp'>) => void;
  removeItem: (id: string) => void;
  clearHistory: () => void;
  getItem: (id: string) => ConversionHistoryItem | undefined;
}

const MAX_HISTORY_ITEMS = 50;

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const newItem: ConversionHistoryItem = {
          ...item,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };

        set((state) => ({
          items: [newItem, ...state.items].slice(0, MAX_HISTORY_ITEMS),
        }));
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      clearHistory: () => {
        set({ items: [] });
      },

      getItem: (id) => {
        return get().items.find((item) => item.id === id);
      },
    }),
    {
      name: 'conversion-history',
      version: 1,
    }
  )
);

// src/components/history/HistoryList.tsx
'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useHistoryStore } from '@/stores/history-store';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, RotateCcw, Download, Search } from 'lucide-react';

export function HistoryList() {
  const t = useTranslations('history');
  const { items, removeItem, clearHistory } = useHistoryStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter(
      (item) =>
        item.inputFileName?.toLowerCase().includes(lower) ||
        item.outputFileName?.toLowerCase().includes(lower) ||
        item.inputFormat.includes(lower) ||
        item.outputFormat.includes(lower)
    );
  }, [items, search]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, page]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="destructive" onClick={clearHistory}>
          <Trash2 className="h-4 w-4 mr-2" />
          {t('clearAll')}
        </Button>
      </div>

      {/* History items */}
      <div className="space-y-2">
        {paginatedItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 border rounded"
          >
            <div>
              <p className="font-medium">
                {item.inputFileName || t('untitled')}
              </p>
              <p className="text-sm text-muted-foreground">
                {item.inputFormat.toUpperCase()} → {item.outputFormat.toUpperCase()}
                {' · '}
                {item.rowCount} rows
                {' · '}
                {formatDistanceToNow(item.timestamp, { addSuffix: true })}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleReconvert(item)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              {item.data && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(item)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t('previous')}
          </Button>
          <span className="flex items-center px-4">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('next')}
          </Button>
        </div>
      )}
    </div>
  );
}
```

### 8.4 YAML Format Support

```typescript
// src/lib/converter/yaml.ts
import YAML from 'yaml';
import type { ParsedData } from '@/types';

export function parseYaml(data: string): ParsedData {
  const parsed = YAML.parse(data);

  if (!Array.isArray(parsed)) {
    throw new Error('YAML must be an array of objects');
  }

  if (parsed.length === 0) {
    return { headers: [], rows: [], format: 'yaml' as any };
  }

  const headers = [...new Set(parsed.flatMap((item) => Object.keys(item)))];
  const rows = parsed.map((item) => {
    const row: Record<string, unknown> = {};
    for (const header of headers) {
      row[header] = item[header];
    }
    return row;
  });

  return {
    headers,
    rows,
    format: 'yaml' as any,
    metadata: {
      rowCount: rows.length,
      columnCount: headers.length,
    },
  };
}

export function writeYaml(
  headers: string[],
  rows: Record<string, unknown>[]
): string {
  const data = rows.map((row) => {
    const obj: Record<string, unknown> = {};
    for (const header of headers) {
      obj[header] = row[header];
    }
    return obj;
  });

  return YAML.stringify(data);
}
```

### 8.5 Keyboard Shortcuts

```typescript
// src/hooks/use-keyboard-shortcuts.ts
import { useEffect, useCallback } from 'react';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Usage example
export function useConverterShortcuts() {
  const { reset, setOutputFormat } = useConverterStore();
  const router = useRouter();

  const shortcuts: Shortcut[] = [
    {
      key: 'o',
      ctrl: true,
      action: () => document.getElementById('file-input')?.click(),
      description: 'Open file',
    },
    {
      key: 's',
      ctrl: true,
      action: () => document.getElementById('download-btn')?.click(),
      description: 'Save/Download',
    },
    {
      key: 'Enter',
      ctrl: true,
      action: () => document.getElementById('convert-btn')?.click(),
      description: 'Convert',
    },
    {
      key: 'Escape',
      action: () => reset(),
      description: 'Reset',
    },
    {
      key: '1',
      alt: true,
      action: () => setOutputFormat('json'),
      description: 'Output: JSON',
    },
    {
      key: '2',
      alt: true,
      action: () => setOutputFormat('csv'),
      description: 'Output: CSV',
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}
```

### 8.6 Command Palette

```typescript
// src/components/CommandPalette.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useConverterStore } from '@/stores/converter-store';
import {
  FileUp,
  Download,
  Trash2,
  Moon,
  Sun,
  Globe,
  Settings,
} from 'lucide-react';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const t = useTranslations('commands');
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { reset, setOutputFormat } = useConverterStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands: Command[] = useMemo(
    () => [
      {
        id: 'open-file',
        label: t('openFile'),
        icon: <FileUp className="h-4 w-4" />,
        action: () => document.getElementById('file-input')?.click(),
        keywords: ['upload', 'import'],
      },
      {
        id: 'download',
        label: t('download'),
        icon: <Download className="h-4 w-4" />,
        action: () => document.getElementById('download-btn')?.click(),
        keywords: ['save', 'export'],
      },
      {
        id: 'reset',
        label: t('reset'),
        icon: <Trash2 className="h-4 w-4" />,
        action: reset,
        keywords: ['clear', 'new'],
      },
      {
        id: 'batch',
        label: t('batchConvert'),
        icon: <FileUp className="h-4 w-4" />,
        action: () => router.push('/batch'),
        keywords: ['multiple', 'files'],
      },
      {
        id: 'transform',
        label: t('transformData'),
        icon: <Settings className="h-4 w-4" />,
        action: () => router.push('/transform'),
        keywords: ['filter', 'edit'],
      },
    ],
    [t, reset, router]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t('searchPlaceholder')} />
      <CommandList>
        <CommandEmpty>{t('noResults')}</CommandEmpty>
        <CommandGroup heading={t('actions')}>
          {commands.map((command) => (
            <CommandItem
              key={command.id}
              onSelect={() => {
                command.action();
                setOpen(false);
              }}
              keywords={command.keywords}
            >
              {command.icon}
              <span className="ml-2">{command.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

---

## New Dependencies

```json
{
  "dependencies": {
    "yaml": "^2.3.4",
    "jszip": "^3.10.1",
    "date-fns": "^3.0.0",
    "cmdk": "^0.2.0"
  }
}
```

---

## Files to Create

### New Files:
- `src/lib/batch/processor.ts`
- `src/lib/transform/index.ts`
- `src/lib/converter/yaml.ts`
- `src/stores/history-store.ts`
- `src/components/converter/BatchProcessor.tsx`
- `src/components/history/HistoryList.tsx`
- `src/components/CommandPalette.tsx`
- `src/hooks/use-keyboard-shortcuts.ts`

### Modified Files:
- `src/lib/converter/index.ts` - Add YAML support
- `src/lib/converter/detect.ts` - Detect YAML format
- `src/types/index.ts` - Add new types
- `src/app/[locale]/batch/page.tsx` - Use BatchProcessor
- `src/app/[locale]/transform/page.tsx` - Use transform functions
- `src/app/[locale]/history/page.tsx` - Use HistoryList
- `src/app/[locale]/layout.tsx` - Add CommandPalette
- `src/messages/en.json` - Add translations
- `src/messages/ar.json` - Add translations

---

## Prompt for Claude Code

```
Execute Phase 8: Advanced Features for CSV-Excel-Converter

Read the plan at plans/08-phase-features.md and implement:

1. Enhanced batch processing:
   - Create src/lib/batch/processor.ts
   - Add parallel processing with limits
   - Add zip download with jszip
   - Create BatchProcessor component

2. Data transformation:
   - Create src/lib/transform/index.ts
   - Add column renaming, filtering, deduplication
   - Add find and replace functionality
   - Update transform page to use new functions

3. History persistence:
   - Create src/stores/history-store.ts with zustand persist
   - Create HistoryList component
   - Add search and pagination
   - Update history page

4. YAML format support:
   - Install yaml package
   - Create src/lib/converter/yaml.ts
   - Add to converter index and detection
   - Update types

5. Keyboard shortcuts:
   - Create src/hooks/use-keyboard-shortcuts.ts
   - Add shortcuts for common actions

6. Command palette:
   - Install cmdk
   - Create CommandPalette component
   - Add to layout

7. Update translations for new features

8. Add tests for new functionality

Run all tests after implementation.
```
