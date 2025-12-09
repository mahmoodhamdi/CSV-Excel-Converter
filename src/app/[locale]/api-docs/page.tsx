import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ApiDocsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container px-4 py-8">
      <ApiDocsContent />
    </div>
  );
}

function ApiDocsContent() {
  const t = useTranslations('apiDocs');

  const endpoints = [
    {
      method: 'POST',
      path: '/api/convert',
      title: t('convertEndpoint.title'),
      description: t('convertEndpoint.desc'),
      example: `curl -X POST https://your-domain.com/api/convert \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": "name,age\\nJohn,30",
    "inputFormat": "csv",
    "outputFormat": "json"
  }'`,
    },
    {
      method: 'POST',
      path: '/api/parse',
      title: t('parseEndpoint.title'),
      description: t('parseEndpoint.desc'),
      example: `curl -X POST https://your-domain.com/api/parse \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": "name,age\\nJohn,30"
  }'`,
    },
    {
      method: 'GET',
      path: '/api/formats',
      title: t('formatsEndpoint.title'),
      description: t('formatsEndpoint.desc'),
      example: `curl https://your-domain.com/api/formats`,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>

      {/* Introduction */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{t('introduction')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t('introText')}</p>
          <div className="mt-4">
            <h4 className="font-medium">{t('baseUrl')}</h4>
            <code className="mt-2 block rounded bg-muted p-2 text-sm">
              https://your-domain.com/api
            </code>
          </div>
          <div className="mt-4">
            <h4 className="font-medium">{t('authentication')}</h4>
            <p className="mt-2 text-sm text-muted-foreground">{t('authText')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <h2 className="mt-12 text-2xl font-bold">{t('endpoints')}</h2>

      {endpoints.map((endpoint, index) => (
        <Card key={index} className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span
                className={`rounded px-2 py-1 text-xs font-bold ${
                  endpoint.method === 'GET'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {endpoint.method}
              </span>
              <code className="text-base">{endpoint.path}</code>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{endpoint.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{endpoint.description}</p>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">{t('example')}</h4>
                <Button variant="ghost" size="sm">
                  <Copy className="mr-2 h-4 w-4" />
                  {t('copyCode')}
                </Button>
              </div>
              <pre className="mt-2 overflow-x-auto rounded bg-muted p-4 text-xs">
                {endpoint.example}
              </pre>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Error Codes */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{t('errors.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Code</th>
                <th className="py-2 text-left">{t('description')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 font-mono">400</td>
                <td className="py-2 text-muted-foreground">{t('errors.400')}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-mono">413</td>
                <td className="py-2 text-muted-foreground">{t('errors.413')}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-mono">415</td>
                <td className="py-2 text-muted-foreground">{t('errors.415')}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-mono">429</td>
                <td className="py-2 text-muted-foreground">{t('errors.429')}</td>
              </tr>
              <tr>
                <td className="py-2 font-mono">500</td>
                <td className="py-2 text-muted-foreground">{t('errors.500')}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
