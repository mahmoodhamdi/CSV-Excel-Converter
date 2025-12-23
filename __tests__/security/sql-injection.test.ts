import { describe, it, expect } from 'vitest';
import { writeSql } from '@/lib/converter/sql';

describe('SQL Injection Prevention', () => {
  describe('Value escaping', () => {
    it('should escape single quotes in string values', () => {
      const rows = [{ name: "O'Brien" }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain("O''Brien");
      expect(sql).not.toMatch(/O'Brien[^']/);
    });

    it('should handle DROP TABLE injection in values', () => {
      const rows = [{ name: "'; DROP TABLE users; --" }];
      const sql = writeSql(['name'], rows);

      // The value should be escaped, not executed
      expect(sql).toContain("''; DROP TABLE users; --'");
      // Should not have unescaped injection
      expect(sql).not.toMatch(/';.*DROP TABLE(?! users; --')/);
    });

    it('should handle UNION injection in values', () => {
      const rows = [{ name: "' UNION SELECT * FROM passwords --" }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain("'' UNION SELECT * FROM passwords --'");
    });

    it('should handle OR 1=1 injection in values', () => {
      const rows = [{ name: "' OR '1'='1" }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain("'' OR ''1''=''1'");
    });

    it('should handle semicolon injection', () => {
      const rows = [{ name: "value; DELETE FROM users" }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain("'value; DELETE FROM users'");
    });

    it('should handle comment injection', () => {
      const rows = [{ name: "value /* comment */ more" }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain("'value /* comment */ more'");
    });

    it('should handle double-dash comment injection', () => {
      const rows = [{ name: "value -- comment" }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain("'value -- comment'");
    });

    it('should handle backtick injection', () => {
      const rows = [{ name: "`; DROP TABLE users;`" }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain("'`; DROP TABLE users;`'");
    });

    it('should handle null byte injection', () => {
      const rows = [{ name: "value\x00injection" }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain("value");
    });
  });

  describe('Column name sanitization', () => {
    it('should sanitize column names with SQL keywords', () => {
      const sql = writeSql(['DROP'], [{ DROP: 'value' }]);

      expect(sql).toContain('"DROP"');
    });

    it('should sanitize column names with special characters', () => {
      const sql = writeSql(['col;DROP'], [{ 'col;DROP': 'value' }]);

      expect(sql).not.toContain(';DROP');
      expect(sql).toContain('col_DROP');
    });

    it('should sanitize column names starting with numbers', () => {
      const sql = writeSql(['123col'], [{ '123col': 'value' }]);

      expect(sql).toMatch(/".*123col.*"/);
    });

    it('should handle column names with parentheses', () => {
      const sql = writeSql(['col()'], [{ 'col()': 'value' }]);

      expect(sql).toContain('col__');
    });

    it('should handle column names with quotes', () => {
      const sql = writeSql(['col"quote'], [{ 'col"quote': 'value' }]);

      expect(sql).not.toContain('"quote');
      expect(sql).toContain('col_quote');
    });
  });

  describe('Table name sanitization', () => {
    it('should sanitize table names with SQL keywords', () => {
      const sql = writeSql(['col'], [{ col: 'value' }], { tableName: 'DROP' });

      expect(sql).toContain('"DROP"');
    });

    it('should sanitize table names with special characters', () => {
      const sql = writeSql(['col'], [{ col: 'value' }], { tableName: 'table;DROP' });

      expect(sql).not.toMatch(/table;DROP(?!")/);
    });

    it('should sanitize table names with injection attempts', () => {
      const sql = writeSql(['col'], [{ col: 'value' }], {
        tableName: 'users; DROP TABLE users; --',
      });

      expect(sql).not.toMatch(/; DROP TABLE users(?!_)/);
    });
  });

  describe('Type handling', () => {
    it('should handle NULL values safely', () => {
      const rows = [{ name: null }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain('NULL');
      expect(sql).not.toContain("'null'");
    });

    it('should handle numeric values without quotes', () => {
      const rows = [{ id: 1, amount: 99.99 }];
      const sql = writeSql(['id', 'amount'], rows);

      expect(sql).toContain('1');
      expect(sql).toContain('99.99');
      expect(sql).not.toContain("'1'");
    });

    it('should handle boolean values', () => {
      const rows = [{ active: true, deleted: false }];
      const sql = writeSql(['active', 'deleted'], rows);

      expect(sql).toContain('TRUE');
      expect(sql).toContain('FALSE');
    });

    it('should handle undefined as NULL', () => {
      const rows = [{ name: undefined }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain('NULL');
    });
  });

  describe('Complex injection patterns', () => {
    it('should handle stacked queries', () => {
      const rows = [{ name: "'; INSERT INTO admin VALUES ('hacker'); --" }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain("''; INSERT INTO admin VALUES (''hacker''); --'");
    });

    it('should handle blind SQL injection patterns', () => {
      const rows = [{ name: "' AND 1=1 --" }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain("'' AND 1=1 --'");
    });

    it('should handle time-based injection', () => {
      const rows = [{ name: "'; WAITFOR DELAY '0:0:5'; --" }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain("''; WAITFOR DELAY ''0:0:5''; --'");
    });

    it('should handle second-order injection setup', () => {
      const rows = [{ name: "admin'--" }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain("admin''--");
    });
  });

  describe('Unicode and encoding', () => {
    it('should handle unicode characters safely', () => {
      const rows = [{ name: "日本語テスト" }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain("'日本語テスト'");
    });

    it('should handle emoji', () => {
      const rows = [{ name: "test 👍🎉" }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain("'test 👍🎉'");
    });

    it('should handle RTL characters', () => {
      const rows = [{ name: "مرحبا" }];
      const sql = writeSql(['name'], rows);

      expect(sql).toContain("'مرحبا'");
    });

    it('should handle homoglyph attacks', () => {
      const rows = [{ name: "admin'--" }]; // Using similar-looking quote
      const sql = writeSql(['name'], rows);

      expect(sql).toContain("admin");
    });
  });
});
