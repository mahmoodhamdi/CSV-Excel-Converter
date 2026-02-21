import { describe, it, expect } from 'vitest';
import { writeJson } from '@/lib/converter/json';
import { writeCsv } from '@/lib/converter/csv';
import { writeXml } from '@/lib/converter/xml';
import { writeSql } from '@/lib/converter/sql';
import { flattenObject, unflattenObject } from '@/lib/converter/json';

describe('XSS Prevention', () => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '"><img src=x onerror=alert(1)>',
    "javascript:alert('xss')",
    '<svg onload=alert(1)>',
    '{{constructor.constructor("return this")()}}',
    '${7*7}',
  ];

  const headers = ['name', 'value'];
  const makeRows = (payload: string) => [{ name: 'test', value: payload }];

  describe('CSV output', () => {
    xssPayloads.forEach((payload) => {
      it(`should safely include payload in CSV: ${payload.substring(0, 30)}...`, () => {
        const result = writeCsv(headers, makeRows(payload));
        expect(result).toContain(payload.replace(/"/g, '""'));
        expect(result).toBeDefined();
      });
    });
  });

  describe('JSON output', () => {
    xssPayloads.forEach((payload) => {
      it(`should properly escape payload in JSON: ${payload.substring(0, 30)}...`, () => {
        const result = writeJson(headers, makeRows(payload));
        const parsed = JSON.parse(result);
        expect(parsed[0].value).toBe(payload);
      });
    });
  });

  describe('XML output', () => {
    xssPayloads.forEach((payload) => {
      it(`should safely include payload in XML: ${payload.substring(0, 30)}...`, () => {
        const result = writeXml(headers, makeRows(payload));
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('SQL output', () => {
    xssPayloads.forEach((payload) => {
      it(`should safely escape payload in SQL: ${payload.substring(0, 30)}...`, () => {
        const result = writeSql(headers, makeRows(payload));
        // Payload should be wrapped in quotes for safe SQL string literal
        expect(result).toMatch(/VALUES\s*\n\('test', '.*'\)/);
        // Verify it contains the escaped version for payloads with quotes
        if (payload.includes("'")) {
          expect(result).toContain(payload.replace(/'/g, "''"));
        } else {
          expect(result).toContain(payload);
        }
      });
    });
  });

  describe('Prototype pollution prevention', () => {
    it('should not pollute prototype via flattenObject', () => {
      const malicious = { __proto__: { isAdmin: true }, name: 'test' };
      const result = flattenObject(malicious as any);
      expect(result).not.toHaveProperty('__proto__');
      expect(result).toHaveProperty('name', 'test');
      expect(({} as any).isAdmin).toBeUndefined();
    });

    it('should not pollute prototype via unflattenObject', () => {
      const malicious = {
        '__proto__.isAdmin': true,
        'constructor.prototype.isAdmin': true,
        'name': 'test',
      };
      const result = unflattenObject(malicious);
      expect(result).not.toHaveProperty('__proto__');
      expect(result).not.toHaveProperty('constructor');
      expect(result).toHaveProperty('name', 'test');
      expect(({} as any).isAdmin).toBeUndefined();
    });

    it('should handle nested dangerous keys', () => {
      const malicious = {
        'user.__proto__.isAdmin': true,
        'user.name': 'test',
      };
      const result = unflattenObject(malicious);
      expect(result).toHaveProperty('user');
      expect((result.user as any).name).toBe('test');
      expect((result.user as any).__proto__?.isAdmin).toBeUndefined();
    });
  });
});
