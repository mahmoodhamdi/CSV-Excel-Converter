import { NextRequest, NextResponse } from 'next/server';
import { parseData } from '@/lib/converter';
import { parseRequestSchema, inputFormatSchema } from '@/lib/validation/schemas';
import {
  generateRequestId,
  createErrorResponse,
  handleApiError,
  MAX_FILE_SIZE,
  MAX_PREVIEW_ROWS,
} from '@/lib/api-utils';
import { ErrorCodes } from '@/lib/errors';
import type { InputFormat } from '@/types';

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const contentType = request.headers.get('content-type') || '';

    let inputData: string | ArrayBuffer;
    let inputFormat: InputFormat | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
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

      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'xlsx' || ext === 'xls') {
        inputData = await file.arrayBuffer();
      } else {
        inputData = await file.text();
      }
    } else {
      // Handle JSON body
      const body = await request.json();

      // Validate request body with Zod
      const validationResult = parseRequestSchema.safeParse(body);
      if (!validationResult.success) {
        return handleApiError(validationResult.error, requestId);
      }

      const validatedBody = validationResult.data;
      inputData = validatedBody.data;
      inputFormat = validatedBody.format;
    }

    const parsedData = await parseData(inputData, inputFormat);

    // Limit preview rows
    const previewRows = parsedData.rows.slice(0, MAX_PREVIEW_ROWS);

    return NextResponse.json({
      success: true,
      headers: parsedData.headers,
      rows: previewRows,
      format: parsedData.format,
      metadata: {
        ...parsedData.metadata,
        previewRowCount: previewRows.length,
        totalRowCount: parsedData.rows.length,
        truncated: parsedData.rows.length > MAX_PREVIEW_ROWS,
      },
      requestId,
    });
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
