'use client';

import { useTranslations } from 'next-intl';
import { useConverterStore } from '@/stores/converter-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, RotateCcw, Check, FileCheck } from 'lucide-react';
import { useState } from 'react';
import { downloadFile, copyToClipboard, getMimeType } from '@/lib/utils';
import { getOutputFilename } from '@/lib/converter';

export function ConvertResult() {
  const t = useTranslations('convert');
  const tCommon = useTranslations('common');
  const { result, outputFormat, fileName, reset } = useConverterStore();
  const [copied, setCopied] = useState(false);

  if (!result || !result.success) {
    return null;
  }

  const handleDownload = () => {
    if (!result.data) return;

    const outputFileName = getOutputFilename(fileName ?? undefined, outputFormat);

    if (result.data instanceof Blob) {
      downloadFile(result.data, outputFileName);
    } else {
      downloadFile(result.data, outputFileName, getMimeType(outputFormat));
    }
  };

  const handleCopy = async () => {
    if (!result.data || result.data instanceof Blob) return;

    try {
      await copyToClipboard(result.data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleNewConversion = () => {
    reset();
  };

  const isTextOutput = typeof result.data === 'string';

  return (
    <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <FileCheck className="h-5 w-5" />
          {t('convertSuccess')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4" data-testid="convert-result">
        {/* Preview for text output */}
        {isTextOutput && (
          <div className="max-h-60 overflow-auto rounded-lg border bg-muted p-4">
            <pre className="text-xs whitespace-pre-wrap break-all">{result.data as string}</pre>
          </div>
        )}

        {/* Metadata */}
        {result.metadata && (
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>{result.metadata.rowCount} {tCommon('rows')}</span>
            <span>{result.metadata.columnCount} {tCommon('columns')}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            {t('downloadResult')}
          </Button>

          {isTextOutput && (
            <Button variant="secondary" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {tCommon('copied')}
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  {t('copyResult')}
                </>
              )}
            </Button>
          )}

          <Button variant="outline" onClick={handleNewConversion}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('newConversion')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
