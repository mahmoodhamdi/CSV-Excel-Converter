'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Label to display */
  label?: string;
  /** Callback when cancel is clicked */
  onCancel?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show as indeterminate */
  indeterminate?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Progress indicator with optional cancel button
 */
export function ProgressIndicator({
  progress,
  label,
  onCancel,
  className,
  indeterminate = false,
  size = 'md',
}: ProgressIndicatorProps) {
  const t = useTranslations('common');

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label and percentage */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground flex items-center gap-2">
          {indeterminate && <Loader2 className="h-3 w-3 animate-spin" />}
          {label || t('processing')}
        </span>
        {!indeterminate && (
          <span className="font-medium">{Math.round(clampedProgress)}%</span>
        )}
      </div>

      {/* Progress bar */}
      <div className={cn('bg-muted rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn(
            'h-full bg-primary transition-all duration-300 ease-out',
            indeterminate && 'animate-pulse'
          )}
          style={{
            width: indeterminate ? '100%' : `${clampedProgress}%`,
          }}
        />
      </div>

      {/* Cancel button */}
      {onCancel && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-muted-foreground hover:text-destructive"
        >
          <X className="h-3 w-3 mr-1" />
          {t('cancel')}
        </Button>
      )}
    </div>
  );
}

interface FileProgressProps {
  /** File name */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
  /** Progress percentage (0-100) */
  progress: number;
  /** Current status */
  status?: 'uploading' | 'processing' | 'complete' | 'error';
  /** Error message if status is error */
  errorMessage?: string;
  /** Callback when cancel is clicked */
  onCancel?: () => void;
}

/**
 * File upload/processing progress indicator
 */
export function FileProgress({
  fileName,
  fileSize,
  progress,
  status = 'processing',
  errorMessage,
  onCancel,
}: FileProgressProps) {
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const statusColors = {
    uploading: 'bg-blue-500',
    processing: 'bg-primary',
    complete: 'bg-green-500',
    error: 'bg-destructive',
  };

  return (
    <div className="space-y-2 p-3 rounded-lg border bg-card">
      {/* File info */}
      <div className="flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fileName}</p>
          <p className="text-xs text-muted-foreground">{formatSize(fileSize)}</p>
        </div>
        {status !== 'complete' && status !== 'error' && onCancel && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onCancel}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300',
            statusColors[status]
          )}
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>

      {/* Status text */}
      {status === 'error' && errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}

interface BatchProgressProps {
  /** Current file index (1-based) */
  current: number;
  /** Total number of files */
  total: number;
  /** Current file progress (0-100) */
  fileProgress: number;
  /** Overall progress (0-100) */
  overallProgress: number;
  /** Callback when cancel is clicked */
  onCancel?: () => void;
}

/**
 * Batch processing progress indicator
 */
export function BatchProgress({
  current,
  total,
  fileProgress,
  overallProgress,
  onCancel,
}: BatchProgressProps) {
  const t = useTranslations('batch');

  return (
    <div className="space-y-4">
      {/* Overall progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="font-medium">
            {t('converting', { current, total })}
          </span>
          <span>{Math.round(overallProgress)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Current file progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Current file</span>
          <span>{Math.round(fileProgress)}%</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${fileProgress}%` }}
          />
        </div>
      </div>

      {/* Cancel button */}
      {onCancel && (
        <Button variant="outline" size="sm" onClick={onCancel} className="w-full">
          <X className="h-3 w-3 mr-1" />
          {t('clearAll')}
        </Button>
      )}
    </div>
  );
}
