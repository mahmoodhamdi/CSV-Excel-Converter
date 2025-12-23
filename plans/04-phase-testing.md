# Phase 4: Test Coverage Improvement

## Priority: MEDIUM
## Estimated Effort: High
## Dependencies: Phase 1, Phase 2, Phase 3

---

## Overview

This phase expands test coverage to ensure code quality, catch regressions, and document expected behavior. Target is 80%+ unit test coverage and comprehensive E2E coverage.

---

## Current Test Coverage Analysis

### Existing Tests:
- `__tests__/unit/lib/csv.test.ts` - CSV parsing
- `__tests__/unit/lib/json.test.ts` - JSON parsing
- `__tests__/unit/lib/excel.test.ts` - Excel parsing
- `__tests__/unit/lib/detect.test.ts` - Format detection
- `__tests__/integration/api/convert.test.ts` - API integration
- `__tests__/e2e/convert.spec.ts` - E2E conversion

### Missing Tests:
- XML parsing edge cases
- SQL generation security
- Component unit tests
- Store tests
- Hook tests
- Error handling
- Edge cases for all parsers

---

## Checklist

### 4.1 Unit Tests - Converter Library
- [ ] Complete XML parser tests (`xml.test.ts`)
- [ ] Complete SQL generator tests (`sql.test.ts`)
- [ ] Add edge case tests for CSV parser
- [ ] Add edge case tests for JSON parser
- [ ] Add edge case tests for Excel parser
- [ ] Add detection edge case tests
- [ ] Add converter index tests

### 4.2 Unit Tests - Components
- [ ] FileUpload component tests
- [ ] DataPreview component tests
- [ ] ConvertButton component tests
- [ ] ConvertResult component tests
- [ ] ConvertOptions component tests
- [ ] FormatSelector component tests
- [ ] Header component tests
- [ ] LanguageSwitcher tests

### 4.3 Unit Tests - Hooks & Store
- [ ] useConverterStore tests
- [ ] use-toast hook tests
- [ ] Custom hooks tests

### 4.4 Integration Tests
- [ ] API /parse endpoint tests
- [ ] API /formats endpoint tests
- [ ] API /health endpoint tests
- [ ] Full conversion flow tests
- [ ] Error response tests

### 4.5 E2E Tests
- [ ] File upload flow
- [ ] URL import flow
- [ ] Batch conversion flow
- [ ] Transform page flow
- [ ] History page flow
- [ ] Language switching
- [ ] Theme switching
- [ ] Error handling flows
- [ ] Mobile responsive tests

### 4.6 Security Tests
- [ ] XXE attack prevention
- [ ] SQL injection prevention
- [ ] SSRF prevention
- [ ] File size limits
- [ ] Input validation

### 4.7 Accessibility Tests
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Focus management
- [ ] ARIA attributes

### 4.8 Performance Tests
- [ ] Large file handling
- [ ] Memory usage tests
- [ ] Render performance

---

## Detailed Implementation

### 4.1 XML Parser Tests

