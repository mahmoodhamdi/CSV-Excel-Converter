/**
 * Timeout utilities for handling long-running operations.
 */

import { TimeoutError } from './errors';
import type { ParsedData, ConversionResult, ConvertOptions, InputFormat } from '@/types';

// ============================================
// Default Timeouts
// ============================================

export const TIMEOUTS = {
  PARSE: 60000,      // 60 seconds for parsing
  CONVERT: 30000,    // 30 seconds for conversion
  API_REQUEST: 30000, // 30 seconds for API requests
  FILE_READ: 30000,  // 30 seconds for file reading
} as const;

// ============================================
// Generic Timeout Wrapper
// ============================================

/**
 * Wraps a promise with a timeout. If the promise doesn't resolve
 * within the specified time, it rejects with a TimeoutError.
 *
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param operation - Description of the operation (for error message)
 * @returns The promise result or throws TimeoutError
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string = 'Operation'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new TimeoutError(
        `${operation} timed out after ${timeoutMs}ms`,
        timeoutMs,
        operation
      ));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

// ============================================
// Abortable Timeout
// ============================================

/**
 * Creates an AbortController that automatically aborts after the specified timeout.
 *
 * @param timeoutMs - Timeout in milliseconds
 * @returns Object containing the AbortController and cleanup function
 */
export function createAbortableTimeout(timeoutMs: number): {
  controller: AbortController;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    controller,
    cleanup: () => clearTimeout(timeoutId),
  };
}

/**
 * Wraps a promise with an AbortController timeout.
 *
 * @param promiseFn - Function that receives an AbortSignal and returns a promise
 * @param timeoutMs - Timeout in milliseconds
 * @param operation - Description of the operation
 * @returns The promise result or throws TimeoutError
 */
export async function withAbortableTimeout<T>(
  promiseFn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  operation: string = 'Operation'
): Promise<T> {
  const { controller, cleanup } = createAbortableTimeout(timeoutMs);

  try {
    const result = await promiseFn(controller.signal);
    cleanup();
    return result;
  } catch (error) {
    cleanup();
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(
        `${operation} timed out after ${timeoutMs}ms`,
        timeoutMs,
        operation
      );
    }
    throw error;
  }
}

// ============================================
// Retry with Timeout
// ============================================

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeoutMs?: number;
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * Retries a promise with timeout and exponential backoff.
 *
 * @param promiseFn - Function that returns a promise
 * @param options - Retry options
 * @returns The promise result
 */
export async function retryWithTimeout<T>(
  promiseFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeoutMs = 30000,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTimeout(promiseFn(), timeoutMs, 'Operation');
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt or if shouldRetry returns false
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ============================================
// Typed Timeout Wrappers for Converter
// ============================================

// Import dynamically to avoid circular dependencies
type ParseDataFn = (data: string | ArrayBuffer, format?: InputFormat) => Promise<ParsedData>;
type ConvertDataFn = (parsedData: ParsedData, options: ConvertOptions) => ConversionResult;

/**
 * Wraps parseData with a timeout.
 */
export function createParseDataWithTimeout(parseData: ParseDataFn) {
  return async function parseDataWithTimeout(
    data: string | ArrayBuffer,
    format?: InputFormat,
    timeout: number = TIMEOUTS.PARSE
  ): Promise<ParsedData> {
    return withTimeout(
      parseData(data, format),
      timeout,
      'Data parsing'
    );
  };
}

/**
 * Wraps convertData with a timeout.
 * Note: convertData is synchronous, so we wrap it in a Promise.
 */
export function createConvertDataWithTimeout(convertData: ConvertDataFn) {
  return async function convertDataWithTimeout(
    parsedData: ParsedData,
    options: ConvertOptions,
    timeout: number = TIMEOUTS.CONVERT
  ): Promise<ConversionResult> {
    return withTimeout(
      Promise.resolve(convertData(parsedData, options)),
      timeout,
      'Data conversion'
    );
  };
}

// ============================================
// Delay Utilities
// ============================================

/**
 * Creates a promise that resolves after the specified delay.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a promise that rejects after the specified delay.
 */
export function timeout(ms: number, message?: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(message || `Timeout after ${ms}ms`, ms));
    }, ms);
  });
}

// ============================================
// Race Utilities
// ============================================

/**
 * Races a promise against a timeout.
 */
export function raceWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string = 'Operation'
): Promise<T> {
  return Promise.race([
    promise,
    timeout(timeoutMs, `${operation} timed out after ${timeoutMs}ms`) as Promise<T>,
  ]);
}
