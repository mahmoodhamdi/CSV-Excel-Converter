'use client';

import { useTranslations } from 'next-intl';
import { useTransformStore } from '@/stores/transform-store';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import type { SelectStep } from '@/lib/transformer/types';

interface SelectStepConfigProps {
  step: SelectStep;
}

export function SelectStepConfig({ step }: SelectStepConfigProps) {
  const t = useTranslations('transform');
  const { updateStepConfig, sourceData } = useTransformStore();

  // Use source data headers for selection
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
      <div className="flex items-center justify-between">
        <Label>{t('config.selectColumns')}</Label>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            {t('config.selectAll')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSelectNone}>
            {t('config.selectNone')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
        {headers.map((header) => (
          <div key={header} className="flex items-center space-x-2">
            <Checkbox
              id={`select-${step.id}-${header}`}
              checked={step.config.columns.includes(header)}
              onCheckedChange={() => handleToggleColumn(header)}
            />
            <label
              htmlFor={`select-${step.id}-${header}`}
              className="text-sm cursor-pointer truncate"
              title={header}
            >
              {header}
            </label>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {t('config.selectedCount', { count: step.config.columns.length, total: headers.length })}
      </p>
    </div>
  );
}
