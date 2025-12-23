import { z } from 'zod';

// ============================================
// Base Format Schemas
// ============================================

export const inputFormatSchema = z.enum(['csv', 'tsv', 'json', 'xlsx', 'xls', 'xml']);
export const outputFormatSchema = z.enum(['csv', 'tsv', 'json', 'xlsx', 'xls', 'xml', 'sql']);

// ============================================
// Option Schemas
// ============================================

export const csvOptionsSchema = z.object({
  delimiter: z.string().length(1, 'Delimiter must be exactly one character').default(','),
  hasHeader: z.boolean().default(true),
  skipEmptyLines: z.boolean().default(true),
  trimValues: z.boolean().default(true),
  encoding: z.string().optional(),
}).partial();

export const jsonOptionsSchema = z.object({
  prettyPrint: z.boolean().default(true),
  indentation: z.number().min(0, 'Indentation must be non-negative').max(8, 'Indentation cannot exceed 8').default(2),
  flattenNested: z.boolean().default(false),
  arrayFormat: z.enum(['arrayOfObjects', 'objectOfArrays']).default('arrayOfObjects'),
}).partial();

export const excelOptionsSchema = z.object({
  sheetName: z.string()
    .min(1, 'Sheet name is required')
    .max(31, 'Sheet name cannot exceed 31 characters')
    .regex(/^[^*?:/\\[\]]+$/, 'Sheet name contains invalid characters (*?:/\\[])')
    .default('Sheet1'),
  selectedSheet: z.union([z.number(), z.string()]).optional(),
  includeFormulas: z.boolean().optional(),
  autoFitColumns: z.boolean().default(true),
  freezeHeader: z.boolean().default(false),
  headerStyle: z.boolean().default(true),
}).partial();

export const sqlOptionsSchema = z.object({
  tableName: z.string()
    .min(1, 'Table name is required')
    .max(128, 'Table name cannot exceed 128 characters')
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Table name must start with a letter or underscore and contain only letters, numbers, and underscores')
    .default('my_table'),
  includeCreate: z.boolean().default(false),
  batchSize: z.number().min(1, 'Batch size must be at least 1').max(10000, 'Batch size cannot exceed 10000').default(100),
  dialect: z.enum(['mysql', 'postgresql', 'sqlite', 'mssql']).default('postgresql'),
}).partial();

// ============================================
// Convert Options Schema
// ============================================

export const convertOptionsSchema = z.object({
  inputFormat: inputFormatSchema.optional(),
  outputFormat: outputFormatSchema,
  csv: csvOptionsSchema.optional(),
  json: jsonOptionsSchema.optional(),
  excel: excelOptionsSchema.optional(),
  sql: sqlOptionsSchema.optional(),
});

// ============================================
// API Request Schemas
// ============================================

const MAX_DATA_SIZE = 50 * 1024 * 1024; // 50MB

export const convertRequestSchema = z.object({
  data: z.string()
    .min(1, 'Data is required')
    .max(MAX_DATA_SIZE, 'Data exceeds maximum size of 50MB'),
  inputFormat: inputFormatSchema.optional(),
  outputFormat: outputFormatSchema,
  options: convertOptionsSchema.partial().optional(),
  fileName: z.string().optional(),
});

export const parseRequestSchema = z.object({
  data: z.string()
    .min(1, 'Data is required')
    .max(MAX_DATA_SIZE, 'Data exceeds maximum size of 50MB'),
  format: inputFormatSchema.optional(),
});

// ============================================
// File Metadata Schema
// ============================================

export const fileMetadataSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().min(0).max(MAX_DATA_SIZE),
  mimeType: z.string().optional(),
  lastModified: z.number().optional(),
});

// ============================================
// Type Exports
// ============================================

export type InputFormat = z.infer<typeof inputFormatSchema>;
export type OutputFormat = z.infer<typeof outputFormatSchema>;
export type CsvOptions = z.infer<typeof csvOptionsSchema>;
export type JsonOptions = z.infer<typeof jsonOptionsSchema>;
export type ExcelOptions = z.infer<typeof excelOptionsSchema>;
export type SqlOptions = z.infer<typeof sqlOptionsSchema>;
export type ConvertOptions = z.infer<typeof convertOptionsSchema>;
export type ConvertRequest = z.infer<typeof convertRequestSchema>;
export type ParseRequest = z.infer<typeof parseRequestSchema>;
export type FileMetadata = z.infer<typeof fileMetadataSchema>;

// ============================================
// Validation Helpers
// ============================================

export function validateConvertRequest(data: unknown) {
  return convertRequestSchema.safeParse(data);
}

export function validateParseRequest(data: unknown) {
  return parseRequestSchema.safeParse(data);
}

export function validateSqlOptions(data: unknown) {
  return sqlOptionsSchema.safeParse(data);
}

export function validateExcelOptions(data: unknown) {
  return excelOptionsSchema.safeParse(data);
}
