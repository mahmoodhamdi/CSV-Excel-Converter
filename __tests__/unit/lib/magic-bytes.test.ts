import { describe, it, expect } from 'vitest';
import { validateFileSignature } from '@/lib/validation/magic-bytes';

describe('Magic Bytes Validation', () => {
  it('should accept text-based formats without validation', () => {
    const buffer = new ArrayBuffer(10);
    expect(validateFileSignature(buffer, 'csv').valid).toBe(true);
    expect(validateFileSignature(buffer, 'json').valid).toBe(true);
    expect(validateFileSignature(buffer, 'xml').valid).toBe(true);
    expect(validateFileSignature(buffer, 'tsv').valid).toBe(true);
    expect(validateFileSignature(buffer, 'sql').valid).toBe(true);
  });

  it('should accept valid XLSX signature', () => {
    const buffer = new ArrayBuffer(8);
    const view = new Uint8Array(buffer);
    view[0] = 0x50; view[1] = 0x4b; view[2] = 0x03; view[3] = 0x04;
    expect(validateFileSignature(buffer, 'xlsx').valid).toBe(true);
  });

  it('should reject invalid XLSX signature', () => {
    const buffer = new ArrayBuffer(8);
    const view = new Uint8Array(buffer);
    view[0] = 0x00; view[1] = 0x00; view[2] = 0x00; view[3] = 0x00;
    const result = validateFileSignature(buffer, 'xlsx');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('XLSX');
  });

  it('should accept valid XLS signature', () => {
    const buffer = new ArrayBuffer(8);
    const view = new Uint8Array(buffer);
    view[0] = 0xd0; view[1] = 0xcf; view[2] = 0x11; view[3] = 0xe0;
    expect(validateFileSignature(buffer, 'xls').valid).toBe(true);
  });

  it('should reject invalid XLS signature', () => {
    const buffer = new ArrayBuffer(8);
    const result = validateFileSignature(buffer, 'xls');
    expect(result.valid).toBe(false);
  });

  it('should reject files that are too small', () => {
    const buffer = new ArrayBuffer(2);
    const result = validateFileSignature(buffer, 'xlsx');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('too small');
  });

  it('should accept unknown formats', () => {
    const buffer = new ArrayBuffer(8);
    expect(validateFileSignature(buffer, 'unknown').valid).toBe(true);
  });
});
