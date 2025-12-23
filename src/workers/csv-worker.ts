/**
 * Web Worker for CSV parsing
 * Offloads heavy parsing operations to a separate thread
 */

import Papa from 'papaparse';

/**
 * Message types sent to the worker
 */
interface WorkerMessage {
  type: 'parse' | 'cancel';
  id: string;
  data?: string;
  options?: {
    delimiter?: string;
    hasHeader?: boolean;
    skipEmptyLines?: boolean;
    maxRows?: number;
  };
}

/**
 * Response types sent from the worker
 */
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

// Track active parsing operations
const activeOperations = new Map<string, boolean>();

/**
 * Post a response to the main thread
 */
function postResponse(response: WorkerResponse): void {
  self.postMessage(response);
}

/**
 * Parse CSV data
 */
function parseCSV(id: string, data: string, options: WorkerMessage['options'] = {}): void {
  const {
    delimiter,
    hasHeader = true,
    skipEmptyLines = true,
    maxRows = 100000,
  } = options;

  activeOperations.set(id, true);

  try {
    // Report starting
    postResponse({ type: 'progress', id, progress: 10 });

    const result = Papa.parse(data, {
      delimiter,
      header: hasHeader,
      skipEmptyLines,
    });

    // Check if cancelled
    if (!activeOperations.get(id)) {
      return;
    }

    postResponse({ type: 'progress', id, progress: 50 });

    const headers = hasHeader
      ? result.meta.fields || []
      : result.data.length > 0
      ? Object.keys(result.data[0] as Record<string, unknown>)
      : [];

    let rows = result.data as Record<string, unknown>[];
    let truncated = false;

    // Limit rows if needed
    if (rows.length > maxRows) {
      rows = rows.slice(0, maxRows);
      truncated = true;
    }

    // Check if cancelled
    if (!activeOperations.get(id)) {
      return;
    }

    postResponse({ type: 'progress', id, progress: 90 });

    // Send complete response
    postResponse({
      type: 'complete',
      id,
      result: {
        headers,
        rows,
        rowCount: rows.length,
        columnCount: headers.length,
        truncated,
      },
    });
  } catch (error) {
    postResponse({
      type: 'error',
      id,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
    });
  } finally {
    activeOperations.delete(id);
  }
}

/**
 * Handle messages from main thread
 */
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, id, data, options } = event.data;

  switch (type) {
    case 'parse':
      if (data) {
        parseCSV(id, data, options);
      } else {
        postResponse({
          type: 'error',
          id,
          error: 'No data provided for parsing',
        });
      }
      break;

    case 'cancel':
      activeOperations.set(id, false);
      break;

    default:
      postResponse({
        type: 'error',
        id,
        error: `Unknown message type: ${type}`,
      });
  }
};

// Export types for use in wrapper
export type { WorkerMessage, WorkerResponse };
