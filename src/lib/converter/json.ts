import type { ParsedData, JsonOptions } from '@/types';

export function parseJson(
  data: string,
  options: JsonOptions = {}
): ParsedData {
  const { flattenNested = false } = options;

  const parsed = JSON.parse(data);

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
