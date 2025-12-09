'use client';

import { useTranslations } from 'next-intl';
import { useConverterStore } from '@/stores/converter-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, FileOutput } from 'lucide-react';
import type { OutputFormat } from '@/types';

const OUTPUT_FORMATS: { value: OutputFormat; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'tsv', label: 'TSV' },
  { value: 'xlsx', label: 'Excel (XLSX)' },
  { value: 'xls', label: 'Excel (XLS)' },
  { value: 'xml', label: 'XML' },
  { value: 'sql', label: 'SQL' },
];

export function FormatSelector() {
  const t = useTranslations('convert');
  const tFormats = useTranslations('formats');
  const { inputFormat, outputFormat, setOutputFormat, parsedData } = useConverterStore();

  const formatLabel = (format: string | null) => {
    if (!format) return t('autoDetect');
    switch (format) {
      case 'csv':
        return tFormats('csv');
      case 'tsv':
        return tFormats('tsv');
      case 'json':
        return tFormats('json');
      case 'xlsx':
        return tFormats('xlsx');
      case 'xls':
        return tFormats('xls');
      case 'xml':
        return tFormats('xml');
      default:
        return format.toUpperCase();
    }
  };

  if (!parsedData) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileOutput className="h-5 w-5" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          {/* Input Format */}
          <div className="flex-1 w-full">
            <p className="mb-2 text-sm font-medium">{t('from')}</p>
            <div className="rounded-md border bg-muted/50 px-4 py-2 text-center">
              {formatLabel(inputFormat)}
            </div>
          </div>

          <ArrowRight className="h-6 w-6 text-muted-foreground shrink-0 rotate-90 sm:rotate-0" />

          {/* Output Format */}
          <div className="flex-1 w-full">
            <p className="mb-2 text-sm font-medium">{t('to')}</p>
            <Select
              value={outputFormat}
              onValueChange={(value) => setOutputFormat(value as OutputFormat)}
            >
              <SelectTrigger data-testid="output-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTPUT_FORMATS.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
