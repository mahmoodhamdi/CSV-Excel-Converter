/**
 * Find and Replace transformation
 */

import type { TransformData, TransformResult, FindReplaceConfig } from './types';

export function findReplace(data: TransformData, config: FindReplaceConfig): TransformResult {
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

    let replacementsCount = 0;

    const newRows = data.rows.map((row) => {
      const newRow = [...row];
      const cellValue = newRow[columnIndex] ?? '';
      let newValue: string;

      if (config.useRegex) {
        // Regex mode
        try {
          const flags = config.matchCase ? 'g' : 'gi';
          const regex = new RegExp(config.find, flags);
          newValue = cellValue.replace(regex, config.replace);
        } catch {
          // Invalid regex, keep original value
          newValue = cellValue;
        }
      } else if (config.matchWholeCell) {
        // Whole cell match
        const matches = config.matchCase
          ? cellValue === config.find
          : cellValue.toLowerCase() === config.find.toLowerCase();

        newValue = matches ? config.replace : cellValue;
      } else {
        // Partial match
        if (config.matchCase) {
          newValue = cellValue.split(config.find).join(config.replace);
        } else {
          // Case-insensitive replace
          const regex = new RegExp(escapeRegex(config.find), 'gi');
          newValue = cellValue.replace(regex, config.replace);
        }
      }

      if (newValue !== cellValue) {
        replacementsCount++;
        newRow[columnIndex] = newValue;
      }

      return newRow;
    });

    return {
      success: true,
      headers: data.headers,
      rows: newRows,
      rowsAffected: replacementsCount,
    };
  } catch (error) {
    return {
      success: false,
      headers: data.headers,
      rows: data.rows,
      rowsAffected: 0,
      error: error instanceof Error ? error.message : 'Find/Replace operation failed',
    };
  }
}

// Escape special regex characters
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
