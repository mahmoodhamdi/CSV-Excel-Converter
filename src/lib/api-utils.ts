/**
 * API utility functions for consistent request/response handling.
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError, ErrorCodes, handleError, isAppError } from './errors';

// ============================================
// Request ID Generation
// ============================================

/**
 * Generates a unique request ID.
 * Uses crypto.randomUUID() if available, otherwise falls back to a simple implementation.
 */
export function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================
// API Response Types
// ============================================

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: unknown;
  requestId: string;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  requestId: string;
  [key: string]: unknown;
}

// ============================================
// Response Creators
// ============================================

/**
 * Creates a standardized error response.
 */
export function createErrorResponse(
  error: string,
  code: string,
  status: number,
  requestId: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error,
    code,
    requestId,
  };

  if (details !== undefined) {
    response.details = details;
  }

  console.error(`[${requestId}] API Error:`, { error, code, status, details });

  return NextResponse.json(response, { status });
}

/**
 * Creates a standardized success response.
 */
export function createSuccessResponse<T>(
  data: T,
  requestId: string,
  additionalFields?: Record<string, unknown>
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    requestId,
    ...additionalFields,
  });
}

// ============================================
// Error Handler for API Routes
// ============================================

/**
 * Handles errors in API routes and returns appropriate responses.
 */
export function handleApiError(
  error: unknown,
  requestId: string
): NextResponse<ApiErrorResponse> {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const details = error.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    return createErrorResponse(
      'Validation failed',
      ErrorCodes.VALIDATION_ERROR,
      400,
      requestId,
      details
    );
  }

  // Handle our custom errors
  if (isAppError(error)) {
    return createErrorResponse(
      error.message,
      error.code,
      error.statusCode,
      requestId
    );
  }

  // Handle standard errors
  if (error instanceof Error) {
    console.error(`[${requestId}] Unhandled error:`, error);

    return createErrorResponse(
      error.message,
      ErrorCodes.INTERNAL_ERROR,
      500,
      requestId
    );
  }

  // Handle unknown errors
  console.error(`[${requestId}] Unknown error:`, error);

  return createErrorResponse(
    'An unexpected error occurred',
    ErrorCodes.INTERNAL_ERROR,
    500,
    requestId
  );
}

// ============================================
// Request Validation Helpers
// ============================================

/**
 * Validates that required fields are present.
 */
export function validateRequiredFields(
  data: Record<string, unknown>,
  fields: string[]
): { valid: true } | { valid: false; missing: string[] } {
  const missing = fields.filter((field) => data[field] === undefined || data[field] === null);

  if (missing.length > 0) {
    return { valid: false, missing };
  }

  return { valid: true };
}

/**
 * Validates file size.
 */
export function validateFileSize(
  size: number,
  maxSize: number
): { valid: true } | { valid: false; error: string } {
  if (size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
    };
  }
  return { valid: true };
}

// ============================================
// Constants
// ============================================

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_PREVIEW_ROWS = 100;
