/**
 * Transform library types
 */

export type TransformOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'regex';

// Alias for filter component
export type FilterOperator = TransformOperator;

export type SortDirection = 'asc' | 'desc';

export type AddColumnType = 'constant' | 'formula' | 'copy' | 'index';

export type TransformStepType =
  | 'filter'
  | 'sort'
  | 'select'
  | 'rename'
  | 'addColumn'
  | 'deduplicate'
  | 'findReplace';

export interface FilterConfig {
  column: string;
  operator: TransformOperator;
  value: string;
  caseSensitive?: boolean;
}

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

export interface SelectConfig {
  columns: string[];
}

export interface RenameConfig {
  oldName: string;
  newName: string;
}

export interface AddColumnConfig {
  name: string;
  type: AddColumnType;
  value?: string; // For constant
  formula?: string; // For formula (e.g., "{col1} + {col2}")
  sourceColumn?: string; // For copy
  startIndex?: number; // For index
}

export interface DeduplicateConfig {
  columns: string[]; // Columns to check for duplicates (empty = all columns)
  keepFirst: boolean; // Keep first or last occurrence
}

export interface FindReplaceConfig {
  column: string;
  find: string;
  replace: string;
  matchCase: boolean;
  matchWholeCell: boolean;
  useRegex: boolean;
}

// Base step interface
interface BaseStep {
  id: string;
  enabled: boolean;
}

// Specific step types
export interface FilterStep extends BaseStep {
  type: 'filter';
  config: FilterConfig;
}

export interface SortStep extends BaseStep {
  type: 'sort';
  config: SortConfig;
}

export interface SelectStep extends BaseStep {
  type: 'select';
  config: SelectConfig;
}

export interface RenameStep extends BaseStep {
  type: 'rename';
  config: RenameConfig;
}

export interface AddColumnStep extends BaseStep {
  type: 'addColumn';
  config: AddColumnConfig;
}

export interface DeduplicateStep extends BaseStep {
  type: 'deduplicate';
  config: DeduplicateConfig;
}

export interface FindReplaceStep extends BaseStep {
  type: 'findReplace';
  config: FindReplaceConfig;
}

// Union type for all steps
export type TransformStep =
  | FilterStep
  | SortStep
  | SelectStep
  | RenameStep
  | AddColumnStep
  | DeduplicateStep
  | FindReplaceStep;

export interface TransformResult {
  success: boolean;
  headers: string[];
  rows: string[][];
  rowsAffected: number;
  error?: string;
}

export interface TransformData {
  headers: string[];
  rows: string[][];
}
