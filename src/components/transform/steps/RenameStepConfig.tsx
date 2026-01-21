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
import type { RenameStep } from '@/lib/transformer/types';

interface RenameStepConfigProps {
  step: RenameStep;
}

export function RenameStepConfig({ step }: RenameStepConfigProps) {
  const t = useTranslations('transform');
  const { updateStepConfig, sourceData, previewResult } = useTransformStore();

  const headers = previewResult?.headers || sourceData?.headers || [];

  return (
    <div className="space-y-4">
      {/* Old Column Name */}
      <div className="space-y-2">
        <Label htmlFor={`rename-old-${step.id}`}>{t('config.oldName')}</Label>
        <Select
          value={step.config.oldName}
          onValueChange={(value) => updateStepConfig(step.id, { oldName: value })}
        >
          <SelectTrigger id={`rename-old-${step.id}`}>
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

      {/* New Column Name */}
      <div className="space-y-2">
        <Label htmlFor={`rename-new-${step.id}`}>{t('config.newName')}</Label>
        <Input
          id={`rename-new-${step.id}`}
          value={step.config.newName}
          onChange={(e) => updateStepConfig(step.id, { newName: e.target.value })}
          placeholder={t('config.enterNewName')}
        />
      </div>
    </div>
  );
}
