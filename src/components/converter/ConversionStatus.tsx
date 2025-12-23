'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useConverterStore } from '@/stores/converter-store';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export function ConversionStatus() {
  const t = useTranslations('status');
  const announcementRef = useRef<HTMLDivElement>(null);

  const isParsing = useConverterStore((state) => state.isParsing);
  const isConverting = useConverterStore((state) => state.isConverting);
  const parseError = useConverterStore((state) => state.parseError);
  const convertError = useConverterStore((state) => state.convertError);
  const result = useConverterStore((state) => state.result);

  const announce = (message: string) => {
    if (announcementRef.current) {
      // Clear first to ensure re-announcement
      announcementRef.current.textContent = '';
      // Use setTimeout to ensure the change is detected by screen readers
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = message;
        }
      }, 100);
    }
  };

  useEffect(() => {
    if (isParsing) {
      announce(t('parsing'));
    }
  }, [isParsing, t]);

  useEffect(() => {
    if (isConverting) {
      announce(t('converting'));
    }
  }, [isConverting, t]);

  useEffect(() => {
    if (result?.success) {
      announce(t('conversionComplete'));
    }
  }, [result, t]);

  useEffect(() => {
    if (parseError) {
      announce(t('error', { message: parseError }));
    }
  }, [parseError, t]);

  useEffect(() => {
    if (convertError) {
      announce(t('error', { message: convertError }));
    }
  }, [convertError, t]);

  const error = parseError || convertError;

  return (
    <>
      {/* Live region for screen reader announcements */}
      <div
        ref={announcementRef}
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Visual status indicator */}
      {(isParsing || isConverting) && (
        <div
          className="flex items-center gap-2 text-muted-foreground p-3 rounded-lg bg-muted/50"
          aria-hidden="true"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{isParsing ? t('parsing') : t('converting')}</span>
        </div>
      )}

      {result?.success && !isParsing && !isConverting && (
        <div
          className="flex items-center gap-2 text-green-600 dark:text-green-400 p-3 rounded-lg bg-green-50 dark:bg-green-900/20"
          aria-hidden="true"
        >
          <CheckCircle className="h-4 w-4" />
          <span>{t('conversionComplete')}</span>
        </div>
      )}

      {error && !isParsing && !isConverting && (
        <div
          className="flex items-center gap-2 text-destructive p-3 rounded-lg bg-destructive/10"
          role="alert"
        >
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </>
  );
}
