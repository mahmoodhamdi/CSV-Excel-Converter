import { parseCsv, writeCsv, detectDelimiter as detectCsvDelimiter } from './csv';
import { parseJson, writeJson } from './json';
import { parseExcel, parseExcelData, writeExcel, workbookToBuffer, workbookToBase64 } from './excel';
import { parseXml, writeXml } from './xml';
import { writeSql } from './sql';
import { detectFormat, detectDelimiter, detectFormatFromFilename, detectFormatFromMimeType } from './detect';
import {
  detectEncoding,
  decodeToUtf8,
  bytesToString,
  repairMojibake,
  type Encoding,
  type DetectResult as EncodingDetectResult,
} from './encoding';
import type {
  InputFormat,
  OutputFormat,
  ParsedData,
  ConversionResult,
  ConvertOptions,
} from '@/types';

export {
  // CSV
  parseCsv,
  writeCsv,
  detectCsvDelimiter,
  // JSON
  parseJson,
  writeJson,
  // Excel
  parseExcel,
  parseExcelData,
  writeExcel,
  workbookToBuffer,
  workbookToBase64,
  // XML
  parseXml,
  writeXml,
  // SQL
  writeSql,
  // Detection
  detectFormat,
  detectDelimiter,
  detectFormatFromFilename,
  detectFormatFromMimeType,
  // Encoding
  detectEncoding,
  decodeToUtf8,
  bytesToString,
  repairMojibake,
};
export type { Encoding, EncodingDetectResult };

export async function parseData(
  data: string | ArrayBuffer,
  format?: InputFormat
): Promise<ParsedData> {
  // Handle binary data: ArrayBuffer is treated as Excel by default,
  // unless an explicit text format is provided.
  if (data instanceof ArrayBuffer) {
    if (format && format !== 'xlsx' && format !== 'xls') {
      // Caller asked for a text format — decode bytes first.
      const { text } = bytesToString(new Uint8Array(data));
      return parseData(text, format);
    }
    return parseExcel(data);
  }

  // Detect format if not provided
  const detectedFormat = format || detectFormat(data);

  switch (detectedFormat) {
    case 'json':
      return parseJson(data);
    case 'xml':
      return parseXml(data);
    case 'csv':
    case 'tsv':
      const delimiter = detectedFormat === 'tsv' ? '\t' : detectDelimiter(data);
      const result = parseCsv(data, { delimiter });
      result.format = detectedFormat;
      return result;
    default:
      return parseCsv(data);
  }
}

/**
 * Parse raw bytes with auto encoding detection.
 *
 * For text formats (CSV/TSV/JSON/XML), detects encoding (Windows-1256, UTF-8 BOM, etc.),
 * transcodes to a JavaScript UTF-16 string, then parses.
 *
 * Returns the encoding info alongside the parsed result so the UI can show
 * "Decoded from Windows-1256" badges and offer the user a preview.
 */
export async function parseDataFromBytes(
  bytes: Uint8Array,
  hint?: { format?: InputFormat; fileName?: string }
): Promise<{ parsedData: ParsedData; encoding: EncodingDetectResult }> {
  // For Excel formats, skip text decoding entirely.
  const fileName = hint?.fileName?.toLowerCase() || '';
  const isExcelExt = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
  if (isExcelExt || hint?.format === 'xlsx' || hint?.format === 'xls') {
    const parsedData = await parseExcel(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
    return {
      parsedData,
      encoding: { encoding: 'utf-8', confidence: 1, hasBom: false, bomLength: 0 },
    };
  }

  const detection = detectEncoding(bytes);
  const text = decodeToUtf8(bytes, detection.encoding, detection.bomLength);
  const parsedData = await parseData(text, hint?.format);
  return { parsedData, encoding: detection };
}

export async function convertData(
  parsedData: ParsedData,
  options: ConvertOptions
): Promise<ConversionResult> {
  const { headers, rows } = parsedData;
  const { outputFormat } = options;

  try {
    let data: string | Blob;
    let format = outputFormat;

    switch (outputFormat) {
      case 'json':
        data = writeJson(headers, rows, options.json);
        break;

      case 'csv':
        data = writeCsv(headers, rows, { ...options.csv, delimiter: ',' });
        break;

      case 'tsv':
        data = writeCsv(headers, rows, { ...options.csv, delimiter: '\t' });
        format = 'tsv';
        break;

      case 'xlsx':
      case 'xls':
        const workbook = await writeExcel(headers, rows, options.excel);
        const buffer = await workbookToBuffer(workbook, outputFormat);
        data = new Blob([buffer], {
          type:
            outputFormat === 'xlsx'
              ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              : 'application/vnd.ms-excel',
        });
        break;

      case 'xml':
        data = writeXml(headers, rows);
        break;

      case 'sql':
        data = writeSql(headers, rows, options.sql);
        break;

      default:
        throw new Error(`Unsupported output format: ${outputFormat}`);
    }

    return {
      success: true,
      data,
      format,
      metadata: {
        inputFormat: parsedData.format || 'csv',
        outputFormat: format,
        rowCount: rows.length,
        columnCount: headers.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      format: outputFormat,
      error: error instanceof Error ? error.message : 'Conversion failed',
    };
  }
}

export function getOutputFilename(
  inputFilename: string | undefined,
  outputFormat: OutputFormat
): string {
  let baseName = inputFilename
    ? inputFilename.replace(/\.[^/.]+$/, '')
    : 'converted';

  // Sanitize: remove path traversal, special chars
  baseName = baseName
    .replace(/[/\\]/g, '_')
    .replace(/\.\./g, '_')
    .replace(/[<>:"|?*\x00-\x1f]/g, '_')
    .replace(/^\.+/, '_')
    .slice(0, 200);

  if (!baseName) baseName = 'converted';

  const extensions: Record<OutputFormat, string> = {
    csv: 'csv',
    tsv: 'tsv',
    json: 'json',
    xlsx: 'xlsx',
    xls: 'xls',
    xml: 'xml',
    sql: 'sql',
  };

  return `${baseName}.${extensions[outputFormat]}`;
}
