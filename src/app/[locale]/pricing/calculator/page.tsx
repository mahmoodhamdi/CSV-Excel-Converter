import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { CostCalculator } from '@/components/marketing/CostCalculator';
import { activeBrand } from '@/lib/brand';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: 'en' | 'ar' }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricing.calculator' });
  return {
    title: `${t('title')} — ${activeBrand.displayName}`,
    description: t('subtitle'),
  };
}

export default async function CalculatorPage({
  params,
}: {
  params: Promise<{ locale: 'en' | 'ar' }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'pricing.calculator' });

  return (
    <div className="container px-4 py-12">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{t('subtitle')}</p>
      </section>

      <section className="mx-auto mt-10 max-w-3xl">
        <CostCalculator locale={locale} />
      </section>
    </div>
  );
}
