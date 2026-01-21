import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Import after mocking
import {
  useHistoryStore,
  formatFileSize,
  formatDate,
  exportHistoryAsJson,
} from '@/stores/history-store';

describe('History Store', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset store state
    useHistoryStore.setState({ items: [] });
  });

  describe('addItem', () => {
    it('should add a new item to history', () => {
      const { result } = renderHook(() => useHistoryStore());

      act(() => {
        result.current.addItem({
          inputFormat: 'csv',
          outputFormat: 'json',
          fileName: 'test.csv',
          fileSize: 1024,
          rowCount: 10,
          columnCount: 5,
          status: 'success',
        });
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].fileName).toBe('test.csv');
      expect(result.current.items[0].status).toBe('success');
      expect(result.current.items[0].id).toBeDefined();
      expect(result.current.items[0].timestamp).toBeDefined();
    });

    it('should add new items at the beginning', () => {
      const { result } = renderHook(() => useHistoryStore());

      act(() => {
        result.current.addItem({
          inputFormat: 'csv',
          outputFormat: 'json',
          fileName: 'first.csv',
          fileSize: 1024,
          rowCount: 10,
          columnCount: 5,
          status: 'success',
        });
      });

      act(() => {
        result.current.addItem({
          inputFormat: 'json',
          outputFormat: 'xlsx',
          fileName: 'second.json',
          fileSize: 2048,
          rowCount: 20,
          columnCount: 3,
          status: 'success',
        });
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0].fileName).toBe('second.json');
      expect(result.current.items[1].fileName).toBe('first.csv');
    });

    it('should limit items to maxItems (FIFO)', () => {
      const { result } = renderHook(() => useHistoryStore());

      // Add 101 items (max is 100)
      act(() => {
        for (let i = 0; i < 101; i++) {
          result.current.addItem({
            inputFormat: 'csv',
            outputFormat: 'json',
            fileName: `file${i}.csv`,
            fileSize: 1024,
            rowCount: 10,
            columnCount: 5,
            status: 'success',
          });
        }
      });

      expect(result.current.items).toHaveLength(100);
      // Oldest item (file0) should be removed
      expect(result.current.items.find((i) => i.fileName === 'file0.csv')).toBeUndefined();
      // Newest items should exist
      expect(result.current.items[0].fileName).toBe('file100.csv');
    });

    it('should handle error items', () => {
      const { result } = renderHook(() => useHistoryStore());

      act(() => {
        result.current.addItem({
          inputFormat: 'csv',
          outputFormat: 'json',
          fileName: 'bad.csv',
          fileSize: 1024,
          rowCount: 0,
          columnCount: 0,
          status: 'error',
          errorMessage: 'Invalid CSV format',
        });
      });

      expect(result.current.items[0].status).toBe('error');
      expect(result.current.items[0].errorMessage).toBe('Invalid CSV format');
    });
  });

  describe('removeItem', () => {
    it('should remove an item by id', () => {
      const { result } = renderHook(() => useHistoryStore());

      act(() => {
        result.current.addItem({
          inputFormat: 'csv',
          outputFormat: 'json',
          fileName: 'test.csv',
          fileSize: 1024,
          rowCount: 10,
          columnCount: 5,
          status: 'success',
        });
      });

      const itemId = result.current.items[0].id;

      act(() => {
        result.current.removeItem(itemId);
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('clearAll', () => {
    it('should clear all items', () => {
      const { result } = renderHook(() => useHistoryStore());

      act(() => {
        result.current.addItem({
          inputFormat: 'csv',
          outputFormat: 'json',
          fileName: 'test1.csv',
          fileSize: 1024,
          rowCount: 10,
          columnCount: 5,
          status: 'success',
        });
        result.current.addItem({
          inputFormat: 'json',
          outputFormat: 'xlsx',
          fileName: 'test2.json',
          fileSize: 2048,
          rowCount: 20,
          columnCount: 3,
          status: 'success',
        });
      });

      expect(result.current.items).toHaveLength(2);

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('getFilteredItems', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useHistoryStore());

      act(() => {
        result.current.addItem({
          inputFormat: 'csv',
          outputFormat: 'json',
          fileName: 'success1.csv',
          fileSize: 1024,
          rowCount: 10,
          columnCount: 5,
          status: 'success',
        });
        result.current.addItem({
          inputFormat: 'json',
          outputFormat: 'xlsx',
          fileName: 'error1.json',
          fileSize: 2048,
          rowCount: 0,
          columnCount: 0,
          status: 'error',
          errorMessage: 'Failed',
        });
        result.current.addItem({
          inputFormat: 'xlsx',
          outputFormat: 'csv',
          fileName: 'success2.xlsx',
          fileSize: 4096,
          rowCount: 50,
          columnCount: 10,
          status: 'success',
        });
      });
    });

    it('should filter by status', () => {
      const { result } = renderHook(() => useHistoryStore());

      const successItems = result.current.getFilteredItems({ status: 'success' });
      expect(successItems).toHaveLength(2);

      const errorItems = result.current.getFilteredItems({ status: 'error' });
      expect(errorItems).toHaveLength(1);

      const allItems = result.current.getFilteredItems({ status: 'all' });
      expect(allItems).toHaveLength(3);
    });

    it('should filter by search query (filename)', () => {
      const { result } = renderHook(() => useHistoryStore());

      const filtered = result.current.getFilteredItems({ searchQuery: 'success1' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].fileName).toBe('success1.csv');
    });

    it('should filter by search query (format)', () => {
      const { result } = renderHook(() => useHistoryStore());

      const filtered = result.current.getFilteredItems({ searchQuery: 'xlsx' });
      expect(filtered).toHaveLength(2); // error1.json->xlsx and success2.xlsx
    });

    it('should combine filters', () => {
      const { result } = renderHook(() => useHistoryStore());

      const filtered = result.current.getFilteredItems({
        status: 'success',
        searchQuery: 'csv',
      });
      expect(filtered).toHaveLength(2); // success1.csv and success2.xlsx->csv
    });
  });
});

describe('Utility Functions', () => {
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });
  });

  describe('formatDate', () => {
    it('should format date for English locale', () => {
      const date = '2024-01-15T10:30:00.000Z';
      const formatted = formatDate(date, 'en');
      expect(formatted).toContain('2024');
    });

    it('should format date for Arabic locale', () => {
      const date = '2024-01-15T10:30:00.000Z';
      const formatted = formatDate(date, 'ar');
      // Arabic locale should use Arabic formatting
      expect(formatted).toBeDefined();
    });
  });

  describe('exportHistoryAsJson', () => {
    it('should export items as JSON string', () => {
      const items = [
        {
          id: '1',
          timestamp: '2024-01-15T10:30:00.000Z',
          inputFormat: 'csv',
          outputFormat: 'json',
          fileName: 'test.csv',
          fileSize: 1024,
          rowCount: 10,
          columnCount: 5,
          status: 'success' as const,
        },
      ];

      const json = exportHistoryAsJson(items);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].fileName).toBe('test.csv');
    });
  });
});
