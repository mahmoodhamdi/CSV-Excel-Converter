import { describe, it, expect } from 'vitest';
import { parseData, convertData } from '@/lib/converter';

describe('Converter Integration', () => {
  describe('CSV to JSON conversion', () => {
    it('should convert CSV string to JSON', async () => {
      const csvData = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
      const parsed = await parseData(csvData, 'csv');

      expect(parsed.headers).toEqual(['name', 'age', 'city']);
      expect(parsed.rows).toHaveLength(2);

      const result = convertData(parsed, { outputFormat: 'json' });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const jsonOutput = JSON.parse(result.data as string);
      expect(jsonOutput).toHaveLength(2);
      expect(jsonOutput[0].name).toBe('John');
    });
  });

  describe('JSON to CSV conversion', () => {
    it('should convert JSON to CSV', async () => {
      const jsonData = '[{"name":"John","age":30},{"name":"Jane","age":25}]';
      const parsed = await parseData(jsonData, 'json');

      expect(parsed.headers).toContain('name');
      expect(parsed.headers).toContain('age');
      expect(parsed.rows).toHaveLength(2);

      const result = convertData(parsed, { outputFormat: 'csv' });

      expect(result.success).toBe(true);
      expect(result.data).toContain('name,age');
      expect(result.data).toContain('John,30');
    });
  });

  describe('Auto format detection', () => {
    it('should auto-detect JSON format', async () => {
      const jsonData = '[{"name":"John"}]';
      const parsed = await parseData(jsonData);

      expect(parsed.format).toBe('json');
    });

    it('should auto-detect CSV format', async () => {
      const csvData = 'name,age\nJohn,30';
      const parsed = await parseData(csvData);

      expect(parsed.format).toBe('csv');
    });

    it('should auto-detect TSV format', async () => {
      const tsvData = 'name\tage\nJohn\t30';
      const parsed = await parseData(tsvData);

      expect(parsed.format).toBe('tsv');
    });
  });

  describe('SQL generation', () => {
    it('should generate SQL INSERT statements', async () => {
      const csvData = 'name,age\nJohn,30\nJane,25';
      const parsed = await parseData(csvData, 'csv');

      const result = convertData(parsed, {
        outputFormat: 'sql',
        sql: { tableName: 'users', includeCreate: true },
      });

      expect(result.success).toBe(true);
      expect(result.data).toContain('CREATE TABLE users');
      expect(result.data).toContain('INSERT INTO users');
      expect(result.data).toContain("'John'");
    });
  });

  describe('XML conversion', () => {
    it('should convert to XML format', async () => {
      const csvData = 'name,age\nJohn,30';
      const parsed = await parseData(csvData, 'csv');

      const result = convertData(parsed, { outputFormat: 'xml' });

      expect(result.success).toBe(true);
      expect(result.data).toContain('<?xml');
      expect(result.data).toContain('John');
    });
  });

  describe('Excel conversion', () => {
    it('should convert to Excel format', async () => {
      const csvData = 'name,age\nJohn,30';
      const parsed = await parseData(csvData, 'csv');

      const result = convertData(parsed, {
        outputFormat: 'xlsx',
        excel: { sheetName: 'Data' },
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Blob);
    });
  });
});
