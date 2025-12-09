import { create } from 'zustand';
import type {
  InputFormat,
  OutputFormat,
  ParsedData,
  ConversionResult,
  ConvertOptions,
  CsvOptions,
  JsonOptions,
  ExcelOptions,
  SqlOptions,
} from '@/types';

interface ConverterState {
  // Input state
  inputData: string | ArrayBuffer | null;
  inputFormat: InputFormat | null;
  fileName: string | null;
  fileSize: number | null;

  // Parsed data
  parsedData: ParsedData | null;
  isParsing: boolean;
  parseError: string | null;

  // Output state
  outputFormat: OutputFormat;
  result: ConversionResult | null;
  isConverting: boolean;
  convertError: string | null;

  // Options
  csvOptions: CsvOptions;
  jsonOptions: JsonOptions;
  excelOptions: ExcelOptions;
  sqlOptions: SqlOptions;

  // Actions
  setInputData: (data: string | ArrayBuffer | null, fileName?: string, fileSize?: number) => void;
  setInputFormat: (format: InputFormat | null) => void;
  setParsedData: (data: ParsedData | null) => void;
  setIsParsing: (isParsing: boolean) => void;
  setParseError: (error: string | null) => void;
  setOutputFormat: (format: OutputFormat) => void;
  setResult: (result: ConversionResult | null) => void;
  setIsConverting: (isConverting: boolean) => void;
  setConvertError: (error: string | null) => void;
  setCsvOptions: (options: Partial<CsvOptions>) => void;
  setJsonOptions: (options: Partial<JsonOptions>) => void;
  setExcelOptions: (options: Partial<ExcelOptions>) => void;
  setSqlOptions: (options: Partial<SqlOptions>) => void;
  getConvertOptions: () => ConvertOptions;
  reset: () => void;
}

const initialState = {
  inputData: null,
  inputFormat: null,
  fileName: null,
  fileSize: null,
  parsedData: null,
  isParsing: false,
  parseError: null,
  outputFormat: 'json' as OutputFormat,
  result: null,
  isConverting: false,
  convertError: null,
  csvOptions: {
    delimiter: ',',
    hasHeader: true,
    skipEmptyLines: true,
    trimValues: true,
  },
  jsonOptions: {
    prettyPrint: true,
    indentation: 2,
    flattenNested: false,
    arrayFormat: 'arrayOfObjects' as const,
  },
  excelOptions: {
    sheetName: 'Sheet1',
    autoFitColumns: true,
    freezeHeader: false,
    headerStyle: true,
  },
  sqlOptions: {
    tableName: 'my_table',
    includeCreate: false,
    batchSize: 100,
  },
};

export const useConverterStore = create<ConverterState>((set, get) => ({
  ...initialState,

  setInputData: (data, fileName, fileSize) =>
    set({
      inputData: data,
      fileName: fileName ?? null,
      fileSize: fileSize ?? null,
      parsedData: null,
      result: null,
      parseError: null,
      convertError: null,
    }),

  setInputFormat: (format) => set({ inputFormat: format }),

  setParsedData: (data) => set({ parsedData: data, parseError: null }),

  setIsParsing: (isParsing) => set({ isParsing }),

  setParseError: (error) => set({ parseError: error, isParsing: false }),

  setOutputFormat: (format) => set({ outputFormat: format, result: null }),

  setResult: (result) => set({ result, isConverting: false, convertError: null }),

  setIsConverting: (isConverting) => set({ isConverting }),

  setConvertError: (error) => set({ convertError: error, isConverting: false }),

  setCsvOptions: (options) =>
    set((state) => ({
      csvOptions: { ...state.csvOptions, ...options },
    })),

  setJsonOptions: (options) =>
    set((state) => ({
      jsonOptions: { ...state.jsonOptions, ...options },
    })),

  setExcelOptions: (options) =>
    set((state) => ({
      excelOptions: { ...state.excelOptions, ...options },
    })),

  setSqlOptions: (options) =>
    set((state) => ({
      sqlOptions: { ...state.sqlOptions, ...options },
    })),

  getConvertOptions: () => {
    const state = get();
    return {
      inputFormat: state.inputFormat ?? undefined,
      outputFormat: state.outputFormat,
      csv: state.csvOptions,
      json: state.jsonOptions,
      excel: state.excelOptions,
      sql: state.sqlOptions,
    };
  },

  reset: () => set(initialState),
}));
