/**
 * Select transformation - select specific columns
 */

import type { TransformData, TransformResult, SelectConfig } from './types';

export function selectColumns(data: TransformData, config: SelectConfig): TransformResult {
  try {
    if (config.columns.length === 0) {
      return {
        success: false,
        headers: data.headers,
        rows: data.rows,
        rowsAffected: 0,
        error: 'No columns selected',
      };
    }

    // Validate all columns exist
    const invalidColumns = config.columns.filter((col) => !data.headers.includes(col));
    if (invalidColumns.length > 0) {
      return {
        success: false,
        headers: data.headers,
        rows: data.rows,
        rowsAffected: 0,
        error: `Columns not found: ${invalidColumns.join(', ')}`,
      };
    }

    // Get column indices in the order specified
    const columnIndices = config.columns.map((col) => data.headers.indexOf(col));

    // Create new headers
    const newHeaders = config.columns;

    // Create new rows with only selected columns
    const newRows = data.rows.map((row) => columnIndices.map((idx) => row[idx] ?? ''));

    return {
      success: true,
      headers: newHeaders,
      rows: newRows,
      rowsAffected: data.rows.length,
    };
  } catch (error) {
    return {
      success: false,
      headers: data.headers,
      rows: data.rows,
      rowsAffected: 0,
      error: error instanceof Error ? error.message : 'Select operation failed',
    };
  }
}
