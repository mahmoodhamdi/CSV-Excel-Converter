import Papa from 'papaparse';
import type { ParsedData, CsvOptions } from '@/types';
import { ParseError, ErrorCodes } from '@/lib/errors';

/**
 * Parses CSV/TSV data into a structured format with headers and rows.
 *
 * Uses PapaParse library for robust CSV parsing with support for:
 * - Custom delimiters (comma, semicolon, tab, pipe)
 * - Header row detection
 * - Empty line handling
 * - Value trimming
 * - Quoted fields with escaped quotes
 *
 * @param data - The CSV string to parse
 * @param options - Parsing options
 * @param options.delimiter - Column delimiter character (default: ',')
 * @param options.hasHeader - Whether first row contains headers (default: true)
 * @param options.skipEmptyLines - Skip empty lines when parsing (default: false)
 * @param options.trimValues - Trim whitespace from cell values (default: false)
 * @returns Parsed data with headers, rows, format, and metadata
 * @throws {ParseError} If the CSV is invalid or cannot be parsed
 *
 * @example
 * ```typescript
 * // Basic usage
 * const data = parseCsv('name,age\nJohn,30\nJane,25');
 * // Returns:
 * // {
 * //   headers: ['name', 'age'],
 * //   rows: [{ name: 'John', age: '30' }, { name: 'Jane', age: '25' }],
 * //   format: 'csv',
 * //   metadata: { rowCount: 2, columnCount: 2 }
 * // }
 * ```
 *
 * @example
 * ```typescript
 * // With custom delimiter
 * const data = parseCsv('name;age\nJohn;30', { delimiter: ';' });
 * ```
 *
 * @example
 * ```typescript
 * // Without header row
 * const data = parseCsv('John,30\nJane,25', { hasHeader: false });
 * // headers: ['Column 1', 'Column 2']
 * ```
 */
export function parseCsv(
  data: string,
  options: CsvOptions = {}
): ParsedData {
  const {
    delimiter = ',',
    hasHeader = true,
    skipEmptyLines = false,
    trimValues = false,
  } = options;

  if (!data || data.trim() === '') {
    return {
      headers: [],
      rows: [],
      format: 'csv',
      metadata: {
        rowCount: 0,
        columnCount: 0,
      },
    };
  }

  try {

  const result = Papa.parse(data, {
    delimiter,
    header: hasHeader,
    skipEmptyLines,
    transformHeader: trimValues ? (header: string) => header.trim() : undefined,
    transform: trimValues ? (value: string) => value.trim() : undefined,
  });

  if (hasHeader) {
    const headers = result.meta.fields || [];
    const rows = result.data as Record<string, unknown>[];

    return {
      headers,
      rows,
      format: 'csv',
      metadata: {
        rowCount: rows.length,
        columnCount: headers.length,
      },
    };
  }

  // Handle case where there's no header
  const rawRows = result.data as string[][];
  const headers = rawRows.length > 0 ? rawRows[0].map((_, i) => `Column ${i + 1}`) : [];
  const rows = rawRows.map((row) => {
    const obj: Record<string, unknown> = {};
    row.forEach((val, i) => {
      obj[headers[i]] = val;
    });
    return obj;
  });

  return {
    headers,
    rows,
    format: 'csv',
    metadata: {
      rowCount: rows.length,
      columnCount: headers.length,
    },
  };
  } catch (error) {
    if (error instanceof ParseError) {
      throw error;
    }
    throw new ParseError(
      error instanceof Error ? error.message : 'Failed to parse CSV data',
      ErrorCodes.INVALID_CSV,
      undefined,
      'csv'
    );
  }
}

/**
 * Writes data to CSV format.
 *
 * Converts structured data (headers and rows) back to CSV string format.
 * Handles special characters by quoting fields that contain:
 * - The delimiter character
 * - Double quotes (escaped by doubling)
 * - Newline characters
 *
 * @param headers - Array of column header names
 * @param rows - Array of row objects with values keyed by header names
 * @param options - Writing options
 * @param options.delimiter - Column delimiter character (default: ',')
 * @returns CSV formatted string
 *
 * @example
 * ```typescript
 * const csv = writeCsv(
 *   ['name', 'age'],
 *   [{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }]
 * );
 * // Returns: 'name,age\nJohn,30\nJane,25'
 * ```
 *
 * @example
 * ```typescript
 * // With special characters
 * const csv = writeCsv(
 *   ['name', 'description'],
 *   [{ name: 'Product', description: 'Contains, comma' }]
 * );
 * // Returns: 'name,description\nProduct,"Contains, comma"'
 * ```
 */
export function writeCsv(
  headers: string[],
  rows: Record<string, unknown>[],
  options: CsvOptions = {}
): string {
  const { delimiter = ',' } = options;

  if (headers.length === 0) {
    return '';
  }

  const escapeField = (field: unknown): string => {
    if (field === null || field === undefined) {
      return '';
    }
    const str = String(field);
    // Check if field needs quoting
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
      // Escape quotes by doubling them
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeField).join(delimiter);
  const dataLines = rows.map((row) =>
    headers.map((header) => escapeField(row[header])).join(delimiter)
  );

  return [headerLine, ...dataLines].join('\n');
}

/**
 * Auto-detects the delimiter used in CSV data.
 *
 * Analyzes the first line of the data to detect which delimiter
 * is most frequently used. Supports common delimiters:
 * - Comma (,)
 * - Semicolon (;)
 * - Tab (\t)
 * - Pipe (|)
 *
 * @param data - The CSV string to analyze
 * @returns The detected delimiter character (defaults to comma if none detected)
 *
 * @example
 * ```typescript
 * detectDelimiter('name,age\nJohn,30');  // Returns ','
 * detectDelimiter('name;age\nJohn;30');  // Returns ';'
 * detectDelimiter('name\tage\nJohn\t30'); // Returns '\t'
 * ```
 */
export function detectDelimiter(data: string): string {
  const delimiters = [',', ';', '\t', '|'];
  const firstLine = data.split('\n')[0] || '';

  let maxCount = 0;
  let detectedDelimiter = ',';

  for (const delimiter of delimiters) {
    const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      detectedDelimiter = delimiter;
    }
  }

  return detectedDelimiter;
}
