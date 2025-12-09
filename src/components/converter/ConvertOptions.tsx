'use client';

import { useTranslations } from 'next-intl';
import { useConverterStore } from '@/stores/converter-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ConvertOptions() {
  const t = useTranslations('options');
  const { outputFormat, csvOptions, jsonOptions, excelOptions, sqlOptions, setCsvOptions, setJsonOptions, setExcelOptions, setSqlOptions, parsedData } = useConverterStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!parsedData) {
    return null;
  }

  const renderCsvOptions = () => (
    <div className="space-y-4">
      <h4 className="font-medium">{t('csvOptions')}</h4>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="delimiter">{t('delimiter')}</Label>
          <Select
            value={csvOptions.delimiter}
            onValueChange={(value) => setCsvOptions({ delimiter: value })}
          >
            <SelectTrigger id="delimiter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=",">{t('delimiters.comma')}</SelectItem>
              <SelectItem value=";">{t('delimiters.semicolon')}</SelectItem>
              <SelectItem value="\t">{t('delimiters.tab')}</SelectItem>
              <SelectItem value="|">{t('delimiters.pipe')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderJsonOptions = () => (
    <div className="space-y-4">
      <h4 className="font-medium">{t('jsonOptions')}</h4>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="prettyPrint">{t('prettyPrint')}</Label>
          <Select
            value={jsonOptions.prettyPrint ? 'true' : 'false'}
            onValueChange={(value) => setJsonOptions({ prettyPrint: value === 'true' })}
          >
            <SelectTrigger id="prettyPrint">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="indentation">{t('indentation')}</Label>
          <Select
            value={String(jsonOptions.indentation)}
            onValueChange={(value) => setJsonOptions({ indentation: Number(value) })}
          >
            <SelectTrigger id="indentation">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 {t('spaces')}</SelectItem>
              <SelectItem value="4">4 {t('spaces')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderExcelOptions = () => (
    <div className="space-y-4">
      <h4 className="font-medium">{t('excelOptions')}</h4>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="sheetName">{t('sheetName')}</Label>
          <Input
            id="sheetName"
            value={excelOptions.sheetName}
            onChange={(e) => setExcelOptions({ sheetName: e.target.value })}
            placeholder={t('sheetNamePlaceholder')}
          />
        </div>
        <div>
          <Label htmlFor="headerStyle">{t('headerStyle')}</Label>
          <Select
            value={excelOptions.headerStyle ? 'true' : 'false'}
            onValueChange={(value) => setExcelOptions({ headerStyle: value === 'true' })}
          >
            <SelectTrigger id="headerStyle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderSqlOptions = () => (
    <div className="space-y-4">
      <h4 className="font-medium">{t('sqlOptions')}</h4>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="tableName">{t('tableName')}</Label>
          <Input
            id="tableName"
            value={sqlOptions.tableName}
            onChange={(e) => setSqlOptions({ tableName: e.target.value })}
            placeholder={t('tableNamePlaceholder')}
          />
        </div>
        <div>
          <Label htmlFor="includeCreate">{t('includeCreate')}</Label>
          <Select
            value={sqlOptions.includeCreate ? 'true' : 'false'}
            onValueChange={(value) => setSqlOptions({ includeCreate: value === 'true' })}
          >
            <SelectTrigger id="includeCreate">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderOptions = () => {
    switch (outputFormat) {
      case 'csv':
      case 'tsv':
        return renderCsvOptions();
      case 'json':
        return renderJsonOptions();
      case 'xlsx':
      case 'xls':
        return renderExcelOptions();
      case 'sql':
        return renderSqlOptions();
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <Button
          variant="ghost"
          className="w-full justify-between p-0 h-auto hover:bg-transparent"
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid="options-toggle"
        >
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </Button>
      </CardHeader>
      <CardContent className={cn(!isExpanded && 'hidden')}>
        {renderOptions()}
      </CardContent>
    </Card>
  );
}
