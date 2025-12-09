import { NextResponse } from 'next/server';

export async function GET() {
  const formats = {
    input: [
      { id: 'csv', name: 'CSV', extension: '.csv', mimeType: 'text/csv' },
      { id: 'tsv', name: 'TSV', extension: '.tsv', mimeType: 'text/tab-separated-values' },
      { id: 'json', name: 'JSON', extension: '.json', mimeType: 'application/json' },
      {
        id: 'xlsx',
        name: 'Excel (XLSX)',
        extension: '.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      {
        id: 'xls',
        name: 'Excel (XLS)',
        extension: '.xls',
        mimeType: 'application/vnd.ms-excel',
      },
      { id: 'xml', name: 'XML', extension: '.xml', mimeType: 'application/xml' },
    ],
    output: [
      { id: 'csv', name: 'CSV', extension: '.csv', mimeType: 'text/csv' },
      { id: 'tsv', name: 'TSV', extension: '.tsv', mimeType: 'text/tab-separated-values' },
      { id: 'json', name: 'JSON', extension: '.json', mimeType: 'application/json' },
      {
        id: 'xlsx',
        name: 'Excel (XLSX)',
        extension: '.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      {
        id: 'xls',
        name: 'Excel (XLS)',
        extension: '.xls',
        mimeType: 'application/vnd.ms-excel',
      },
      { id: 'xml', name: 'XML', extension: '.xml', mimeType: 'application/xml' },
      { id: 'sql', name: 'SQL', extension: '.sql', mimeType: 'application/sql' },
    ],
  };

  return NextResponse.json({
    success: true,
    formats,
  });
}
