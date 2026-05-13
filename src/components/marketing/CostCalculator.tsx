'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import type { Locale } from '../../../brands/types';

interface Props {
  locale: Locale;
}

interface TierEstimate {
  planId: string;
  planName: string;
  monthlyUsd: number;
}

const PLANS: Array<{
  id: string;
  name: { en: string; ar: string };
  baseMonthly: number;
  includedConversions: number;
  perExtraConversionCents: number;
  maxConversions: number;
}> = [
  {
    id: 'free',
    name: { en: 'Free / Self-Hosted', ar: 'مجاني / استضافة ذاتية' },
    baseMonthly: 0,
    includedConversions: 1000,
    perExtraConversionCents: 0,
    maxConversions: 1000,
  },
  {
    id: 'pro',
    name: { en: 'Managed Pro', ar: 'مُدار - احترافي' },
    baseMonthly: 99,
    includedConversions: 100_000,
    perExtraConversionCents: 0.1,
    maxConversions: 1_000_000,
  },
  {
    id: 'scale',
    name: { en: 'Managed Scale', ar: 'مُدار - توسع' },
    baseMonthly: 299,
    includedConversions: 1_000_000,
    perExtraConversionCents: 0.05,
    maxConversions: 10_000_000,
  },
  {
    id: 'enterprise',
    name: { en: 'Enterprise', ar: 'مؤسسات' },
    baseMonthly: 1666, // $20k/yr
    includedConversions: Infinity,
    perExtraConversionCents: 0,
    maxConversions: Infinity,
  },
];

function estimateForPlan(plan: (typeof PLANS)[number], conversions: number): number {
  if (conversions > plan.maxConversions) return Number.POSITIVE_INFINITY;
  const extra = Math.max(0, conversions - plan.includedConversions);
  return plan.baseMonthly + (extra * plan.perExtraConversionCents) / 100;
}

export function CostCalculator({ locale }: Props) {
  const t = useTranslations('pricing.calculator');
  const [conversions, setConversions] = useState(10_000);
  const [fileSizeMb, setFileSizeMb] = useState(1);
  const [users, setUsers] = useState(5);

  const estimates: TierEstimate[] = useMemo(
    () =>
      PLANS.map((p) => ({
        planId: p.id,
        planName: p.name[locale],
        monthlyUsd: estimateForPlan(p, conversions),
      })),
    [conversions, locale]
  );

  const cheapest = estimates.find((e) => Number.isFinite(e.monthlyUsd))!;

  // DIY cost: assume a developer at $50/hr * 4h/month maintenance + 80h initial build amortized over 3 years
  const diyMonthly = useMemo(() => {
    const initialHours = 80 + users * 4;
    const amortizedInitial = (initialHours * 50) / 36; // 3 years
    const maintenance = 4 * 50 + Math.ceil(fileSizeMb / 10) * 50;
    return Math.round(amortizedInitial + maintenance);
  }, [users, fileSizeMb]);

  const savings = Math.max(0, diyMonthly - cheapest.monthlyUsd);
  const tco3yr = cheapest.monthlyUsd * 36;
  const diyTco3yr = diyMonthly * 36;

  const fmt = (n: number) =>
    new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div>
            <label className="flex items-center justify-between text-sm font-medium">
              <span>{t('conversionsLabel')}</span>
              <span className="text-muted-foreground">{fmt(conversions)}</span>
            </label>
            <input
              type="range"
              min={100}
              max={5_000_000}
              step={100}
              value={conversions}
              onChange={(e) => setConversions(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-medium">
              <span>{t('fileSizeLabel')}</span>
              <span className="text-muted-foreground">{fmt(fileSizeMb)} MB</span>
            </label>
            <input
              type="range"
              min={1}
              max={200}
              step={1}
              value={fileSizeMb}
              onChange={(e) => setFileSizeMb(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-medium">
              <span>{t('usersLabel')}</span>
              <span className="text-muted-foreground">{fmt(users)}</span>
            </label>
            <input
              type="range"
              min={1}
              max={500}
              step={1}
              value={users}
              onChange={(e) => setUsers(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-base">{t('recommend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cheapest.planName}</div>
            <div className="mt-2 text-3xl font-bold text-primary">
              ${fmt(cheapest.monthlyUsd)}
              <span className="ms-1 text-sm font-normal text-muted-foreground">
                /mo
              </span>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              {t('tcoLabel')}: ${fmt(tco3yr)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('diyLabel')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">
              ${fmt(diyMonthly)}
              <span className="ms-1 text-sm font-normal">/mo</span>
            </div>
            <div className="mt-4 text-sm font-medium text-emerald-600">
              {t('savingsLabel')}: ${fmt(savings)}/mo
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {t('savingsHint')}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {t('tcoLabel')}: ${fmt(diyTco3yr)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-2 pt-6">
          {estimates.map((e) => (
            <div
              key={e.planId}
              className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
            >
              <span className="text-sm font-medium">{e.planName}</span>
              <span className="text-sm tabular-nums">
                {Number.isFinite(e.monthlyUsd)
                  ? `$${fmt(e.monthlyUsd)}/mo`
                  : '—'}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="text-center">
        <Button asChild>
          <Link href="/pricing">{t('cta')}</Link>
        </Button>
      </div>
    </div>
  );
}
