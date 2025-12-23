'use client';

import { useMemo, useState, useCallback, memo } from 'react';
import { useTranslations } from 'next-intl';
import { useConverterStore } from '@/stores/converter-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

const ROWS_PER_PAGE = 10;

/**
 * Memoized table row component for better performance
 */
const TableRow = memo(function TableRow({
  row,
  headers,
  rowIndex,
}: {
  row: Record<string, unknown>;
  headers: string[];
  rowIndex: number;
}) {
  return (
    <tr className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
      {headers.map((header, colIndex) => (
        <td
          key={header}
          className="max-w-xs truncate"
          role="cell"
          headers={`col-${colIndex}`}
        >
          {String(row[header] ?? '')}
        </td>
      ))}
    </tr>
  );
});

export function DataPreview() {
  const t = useTranslations('preview');
  const parsedData = useConverterStore((state) => state.parsedData);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Memoized filtered and sorted rows
  const filteredRows = useMemo(() => {
    if (!parsedData?.rows) return [];

    let rows = [...parsedData.rows];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      rows = rows.filter((row) =>
        Object.values(row).some((val) =>
          String(val ?? '').toLowerCase().includes(term)
        )
      );
    }

    // Sort
    if (sortColumn) {
      rows.sort((a, b) => {
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

    return rows;
  }, [parsedData?.rows, searchTerm, sortColumn, sortDirection]);

  // Memoized pagination values
  const totalPages = useMemo(
    () => Math.ceil(filteredRows.length / ROWS_PER_PAGE),
    [filteredRows.length]
  );

  const paginatedRows = useMemo(
    () =>
      filteredRows.slice(
        currentPage * ROWS_PER_PAGE,
        (currentPage + 1) * ROWS_PER_PAGE
      ),
    [filteredRows, currentPage]
  );

  // Memoized handlers
  const handleSort = useCallback((column: string) => {
    setSortColumn((prevColumn) => {
      if (prevColumn === column) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        return column;
      }
      setSortDirection('asc');
      return column;
    });
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0);
  }, []);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  if (!parsedData || parsedData.headers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8" data-testid="data-preview">
            {t('noData')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t('rowCount', { count: parsedData.rows.length })}</span>
            <span>|</span>
            <span>{t('colCount', { count: parsedData.headers.length })}</span>
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
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border" data-testid="data-preview">
          <table className="data-table" role="grid" aria-label={t('tableLabel')}>
            <caption className="sr-only">
              {t('tableCaption', { rows: filteredRows.length, cols: parsedData.headers.length })}
            </caption>
            <thead>
              <tr role="row">
                {parsedData.headers.map((header, colIndex) => (
                  <th
                    key={header}
                    id={`col-${colIndex}`}
                    scope="col"
                    role="columnheader"
                    className="cursor-pointer select-none whitespace-nowrap"
                    onClick={() => handleSort(header)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSort(header);
                      }
                    }}
                    tabIndex={0}
                    aria-sort={
                      sortColumn === header
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <div className="flex items-center gap-1">
                      {header}
                      <ArrowUpDown className="h-3 w-3 opacity-50" aria-hidden="true" />
                      <span className="sr-only">
                        {sortColumn === header
                          ? sortDirection === 'asc'
                            ? t('sortedAsc')
                            : t('sortedDesc')
                          : t('clickToSort')}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr role="row">
                  <td colSpan={parsedData.headers.length} className="text-center py-4" role="cell">
                    {t('noResults')}
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    row={row}
                    headers={parsedData.headers}
                    rowIndex={rowIndex}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav aria-label={t('paginationLabel')} className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t('showing', {
                from: currentPage * ROWS_PER_PAGE + 1,
                to: Math.min((currentPage + 1) * ROWS_PER_PAGE, filteredRows.length),
                total: filteredRows.length,
              })}
            </p>
            <div className="flex gap-2" role="group" aria-label={t('paginationControls')}>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                aria-label={t('previousPage')}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1}
                aria-label={t('nextPage')}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </nav>
        )}
      </CardContent>
    </Card>
  );
}
