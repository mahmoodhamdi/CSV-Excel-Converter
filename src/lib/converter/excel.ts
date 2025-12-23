import type { ParsedData, ExcelOptions } from '@/types';
import type * as XLSXType from 'xlsx';

// Lazy-loaded XLSX module
let xlsxModule: typeof XLSXType | null = null;

/**
 * Dynamically load the XLSX library
 * This reduces initial bundle size by ~400KB
 */
async function getXlsx(): Promise<typeof XLSXType> {
  if (!xlsxModule) {
    xlsxModule = await import('xlsx');
  }
  return xlsxModule;
}

/**
 * Calculate optimized column widths using sampling
 */
function calculateColumnWidths(
  headers: string[],
  rows: Record<string, unknown>[],
  maxWidth = 50,
  sampleSize = 100
): { wch: number }[] {
  // Only sample first N rows for performance
  const sampleRows = rows.slice(0, sampleSize);

  return headers.map((header) => {
    let maxLen = header.length;

    for (const row of sampleRows) {
      const value = row[header];
      const len = String(value ?? '').length;
      if (len > maxLen) {
        maxLen = len;
        if (maxLen >= maxWidth) break; // Early exit if max reached
      }
    }

    return { wch: Math.min(maxLen + 2, maxWidth) };
  });
}

/**
 * Parse Excel file (async due to dynamic import)
 */
export async function parseExcel(
  buffer: ArrayBuffer,
  options: ExcelOptions = {}
): Promise<ParsedData> {
  const XLSX = await getXlsx();
  const { selectedSheet = 0 } = options;

  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName =
    typeof selectedSheet === 'number'
      ? workbook.SheetNames[selectedSheet]
      : selectedSheet;

  if (!sheetName || !workbook.Sheets[sheetName]) {
    return {
      headers: [],
      rows: [],
      format: 'xlsx',
      metadata: {
        rowCount: 0,
        columnCount: 0,
        sheets: workbook.SheetNames,
      },
    };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
  });
  const data = rawData as unknown as unknown[][];

  return parseExcelData(data, workbook.SheetNames);
}

/**
 * Synchronous version for when XLSX is already loaded
 */
export function parseExcelSync(
  buffer: ArrayBuffer,
  options: ExcelOptions = {}
): ParsedData {
  if (!xlsxModule) {
    throw new Error('XLSX module not loaded. Call parseExcel first or use dynamic import.');
  }

  const XLSX = xlsxModule;
  const { selectedSheet = 0 } = options;

  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName =
    typeof selectedSheet === 'number'
      ? workbook.SheetNames[selectedSheet]
      : selectedSheet;

  if (!sheetName || !workbook.Sheets[sheetName]) {
    return {
      headers: [],
      rows: [],
      format: 'xlsx',
      metadata: {
        rowCount: 0,
        columnCount: 0,
        sheets: workbook.SheetNames,
      },
    };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
  });
  const data = rawData as unknown as unknown[][];

  return parseExcelData(data, workbook.SheetNames);
}

export function parseExcelData(
  data: unknown[][],
  sheets?: string[]
): ParsedData {
  if (!data || data.length === 0) {
    return {
      headers: [],
      rows: [],
      format: 'xlsx',
      metadata: {
        rowCount: 0,
        columnCount: 0,
        sheets,
      },
    };
  }

  const headers = (data[0] || []).map(String);
  const rows = data.slice(1).map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });

  return {
    headers,
    rows,
    format: 'xlsx',
    metadata: {
      rowCount: rows.length,
      columnCount: headers.length,
      sheets,
    },
  };
}

/**
 * Write Excel file (async due to dynamic import)
 */
export async function writeExcel(
  headers: string[],
  rows: Record<string, unknown>[],
  options: ExcelOptions = {}
): Promise<XLSXType.WorkBook> {
  const XLSX = await getXlsx();

  const {
    sheetName = 'Sheet1',
    autoFitColumns = true,
    freezeHeader = false,
    headerStyle = false,
  } = options;

  // Create worksheet data
  const wsData = [
    headers,
    ...rows.map((row) => headers.map((h) => row[h])),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-fit columns using optimized sampling
  if (autoFitColumns && headers.length > 0) {
    worksheet['!cols'] = calculateColumnWidths(headers, rows);
  }

  // Freeze header row
  if (freezeHeader) {
    worksheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' };
  }

  // Apply header style
  if (headerStyle && headers.length > 0) {
    headers.forEach((_, i) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
      if (!worksheet[cellRef]) return;
      worksheet[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'EEEEEE' } },
      };
    });
  }

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return workbook;
}

/**
 * Convert workbook to ArrayBuffer (async)
 */
export async function workbookToBuffer(
  workbook: XLSXType.WorkBook,
  type: 'xlsx' | 'xls' = 'xlsx'
): Promise<ArrayBuffer> {
  const XLSX = await getXlsx();
  const bookType = type === 'xls' ? 'biff8' : 'xlsx';
  return XLSX.write(workbook, { bookType, type: 'array' });
}

/**
 * Convert workbook to Base64 string (async)
 */
export async function workbookToBase64(
  workbook: XLSXType.WorkBook,
  type: 'xlsx' | 'xls' = 'xlsx'
): Promise<string> {
  const XLSX = await getXlsx();
  const bookType = type === 'xls' ? 'biff8' : 'xlsx';
  return XLSX.write(workbook, { bookType, type: 'base64' });
}

/**
 * Get sheet names from workbook
 */
export function getSheetNames(workbook: XLSXType.WorkBook): string[] {
  return workbook.SheetNames;
}

/**
 * Check if XLSX module is loaded
 */
export function isXlsxLoaded(): boolean {
  return xlsxModule !== null;
}

/**
 * Preload XLSX module
 */
export async function preloadXlsx(): Promise<void> {
  await getXlsx();
}
