'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, Search, ArrowUpDown } from 'lucide-react';
import type { ParsedData } from '@/types';
import { cn } from '@/lib/utils';

interface VirtualDataPreviewProps {
  data: ParsedData;
  maxHeight?: number;
  className?: string;
}

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 44;
const COLUMN_WIDTH = 150;
const OVERSCAN = 10;

/**
 * Virtualized data preview component for handling large datasets
 */
export function VirtualDataPreview({
  data,
  maxHeight = 500,
  className,
}: VirtualDataPreviewProps) {
  const t = useTranslations('preview');
  const parentRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { headers, rows } = data;

  // Filter and sort rows
  const processedRows = useMemo(() => {
    let result = [...rows];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          String(val ?? '').toLowerCase().includes(term)
        )
      );
    }

    // Sort
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        const comparison = String(aVal).localeCompare(String(bVal), undefined, {
          numeric: true,
        });

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [rows, searchTerm, sortColumn, sortDirection]);

  // Row virtualizer
  const rowVirtualizer = useVirtualizer({
    count: processedRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  // Column virtualizer
  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: headers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => COLUMN_WIDTH,
    overscan: 3,
  });

  // Memoized cell renderer
  const renderCell = useCallback((row: Record<string, unknown>, header: string) => {
    const value = row[header];
    if (value === null || value === undefined) return '';
    return String(value);
  }, []);

  // Handle sort
  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  if (!data || headers.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            {t('noData')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalWidth = columnVirtualizer.getTotalSize();
  const totalHeight = rowVirtualizer.getTotalSize() + HEADER_HEIGHT;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t('rowCount', { count: processedRows.length })}</span>
            <span>|</span>
            <span>{t('colCount', { count: headers.length })}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Virtual Table */}
        <div
          ref={parentRef}
          className="overflow-auto rounded-lg border"
          style={{ maxHeight }}
        >
          <div
            style={{
              height: totalHeight,
              width: Math.max(totalWidth, parentRef.current?.clientWidth || 0),
              position: 'relative',
            }}
          >
            {/* Header row */}
            <div
              className="sticky top-0 z-10 bg-muted flex"
              style={{
                width: totalWidth,
                height: HEADER_HEIGHT,
              }}
            >
              {columnVirtualizer.getVirtualItems().map((virtualColumn) => (
                <div
                  key={virtualColumn.key}
                  className={cn(
                    'absolute border-r border-b px-3 py-2 font-medium truncate',
                    'cursor-pointer select-none hover:bg-muted/80 transition-colors',
                    'flex items-center gap-1'
                  )}
                  style={{
                    left: virtualColumn.start,
                    width: virtualColumn.size,
                    height: HEADER_HEIGHT,
                  }}
                  onClick={() => handleSort(headers[virtualColumn.index])}
                >
                  <span className="truncate">{headers[virtualColumn.index]}</span>
                  <ArrowUpDown className="h-3 w-3 opacity-50 shrink-0" />
                  {sortColumn === headers[virtualColumn.index] && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Data rows */}
            {rowVirtualizer.getVirtualItems().map((virtualRow) => (
              <div
                key={virtualRow.key}
                className={cn(
                  'absolute flex',
                  virtualRow.index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                )}
                style={{
                  top: virtualRow.start + HEADER_HEIGHT,
                  height: virtualRow.size,
                  width: totalWidth,
                }}
              >
                {columnVirtualizer.getVirtualItems().map((virtualColumn) => (
                  <div
                    key={virtualColumn.key}
                    className="absolute border-r border-b px-3 py-2 truncate"
                    style={{
                      left: virtualColumn.start,
                      width: virtualColumn.size,
                      height: virtualRow.size,
                    }}
                    title={renderCell(
                      processedRows[virtualRow.index],
                      headers[virtualColumn.index]
                    )}
                  >
                    {renderCell(
                      processedRows[virtualRow.index],
                      headers[virtualColumn.index]
                    )}
                  </div>
                ))}
              </div>
            ))}

            {/* No results message */}
            {processedRows.length === 0 && (
              <div
                className="absolute inset-0 flex items-center justify-center text-muted-foreground"
                style={{ top: HEADER_HEIGHT }}
              >
                {t('noResults')}
              </div>
            )}
          </div>
        </div>

        {/* Row count info */}
        {processedRows.length !== rows.length && (
          <p className="text-sm text-muted-foreground text-center">
            Showing {processedRows.length} of {rows.length} rows
          </p>
        )}

        {/* Truncation warning */}
        {data.metadata?.truncated && (
          <p className="text-sm text-amber-600 text-center">
            Data truncated to {rows.length.toLocaleString()} rows for performance
          </p>
        )}
      </CardContent>
    </Card>
  );
}
