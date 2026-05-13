/**
 * /api/v2/convert — Commercial endpoint requiring API key auth.
 *
 * Mirrors /api/convert behavior but enforces X-API-Key (or Bearer token).
 * Per-key tier is recorded on success and surfaced via response headers.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { parseData, convertData, getOutputFilename } from '@/lib/converter';
import {
  convertRequestSchema,
  outputFormatSchema,
  inputFormatSchema,
} from '@/lib/validation/schemas';
import {
  createErrorResponse,
  handleApiError,
  MAX_FILE_SIZE,
} from '@/lib/api-utils';
import { ErrorCodes } from '@/lib/errors';
import { validateFileSignature } from '@/lib/validation/magic-bytes';
import { trackConversion } from '@/lib/analytics';
import { authenticateRequest } from '@/lib/api-key-auth';
import type { ConvertOptions, InputFormat, OutputFormat } from '@/types';

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  const { record, requestId } = auth;

  try {
    const contentType = request.headers.get('content-type') || '';

    let inputData: string | ArrayBuffer;
    let options: Partial<ConvertOptions> = {};
    let inputFormat: InputFormat | undefined;
    let outputFormat: OutputFormat = 'json';
    let fileName: string | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const outputFormatRaw = formData.get('outputFormat') as string;
      const inputFormatRaw = formData.get('inputFormat') as string;

      if (!file) {
        return createErrorResponse(
          'No file provided',
          ErrorCodes.MISSING_REQUIRED,
          400,
          requestId
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        const maxSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024));
        return createErrorResponse(
          `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
          ErrorCodes.FILE_TOO_LARGE,
          413,
          requestId,
          { fileSize: file.size, maxSize: MAX_FILE_SIZE }
        );
      }

      const outputFormatResult = outputFormatSchema.safeParse(outputFormatRaw);
      if (!outputFormatResult.success && outputFormatRaw) {
        return createErrorResponse(
          `Invalid output format: ${outputFormatRaw}`,
          ErrorCodes.VALIDATION_ERROR,
          400,
          requestId
        );
      }
      outputFormat = outputFormatResult.success ? outputFormatResult.data : 'json';

      if (inputFormatRaw) {
        const inputFormatResult = inputFormatSchema.safeParse(inputFormatRaw);
        if (!inputFormatResult.success) {
          return createErrorResponse(
            `Invalid input format: ${inputFormatRaw}`,
            ErrorCodes.VALIDATION_ERROR,
            400,
            requestId
          );
        }
        inputFormat = inputFormatResult.data;
      }

      fileName = file.name;
      const ext = fileName.split('.').pop()?.toLowerCase();

      if (ext === 'xlsx' || ext === 'xls') {
        inputData = await file.arrayBuffer();
        const validation = validateFileSignature(inputData as ArrayBuffer, ext);
        if (!validation.valid) {
          return createErrorResponse(
            validation.message || 'Invalid file format',
            ErrorCodes.VALIDATION_ERROR,
            400,
            requestId
          );
        }
      } else {
        inputData = await file.text();
      }

      const optionsStr = formData.get('options');
      if (optionsStr && typeof optionsStr === 'string') {
        try {
          options = JSON.parse(optionsStr);
        } catch {
          console.warn(`[${requestId}] Invalid options JSON, using defaults`);
        }
      }
    } else {
      const body = await request.json();
      const validationResult = convertRequestSchema.safeParse(body);
      if (!validationResult.success) {
        return handleApiError(validationResult.error, requestId);
      }
      const validated = validationResult.data;
      inputData = validated.data;
      outputFormat = validated.outputFormat;
      inputFormat = validated.inputFormat;
      options = validated.options || {};
      fileName = body.fileName;
    }

    const parsedData = await parseData(inputData, inputFormat);
    if (parsedData.rows.length === 0 && parsedData.headers.length === 0) {
      return createErrorResponse(
        'No data to convert',
        ErrorCodes.EMPTY_DATA,
        400,
        requestId
      );
    }

    const result = await convertData(parsedData, { ...options, outputFormat });
    if (!result.success) {
      trackConversion({
        endpoint: '/api/v2/convert',
        inputFormat: parsedData.format,
        outputFormat,
        success: false,
      });
      return createErrorResponse(
        result.error || 'Conversion failed',
        ErrorCodes.CONVERSION_FAILED,
        500,
        requestId
      );
    }

    const apiHeaders: Record<string, string> = {
      'X-Request-Id': requestId,
      'X-API-Tier': record.tier,
      'X-API-Key-Id': record.id,
    };

    if (result.data instanceof Blob) {
      const buffer = await result.data.arrayBuffer();
      const outputFileName = getOutputFilename(fileName, outputFormat);
      trackConversion({
        endpoint: '/api/v2/convert',
        inputFormat: parsedData.format,
        outputFormat,
        success: true,
      });
      return new NextResponse(buffer, {
        headers: {
          ...apiHeaders,
          'Content-Type': result.data.type,
          'Content-Disposition': `attachment; filename="${outputFileName}"; filename*=UTF-8''${encodeURIComponent(outputFileName)}`,
        },
      });
    }

    trackConversion({
      endpoint: '/api/v2/convert',
      inputFormat: parsedData.format,
      outputFormat,
      success: true,
    });

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        metadata: result.metadata,
        fileName: getOutputFilename(fileName, outputFormat),
        requestId,
        apiTier: record.tier,
      },
      { headers: apiHeaders }
    );
  } catch (error) {
    trackConversion({ endpoint: '/api/v2/convert', success: false });
    return handleApiError(error, requestId);
  }
}
