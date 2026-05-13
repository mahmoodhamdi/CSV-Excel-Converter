import { describe, it, expect } from 'vitest';
import {
  detectEncoding,
  decodeToUtf8,
  bytesToString,
  repairMojibake,
} from '@/lib/converter/encoding';

function bytes(...vals: number[]): Uint8Array {
  return new Uint8Array(vals);
}

describe('detectEncoding', () => {
  it('detects UTF-8 BOM', () => {
    const result = detectEncoding(bytes(0xef, 0xbb, 0xbf, 0x68, 0x69));
    expect(result.encoding).toBe('utf-8');
    expect(result.hasBom).toBe(true);
    expect(result.bomLength).toBe(3);
  });

  it('detects UTF-16 LE BOM', () => {
    const result = detectEncoding(bytes(0xff, 0xfe, 0x68, 0x00));
    expect(result.encoding).toBe('utf-16le');
    expect(result.hasBom).toBe(true);
  });

  it('detects UTF-16 BE BOM', () => {
    const result = detectEncoding(bytes(0xfe, 0xff, 0x00, 0x68));
    expect(result.encoding).toBe('utf-16be');
    expect(result.hasBom).toBe(true);
  });

  it('detects plain ASCII as ascii', () => {
    const result = detectEncoding(new TextEncoder().encode('name,age\nJohn,30'));
    expect(result.encoding).toBe('ascii');
  });

  it('detects valid UTF-8 (Arabic) without BOM', () => {
    const text = 'الاسم,العمر\nأحمد,30';
    const result = detectEncoding(new TextEncoder().encode(text));
    expect(result.encoding).toBe('utf-8');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('detects Windows-1256 Arabic', () => {
    // "أحمد" in Windows-1256: 0xC3 0xCD 0xE3 0xCF
    const w1256 = bytes(
      0xc3, 0xcd, 0xe3, 0xcf, // أحمد
      0x2c, // ,
      0xc7, 0xe1, 0xed, 0xe6, 0xe3, // اليوم
    );
    const result = detectEncoding(w1256);
    expect(result.encoding).toBe('windows-1256');
  });
});

describe('decodeToUtf8', () => {
  it('strips BOM when decoding UTF-8', () => {
    const buf = bytes(0xef, 0xbb, 0xbf, 0x68, 0x69);
    const text = decodeToUtf8(buf, 'utf-8', 3);
    expect(text).toBe('hi');
  });

  it('decodes Windows-1256 Arabic correctly', () => {
    // أحمد in Windows-1256
    const buf = bytes(0xc3, 0xcd, 0xe3, 0xcf);
    const text = decodeToUtf8(buf, 'windows-1256');
    expect(text).toBe('أحمد');
  });
});

describe('bytesToString', () => {
  it('round-trips ASCII through detection + decode', () => {
    const { text, detection } = bytesToString(new TextEncoder().encode('hello,world'));
    expect(text).toBe('hello,world');
    expect(detection.encoding).toBe('ascii');
  });

  it('auto-decodes Windows-1256 to a usable Arabic string', () => {
    const buf = bytes(0xc3, 0xcd, 0xe3, 0xcf);
    const { text } = bytesToString(buf);
    expect(text).toBe('أحمد');
  });
});

describe('repairMojibake', () => {
  it('repairs typical Windows-1252-as-Latin-1 mojibake of Arabic', () => {
    // "أنا" UTF-8 = D8 A3 D9 86 D8 A7, but if it was decoded as Latin-1
    // we get the JS string "Ø£ÙØ§"
    const mojibake = 'Ø£ÙØ§';
    const { text, repaired } = repairMojibake(mojibake);
    expect(repaired).toBe(true);
    expect(text).toBe('أنا');
  });

  it('leaves clean Arabic text unchanged', () => {
    const { text, repaired } = repairMojibake('أنا');
    expect(repaired).toBe(false);
    expect(text).toBe('أنا');
  });

  it('leaves clean English text unchanged', () => {
    const { text, repaired } = repairMojibake('Hello, World');
    expect(repaired).toBe(false);
    expect(text).toBe('Hello, World');
  });
});
