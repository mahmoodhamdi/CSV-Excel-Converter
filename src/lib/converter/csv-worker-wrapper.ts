/**
 * Wrapper for CSV Web Worker
 * Provides a Promise-based API for worker communication
 */

import type { ParsedData } from '@/types';

interface WorkerResponse {
  type: 'progress' | 'complete' | 'error';
  id: string;
  progress?: number;
  result?: {
    headers: string[];
    rows: Record<string, unknown>[];
    rowCount: number;
    columnCount: number;
    truncated?: boolean;
  };
  error?: string;
}

interface ParseOptions {
  delimiter?: string;
  hasHeader?: boolean;
  skipEmptyLines?: boolean;
  maxRows?: number;
  onProgress?: (progress: number) => void;
}

// Worker instance (lazy initialized)
let worker: Worker | null = null;

// Track pending operations
const pendingOperations = new Map<
  string,
  {
    resolve: (data: ParsedData) => void;
    reject: (error: Error) => void;
    onProgress?: (progress: number) => void;
  }
>();

/**
 * Generate unique operation ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Get or create worker instance
 */
function getWorker(): Worker {
  if (!worker) {
    // Create worker with dynamic import
    worker = new Worker(new URL('../workers/csv-worker.ts', import.meta.url));

    // Set up message handler
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, id, progress, result, error } = event.data;
      const pending = pendingOperations.get(id);

      if (!pending) {
        return;
      }

      switch (type) {
        case 'progress':
          if (pending.onProgress && progress !== undefined) {
            pending.onProgress(progress);
          }
          break;

        case 'complete':
          if (result) {
            pendingOperations.delete(id);
            pending.resolve({
              headers: result.headers,
              rows: result.rows,
              format: 'csv',
              metadata: {
                rowCount: result.rowCount,
                columnCount: result.columnCount,
                truncated: result.truncated,
              },
            });
          }
          break;

        case 'error':
          pendingOperations.delete(id);
          pending.reject(new Error(error || 'Worker error'));
          break;
      }
    };

    // Handle worker errors
    worker.onerror = (event) => {
      // Reject all pending operations
      for (const [id, pending] of pendingOperations.entries()) {
        pending.reject(new Error(`Worker error: ${event.message}`));
        pendingOperations.delete(id);
      }

      // Reset worker
      worker?.terminate();
      worker = null;
    };
  }

  return worker;
}

/**
 * Parse CSV data using Web Worker
 */
export function parseCSVWithWorker(
  data: string,
  options: ParseOptions = {}
): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const id = generateId();
    const w = getWorker();

    // Store pending operation
    pendingOperations.set(id, {
      resolve,
      reject,
      onProgress: options.onProgress,
    });

    // Send parse message
    w.postMessage({
      type: 'parse',
      id,
      data,
      options: {
        delimiter: options.delimiter,
        hasHeader: options.hasHeader,
        skipEmptyLines: options.skipEmptyLines,
        maxRows: options.maxRows,
      },
    });
  });
}

/**
 * Cancel a pending parse operation
 */
export function cancelParse(id: string): void {
  if (worker) {
    worker.postMessage({ type: 'cancel', id });
  }
  pendingOperations.delete(id);
}

/**
 * Terminate the worker and clean up
 */
export function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }

  // Reject all pending operations
  for (const [id, pending] of pendingOperations.entries()) {
    pending.reject(new Error('Worker terminated'));
    pendingOperations.delete(id);
  }
}

/**
 * Check if Web Workers are supported
 */
export function isWorkerSupported(): boolean {
  return typeof Worker !== 'undefined';
}

/**
 * Check if worker is currently active
 */
export function isWorkerActive(): boolean {
  return worker !== null;
}

/**
 * Get number of pending operations
 */
export function getPendingCount(): number {
  return pendingOperations.size;
}
