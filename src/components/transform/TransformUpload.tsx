'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTransformStore } from '@/stores/transform-store';
import { parseData, detectFormatFromFilename } from '@/lib/converter';
import { Upload, FileSpreadsheet, X } from 'lucide-react';

export function TransformUpload() {
  const t = useTranslations('transform');
  const { sourceData, setSourceData, reset } = useTransformStore();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      try {
        // Read file content
        const content = await new Promise<string | ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string | ArrayBuffer);
          reader.onerror = reject;

          if (
            file.name.endsWith('.xlsx') ||
            file.name.endsWith('.xls') ||
            file.type.includes('spreadsheet')
          ) {
            reader.readAsArrayBuffer(file);
          } else {
            reader.readAsText(file);
          }
        });

        // Detect format and parse the data
        const format = detectFormatFromFilename(file.name);
        const parsedData = await parseData(content, format ?? undefined);

        if (parsedData.headers.length > 0) {
          // Convert Record<string, unknown>[] to string[][] for transform engine
          const rows = parsedData.rows.map((row) =>
            parsedData.headers.map((header) => String(row[header] ?? ''))
          );

          setSourceData({
            headers: parsedData.headers,
            rows,
          });
        }
      } catch (error) {
        console.error('Error parsing file:', error);
      }
    },
    [setSourceData]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/tab-separated-values': ['.tsv'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/xml': ['.xml'],
      'text/xml': ['.xml'],
    },
    maxFiles: 1,
  });

  if (sourceData) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{t('dataLoaded')}</p>
                <p className="text-xs text-muted-foreground">
                  {sourceData.rows.length} {t('rows')} • {sourceData.headers.length} {t('columns')}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={reset}>
              <X className="h-4 w-4 mr-1" />
              {t('clear')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div
          {...getRootProps()}
          className={`p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-center ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <p className="font-medium">{t('uploadTitle')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('uploadDescription')}</p>
          <p className="text-xs text-muted-foreground mt-2">{t('supportedFormats')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
