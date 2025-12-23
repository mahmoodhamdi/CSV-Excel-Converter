/**
 * Custom error classes for the CSV Excel Converter application.
 * These provide structured error handling with error codes and additional context.
 */

// ============================================
// Error Codes
// ============================================

export const ErrorCodes = {
  // Parse errors
  INVALID_CSV: 'INVALID_CSV',
  INVALID_JSON: 'INVALID_JSON',
  INVALID_XML: 'INVALID_XML',
  INVALID_EXCEL: 'INVALID_EXCEL',
  EMPTY_DATA: 'EMPTY_DATA',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',

  // Conversion errors
  CONVERSION_FAILED: 'CONVERSION_FAILED',
  OUTPUT_TOO_LARGE: 'OUTPUT_TOO_LARGE',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED: 'MISSING_REQUIRED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',

  // System errors
  TIMEOUT: 'TIMEOUT',
  MEMORY_EXCEEDED: 'MEMORY_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============================================
// Base Application Error
// ============================================

export class AppError extends Error {
  code: ErrorCode;
  statusCode: number;
  isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };
  }
}

// ============================================
// Parse Error
// ============================================

export class ParseError extends AppError {
  line?: number;
  column?: number;
  format?: string;

  constructor(
    message: string,
    code: ErrorCode = ErrorCodes.INVALID_INPUT,
    position?: { line?: number; column?: number },
    format?: string
  ) {
    super(message, code, 400);
    this.name = 'ParseError';
    this.line = position?.line;
    this.column = position?.column;
    this.format = format;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      line: this.line,
      column: this.column,
      format: this.format,
    };
  }
}

// ============================================
// Conversion Error
// ============================================

export class ConversionError extends AppError {
  inputFormat?: string;
  outputFormat?: string;
  recoverable: boolean;
  suggestion?: string;

  constructor(
    message: string,
    code: ErrorCode = ErrorCodes.CONVERSION_FAILED,
    options: {
      inputFormat?: string;
      outputFormat?: string;
      recoverable?: boolean;
      suggestion?: string;
    } = {}
  ) {
    super(message, code, 500);
    this.name = 'ConversionError';
    this.inputFormat = options.inputFormat;
    this.outputFormat = options.outputFormat;
    this.recoverable = options.recoverable ?? false;
    this.suggestion = options.suggestion;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      inputFormat: this.inputFormat,
      outputFormat: this.outputFormat,
      recoverable: this.recoverable,
      suggestion: this.suggestion,
    };
  }
}

// ============================================
// Validation Error
// ============================================

export class ValidationError extends AppError {
  field?: string;
  value?: unknown;
  constraints?: Record<string, string>;

  constructor(
    message: string,
    code: ErrorCode = ErrorCodes.VALIDATION_ERROR,
    options: {
      field?: string;
      value?: unknown;
      constraints?: Record<string, string>;
    } = {}
  ) {
    super(message, code, 400);
    this.name = 'ValidationError';
    this.field = options.field;
    this.value = options.value;
    this.constraints = options.constraints;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
      constraints: this.constraints,
    };
  }
}

// ============================================
// Timeout Error
// ============================================

export class TimeoutError extends AppError {
  timeout: number;
  operation: string;

  constructor(message: string, timeout: number, operation: string = 'Operation') {
    super(message, ErrorCodes.TIMEOUT, 408);
    this.name = 'TimeoutError';
    this.timeout = timeout;
    this.operation = operation;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      timeout: this.timeout,
      operation: this.operation,
    };
  }
}

// ============================================
// File Error
// ============================================

export class FileError extends AppError {
  fileName?: string;
  fileSize?: number;
  maxSize?: number;

  constructor(
    message: string,
    code: ErrorCode = ErrorCodes.INVALID_FILE_TYPE,
    options: {
      fileName?: string;
      fileSize?: number;
      maxSize?: number;
    } = {}
  ) {
    super(message, code, 400);
    this.name = 'FileError';
    this.fileName = options.fileName;
    this.fileSize = options.fileSize;
    this.maxSize = options.maxSize;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fileName: this.fileName,
      fileSize: this.fileSize,
      maxSize: this.maxSize,
    };
  }
}

// ============================================
// Error Factory Functions
// ============================================

export function createParseError(format: string, details?: string): ParseError {
  const message = details
    ? `Failed to parse ${format.toUpperCase()}: ${details}`
    : `Failed to parse ${format.toUpperCase()} data`;

  const codeMap: Record<string, ErrorCode> = {
    csv: ErrorCodes.INVALID_CSV,
    json: ErrorCodes.INVALID_JSON,
    xml: ErrorCodes.INVALID_XML,
    xlsx: ErrorCodes.INVALID_EXCEL,
    xls: ErrorCodes.INVALID_EXCEL,
  };

  return new ParseError(
    message,
    codeMap[format.toLowerCase()] || ErrorCodes.INVALID_INPUT,
    undefined,
    format
  );
}

export function createFileTooLargeError(fileSize: number, maxSize: number): FileError {
  const maxSizeMB = Math.round(maxSize / (1024 * 1024));
  const fileSizeMB = Math.round(fileSize / (1024 * 1024));

  return new FileError(
    `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
    ErrorCodes.FILE_TOO_LARGE,
    { fileSize, maxSize }
  );
}

export function createTimeoutError(operation: string, timeout: number): TimeoutError {
  return new TimeoutError(
    `${operation} timed out after ${timeout}ms`,
    timeout,
    operation
  );
}

// ============================================
// Error Type Guards
// ============================================

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isParseError(error: unknown): error is ParseError {
  return error instanceof ParseError;
}

export function isConversionError(error: unknown): error is ConversionError {
  return error instanceof ConversionError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

export function isFileError(error: unknown): error is FileError {
  return error instanceof FileError;
}

// ============================================
// Error Handler
// ============================================

export function handleError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, ErrorCodes.INTERNAL_ERROR, 500);
  }

  return new AppError('An unexpected error occurred', ErrorCodes.INTERNAL_ERROR, 500);
}
