/**
 * Filter transformation - filter rows based on conditions
 */

import type { TransformData, TransformResult, FilterConfig, TransformOperator } from './types';

function evaluateCondition(
  value: string,
  operator: TransformOperator,
  compareValue: string,
  caseSensitive: boolean = false
): boolean {
  const v = caseSensitive ? value : value.toLowerCase();
  const cv = caseSensitive ? compareValue : compareValue.toLowerCase();

  switch (operator) {
    case 'equals':
      return v === cv;
    case 'notEquals':
      return v !== cv;
    case 'contains':
      return v.includes(cv);
    case 'notContains':
      return !v.includes(cv);
    case 'startsWith':
      return v.startsWith(cv);
    case 'endsWith':
      return v.endsWith(cv);
    case 'greaterThan': {
      const numV = parseFloat(value);
      const numCV = parseFloat(compareValue);
      if (!isNaN(numV) && !isNaN(numCV)) {
        return numV > numCV;
      }
      return v > cv;
    }
    case 'lessThan': {
      const numV = parseFloat(value);
      const numCV = parseFloat(compareValue);
      if (!isNaN(numV) && !isNaN(numCV)) {
        return numV < numCV;
      }
      return v < cv;
    }
    case 'greaterThanOrEqual': {
      const numV = parseFloat(value);
      const numCV = parseFloat(compareValue);
      if (!isNaN(numV) && !isNaN(numCV)) {
        return numV >= numCV;
      }
      return v >= cv;
    }
    case 'lessThanOrEqual': {
      const numV = parseFloat(value);
      const numCV = parseFloat(compareValue);
      if (!isNaN(numV) && !isNaN(numCV)) {
        return numV <= numCV;
      }
      return v <= cv;
    }
    case 'isEmpty':
      return value.trim() === '';
    case 'isNotEmpty':
      return value.trim() !== '';
    case 'regex':
      try {
        const regex = new RegExp(compareValue, caseSensitive ? '' : 'i');
        return regex.test(value);
      } catch {
        return false;
      }
    default:
      return true;
  }
}

export function filterRows(data: TransformData, config: FilterConfig): TransformResult {
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

    const filteredRows = data.rows.filter((row) => {
      const cellValue = row[columnIndex] ?? '';
      return evaluateCondition(
        cellValue,
        config.operator,
        config.value,
        config.caseSensitive
      );
    });

    return {
      success: true,
      headers: data.headers,
      rows: filteredRows,
      rowsAffected: data.rows.length - filteredRows.length,
    };
  } catch (error) {
    return {
      success: false,
      headers: data.headers,
      rows: data.rows,
      rowsAffected: 0,
      error: error instanceof Error ? error.message : 'Filter operation failed',
    };
  }
}
