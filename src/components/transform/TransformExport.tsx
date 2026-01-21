'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTransformStore } from '@/stores/transform-store';
import { convertData, getOutputFilename } from '@/lib/converter';
import type { OutputFormat } from '@/types';
import { Download, Loader2 } from 'lucide-react';
import { saveAs } from 'file-saver';

const outputFormats: OutputFormat[] = ['csv', 'tsv', 'json', 'xlsx', 'xml', 'sql'];

export function TransformExport() {
  const t = useTranslations('transform');
  const { previewResult, sourceData } = useTransformStore();
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const canExport = previewResult?.success && previewResult.rows.length > 0;

  const handleExport = async () => {
    if (!previewResult || !canExport) return;

    setIsExporting(true);

    try {
      // Convert string[][] rows to Record<string, unknown>[] format
      const recordRows = previewResult.rows.map((row) => {
        const record: Record<string, unknown> = {};
        previewResult.headers.forEach((header, idx) => {
          record[header] = row[idx] ?? '';
        });
        return record;
      });

      const result = await convertData(
        {
          headers: previewResult.headers,
          rows: recordRows,
          format: 'csv', // Internal format
        },
        { outputFormat }
      );

      if (result.success && result.data) {
        const filename = getOutputFilename('transformed-data', outputFormat);

        if (outputFormat === 'xlsx') {
          // Binary data for Excel
          const blob = new Blob([result.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          saveAs(blob, filename);
        } else {
          // Text data for other formats
          const blob = new Blob([result.data], { type: 'text/plain;charset=utf-8' });
          saveAs(blob, filename);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!sourceData) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{t('export')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="export-format">{t('exportFormat')}</Label>
          <Select
            value={outputFormat}
            onValueChange={(value) => setOutputFormat(value as OutputFormat)}
          >
            <SelectTrigger id="export-format">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {outputFormats.map((format) => (
                <SelectItem key={format} value={format}>
                  {format.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full"
          onClick={handleExport}
          disabled={!canExport || isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('exporting')}
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              {t('exportButton')}
            </>
          )}
        </Button>

        {!canExport && previewResult && (
          <p className="text-xs text-muted-foreground text-center">
            {t('cannotExport')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
