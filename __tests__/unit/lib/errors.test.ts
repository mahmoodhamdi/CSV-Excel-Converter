import { describe, it, expect } from 'vitest';
import {
  ErrorCodes,
  AppError,
  ParseError,
  ConversionError,
  ValidationError,
  TimeoutError,
  FileError,
  createParseError,
  createFileTooLargeError,
  createTimeoutError,
  isAppError,
  isParseError,
  isConversionError,
  isValidationError,
  isTimeoutError,
  isFileError,
  handleError,
} from '@/lib/errors';

describe('Error Classes', () => {
  describe('ErrorCodes', () => {
    it('should have all expected error codes', () => {
      expect(ErrorCodes.INVALID_CSV).toBe('INVALID_CSV');
      expect(ErrorCodes.INVALID_JSON).toBe('INVALID_JSON');
      expect(ErrorCodes.INVALID_XML).toBe('INVALID_XML');
      expect(ErrorCodes.INVALID_EXCEL).toBe('INVALID_EXCEL');
      expect(ErrorCodes.EMPTY_DATA).toBe('EMPTY_DATA');
      expect(ErrorCodes.UNSUPPORTED_FORMAT).toBe('UNSUPPORTED_FORMAT');
      expect(ErrorCodes.CONVERSION_FAILED).toBe('CONVERSION_FAILED');
      expect(ErrorCodes.OUTPUT_TOO_LARGE).toBe('OUTPUT_TOO_LARGE');
      expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCodes.INVALID_INPUT).toBe('INVALID_INPUT');
      expect(ErrorCodes.MISSING_REQUIRED).toBe('MISSING_REQUIRED');
      expect(ErrorCodes.FILE_TOO_LARGE).toBe('FILE_TOO_LARGE');
      expect(ErrorCodes.INVALID_FILE_TYPE).toBe('INVALID_FILE_TYPE');
      expect(ErrorCodes.TIMEOUT).toBe('TIMEOUT');
      expect(ErrorCodes.MEMORY_EXCEEDED).toBe('MEMORY_EXCEEDED');
      expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ErrorCodes.NETWORK_ERROR).toBe('NETWORK_ERROR');
    });
  });

  describe('AppError', () => {
    it('should create error with message and code', () => {
      const error = new AppError('Test error', ErrorCodes.INTERNAL_ERROR);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });

    it('should create error with custom status code', () => {
      const error = new AppError('Bad request', ErrorCodes.INVALID_INPUT, 400);
      expect(error.statusCode).toBe(400);
    });

    it('should create non-operational error', () => {
      const error = new AppError('Critical error', ErrorCodes.INTERNAL_ERROR, 500, false);
      expect(error.isOperational).toBe(false);
    });

    it('should serialize to JSON correctly', () => {
      const error = new AppError('Test error', ErrorCodes.VALIDATION_ERROR, 400);
      const json = error.toJSON();
      expect(json).toEqual({
        name: 'AppError',
        message: 'Test error',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      });
    });

    it('should be an instance of Error', () => {
      const error = new AppError('Test', ErrorCodes.INTERNAL_ERROR);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('ParseError', () => {
    it('should create parse error with basic info', () => {
      const error = new ParseError('Invalid JSON', ErrorCodes.INVALID_JSON);
      expect(error.message).toBe('Invalid JSON');
      expect(error.code).toBe('INVALID_JSON');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ParseError');
    });

    it('should create parse error with position', () => {
      const error = new ParseError('Parse failed', ErrorCodes.INVALID_CSV, { line: 5, column: 10 });
      expect(error.line).toBe(5);
      expect(error.column).toBe(10);
    });

    it('should create parse error with format', () => {
      const error = new ParseError('Invalid data', ErrorCodes.INVALID_JSON, undefined, 'json');
      expect(error.format).toBe('json');
    });

    it('should serialize to JSON with all fields', () => {
      const error = new ParseError('Parse error', ErrorCodes.INVALID_CSV, { line: 3, column: 5 }, 'csv');
      const json = error.toJSON();
      expect(json).toEqual({
        name: 'ParseError',
        message: 'Parse error',
        code: 'INVALID_CSV',
        statusCode: 400,
        line: 3,
        column: 5,
        format: 'csv',
      });
    });

    it('should be an instance of AppError', () => {
      const error = new ParseError('Test', ErrorCodes.INVALID_JSON);
      expect(error instanceof AppError).toBe(true);
    });
  });

  describe('ConversionError', () => {
    it('should create conversion error with basic info', () => {
      const error = new ConversionError('Conversion failed', ErrorCodes.CONVERSION_FAILED);
      expect(error.message).toBe('Conversion failed');
      expect(error.code).toBe('CONVERSION_FAILED');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('ConversionError');
      expect(error.recoverable).toBe(false);
    });

    it('should create conversion error with formats', () => {
      const error = new ConversionError('Failed', ErrorCodes.CONVERSION_FAILED, {
        inputFormat: 'csv',
        outputFormat: 'json',
      });
      expect(error.inputFormat).toBe('csv');
      expect(error.outputFormat).toBe('json');
    });

    it('should create recoverable conversion error', () => {
      const error = new ConversionError('Failed', ErrorCodes.CONVERSION_FAILED, {
        recoverable: true,
        suggestion: 'Try a different format',
      });
      expect(error.recoverable).toBe(true);
      expect(error.suggestion).toBe('Try a different format');
    });

    it('should serialize to JSON with all fields', () => {
      const error = new ConversionError('Failed', ErrorCodes.CONVERSION_FAILED, {
        inputFormat: 'csv',
        outputFormat: 'xlsx',
        recoverable: true,
        suggestion: 'Use JSON instead',
      });
      const json = error.toJSON();
      expect(json).toEqual({
        name: 'ConversionError',
        message: 'Failed',
        code: 'CONVERSION_FAILED',
        statusCode: 500,
        inputFormat: 'csv',
        outputFormat: 'xlsx',
        recoverable: true,
        suggestion: 'Use JSON instead',
      });
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with basic info', () => {
      const error = new ValidationError('Invalid input', ErrorCodes.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });

    it('should create validation error with field info', () => {
      const error = new ValidationError('Invalid email', ErrorCodes.VALIDATION_ERROR, {
        field: 'email',
        value: 'invalid-email',
        constraints: { email: 'Must be a valid email' },
      });
      expect(error.field).toBe('email');
      expect(error.value).toBe('invalid-email');
      expect(error.constraints).toEqual({ email: 'Must be a valid email' });
    });

    it('should serialize to JSON without value', () => {
      const error = new ValidationError('Invalid', ErrorCodes.VALIDATION_ERROR, {
        field: 'password',
        value: 'secret123',
        constraints: { minLength: 'Too short' },
      });
      const json = error.toJSON();
      expect(json.field).toBe('password');
      expect(json.constraints).toEqual({ minLength: 'Too short' });
      expect(json).not.toHaveProperty('value');
    });
  });

  describe('TimeoutError', () => {
    it('should create timeout error', () => {
      const error = new TimeoutError('Request timed out', 30000, 'API Request');
      expect(error.message).toBe('Request timed out');
      expect(error.code).toBe('TIMEOUT');
      expect(error.statusCode).toBe(408);
      expect(error.name).toBe('TimeoutError');
      expect(error.timeout).toBe(30000);
      expect(error.operation).toBe('API Request');
    });

    it('should serialize to JSON with all fields', () => {
      const error = new TimeoutError('Timed out', 5000, 'Parse');
      const json = error.toJSON();
      expect(json).toEqual({
        name: 'TimeoutError',
        message: 'Timed out',
        code: 'TIMEOUT',
        statusCode: 408,
        timeout: 5000,
        operation: 'Parse',
      });
    });
  });

  describe('FileError', () => {
    it('should create file error with basic info', () => {
      const error = new FileError('Invalid file', ErrorCodes.INVALID_FILE_TYPE);
      expect(error.message).toBe('Invalid file');
      expect(error.code).toBe('INVALID_FILE_TYPE');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('FileError');
    });

    it('should create file error with file info', () => {
      const error = new FileError('File too large', ErrorCodes.FILE_TOO_LARGE, {
        fileName: 'big-file.csv',
        fileSize: 100 * 1024 * 1024,
        maxSize: 50 * 1024 * 1024,
      });
      expect(error.fileName).toBe('big-file.csv');
      expect(error.fileSize).toBe(100 * 1024 * 1024);
      expect(error.maxSize).toBe(50 * 1024 * 1024);
    });

    it('should serialize to JSON with all fields', () => {
      const error = new FileError('Too large', ErrorCodes.FILE_TOO_LARGE, {
        fileName: 'data.csv',
        fileSize: 60000000,
        maxSize: 50000000,
      });
      const json = error.toJSON();
      expect(json).toEqual({
        name: 'FileError',
        message: 'Too large',
        code: 'FILE_TOO_LARGE',
        statusCode: 400,
        fileName: 'data.csv',
        fileSize: 60000000,
        maxSize: 50000000,
      });
    });
  });
});

describe('Error Factory Functions', () => {
  describe('createParseError', () => {
    it('should create parse error for CSV', () => {
      const error = createParseError('csv', 'Unexpected end of file');
      expect(error).toBeInstanceOf(ParseError);
      expect(error.code).toBe('INVALID_CSV');
      expect(error.message).toContain('CSV');
      expect(error.message).toContain('Unexpected end of file');
      expect(error.format).toBe('csv');
    });

    it('should create parse error for JSON', () => {
      const error = createParseError('json', 'Unexpected token');
      expect(error.code).toBe('INVALID_JSON');
      expect(error.format).toBe('json');
    });

    it('should create parse error for XML', () => {
      const error = createParseError('xml');
      expect(error.code).toBe('INVALID_XML');
      expect(error.message).toContain('XML');
    });

    it('should create parse error for Excel', () => {
      const error = createParseError('xlsx');
      expect(error.code).toBe('INVALID_EXCEL');
    });

    it('should handle unknown format', () => {
      const error = createParseError('unknown');
      expect(error.code).toBe('INVALID_INPUT');
    });
  });

  describe('createFileTooLargeError', () => {
    it('should create file too large error with correct message', () => {
      const fileSize = 60 * 1024 * 1024; // 60MB
      const maxSize = 50 * 1024 * 1024; // 50MB
      const error = createFileTooLargeError(fileSize, maxSize);

      expect(error).toBeInstanceOf(FileError);
      expect(error.code).toBe('FILE_TOO_LARGE');
      expect(error.message).toContain('60MB');
      expect(error.message).toContain('50MB');
      expect(error.fileSize).toBe(fileSize);
      expect(error.maxSize).toBe(maxSize);
    });
  });

  describe('createTimeoutError', () => {
    it('should create timeout error with correct message', () => {
      const error = createTimeoutError('Parse operation', 30000);

      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.code).toBe('TIMEOUT');
      expect(error.message).toContain('Parse operation');
      expect(error.message).toContain('30000ms');
      expect(error.timeout).toBe(30000);
      expect(error.operation).toBe('Parse operation');
    });
  });
});

describe('Error Type Guards', () => {
  describe('isAppError', () => {
    it('should return true for AppError', () => {
      expect(isAppError(new AppError('Test', ErrorCodes.INTERNAL_ERROR))).toBe(true);
    });

    it('should return true for subclasses of AppError', () => {
      expect(isAppError(new ParseError('Test', ErrorCodes.INVALID_JSON))).toBe(true);
      expect(isAppError(new ConversionError('Test'))).toBe(true);
    });

    it('should return false for regular Error', () => {
      expect(isAppError(new Error('Test'))).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError('error')).toBe(false);
      expect(isAppError({ message: 'error' })).toBe(false);
    });
  });

  describe('isParseError', () => {
    it('should return true for ParseError', () => {
      expect(isParseError(new ParseError('Test', ErrorCodes.INVALID_JSON))).toBe(true);
    });

    it('should return false for other AppError types', () => {
      expect(isParseError(new AppError('Test', ErrorCodes.INTERNAL_ERROR))).toBe(false);
      expect(isParseError(new ConversionError('Test'))).toBe(false);
    });
  });

  describe('isConversionError', () => {
    it('should return true for ConversionError', () => {
      expect(isConversionError(new ConversionError('Test'))).toBe(true);
    });

    it('should return false for other error types', () => {
      expect(isConversionError(new ParseError('Test', ErrorCodes.INVALID_JSON))).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('should return true for ValidationError', () => {
      expect(isValidationError(new ValidationError('Test', ErrorCodes.VALIDATION_ERROR))).toBe(true);
    });

    it('should return false for other error types', () => {
      expect(isValidationError(new AppError('Test', ErrorCodes.INTERNAL_ERROR))).toBe(false);
    });
  });

  describe('isTimeoutError', () => {
    it('should return true for TimeoutError', () => {
      expect(isTimeoutError(new TimeoutError('Test', 1000, 'Operation'))).toBe(true);
    });

    it('should return false for other error types', () => {
      expect(isTimeoutError(new AppError('Test', ErrorCodes.TIMEOUT))).toBe(false);
    });
  });

  describe('isFileError', () => {
    it('should return true for FileError', () => {
      expect(isFileError(new FileError('Test', ErrorCodes.FILE_TOO_LARGE))).toBe(true);
    });

    it('should return false for other error types', () => {
      expect(isFileError(new ValidationError('Test', ErrorCodes.VALIDATION_ERROR))).toBe(false);
    });
  });
});

describe('handleError', () => {
  it('should return AppError as-is', () => {
    const originalError = new AppError('Test', ErrorCodes.VALIDATION_ERROR, 400);
    const result = handleError(originalError);
    expect(result).toBe(originalError);
  });

  it('should wrap regular Error in AppError', () => {
    const originalError = new Error('Something went wrong');
    const result = handleError(originalError);
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Something went wrong');
    expect(result.code).toBe('INTERNAL_ERROR');
    expect(result.statusCode).toBe(500);
  });

  it('should handle non-Error values', () => {
    const result = handleError('string error');
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('An unexpected error occurred');
    expect(result.code).toBe('INTERNAL_ERROR');
  });

  it('should handle null and undefined', () => {
    expect(handleError(null).code).toBe('INTERNAL_ERROR');
    expect(handleError(undefined).code).toBe('INTERNAL_ERROR');
  });
});
