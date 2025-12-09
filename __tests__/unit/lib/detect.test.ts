import { describe, it, expect } from 'vitest';
import { detectFormat, detectDelimiter } from '@/lib/converter/detect';

describe('Format Detection', () => {
  describe('detectFormat', () => {
    it('should detect JSON array', () => {
      const data = '[{"name":"John"}]';
      expect(detectFormat(data)).toBe('json');
    });

    it('should detect JSON object', () => {
      const data = '{"name":"John"}';
      expect(detectFormat(data)).toBe('json');
    });

    it('should detect CSV', () => {
      const data = 'name,age,city\nJohn,30,NYC';
      expect(detectFormat(data)).toBe('csv');
    });

    it('should detect TSV', () => {
      const data = 'name\tage\tcity\nJohn\t30\tNYC';
      expect(detectFormat(data)).toBe('tsv');
    });

    it('should detect XML', () => {
      const data = '<?xml version="1.0"?><root><item>test</item></root>';
      expect(detectFormat(data)).toBe('xml');
    });

    it('should detect XML without declaration', () => {
      const data = '<root><item>test</item></root>';
      expect(detectFormat(data)).toBe('xml');
    });

    it('should default to csv for unknown format', () => {
      const data = 'some random text';
      expect(detectFormat(data)).toBe('csv');
    });
  });

  describe('detectDelimiter', () => {
    it('should detect comma delimiter', () => {
      const data = 'name,age,city\nJohn,30,NYC';
      expect(detectDelimiter(data)).toBe(',');
    });

    it('should detect semicolon delimiter', () => {
      const data = 'name;age;city\nJohn;30;NYC';
      expect(detectDelimiter(data)).toBe(';');
    });

    it('should detect tab delimiter', () => {
      const data = 'name\tage\tcity\nJohn\t30\tNYC';
      expect(detectDelimiter(data)).toBe('\t');
    });

    it('should detect pipe delimiter', () => {
      const data = 'name|age|city\nJohn|30|NYC';
      expect(detectDelimiter(data)).toBe('|');
    });

    it('should default to comma', () => {
      const data = 'just some text';
      expect(detectDelimiter(data)).toBe(',');
    });
  });
});
