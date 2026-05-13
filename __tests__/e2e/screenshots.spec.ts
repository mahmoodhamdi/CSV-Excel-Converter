/**
 * Marketing screenshot capture.
 *
 * Captures the 8 highest-value screenshots for the active brand:
 *   hero × converter × pricing × developers
 *   ×  en + ar
 *   ×  light + dark (covered via prefers-color-scheme)
 *
 * Output goes to marketing/screenshots/<brand>/<locale>/<theme>/.
 *
 * Run via:
 *   npx playwright test __tests__/e2e/screenshots.spec.ts
 * Or per locale:
 *   PWLOC=ar npx playwright test __tests__/e2e/screenshots.spec.ts
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const BRAND = process.env.BRAND ?? 'base';

const LOCALES = (process.env.PWLOC ? [process.env.PWLOC] : ['en', 'ar']) as Array<'en' | 'ar'>;

const PAGES = [
  { slug: '', name: '01-hero' },
  { slug: '/pricing', name: '02-pricing' },
  { slug: '/pricing/calculator', name: '03-calculator' },
  { slug: '/developers', name: '04-developers' },
];

const THEMES = ['light', 'dark'] as const;

function outputDir(brand: string, locale: string, theme: string): string {
  return path.resolve(
    process.cwd(),
    'marketing',
    'screenshots',
    brand,
    locale,
    theme
  );
}

test.describe('Marketing screenshots', () => {
  for (const locale of LOCALES) {
    for (const theme of THEMES) {
      for (const p of PAGES) {
        test(`${BRAND} / ${locale} / ${theme} / ${p.name}`, async ({ page }) => {
          const dir = outputDir(BRAND, locale, theme);
          fs.mkdirSync(dir, { recursive: true });

          await page.emulateMedia({ colorScheme: theme });
          await page.goto(`/${locale}${p.slug}`);
          await page.waitForLoadState('networkidle');
          // Give animations a moment to settle
          await page.waitForTimeout(500);

          await page.screenshot({
            path: path.join(dir, `${p.name}.png`),
            fullPage: true,
            animations: 'disabled',
          });

          // Confirm at least the page rendered
          await expect(page.locator('main, body')).toBeVisible();
        });
      }
    }
  }
});
