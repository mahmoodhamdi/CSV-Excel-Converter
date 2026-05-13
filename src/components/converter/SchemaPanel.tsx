'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Copy, Check } from 'lucide-react';
import { profileData } from '@/lib/profile';
import {
  inferCreateTable,
  inferTypeScriptInterface,
  inferJsonSchema,
  inferZodSchema,
  type SqlDialect,
} from '@/lib/schema-inference';

interface Props {
  headers: string[];
  rows: Record<string, unknown>[];
  tableName?: string;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-2 top-2 z-10"
        onClick={handleCopy}
        aria-label={`Copy ${language} snippet`}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
      <pre className="max-h-96 overflow-auto rounded border bg-muted/50 p-4 text-xs">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function SchemaPanel({ headers, rows, tableName = 'my_table' }: Props) {
  const [dialect, setDialect] = useState<SqlDialect>('postgresql');

  const profile = useMemo(() => profileData(headers, rows), [headers, rows]);

  const createTable = useMemo(
    () => inferCreateTable(profile, tableName, dialect),
    [profile, tableName, dialect]
  );
  const tsInterface = useMemo(
    () => inferTypeScriptInterface(profile, 'Row'),
    [profile]
  );
  const jsonSchema = useMemo(
    () => JSON.stringify(inferJsonSchema(profile, 'GeneratedSchema'), null, 2),
    [profile]
  );
  const zodSchema = useMemo(() => inferZodSchema(profile, 'RowSchema'), [profile]);

  if (headers.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Schema</CardTitle>
        <p className="text-sm text-muted-foreground">
          Inferred from {profile.rowCount} rows across {profile.columnCount} columns.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sql">
          <TabsList>
            <TabsTrigger value="sql">SQL</TabsTrigger>
            <TabsTrigger value="typescript">TypeScript</TabsTrigger>
            <TabsTrigger value="zod">Zod</TabsTrigger>
            <TabsTrigger value="json">JSON Schema</TabsTrigger>
          </TabsList>

          <TabsContent value="sql" className="space-y-3">
            <div className="flex items-center gap-2">
              <label htmlFor="sql-dialect" className="text-sm font-medium">
                Dialect:
              </label>
              <select
                id="sql-dialect"
                className="rounded border bg-background px-2 py-1 text-sm"
                value={dialect}
                onChange={(e) => setDialect(e.target.value as SqlDialect)}
              >
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="sqlite">SQLite</option>
                <option value="mssql">SQL Server</option>
              </select>
            </div>
            <CodeBlock code={createTable} language="sql" />
          </TabsContent>

          <TabsContent value="typescript">
            <CodeBlock code={tsInterface} language="typescript" />
          </TabsContent>

          <TabsContent value="zod">
            <CodeBlock code={zodSchema} language="typescript" />
          </TabsContent>

          <TabsContent value="json">
            <CodeBlock code={jsonSchema} language="json" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
