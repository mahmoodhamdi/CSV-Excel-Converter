import { describe, it, expect } from 'vitest';
import { parseJson, writeJson, flattenObject } from '@/lib/converter/json';

describe('JSON Parser', () => {
  describe('parseJson', () => {
    it('should parse array of objects', () => {
      const jsonData = '[{"name":"John","age":30},{"name":"Jane","age":25}]';
      const result = parseJson(jsonData);

      expect(result.headers).toEqual(['name', 'age']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({ name: 'John', age: 30 });
    });

    it('should parse single object', () => {
      const jsonData = '{"name":"John","age":30}';
      const result = parseJson(jsonData);

      expect(result.headers).toEqual(['name', 'age']);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({ name: 'John', age: 30 });
    });

    it('should handle nested objects when flatten is true', () => {
      const jsonData = '[{"name":"John","address":{"city":"NYC","zip":"10001"}}]';
      const result = parseJson(jsonData, { flattenNested: true });

      expect(result.headers).toContain('address.city');
      expect(result.headers).toContain('address.zip');
      expect(result.rows[0]['address.city']).toBe('NYC');
    });

    it('should handle arrays within objects', () => {
      const jsonData = '[{"name":"John","tags":["a","b"]}]';
      const result = parseJson(jsonData, { flattenNested: true });

      expect(result.rows[0]['tags']).toBe('a,b');
    });

    it('should return metadata', () => {
      const jsonData = '[{"name":"John"},{"name":"Jane"}]';
      const result = parseJson(jsonData);

      expect(result.metadata?.rowCount).toBe(2);
      expect(result.metadata?.columnCount).toBe(1);
    });

    it('should handle empty array', () => {
      const jsonData = '[]';
      const result = parseJson(jsonData);

      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
    });

    it('should handle invalid JSON gracefully', () => {
      const jsonData = 'invalid json';
      expect(() => parseJson(jsonData)).toThrow();
    });
  });

  describe('writeJson', () => {
    it('should write array of objects', () => {
      const headers = ['name', 'age'];
      const rows = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];
      const result = writeJson(headers, rows);
      const parsed = JSON.parse(result);

      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toEqual({ name: 'John', age: 30 });
    });

    it('should format with pretty print', () => {
      const headers = ['name'];
      const rows = [{ name: 'John' }];
      const result = writeJson(headers, rows, { prettyPrint: true, indentation: 2 });

      expect(result).toContain('\n');
      expect(result).toContain('  ');
    });

    it('should minify when pretty print is false', () => {
      const headers = ['name'];
      const rows = [{ name: 'John' }];
      const result = writeJson(headers, rows, { prettyPrint: false });

      expect(result).not.toContain('\n');
    });

    it('should handle empty data', () => {
      const headers: string[] = [];
      const rows: Record<string, unknown>[] = [];
      const result = writeJson(headers, rows);

      expect(JSON.parse(result)).toEqual([]);
    });
  });

  describe('flattenObject', () => {
    it('should flatten nested object', () => {
      const obj = { a: { b: { c: 1 } } };
      const result = flattenObject(obj);

      expect(result['a.b.c']).toBe(1);
    });

    it('should handle arrays', () => {
      const obj = { tags: ['a', 'b', 'c'] };
      const result = flattenObject(obj);

      expect(result['tags']).toBe('a,b,c');
    });

    it('should handle null values', () => {
      const obj = { name: null, age: 30 };
      const result = flattenObject(obj);

      expect(result['name']).toBe(null);
      expect(result['age']).toBe(30);
    });
  });
});
