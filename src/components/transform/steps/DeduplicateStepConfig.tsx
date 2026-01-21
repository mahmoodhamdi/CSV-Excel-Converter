'use client';

import { useTranslations } from 'next-intl';
import { useTransformStore } from '@/stores/transform-store';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import type { DeduplicateStep } from '@/lib/transformer/types';

interface DeduplicateStepConfigProps {
  step: DeduplicateStep;
}

export function DeduplicateStepConfig({ step }: DeduplicateStepConfigProps) {
  const t = useTranslations('transform');
  const { updateStepConfig, sourceData } = useTransformStore();

  const headers = sourceData?.headers || [];

  const handleToggleColumn = (column: string) => {
    const currentColumns = step.config.columns;
    const newColumns = currentColumns.includes(column)
      ? currentColumns.filter((c) => c !== column)
      : [...currentColumns, column];
    updateStepConfig(step.id, { columns: newColumns });
  };

  const handleSelectAll = () => {
    updateStepConfig(step.id, { columns: [...headers] });
  };

  const handleSelectNone = () => {
    updateStepConfig(step.id, { columns: [] });
  };

  return (
    <div className="space-y-4">
      {/* Column Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('config.deduplicateColumns')}</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {t('config.selectAll')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSelectNone}>
              {t('config.selectNone')}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t('config.deduplicateHelp')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
        {headers.map((header) => (
          <div key={header} className="flex items-center space-x-2">
            <Checkbox
              id={`dedup-${step.id}-${header}`}
              checked={step.config.columns.includes(header)}
              onCheckedChange={() => handleToggleColumn(header)}
            />
            <label
              htmlFor={`dedup-${step.id}-${header}`}
              className="text-sm cursor-pointer truncate"
              title={header}
            >
              {header}
            </label>
          </div>
        ))}
      </div>

      {/* Keep First/Last Toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor={`dedup-keep-${step.id}`}>
          {step.config.keepFirst ? t('config.keepFirst') : t('config.keepLast')}
        </Label>
        <Switch
          id={`dedup-keep-${step.id}`}
          checked={step.config.keepFirst}
          onCheckedChange={(checked) => updateStepConfig(step.id, { keepFirst: checked })}
        />
      </div>
    </div>
  );
}
