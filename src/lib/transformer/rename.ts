/**
 * Rename transformation - rename a column
 */

import type { TransformData, TransformResult, RenameConfig } from './types';

export function renameColumn(data: TransformData, config: RenameConfig): TransformResult {
  try {
    const columnIndex = data.headers.indexOf(config.oldName);

    if (columnIndex === -1) {
      return {
        success: false,
        headers: data.headers,
        rows: data.rows,
        rowsAffected: 0,
        error: `Column "${config.oldName}" not found`,
      };
    }

    // Check if new name already exists
    if (data.headers.includes(config.newName) && config.oldName !== config.newName) {
      return {
        success: false,
        headers: data.headers,
        rows: data.rows,
        rowsAffected: 0,
        error: `Column "${config.newName}" already exists`,
      };
    }

    // Create new headers with renamed column
    const newHeaders = [...data.headers];
    newHeaders[columnIndex] = config.newName;

    return {
      success: true,
      headers: newHeaders,
      rows: data.rows,
      rowsAffected: 1, // One column renamed
    };
  } catch (error) {
    return {
      success: false,
      headers: data.headers,
      rows: data.rows,
      rowsAffected: 0,
      error: error instanceof Error ? error.message : 'Rename operation failed',
    };
  }
}
