'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function HistoryPage() {
  const t = useTranslations('history');

  return (
    <div className="container px-4 py-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <History className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">{t('empty')}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t('emptyDesc')}</p>
          <Button className="mt-6" asChild>
            <Link href="/">
              {t('startConverting')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
