'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { profileData, type InferredType } from '@/lib/profile';

interface Props {
  headers: string[];
  rows: Record<string, unknown>[];
}

const TYPE_BADGE_COLOR: Record<InferredType, string> = {
  integer: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  float: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  boolean: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  date: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200',
  datetime: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200',
  string: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  null: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
};

function fmtPct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function fmtNum(n: number | string | null) {
  if (n === null) return '—';
  if (typeof n === 'number') {
    if (Number.isInteger(n)) return n.toString();
    return n.toFixed(2);
  }
  return String(n).slice(0, 20);
}

export function ProfilePanel({ headers, rows }: Props) {
  const profile = useMemo(() => profileData(headers, rows), [headers, rows]);

  if (headers.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Data Profile</CardTitle>
        <p className="text-sm text-muted-foreground">
          {profile.rowCount} rows × {profile.columnCount} columns
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Column</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Nulls</th>
                <th className="px-3 py-2 font-medium">Unique</th>
                <th className="px-3 py-2 font-medium">Min</th>
                <th className="px-3 py-2 font-medium">Max</th>
                <th className="px-3 py-2 font-medium">Mean</th>
                <th className="px-3 py-2 font-medium">Top values</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {profile.columns.map((col) => (
                <tr key={col.name} className="hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium">{col.name}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${TYPE_BADGE_COLOR[col.type]}`}
                    >
                      {col.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {col.nullCount > 0 ? fmtPct(col.nullPct) : '—'}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {col.uniqueCount} ({fmtPct(col.uniquePct)})
                  </td>
                  <td className="px-3 py-2 tabular-nums">{fmtNum(col.min)}</td>
                  <td className="px-3 py-2 tabular-nums">{fmtNum(col.max)}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {col.mean !== null ? col.mean.toFixed(2) : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {col.topValues.slice(0, 3).map((v, i) => (
                        <span
                          key={i}
                          className="inline-block max-w-[120px] truncate rounded bg-muted px-1.5 py-0.5 text-xs"
                          title={String(v.value)}
                        >
                          {String(v.value)}
                          <span className="ms-1 text-muted-foreground">
                            ({v.count})
                          </span>
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
