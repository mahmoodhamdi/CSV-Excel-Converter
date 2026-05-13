'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import type { PricingTier, Locale } from '../../../brands/types';

interface Props {
  tiers: PricingTier[];
  locale: Locale;
}

function formatPrice(tier: PricingTier, locale: Locale): { display: string; cadence: string } {
  if (tier.priceUsd === 0) {
    return { display: locale === 'ar' ? 'مجاني' : 'Free', cadence: '' };
  }

  // Prefer local currency for non-USD locales
  let primary = tier.priceUsd;
  let currency = 'USD';
  if (locale === 'ar' && tier.priceEgp) {
    primary = tier.priceEgp;
    currency = 'EGP';
  }

  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(primary);

  const cadence =
    tier.cadence === 'monthly'
      ? locale === 'ar' ? '/شهر' : '/mo'
      : tier.cadence === 'yearly'
        ? locale === 'ar' ? '/سنة' : '/yr'
        : locale === 'ar' ? 'دفعة واحدة' : 'one-time';

  return { display: `${currency === 'EGP' ? 'ج.م ' : '$'}${formatted}`, cadence };
}

export function PricingTiers({ tiers, locale }: Props) {
  const t = useTranslations('pricing');

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tiers.map((tier) => {
        const { display, cadence } = formatPrice(tier, locale);
        const cta =
          tier.priceUsd === 0
            ? t('ctaFree')
            : tier.priceUsd >= 10000
              ? t('ctaContact')
              : t('ctaStart');

        return (
          <Card
            key={tier.id}
            className={
              tier.highlight
                ? 'relative border-primary shadow-lg ring-2 ring-primary/20'
                : 'relative'
            }
          >
            {tier.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                {t('mostPopular')}
              </div>
            )}
            <CardHeader>
              <CardTitle>{tier.name[locale]}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">{display}</span>
                {cadence && (
                  <span className="ms-1 text-sm text-muted-foreground">{cadence}</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                variant={tier.highlight ? 'default' : 'outline'}
                asChild
              >
                <a href={`mailto:sales@mwm.eg?subject=Pricing inquiry: ${tier.name.en}`}>
                  {cta}
                </a>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
