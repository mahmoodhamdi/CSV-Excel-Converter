'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useConverterStore } from '@/stores/converter-store';
import { useHistoryStore } from '@/stores/history-store';
import { convertData } from '@/lib/converter';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRightLeft } from 'lucide-react';

export function ConvertButton() {
  const t = useTranslations('convert');
  const {
    parsedData,
    isConverting,
    fileName,
    fileSize,
    inputFormat,
    outputFormat,
    setIsConverting,
    setResult,
    setConvertError,
    getConvertOptions,
  } = useConverterStore();

  const addHistoryItem = useHistoryStore((state) => state.addItem);

  const handleConvert = useCallback(async () => {
    if (!parsedData) return;

    setIsConverting(true);
    setConvertError(null);

    try {
      const options = getConvertOptions();
      const result = await convertData(parsedData, options);

      // Add to history
      addHistoryItem({
        inputFormat: inputFormat || 'unknown',
        outputFormat: outputFormat,
        fileName: fileName || 'Untitled',
        fileSize: fileSize || 0,
        rowCount: parsedData.rows.length,
        columnCount: parsedData.headers.length,
        status: result.success ? 'success' : 'error',
        errorMessage: result.success ? undefined : result.error,
      });

      if (result.success) {
        setResult(result);
      } else {
        setConvertError(result.error || t('convertFailed'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('convertFailed');

      // Add failed conversion to history
      addHistoryItem({
        inputFormat: inputFormat || 'unknown',
        outputFormat: outputFormat,
        fileName: fileName || 'Untitled',
        fileSize: fileSize || 0,
        rowCount: parsedData.rows.length,
        columnCount: parsedData.headers.length,
        status: 'error',
        errorMessage: errorMessage,
      });

      setConvertError(errorMessage);
    } finally {
      setIsConverting(false);
    }
  }, [parsedData, inputFormat, outputFormat, fileName, fileSize, getConvertOptions, setIsConverting, setResult, setConvertError, addHistoryItem, t]);

  return (
    <Button
      size="lg"
      className="w-full"
      onClick={handleConvert}
      disabled={!parsedData || isConverting}
      data-testid="convert-btn"
    >
      {isConverting ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {t('converting')}
        </>
      ) : (
        <>
          <ArrowRightLeft className="mr-2 h-5 w-5" />
          {t('convertButton')}
        </>
      )}
    </Button>
  );
}
