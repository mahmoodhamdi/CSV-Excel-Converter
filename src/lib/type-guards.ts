/**
 * Type guards for runtime type checking at application boundaries.
 */

import type { ParsedData, ConversionResult, InputFormat, OutputFormat } from '@/types';

// ============================================
// Format Type Guards
// ============================================

const INPUT_FORMATS = ['csv', 'tsv', 'json', 'xlsx', 'xls', 'xml'] as const;
const OUTPUT_FORMATS = ['csv', 'tsv', 'json', 'xlsx', 'xls', 'xml', 'sql'] as const;

export function isInputFormat(value: unknown): value is InputFormat {
  return typeof value === 'string' && INPUT_FORMATS.includes(value as InputFormat);
}

export function isOutputFormat(value: unknown): value is OutputFormat {
  return typeof value === 'string' && OUTPUT_FORMATS.includes(value as OutputFormat);
}

// ============================================
// Data Structure Type Guards
// ============================================

export function isParsedData(value: unknown): value is ParsedData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Check headers
  if (!Array.isArray(obj.headers)) {
    return false;
  }
  if (!obj.headers.every((h) => typeof h === 'string')) {
    return false;
  }

  // Check rows
  if (!Array.isArray(obj.rows)) {
    return false;
  }
  if (!obj.rows.every((r) => typeof r === 'object' && r !== null)) {
    return false;
  }

  return true;
}

export function isConversionResult(value: unknown): value is ConversionResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Check required fields
  if (typeof obj.success !== 'boolean') {
    return false;
  }
  if (!isOutputFormat(obj.format)) {
    return false;
  }

  // If success is true, data should be present
  if (obj.success && obj.data === undefined) {
    return false;
  }

  // If success is false, error should be present
  if (!obj.success && typeof obj.error !== 'string') {
    return false;
  }

  return true;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

// ============================================
// API Response Type Guards
// ============================================

interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  requestId?: string;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  requestId?: string;
}

type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export function isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
  if (!isRecord(value)) return false;
  return value.success === true && 'data' in value;
}

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!isRecord(value)) return false;
  return value.success === false && typeof value.error === 'string';
}

export function isApiResponse(value: unknown): value is ApiResponse {
  return isApiSuccessResponse(value) || isApiErrorResponse(value);
}

// ============================================
// Assertion Functions
// ============================================

export function assertParsedData(value: unknown): asserts value is ParsedData {
  if (!isParsedData(value)) {
    throw new Error('Invalid ParsedData structure: expected object with headers array and rows array');
  }
}

export function assertConversionResult(value: unknown): asserts value is ConversionResult {
  if (!isConversionResult(value)) {
    throw new Error('Invalid ConversionResult structure: expected object with success boolean and format string');
  }
}

export function assertInputFormat(value: unknown): asserts value is InputFormat {
  if (!isInputFormat(value)) {
    throw new Error(`Invalid input format: expected one of ${INPUT_FORMATS.join(', ')}`);
  }
}

export function assertOutputFormat(value: unknown): asserts value is OutputFormat {
  if (!isOutputFormat(value)) {
    throw new Error(`Invalid output format: expected one of ${OUTPUT_FORMATS.join(', ')}`);
  }
}

export function assertNonNull<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Value is null or undefined');
  }
}

export function assertString(value: unknown, message?: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(message || `Expected string, got ${typeof value}`);
  }
}

export function assertNumber(value: unknown, message?: string): asserts value is number {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(message || `Expected number, got ${typeof value}`);
  }
}

// ============================================
// Safe Parsing Helpers
// ============================================

export function safeParseJSON<T>(json: string): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = JSON.parse(json) as T;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}

export function safeGet<T>(obj: Record<string, unknown>, key: string): T | undefined {
  return obj[key] as T | undefined;
}

export function safeGetString(obj: Record<string, unknown>, key: string): string | undefined {
  const value = obj[key];
  return typeof value === 'string' ? value : undefined;
}

export function safeGetNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const value = obj[key];
  return typeof value === 'number' && !isNaN(value) ? value : undefined;
}

export function safeGetBoolean(obj: Record<string, unknown>, key: string): boolean | undefined {
  const value = obj[key];
  return typeof value === 'boolean' ? value : undefined;
}

export function safeGetArray<T>(obj: Record<string, unknown>, key: string): T[] | undefined {
  const value = obj[key];
  return Array.isArray(value) ? (value as T[]) : undefined;
}
