import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code2, Key, Gauge, Package, BookOpen, ExternalLink } from 'lucide-react';
import { CodeTabs } from '@/components/marketing/CodeTabs';
import { activeBrand } from '@/lib/brand';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: 'en' | 'ar' }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'developers' });
  return {
    title: `${t('title')} — ${activeBrand.displayName}`,
    description: t('subtitle'),
  };
}

export default async function DevelopersPage({
  params,
}: {
  params: Promise<{ locale: 'en' | 'ar' }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'developers' });

  return (
    <div className="container px-4 py-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t('title')}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {t('subtitle')}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/api-docs">
              <BookOpen className="me-2 h-4 w-4" />
              {t('viewDocs')}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/pricing">
              <Key className="me-2 h-4 w-4" />
              {t('getApiKey')}
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-4xl">
        <h2 className="text-2xl font-bold">
          <Code2 className="me-2 inline h-6 w-6" />
          {t('quickstart')}
        </h2>
        <p className="mt-2 text-muted-foreground">
          Convert CSV to JSON in a single API call. No SDK required, but available
          for TypeScript/JavaScript.
        </p>
        <div className="mt-6">
          <CodeTabs />
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-4xl">
        <h2 className="text-2xl font-bold">
          <Key className="me-2 inline h-6 w-6" />
          {t('auth')}
        </h2>
        <p className="mt-2 text-muted-foreground">
          Free tier endpoints under <code className="rounded bg-muted px-1.5 py-0.5">/api/*</code> accept anonymous requests.
          Commercial <code className="rounded bg-muted px-1.5 py-0.5">/api/v2/*</code> endpoints require an API key.
        </p>
        <Card className="mt-4">
          <CardContent className="pt-6">
            <pre className="overflow-x-auto rounded bg-muted/50 p-4 text-sm">
              <code>{`curl -X POST https://your-deployment.com/api/v2/convert \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: mwm_..." \\
  -d '{"data":"a,b\\n1,2","inputFormat":"csv","outputFormat":"json"}'`}</code>
            </pre>
          </CardContent>
        </Card>
        <p className="mt-4 text-sm text-muted-foreground">
          Generate keys on your deployment with{' '}
          <code className="rounded bg-muted px-1.5 py-0.5">npm run gen-api-key</code>.
          Bearer token format is also supported:{' '}
          <code className="rounded bg-muted px-1.5 py-0.5">Authorization: Bearer mwm_...</code>.
        </p>
      </section>

      <section className="mx-auto mt-16 max-w-4xl">
        <h2 className="text-2xl font-bold">
          <Gauge className="me-2 inline h-6 w-6" />
          {t('rateLimits')}
        </h2>
        <div className="mt-4 overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Per minute</th>
                <th className="px-4 py-3 font-medium">Burst</th>
                <th className="px-4 py-3 font-medium">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-4 py-3 font-medium">Free</td>
                <td className="px-4 py-3">60</td>
                <td className="px-4 py-3">100</td>
                <td className="px-4 py-3">—</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Pro</td>
                <td className="px-4 py-3">600</td>
                <td className="px-4 py-3">1,000</td>
                <td className="px-4 py-3">$99/mo</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Scale</td>
                <td className="px-4 py-3">6,000</td>
                <td className="px-4 py-3">10,000</td>
                <td className="px-4 py-3">$299/mo</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Enterprise</td>
                <td className="px-4 py-3">Unlimited</td>
                <td className="px-4 py-3">—</td>
                <td className="px-4 py-3">$20K+/yr</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Responses include <code className="rounded bg-muted px-1.5 py-0.5">X-RateLimit-Remaining</code> and{' '}
          <code className="rounded bg-muted px-1.5 py-0.5">X-RateLimit-Reset</code> headers.
        </p>
      </section>

      <section className="mx-auto mt-16 max-w-4xl">
        <h2 className="text-2xl font-bold">
          <Package className="me-2 inline h-6 w-6" />
          {t('sdks')}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">TypeScript / JavaScript</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="rounded bg-muted/50 p-3 text-xs">
                <code>npm install @mwm/csv-converter-sdk</code>
              </pre>
              <Button variant="link" size="sm" className="mt-2 p-0" asChild>
                <a
                  href="https://github.com/mahmoodhamdi/CSV-Excel-Converter/tree/main/sdks/typescript"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub <ExternalLink className="ms-1 inline h-3 w-3" />
                </a>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Postman Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Import the collection from{' '}
                <code className="rounded bg-muted px-1 py-0.5">sdks/postman/</code> for
                ready-to-use requests across the entire API.
              </p>
            </CardContent>
          </Card>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Need Python, Go, PHP, or Ruby? Generate a client from our{' '}
          <Link href="/api-docs" className="underline">
            OpenAPI spec
          </Link>{' '}
          with <code className="rounded bg-muted px-1 py-0.5">openapi-generator-cli</code>.
        </p>
      </section>
    </div>
  );
}
