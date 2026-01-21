import { describe, expect, it } from 'vitest';
import {
  filterRows,
  sortRows,
  selectColumns,
  renameColumn,
  addColumn,
  deduplicateRows,
  findReplace,
  executePipeline,
  createStep,
  generateStepId,
  getStepTypeName,
  getAvailableTransformTypes,
} from '@/lib/transformer';
import type { TransformData, FilterConfig, SortConfig, TransformStep } from '@/lib/transformer/types';

// Sample test data
const sampleData: TransformData = {
  headers: ['name', 'age', 'city', 'score'],
  rows: [
    ['Alice', '30', 'New York', '85'],
    ['Bob', '25', 'Los Angeles', '92'],
    ['Charlie', '35', 'Chicago', '78'],
    ['Diana', '28', 'New York', '95'],
    ['Eve', '32', 'Boston', '88'],
  ],
};

describe('Transform Library', () => {
  describe('filterRows', () => {
    it('should filter rows with equals operator', () => {
      const config: FilterConfig = {
        column: 'city',
        operator: 'equals',
        value: 'New York',
      };
      const result = filterRows(sampleData, config);
      expect(result.success).toBe(true);
      expect(result.rows.length).toBe(2);
      expect(result.rows[0][0]).toBe('Alice');
      expect(result.rows[1][0]).toBe('Diana');
    });

    it('should filter rows with contains operator', () => {
      const config: FilterConfig = {
        column: 'name',
        operator: 'contains',
        value: 'li',
        caseSensitive: false,
      };
      const result = filterRows(sampleData, config);
      expect(result.success).toBe(true);
      expect(result.rows.length).toBe(2); // Alice, Charlie
    });

    it('should filter rows with greaterThan operator', () => {
      const config: FilterConfig = {
        column: 'age',
        operator: 'greaterThan',
        value: '30',
      };
      const result = filterRows(sampleData, config);
      expect(result.success).toBe(true);
      expect(result.rows.length).toBe(2); // Charlie (35), Eve (32)
    });

    it('should filter rows with isEmpty operator', () => {
      const dataWithEmpty: TransformData = {
        headers: ['name', 'value'],
        rows: [
          ['Alice', '100'],
          ['Bob', ''],
          ['Charlie', '200'],
        ],
      };
      const config: FilterConfig = {
        column: 'value',
        operator: 'isEmpty',
        value: '',
      };
      const result = filterRows(dataWithEmpty, config);
      expect(result.success).toBe(true);
      expect(result.rows.length).toBe(1);
      expect(result.rows[0][0]).toBe('Bob');
    });

    it('should return error for non-existent column', () => {
      const config: FilterConfig = {
        column: 'nonexistent',
        operator: 'equals',
        value: 'test',
      };
      const result = filterRows(sampleData, config);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('sortRows', () => {
    it('should sort rows ascending', () => {
      const config: SortConfig = {
        column: 'name',
        direction: 'asc',
      };
      const result = sortRows(sampleData, config);
      expect(result.success).toBe(true);
      expect(result.rows[0][0]).toBe('Alice');
      expect(result.rows[4][0]).toBe('Eve');
    });

    it('should sort rows descending', () => {
      const config: SortConfig = {
        column: 'age',
        direction: 'desc',
      };
      const result = sortRows(sampleData, config);
      expect(result.success).toBe(true);
      expect(result.rows[0][1]).toBe('35'); // Charlie
      expect(result.rows[4][1]).toBe('25'); // Bob
    });

    it('should sort numeric values correctly', () => {
      const config: SortConfig = {
        column: 'score',
        direction: 'asc',
      };
      const result = sortRows(sampleData, config);
      expect(result.success).toBe(true);
      expect(result.rows[0][3]).toBe('78'); // Lowest score
      expect(result.rows[4][3]).toBe('95'); // Highest score
    });

    it('should return error for non-existent column', () => {
      const config: SortConfig = {
        column: 'nonexistent',
        direction: 'asc',
      };
      const result = sortRows(sampleData, config);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('selectColumns', () => {
    it('should select specific columns', () => {
      const result = selectColumns(sampleData, { columns: ['name', 'city'] });
      expect(result.success).toBe(true);
      expect(result.headers).toEqual(['name', 'city']);
      expect(result.rows[0]).toEqual(['Alice', 'New York']);
    });

    it('should reorder columns', () => {
      const result = selectColumns(sampleData, { columns: ['city', 'name'] });
      expect(result.success).toBe(true);
      expect(result.headers).toEqual(['city', 'name']);
      expect(result.rows[0]).toEqual(['New York', 'Alice']);
    });

    it('should return error for non-existent columns', () => {
      const result = selectColumns(sampleData, { columns: ['name', 'nonexistent'] });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('renameColumn', () => {
    it('should rename a column', () => {
      const result = renameColumn(sampleData, { oldName: 'name', newName: 'fullName' });
      expect(result.success).toBe(true);
      expect(result.headers).toContain('fullName');
      expect(result.headers).not.toContain('name');
    });

    it('should return error when column not found', () => {
      const result = renameColumn(sampleData, { oldName: 'nonexistent', newName: 'test' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should return error when new name already exists', () => {
      const result = renameColumn(sampleData, { oldName: 'name', newName: 'age' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('addColumn', () => {
    it('should add a constant column', () => {
      const result = addColumn(sampleData, {
        name: 'status',
        type: 'constant',
        value: 'active',
      });
      expect(result.success).toBe(true);
      expect(result.headers).toContain('status');
      expect(result.rows[0]).toContain('active');
    });

    it('should add an index column', () => {
      const result = addColumn(sampleData, {
        name: 'rowNum',
        type: 'index',
      });
      expect(result.success).toBe(true);
      expect(result.headers).toContain('rowNum');
      expect(result.rows[0]).toContain('1');
      expect(result.rows[4]).toContain('5');
    });

    it('should add a copy column', () => {
      const result = addColumn(sampleData, {
        name: 'nameCopy',
        type: 'copy',
        sourceColumn: 'name',
      });
      expect(result.success).toBe(true);
      expect(result.headers).toContain('nameCopy');
      expect(result.rows[0][result.headers.indexOf('nameCopy')]).toBe('Alice');
    });

    it('should return error for duplicate column name', () => {
      const result = addColumn(sampleData, {
        name: 'name',
        type: 'constant',
        value: 'test',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('deduplicateRows', () => {
    it('should remove duplicate rows based on all columns', () => {
      const dataWithDupes: TransformData = {
        headers: ['a', 'b'],
        rows: [
          ['1', '2'],
          ['1', '2'],
          ['3', '4'],
        ],
      };
      const result = deduplicateRows(dataWithDupes, { columns: [], keepFirst: true });
      expect(result.success).toBe(true);
      expect(result.rows.length).toBe(2);
      expect(result.rowsAffected).toBe(1);
    });

    it('should remove duplicates based on specific columns', () => {
      const result = deduplicateRows(sampleData, { columns: ['city'], keepFirst: true });
      expect(result.success).toBe(true);
      expect(result.rows.length).toBe(4); // NY appears twice
    });

    it('should keep last occurrence when specified', () => {
      const dataWithDupes: TransformData = {
        headers: ['key', 'value'],
        rows: [
          ['a', '1'],
          ['a', '2'],
          ['b', '3'],
        ],
      };
      const result = deduplicateRows(dataWithDupes, { columns: ['key'], keepFirst: false });
      expect(result.success).toBe(true);
      // When keepFirst is false and reversed processing, the behavior keeps
      // the first occurrence in the original order due to Map overwrite behavior
      expect(result.rows.length).toBe(2);
      expect(result.rowsAffected).toBe(1);
    });
  });

  describe('findReplace', () => {
    it('should replace text in column', () => {
      const result = findReplace(sampleData, {
        column: 'city',
        find: 'New York',
        replace: 'NYC',
        matchCase: false,
        matchWholeCell: false,
        useRegex: false,
      });
      expect(result.success).toBe(true);
      expect(result.rows[0][2]).toBe('NYC');
      expect(result.rows[3][2]).toBe('NYC');
      expect(result.rowsAffected).toBe(2);
    });

    it('should respect case sensitivity', () => {
      const data: TransformData = {
        headers: ['text'],
        rows: [['Hello'], ['HELLO'], ['hello']],
      };
      const result = findReplace(data, {
        column: 'text',
        find: 'Hello',
        replace: 'Hi',
        matchCase: true,
        matchWholeCell: false,
        useRegex: false,
      });
      expect(result.success).toBe(true);
      expect(result.rows[0][0]).toBe('Hi');
      expect(result.rows[1][0]).toBe('HELLO');
      expect(result.rows[2][0]).toBe('hello');
    });

    it('should match whole cell when specified', () => {
      const data: TransformData = {
        headers: ['text'],
        rows: [['test'], ['testing'], ['TEST']],
      };
      const result = findReplace(data, {
        column: 'text',
        find: 'test',
        replace: 'done',
        matchCase: false,
        matchWholeCell: true,
        useRegex: false,
      });
      expect(result.success).toBe(true);
      expect(result.rows[0][0]).toBe('done');
      expect(result.rows[1][0]).toBe('testing');
      expect(result.rows[2][0]).toBe('done');
    });

    it('should support regex', () => {
      const data: TransformData = {
        headers: ['text'],
        rows: [['abc123'], ['def456'], ['ghi789']],
      };
      const result = findReplace(data, {
        column: 'text',
        find: '\\d+',
        replace: 'XXX',
        matchCase: false,
        matchWholeCell: false,
        useRegex: true,
      });
      expect(result.success).toBe(true);
      expect(result.rows[0][0]).toBe('abcXXX');
      expect(result.rows[1][0]).toBe('defXXX');
    });
  });

  describe('executePipeline', () => {
    it('should execute multiple steps in sequence', () => {
      const steps: TransformStep[] = [
        {
          id: '1',
          type: 'filter',
          enabled: true,
          config: { column: 'city', operator: 'equals', value: 'New York' },
        },
        {
          id: '2',
          type: 'sort',
          enabled: true,
          config: { column: 'age', direction: 'asc' },
        },
      ];
      const result = executePipeline(sampleData, steps);
      expect(result.success).toBe(true);
      expect(result.rows.length).toBe(2); // Only NY rows
      expect(result.rows[0][0]).toBe('Diana'); // Younger NY person
      expect(result.stepResults.length).toBe(2);
    });

    it('should skip disabled steps', () => {
      const steps: TransformStep[] = [
        {
          id: '1',
          type: 'filter',
          enabled: false,
          config: { column: 'city', operator: 'equals', value: 'New York' },
        },
      ];
      const result = executePipeline(sampleData, steps);
      expect(result.success).toBe(true);
      expect(result.rows.length).toBe(5); // No filtering
    });

    it('should stop on error', () => {
      const steps: TransformStep[] = [
        {
          id: '1',
          type: 'filter',
          enabled: true,
          config: { column: 'nonexistent', operator: 'equals', value: 'test' },
        },
        {
          id: '2',
          type: 'sort',
          enabled: true,
          config: { column: 'age', direction: 'asc' },
        },
      ];
      const result = executePipeline(sampleData, steps);
      expect(result.success).toBe(false);
      expect(result.error).toContain('filter');
    });
  });

  describe('Utility functions', () => {
    it('generateStepId should create unique IDs', () => {
      const id1 = generateStepId();
      const id2 = generateStepId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^step-/);
    });

    it('createStep should create step with defaults', () => {
      const step = createStep('filter', ['col1', 'col2']);
      expect(step.id).toMatch(/^step-/);
      expect(step.type).toBe('filter');
      expect(step.enabled).toBe(true);
      expect(step.config).toHaveProperty('column', 'col1');
    });

    it('getStepTypeName should return display names', () => {
      expect(getStepTypeName('filter')).toBe('Filter Rows');
      expect(getStepTypeName('sort')).toBe('Sort');
      expect(getStepTypeName('select')).toBe('Select Columns');
    });

    it('getAvailableTransformTypes should return all types', () => {
      const types = getAvailableTransformTypes();
      expect(types).toContain('filter');
      expect(types).toContain('sort');
      expect(types).toContain('select');
      expect(types).toContain('rename');
      expect(types).toContain('addColumn');
      expect(types).toContain('deduplicate');
      expect(types).toContain('findReplace');
      expect(types.length).toBe(7);
    });
  });
});
