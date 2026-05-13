import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { PricingTiers } from '@/components/marketing/PricingTiers';
import { PricingFaq } from '@/components/marketing/PricingFaq';
import { activeBrand } from '@/lib/brand';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: 'en' | 'ar' }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricing' });
  return {
    title: `${t('title')} — ${activeBrand.displayName}`,
    description: t('subtitle'),
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: 'en' | 'ar' }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'pricing' });

  return (
    <div className="container px-4 py-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {t('subtitle')}
        </p>
        <div className="mt-6">
          <Button variant="outline" asChild>
            <Link href="/pricing/calculator">
              <Calculator className="mr-2 h-4 w-4" />
              {t('compareLabel')}
            </Link>
          </Button>
        </div>
      </section>

      <section className="mt-12">
        <PricingTiers tiers={activeBrand.pricing} locale={locale} />
      </section>

      <section className="mx-auto mt-20 max-w-3xl">
        <PricingFaq />
      </section>
    </div>
  );
}
