'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Heart, Github } from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/40">
      <div className="container px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* About */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">{tCommon('appName')}</h3>
            <p className="text-sm text-muted-foreground">
              {tCommon('tagline')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">{t('links')}</h3>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary">
                {t('home')}
              </Link>
              <Link href="/api-docs" className="hover:text-primary">
                {t('apiDocs')}
              </Link>
              <a
                href="https://github.com/mahmoodhamdi/CSV-Excel-Converter"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-primary"
              >
                <Github className="h-4 w-4" />
                {t('github')}
              </a>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">{t('legal')}</h3>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-primary">
                {t('privacy')}
              </Link>
              <Link href="/terms" className="hover:text-primary">
                {t('terms')}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            {t('copyright', { year: currentYear })}
          </p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            {t('madeWith')} <Heart className="h-4 w-4 text-red-500" /> {t('by')} MWM Software Solutions
          </p>
        </div>
      </div>
    </footer>
  );
}
