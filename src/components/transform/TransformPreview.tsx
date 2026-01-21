'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTransformStore } from '@/stores/transform-store';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export function TransformPreview() {
  const t = useTranslations('transform');
  const { previewResult, isPreviewLoading, sourceData, steps } = useTransformStore();

  if (!sourceData) {
    return null;
  }

  const maxPreviewRows = 10;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t('preview')}</CardTitle>
          {previewResult && (
            <div className="flex items-center gap-2">
              {previewResult.success ? (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {t('previewSuccess')}
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {t('previewError')}
                </Badge>
              )}
              {steps.length > 0 && (
                <Badge variant="outline">
                  {t('rowsAffected', { count: previewResult.rowsAffected })}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isPreviewLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">{t('processing')}</span>
          </div>
        ) : previewResult ? (
          <div className="space-y-3">
            {/* Error message */}
            {!previewResult.success && previewResult.error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{previewResult.error}</p>
              </div>
            )}

            {/* Statistics */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>
                {t('totalRows')}: <strong>{previewResult.rows.length}</strong>
              </span>
              <span>
                {t('totalColumns')}: <strong>{previewResult.headers.length}</strong>
              </span>
              {sourceData && steps.length > 0 && (
                <span>
                  {t('originalRows')}: <strong>{sourceData.rows.length}</strong>
                </span>
              )}
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-10">
                      #
                    </th>
                    {previewResult.headers.map((header, idx) => (
                      <th
                        key={idx}
                        className="px-3 py-2 text-left text-xs font-medium truncate max-w-[150px]"
                        title={header}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewResult.rows.slice(0, maxPreviewRows).map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-muted/30">
                      <td className="px-3 py-2 text-xs text-muted-foreground">{rowIdx + 1}</td>
                      {row.map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          className="px-3 py-2 truncate max-w-[150px]"
                          title={cell}
                        >
                          {cell || <span className="text-muted-foreground italic">empty</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* More rows indicator */}
            {previewResult.rows.length > maxPreviewRows && (
              <p className="text-xs text-muted-foreground text-center">
                {t('showingRows', { shown: maxPreviewRows, total: previewResult.rows.length })}
              </p>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">
            {t('noPreview')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
