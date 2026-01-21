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
import type { FindReplaceStep } from '@/lib/transformer/types';

interface FindReplaceStepConfigProps {
  step: FindReplaceStep;
}

export function FindReplaceStepConfig({ step }: FindReplaceStepConfigProps) {
  const t = useTranslations('transform');
  const { updateStepConfig, sourceData, previewResult } = useTransformStore();

  const headers = previewResult?.headers || sourceData?.headers || [];

  return (
    <div className="space-y-4">
      {/* Column Selection */}
      <div className="space-y-2">
        <Label htmlFor={`fr-column-${step.id}`}>{t('config.column')}</Label>
        <Select
          value={step.config.column}
          onValueChange={(value) => updateStepConfig(step.id, { column: value })}
        >
          <SelectTrigger id={`fr-column-${step.id}`}>
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

      {/* Find Input */}
      <div className="space-y-2">
        <Label htmlFor={`fr-find-${step.id}`}>{t('config.find')}</Label>
        <Input
          id={`fr-find-${step.id}`}
          value={step.config.find}
          onChange={(e) => updateStepConfig(step.id, { find: e.target.value })}
          placeholder={t('config.enterFindValue')}
        />
      </div>

      {/* Replace Input */}
      <div className="space-y-2">
        <Label htmlFor={`fr-replace-${step.id}`}>{t('config.replace')}</Label>
        <Input
          id={`fr-replace-${step.id}`}
          value={step.config.replace}
          onChange={(e) => updateStepConfig(step.id, { replace: e.target.value })}
          placeholder={t('config.enterReplaceValue')}
        />
      </div>

      {/* Options */}
      <div className="space-y-3 pt-2 border-t">
        <div className="flex items-center justify-between">
          <Label htmlFor={`fr-case-${step.id}`}>{t('config.matchCase')}</Label>
          <Switch
            id={`fr-case-${step.id}`}
            checked={step.config.matchCase}
            onCheckedChange={(checked) => updateStepConfig(step.id, { matchCase: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor={`fr-whole-${step.id}`}>{t('config.matchWholeCell')}</Label>
          <Switch
            id={`fr-whole-${step.id}`}
            checked={step.config.matchWholeCell}
            onCheckedChange={(checked) => updateStepConfig(step.id, { matchWholeCell: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor={`fr-regex-${step.id}`}>{t('config.useRegex')}</Label>
          <Switch
            id={`fr-regex-${step.id}`}
            checked={step.config.useRegex}
            onCheckedChange={(checked) => updateStepConfig(step.id, { useRegex: checked })}
          />
        </div>
      </div>
    </div>
  );
}
