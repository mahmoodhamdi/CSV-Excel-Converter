/**
 * Deduplicate transformation - remove duplicate rows
 */

import type { TransformData, TransformResult, DeduplicateConfig } from './types';

export function deduplicateRows(data: TransformData, config: DeduplicateConfig): TransformResult {
  try {
    // Determine which columns to check
    let columnsToCheck = config.columns;
    if (columnsToCheck.length === 0) {
      // Use all columns
      columnsToCheck = data.headers;
    }

    // Validate columns exist
    const invalidColumns = columnsToCheck.filter((col) => !data.headers.includes(col));
    if (invalidColumns.length > 0) {
      return {
        success: false,
        headers: data.headers,
        rows: data.rows,
        rowsAffected: 0,
        error: `Columns not found: ${invalidColumns.join(', ')}`,
      };
    }

    // Get column indices
    const columnIndices = columnsToCheck.map((col) => data.headers.indexOf(col));

    // Track seen combinations
    const seen = new Map<string, number>(); // key -> row index

    // Process rows
    const rowsToProcess = config.keepFirst
      ? data.rows.map((row, idx) => ({ row, idx }))
      : data.rows.map((row, idx) => ({ row, idx })).reverse();

    rowsToProcess.forEach(({ row, idx }) => {
      const key = columnIndices.map((i) => row[i] ?? '').join('\0');
      seen.set(key, idx);
    });

    // Collect unique row indices
    const uniqueIndices = new Set(seen.values());

    // Filter rows maintaining original order
    const uniqueRows = data.rows.filter((_, idx) => uniqueIndices.has(idx));

    const removedCount = data.rows.length - uniqueRows.length;

    return {
      success: true,
      headers: data.headers,
      rows: uniqueRows,
      rowsAffected: removedCount,
    };
  } catch (error) {
    return {
      success: false,
      headers: data.headers,
      rows: data.rows,
      rowsAffected: 0,
      error: error instanceof Error ? error.message : 'Deduplicate operation failed',
    };
  }
}
