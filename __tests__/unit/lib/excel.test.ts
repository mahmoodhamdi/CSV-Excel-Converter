import { describe, it, expect } from 'vitest';
import { parseExcelData, writeExcel, getSheetNames, isXlsxLoaded, preloadXlsx } from '@/lib/converter/excel';

describe('Excel Parser', () => {
  describe('parseExcelData', () => {
    it('should parse Excel-like data array', () => {
      const data = [
        ['name', 'age', 'city'],
        ['John', 30, 'NYC'],
        ['Jane', 25, 'LA'],
      ];
      const result = parseExcelData(data);

      expect(result.headers).toEqual(['name', 'age', 'city']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({ name: 'John', age: 30, city: 'NYC' });
    });

    it('should handle empty data', () => {
      const data: unknown[][] = [];
      const result = parseExcelData(data);

      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
    });

    it('should handle data with only headers', () => {
      const data = [['name', 'age']];
      const result = parseExcelData(data);

      expect(result.headers).toEqual(['name', 'age']);
      expect(result.rows).toEqual([]);
    });

    it('should convert all values to appropriate types', () => {
      const data = [
        ['name', 'active', 'count'],
        ['John', true, 42],
      ];
      const result = parseExcelData(data);

      expect(result.rows[0].active).toBe(true);
      expect(result.rows[0].count).toBe(42);
    });
  });

  describe('writeExcel (async)', () => {
    it('should create Excel worksheet data', async () => {
      const headers = ['name', 'age'];
      const rows = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];
      const result = await writeExcel(headers, rows);

      expect(result).toBeDefined();
      expect(result.SheetNames).toContain('Sheet1');
    });

    it('should use custom sheet name', async () => {
      const headers = ['name'];
      const rows = [{ name: 'John' }];
      const result = await writeExcel(headers, rows, { sheetName: 'Data' });

      expect(result.SheetNames).toContain('Data');
    });

    it('should handle empty data', async () => {
      const headers: string[] = [];
      const rows: Record<string, unknown>[] = [];
      const result = await writeExcel(headers, rows);

      expect(result).toBeDefined();
    });

    it('should auto-fit columns when option is enabled', async () => {
      const headers = ['short', 'longer_column_name'];
      const rows = [{ short: 'a', longer_column_name: 'value' }];
      const result = await writeExcel(headers, rows, { autoFitColumns: true });

      expect(result).toBeDefined();
      const worksheet = result.Sheets['Sheet1'];
      expect(worksheet['!cols']).toBeDefined();
    });
  });

  describe('getSheetNames', () => {
    it('should return sheet names from workbook', async () => {
      const headers = ['name'];
      const rows = [{ name: 'John' }];
      const workbook = await writeExcel(headers, rows);
      const names = getSheetNames(workbook);

      expect(names).toContain('Sheet1');
    });
  });

  describe('dynamic loading', () => {
    it('should preload xlsx module', async () => {
      await preloadXlsx();
      expect(isXlsxLoaded()).toBe(true);
    });

    it('should indicate if xlsx is loaded', async () => {
      // After preloading, should be loaded
      await preloadXlsx();
      expect(isXlsxLoaded()).toBe(true);
    });
  });
});
