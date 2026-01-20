'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Files,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  Archive,
} from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { parseData, convertData, getOutputFilename, detectFormatFromFilename } from '@/lib/converter';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { OutputFormat, InputFormat } from '@/types';

interface BatchFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
  result?: Blob | string;
  outputFileName?: string;
}

const OUTPUT_FORMATS: { value: OutputFormat; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'tsv', label: 'TSV' },
  { value: 'xlsx', label: 'Excel (XLSX)' },
  { value: 'xml', label: 'XML' },
  { value: 'sql', label: 'SQL' },
];

const MAX_FILES = 10;

export default function BatchPage() {
  const t = useTranslations('batch');
  const tCommon = useTranslations('common');
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('json');
  const [isConverting, setIsConverting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const remainingSlots = MAX_FILES - files.length;
    const filesToAdd = fileArray.slice(0, remainingSlots);

    const newBatchFiles: BatchFile[] = filesToAdd.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      status: 'pending' as const,
    }));

    setFiles((prev) => [...prev, ...newBatchFiles]);
  }, [files.length]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(e.target.files);
      }
    },
    [addFiles]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
  }, []);

  const convertFile = async (batchFile: BatchFile): Promise<BatchFile> => {
    try {
      const format = detectFormatFromFilename(batchFile.file.name);
      let data: string | ArrayBuffer;

      if (batchFile.file.name.endsWith('.xlsx') || batchFile.file.name.endsWith('.xls')) {
        data = await batchFile.file.arrayBuffer();
      } else {
        data = await batchFile.file.text();
      }

      const parsedData = await parseData(data, format ?? undefined);
      const result = await convertData(parsedData, { outputFormat });

      if (!result.success) {
        return {
          ...batchFile,
          status: 'error',
          error: result.error || 'Conversion failed',
        };
      }

      const outputFileName = getOutputFilename(batchFile.file.name, outputFormat);

      return {
        ...batchFile,
        status: 'success',
        result: result.data as Blob | string,
        outputFileName,
      };
    } catch (error) {
      return {
        ...batchFile,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const convertAll = useCallback(async () => {
    setIsConverting(true);

    // Reset all files to pending
    setFiles((prev) =>
      prev.map((f) => ({ ...f, status: 'pending' as const, error: undefined, result: undefined }))
    );

    for (let i = 0; i < files.length; i++) {
      // Update status to processing
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'processing' as const } : f))
      );

      const result = await convertFile(files[i]);

      // Update with result
      setFiles((prev) => prev.map((f, idx) => (idx === i ? result : f)));
    }

    setIsConverting(false);
  }, [files, outputFormat]);

  const downloadAll = useCallback(async () => {
    const successFiles = files.filter((f) => f.status === 'success' && f.result);

    if (successFiles.length === 0) return;

    if (successFiles.length === 1) {
      // Download single file directly
      const file = successFiles[0];
      if (file.result instanceof Blob) {
        saveAs(file.result, file.outputFileName || 'converted');
      } else {
        const blob = new Blob([file.result!], { type: 'text/plain' });
        saveAs(blob, file.outputFileName || 'converted');
      }
      return;
    }

    // Create ZIP for multiple files
    const zip = new JSZip();

    for (const file of successFiles) {
      if (file.result instanceof Blob) {
        zip.file(file.outputFileName || 'converted', file.result);
      } else {
        zip.file(file.outputFileName || 'converted.txt', file.result!);
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'converted-files.zip');
  }, [files]);

  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;
  const totalSize = files.reduce((acc, f) => acc + f.file.size, 0);

  return (
    <div className="container px-4 py-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t('title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hidden file input */}
            <input
              id="batch-file-input"
              type="file"
              className="sr-only"
              accept=".csv,.tsv,.json,.xlsx,.xls,.xml"
              multiple
              onChange={handleFileSelect}
            />

            {/* Dropzone */}
            <div
              className={cn(
                'dropzone cursor-pointer',
                isDragging && 'active',
                files.length >= MAX_FILES && 'opacity-50 pointer-events-none'
              )}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onClick={() => document.getElementById('batch-file-input')?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  document.getElementById('batch-file-input')?.click();
                }
              }}
            >
              <Files className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2">{isDragging ? t('dropzone') : t('dropzone')}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('maxFiles', { max: MAX_FILES })} ({files.length}/{MAX_FILES})
              </p>
            </div>

            {/* Output Format Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('outputFormat')}</label>
              <Select
                value={outputFormat}
                onValueChange={(v) => setOutputFormat(v as OutputFormat)}
              >
                <SelectTrigger>
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

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={convertAll}
                disabled={files.length === 0 || isConverting}
                className="flex-1"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('converting', {
                      current: files.filter((f) => f.status !== 'pending').length,
                      total: files.length,
                    })}
                  </>
                ) : (
                  <>
                    <Files className="mr-2 h-4 w-4" />
                    {t('convertAll')}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={clearAll} disabled={files.length === 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('clearAll')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Files List Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('filesSelected', { count: files.length })}
              </span>
              {files.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  {t('totalSize')}: {formatFileSize(totalSize)}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                {t('dropzone')}
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {files.map((batchFile) => (
                  <div
                    key={batchFile.id}
                    className={cn(
                      'flex items-center justify-between rounded-lg border p-3',
                      batchFile.status === 'success' && 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20',
                      batchFile.status === 'error' && 'border-destructive/50 bg-destructive/10'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {batchFile.status === 'pending' && (
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      {batchFile.status === 'processing' && (
                        <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                      )}
                      {batchFile.status === 'success' && (
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      )}
                      {batchFile.status === 'error' && (
                        <XCircle className="h-5 w-5 text-destructive shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{batchFile.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(batchFile.file.size)}
                          {batchFile.error && (
                            <span className="text-destructive ml-2">{batchFile.error}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(batchFile.id)}
                      disabled={batchFile.status === 'processing'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Results Summary */}
            {(successCount > 0 || errorCount > 0) && (
              <div className="mt-4 space-y-3">
                <div className="flex gap-4 text-sm">
                  {successCount > 0 && (
                    <span className="text-green-600">
                      {t('results.success', { count: successCount })}
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="text-destructive">
                      {t('results.failed', { count: errorCount })}
                    </span>
                  )}
                </div>

                {successCount > 0 && (
                  <Button onClick={downloadAll} className="w-full">
                    <Archive className="mr-2 h-4 w-4" />
                    {t('downloadAll')}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
