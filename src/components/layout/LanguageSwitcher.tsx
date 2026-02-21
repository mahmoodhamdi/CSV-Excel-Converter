'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common');

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en';
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      aria-label={t('language')}
      className="gap-1.5 px-2"
    >
      <Languages className="h-4 w-4" />
      <span className="text-xs font-medium uppercase">
        {locale === 'en' ? 'AR' : 'EN'}
      </span>
    </Button>
  );
}
