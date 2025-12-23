import Papa from 'papaparse';
import type { ParsedData } from '@/types';
import { ParseError, ErrorCodes } from '@/lib/errors';

/**
 * Options for streaming CSV parsing
 */
export interface StreamParseOptions {
  /** Callback for progress updates (0-100) */
  onProgress?: (progress: number) => void;
  /** Callback for each chunk of rows */
  onChunk?: (rows: Record<string, unknown>[]) => void;
  /** Number of rows per chunk (default: 1000) */
  chunkSize?: number;
  /** Maximum number of rows to parse (default: 100000) */
  maxRows?: number;
  /** Custom delimiter */
  delimiter?: string;
  /** Whether to skip empty lines */
  skipEmptyLines?: boolean;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
}

/**
 * Streaming threshold in bytes (10MB)
 */
export const STREAMING_THRESHOLD = 10 * 1024 * 1024;

/**
 * Check if a file needs streaming based on its size
 */
export function needsStreaming(file: File): boolean {
  return file.size > STREAMING_THRESHOLD;
}

/**
 * Parse a CSV file using streaming for large files
 */
export async function parseCSVStream(
  file: File,
  options: StreamParseOptions = {}
): Promise<ParsedData> {
  const {
    onProgress,
    onChunk,
    chunkSize = 1000,
    maxRows = 100000,
    delimiter,
    skipEmptyLines = true,
    signal,
  } = options;

  return new Promise((resolve, reject) => {
    const headers: string[] = [];
    const rows: Record<string, unknown>[] = [];
    let rowCount = 0;
    let lastCursor = 0;
    let aborted = false;

    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        aborted = true;
      });
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines,
      delimiter,
      chunkSize: chunkSize * 100, // PapaParse uses bytes
      chunk: (results, parser) => {
        // Check for abort
        if (aborted) {
          parser.abort();
          reject(new ParseError('Parsing cancelled', ErrorCodes.TIMEOUT));
          return;
        }

        // Extract headers from first chunk
        if (headers.length === 0 && results.meta.fields) {
          headers.push(...results.meta.fields);
        }

        const chunkRows = results.data as Record<string, unknown>[];

        // Check if we've reached max rows
        if (rowCount + chunkRows.length > maxRows) {
          const remaining = maxRows - rowCount;
          rows.push(...chunkRows.slice(0, remaining));
          rowCount = maxRows;
          parser.abort();
          return;
        }

        rows.push(...chunkRows);
        rowCount += chunkRows.length;

        // Call chunk callback
        if (onChunk) {
          onChunk(chunkRows);
        }

        // Calculate and report progress
        if (onProgress) {
          const cursor = results.meta.cursor;
          if (cursor > lastCursor) {
            lastCursor = cursor;
            const progress = Math.min(100, (cursor / file.size) * 100);
            onProgress(progress);
          }
        }
      },
      complete: () => {
        if (aborted) return;

        // Report 100% progress
        if (onProgress) {
          onProgress(100);
        }

        resolve({
          headers,
          rows,
          format: 'csv',
          metadata: {
            rowCount: rows.length,
            columnCount: headers.length,
            fileName: file.name,
            fileSize: file.size,
            truncated: rowCount >= maxRows,
          },
        });
      },
      error: (error) => {
        reject(
          new ParseError(
            `CSV streaming failed: ${error.message}`,
            ErrorCodes.INVALID_CSV,
            undefined,
            'csv'
          )
        );
      },
    });
  });
}

/**
 * Parse CSV string with streaming-like chunked processing
 */
export async function parseCSVStringChunked(
  data: string,
  options: StreamParseOptions = {}
): Promise<ParsedData> {
  const { onProgress, maxRows = 100000 } = options;

  return new Promise((resolve, reject) => {
    try {
      // Report start
      if (onProgress) {
        onProgress(10);
      }

      const result = Papa.parse(data, {
        header: true,
        skipEmptyLines: options.skipEmptyLines ?? true,
        delimiter: options.delimiter,
      });

      if (onProgress) {
        onProgress(50);
      }

      const headers = result.meta.fields || [];
      let rows = result.data as Record<string, unknown>[];

      // Limit rows
      const truncated = rows.length > maxRows;
      if (truncated) {
        rows = rows.slice(0, maxRows);
      }

      if (onProgress) {
        onProgress(100);
      }

      resolve({
        headers,
        rows,
        format: 'csv',
        metadata: {
          rowCount: rows.length,
          columnCount: headers.length,
          truncated,
        },
      });
    } catch (error) {
      reject(
        new ParseError(
          error instanceof Error ? error.message : 'CSV parsing failed',
          ErrorCodes.INVALID_CSV,
          undefined,
          'csv'
        )
      );
    }
  });
}

/**
 * Estimate the number of rows in a CSV file without fully parsing it
 */
export function estimateRowCount(file: File, sampleSize = 10000): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const sample = e.target?.result as string;
      const lineBreaks = (sample.match(/\n/g) || []).length;

      if (sample.length >= sampleSize) {
        // Extrapolate based on sample
        const estimatedTotal = Math.round((lineBreaks / sample.length) * file.size);
        resolve(estimatedTotal);
      } else {
        // Full file was read
        resolve(lineBreaks);
      }
    };

    reader.onerror = () => {
      resolve(0);
    };

    // Read only a sample of the file
    const blob = file.slice(0, sampleSize);
    reader.readAsText(blob);
  });
}
