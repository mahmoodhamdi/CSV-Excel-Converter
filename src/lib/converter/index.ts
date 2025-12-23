import { parseCsv, writeCsv, detectDelimiter as detectCsvDelimiter } from './csv';
import { parseJson, writeJson } from './json';
import { parseExcel, parseExcelData, writeExcel, workbookToBuffer, workbookToBase64 } from './excel';
import { parseXml, writeXml } from './xml';
import { writeSql } from './sql';
import { detectFormat, detectDelimiter, detectFormatFromFilename, detectFormatFromMimeType } from './detect';
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
};

export async function parseData(
  data: string | ArrayBuffer,
  format?: InputFormat
): Promise<ParsedData> {
  // Handle binary data (Excel)
  if (data instanceof ArrayBuffer) {
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
  const baseName = inputFilename
    ? inputFilename.replace(/\.[^/.]+$/, '')
    : 'converted';

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