```typescript
// __tests__/unit/lib/xml.test.ts
import { parseXml, writeXml } from '@/lib/converter/xml';

describe('XML Parser', () => {
  describe('parseXml', () => {
    it('should parse simple XML', () => {
      const xml = `<?xml version="1.0"?>
        <root>
          <item><name>John</name><age>30</age></item>
          <item><name>Jane</name><age>25</age></item>
        </root>`;

      const result = parseXml(xml);

      expect(result.headers).toContain('name');
      expect(result.headers).toContain('age');
      expect(result.rows).toHaveLength(2);
    });

    it('should handle attributes', () => {
      const xml = `<root>
        <item id="1" name="John"/>
        <item id="2" name="Jane"/>
      </root>`;

      const result = parseXml(xml);

      expect(result.headers).toContain('@_id');
      expect(result.headers).toContain('@_name');
    });

    it('should handle nested structures', () => {
      const xml = `<root>
        <item>
          <info><name>John</name></info>
          <age>30</age>
        </item>
      </root>`;

      const result = parseXml(xml);

      expect(result.rows[0]).toHaveProperty('info.name', 'John');
    });

    it('should handle empty XML', () => {
      expect(() => parseXml('')).toThrow();
    });

    it('should handle malformed XML', () => {
      const malformed = '<root><unclosed>';
      expect(() => parseXml(malformed)).toThrow();
    });

    it('should handle XML with special characters', () => {
      const xml = `<root>
        <item><name>&lt;John&gt;</name></item>
      </root>`;

      const result = parseXml(xml);
      expect(result.rows[0].name).toBe('<John>');
    });

    it('should handle CDATA sections', () => {
      const xml = `<root>
        <item><data><![CDATA[Some <special> content]]></data></item>
      </root>`;

      const result = parseXml(xml);
      expect(result.rows[0].data).toBe('Some <special> content');
    });

    // Security tests
    it('should reject DOCTYPE declarations', () => {
      const xxe = `<?xml version="1.0"?>
        <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
        <root>&xxe;</root>`;

      expect(() => parseXml(xxe)).toThrow('DOCTYPE');
    });

    it('should reject external entities', () => {
      const xxe = `<?xml version="1.0"?>
        <!ENTITY xxe SYSTEM "http://evil.com/xxe">
        <root>&xxe;</root>`;

      expect(() => parseXml(xxe)).toThrow('Entity');
    });
  });

  describe('writeXml', () => {
    it('should generate valid XML', () => {
      const headers = ['name', 'age'];
      const rows = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];

      const xml = writeXml(headers, rows);

      expect(xml).toContain('<?xml');
      expect(xml).toContain('<name>John</name>');
      expect(xml).toContain('<age>30</age>');
    });

    it('should escape special characters', () => {
      const rows = [{ name: '<John>' }];
      const xml = writeXml(['name'], rows);

      expect(xml).toContain('&lt;John&gt;');
    });

    it('should handle null values', () => {
      const rows = [{ name: null, age: undefined }];
      const xml = writeXml(['name', 'age'], rows);

      expect(xml).toContain('<name></name>');
    });
  });
});
```

### 4.2 SQL Generator Tests

```typescript
// __tests__/unit/lib/sql.test.ts
import { writeSql } from '@/lib/converter/sql';

describe('SQL Generator', () => {
  describe('writeSql', () => {
    it('should generate INSERT statements', () => {
      const headers = ['name', 'age'];
      const rows = [{ name: 'John', age: 30 }];

      const sql = writeSql(headers, rows);

      expect(sql).toContain('INSERT INTO');
      expect(sql).toContain('VALUES');
    });

    it('should create table when includeCreate is true', () => {
      const sql = writeSql(['col1'], [{ col1: 'test' }], { includeCreate: true });

      expect(sql).toContain('CREATE TABLE');
    });

    it('should use custom table name', () => {
      const sql = writeSql(['col1'], [{ col1: 'test' }], { tableName: 'users' });

      expect(sql).toContain('users');
    });

    it('should batch inserts', () => {
      const rows = Array.from({ length: 10 }, (_, i) => ({ col1: `val${i}` }));
      const sql = writeSql(['col1'], rows, { batchSize: 3 });

      const insertCount = (sql.match(/INSERT INTO/g) || []).length;
      expect(insertCount).toBe(4); // 3 + 3 + 3 + 1
    });

    // Security tests
    describe('SQL Injection Prevention', () => {
      it('should escape single quotes in values', () => {
        const rows = [{ name: "O'Brien" }];
        const sql = writeSql(['name'], rows);

        expect(sql).toContain("O''Brien");
      });

      it('should quote identifiers with special characters', () => {
        const rows = [{ 'col name': 'value' }];
        const sql = writeSql(['col name'], rows);

        expect(sql).toMatch(/"col name"|`col name`/);
      });

      it('should handle table name injection attempts', () => {
        const sql = writeSql(['col'], [{ col: 'x' }], {
          tableName: 'users; DROP TABLE users;--'
        });

        expect(sql).not.toContain('DROP TABLE');
      });

      it('should handle column name injection attempts', () => {
        const sql = writeSql(['col"; DROP TABLE x;--'], [{ 'col"; DROP TABLE x;--': 'x' }]);

        expect(sql).not.toMatch(/DROP TABLE(?! x)/);
      });

      it('should escape backslashes in MySQL mode', () => {
        const rows = [{ path: 'C:\\Users\\test' }];
        const sql = writeSql(['path'], rows, { dialect: 'mysql' });

        expect(sql).toContain('C:\\\\Users\\\\test');
      });
    });

    describe('Dialect Support', () => {
      it('should use backticks for MySQL', () => {
        const sql = writeSql(['col'], [{ col: 'x' }], { dialect: 'mysql' });
        expect(sql).toContain('`col`');
      });

      it('should use double quotes for PostgreSQL', () => {
        const sql = writeSql(['col'], [{ col: 'x' }], { dialect: 'postgresql' });
        expect(sql).toContain('"col"');
      });
    });
  });
});
```

