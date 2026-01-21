'use client';

import { useTranslations } from 'next-intl';
import { useTransformStore } from '@/stores/transform-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AddColumnStep, AddColumnType } from '@/lib/transformer/types';

interface AddColumnStepConfigProps {
  step: AddColumnStep;
}

const columnTypes: AddColumnType[] = ['constant', 'formula', 'copy', 'index'];

export function AddColumnStepConfig({ step }: AddColumnStepConfigProps) {
  const t = useTranslations('transform');
  const { updateStepConfig, sourceData, previewResult } = useTransformStore();

  const headers = previewResult?.headers || sourceData?.headers || [];

  const renderValueInput = () => {
    switch (step.config.type) {
      case 'constant':
        return (
          <div className="space-y-2">
            <Label htmlFor={`addcol-value-${step.id}`}>{t('config.constantValue')}</Label>
            <Input
              id={`addcol-value-${step.id}`}
              value={step.config.value || ''}
              onChange={(e) => updateStepConfig(step.id, { value: e.target.value })}
              placeholder={t('config.enterValue')}
            />
          </div>
        );

      case 'formula':
        return (
          <div className="space-y-2">
            <Label htmlFor={`addcol-formula-${step.id}`}>{t('config.formula')}</Label>
            <Input
              id={`addcol-formula-${step.id}`}
              value={step.config.formula || ''}
              onChange={(e) => updateStepConfig(step.id, { formula: e.target.value })}
              placeholder="{{column1}} + {{column2}}"
            />
            <p className="text-xs text-muted-foreground">{t('config.formulaHelp')}</p>
          </div>
        );

      case 'copy':
        return (
          <div className="space-y-2">
            <Label htmlFor={`addcol-source-${step.id}`}>{t('config.sourceColumn')}</Label>
            <Select
              value={step.config.sourceColumn || ''}
              onValueChange={(value) => updateStepConfig(step.id, { sourceColumn: value })}
            >
              <SelectTrigger id={`addcol-source-${step.id}`}>
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
        );

      case 'index':
        return (
          <p className="text-sm text-muted-foreground">{t('config.indexHelp')}</p>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Column Name */}
      <div className="space-y-2">
        <Label htmlFor={`addcol-name-${step.id}`}>{t('config.columnName')}</Label>
        <Input
          id={`addcol-name-${step.id}`}
          value={step.config.name}
          onChange={(e) => updateStepConfig(step.id, { name: e.target.value })}
          placeholder={t('config.enterColumnName')}
        />
      </div>

      {/* Column Type */}
      <div className="space-y-2">
        <Label htmlFor={`addcol-type-${step.id}`}>{t('config.columnType')}</Label>
        <Select
          value={step.config.type}
          onValueChange={(value) => updateStepConfig(step.id, { type: value as AddColumnType })}
        >
          <SelectTrigger id={`addcol-type-${step.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {columnTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`columnTypes.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Type-specific input */}
      {renderValueInput()}
    </div>
  );
}
