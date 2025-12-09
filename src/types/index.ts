export type InputFormat = 'csv' | 'tsv' | 'json' | 'xlsx' | 'xls' | 'xml';
export type OutputFormat = 'csv' | 'tsv' | 'json' | 'xlsx' | 'xls' | 'xml' | 'sql';

export interface ConvertOptions {
  inputFormat?: InputFormat;
  outputFormat: OutputFormat;
  csv?: CsvOptions;
  json?: JsonOptions;
  excel?: ExcelOptions;
  sql?: SqlOptions;
}

export interface CsvOptions {
  delimiter?: string;
  hasHeader?: boolean;
  skipEmptyLines?: boolean;
  trimValues?: boolean;
  encoding?: string;
}

export interface JsonOptions {
  prettyPrint?: boolean;
  indentation?: number;
  flattenNested?: boolean;
  arrayFormat?: 'arrayOfObjects' | 'objectOfArrays';
}

export interface ExcelOptions {
  sheetName?: string;
  selectedSheet?: number | string;
  includeFormulas?: boolean;
  autoFitColumns?: boolean;
  freezeHeader?: boolean;
  headerStyle?: boolean;
}

export interface SqlOptions {
  tableName?: string;
  includeCreate?: boolean;
  batchSize?: number;
}

export interface ParsedData {
  headers: string[];
  rows: Record<string, unknown>[];
  rawData?: unknown;
  format?: InputFormat;
  metadata?: {
    rowCount: number;
    columnCount: number;
    fileName?: string;
    fileSize?: number;
    sheets?: string[];
  };
}

export interface ConversionResult {
  success: boolean;
  data?: string | Blob;
  format: OutputFormat;
  error?: string;
  metadata?: {
    inputFormat: InputFormat;
    outputFormat: OutputFormat;
    rowCount: number;
    columnCount: number;
  };
}

export interface ConversionHistoryItem {
  id: string;
  timestamp: number;
  inputFormat: InputFormat;
  outputFormat: OutputFormat;
  inputFileName?: string;
  outputFileName?: string;
  rowCount: number;
  columnCount: number;
  data?: string;
}

export interface BatchFile {
  id: string;
  file: File;
  status: 'pending' | 'converting' | 'success' | 'failed';
  result?: ConversionResult;
  error?: string;
}

export interface FilterRule {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string;
}

export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'isEmpty'
  | 'isNotEmpty';

export interface ColumnMapping {
  original: string;
  mapped: string;
  type?: 'string' | 'number' | 'date' | 'boolean' | 'auto';
  dateFormat?: string;
}

export interface TransformOptions {
  columnMappings?: ColumnMapping[];
  filters?: FilterRule[];
  removeDuplicates?: boolean;
  trimWhitespace?: boolean;
  selectedColumns?: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
