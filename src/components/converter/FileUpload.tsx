'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useConverterStore } from '@/stores/converter-store';
import { parseData, detectFormat, detectFormatFromFilename } from '@/lib/converter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Link as LinkIcon, X, Loader2 } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const SAMPLE_CSV = `name,age,city,email
John Doe,30,New York,john@example.com
Jane Smith,25,Los Angeles,jane@example.com
Bob Johnson,35,Chicago,bob@example.com
Alice Brown,28,Houston,alice@example.com
Charlie Wilson,32,Phoenix,charlie@example.com`;

export function FileUpload() {
  const t = useTranslations('upload');
  const tCommon = useTranslations('common');
  const [isDragging, setIsDragging] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  const {
    setInputData,
    setInputFormat,
    setParsedData,
    setIsParsing,
    setParseError,
    fileName,
    fileSize,
    isParsing,
    parseError,
  } = useConverterStore();

  const handleFile = useCallback(
    async (file: File) => {
      setIsParsing(true);
      setParseError(null);

      try {
        const format = detectFormatFromFilename(file.name);
        setInputFormat(format);

        let data: string | ArrayBuffer;
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          data = await file.arrayBuffer();
        } else {
          data = await file.text();
        }

        setInputData(data, file.name, file.size);

        const parsed = await parseData(data, format ?? undefined);
        setParsedData(parsed);
      } catch (error) {
        setParseError(error instanceof Error ? error.message : t('parseError'));
      } finally {
        setIsParsing(false);
      }
    },
    [setInputData, setInputFormat, setParsedData, setIsParsing, setParseError, t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handlePaste = useCallback(async () => {
    if (!pasteData.trim()) return;

    setIsParsing(true);
    setParseError(null);

    try {
      const format = detectFormat(pasteData);
      setInputFormat(format);
      setInputData(pasteData, 'pasted-data', pasteData.length);

      const parsed = await parseData(pasteData, format);
      setParsedData(parsed);
      setPasteData('');
    } catch (error) {
      setParseError(error instanceof Error ? error.message : t('parseError'));
    } finally {
      setIsParsing(false);
    }
  }, [pasteData, setInputData, setInputFormat, setParsedData, setIsParsing, setParseError, t]);

  const handleLoadSample = useCallback(async () => {
    setIsParsing(true);
    setParseError(null);

    try {
      setInputFormat('csv');
      setInputData(SAMPLE_CSV, 'sample.csv', SAMPLE_CSV.length);

      const parsed = await parseData(SAMPLE_CSV, 'csv');
      setParsedData(parsed);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : t('parseError'));
    } finally {
      setIsParsing(false);
    }
  }, [setInputData, setInputFormat, setParsedData, setIsParsing, setParseError, t]);

  const handleUrlImport = useCallback(async () => {
    if (!urlInput.trim()) return;

    setIsLoadingUrl(true);
    setIsParsing(true);
    setParseError(null);

    try {
      const response = await fetch(urlInput);
      if (!response.ok) throw new Error('Failed to fetch URL');

      const text = await response.text();
      const format = detectFormat(text);
      setInputFormat(format);
      setInputData(text, urlInput.split('/').pop() || 'imported', text.length);

      const parsed = await parseData(text, format);
      setParsedData(parsed);
      setUrlInput('');
    } catch (error) {
      setParseError(error instanceof Error ? error.message : t('parseError'));
    } finally {
      setIsLoadingUrl(false);
      setIsParsing(false);
    }
  }, [urlInput, setInputData, setInputFormat, setParsedData, setIsParsing, setParseError, t]);

  const handleClear = useCallback(() => {
    setInputData(null);
    setInputFormat(null);
    setParsedData(null);
    setParseError(null);
    setPasteData('');
    setUrlInput('');
  }, [setInputData, setInputFormat, setParsedData, setParseError]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File selected indicator */}
        {fileName && (
          <div
            className="flex items-center justify-between rounded-lg border bg-muted/50 p-3"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">{fileName}</p>
                {fileSize && (
                  <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              aria-label={t('clearFile')}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}

        {/* Hidden file input - placed outside interactive dropzone for accessibility */}
        <input
          id="file-input"
          type="file"
          className="sr-only"
          accept=".csv,.tsv,.json,.xlsx,.xls,.xml"
          onChange={handleFileSelect}
          aria-label={t('fileInputLabel')}
          aria-invalid={!!parseError}
          aria-errormessage={parseError ? 'file-upload-error' : undefined}
          tabIndex={-1}
        />

        {/* Dropzone */}
        <div
          className={cn(
            'dropzone cursor-pointer',
            isDragging && 'active',
            isParsing && 'opacity-50 pointer-events-none',
            parseError && 'border-destructive'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('file-input')?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              document.getElementById('file-input')?.click();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={t('dropzoneLabel')}
          aria-describedby="file-upload-hint file-upload-error"
          aria-busy={isParsing}
          data-testid="upload-dropzone"
        >
          {isParsing ? (
            <div className="flex items-center justify-center gap-2" role="status" aria-live="polite">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
              <span>{tCommon('processing')}</span>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
              <p className="mt-2">{isDragging ? t('dropzoneActive') : t('dropzone')}</p>
              <span
                className="mt-4 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
                aria-hidden="true"
              >
                {t('browse')}
              </span>
              <p id="file-upload-hint" className="mt-2 text-xs text-muted-foreground">
                {t('supportedFormats')}
              </p>
            </>
          )}
        </div>

        {/* Error message */}
        {parseError && (
          <div
            id="file-upload-error"
            className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
            aria-live="assertive"
          >
            {parseError}
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">{tCommon('or')}</span>
          </div>
        </div>

        {/* Paste data */}
        <div className="space-y-2">
          <label htmlFor="paste-data" className="text-sm font-medium">
            {t('paste')}
          </label>
          <Textarea
            id="paste-data"
            placeholder={t('pasteHint')}
            value={pasteData}
            onChange={(e) => setPasteData(e.target.value)}
            rows={4}
            aria-describedby="paste-hint"
            data-testid="paste-input"
          />
          <p id="paste-hint" className="sr-only">
            {t('pasteHint')}
          </p>
          <Button
            onClick={handlePaste}
            disabled={!pasteData.trim() || isParsing}
            className="w-full sm:w-auto"
          >
            {tCommon('paste')}
          </Button>
        </div>

        {/* URL import */}
        <div className="space-y-2">
          <label htmlFor="url-input" className="text-sm font-medium">
            {t('url')}
          </label>
          <div className="flex gap-2">
            <Input
              id="url-input"
              type="url"
              placeholder={t('urlPlaceholder')}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1"
              aria-describedby="url-hint"
            />
            <Button
              onClick={handleUrlImport}
              disabled={!urlInput.trim() || isLoadingUrl}
              variant="secondary"
              aria-busy={isLoadingUrl}
            >
              {isLoadingUrl ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <LinkIcon className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="ml-2">{t('urlImport')}</span>
            </Button>
          </div>
          <p id="url-hint" className="sr-only">
            {t('urlPlaceholder')}
          </p>
        </div>

        {/* Sample data */}
        <div className="pt-2">
          <Button variant="outline" onClick={handleLoadSample} disabled={isParsing}>
            {t('sampleData')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
