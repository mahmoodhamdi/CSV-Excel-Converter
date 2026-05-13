'use client';

import { useTranslations } from 'next-intl';

interface FaqItem {
  q: string;
  a: string;
}

export function PricingFaq() {
  const t = useTranslations('pricing.faq');
  const items = (t.raw('items') as FaqItem[]) ?? [];

  return (
    <section>
      <h2 className="text-center text-3xl font-bold">{t('title')}</h2>
      <dl className="mt-10 space-y-6">
        {items.map((item, i) => (
          <div key={i} className="border-b pb-6">
            <dt className="font-semibold">{item.q}</dt>
            <dd className="mt-2 text-muted-foreground">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
