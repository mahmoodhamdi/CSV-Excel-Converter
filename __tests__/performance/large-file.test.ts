import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseCSVStream,
  parseCSVStringChunked,
  needsStreaming,
  estimateRowCount,
  STREAMING_THRESHOLD,
} from '@/lib/converter/csv-stream';
import { conversionCache, ConversionCache } from '@/lib/cache';

describe('Large File Performance', () => {
  describe('needsStreaming', () => {
    it('should return true for files larger than 10MB', () => {
      const largeFile = new File(['a'.repeat(15 * 1024 * 1024)], 'large.csv', {
        type: 'text/csv',
      });
      expect(needsStreaming(largeFile)).toBe(true);
    });

    it('should return false for files smaller than 10MB', () => {
      const smallFile = new File(['a'.repeat(5 * 1024 * 1024)], 'small.csv', {
        type: 'text/csv',
      });
      expect(needsStreaming(smallFile)).toBe(false);
    });

    it('should return false for exactly 10MB files', () => {
      const exactFile = new File(['a'.repeat(10 * 1024 * 1024)], 'exact.csv', {
        type: 'text/csv',
      });
      expect(needsStreaming(exactFile)).toBe(false);
    });

    it('should have correct threshold value', () => {
      expect(STREAMING_THRESHOLD).toBe(10 * 1024 * 1024);
    });
  });

  describe('parseCSVStream', () => {
    it('should parse CSV file correctly', async () => {
      const csvContent = 'name,age,city\nJohn,30,NYC\nJane,25,LA\nBob,35,Chicago';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseCSVStream(file);

      expect(result.headers).toEqual(['name', 'age', 'city']);
      expect(result.rows).toHaveLength(3);
      expect(result.rows[0]).toEqual({ name: 'John', age: '30', city: 'NYC' });
      expect(result.format).toBe('csv');
      expect(result.metadata?.rowCount).toBe(3);
      expect(result.metadata?.columnCount).toBe(3);
    });

    it('should report progress during parsing', async () => {
      const rows = Array.from({ length: 1000 }, (_, i) => `row${i},value${i},data${i}`);
      const csv = `h1,h2,h3\n${rows.join('\n')}`;
      const file = new File([csv], 'progress.csv', { type: 'text/csv' });

      const progressValues: number[] = [];
      await parseCSVStream(file, {
        onProgress: (p) => progressValues.push(p),
        chunkSize: 100,
      });

      expect(progressValues.length).toBeGreaterThan(0);
      expect(progressValues[progressValues.length - 1]).toBe(100);
    });

    it('should limit rows when maxRows is set', async () => {
      const rows = Array.from({ length: 500 }, (_, i) => `row${i},value${i}`);
      const csv = `h1,h2\n${rows.join('\n')}`;
      const file = new File([csv], 'limited.csv', { type: 'text/csv' });

      const result = await parseCSVStream(file, { maxRows: 100 });

      expect(result.rows.length).toBeLessThanOrEqual(100);
      expect(result.metadata?.truncated).toBe(true);
    });

    it('should call onChunk callback for each chunk', async () => {
      const rows = Array.from({ length: 200 }, (_, i) => `row${i},value${i}`);
      const csv = `h1,h2\n${rows.join('\n')}`;
      const file = new File([csv], 'chunked.csv', { type: 'text/csv' });

      const chunks: Record<string, unknown>[][] = [];
      await parseCSVStream(file, {
        onChunk: (rows) => chunks.push(rows),
        chunkSize: 50,
      });

      expect(chunks.length).toBeGreaterThan(0);
      const totalRows = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      expect(totalRows).toBe(200);
    });

    it('should handle empty files', async () => {
      const file = new File([''], 'empty.csv', { type: 'text/csv' });

      const result = await parseCSVStream(file);

      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
    });

    it('should handle header-only files', async () => {
      const file = new File(['name,age,city'], 'headers-only.csv', { type: 'text/csv' });

      const result = await parseCSVStream(file);

      expect(result.headers).toEqual(['name', 'age', 'city']);
      expect(result.rows).toEqual([]);
    });
  });

  describe('parseCSVStringChunked', () => {
    it('should parse CSV string correctly', async () => {
      const csv = 'a,b,c\n1,2,3\n4,5,6';

      const result = await parseCSVStringChunked(csv);

      expect(result.headers).toEqual(['a', 'b', 'c']);
      expect(result.rows).toHaveLength(2);
    });

    it('should report progress', async () => {
      const progressValues: number[] = [];

      await parseCSVStringChunked('a,b\n1,2\n3,4', {
        onProgress: (p) => progressValues.push(p),
      });

      expect(progressValues).toContain(100);
    });

    it('should limit rows', async () => {
      const rows = Array.from({ length: 500 }, (_, i) => `${i},${i * 2}`);
      const csv = `col1,col2\n${rows.join('\n')}`;

      const result = await parseCSVStringChunked(csv, { maxRows: 100 });

      expect(result.rows.length).toBe(100);
      expect(result.metadata?.truncated).toBe(true);
    });
  });

  describe('Performance benchmarks', () => {
    it('should parse 10k rows efficiently', async () => {
      const rows = Array.from({ length: 10000 }, (_, i) => `row${i},value${i},data${i}`);
      const csv = `header1,header2,header3\n${rows.join('\n')}`;

      const start = performance.now();
      const result = await parseCSVStringChunked(csv);
      const duration = performance.now() - start;

      expect(result.rows.length).toBe(10000);
      expect(duration).toBeLessThan(2000); // Should complete in < 2 seconds
    });

    it('should parse 50k rows within reasonable time', async () => {
      const rows = Array.from({ length: 50000 }, (_, i) => `${i},test${i}`);
      const csv = `id,value\n${rows.join('\n')}`;

      const start = performance.now();
      const result = await parseCSVStringChunked(csv, { maxRows: 50000 });
      const duration = performance.now() - start;

      expect(result.rows.length).toBeLessThanOrEqual(50000);
      expect(duration).toBeLessThan(10000); // Should complete in < 10 seconds
    }, 15000);
  });
});

