import Papa from 'papaparse';
import type { ParsedData, CsvOptions } from '@/types';

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
      metadata: {
        rowCount: 0,
        columnCount: 0,
      },
    };
  }

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
}

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