### 4.3 Component Tests

```typescript
// __tests__/unit/components/FileUpload.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from '@/components/converter/FileUpload';
import { useConverterStore } from '@/stores/converter-store';

// Mock the store
jest.mock('@/stores/converter-store', () => ({
  useConverterStore: jest.fn(),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('FileUpload', () => {
  const mockSetInputData = jest.fn();
  const mockSetParsedData = jest.fn();
  const mockSetIsParsing = jest.fn();
  const mockSetParseError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useConverterStore as jest.Mock).mockReturnValue({
      setInputData: mockSetInputData,
      setParsedData: mockSetParsedData,
      setIsParsing: mockSetIsParsing,
      setParseError: mockSetParseError,
      isParsing: false,
      parseError: null,
    });
  });

  it('should render file input', () => {
    render(<FileUpload />);
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
  });

  it('should accept CSV files', async () => {
    render(<FileUpload />);

    const file = new File(['name,age\nJohn,30'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/upload/i);

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(mockSetInputData).toHaveBeenCalled();
    });
  });

  it('should show error for invalid file type', async () => {
    render(<FileUpload />);

    const file = new File(['invalid'], 'test.exe', { type: 'application/x-msdownload' });
    const input = screen.getByLabelText(/upload/i);

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(mockSetParseError).toHaveBeenCalled();
    });
  });

  it('should handle drag and drop', async () => {
    render(<FileUpload />);

    const dropzone = screen.getByTestId('dropzone');
    const file = new File(['name,age'], 'test.csv', { type: 'text/csv' });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(mockSetInputData).toHaveBeenCalled();
    });
  });

  it('should show loading state while parsing', () => {
    (useConverterStore as jest.Mock).mockReturnValue({
      ...useConverterStore(),
      isParsing: true,
    });

    render(<FileUpload />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display parse errors', () => {
    (useConverterStore as jest.Mock).mockReturnValue({
      ...useConverterStore(),
      parseError: 'Failed to parse file',
    });

    render(<FileUpload />);

    expect(screen.getByText('Failed to parse file')).toBeInTheDocument();
  });
});

// __tests__/unit/components/DataPreview.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DataPreview } from '@/components/converter/DataPreview';
import { useConverterStore } from '@/stores/converter-store';

jest.mock('@/stores/converter-store');
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('DataPreview', () => {
  const mockData = {
    headers: ['name', 'age', 'city'],
    rows: [
      { name: 'John', age: 30, city: 'NYC' },
      { name: 'Jane', age: 25, city: 'LA' },
    ],
  };

  beforeEach(() => {
    (useConverterStore as jest.Mock).mockReturnValue({
      parsedData: mockData,
    });
  });

  it('should render table headers', () => {
    render(<DataPreview />);

    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('age')).toBeInTheDocument();
    expect(screen.getByText('city')).toBeInTheDocument();
  });

  it('should render table data', () => {
    render(<DataPreview />);

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('should sort by column when header clicked', () => {
    render(<DataPreview />);

    const nameHeader = screen.getByText('name');
    fireEvent.click(nameHeader);

    const rows = screen.getAllByRole('row');
    // First data row should be Jane (alphabetically first)
    expect(rows[1]).toHaveTextContent('Jane');
  });

  it('should reverse sort on second click', () => {
    render(<DataPreview />);

    const nameHeader = screen.getByText('name');
    fireEvent.click(nameHeader);
    fireEvent.click(nameHeader);

    const rows = screen.getAllByRole('row');
    // Should now be John first
    expect(rows[1]).toHaveTextContent('John');
  });

  it('should show row count', () => {
    render(<DataPreview />);

    expect(screen.getByText(/2 rows/i)).toBeInTheDocument();
  });

  it('should handle empty data', () => {
    (useConverterStore as jest.Mock).mockReturnValue({
      parsedData: null,
    });

    render(<DataPreview />);

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
```

