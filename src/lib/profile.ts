/**
 * Column profiling: type inference, null/unique counts, range, top values.
 *
 * Used by the "Profile" tab to give analysts a quick overview of a dataset.
 */

export type InferredType =
  | 'integer'
  | 'float'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'string'
  | 'null';

export interface ColumnProfile {
  name: string;
  type: InferredType;
  nullCount: number;
  nullPct: number;
  uniqueCount: number;
  uniquePct: number;
  min: number | string | null;
  max: number | string | null;
  mean: number | null;
  topValues: Array<{ value: unknown; count: number; pct: number }>;
  sampleValues: unknown[];
}

export interface DataProfile {
  rowCount: number;
  columnCount: number;
  columns: ColumnProfile[];
}

const INTEGER_RE = /^-?\d+$/;
const FLOAT_RE = /^-?\d+\.\d+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?/;
const BOOL_VALUES = new Set(['true', 'false', 'yes', 'no', 'y', 'n', '0', '1']);

function classifyValue(raw: unknown): InferredType {
  if (raw === null || raw === undefined || raw === '') return 'null';
  if (typeof raw === 'boolean') return 'boolean';
  if (typeof raw === 'number') {
    return Number.isInteger(raw) ? 'integer' : 'float';
  }
  const str = String(raw).trim();
  if (str === '') return 'null';
  if (INTEGER_RE.test(str)) return 'integer';
  if (FLOAT_RE.test(str)) return 'float';
  if (DATETIME_RE.test(str)) return 'datetime';
  if (DATE_RE.test(str)) return 'date';
  if (BOOL_VALUES.has(str.toLowerCase())) return 'boolean';
  return 'string';
}

function consensusType(samples: InferredType[]): InferredType {
  if (samples.length === 0) return 'null';
  const counts = new Map<InferredType, number>();
  for (const t of samples) counts.set(t, (counts.get(t) ?? 0) + 1);
  // If all samples are null, type is null
  const nonNull = samples.filter((t) => t !== 'null');
  if (nonNull.length === 0) return 'null';

  const nonNullCounts = new Map<InferredType, number>();
  for (const t of nonNull) nonNullCounts.set(t, (nonNullCounts.get(t) ?? 0) + 1);

  // Promote numeric types: if both integer and float appear, the column is float.
  if (nonNullCounts.has('float') && nonNullCounts.has('integer')) {
    nonNullCounts.set('float', (nonNullCounts.get('float') ?? 0) + (nonNullCounts.get('integer') ?? 0));
    nonNullCounts.delete('integer');
  }
  // Promote date/datetime similarly
  if (nonNullCounts.has('datetime') && nonNullCounts.has('date')) {
    nonNullCounts.set('datetime', (nonNullCounts.get('datetime') ?? 0) + (nonNullCounts.get('date') ?? 0));
    nonNullCounts.delete('date');
  }

  // Pick the most common non-null type
  let best: InferredType = 'string';
  let bestCount = 0;
  for (const [t, c] of nonNullCounts) {
    if (c > bestCount) {
      best = t;
      bestCount = c;
    }
  }

  // If <80% of non-null samples are the dominant type, fall back to string
  if (bestCount / nonNull.length < 0.8) return 'string';
  return best;
}

function tryNumeric(raw: unknown): number | null {
  if (typeof raw === 'number') return raw;
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(String(raw).trim());
  return Number.isFinite(n) ? n : null;
}

export function profileColumn(name: string, values: unknown[]): ColumnProfile {
  const total = values.length;
  const nullCount = values.filter(
    (v) => v === null || v === undefined || v === ''
  ).length;
  const nonNullValues = values.filter(
    (v) => v !== null && v !== undefined && v !== ''
  );

  const sampleSize = Math.min(nonNullValues.length, 200);
  const sampleTypes: InferredType[] = [];
  for (let i = 0; i < sampleSize; i++) {
    sampleTypes.push(classifyValue(nonNullValues[i]));
  }
  const type = consensusType(sampleTypes);

  const uniqueSet = new Set<string>();
  const freq = new Map<string, number>();
  for (const v of nonNullValues) {
    const key = String(v);
    uniqueSet.add(key);
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }

  const topValues = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([value, count]) => ({
      value,
      count,
      pct: total === 0 ? 0 : count / total,
    }));

  let min: number | string | null = null;
  let max: number | string | null = null;
  let mean: number | null = null;

  if (type === 'integer' || type === 'float') {
    const nums = nonNullValues.map(tryNumeric).filter((n): n is number => n !== null);
    if (nums.length > 0) {
      min = Math.min(...nums);
      max = Math.max(...nums);
      mean = nums.reduce((s, n) => s + n, 0) / nums.length;
    }
  } else if (type === 'date' || type === 'datetime') {
    const sorted = [...nonNullValues].map(String).sort();
    if (sorted.length > 0) {
      min = sorted[0];
      max = sorted[sorted.length - 1];
    }
  } else if (nonNullValues.length > 0) {
    const sorted = [...nonNullValues].map(String).sort();
    min = sorted[0];
    max = sorted[sorted.length - 1];
  }

  return {
    name,
    type,
    nullCount,
    nullPct: total === 0 ? 0 : nullCount / total,
    uniqueCount: uniqueSet.size,
    uniquePct: total === 0 ? 0 : uniqueSet.size / total,
    min,
    max,
    mean,
    topValues,
    sampleValues: nonNullValues.slice(0, 5),
  };
}

export function profileData(
  headers: string[],
  rows: Record<string, unknown>[]
): DataProfile {
  const columns = headers.map((h) =>
    profileColumn(
      h,
      rows.map((r) => r[h])
    )
  );
  return {
    rowCount: rows.length,
    columnCount: headers.length,
    columns,
  };
}
