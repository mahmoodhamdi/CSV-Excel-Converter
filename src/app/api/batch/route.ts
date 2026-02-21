import { NextRequest, NextResponse } from 'next/server';
import { parseData, convertData, getOutputFilename } from '@/lib/converter';
import { outputFormatSchema } from '@/lib/validation/schemas';
import { generateRequestId, createErrorResponse, MAX_FILE_SIZE } from '@/lib/api-utils';
import { ErrorCodes } from '@/lib/errors';
import type { OutputFormat } from '@/types';

const MAX_BATCH_FILES = 10;

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  try {
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return createErrorResponse(
        'Batch endpoint requires multipart/form-data',
        ErrorCodes.VALIDATION_ERROR,
        400,
        requestId
      );
    }

    const formData = await request.formData();
    const outputFormatRaw = formData.get('outputFormat') as string;

    // Validate output format
    const outputFormatResult = outputFormatSchema.safeParse(outputFormatRaw);
    if (!outputFormatResult.success) {
      return createErrorResponse(
        `Invalid output format: ${outputFormatRaw}`,
        ErrorCodes.VALIDATION_ERROR,
        400,
        requestId
      );
    }
    const outputFormat: OutputFormat = outputFormatResult.data;

    // Collect files
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'files' && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return createErrorResponse(
        'No files provided',
        ErrorCodes.MISSING_REQUIRED,
        400,
        requestId
      );
    }

    if (files.length > MAX_BATCH_FILES) {
      return createErrorResponse(
        `Maximum ${MAX_BATCH_FILES} files allowed per batch`,
        ErrorCodes.VALIDATION_ERROR,
        400,
        requestId
      );
    }

    // Process each file
    const results = await Promise.all(
      files.map(async (file) => {
        try {
          // Validate size
          if (file.size > MAX_FILE_SIZE) {
            return {
              fileName: file.name,
              success: false,
              error: `File exceeds maximum size of ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`,
            };
          }

          const ext = file.name.split('.').pop()?.toLowerCase();
          let inputData: string | ArrayBuffer;

          if (ext === 'xlsx' || ext === 'xls') {
            inputData = await file.arrayBuffer();
          } else {
            inputData = await file.text();
          }

          const parsedData = await parseData(inputData);

          if (parsedData.rows.length === 0 && parsedData.headers.length === 0) {
            return {
              fileName: file.name,
              success: false,
              error: 'No data to convert',
            };
          }

          const result = await convertData(parsedData, { outputFormat });

          if (!result.success) {
            return {
              fileName: file.name,
              success: false,
              error: result.error || 'Conversion failed',
            };
          }

          const outputFileName = getOutputFilename(file.name, outputFormat);

          // For binary outputs, return base64
          if (result.data instanceof Blob) {
            const buffer = await result.data.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            return {
              fileName: file.name,
              outputFileName,
              success: true,
              data: base64,
              encoding: 'base64',
              metadata: result.metadata,
            };
          }

          return {
            fileName: file.name,
            outputFileName,
            success: true,
            data: result.data,
            metadata: result.metadata,
          };
        } catch (error) {
          return {
            fileName: file.name,
            success: false,
            error: error instanceof Error ? error.message : 'Processing failed',
          };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    return NextResponse.json({
      success: failCount === 0,
      requestId,
      summary: {
        total: results.length,
        success: successCount,
        failed: failCount,
      },
      results,
    });
  } catch (error) {
    return createErrorResponse(
      error instanceof Error ? error.message : 'Batch processing failed',
      ErrorCodes.CONVERSION_FAILED,
      500,
      requestId
    );
  }
}
