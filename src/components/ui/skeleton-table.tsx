'use client';

import { cn } from '@/lib/utils';

interface SkeletonTableProps {
  /** Number of skeleton rows to display */
  rows?: number;
  /** Number of columns */
  columns?: number;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show header skeleton */
  showHeader?: boolean;
}

/**
 * Skeleton loading state for table data
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
  showHeader = true,
}: SkeletonTableProps) {
  return (
    <div className={cn('animate-pulse space-y-2', className)}>
      {/* Header skeleton */}
      {showHeader && (
        <div className="flex gap-2">
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={`header-${i}`}
              className="h-10 bg-muted rounded flex-1"
            />
          ))}
        </div>
      )}

      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={`cell-${rowIndex}-${colIndex}`}
              className={cn(
                'h-8 bg-muted/50 rounded flex-1',
                // Vary widths for more natural look
                colIndex === 0 && 'w-1/4',
                colIndex === columns - 1 && 'w-1/5'
              )}
              style={{
                // Add slight random variation to animation delay
                animationDelay: `${(rowIndex * columns + colIndex) * 50}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  /** Additional CSS classes */
  className?: string;
  /** Whether to show action buttons skeleton */
  showActions?: boolean;
}

/**
 * Skeleton loading state for card content
 */
export function SkeletonCard({ className, showActions = false }: SkeletonCardProps) {
  return (
    <div className={cn('animate-pulse space-y-4', className)}>
      {/* Title skeleton */}
      <div className="h-6 bg-muted rounded w-1/3" />

      {/* Content skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-muted/50 rounded w-full" />
        <div className="h-4 bg-muted/50 rounded w-5/6" />
        <div className="h-4 bg-muted/50 rounded w-4/6" />
      </div>

      {/* Actions skeleton */}
      {showActions && (
        <div className="flex gap-2 pt-2">
          <div className="h-9 bg-muted rounded w-24" />
          <div className="h-9 bg-muted rounded w-24" />
        </div>
      )}
    </div>
  );
}

interface SkeletonRowProps {
  /** Number of columns */
  columns?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Single row skeleton for list items
 */
export function SkeletonRow({ columns = 4, className }: SkeletonRowProps) {
  return (
    <div className={cn('animate-pulse flex gap-2', className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className="h-8 bg-muted/50 rounded flex-1"
        />
      ))}
    </div>
  );
}
