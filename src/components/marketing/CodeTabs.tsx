'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

const SNIPPETS = {
  curl: `curl -X POST https://your-deployment.com/api/convert \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": "name,age\\nJohn,30\\nJane,25",
    "inputFormat": "csv",
    "outputFormat": "json"
  }'`,

  js: `// JavaScript / Node.js
const response = await fetch('https://your-deployment.com/api/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: 'name,age\\nJohn,30\\nJane,25',
    inputFormat: 'csv',
    outputFormat: 'json',
  }),
});
const result = await response.json();
console.log(result.data);`,

  ts: `// TypeScript with the official SDK
import { ConverterClient } from '@mwm/csv-converter-sdk';

const client = new ConverterClient({
  baseUrl: 'https://your-deployment.com',
  apiKey: process.env.MWM_API_KEY, // Pro tier only
});

const result = await client.convert({
  data: 'name,age\\nJohn,30\\nJane,25',
  inputFormat: 'csv',
  outputFormat: 'json',
});

console.log(result.data);`,

  python: `# Python — using requests
import requests

response = requests.post(
    'https://your-deployment.com/api/convert',
    json={
        'data': 'name,age\\nJohn,30\\nJane,25',
        'inputFormat': 'csv',
        'outputFormat': 'json',
    },
)
result = response.json()
print(result['data'])`,
};

export function CodeTabs() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (key: string, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Tabs defaultValue="curl">
      <TabsList>
        <TabsTrigger value="curl">cURL</TabsTrigger>
        <TabsTrigger value="js">JavaScript</TabsTrigger>
        <TabsTrigger value="ts">TypeScript</TabsTrigger>
        <TabsTrigger value="python">Python</TabsTrigger>
      </TabsList>

      {(Object.keys(SNIPPETS) as Array<keyof typeof SNIPPETS>).map((key) => (
        <TabsContent key={key} value={key}>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 z-10"
              onClick={() => handleCopy(key, SNIPPETS[key])}
              aria-label={`Copy ${key} snippet`}
            >
              {copied === key ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <pre className="overflow-x-auto rounded border bg-muted/50 p-4 text-sm">
              <code>{SNIPPETS[key]}</code>
            </pre>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
