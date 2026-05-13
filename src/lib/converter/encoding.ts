/**
 * Encoding detection and conversion for raw bytes.
 *
 * Use case: CSV files exported from legacy ERPs in Egypt, Saudi Arabia,
 * and other Arabic-speaking markets often arrive as Windows-1256, not UTF-8.
 * Without auto-detection the user sees mojibake and gives up.
 *
 * This module:
 *  1. Detects BOMs (UTF-8 / UTF-16 LE / UTF-16 BE)
 *  2. Detects Windows-1256 by Arabic byte range frequency
 *  3. Detects valid UTF-8 by structural validation
 *  4. Transcodes to UTF-8 strings using Node's built-in `TextDecoder`
 *
 * No external dependencies. Runs in the browser (CSV worker) and on the server.
 */

export type Encoding =
  | 'utf-8'
  | 'utf-16le'
  | 'utf-16be'
  | 'windows-1256'
  | 'iso-8859-1'
  | 'ascii';

export interface DetectResult {
  encoding: Encoding;
  confidence: number; // 0..1
  hasBom: boolean;
  bomLength: number;
}

const BOM_UTF8 = [0xef, 0xbb, 0xbf];
const BOM_UTF16_LE = [0xff, 0xfe];
const BOM_UTF16_BE = [0xfe, 0xff];

function startsWith(bytes: Uint8Array, prefix: number[]): boolean {
  if (bytes.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (bytes[i] !== prefix[i]) return false;
  }
  return true;
}

/**
 * Heuristic check for valid UTF-8 byte sequences.
 * Returns a confidence score in [0, 1]; 1 means definitely valid UTF-8.
 */
function utf8Confidence(bytes: Uint8Array): number {
  if (bytes.length === 0) return 1;
  let i = 0;
  let multiByteCount = 0;
  let invalidCount = 0;
  const limit = Math.min(bytes.length, 8192);
  while (i < limit) {
    const b = bytes[i];
    if (b < 0x80) {
      i += 1;
      continue;
    }
    let needed: number;
    if ((b & 0xe0) === 0xc0) needed = 1;
    else if ((b & 0xf0) === 0xe0) needed = 2;
    else if ((b & 0xf8) === 0xf0) needed = 3;
    else {
      invalidCount += 1;
      i += 1;
      continue;
    }
    if (i + needed >= limit) break;
    let valid = true;
    for (let j = 1; j <= needed; j++) {
      if ((bytes[i + j] & 0xc0) !== 0x80) {
        valid = false;
        break;
      }
    }
    if (valid) multiByteCount += 1;
    else invalidCount += 1;
    i += needed + 1;
  }
  if (multiByteCount === 0 && invalidCount === 0) return 1; // pure ASCII
  if (invalidCount === 0) return 1;
  if (multiByteCount === 0) return 0;
  return multiByteCount / (multiByteCount + invalidCount);
}

/**
 * Windows-1256 (Arabic) characters live in the 0xC0–0xFA range.
 * If a large share of high bytes fall in that range AND UTF-8 validation
 * fails, this is likely Windows-1256.
 */
function windows1256Confidence(bytes: Uint8Array): number {
  let highBytes = 0;
  let arabicBytes = 0;
  const limit = Math.min(bytes.length, 8192);
  for (let i = 0; i < limit; i++) {
    const b = bytes[i];
    if (b >= 0x80) {
      highBytes += 1;
      // Windows-1256 Arabic letters block
      if (b >= 0xc0 && b <= 0xfa) arabicBytes += 1;
    }
  }
  if (highBytes === 0) return 0;
  return arabicBytes / highBytes;
}

export function detectEncoding(bytes: Uint8Array): DetectResult {
  if (startsWith(bytes, BOM_UTF8)) {
    return { encoding: 'utf-8', confidence: 1, hasBom: true, bomLength: 3 };
  }
  if (startsWith(bytes, BOM_UTF16_LE)) {
    return { encoding: 'utf-16le', confidence: 1, hasBom: true, bomLength: 2 };
  }
  if (startsWith(bytes, BOM_UTF16_BE)) {
    return { encoding: 'utf-16be', confidence: 1, hasBom: true, bomLength: 2 };
  }

  const utf8Conf = utf8Confidence(bytes);
  const w1256Conf = windows1256Confidence(bytes);

  // Pure ASCII or strong UTF-8 wins
  if (utf8Conf >= 0.95) {
    const hasAnyHighByte = bytes.some((b) => b >= 0x80);
    return {
      encoding: hasAnyHighByte ? 'utf-8' : 'ascii',
      confidence: utf8Conf,
      hasBom: false,
      bomLength: 0,
    };
  }

  // If UTF-8 fails AND Arabic high-byte ratio is significant, call it Windows-1256
  if (w1256Conf >= 0.6) {
    return { encoding: 'windows-1256', confidence: w1256Conf, hasBom: false, bomLength: 0 };
  }

  // Fall back to Latin-1 if neither pattern matched
  return { encoding: 'iso-8859-1', confidence: 0.5, hasBom: false, bomLength: 0 };
}

/**
 * Decode bytes into a UTF-8 JavaScript string using the detected encoding.
 *
 * Honors and strips a BOM when present.
 */
export function decodeToUtf8(bytes: Uint8Array, encoding: Encoding, bomLength = 0): string {
  const slice = bomLength > 0 ? bytes.subarray(bomLength) : bytes;
  // TextDecoder supports windows-1256 in Node 18+ and all modern browsers
  // via the Encoding Standard implementation.
  const decoder = new TextDecoder(encoding, { fatal: false, ignoreBOM: true });
  return decoder.decode(slice);
}

/**
 * One-shot helper: detect + decode.
 */
export function bytesToString(bytes: Uint8Array): { text: string; detection: DetectResult } {
  const detection = detectEncoding(bytes);
  const text = decodeToUtf8(bytes, detection.encoding, detection.bomLength);
  return { text, detection };
}

/**
 * Common mojibake repair: detect text that was double-decoded.
 *
 * Example: Arabic text encoded as Windows-1256 then decoded as Latin-1,
 * producing strings like "Ø£ÙØ§" instead of "أنا". This repair re-encodes
 * the string as Latin-1 bytes then decodes as UTF-8.
 *
 * Returns the repaired string if repair improves Arabic content; otherwise
 * returns the input unchanged.
 */
export function repairMojibake(input: string): { text: string; repaired: boolean } {
  if (!input) return { text: input, repaired: false };
  // Heuristic: input contains "Ø" or "Ù" character pairs (typical mojibake markers)
  if (!/[ØÙÚÛ][\x80-\xFF]/.test(input)) {
    return { text: input, repaired: false };
  }
  try {
    const bytes = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) {
      bytes[i] = input.charCodeAt(i) & 0xff;
    }
    const repaired = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    // Sanity: if repaired contains Arabic codepoints (U+0600-U+06FF), accept it
    if (/[؀-ۿ]/.test(repaired)) {
      return { text: repaired, repaired: true };
    }
  } catch {
    // fatal decode failed → keep original
  }
  return { text: input, repaired: false };
}
