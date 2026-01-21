'use client';

import { useTranslations } from 'next-intl';
import { useTransformStore } from '@/stores/transform-store';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SortStep, SortDirection } from '@/lib/transformer/types';

interface SortStepConfigProps {
  step: SortStep;
}

export function SortStepConfig({ step }: SortStepConfigProps) {
  const t = useTranslations('transform');
  const { updateStepConfig, sourceData, previewResult } = useTransformStore();

  const headers = previewResult?.headers || sourceData?.headers || [];

  return (
    <div className="space-y-4">
      {/* Column Selection */}
      <div className="space-y-2">
        <Label htmlFor={`sort-column-${step.id}`}>{t('config.column')}</Label>
        <Select
          value={step.config.column}
          onValueChange={(value) => updateStepConfig(step.id, { column: value })}
        >
          <SelectTrigger id={`sort-column-${step.id}`}>
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

      {/* Direction Selection */}
      <div className="space-y-2">
        <Label htmlFor={`sort-direction-${step.id}`}>{t('config.direction')}</Label>
        <Select
          value={step.config.direction}
          onValueChange={(value) => updateStepConfig(step.id, { direction: value as SortDirection })}
        >
          <SelectTrigger id={`sort-direction-${step.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">{t('config.ascending')}</SelectItem>
            <SelectItem value="desc">{t('config.descending')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
