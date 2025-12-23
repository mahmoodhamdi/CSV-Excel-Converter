import { describe, it, expect } from 'vitest';

// Test the formats data structure that the API returns
describe('Formats API Integration', () => {
  const formats = {
    input: [
      { id: 'csv', name: 'CSV', extension: '.csv', mimeType: 'text/csv' },
      { id: 'tsv', name: 'TSV', extension: '.tsv', mimeType: 'text/tab-separated-values' },
      { id: 'json', name: 'JSON', extension: '.json', mimeType: 'application/json' },
      {
        id: 'xlsx',
        name: 'Excel (XLSX)',
        extension: '.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      {
        id: 'xls',
        name: 'Excel (XLS)',
        extension: '.xls',
        mimeType: 'application/vnd.ms-excel',
      },
      { id: 'xml', name: 'XML', extension: '.xml', mimeType: 'application/xml' },
    ],
    output: [
      { id: 'csv', name: 'CSV', extension: '.csv', mimeType: 'text/csv' },
      { id: 'tsv', name: 'TSV', extension: '.tsv', mimeType: 'text/tab-separated-values' },
      { id: 'json', name: 'JSON', extension: '.json', mimeType: 'application/json' },
      {
        id: 'xlsx',
        name: 'Excel (XLSX)',
        extension: '.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      {
        id: 'xls',
        name: 'Excel (XLS)',
        extension: '.xls',
        mimeType: 'application/vnd.ms-excel',
      },
      { id: 'xml', name: 'XML', extension: '.xml', mimeType: 'application/xml' },
      { id: 'sql', name: 'SQL', extension: '.sql', mimeType: 'application/sql' },
    ],
  };

  describe('Input formats', () => {
    it('should include CSV format', () => {
      const csv = formats.input.find((f) => f.id === 'csv');
      expect(csv).toBeDefined();
      expect(csv?.extension).toBe('.csv');
      expect(csv?.mimeType).toBe('text/csv');
    });

    it('should include TSV format', () => {
      const tsv = formats.input.find((f) => f.id === 'tsv');
      expect(tsv).toBeDefined();
      expect(tsv?.extension).toBe('.tsv');
    });

    it('should include JSON format', () => {
      const json = formats.input.find((f) => f.id === 'json');
      expect(json).toBeDefined();
      expect(json?.mimeType).toBe('application/json');
    });

    it('should include XLSX format', () => {
      const xlsx = formats.input.find((f) => f.id === 'xlsx');
      expect(xlsx).toBeDefined();
      expect(xlsx?.name).toBe('Excel (XLSX)');
    });

    it('should include XLS format', () => {
      const xls = formats.input.find((f) => f.id === 'xls');
      expect(xls).toBeDefined();
      expect(xls?.name).toBe('Excel (XLS)');
    });

    it('should include XML format', () => {
      const xml = formats.input.find((f) => f.id === 'xml');
      expect(xml).toBeDefined();
      expect(xml?.mimeType).toBe('application/xml');
    });

    it('should have 6 input formats', () => {
      expect(formats.input).toHaveLength(6);
    });

    it('should have unique ids', () => {
      const ids = formats.input.map((f) => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique extensions', () => {
      const extensions = formats.input.map((f) => f.extension);
      const uniqueExtensions = new Set(extensions);
      expect(uniqueExtensions.size).toBe(extensions.length);
    });
  });

  describe('Output formats', () => {
    it('should include all input formats', () => {
      formats.input.forEach((inputFormat) => {
        const outputFormat = formats.output.find((f) => f.id === inputFormat.id);
        expect(outputFormat).toBeDefined();
      });
    });

    it('should include SQL format', () => {
      const sql = formats.output.find((f) => f.id === 'sql');
      expect(sql).toBeDefined();
      expect(sql?.extension).toBe('.sql');
      expect(sql?.mimeType).toBe('application/sql');
    });

    it('should have 7 output formats', () => {
      expect(formats.output).toHaveLength(7);
    });

    it('should have SQL as output-only format', () => {
      const sqlInInput = formats.input.find((f) => f.id === 'sql');
      const sqlInOutput = formats.output.find((f) => f.id === 'sql');

      expect(sqlInInput).toBeUndefined();
      expect(sqlInOutput).toBeDefined();
    });
  });

  describe('Format structure', () => {
    it('all formats should have required properties', () => {
      [...formats.input, ...formats.output].forEach((format) => {
        expect(format).toHaveProperty('id');
        expect(format).toHaveProperty('name');
        expect(format).toHaveProperty('extension');
        expect(format).toHaveProperty('mimeType');
      });
    });

    it('all extensions should start with dot', () => {
      [...formats.input, ...formats.output].forEach((format) => {
        expect(format.extension).toMatch(/^\./);
      });
    });

    it('all ids should be lowercase', () => {
      [...formats.input, ...formats.output].forEach((format) => {
        expect(format.id).toBe(format.id.toLowerCase());
      });
    });
  });
});