### 4.4 Store Tests

```typescript
// __tests__/unit/stores/converter-store.test.ts
import { act, renderHook } from '@testing-library/react';
import { useConverterStore } from '@/stores/converter-store';

describe('useConverterStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useConverterStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('initial state', () => {
    it('should have null input data', () => {
      const { result } = renderHook(() => useConverterStore());
      expect(result.current.inputData).toBeNull();
    });

    it('should have json as default output format', () => {
      const { result } = renderHook(() => useConverterStore());
      expect(result.current.outputFormat).toBe('json');
    });

    it('should have default CSV options', () => {
      const { result } = renderHook(() => useConverterStore());
      expect(result.current.csvOptions.delimiter).toBe(',');
      expect(result.current.csvOptions.hasHeader).toBe(true);
    });
  });

  describe('setInputData', () => {
    it('should set input data', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setInputData('test data', 'test.csv', 100);
      });

      expect(result.current.inputData).toBe('test data');
      expect(result.current.fileName).toBe('test.csv');
      expect(result.current.fileSize).toBe(100);
    });

    it('should clear previous results', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setResult({ success: true, format: 'json', data: '{}' });
      });

      act(() => {
        result.current.setInputData('new data');
      });

      expect(result.current.result).toBeNull();
    });
  });

  describe('setOutputFormat', () => {
    it('should set output format', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setOutputFormat('xlsx');
      });

      expect(result.current.outputFormat).toBe('xlsx');
    });

    it('should clear result when format changes', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setResult({ success: true, format: 'json', data: '{}' });
        result.current.setOutputFormat('csv');
      });

      expect(result.current.result).toBeNull();
    });
  });

  describe('getConvertOptions', () => {
    it('should return all options', () => {
      const { result } = renderHook(() => useConverterStore());

      const options = result.current.getConvertOptions();

      expect(options).toHaveProperty('outputFormat');
      expect(options).toHaveProperty('csv');
      expect(options).toHaveProperty('json');
      expect(options).toHaveProperty('excel');
      expect(options).toHaveProperty('sql');
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      const { result } = renderHook(() => useConverterStore());

      act(() => {
        result.current.setInputData('data');
        result.current.setOutputFormat('xlsx');
        result.current.reset();
      });

      expect(result.current.inputData).toBeNull();
      expect(result.current.outputFormat).toBe('json');
    });
  });
});
```

### 4.5 E2E Tests

```typescript
// __tests__/e2e/upload.spec.ts
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('File Upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should upload CSV file', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('name,age\nJohn,30\nJane,25'),
    });

    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByText('John')).toBeVisible();
  });

  test('should upload JSON file', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: 'test.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify([{ name: 'John' }])),
    });

    await expect(page.locator('table')).toBeVisible();
  });

  test('should show error for invalid file', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('invalid content'),
    });

    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('should handle large files gracefully', async ({ page }) => {
    const largeData = 'name,age\n' + 'John,30\n'.repeat(10000);
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: 'large.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(largeData),
    });

    await expect(page.locator('table')).toBeVisible({ timeout: 30000 });
  });
});

// __tests__/e2e/conversion.spec.ts
test.describe('Conversion Flow', () => {
  test('should convert CSV to JSON', async ({ page }) => {
    await page.goto('/');

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('name,age\nJohn,30'),
    });

    // Select JSON output
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'JSON' }).click();

    // Convert
    await page.getByRole('button', { name: /convert/i }).click();

    // Verify result
    await expect(page.getByText('"name"')).toBeVisible();
    await expect(page.getByText('"John"')).toBeVisible();
  });

  test('should download converted file', async ({ page }) => {
    await page.goto('/');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('name,age\nJohn,30'),
    });

    await page.getByRole('button', { name: /convert/i }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /download/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });
});

// __tests__/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('should have no accessibility violations on home page', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Tab to upload button
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Continue tabbing through interactive elements
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('should support screen readers', async ({ page }) => {
    await page.goto('/');

    // Check for proper ARIA labels
    const uploadButton = page.getByRole('button', { name: /upload/i });
    await expect(uploadButton).toHaveAttribute('aria-label');
  });
});
```

