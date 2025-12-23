import { NextRequest, NextResponse } from 'next/server';
import { parseData, convertData, getOutputFilename } from '@/lib/converter';
import { convertRequestSchema, outputFormatSchema, inputFormatSchema } from '@/lib/validation/schemas';
import {
  generateRequestId,
  createErrorResponse,
  handleApiError,
  MAX_FILE_SIZE,
} from '@/lib/api-utils';
import { ErrorCodes, ParseError, FileError } from '@/lib/errors';
import type { ConvertOptions, InputFormat, OutputFormat } from '@/types';

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const contentType = request.headers.get('content-type') || '';

    let inputData: string | ArrayBuffer;
    let options: Partial<ConvertOptions> = {};
    let inputFormat: InputFormat | undefined;
    let outputFormat: OutputFormat = 'json';
    let fileName: string | undefined;

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
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

      // Validate file size
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

      // Validate output format
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

      // Validate input format if provided
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
      } else {
        inputData = await file.text();
      }

      // Parse options from form data
      const optionsStr = formData.get('options');
      if (optionsStr && typeof optionsStr === 'string') {
        try {
          options = JSON.parse(optionsStr);
        } catch {
          // Log but don't fail - use default options
          console.warn(`[${requestId}] Invalid options JSON, using defaults`);
        }
      }
    } else {
      // Handle JSON body
      const body = await request.json();

      // Validate request body with Zod
      const validationResult = convertRequestSchema.safeParse(body);
      if (!validationResult.success) {
        return handleApiError(validationResult.error, requestId);
      }

      const validatedBody = validationResult.data;
      inputData = validatedBody.data;
      outputFormat = validatedBody.outputFormat;
      inputFormat = validatedBody.inputFormat;
      options = validatedBody.options || {};
      fileName = body.fileName;
    }

    // Parse input data
    const parsedData = await parseData(inputData, inputFormat);

    if (parsedData.rows.length === 0 && parsedData.headers.length === 0) {
      return createErrorResponse(
        'No data to convert',
        ErrorCodes.EMPTY_DATA,
        400,
        requestId
      );
    }

    // Convert data
    const result = convertData(parsedData, {
      ...options,
      outputFormat,
    });

    if (!result.success) {
      return createErrorResponse(
        result.error || 'Conversion failed',
        ErrorCodes.CONVERSION_FAILED,
        500,
        requestId
      );
    }

    // Handle binary output (Excel)
    if (result.data instanceof Blob) {
      const buffer = await result.data.arrayBuffer();
      const outputFileName = getOutputFilename(fileName, outputFormat);

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': result.data.type,
          'Content-Disposition': `attachment; filename="${outputFileName}"`,
          'X-Request-Id': requestId,
        },
      });
    }

    // Return JSON response for text formats
    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata,
      fileName: getOutputFilename(fileName, outputFormat),
      requestId,
    });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
