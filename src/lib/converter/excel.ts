import * as XLSX from 'xlsx';
import type { ParsedData, ExcelOptions } from '@/types';

export function parseExcel(
  buffer: ArrayBuffer,
  options: ExcelOptions = {}
): ParsedData {
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

export function writeExcel(
  headers: string[],
  rows: Record<string, unknown>[],
  options: ExcelOptions = {}
): XLSX.WorkBook {
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

  // Auto-fit columns
  if (autoFitColumns && headers.length > 0) {
    const colWidths = headers.map((header, i) => {
      const maxLen = Math.max(
        header.length,
        ...rows.map((row) => String(row[header] ?? '').length)
      );
      return { wch: Math.min(maxLen + 2, 50) };
    });
    worksheet['!cols'] = colWidths;
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

export function workbookToBuffer(workbook: XLSX.WorkBook, type: 'xlsx' | 'xls' = 'xlsx'): ArrayBuffer {
  const bookType = type === 'xls' ? 'biff8' : 'xlsx';
  return XLSX.write(workbook, { bookType, type: 'array' });
}

export function workbookToBase64(workbook: XLSX.WorkBook, type: 'xlsx' | 'xls' = 'xlsx'): string {
  const bookType = type === 'xls' ? 'biff8' : 'xlsx';
  return XLSX.write(workbook, { bookType, type: 'base64' });
}

export function getSheetNames(workbook: XLSX.WorkBook): string[] {
  return workbook.SheetNames;
}