---

## Test Configuration Updates

```typescript
// vitest.config.ts - Updated
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
    include: ['__tests__/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '.next/',
        'coverage/',
        '**/*.d.ts',
        '**/types/**',
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

// __tests__/setup.ts - Updated
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

---

## Files to Create

### New Test Files:
- `__tests__/unit/lib/xml.test.ts`
- `__tests__/unit/lib/sql.test.ts`
- `__tests__/unit/lib/validation.test.ts`
- `__tests__/unit/lib/errors.test.ts`
- `__tests__/unit/lib/timeout.test.ts`
- `__tests__/unit/components/FileUpload.test.tsx`
- `__tests__/unit/components/DataPreview.test.tsx`
- `__tests__/unit/components/ConvertButton.test.tsx`
- `__tests__/unit/components/ConvertResult.test.tsx`
- `__tests__/unit/components/ConvertOptions.test.tsx`
- `__tests__/unit/components/FormatSelector.test.tsx`
- `__tests__/unit/components/ErrorBoundary.test.tsx`
- `__tests__/unit/stores/converter-store.test.ts`
- `__tests__/unit/hooks/use-toast.test.ts`
- `__tests__/integration/api/parse.test.ts`
- `__tests__/integration/api/formats.test.ts`
- `__tests__/integration/api/health.test.ts`
- `__tests__/e2e/upload.spec.ts`
- `__tests__/e2e/batch.spec.ts`
- `__tests__/e2e/transform.spec.ts`
- `__tests__/e2e/history.spec.ts`
- `__tests__/e2e/language.spec.ts`
- `__tests__/e2e/theme.spec.ts`
- `__tests__/e2e/accessibility.spec.ts`
- `__tests__/security/xxe.test.ts`
- `__tests__/security/sql-injection.test.ts`
- `__tests__/security/ssrf.test.ts`
- `__tests__/performance/large-file.test.ts`
- `__tests__/performance/render.test.ts`

---

## Prompt for Claude Code

```
Execute Phase 4: Test Coverage Improvement for CSV-Excel-Converter

Read the plan at plans/04-phase-testing.md and implement all tests:

1. Unit tests for converter library:
   - Create __tests__/unit/lib/xml.test.ts with comprehensive XML tests
   - Create __tests__/unit/lib/sql.test.ts with SQL injection tests
   - Add edge case tests to existing test files

2. Component unit tests:
   - Create __tests__/unit/components/ directory
   - Add tests for FileUpload, DataPreview, ConvertButton, ConvertResult
   - Add tests for ConvertOptions, FormatSelector, ErrorBoundary
   - Mock dependencies properly (store, next-intl)

3. Store and hook tests:
   - Create __tests__/unit/stores/converter-store.test.ts
   - Create __tests__/unit/hooks/use-toast.test.ts
   - Test all actions and state transitions

4. Integration tests:
   - Create __tests__/integration/api/parse.test.ts
   - Create __tests__/integration/api/formats.test.ts
   - Create __tests__/integration/api/health.test.ts

5. E2E tests:
   - Create comprehensive E2E tests for all flows
   - Add accessibility tests with axe-core
   - Add mobile responsive tests

6. Security tests:
   - Create __tests__/security/ directory
   - Add XXE, SQL injection, SSRF prevention tests

7. Performance tests:
   - Create __tests__/performance/ directory
   - Add large file and render performance tests

8. Update test configuration:
   - Update vitest.config.ts with coverage thresholds
   - Update __tests__/setup.ts with proper mocks
   - Install @axe-core/playwright for a11y tests

Run all tests and ensure coverage meets thresholds:
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:coverage
```
