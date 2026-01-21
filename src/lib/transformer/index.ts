/**
 * Data Transformation Engine
 * Provides a pipeline-based approach to transform data
 */

import type {
  TransformStep,
  TransformResult,
  TransformData,
  FilterConfig,
  SortConfig,
  SelectConfig,
  RenameConfig,
  AddColumnConfig,
  DeduplicateConfig,
  FindReplaceConfig,
} from './types';

import { filterRows } from './filter';
import { sortRows } from './sort';
import { selectColumns } from './select';
import { renameColumn } from './rename';
import { addColumn } from './add-column';
import { deduplicateRows } from './deduplicate';
import { findReplace } from './find-replace';

// Re-export types
export type * from './types';

// Re-export individual transforms
export { filterRows } from './filter';
export { sortRows } from './sort';
export { selectColumns } from './select';
export { renameColumn } from './rename';
export { addColumn } from './add-column';
export { deduplicateRows } from './deduplicate';
export { findReplace } from './find-replace';

/**
 * Execute a single transform step
 */
export function executeStep(data: TransformData, step: TransformStep): TransformResult {
  if (!step.enabled) {
    return {
      success: true,
      headers: data.headers,
      rows: data.rows,
      rowsAffected: 0,
    };
  }

  switch (step.type) {
    case 'filter':
      return filterRows(data, step.config as FilterConfig);

    case 'sort':
      return sortRows(data, step.config as SortConfig);

    case 'select':
      return selectColumns(data, step.config as SelectConfig);

    case 'rename':
      return renameColumn(data, step.config as RenameConfig);

    case 'addColumn':
      return addColumn(data, step.config as AddColumnConfig);

    case 'deduplicate':
      return deduplicateRows(data, step.config as DeduplicateConfig);

    case 'findReplace':
      return findReplace(data, step.config as FindReplaceConfig);

    default: {
      // Exhaustive check - this ensures we handle all step types
      const exhaustiveCheck: never = step;
      return {
        success: false,
        headers: data.headers,
        rows: data.rows,
        rowsAffected: 0,
        error: `Unknown transform type: ${(exhaustiveCheck as TransformStep).type}`,
      };
    }
  }
}

/**
 * Execute a pipeline of transform steps
 */
export function executePipeline(
  data: TransformData,
  steps: TransformStep[]
): TransformResult & { stepResults: TransformResult[] } {
  let currentData: TransformData = { ...data };
  const stepResults: TransformResult[] = [];
  let totalRowsAffected = 0;

  for (const step of steps) {
    const result = executeStep(currentData, step);
    stepResults.push(result);

    if (!result.success) {
      return {
        success: false,
        headers: currentData.headers,
        rows: currentData.rows,
        rowsAffected: totalRowsAffected,
        error: `Step "${step.type}" failed: ${result.error}`,
        stepResults,
      };
    }

    currentData = {
      headers: result.headers,
      rows: result.rows,
    };
    totalRowsAffected += result.rowsAffected;
  }

  return {
    success: true,
    headers: currentData.headers,
    rows: currentData.rows,
    rowsAffected: totalRowsAffected,
    stepResults,
  };
}

/**
 * Generate a unique step ID
 */
export function generateStepId(): string {
  return `step-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new transform step with default config
 */
export function createStep(
  type: TransformStep['type'],
  headers: string[] = []
): TransformStep {
  const id = generateStepId();
  const defaultColumn = headers[0] || '';

  switch (type) {
    case 'filter':
      return {
        id,
        type,
        enabled: true,
        config: {
          column: defaultColumn,
          operator: 'equals',
          value: '',
          caseSensitive: false,
        } as FilterConfig,
      };

    case 'sort':
      return {
        id,
        type,
        enabled: true,
        config: {
          column: defaultColumn,
          direction: 'asc',
        } as SortConfig,
      };

    case 'select':
      return {
        id,
        type,
        enabled: true,
        config: {
          columns: headers,
        } as SelectConfig,
      };

    case 'rename':
      return {
        id,
        type,
        enabled: true,
        config: {
          oldName: defaultColumn,
          newName: '',
        } as RenameConfig,
      };

    case 'addColumn':
      return {
        id,
        type,
        enabled: true,
        config: {
          name: 'NewColumn',
          type: 'constant',
          value: '',
        } as AddColumnConfig,
      };

    case 'deduplicate':
      return {
        id,
        type,
        enabled: true,
        config: {
          columns: [],
          keepFirst: true,
        } as DeduplicateConfig,
      };

    case 'findReplace':
      return {
        id,
        type,
        enabled: true,
        config: {
          column: defaultColumn,
          find: '',
          replace: '',
          matchCase: false,
          matchWholeCell: false,
          useRegex: false,
        } as FindReplaceConfig,
      };

    default:
      throw new Error(`Unknown step type: ${type}`);
  }
}

/**
 * Get display name for transform type
 */
export function getStepTypeName(type: TransformStep['type']): string {
  const names: Record<TransformStep['type'], string> = {
    filter: 'Filter Rows',
    sort: 'Sort',
    select: 'Select Columns',
    rename: 'Rename Column',
    addColumn: 'Add Column',
    deduplicate: 'Remove Duplicates',
    findReplace: 'Find & Replace',
  };
  return names[type] || type;
}

/**
 * Get available transform types
 */
export function getAvailableTransformTypes(): TransformStep['type'][] {
  return ['filter', 'sort', 'select', 'rename', 'addColumn', 'deduplicate', 'findReplace'];
}
