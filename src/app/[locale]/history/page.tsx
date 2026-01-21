'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  History,
  ArrowRight,
  Trash2,
  Download,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import {
  useHistoryStore,
  formatFileSize,
  formatDate,
  exportHistoryAsJson,
  type HistoryItem,
  type HistoryFilter,
} from '@/stores/history-store';

const ITEMS_PER_PAGE = 10;

export default function HistoryPage() {
  const t = useTranslations('history');
  const locale = useLocale();
  const { items, removeItem, clearAll } = useHistoryStore();

  // Filter state
  const [filter, setFilter] = useState<HistoryFilter>({
    status: 'all',
    searchQuery: '',
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Confirmation dialog state
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Client-side hydration fix
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!isClient) return [];

    return items.filter((item) => {
      // Filter by status
      if (filter.status && filter.status !== 'all' && item.status !== filter.status) {
        return false;
      }

      // Filter by search query
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const matchesFileName = item.fileName.toLowerCase().includes(query);
        const matchesFormat =
          item.inputFormat.toLowerCase().includes(query) ||
          item.outputFormat.toLowerCase().includes(query);
        if (!matchesFileName && !matchesFormat) {
          return false;
        }
      }

      return true;
    });
  }, [items, filter, isClient]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Handle export
  const handleExport = useCallback(() => {
    const json = exportHistoryAsJson(filteredItems);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversion-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filteredItems]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    clearAll();
    setShowClearConfirm(false);
    setCurrentPage(1);
  }, [clearAll]);

  // Statistics
  const stats = useMemo(() => {
    if (!isClient) return { total: 0, success: 0, error: 0 };
    return {
      total: items.length,
      success: items.filter((i) => i.status === 'success').length,
      error: items.filter((i) => i.status === 'error').length,
    };
  }, [items, isClient]);

  return (
    <div className="container px-4 py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>
        </div>
        {isClient && items.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              {t('export')}
            </Button>
            {showClearConfirm ? (
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={handleClearAll}>
                  {t('confirmClear')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowClearConfirm(false)}>
                  {t('cancelClear')}
                </Button>
              </div>
            ) : (
              <Button variant="destructive" size="sm" onClick={() => setShowClearConfirm(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('clearHistory')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      {isClient && items.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-primary/10 p-2">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('totalConversions')}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-green-500/10 p-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('successful')}</p>
                <p className="text-2xl font-bold">{stats.success}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-destructive/10 p-2">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('failed')}</p>
                <p className="text-2xl font-bold">{stats.error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {isClient && items.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={filter.searchQuery || ''}
                  onChange={(e) => setFilter((f) => ({ ...f, searchQuery: e.target.value }))}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filter.status === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter((f) => ({ ...f, status: 'all' }))}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  {t('filterAll')}
                </Button>
                <Button
                  variant={filter.status === 'success' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter((f) => ({ ...f, status: 'success' }))}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t('filterSuccess')}
                </Button>
                <Button
                  variant={filter.status === 'error' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter((f) => ({ ...f, status: 'error' }))}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {t('filterError')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History List */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          {isClient && filteredItems.length > 0 && (
            <CardDescription>
              {t('showing', {
                from: (currentPage - 1) * ITEMS_PER_PAGE + 1,
                to: Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length),
                total: filteredItems.length,
              })}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {!isClient || items.length === 0 ? (
            <div className="py-12 text-center">
              <History className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">{t('empty')}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t('emptyDesc')}</p>
              <Button className="mt-6" asChild>
                <Link href="/">
                  {t('startConverting')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">{t('noResults')}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t('noResultsDesc')}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setFilter({ status: 'all', searchQuery: '' })}
              >
                {t('clearFilters')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedItems.map((item) => (
                <HistoryItemCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  onDelete={() => removeItem(item.id)}
                  t={t}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {isClient && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-4 text-sm text-muted-foreground">
            {t('pageOf', { current: currentPage, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// History Item Card Component
interface HistoryItemCardProps {
  item: HistoryItem;
  locale: string;
  onDelete: () => void;
  t: ReturnType<typeof useTranslations<'history'>>;
}

function HistoryItemCard({ item, locale, onDelete, t }: HistoryItemCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div
      className={`flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
        item.status === 'error' ? 'border-destructive/50 bg-destructive/5' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`rounded-full p-2 ${
            item.status === 'success' ? 'bg-green-500/10' : 'bg-destructive/10'
          }`}
        >
          {item.status === 'success' ? (
            <FileSpreadsheet className="h-5 w-5 text-green-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <p className="font-medium">{item.fileName}</p>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="rounded bg-muted px-2 py-0.5">
              {item.inputFormat.toUpperCase()} → {item.outputFormat.toUpperCase()}
            </span>
            <span>{formatFileSize(item.fileSize)}</span>
            <span>
              {item.rowCount} {t('rows')} × {item.columnCount} {t('columns')}
            </span>
          </div>
          {item.status === 'error' && item.errorMessage && (
            <p className="text-sm text-destructive">{item.errorMessage}</p>
          )}
          <p className="text-xs text-muted-foreground">{formatDate(item.timestamp, locale)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showDeleteConfirm ? (
          <>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              {t('confirmDelete')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
              {t('cancelDelete')}
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
