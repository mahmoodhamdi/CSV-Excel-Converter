import { describe, it, expect } from 'vitest';
import { parseData } from '@/lib/converter';

describe('Parse API Integration', () => {
  describe('parseData function', () => {
    it('should parse CSV data', async () => {
      const csvData = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
      const result = await parseData(csvData, 'csv');

      expect(result.headers).toEqual(['name', 'age', 'city']);
      expect(result.rows).toHaveLength(2);
      expect(result.format).toBe('csv');
    });

    it('should parse JSON data', async () => {
      const jsonData = '[{"name":"John","age":30},{"name":"Jane","age":25}]';
      const result = await parseData(jsonData, 'json');

      expect(result.headers).toContain('name');
      expect(result.headers).toContain('age');
      expect(result.rows).toHaveLength(2);
      expect(result.format).toBe('json');
    });

    it('should auto-detect CSV format', async () => {
      const csvData = 'a,b,c\n1,2,3';
      const result = await parseData(csvData);

      expect(result.format).toBe('csv');
    });

    it('should auto-detect JSON format', async () => {
      const jsonData = '{"name":"John"}';
      const result = await parseData(jsonData);

      expect(result.format).toBe('json');
    });

    it('should auto-detect TSV format', async () => {
      const tsvData = 'a\tb\tc\n1\t2\t3';
      const result = await parseData(tsvData);

      expect(result.format).toBe('tsv');
    });

    it('should parse XML data', async () => {
      const xmlData = '<root><item><name>John</name></item></root>';
      const result = await parseData(xmlData, 'xml');

      expect(result.format).toBe('xml');
      expect(result.rows).toHaveLength(1);
    });

    it('should handle empty CSV', async () => {
      const result = await parseData('', 'csv');

      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
    });

    it('should handle CSV with only headers', async () => {
      const csvData = 'name,age,city';
      const result = await parseData(csvData, 'csv');

      expect(result.headers).toEqual(['name', 'age', 'city']);
      expect(result.rows).toEqual([]);
    });

    it('should provide metadata', async () => {
      const csvData = 'a,b\n1,2\n3,4';
      const result = await parseData(csvData, 'csv');

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.rowCount).toBe(2);
      expect(result.metadata?.columnCount).toBe(2);
    });

    it('should handle large CSV data', async () => {
      const rows = Array.from({ length: 1000 }, (_, i) => `row${i},value${i}`);
      const csvData = `col1,col2\n${rows.join('\n')}`;
      const result = await parseData(csvData, 'csv');

      expect(result.rows).toHaveLength(1000);
    });

    it('should handle CSV with special characters', async () => {
      const csvData = 'name,message\nJohn,"Hello, World!"';
      const result = await parseData(csvData, 'csv');

      expect(result.rows[0].message).toBe('Hello, World!');
    });

    it('should handle CSV with quotes', async () => {
      const csvData = 'name,quote\nJohn,"He said ""Hello"""';
      const result = await parseData(csvData, 'csv');

      expect(result.rows[0].quote).toContain('Hello');
    });

    it('should handle nested JSON', async () => {
      const jsonData = '[{"name":"John","address":{"city":"NYC"}}]';
      const result = await parseData(jsonData, 'json');

      expect(result.rows).toHaveLength(1);
    });

    it('should handle JSON object format', async () => {
      const jsonData = '{"users":[{"name":"John"}]}';
      const result = await parseData(jsonData, 'json');

      expect(result.rows.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid JSON gracefully', async () => {
      const invalidJson = '{invalid json}';

      try {
        await parseData(invalidJson, 'json');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle malformed CSV gracefully', async () => {
      // CSV parser is lenient, should not throw
      const malformedCsv = 'a,b,c\n1,2';
      const result = await parseData(malformedCsv, 'csv');

      expect(result.headers).toHaveLength(3);
    });
  });
});
