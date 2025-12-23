import { describe, it, expect } from 'vitest';
import { writeSql } from '@/lib/converter/sql';

describe('SQL Generator', () => {
  describe('writeSql', () => {
    it('should generate INSERT statements', () => {
      const headers = ['name', 'age'];
      const rows = [{ name: 'John', age: 30 }];

      const sql = writeSql(headers, rows);

      expect(sql).toContain('INSERT INTO');
      expect(sql).toContain('VALUES');
      expect(sql).toContain('my_table');
    });

    it('should use default table name', () => {
      const sql = writeSql(['col1'], [{ col1: 'test' }]);

      expect(sql).toContain('my_table');
    });

    it('should use custom table name', () => {
      const sql = writeSql(['col1'], [{ col1: 'test' }], { tableName: 'users' });

      expect(sql).toContain('users');
      expect(sql).not.toContain('my_table');
    });

    it('should create table when includeCreate is true', () => {
      const sql = writeSql(['name', 'age'], [{ name: 'test', age: 25 }], {
        includeCreate: true
      });

      expect(sql).toContain('CREATE TABLE');
      expect(sql).toContain('name TEXT');
      expect(sql).toContain('age TEXT');
    });

    it('should not create table by default', () => {
      const sql = writeSql(['col1'], [{ col1: 'test' }]);

      expect(sql).not.toContain('CREATE TABLE');
    });

    it('should batch inserts according to batchSize', () => {
      const rows = Array.from({ length: 10 }, (_, i) => ({ col1: `val${i}` }));
      const sql = writeSql(['col1'], rows, { batchSize: 3 });

      const insertCount = (sql.match(/INSERT INTO/g) || []).length;
      expect(insertCount).toBe(4); // 3 + 3 + 3 + 1
    });

    it('should use default batchSize of 100', () => {
      const rows = Array.from({ length: 50 }, (_, i) => ({ col1: `val${i}` }));
      const sql = writeSql(['col1'], rows);

      const insertCount = (sql.match(/INSERT INTO/g) || []).length;
      expect(insertCount).toBe(1); // All 50 fit in one batch
    });

    it('should handle NULL values', () => {
      const rows = [{ name: null, age: undefined }];
      const sql = writeSql(['name', 'age'], rows);

      expect(sql).toContain('NULL');
    });

    it('should handle numeric values without quotes', () => {
      const rows = [{ count: 42, price: 19.99 }];
      const sql = writeSql(['count', 'price'], rows);

      expect(sql).toContain('42');
      expect(sql).toContain('19.99');
      expect(sql).not.toContain("'42'");
    });

    it('should handle boolean values', () => {
      const rows = [{ active: true, disabled: false }];
      const sql = writeSql(['active', 'disabled'], rows);

      expect(sql).toContain('TRUE');
      expect(sql).toContain('FALSE');
    });

    it('should handle string values with quotes', () => {
      const rows = [{ name: 'John' }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain("'John'");
    });

    it('should include header list in INSERT statement', () => {
      const sql = writeSql(['name', 'age', 'city'], [{ name: 'John', age: 30, city: 'NYC' }]);

      expect(sql).toMatch(/INSERT INTO \w+ \(.*name.*,.*age.*,.*city.*\)/);
    });

    it('should handle empty rows array', () => {
      const sql = writeSql(['col1'], []);

      expect(sql).toBe('');
    });

    it('should handle empty headers array', () => {
      const sql = writeSql([], [{ a: 1 }]);

      expect(sql).toContain('INSERT INTO');
      expect(sql).toContain('VALUES');
    });

    it('should handle multiple rows in single batch', () => {
      const rows = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];
      const sql = writeSql(['name', 'age'], rows);

      expect(sql).toContain("'John'");
      expect(sql).toContain("'Jane'");
      expect(sql).toContain('30');
      expect(sql).toContain('25');
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should escape single quotes in values', () => {
      const rows = [{ name: "O'Brien" }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain("O''Brien");
      expect(sql).not.toContain("O'Brien'");
    });

    it('should escape multiple single quotes', () => {
      const rows = [{ text: "It's John's book" }];
      const sql = writeSql(['text'], rows);

      expect(sql).toContain("It''s John''s book");
    });

    it('should handle values with only quotes', () => {
      const rows = [{ quote: "'''" }];
      const sql = writeSql(['quote'], rows);

      expect(sql).toContain("''''''");
    });

    it('should sanitize column names with special characters', () => {
      const rows = [{ 'col name': 'value' }];
      const sql = writeSql(['col name'], rows);

      // Special characters should be replaced with underscores
      expect(sql).toContain('col_name');
    });

    it('should sanitize table name with special characters', () => {
      const sql = writeSql(['col'], [{ col: 'x' }], {
        tableName: 'my table!'
      });

      expect(sql).toContain('my_table_');
      expect(sql).not.toContain('my table!');
    });

    it('should prevent SQL injection in values', () => {
      const rows = [{ name: "'; DROP TABLE users;--" }];
      const sql = writeSql(['name'], rows);

      // The single quote should be escaped (doubled)
      expect(sql).toContain("''");
      // The dangerous input should be wrapped in quotes, making it a safe string literal
      expect(sql).toMatch(/VALUES\s*\n\('.*DROP TABLE.*'\)/);
    });

    it('should handle semicolons in values', () => {
      const rows = [{ cmd: 'command; another' }];
      const sql = writeSql(['cmd'], rows);

      expect(sql).toContain("'command; another'");
    });

    it('should handle double dashes in values', () => {
      const rows = [{ comment: 'text -- more text' }];
      const sql = writeSql(['comment'], rows);

      expect(sql).toContain("'text -- more text'");
    });

    it('should sanitize column names starting with numbers', () => {
      const sql = writeSql(['123column'], [{ '123column': 'value' }]);

      // Should be quoted because it starts with a number
      expect(sql).toMatch(/".*123.*"/);
    });

    it('should quote reserved SQL words in column names', () => {
      const sql = writeSql(['SELECT', 'FROM', 'WHERE'], [{ SELECT: 1, FROM: 2, WHERE: 3 }]);

      // Reserved words should be quoted
      expect(sql).toContain('"SELECT"');
      expect(sql).toContain('"FROM"');
      expect(sql).toContain('"WHERE"');
    });

    it('should handle unicode characters', () => {
      const rows = [{ name: '日本語テスト' }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain("'日本語テスト'");
    });

    it('should handle emoji in values', () => {
      const rows = [{ emoji: '👍🎉' }];
      const sql = writeSql(['emoji'], rows);

      expect(sql).toContain("'👍🎉'");
    });

    it('should handle backslashes in values', () => {
      const rows = [{ path: 'C:\\Users\\test' }];
      const sql = writeSql(['path'], rows);

      expect(sql).toContain("'C:\\Users\\test'");
    });

    it('should handle newlines in values', () => {
      const rows = [{ text: 'line1\nline2' }];
      const sql = writeSql(['text'], rows);

      expect(sql).toContain("'line1\nline2'");
    });

    it('should handle tabs in values', () => {
      const rows = [{ text: 'col1\tcol2' }];
      const sql = writeSql(['text'], rows);

      expect(sql).toContain("'col1\tcol2'");
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long column names', () => {
      const longName = 'a'.repeat(100);
      const sql = writeSql([longName], [{ [longName]: 'value' }]);

      expect(sql).toContain(longName);
    });

    it('should handle very long values', () => {
      const longValue = 'x'.repeat(10000);
      const rows = [{ col: longValue }];
      const sql = writeSql(['col'], rows);

      expect(sql).toContain(longValue);
    });

    it('should handle many columns', () => {
      const headers = Array.from({ length: 50 }, (_, i) => `col${i}`);
      const row: Record<string, unknown> = {};
      headers.forEach((h, i) => (row[h] = i));

      const sql = writeSql(headers, [row]);

      headers.forEach(h => {
        expect(sql).toContain(h);
      });
    });

    it('should handle many rows efficiently', () => {
      const rows = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `name${i}` }));
      const sql = writeSql(['id', 'name'], rows, { batchSize: 100 });

      const insertCount = (sql.match(/INSERT INTO/g) || []).length;
      expect(insertCount).toBe(10);
    });

    it('should handle mixed data types in same column', () => {
      const rows = [
        { data: 'string' },
        { data: 123 },
        { data: true },
        { data: null },
      ];
      const sql = writeSql(['data'], rows);

      expect(sql).toContain("'string'");
      expect(sql).toContain('123');
      expect(sql).toContain('TRUE');
      expect(sql).toContain('NULL');
    });

    it('should handle row with missing columns', () => {
      const rows = [
        { a: 1, b: 2 },
        { a: 3 }, // missing 'b'
      ];
      const sql = writeSql(['a', 'b'], rows);

      expect(sql).toContain('NULL');
    });

    it('should handle empty string values', () => {
      const rows = [{ name: '' }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain("''");
    });

    it('should handle column name that is just underscore', () => {
      const sql = writeSql(['_'], [{ '_': 'value' }]);

      expect(sql).toContain('_');
    });

    it('should handle column name with only special chars', () => {
      const sql = writeSql(['@#$'], [{ '@#$': 'value' }]);

      // Should be sanitized to underscores
      expect(sql).toContain('___');
    });
  });

  describe('CREATE TABLE Statement', () => {
    it('should create columns with TEXT type', () => {
      const sql = writeSql(['name', 'age'], [{ name: 'John', age: 30 }], {
        includeCreate: true
      });

      expect(sql).toContain('name TEXT');
      expect(sql).toContain('age TEXT');
    });

    it('should create table before INSERT statements', () => {
      const sql = writeSql(['col'], [{ col: 'val' }], { includeCreate: true });

      const createIndex = sql.indexOf('CREATE TABLE');
      const insertIndex = sql.indexOf('INSERT INTO');

      expect(createIndex).toBeLessThan(insertIndex);
    });

    it('should use proper CREATE TABLE syntax', () => {
      const sql = writeSql(['a', 'b'], [{ a: 1, b: 2 }], {
        includeCreate: true,
        tableName: 'test_table'
      });

      expect(sql).toMatch(/CREATE TABLE test_table \(/);
      expect(sql).toContain(');');
    });

    it('should quote reserved words in CREATE TABLE', () => {
      const sql = writeSql(['SELECT', 'ORDER'], [{ SELECT: 1, ORDER: 2 }], {
        includeCreate: true
      });

      expect(sql).toContain('"SELECT" TEXT');
      expect(sql).toContain('"ORDER" TEXT');
    });
  });

  describe('Output Format', () => {
    it('should have VALUES on separate line', () => {
      const sql = writeSql(['col'], [{ col: 'val' }]);

      expect(sql).toContain('\nVALUES\n');
    });

    it('should separate batches with empty lines', () => {
      const rows = Array.from({ length: 3 }, (_, i) => ({ col: i }));
      const sql = writeSql(['col'], rows, { batchSize: 1 });

      expect(sql).toContain('\n\n');
    });

    it('should end statements with semicolon', () => {
      const sql = writeSql(['col'], [{ col: 'val' }]);

      expect(sql).toMatch(/;\s*$/);
    });

    it('should format multiple values with commas', () => {
      const rows = [{ col: 'a' }, { col: 'b' }];
      const sql = writeSql(['col'], rows);

      expect(sql).toMatch(/\('a'\),\n\('b'\)/);
    });
  });
});
