'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  FileType,
  Shield,
} from 'lucide-react';

interface Stats {
  totalRequests: number;
  totalConversions: number;
  successfulConversions: number;
  failedConversions: number;
  formatUsage: Record<string, number>;
  endpointHits: Record<string, number>;
  recentActivity: {
    timestamp: number;
    endpoint: string;
    inputFormat?: string;
    outputFormat?: string;
    success: boolean;
  }[];
  uptimeFormatted: string;
}

export default function AdminPage() {
  const t = useTranslations('admin');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchStats = async (authToken?: string) => {
    setLoading(true);
    setError(null);
    try {
      const tokenToUse = authToken || token;
      const url = tokenToUse
        ? `/api/admin/stats?token=${encodeURIComponent(tokenToUse)}`
        : '/api/admin/stats';
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) {
          setIsAuthenticated(false);
          setError(t('unauthorized'));
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch stats');
      }
      const data = await res.json();
      setStats(data.data);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/stats', { signal: controller.signal })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) {
            setIsAuthenticated(false);
            setError(t('unauthorized'));
          }
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && !controller.signal.aborted) {
          setStats(data.data);
          setIsAuthenticated(true);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : t('fetchError'));
          setLoading(false);
        }
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => fetchStats(), 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  if (!isAuthenticated && !loading) {
    return (
      <main id="main-content" className="container px-4 py-8">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('loginTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={t('tokenPlaceholder')}
                className="w-full rounded-md border px-3 py-2 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && fetchStats(token)}
              />
              <Button onClick={() => fetchStats(token)} className="w-full">
                {t('login')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const successRate = stats && stats.totalConversions > 0
    ? Math.round((stats.successfulConversions / stats.totalConversions) * 100)
    : 0;

  // Get top output formats
  const outputFormats = stats
    ? Object.entries(stats.formatUsage)
        .filter(([key]) => !key.startsWith('input:'))
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
    : [];

  const maxFormatCount = outputFormats.length > 0
    ? Math.max(...outputFormats.map(([, count]) => count))
    : 1;

  return (
    <main id="main-content" className="container px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchStats()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </Button>
      </div>

      {loading && !stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/10 p-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('totalRequests')}</p>
                    <p className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-500/10 p-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('successRate')}</p>
                    <p className="text-2xl font-bold">{successRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-500/10 p-2">
                    <FileType className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('totalConversions')}</p>
                    <p className="text-2xl font-bold">{stats.totalConversions.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-500/10 p-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('uptime')}</p>
                    <p className="text-2xl font-bold">{stats.uptimeFormatted}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Format Usage + Recent Activity */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Format Usage Chart (CSS bars) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('formatUsage')}</CardTitle>
              </CardHeader>
              <CardContent>
                {outputFormats.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {t('noData')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {outputFormats.map(([format, count]) => (
                      <div key={format} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium uppercase">{format}</span>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${(count / maxFormatCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('recentActivity')}</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {t('noActivity')}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {stats.recentActivity.slice(0, 15).map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-lg border p-2 text-sm"
                      >
                        {entry.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          {entry.inputFormat && entry.outputFormat ? (
                            <span className="flex items-center gap-1">
                              <span className="uppercase font-medium">{entry.inputFormat}</span>
                              <ArrowRight className="h-3 w-3" />
                              <span className="uppercase font-medium">{entry.outputFormat}</span>
                            </span>
                          ) : (
                            <span>{entry.endpoint}</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Failed conversions card */}
          {stats.failedConversions > 0 && (
            <Card className="border-destructive/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium">{t('failedConversions')}</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.failedConversions} {t('failures')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </main>
  );
}
