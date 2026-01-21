/**
 * Add Column transformation - add a new column
 */

import type { TransformData, TransformResult, AddColumnConfig } from './types';

function evaluateFormula(formula: string, row: string[], headers: string[]): string {
  try {
    // Replace column references like {columnName} with actual values
    let expression = formula;

    headers.forEach((header, index) => {
      const placeholder = new RegExp(`\\{${header}\\}`, 'gi');
      const value = row[index] ?? '';

      // Try to use numeric value if possible
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        expression = expression.replace(placeholder, numValue.toString());
      } else {
        // For non-numeric, wrap in quotes for string operations
        expression = expression.replace(placeholder, `"${value}"`);
      }
    });

    // Simple arithmetic evaluation (only for safe operations)
    // Support: +, -, *, /, parentheses
    if (/^[0-9+\-*/().\s]+$/.test(expression)) {
      // Safe to evaluate basic math
      const result = Function(`'use strict'; return (${expression})`)();
      return String(result);
    }

    // For string concatenation, handle quoted strings
    if (expression.includes('"')) {
      // Simple concatenation: "a" + "b" -> "ab"
      return expression.replace(/"/g, '').replace(/\s*\+\s*/g, '');
    }

    return expression;
  } catch {
    return '#ERROR';
  }
}

export function addColumn(data: TransformData, config: AddColumnConfig): TransformResult {
  try {
    // Check if column name already exists
    if (data.headers.includes(config.name)) {
      return {
        success: false,
        headers: data.headers,
        rows: data.rows,
        rowsAffected: 0,
        error: `Column "${config.name}" already exists`,
      };
    }

    // Create new headers
    const newHeaders = [...data.headers, config.name];

    // Generate values for each row
    const newRows = data.rows.map((row, index) => {
      let newValue = '';

      switch (config.type) {
        case 'constant':
          newValue = config.value ?? '';
          break;

        case 'formula':
          newValue = config.formula
            ? evaluateFormula(config.formula, row, data.headers)
            : '';
          break;

        case 'copy':
          if (config.sourceColumn) {
            const sourceIndex = data.headers.indexOf(config.sourceColumn);
            if (sourceIndex !== -1) {
              newValue = row[sourceIndex] ?? '';
            }
          }
          break;

        case 'index':
          newValue = String((config.startIndex ?? 1) + index);
          break;
      }

      return [...row, newValue];
    });

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
      error: error instanceof Error ? error.message : 'Add column operation failed',
    };
  }
}
