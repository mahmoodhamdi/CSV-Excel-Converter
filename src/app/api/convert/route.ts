import { NextRequest, NextResponse } from 'next/server';
import { parseData, convertData, getOutputFilename } from '@/lib/converter';
import type { ConvertOptions, InputFormat, OutputFormat } from '@/types';

export async function POST(request: NextRequest) {
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
      outputFormat = (formData.get('outputFormat') as OutputFormat) || 'json';
      inputFormat = (formData.get('inputFormat') as InputFormat) || undefined;

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        );
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
      if (optionsStr) {
        try {
          options = JSON.parse(optionsStr as string);
        } catch {
          // Ignore invalid options
        }
      }
    } else {
      // Handle JSON body
      const body = await request.json();
      inputData = body.data;
      outputFormat = body.outputFormat || 'json';
      inputFormat = body.inputFormat;
      options = body.options || {};
      fileName = body.fileName;
    }

    // Parse input data
    const parsedData = await parseData(inputData, inputFormat);

    if (parsedData.rows.length === 0 && parsedData.headers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data to convert' },
        { status: 400 }
      );
    }

    // Convert data
    const result = convertData(parsedData, {
      ...options,
      outputFormat,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
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
        },
      });
    }

    // Return JSON response for text formats
    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata,
      fileName: getOutputFilename(fileName, outputFormat),
    });
  } catch (error) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Conversion failed',
      },
      { status: 500 }
    );
  }
}
