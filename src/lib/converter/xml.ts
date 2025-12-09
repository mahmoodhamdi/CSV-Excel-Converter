import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import type { ParsedData } from '@/types';

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

function extractHeaders(rows: Record<string, unknown>[]): string[] {
  const headerSet = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => headerSet.add(key));
  });
  return Array.from(headerSet);
}

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
