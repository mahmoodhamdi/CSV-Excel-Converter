import { describe, it, expect } from 'vitest';
import {
  inputFormatSchema,
  outputFormatSchema,
  csvOptionsSchema,
  jsonOptionsSchema,
  excelOptionsSchema,
  sqlOptionsSchema,
  convertRequestSchema,
  parseRequestSchema,
  fileMetadataSchema,
  validateConvertRequest,
  validateParseRequest,
  validateSqlOptions,
  validateExcelOptions,
} from '@/lib/validation/schemas';

describe('Validation Schemas', () => {
  describe('inputFormatSchema', () => {
    it('should accept valid input formats', () => {
      const validFormats = ['csv', 'tsv', 'json', 'xlsx', 'xls', 'xml'];
      validFormats.forEach((format) => {
        const result = inputFormatSchema.safeParse(format);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid input formats', () => {
      const invalidFormats = ['txt', 'pdf', 'doc', '', 'SQL'];
      invalidFormats.forEach((format) => {
        const result = inputFormatSchema.safeParse(format);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('outputFormatSchema', () => {
    it('should accept valid output formats', () => {
      const validFormats = ['csv', 'tsv', 'json', 'xlsx', 'xls', 'xml', 'sql'];
      validFormats.forEach((format) => {
        const result = outputFormatSchema.safeParse(format);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid output formats', () => {
      const invalidFormats = ['txt', 'pdf', '', 'CSV'];
      invalidFormats.forEach((format) => {
        const result = outputFormatSchema.safeParse(format);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('csvOptionsSchema', () => {
    it('should accept valid CSV options', () => {
      const validOptions = {
        delimiter: ',',
        hasHeader: true,
        skipEmptyLines: true,
        trimValues: false,
      };
      const result = csvOptionsSchema.safeParse(validOptions);
      expect(result.success).toBe(true);
    });

    it('should accept partial options', () => {
      const partialOptions = { delimiter: ';' };
      const result = csvOptionsSchema.safeParse(partialOptions);
      expect(result.success).toBe(true);
    });

    it('should reject delimiter longer than one character', () => {
      const invalidOptions = { delimiter: ';;' };
      const result = csvOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0]?.message).toContain('exactly one character');
    });

    it('should accept empty object', () => {
      const result = csvOptionsSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('jsonOptionsSchema', () => {
    it('should accept valid JSON options', () => {
      const validOptions = {
        prettyPrint: true,
        indentation: 4,
        flattenNested: false,
        arrayFormat: 'arrayOfObjects',
      };
      const result = jsonOptionsSchema.safeParse(validOptions);
      expect(result.success).toBe(true);
    });

    it('should reject negative indentation', () => {
      const invalidOptions = { indentation: -1 };
      const result = jsonOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0]?.message).toContain('non-negative');
    });

    it('should reject indentation greater than 8', () => {
      const invalidOptions = { indentation: 10 };
      const result = jsonOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0]?.message).toContain('cannot exceed 8');
    });

    it('should accept valid array formats', () => {
      const formats = ['arrayOfObjects', 'objectOfArrays'];
      formats.forEach((format) => {
        const result = jsonOptionsSchema.safeParse({ arrayFormat: format });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid array format', () => {
      const result = jsonOptionsSchema.safeParse({ arrayFormat: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('excelOptionsSchema', () => {
    it('should accept valid Excel options', () => {
      const validOptions = {
        sheetName: 'Data',
        autoFitColumns: true,
        freezeHeader: false,
        headerStyle: true,
      };
      const result = excelOptionsSchema.safeParse(validOptions);
      expect(result.success).toBe(true);
    });

    it('should reject empty sheet name', () => {
      const invalidOptions = { sheetName: '' };
      const result = excelOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0]?.message).toContain('required');
    });

    it('should reject sheet name longer than 31 characters', () => {
      const invalidOptions = { sheetName: 'A'.repeat(32) };
      const result = excelOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0]?.message).toContain('cannot exceed 31 characters');
    });

    it('should reject sheet name with invalid characters', () => {
      const invalidChars = ['*', '?', ':', '/', '\\', '[', ']'];
      invalidChars.forEach((char) => {
        const result = excelOptionsSchema.safeParse({ sheetName: `Sheet${char}1` });
        expect(result.success).toBe(false);
        expect(result.error?.errors[0]?.message).toContain('invalid characters');
      });
    });

    it('should accept valid sheet names', () => {
      const validNames = ['Sheet1', 'My Data', 'Report-2024', 'Sales_Q1'];
      validNames.forEach((name) => {
        const result = excelOptionsSchema.safeParse({ sheetName: name });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('sqlOptionsSchema', () => {
    it('should accept valid SQL options', () => {
      const validOptions = {
        tableName: 'users',
        includeCreate: true,
        batchSize: 100,
        dialect: 'postgresql',
      };
      const result = sqlOptionsSchema.safeParse(validOptions);
      expect(result.success).toBe(true);
    });

    it('should reject empty table name', () => {
      const invalidOptions = { tableName: '' };
      const result = sqlOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0]?.message).toContain('required');
    });

    it('should reject table name longer than 128 characters', () => {
      const invalidOptions = { tableName: 'a'.repeat(129) };
      const result = sqlOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0]?.message).toContain('cannot exceed 128 characters');
    });

    it('should reject table name starting with number', () => {
      const invalidOptions = { tableName: '123table' };
      const result = sqlOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0]?.message).toContain('must start with a letter');
    });

    it('should reject table name with special characters', () => {
      const invalidNames = ['table-name', 'table.name', 'table name', 'table@name'];
      invalidNames.forEach((name) => {
        const result = sqlOptionsSchema.safeParse({ tableName: name });
        expect(result.success).toBe(false);
      });
    });

    it('should accept valid table names', () => {
      const validNames = ['users', '_private', 'User123', 'my_table_name'];
      validNames.forEach((name) => {
        const result = sqlOptionsSchema.safeParse({ tableName: name });
        expect(result.success).toBe(true);
      });
    });

    it('should reject batch size less than 1', () => {
      const invalidOptions = { batchSize: 0 };
      const result = sqlOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0]?.message).toContain('at least 1');
    });

    it('should reject batch size greater than 10000', () => {
      const invalidOptions = { batchSize: 10001 };
      const result = sqlOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0]?.message).toContain('cannot exceed 10000');
    });

    it('should accept valid SQL dialects', () => {
      const dialects = ['mysql', 'postgresql', 'sqlite', 'mssql'];
      dialects.forEach((dialect) => {
        const result = sqlOptionsSchema.safeParse({ dialect });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('convertRequestSchema', () => {
    it('should accept valid convert request', () => {
      const validRequest = {
        data: 'name,age\nJohn,30',
        outputFormat: 'json',
      };
      const result = convertRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should accept request with input format', () => {
      const validRequest = {
        data: 'name,age\nJohn,30',
        inputFormat: 'csv',
        outputFormat: 'json',
      };
      const result = convertRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject empty data', () => {
      const invalidRequest = {
        data: '',
        outputFormat: 'json',
      };
      const result = convertRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0]?.message).toContain('required');
    });

    it('should reject missing output format', () => {
      const invalidRequest = {
        data: 'some data',
      };
      const result = convertRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should accept request with options', () => {
      const validRequest = {
        data: 'name,age\nJohn,30',
        outputFormat: 'json',
        options: {
          json: { prettyPrint: true },
        },
      };
      const result = convertRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });
  });

  describe('parseRequestSchema', () => {
    it('should accept valid parse request', () => {
      const validRequest = {
        data: '{"name": "John"}',
      };
      const result = parseRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should accept request with format', () => {
      const validRequest = {
        data: '{"name": "John"}',
        format: 'json',
      };
      const result = parseRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject empty data', () => {
      const invalidRequest = {
        data: '',
      };
      const result = parseRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('fileMetadataSchema', () => {
    it('should accept valid file metadata', () => {
      const validMetadata = {
        fileName: 'test.csv',
        fileSize: 1024,
        mimeType: 'text/csv',
        lastModified: Date.now(),
      };
      const result = fileMetadataSchema.safeParse(validMetadata);
      expect(result.success).toBe(true);
    });

    it('should reject empty file name', () => {
      const invalidMetadata = {
        fileName: '',
        fileSize: 1024,
      };
      const result = fileMetadataSchema.safeParse(invalidMetadata);
      expect(result.success).toBe(false);
    });

    it('should reject negative file size', () => {
      const invalidMetadata = {
        fileName: 'test.csv',
        fileSize: -1,
      };
      const result = fileMetadataSchema.safeParse(invalidMetadata);
      expect(result.success).toBe(false);
    });

    it('should accept file metadata without optional fields', () => {
      const minimalMetadata = {
        fileName: 'test.csv',
        fileSize: 100,
      };
      const result = fileMetadataSchema.safeParse(minimalMetadata);
      expect(result.success).toBe(true);
    });
  });

  describe('Validation Helper Functions', () => {
    describe('validateConvertRequest', () => {
      it('should return success for valid request', () => {
        const result = validateConvertRequest({
          data: 'test data',
          outputFormat: 'json',
        });
        expect(result.success).toBe(true);
      });

      it('should return error for invalid request', () => {
        const result = validateConvertRequest({
          data: '',
          outputFormat: 'invalid',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('validateParseRequest', () => {
      it('should return success for valid request', () => {
        const result = validateParseRequest({
          data: 'test data',
        });
        expect(result.success).toBe(true);
      });

      it('should return error for invalid request', () => {
        const result = validateParseRequest({
          data: '',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('validateSqlOptions', () => {
      it('should return success for valid options', () => {
        const result = validateSqlOptions({
          tableName: 'users',
          includeCreate: true,
        });
        expect(result.success).toBe(true);
      });

      it('should return error for invalid table name', () => {
        const result = validateSqlOptions({
          tableName: '123invalid',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('validateExcelOptions', () => {
      it('should return success for valid options', () => {
        const result = validateExcelOptions({
          sheetName: 'Data',
          headerStyle: true,
        });
        expect(result.success).toBe(true);
      });

      it('should return error for invalid sheet name', () => {
        const result = validateExcelOptions({
          sheetName: 'Sheet*Name',
        });
        expect(result.success).toBe(false);
      });
    });
  });
});
