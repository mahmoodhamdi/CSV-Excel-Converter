'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTransformStore } from '@/stores/transform-store';
import type { TransformStep as TransformStepType } from '@/lib/transformer/types';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  GripVertical,
  Power,
  PowerOff,
  Filter,
  ArrowUpDown,
  Columns,
  Type,
  PlusCircle,
  Search,
} from 'lucide-react';

// Step configuration components
import { FilterStepConfig } from './steps/FilterStepConfig';
import { SortStepConfig } from './steps/SortStepConfig';
import { SelectStepConfig } from './steps/SelectStepConfig';
import { RenameStepConfig } from './steps/RenameStepConfig';
import { AddColumnStepConfig } from './steps/AddColumnStepConfig';
import { DeduplicateStepConfig } from './steps/DeduplicateStepConfig';
import { FindReplaceStepConfig } from './steps/FindReplaceStepConfig';

interface TransformStepProps {
  step: TransformStepType;
  index: number;
}

const stepIcons: Record<TransformStepType['type'], React.ReactNode> = {
  filter: <Filter className="h-4 w-4" />,
  sort: <ArrowUpDown className="h-4 w-4" />,
  select: <Columns className="h-4 w-4" />,
  rename: <Type className="h-4 w-4" />,
  addColumn: <PlusCircle className="h-4 w-4" />,
  deduplicate: <Copy className="h-4 w-4" />,
  findReplace: <Search className="h-4 w-4" />,
};

export function TransformStep({ step, index }: TransformStepProps) {
  const t = useTranslations('transform');
  const { removeStep, toggleStep, duplicateStep, moveStep, steps } = useTransformStore();
  const [isExpanded, setIsExpanded] = useState(true);

  const canMoveUp = index > 0;
  const canMoveDown = index < steps.length - 1;

  const renderConfig = () => {
    switch (step.type) {
      case 'filter':
        return <FilterStepConfig step={step} />;
      case 'sort':
        return <SortStepConfig step={step} />;
      case 'select':
        return <SelectStepConfig step={step} />;
      case 'rename':
        return <RenameStepConfig step={step} />;
      case 'addColumn':
        return <AddColumnStepConfig step={step} />;
      case 'deduplicate':
        return <DeduplicateStepConfig step={step} />;
      case 'findReplace':
        return <FindReplaceStepConfig step={step} />;
      default:
        return null;
    }
  };

  return (
    <Card className={`transition-opacity ${!step.enabled ? 'opacity-50' : ''}`}>
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <button
            className="cursor-grab active:cursor-grabbing text-muted-foreground"
            title={t('dragToReorder')}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div
            className={`rounded-full p-1.5 ${
              step.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}
          >
            {stepIcons[step.type]}
          </div>

          <span className="font-medium text-sm flex-1">
            {index + 1}. {t(`stepTypes.${step.type}`)}
          </span>

          <div className="flex items-center gap-1">
            {canMoveUp && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => moveStep(index, index - 1)}
                title={t('moveUp')}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            )}
            {canMoveDown && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => moveStep(index, index + 1)}
                title={t('moveDown')}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => toggleStep(step.id)}
              title={step.enabled ? t('disable') : t('enable')}
            >
              {step.enabled ? (
                <Power className="h-4 w-4" />
              ) : (
                <PowerOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => duplicateStep(step.id)}
              title={t('duplicate')}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => removeStep(step.id)}
              title={t('remove')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Config */}
        {isExpanded && step.enabled && (
          <div className="mt-3 pt-3 border-t">{renderConfig()}</div>
        )}
      </CardContent>
    </Card>
  );
}
