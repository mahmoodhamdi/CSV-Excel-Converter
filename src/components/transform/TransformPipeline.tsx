'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTransformStore } from '@/stores/transform-store';
import { getStepTypeName, getAvailableTransformTypes } from '@/lib/transformer';
import type { TransformStepType } from '@/lib/transformer/types';
import { TransformStep } from './TransformStep';
import {
  Plus,
  Trash2,
  Filter,
  ArrowUpDown,
  Columns,
  Type,
  PlusCircle,
  Copy,
  Search,
} from 'lucide-react';

const stepIcons: Record<TransformStepType, React.ReactNode> = {
  filter: <Filter className="h-4 w-4" />,
  sort: <ArrowUpDown className="h-4 w-4" />,
  select: <Columns className="h-4 w-4" />,
  rename: <Type className="h-4 w-4" />,
  addColumn: <PlusCircle className="h-4 w-4" />,
  deduplicate: <Copy className="h-4 w-4" />,
  findReplace: <Search className="h-4 w-4" />,
};

export function TransformPipeline() {
  const t = useTranslations('transform');
  const { steps, addStep, clearSteps, sourceData } = useTransformStore();

  const transformTypes = getAvailableTransformTypes();

  if (!sourceData) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">{t('pipeline')}</CardTitle>
        {steps.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearSteps}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('clearAll')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Transform Steps */}
        {steps.length > 0 ? (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <TransformStep key={step.id} step={step} index={index} />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">
            {t('noSteps')}
          </p>
        )}

        {/* Add Step Buttons */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-3">{t('addStep')}</p>
          <div className="flex flex-wrap gap-2">
            {transformTypes.map((type) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => addStep(type)}
              >
                {stepIcons[type]}
                <span className="ml-2">{t(`stepTypes.${type}`)}</span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