describe('Cache Performance', () => {
  let cache: ConversionCache;

  beforeEach(() => {
    cache = new ConversionCache({ maxSize: 1024 * 1024 }); // 1MB cache
  });

  describe('basic operations', () => {
    it('should cache and retrieve data', () => {
      const data = { test: 'value', array: [1, 2, 3] };
      cache.set('input', { format: 'json' }, data);

      const retrieved = cache.get('input', { format: 'json' });
      expect(retrieved).toEqual(data);
    });

    it('should return null for missing entries', () => {
      const result = cache.get('nonexistent', {});
      expect(result).toBeNull();
    });

    it('should check existence correctly', () => {
      cache.set('exists', {}, { data: true });

      expect(cache.has('exists', {})).toBe(true);
      expect(cache.has('missing', {})).toBe(false);
    });

    it('should delete entries', () => {
      cache.set('toDelete', {}, { data: true });
      expect(cache.has('toDelete', {})).toBe(true);

      cache.delete('toDelete', {});
      expect(cache.has('toDelete', {})).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('a', {}, { data: 'a' });
      cache.set('b', {}, { data: 'b' });

      cache.clear();

      expect(cache.has('a', {})).toBe(false);
      expect(cache.has('b', {})).toBe(false);
    });
  });

  describe('eviction', () => {
    it('should evict old entries when full', () => {
      const smallCache = new ConversionCache({ maxSize: 500 });

      // Fill cache
      smallCache.set('first', {}, { data: 'a'.repeat(100) });
      smallCache.set('second', {}, { data: 'b'.repeat(100) });
      smallCache.set('third', {}, { data: 'c'.repeat(200) });

      // Add new entry that requires eviction
      smallCache.set('fourth', {}, { data: 'd'.repeat(200) });

      // First entry should be evicted
      expect(smallCache.has('first', {})).toBe(false);
    });

    it('should not cache entries larger than 25% of max size', () => {
      const smallCache = new ConversionCache({ maxSize: 100 });
      const largeData = { data: 'x'.repeat(50) };

      smallCache.set('large', {}, largeData);

      expect(smallCache.has('large', {})).toBe(false);
    });
  });

  describe('TTL', () => {
    it('should expire entries after maxAge', async () => {
      const shortTtlCache = new ConversionCache({ maxAge: 100 }); // 100ms TTL

      shortTtlCache.set('expiring', {}, { data: 'temp' });
      expect(shortTtlCache.has('expiring', {})).toBe(true);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(shortTtlCache.has('expiring', {})).toBe(false);
    });
  });

  describe('stats', () => {
    it('should report correct stats', () => {
      cache.set('a', {}, { data: 'test' });

      const stats = cache.getStats();

      expect(stats.entries).toBe(1);
      expect(stats.currentSize).toBeGreaterThan(0);
      expect(stats.maxSize).toBe(1024 * 1024);
      expect(stats.utilization).toBeGreaterThan(0);
      expect(stats.utilization).toBeLessThan(1);
    });
  });
});
