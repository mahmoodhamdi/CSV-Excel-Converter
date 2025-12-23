'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, FileCode, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SwaggerUI } from '@/components/api-docs/SwaggerUI';
import { useToast } from '@/hooks/use-toast';

/**
 * API Documentation page component.
 * Provides both a quick reference guide and interactive Swagger UI documentation.
 */
export default function ApiDocsPage() {
  return (
    <div className="container px-4 py-8">
      <ApiDocsContent />
    </div>
  );
}

function ApiDocsContent() {
  const t = useTranslations('apiDocs');
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: t('copied'),
        duration: 2000,
      });
    } catch {
      toast({
        title: 'Failed to copy',
        variant: 'destructive',
        duration: 2000,
      });
    }
  };

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
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>

      <Tabs defaultValue="guide" className="mt-8">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Quick Reference
          </TabsTrigger>
          <TabsTrigger value="swagger" className="flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            Interactive API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guide" className="mt-6">
          <div className="max-w-4xl">
            {/* Introduction */}
            <Card>
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
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(endpoint.example)}
                      >
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

            {/* Code Examples */}
            <h2 className="mt-12 text-2xl font-bold">Code Examples</h2>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>JavaScript / TypeScript</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded bg-muted p-4 text-xs">
                  {`// Convert CSV to JSON
const response = await fetch('/api/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: 'name,age\\nJohn,30\\nJane,25',
    inputFormat: 'csv',
    outputFormat: 'json',
    options: {
      json: { prettyPrint: true, indentation: 2 }
    }
  })
});

const result = await response.json();
console.log(result.data);`}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    copyToClipboard(`const response = await fetch('/api/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: 'name,age\\nJohn,30\\nJane,25',
    inputFormat: 'csv',
    outputFormat: 'json',
    options: {
      json: { prettyPrint: true, indentation: 2 }
    }
  })
});

const result = await response.json();
console.log(result.data);`)
                  }
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Python</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded bg-muted p-4 text-xs">
                  {`import requests

# Convert CSV to JSON
response = requests.post(
    'https://your-domain.com/api/convert',
    json={
        'data': 'name,age\\nJohn,30\\nJane,25',
        'inputFormat': 'csv',
        'outputFormat': 'json',
        'options': {
            'json': {'prettyPrint': True, 'indentation': 2}
        }
    }
)

result = response.json()
print(result['data'])`}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    copyToClipboard(`import requests

# Convert CSV to JSON
response = requests.post(
    'https://your-domain.com/api/convert',
    json={
        'data': 'name,age\\nJohn,30\\nJane,25',
        'inputFormat': 'csv',
        'outputFormat': 'json',
        'options': {
            'json': {'prettyPrint': True, 'indentation': 2}
        }
    }
)

result = response.json()
print(result['data'])`)
                  }
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </CardContent>
            </Card>

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
        </TabsContent>

        <TabsContent value="swagger" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <SwaggerUI />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
