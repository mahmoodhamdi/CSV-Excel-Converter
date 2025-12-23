/**
 * @fileoverview XML parsing and writing utilities using fast-xml-parser.
 *
 * This module provides functions for converting between XML and tabular data formats.
 * It handles nested XML structures by flattening them into rows and columns.
 *
 * @module lib/converter/xml
 */

import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import type { ParsedData } from '@/types';

/**
 * Parses XML data into a structured tabular format.
 *
 * Automatically detects and extracts repeated elements as rows.
 * Handles nested structures by flattening them with dot notation.
 * Preserves XML attributes with an @_ prefix.
 *
 * @param data - The XML string to parse
 * @returns Parsed data with headers, rows, rawData, and metadata
 *
 * @example
 * ```typescript
 * const xml = `<?xml version="1.0"?>
 * <users>
 *   <user><name>John</name><age>30</age></user>
 *   <user><name>Jane</name><age>25</age></user>
 * </users>`;
 *
 * const data = parseXml(xml);
 * // headers: ['name', 'age']
 * // rows: [{ name: 'John', age: '30' }, { name: 'Jane', age: '25' }]
 * ```
 *
 * @example
 * ```typescript
 * // With attributes
 * const xml = '<items><item id="1">Product A</item></items>';
 * const data = parseXml(xml);
 * // headers: ['@_id', '#text']
 * ```
 */
export function parseXml(data: string): ParsedData {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
  });

  try {
    const result = parser.parse(data);
    const rows = extractRows(result);
    const headers = extractHeaders(rows);

    return {
      headers,
      rows,
      rawData: result,
      format: 'xml',
      metadata: {
        rowCount: rows.length,
        columnCount: headers.length,
      },
    };
  } catch {
    return {
      headers: [],
      rows: [],
      format: 'xml',
      metadata: {
        rowCount: 0,
        columnCount: 0,
      },
    };
  }
}

/**
 * Recursively extracts row data from a parsed XML object.
 *
 * Finds the first array-like structure in the XML and treats each element as a row.
 * Falls back to treating a single object as one row.
 *
 * @param obj - The parsed XML object to extract rows from
 * @returns Array of row objects with flattened key-value pairs
 * @internal
 */
function extractRows(obj: unknown): Record<string, unknown>[] {
  if (!obj || typeof obj !== 'object') return [];

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (typeof item === 'object' && item !== null) {
        return flattenXmlObject(item as Record<string, unknown>);
      }
      return { value: item };
    });
  }

  // Find the first array-like structure
  const record = obj as Record<string, unknown>;
  for (const key in record) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return flattenXmlObject(item as Record<string, unknown>);
        }
        return { value: item };
      });
    }
    if (typeof value === 'object' && value !== null) {
      const nested = extractRows(value);
      if (nested.length > 0) return nested;
    }
  }

  // Single object, return as single row
  return [flattenXmlObject(record)];
}

/**
 * Flattens a nested XML object into a single-level object with dot notation keys.
 *
 * Similar to flattenObject in json.ts but handles XML-specific cases like
 * arrays (joined as comma-separated strings) and nested objects.
 *
 * @param obj - The nested object to flatten
 * @param prefix - Current key prefix for nested properties
 * @returns Flattened object with dot-notation keys
 * @internal
 */
function flattenXmlObject(
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const newKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (value === null || value === undefined) {
      result[newKey] = '';
    } else if (Array.isArray(value)) {
      result[newKey] = value.map((v) => (typeof v === 'object' ? JSON.stringify(v) : v)).join(', ');
    } else if (typeof value === 'object') {
      Object.assign(result, flattenXmlObject(value as Record<string, unknown>, newKey));
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

/**
 * Extracts unique header names from all rows.
 *
 * Collects all unique keys from all row objects to ensure all columns are represented.
 *
 * @param rows - Array of row objects to extract headers from
 * @returns Array of unique header names
 * @internal
 */
function extractHeaders(rows: Record<string, unknown>[]): string[] {
  const headerSet = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => headerSet.add(key));
  });
  return Array.from(headerSet);
}

/**
 * Converts tabular data to XML format.
 *
 * Creates a well-formed XML document with a root element containing
 * repeated item elements for each row.
 *
 * @param headers - Array of column header names to include
 * @param rows - Array of row data objects keyed by header names
 * @param rootName - Name of the root XML element (default: 'root')
 * @param itemName - Name of each row element (default: 'item')
 * @returns XML string with declaration and formatted output
 *
 * @example
 * ```typescript
 * const xml = writeXml(
 *   ['name', 'age'],
 *   [{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }],
 *   'users',
 *   'user'
 * );
 * // Returns:
 * // <?xml version="1.0" encoding="UTF-8"?>
 * // <users>
 * //   <user>
 * //     <name>John</name>
 * //     <age>30</age>
 * //   </user>
 * //   <user>
 * //     <name>Jane</name>
 * //     <age>25</age>
 * //   </user>
 * // </users>
 * ```
 */
export function writeXml(
  headers: string[],
  rows: Record<string, unknown>[],
  rootName = 'root',
  itemName = 'item'
): string {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    indentBy: '  ',
  });

  const items = rows.map((row) => {
    const item: Record<string, unknown> = {};
    headers.forEach((header) => {
      item[header] = row[header] ?? '';
    });
    return item;
  });

  const xml = builder.build({
    [rootName]: {
      [itemName]: items,
    },
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
}
