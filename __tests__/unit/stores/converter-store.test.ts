import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useConverterStore } from '@/stores/converter-store';

describe('useConverterStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useConverterStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('initial state', () => {
    it('should have null input data', () => {
      const { result } = renderHook(() => useConverterStore());
      expect(result.current.inputData).toBeNull();
    });

    it('should have null input format', () => {
      const { result } = renderHook(() => useConverterStore());
      expect(result.current.inputFormat).toBeNull();
    });

    it('should have null file name', () => {
      const { result } = renderHook(() => useConverterStore());
      expect(result.current.fileName).toBeNull();
    });

    it('should have null file size', () => {
      const { result } = renderHook(() => useConverterStore());
      expect(result.current.fileSize).toBeNull();
    });

    it('should have null parsed data', () => {
      const { result } = renderHook(() => useConverterStore());
      expect(result.current.parsedData).toBeNull();
    });

    it('should have json as default output format', () => {
      const { result } = renderHook(() => useConverterStore());
      expect(result.current.outputFormat).toBe('json');
    });

    it('should not be parsing initially', () => {
      const { result } = renderHook(() => useConverterStore());
      expect(result.current.isParsing).toBe(false);
    });

    it('should not be converting initially', () => {
      const { result } = renderHook(() => useConverterStore());
      expect(result.current.isConverting).toBe(false);
    });

    it('should have null parse error', () => {
      const { result } = renderHook(() => useConverterStore());
      expect(result.current.parseError).toBeNull();
    });

    it('should have null convert error', () => {
      const { result } = renderHook(() => useConverterStore());
      expect(result.current.convertError).toBeNull();
    });

    it('should have null result', () => {
      const { result } = renderHook(() => useConverterStore());
      expect(result.current.result).toBeNull();
    });

    it('should have default CSV options', () => {
      const { result } = renderHook(() => useConverterStore());
      expect(result.current.csvOptions.delimiter).toBe(',');
      expect(result.current.csvOptions.hasHeader).toBe(true);
      expect(result.current.csvOptions.skipEmptyLines).toBe(true);
      expect(result.current.csvOptions.trimValues).toBe(true);
    });

    it('should have default JSON options', () => {
      const { result } = renderHook(() => useConverterStore());
      expect(result.current.jsonOptions.prettyPrint).toBe(true);
      expect(result.current.jsonOptions.indentation).toBe(2);
      expect(result.current.jsonOptions.flattenNested).toBe(false);
      expect(result.current.jsonOptions.arrayFormat).toBe('arrayOfObjects');
    });

    it('should have default Excel options', () => {
      const { result } = renderHook(() => useConverterStore());
      expect(result.current.excelOptions.sheetName).toBe('Sheet1');
      expect(result.current.excelOptions.autoFitColumns).toBe(true);
      expect(result.current.excelOptions.freezeHeader).toBe(false);
      expect(result.current.excelOptions.headerStyle).toBe(true);
    });

    it('should have default SQL options', () => {
      const { result } = renderHook(() => useConverterStore());
      expect(result.current.sqlOptions.tableName).toBe('my_table');
      expect(result.current.sqlOptions.includeCreate).toBe(false);
      expect(result.current.sqlOptions.batchSize).toBe(100);
    });
  });

  describe('setInputData', () => {
    it('should set input data', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setInputData('test data', 'test.csv', 100);
      });

      expect(result.current.inputData).toBe('test data');
      expect(result.current.fileName).toBe('test.csv');
      expect(result.current.fileSize).toBe(100);
    });

    it('should set ArrayBuffer as input data', () => {
      const { result } = renderHook(() => useConverterStore());
      const buffer = new ArrayBuffer(8);

      act(() => {
        result.current.setInputData(buffer, 'test.xlsx', 8);
      });

      expect(result.current.inputData).toBe(buffer);
    });

    it('should clear parsed data when setting new input', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setParsedData({
          headers: ['a'],
          rows: [{ a: 1 }],
          format: 'csv',
          metadata: { rowCount: 1, columnCount: 1 },
        });
      });

      act(() => {
        result.current.setInputData('new data');
      });

      expect(result.current.parsedData).toBeNull();
    });

    it('should clear result when setting new input', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setResult({ success: true, format: 'json', data: '{}' });
      });

      act(() => {
        result.current.setInputData('new data');
      });

      expect(result.current.result).toBeNull();
    });

    it('should clear errors when setting new input', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setParseError('Error');
        result.current.setConvertError('Error');
      });

      act(() => {
        result.current.setInputData('new data');
      });

      expect(result.current.parseError).toBeNull();
      expect(result.current.convertError).toBeNull();
    });

    it('should handle null input', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setInputData(null);
      });

      expect(result.current.inputData).toBeNull();
      expect(result.current.fileName).toBeNull();
      expect(result.current.fileSize).toBeNull();
    });
  });

  describe('setInputFormat', () => {
    it('should set input format', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setInputFormat('csv');
      });

      expect(result.current.inputFormat).toBe('csv');
    });

    it('should handle null format', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setInputFormat('csv');
        result.current.setInputFormat(null);
      });

      expect(result.current.inputFormat).toBeNull();
    });
  });

  describe('setParsedData', () => {
    it('should set parsed data', () => {
      const { result } = renderHook(() => useConverterStore());
      const data = {
        headers: ['name', 'age'],
        rows: [{ name: 'John', age: 30 }],
        format: 'csv' as const,
        metadata: { rowCount: 1, columnCount: 2 },
      };

      act(() => {
        result.current.setParsedData(data);
      });

      expect(result.current.parsedData).toEqual(data);
    });

    it('should clear parse error when setting data', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setParseError('Error');
        result.current.setParsedData({
          headers: ['a'],
          rows: [],
          format: 'csv',
          metadata: { rowCount: 0, columnCount: 1 },
        });
      });

      expect(result.current.parseError).toBeNull();
    });
  });

  describe('setIsParsing', () => {
    it('should set isParsing to true', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setIsParsing(true);
      });

      expect(result.current.isParsing).toBe(true);
    });

    it('should set isParsing to false', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setIsParsing(true);
        result.current.setIsParsing(false);
      });

      expect(result.current.isParsing).toBe(false);
    });
  });

  describe('setParseError', () => {
    it('should set parse error', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setParseError('Parse failed');
      });

      expect(result.current.parseError).toBe('Parse failed');
    });

    it('should set isParsing to false when setting error', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setIsParsing(true);
        result.current.setParseError('Error');
      });

      expect(result.current.isParsing).toBe(false);
    });
  });

  describe('setOutputFormat', () => {
    it('should set output format', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setOutputFormat('xlsx');
      });

      expect(result.current.outputFormat).toBe('xlsx');
    });

    it('should clear result when format changes', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setResult({ success: true, format: 'json', data: '{}' });
        result.current.setOutputFormat('csv');
      });

      expect(result.current.result).toBeNull();
    });
  });

  describe('setResult', () => {
    it('should set result', () => {
      const { result } = renderHook(() => useConverterStore());
      const conversionResult = { success: true, format: 'json' as const, data: '{}' };

      act(() => {
        result.current.setResult(conversionResult);
      });

      expect(result.current.result).toEqual(conversionResult);
    });

    it('should set isConverting to false', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setIsConverting(true);
        result.current.setResult({ success: true, format: 'json', data: '{}' });
      });

      expect(result.current.isConverting).toBe(false);
    });

    it('should clear convert error', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setConvertError('Error');
        result.current.setResult({ success: true, format: 'json', data: '{}' });
      });

      expect(result.current.convertError).toBeNull();
    });
  });

  describe('setIsConverting', () => {
    it('should set isConverting', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setIsConverting(true);
      });

      expect(result.current.isConverting).toBe(true);
    });
  });

  describe('setConvertError', () => {
    it('should set convert error', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setConvertError('Conversion failed');
      });

      expect(result.current.convertError).toBe('Conversion failed');
    });

    it('should set isConverting to false', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setIsConverting(true);
        result.current.setConvertError('Error');
      });

      expect(result.current.isConverting).toBe(false);
    });
  });

  describe('setCsvOptions', () => {
    it('should update CSV options', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setCsvOptions({ delimiter: ';' });
      });

      expect(result.current.csvOptions.delimiter).toBe(';');
    });

    it('should preserve other CSV options', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setCsvOptions({ delimiter: ';' });
      });

      expect(result.current.csvOptions.hasHeader).toBe(true);
      expect(result.current.csvOptions.skipEmptyLines).toBe(true);
    });
  });

  describe('setJsonOptions', () => {
    it('should update JSON options', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setJsonOptions({ prettyPrint: false });
      });

      expect(result.current.jsonOptions.prettyPrint).toBe(false);
    });

    it('should preserve other JSON options', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setJsonOptions({ prettyPrint: false });
      });

      expect(result.current.jsonOptions.indentation).toBe(2);
    });
  });

  describe('setExcelOptions', () => {
    it('should update Excel options', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setExcelOptions({ sheetName: 'Data' });
      });

      expect(result.current.excelOptions.sheetName).toBe('Data');
    });

    it('should preserve other Excel options', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setExcelOptions({ sheetName: 'Data' });
      });

      expect(result.current.excelOptions.autoFitColumns).toBe(true);
    });
  });

  describe('setSqlOptions', () => {
    it('should update SQL options', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setSqlOptions({ tableName: 'users' });
      });

      expect(result.current.sqlOptions.tableName).toBe('users');
    });

    it('should preserve other SQL options', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setSqlOptions({ tableName: 'users' });
      });

      expect(result.current.sqlOptions.batchSize).toBe(100);
    });
  });

  describe('getConvertOptions', () => {
    it('should return all options', () => {
      const { result } = renderHook(() => useConverterStore());

      const options = result.current.getConvertOptions();

      expect(options).toHaveProperty('outputFormat', 'json');
      expect(options).toHaveProperty('csv');
      expect(options).toHaveProperty('json');
      expect(options).toHaveProperty('excel');
      expect(options).toHaveProperty('sql');
    });

    it('should include input format when set', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setInputFormat('csv');
      });

      const options = result.current.getConvertOptions();

      expect(options.inputFormat).toBe('csv');
    });

    it('should not include input format when not set', () => {
      const { result } = renderHook(() => useConverterStore());

      const options = result.current.getConvertOptions();

      expect(options.inputFormat).toBeUndefined();
    });

    it('should reflect current output format', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setOutputFormat('xlsx');
      });

      const options = result.current.getConvertOptions();

      expect(options.outputFormat).toBe('xlsx');
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setInputData('data', 'file.csv', 100);
        result.current.setInputFormat('csv');
        result.current.setOutputFormat('xlsx');
        result.current.setParsedData({
          headers: ['a'],
          rows: [{ a: 1 }],
          format: 'csv',
          metadata: { rowCount: 1, columnCount: 1 },
        });
        result.current.setResult({ success: true, format: 'xlsx', data: new Blob() });
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.inputData).toBeNull();
      expect(result.current.inputFormat).toBeNull();
      expect(result.current.fileName).toBeNull();
      expect(result.current.fileSize).toBeNull();
      expect(result.current.parsedData).toBeNull();
      expect(result.current.outputFormat).toBe('json');
      expect(result.current.result).toBeNull();
    });

    it('should reset options to defaults', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setCsvOptions({ delimiter: ';' });
        result.current.setSqlOptions({ tableName: 'users' });
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.csvOptions.delimiter).toBe(',');
      expect(result.current.sqlOptions.tableName).toBe('my_table');
    });

    it('should reset error states', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setParseError('Error');
        result.current.setConvertError('Error');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.parseError).toBeNull();
      expect(result.current.convertError).toBeNull();
    });
  });

  describe('selector usage', () => {
    it('should work with selector function', () => {
      const { result } = renderHook(() =>
        useConverterStore((state) => state.outputFormat)
      );

      expect(result.current).toBe('json');
    });

    it('should update when selected state changes', () => {
      const { result: formatResult } = renderHook(() =>
        useConverterStore((state) => state.outputFormat)
      );
      const { result: storeResult } = renderHook(() => useConverterStore());

      act(() => {
        storeResult.current.setOutputFormat('csv');
      });

      expect(formatResult.current).toBe('csv');
    });
  });
});
