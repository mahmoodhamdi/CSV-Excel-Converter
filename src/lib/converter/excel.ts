import type { ParsedData, ExcelOptions } from '@/types';
import type * as XLSXType from 'xlsx';

/**
 * @fileoverview Excel file parsing and writing utilities using the xlsx library.
 *
 * This module provides functions for reading and writing Excel files (.xlsx, .xls).
 * The xlsx library is dynamically imported to reduce initial bundle size (~400KB savings).
 *
 * @module lib/converter/excel
 */

// Lazy-loaded XLSX module
let xlsxModule: typeof XLSXType | null = null;

/**
 * Dynamically loads the XLSX library on first use.
 *
 * Uses lazy loading to reduce initial bundle size by ~400KB.
 * The module is cached after first load for subsequent calls.
 *
 * @returns Promise resolving to the XLSX module
 * @internal
 */
async function getXlsx(): Promise<typeof XLSXType> {
  if (!xlsxModule) {
    xlsxModule = await import('xlsx');
  }
  return xlsxModule;
}

/**
 * Calculates optimal column widths based on content sampling.
 *
 * Uses a sampling approach for performance - only checks the first N rows
 * to determine column widths. This prevents performance issues with large datasets.
 *
 * @param headers - Array of column header names
 * @param rows - Array of row data objects
 * @param maxWidth - Maximum column width in characters (default: 50)
 * @param sampleSize - Number of rows to sample for width calculation (default: 100)
 * @returns Array of column width objects for xlsx library
 * @internal
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
 * Parses an Excel file from an ArrayBuffer into structured data.
 *
 * Supports both .xlsx and .xls formats. Uses dynamic import for the xlsx library
 * to reduce initial bundle size. Handles multi-sheet workbooks with sheet selection.
 *
 * @param buffer - The Excel file as an ArrayBuffer
 * @param options - Parsing options
 * @param options.selectedSheet - Sheet to parse (index number or name, default: 0)
 * @returns Promise resolving to parsed data with headers, rows, and metadata
 *
 * @example
 * ```typescript
 * // Parse first sheet
 * const file = await fetch('data.xlsx').then(r => r.arrayBuffer());
 * const data = await parseExcel(file);
 * console.log(data.headers); // ['Name', 'Age', 'City']
 * console.log(data.rows);    // [{ Name: 'John', Age: 30, City: 'NYC' }, ...]
 * ```
 *
 * @example
 * ```typescript
 * // Parse specific sheet by name
 * const data = await parseExcel(file, { selectedSheet: 'Sales Data' });
 * ```
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
 * Synchronously parses an Excel file when the xlsx library is already loaded.
 *
 * Use this for better performance when you know the xlsx module has been preloaded.
 * Throws an error if the module hasn't been loaded yet.
 *
 * @param buffer - The Excel file as an ArrayBuffer
 * @param options - Parsing options (same as parseExcel)
 * @returns Parsed data with headers, rows, and metadata
 * @throws {Error} If the xlsx module hasn't been loaded
 *
 * @example
 * ```typescript
 * // Preload the module first
 * await preloadXlsx();
 * // Then use sync version for subsequent parses
 * const data = parseExcelSync(buffer);
 * ```
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

/**
 * Converts raw Excel sheet data (2D array) into structured ParsedData format.
 *
 * Treats the first row as headers and subsequent rows as data.
 * Used internally by parseExcel and parseExcelSync.
 *
 * @param data - 2D array of cell values from Excel sheet
 * @param sheets - Optional array of sheet names from the workbook
 * @returns Parsed data with headers, rows, and metadata
 * @internal
 */
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
 * Creates an Excel workbook from structured data.
 *
 * Generates a workbook with a single sheet containing the provided data.
 * Supports various formatting options including auto-fit columns, frozen headers,
 * and header styling.
 *
 * @param headers - Array of column header names
 * @param rows - Array of row data objects keyed by header names
 * @param options - Excel writing options
 * @param options.sheetName - Name for the worksheet (default: 'Sheet1')
 * @param options.autoFitColumns - Auto-adjust column widths to fit content (default: true)
 * @param options.freezeHeader - Freeze the header row for scrolling (default: false)
 * @param options.headerStyle - Apply bold styling to header row (default: false)
 * @returns Promise resolving to the XLSX WorkBook object
 *
 * @example
 * ```typescript
 * const workbook = await writeExcel(
 *   ['Name', 'Age'],
 *   [{ Name: 'John', Age: 30 }, { Name: 'Jane', Age: 25 }],
 *   { sheetName: 'Users', autoFitColumns: true, freezeHeader: true }
 * );
 * const buffer = await workbookToBuffer(workbook);
 * ```
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
 * Converts an Excel workbook to an ArrayBuffer for download or storage.
 *
 * @param workbook - The XLSX WorkBook object to convert
 * @param type - Output format: 'xlsx' for modern Excel, 'xls' for legacy (default: 'xlsx')
 * @returns Promise resolving to ArrayBuffer containing the Excel file
 *
 * @example
 * ```typescript
 * const workbook = await writeExcel(headers, rows);
 * const buffer = await workbookToBuffer(workbook, 'xlsx');
 * // Use buffer for file download or storage
 * ```
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
 * Converts an Excel workbook to a Base64-encoded string.
 *
 * Useful for embedding Excel files in JSON responses or data URIs.
 *
 * @param workbook - The XLSX WorkBook object to convert
 * @param type - Output format: 'xlsx' for modern Excel, 'xls' for legacy (default: 'xlsx')
 * @returns Promise resolving to Base64-encoded string of the Excel file
 *
 * @example
 * ```typescript
 * const workbook = await writeExcel(headers, rows);
 * const base64 = await workbookToBase64(workbook);
 * const dataUri = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
 * ```
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
 * Retrieves all sheet names from an Excel workbook.
 *
 * @param workbook - The XLSX WorkBook object
 * @returns Array of sheet names in order
 *
 * @example
 * ```typescript
 * const workbook = XLSX.read(buffer);
 * const sheets = getSheetNames(workbook);
 * // ['Sheet1', 'Sales Data', 'Summary']
 * ```
 */
export function getSheetNames(workbook: XLSXType.WorkBook): string[] {
  return workbook.SheetNames;
}

/**
 * Checks if the XLSX module has been loaded.
 *
 * Use this to determine if parseExcelSync can be safely called.
 *
 * @returns True if xlsx module is loaded, false otherwise
 */
export function isXlsxLoaded(): boolean {
  return xlsxModule !== null;
}

/**
 * Preloads the XLSX module for faster subsequent operations.
 *
 * Call this early in your application lifecycle to ensure the xlsx library
 * is ready when needed, avoiding loading delays during user interactions.
 *
 * @returns Promise that resolves when the module is loaded
 *
 * @example
 * ```typescript
 * // In your app initialization
 * useEffect(() => {
 *   preloadXlsx();
 * }, []);
 * ```
 */
export async function preloadXlsx(): Promise<void> {
  await getXlsx();
}
