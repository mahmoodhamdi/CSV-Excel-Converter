import { NextRequest, NextResponse } from 'next/server';
import { parseData } from '@/lib/converter';
import type { InputFormat } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let inputData: string | ArrayBuffer;
    let inputFormat: InputFormat | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      inputFormat = (formData.get('inputFormat') as InputFormat) || undefined;

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        );
      }

      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'xlsx' || ext === 'xls') {
        inputData = await file.arrayBuffer();
      } else {
        inputData = await file.text();
      }
    } else {
      const body = await request.json();
      inputData = body.data;
      inputFormat = body.inputFormat;
    }

    const parsedData = await parseData(inputData, inputFormat);

    // Limit preview rows
    const maxPreviewRows = 100;
    const previewRows = parsedData.rows.slice(0, maxPreviewRows);

    return NextResponse.json({
      success: true,
      headers: parsedData.headers,
      rows: previewRows,
      format: parsedData.format,
      metadata: {
        ...parsedData.metadata,
        previewRowCount: previewRows.length,
        totalRowCount: parsedData.rows.length,
        truncated: parsedData.rows.length > maxPreviewRows,
      },
    });
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse data',
      },
      { status: 500 }
    );
  }
}
