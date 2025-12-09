'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Heart, Github, Mail, Phone } from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/40">
      <div className="container px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* About */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">{t('contact')}</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a
                href="mailto:mwm.softwars.solutions@gmail.com"
                className="flex items-center gap-2 hover:text-primary"
              >
                <Mail className="h-4 w-4" />
                mwm.softwars.solutions@gmail.com
              </a>
              <a
                href="mailto:hmdy7486@gmail.com"
                className="flex items-center gap-2 hover:text-primary"
              >
                <Mail className="h-4 w-4" />
                hmdy7486@gmail.com
              </a>
              <a href="tel:+201019793768" className="flex items-center gap-2 hover:text-primary">
                <Phone className="h-4 w-4" />
                +201019793768
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">Links</h3>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary">
                Home
              </Link>
              <Link href="/api-docs" className="hover:text-primary">
                API Documentation
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
            <h3 className="mb-4 text-lg font-semibold">Legal</h3>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary">
                {t('privacy')}
              </Link>
              <Link href="/" className="hover:text-primary">
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
            {t('madeWith')} <Heart className="h-4 w-4 text-red-500" /> {t('by')} MWM Software
            Solutions
          </p>
        </div>
      </div>
    </footer>
  );
}
