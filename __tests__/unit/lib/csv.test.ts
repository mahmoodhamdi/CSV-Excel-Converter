import { describe, it, expect } from 'vitest';
import { parseCsv, writeCsv } from '@/lib/converter/csv';

describe('CSV Parser', () => {
  describe('parseCsv', () => {
    it('should parse simple CSV data', () => {
      const csvData = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
      const result = parseCsv(csvData);

      expect(result.headers).toEqual(['name', 'age', 'city']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({ name: 'John', age: '30', city: 'NYC' });
      expect(result.rows[1]).toEqual({ name: 'Jane', age: '25', city: 'LA' });
    });

    it('should handle custom delimiter', () => {
      const csvData = 'name;age;city\nJohn;30;NYC';
      const result = parseCsv(csvData, { delimiter: ';' });

      expect(result.headers).toEqual(['name', 'age', 'city']);
      expect(result.rows[0]).toEqual({ name: 'John', age: '30', city: 'NYC' });
    });

    it('should handle tab-separated values', () => {
      const tsvData = 'name\tage\tcity\nJohn\t30\tNYC';
      const result = parseCsv(tsvData, { delimiter: '\t' });

      expect(result.headers).toEqual(['name', 'age', 'city']);
      expect(result.rows[0]).toEqual({ name: 'John', age: '30', city: 'NYC' });
    });

    it('should handle quoted fields', () => {
      const csvData = 'name,description\nJohn,"Hello, World"\nJane,"Say ""Hi"""';
      const result = parseCsv(csvData);

      expect(result.rows[0]).toEqual({ name: 'John', description: 'Hello, World' });
      expect(result.rows[1]).toEqual({ name: 'Jane', description: 'Say "Hi"' });
    });

    it('should skip empty lines when option is set', () => {
      const csvData = 'name,age\nJohn,30\n\nJane,25';
      const result = parseCsv(csvData, { skipEmptyLines: true });

      expect(result.rows).toHaveLength(2);
    });

    it('should trim values when option is set', () => {
      const csvData = 'name,age\n  John  ,  30  ';
      const result = parseCsv(csvData, { trimValues: true });

      expect(result.rows[0]).toEqual({ name: 'John', age: '30' });
    });

    it('should return metadata', () => {
      const csvData = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
      const result = parseCsv(csvData);

      expect(result.metadata?.rowCount).toBe(2);
      expect(result.metadata?.columnCount).toBe(3);
    });

    it('should handle empty CSV', () => {
      const csvData = '';
      const result = parseCsv(csvData);

      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
    });

    it('should handle CSV with only headers', () => {
      const csvData = 'name,age,city';
      const result = parseCsv(csvData);

      expect(result.headers).toEqual(['name', 'age', 'city']);
      expect(result.rows).toEqual([]);
    });
  });

  describe('writeCsv', () => {
    it('should write simple CSV data', () => {
      const headers = ['name', 'age', 'city'];
      const rows = [
        { name: 'John', age: '30', city: 'NYC' },
        { name: 'Jane', age: '25', city: 'LA' },
      ];
      const result = writeCsv(headers, rows);

      expect(result).toBe('name,age,city\nJohn,30,NYC\nJane,25,LA');
    });

    it('should handle custom delimiter', () => {
      const headers = ['name', 'age'];
      const rows = [{ name: 'John', age: '30' }];
      const result = writeCsv(headers, rows, { delimiter: ';' });

      expect(result).toBe('name;age\nJohn;30');
    });

    it('should quote fields containing delimiter', () => {
      const headers = ['name', 'description'];
      const rows = [{ name: 'John', description: 'Hello, World' }];
      const result = writeCsv(headers, rows);

      expect(result).toBe('name,description\nJohn,"Hello, World"');
    });

    it('should escape quotes in fields', () => {
      const headers = ['name', 'quote'];
      const rows = [{ name: 'John', quote: 'Say "Hi"' }];
      const result = writeCsv(headers, rows);

      expect(result).toBe('name,quote\nJohn,"Say ""Hi"""');
    });

    it('should handle empty data', () => {
      const headers: string[] = [];
      const rows: Record<string, unknown>[] = [];
      const result = writeCsv(headers, rows);

      expect(result).toBe('');
    });

    it('should handle null and undefined values', () => {
      const headers = ['name', 'age'];
      const rows = [{ name: 'John', age: null }, { name: 'Jane', age: undefined }];
      const result = writeCsv(headers, rows);

      expect(result).toBe('name,age\nJohn,\nJane,');
    });
  });
});
