'use client';

import { useTranslations } from 'next-intl';

export function SkipLink() {
  const t = useTranslations('accessibility');

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-background focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:shadow-lg focus:text-foreground"
    >
      {t('skipToMain')}
    </a>
  );
}
