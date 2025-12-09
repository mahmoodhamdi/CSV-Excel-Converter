import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function TransformPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container px-4 py-8">
      <TransformContent />
    </div>
  );
}

function TransformContent() {
  const t = useTranslations('transform');

  return (
    <div>
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              {t('columnMapping')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('renameColumn')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('operations')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('removeDuplicates')}</p>
            <p className="text-sm text-muted-foreground">{t('trimWhitespace')}</p>
            <p className="text-sm text-muted-foreground">{t('filterRows')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
