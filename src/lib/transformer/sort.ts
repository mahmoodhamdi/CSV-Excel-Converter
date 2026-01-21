/**
 * Sort transformation - sort rows by a column
 */

import type { TransformData, TransformResult, SortConfig } from './types';

export function sortRows(data: TransformData, config: SortConfig): TransformResult {
  try {
    const columnIndex = data.headers.indexOf(config.column);

    if (columnIndex === -1) {
      return {
        success: false,
        headers: data.headers,
        rows: data.rows,
        rowsAffected: 0,
        error: `Column "${config.column}" not found`,
      };
    }

    const sortedRows = [...data.rows].sort((a, b) => {
      const aVal = a[columnIndex] ?? '';
      const bVal = b[columnIndex] ?? '';

      // Try numeric comparison first
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return config.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // Try date comparison
      const aDate = new Date(aVal).getTime();
      const bDate = new Date(bVal).getTime();

      if (!isNaN(aDate) && !isNaN(bDate)) {
        return config.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      // String comparison
      const comparison = aVal.localeCompare(bVal, undefined, {
        numeric: true,
        sensitivity: 'base',
      });

      return config.direction === 'asc' ? comparison : -comparison;
    });

    return {
      success: true,
      headers: data.headers,
      rows: sortedRows,
      rowsAffected: data.rows.length,
    };
  } catch (error) {
    return {
      success: false,
      headers: data.headers,
      rows: data.rows,
      rowsAffected: 0,
      error: error instanceof Error ? error.message : 'Sort operation failed',
    };
  }
}
