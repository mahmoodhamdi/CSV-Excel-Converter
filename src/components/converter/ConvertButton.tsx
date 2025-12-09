'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useConverterStore } from '@/stores/converter-store';
import { convertData } from '@/lib/converter';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRightLeft } from 'lucide-react';

export function ConvertButton() {
  const t = useTranslations('convert');
  const {
    parsedData,
    isConverting,
    setIsConverting,
    setResult,
    setConvertError,
    getConvertOptions,
  } = useConverterStore();

  const handleConvert = useCallback(() => {
    if (!parsedData) return;

    setIsConverting(true);
    setConvertError(null);

    try {
      const options = getConvertOptions();
      const result = convertData(parsedData, options);

      if (result.success) {
        setResult(result);
      } else {
        setConvertError(result.error || t('convertFailed'));
      }
    } catch (error) {
      setConvertError(error instanceof Error ? error.message : t('convertFailed'));
    } finally {
      setIsConverting(false);
    }
  }, [parsedData, getConvertOptions, setIsConverting, setResult, setConvertError, t]);

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
