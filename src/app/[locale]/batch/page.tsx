import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Files } from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function BatchPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container px-4 py-8">
      <BatchContent />
    </div>
  );
}

function BatchContent() {
  const t = useTranslations('batch');

  return (
    <div>
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Files className="h-5 w-5" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="dropzone">
            <Files className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4">{t('dropzone')}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t('maxFiles', { max: 10 })}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
