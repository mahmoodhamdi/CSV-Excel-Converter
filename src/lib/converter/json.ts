import type { ParsedData, JsonOptions } from '@/types';
import { ParseError, ErrorCodes } from '@/lib/errors';

/**
 * Parses JSON data into a structured tabular format with headers and rows.
 *
 * Converts JSON arrays or objects into a normalized table structure.
 * Supports:
 * - Arrays of objects (each object becomes a row)
 * - Single objects (converted to single-row table)
 * - Nested object flattening (with dot notation keys)
 *
 * @param data - The JSON string to parse
 * @param options - Parsing options
 * @param options.flattenNested - Whether to flatten nested objects using dot notation (default: false)
 * @returns Parsed data with headers, rows, rawData, format, and metadata
 * @throws {ParseError} If the JSON is invalid or cannot be parsed
 *
 * @example
 * ```typescript
 * // Array of objects
 * const data = parseJson('[{"name":"John","age":30},{"name":"Jane","age":25}]');
 * // Returns:
 * // {
 * //   headers: ['name', 'age'],
 * //   rows: [{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }],
 * //   format: 'json',
 * //   metadata: { rowCount: 2, columnCount: 2 }
 * // }
 * ```
 *
 * @example
 * ```typescript
 * // With nested object flattening
 * const data = parseJson('[{"user":{"name":"John"}}]', { flattenNested: true });
 * // headers: ['user.name'], rows: [{ 'user.name': 'John' }]
 * ```
 */
export function parseJson(
  data: string,
  options: JsonOptions = {}
): ParsedData {
  const { flattenNested = false } = options;

  let parsed: unknown;

  try {
    parsed = JSON.parse(data);
  } catch (error) {
    throw new ParseError(
      error instanceof Error ? `Invalid JSON: ${error.message}` : 'Invalid JSON format',
      ErrorCodes.INVALID_JSON,
      undefined,
      'json'
    );
  }

  // Validate parsed data type
  if (parsed === null || (typeof parsed !== 'object' && !Array.isArray(parsed))) {
    throw new ParseError(
      'JSON must be an array or object',
      ErrorCodes.INVALID_JSON,
      undefined,
      'json'
    );
  }

  // Handle empty array
  if (Array.isArray(parsed) && parsed.length === 0) {
    return {
      headers: [],
      rows: [],
      format: 'json',
      metadata: {
        rowCount: 0,
        columnCount: 0,
      },
    };
  }

  // Normalize to array
  const dataArray = Array.isArray(parsed) ? parsed : [parsed];

  // Process rows
  const processedRows = flattenNested
    ? dataArray.map((row) => flattenObject(row))
    : dataArray;

  // Extract headers from all rows
  const headerSet = new Set<string>();
  processedRows.forEach((row) => {
    Object.keys(row).forEach((key) => headerSet.add(key));
  });
  const headers = Array.from(headerSet);

  return {
    headers,
    rows: processedRows,
    rawData: parsed,
    format: 'json',
    metadata: {
      rowCount: processedRows.length,
      columnCount: headers.length,
    },
  };
}

/**
 * Writes data to JSON format.
 *
 * Converts structured data (headers and rows) to a JSON string.
 * Supports pretty printing with configurable indentation.
 *
 * @param headers - Array of column header names to include in output
 * @param rows - Array of row objects with values keyed by header names
 * @param options - Writing options
 * @param options.prettyPrint - Whether to format with indentation (default: true)
 * @param options.indentation - Number of spaces for indentation (default: 2)
 * @returns JSON formatted string
 *
 * @example
 * ```typescript
 * const json = writeJson(
 *   ['name', 'age'],
 *   [{ name: 'John', age: 30 }],
 *   { prettyPrint: true, indentation: 2 }
 * );
 * // Returns:
 * // [
 * //   {
 * //     "name": "John",
 * //     "age": 30
 * //   }
 * // ]
 * ```
 */
export function writeJson(
  headers: string[],
  rows: Record<string, unknown>[],
  options: JsonOptions = {}
): string {
  const { prettyPrint = true, indentation = 2 } = options;

  // Filter rows to only include specified headers
  const filteredRows = rows.map((row) => {
    if (headers.length === 0) return row;
    const filtered: Record<string, unknown> = {};
    headers.forEach((header) => {
      if (header in row) {
        filtered[header] = row[header];
      }
    });
    return filtered;
  });

  if (prettyPrint) {
    return JSON.stringify(filteredRows, null, indentation);
  }
  return JSON.stringify(filteredRows);
}

/**
 * Recursively flattens a nested object into a single-level object with dot notation keys.
 *
 * Converts nested object hierarchies into flat key-value pairs where nested keys
 * are joined with dots. Arrays are converted to comma-separated strings.
 *
 * @param obj - The object to flatten
 * @param prefix - Optional prefix for all keys (used internally for recursion)
 * @returns Flattened object with dot-notation keys
 *
 * @example
 * ```typescript
 * const flat = flattenObject({ user: { name: 'John', address: { city: 'NYC' } } });
 * // Returns: { 'user.name': 'John', 'user.address.city': 'NYC' }
 * ```
 *
 * @example
 * ```typescript
 * // Arrays are joined as comma-separated strings
 * const flat = flattenObject({ tags: ['a', 'b', 'c'] });
 * // Returns: { tags: 'a,b,c' }
 * ```
 */
export function flattenObject(
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (Array.isArray(value)) {
        // Convert arrays to comma-separated string
        result[newKey] = value.join(',');
      } else if (value !== null && typeof value === 'object') {
        // Recursively flatten nested objects
        Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
      } else {
        result[newKey] = value;
      }
    }
  }

  return result;
}

/**
 * Converts a flattened object with dot notation keys back into a nested object structure.
 *
 * Reverses the operation performed by `flattenObject`, reconstructing the original
 * nested hierarchy from dot-notation keys.
 *
 * @param obj - The flattened object with dot-notation keys
 * @returns Nested object structure
 *
 * @example
 * ```typescript
 * const nested = unflattenObject({ 'user.name': 'John', 'user.address.city': 'NYC' });
 * // Returns: { user: { name: 'John', address: { city: 'NYC' } } }
 * ```
 */
export function unflattenObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const keys = key.split('.');
      let current = result;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in current)) {
          current[k] = {};
        }
        current = current[k] as Record<string, unknown>;
      }

      current[keys[keys.length - 1]] = obj[key];
    }
  }

  return result;
}
