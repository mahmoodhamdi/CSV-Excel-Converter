'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations('errorPage');

  useEffect(() => {
    // Log error to an error reporting service
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-lg border-destructive/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-destructive">{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-lg bg-muted p-4 overflow-auto max-h-32">
              <p className="text-sm font-medium text-destructive mb-1">
                {error.name}: {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('tryAgain')}
            </Button>
            <Button variant="outline" asChild>
              <a href="/">
                <Home className="mr-2 h-4 w-4" />
                {t('goHome')}
              </a>
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-center text-muted-foreground">
              <Bug className="h-3 w-3 inline mr-1" />
              {t('devNote')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
