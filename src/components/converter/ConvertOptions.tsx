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
import { Settings, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useState, useCallback, useId } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { sqlOptionsSchema, excelOptionsSchema } from '@/lib/validation/schemas';

interface ValidationState {
  tableName?: string;
  sheetName?: string;
}

export function ConvertOptions() {
  const t = useTranslations('options');
  const tErrors = useTranslations('errors');
  const {
    outputFormat,
    csvOptions,
    jsonOptions,
    excelOptions,
    sqlOptions,
    setCsvOptions,
    setJsonOptions,
    setExcelOptions,
    setSqlOptions,
    parsedData,
  } = useConverterStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [errors, setErrors] = useState<ValidationState>({});

  // Generate unique IDs for accessibility
  const tableNameId = useId();
  const tableNameErrorId = useId();
  const sheetNameId = useId();
  const sheetNameErrorId = useId();

  // Validate table name
  const validateTableName = useCallback((value: string): boolean => {
    const result = sqlOptionsSchema.shape.tableName.safeParse(value);
    if (!result.success) {
      const errorMessage = result.error.errors[0]?.message || tErrors('invalidTableName');
      setErrors((prev) => ({ ...prev, tableName: errorMessage }));
      return false;
    }
    setErrors((prev) => ({ ...prev, tableName: undefined }));
    return true;
  }, [tErrors]);

  // Validate sheet name
  const validateSheetName = useCallback((value: string): boolean => {
    const result = excelOptionsSchema.shape.sheetName.safeParse(value);
    if (!result.success) {
      const errorMessage = result.error.errors[0]?.message || tErrors('invalidSheetName');
      setErrors((prev) => ({ ...prev, sheetName: errorMessage }));
      return false;
    }
    setErrors((prev) => ({ ...prev, sheetName: undefined }));
    return true;
  }, [tErrors]);

  // Handle table name change
  const handleTableNameChange = useCallback((value: string) => {
    validateTableName(value);
    setSqlOptions({ tableName: value });
  }, [validateTableName, setSqlOptions]);

  // Handle sheet name change
  const handleSheetNameChange = useCallback((value: string) => {
    validateSheetName(value);
    setExcelOptions({ sheetName: value });
  }, [validateSheetName, setExcelOptions]);

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
        <div className="space-y-1">
          <Label htmlFor={sheetNameId}>{t('sheetName')}</Label>
          <Input
            id={sheetNameId}
            value={excelOptions.sheetName}
            onChange={(e) => handleSheetNameChange(e.target.value)}
            placeholder={t('sheetNamePlaceholder')}
            aria-invalid={!!errors.sheetName}
            aria-describedby={errors.sheetName ? sheetNameErrorId : undefined}
            className={cn(errors.sheetName && 'border-destructive focus-visible:ring-destructive')}
          />
          {errors.sheetName && (
            <p
              id={sheetNameErrorId}
              className="text-sm text-destructive flex items-center gap-1"
              role="alert"
            >
              <AlertCircle className="h-3 w-3" />
              {errors.sheetName}
            </p>
          )}
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
        <div className="space-y-1">
          <Label htmlFor={tableNameId}>{t('tableName')}</Label>
          <Input
            id={tableNameId}
            value={sqlOptions.tableName}
            onChange={(e) => handleTableNameChange(e.target.value)}
            placeholder={t('tableNamePlaceholder')}
            aria-invalid={!!errors.tableName}
            aria-describedby={errors.tableName ? tableNameErrorId : undefined}
            className={cn(errors.tableName && 'border-destructive focus-visible:ring-destructive')}
          />
          {errors.tableName && (
            <p
              id={tableNameErrorId}
              className="text-sm text-destructive flex items-center gap-1"
              role="alert"
            >
              <AlertCircle className="h-3 w-3" />
              {errors.tableName}
            </p>
          )}
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
