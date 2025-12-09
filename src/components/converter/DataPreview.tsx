'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useConverterStore } from '@/stores/converter-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

const ROWS_PER_PAGE = 10;

export function DataPreview() {
  const t = useTranslations('preview');
  const { parsedData } = useConverterStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  const totalPages = Math.ceil(filteredRows.length / ROWS_PER_PAGE);
  const paginatedRows = filteredRows.slice(
    currentPage * ROWS_PER_PAGE,
    (currentPage + 1) * ROWS_PER_PAGE
  );

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

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
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(0);
            }}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border" data-testid="data-preview">
          <table className="data-table">
            <thead>
              <tr>
                {parsedData.headers.map((header) => (
                  <th
                    key={header}
                    className="cursor-pointer select-none whitespace-nowrap"
                    onClick={() => handleSort(header)}
                  >
                    <div className="flex items-center gap-1">
                      {header}
                      <ArrowUpDown className="h-3 w-3 opacity-50" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={parsedData.headers.length} className="text-center py-4">
                    {t('noResults')}
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {parsedData.headers.map((header) => (
                      <td key={header} className="max-w-xs truncate">
                        {String(row[header] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t('showing', {
                from: currentPage * ROWS_PER_PAGE + 1,
                to: Math.min((currentPage + 1) * ROWS_PER_PAGE, filteredRows.length),
                total: filteredRows.length,
              })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
