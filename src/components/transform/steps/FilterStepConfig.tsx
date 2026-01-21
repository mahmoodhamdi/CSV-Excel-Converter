'use client';

import { useTranslations } from 'next-intl';
import { useTransformStore } from '@/stores/transform-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FilterStep, FilterOperator } from '@/lib/transformer/types';

interface FilterStepConfigProps {
  step: FilterStep;
}

const operators: FilterOperator[] = [
  'equals',
  'notEquals',
  'contains',
  'notContains',
  'startsWith',
  'endsWith',
  'greaterThan',
  'lessThan',
  'greaterThanOrEqual',
  'lessThanOrEqual',
  'isEmpty',
  'isNotEmpty',
  'regex',
];

export function FilterStepConfig({ step }: FilterStepConfigProps) {
  const t = useTranslations('transform');
  const { updateStepConfig, sourceData, previewResult } = useTransformStore();

  const headers = previewResult?.headers || sourceData?.headers || [];
  const needsValue = !['isEmpty', 'isNotEmpty'].includes(step.config.operator);

  return (
    <div className="space-y-4">
      {/* Column Selection */}
      <div className="space-y-2">
        <Label htmlFor={`filter-column-${step.id}`}>{t('config.column')}</Label>
        <Select
          value={step.config.column}
          onValueChange={(value) => updateStepConfig(step.id, { column: value })}
        >
          <SelectTrigger id={`filter-column-${step.id}`}>
            <SelectValue placeholder={t('config.selectColumn')} />
          </SelectTrigger>
          <SelectContent>
            {headers.map((header) => (
              <SelectItem key={header} value={header}>
                {header}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Operator Selection */}
      <div className="space-y-2">
        <Label htmlFor={`filter-operator-${step.id}`}>{t('config.operator')}</Label>
        <Select
          value={step.config.operator}
          onValueChange={(value) => updateStepConfig(step.id, { operator: value as FilterOperator })}
        >
          <SelectTrigger id={`filter-operator-${step.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {operators.map((op) => (
              <SelectItem key={op} value={op}>
                {t(`operators.${op}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Value Input */}
      {needsValue && (
        <div className="space-y-2">
          <Label htmlFor={`filter-value-${step.id}`}>{t('config.value')}</Label>
          <Input
            id={`filter-value-${step.id}`}
            value={step.config.value}
            onChange={(e) => updateStepConfig(step.id, { value: e.target.value })}
            placeholder={t('config.enterValue')}
          />
        </div>
      )}

      {/* Case Sensitive Toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor={`filter-case-${step.id}`}>{t('config.caseSensitive')}</Label>
        <Switch
          id={`filter-case-${step.id}`}
          checked={step.config.caseSensitive}
          onCheckedChange={(checked) => updateStepConfig(step.id, { caseSensitive: checked })}
        />
      </div>
    </div>
  );
}
