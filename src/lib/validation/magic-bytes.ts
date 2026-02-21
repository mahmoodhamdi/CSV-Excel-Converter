/**
 * Validates file content against expected format using magic bytes.
 * Returns true if the file signature matches or if the format is text-based.
 */

const SIGNATURES: Record<string, number[][]> = {
  xlsx: [
    [0x50, 0x4b, 0x03, 0x04], // ZIP archive (OOXML uses ZIP)
  ],
  xls: [
    [0xd0, 0xcf, 0x11, 0xe0], // OLE2 Compound Document
  ],
};

export function validateFileSignature(
  buffer: ArrayBuffer,
  expectedFormat: string
): { valid: boolean; message?: string } {
  const format = expectedFormat.toLowerCase();

  // Text-based formats don't have magic bytes
  if (['csv', 'tsv', 'json', 'xml', 'sql'].includes(format)) {
    return { valid: true };
  }

  const signatures = SIGNATURES[format];
  if (!signatures) {
    return { valid: true }; // Unknown format, skip validation
  }

  const bytes = new Uint8Array(buffer.slice(0, 8));

  if (bytes.length < 4) {
    return { valid: false, message: `File is too small to be a valid ${format.toUpperCase()} file` };
  }

  const matches = signatures.some((sig) =>
    sig.every((byte, i) => bytes[i] === byte)
  );

  if (!matches) {
    return {
      valid: false,
      message: `File does not appear to be a valid ${format.toUpperCase()} file. The file signature does not match.`,
    };
  }

  return { valid: true };
}
