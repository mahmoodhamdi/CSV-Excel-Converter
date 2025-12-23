/**
 * @fileoverview Format detection utilities for automatic data format identification.
 *
 * This module provides functions to detect the format of input data based on
 * content analysis, file extensions, and MIME types.
 *
 * @module lib/converter/detect
 */

import type { InputFormat } from '@/types';

/**
 * Detects the format of data by analyzing its content.
 *
 * Uses heuristics to identify the most likely format:
 * - JSON: Data starts and ends with { } or [ ]
 * - XML: Data starts with `<?xml` or `<` and has closing tags
 * - TSV: Tab characters detected as delimiter
 * - CSV: Default fallback for other text data
 *
 * @param data - The string data to analyze
 * @returns The detected input format
 *
 * @example
 * ```typescript
 * detectFormat('[{"name": "John"}]');  // Returns 'json'
 * detectFormat('<root><item/></root>'); // Returns 'xml'
 * detectFormat('name\tage\nJohn\t30');  // Returns 'tsv'
 * detectFormat('name,age\nJohn,30');    // Returns 'csv'
 * ```
 */
export function detectFormat(data: string): InputFormat {
  const trimmed = data.trim();

  // Check for JSON
  if (
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('{') && trimmed.endsWith('}'))
  ) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON, continue checking
    }
  }

  // Check for XML
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) {
    const hasClosingTag = /<\/\w+>/.test(trimmed);
    if (hasClosingTag) {
      return 'xml';
    }
  }

  // Check for TSV (tab-separated)
  const delimiter = detectDelimiter(trimmed);
  if (delimiter === '\t') {
    return 'tsv';
  }

  // Default to CSV
  return 'csv';
}

/**
 * Detects the most likely delimiter used in delimited text data.
 *
 * Analyzes the first few lines to identify the delimiter by:
 * - Counting occurrences of common delimiters (comma, semicolon, tab, pipe)
 * - Checking for consistent counts across lines
 * - Applying weights for delimiter likelihood
 *
 * @param data - The delimited text data to analyze
 * @returns The detected delimiter character (defaults to comma)
 *
 * @example
 * ```typescript
 * detectDelimiter('a,b,c\n1,2,3');  // Returns ','
 * detectDelimiter('a;b;c\n1;2;3');  // Returns ';'
 * detectDelimiter('a\tb\tc\n1\t2\t3'); // Returns '\t'
 * detectDelimiter('a|b|c\n1|2|3');  // Returns '|'
 * ```
 */
export function detectDelimiter(data: string): string {
  const delimiters = [
    { char: ',', weight: 1 },
    { char: ';', weight: 1 },
    { char: '\t', weight: 1.5 }, // Slight preference for tabs
    { char: '|', weight: 1 },
  ];

  const lines = data.split('\n').slice(0, 5); // Check first 5 lines
  const counts = new Map<string, number>();

  for (const { char, weight } of delimiters) {
    let totalCount = 0;
    let consistentCount = true;
    let prevCount = -1;

    for (const line of lines) {
      if (!line.trim()) continue;
      const count = (line.match(new RegExp(char === '\t' ? '\t' : `\\${char}`, 'g')) || []).length;
      totalCount += count;

      if (prevCount !== -1 && count !== prevCount) {
        consistentCount = false;
      }
      prevCount = count;
    }

    // Reward consistent delimiter counts across lines
    const finalScore = totalCount * weight * (consistentCount ? 1.5 : 1);
    counts.set(char, finalScore);
  }

  let maxCount = 0;
  let detectedDelimiter = ',';

  counts.forEach((count, char) => {
    if (count > maxCount) {
      maxCount = count;
      detectedDelimiter = char;
    }
  });

  return detectedDelimiter;
}

/**
 * Detects the format based on a filename's extension.
 *
 * Maps common file extensions to their corresponding formats.
 * Returns null if the extension is not recognized.
 *
 * @param filename - The filename to analyze
 * @returns The detected format or null if unknown
 *
 * @example
 * ```typescript
 * detectFormatFromFilename('data.csv');   // Returns 'csv'
 * detectFormatFromFilename('data.xlsx');  // Returns 'xlsx'
 * detectFormatFromFilename('data.json');  // Returns 'json'
 * detectFormatFromFilename('data.txt');   // Returns null
 * ```
 */
export function detectFormatFromFilename(filename: string): InputFormat | null {
  const ext = filename.split('.').pop()?.toLowerCase();

  const formatMap: Record<string, InputFormat> = {
    csv: 'csv',
    tsv: 'tsv',
    json: 'json',
    xlsx: 'xlsx',
    xls: 'xls',
    xml: 'xml',
  };

  return formatMap[ext || ''] || null;
}

/**
 * Detects the format based on a MIME type.
 *
 * Maps standard MIME types to their corresponding formats.
 * Returns null if the MIME type is not recognized.
 *
 * @param mimeType - The MIME type to analyze
 * @returns The detected format or null if unknown
 *
 * @example
 * ```typescript
 * detectFormatFromMimeType('text/csv');           // Returns 'csv'
 * detectFormatFromMimeType('application/json');   // Returns 'json'
 * detectFormatFromMimeType('application/xml');    // Returns 'xml'
 * detectFormatFromMimeType('text/plain');         // Returns null
 * ```
 */
export function detectFormatFromMimeType(mimeType: string): InputFormat | null {
  const mimeMap: Record<string, InputFormat> = {
    'text/csv': 'csv',
    'text/tab-separated-values': 'tsv',
    'application/json': 'json',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-excel': 'xls',
    'application/xml': 'xml',
    'text/xml': 'xml',
  };

  return mimeMap[mimeType] || null;
}
