# Phase 5: Accessibility & UX Improvements

## Priority: MEDIUM
## Estimated Effort: Medium
## Dependencies: Phase 1, Phase 2, Phase 3

---

## Overview

This phase improves accessibility to meet WCAG 2.1 AA standards and enhances overall user experience with better feedback, keyboard navigation, and screen reader support.

---

## Checklist

### 5.1 Semantic HTML
- [ ] Add proper heading hierarchy (h1, h2, h3)
- [ ] Use semantic elements (main, nav, section, article)
- [ ] Add proper table markup (thead, tbody, th with scope)
- [ ] Add landmark roles where needed

### 5.2 Keyboard Navigation
- [ ] Ensure all interactive elements are focusable
- [ ] Add visible focus indicators
- [ ] Implement skip links
- [ ] Add keyboard shortcuts for common actions
- [ ] Ensure logical tab order

### 5.3 ARIA Attributes
- [ ] Add aria-label to icon buttons
- [ ] Add aria-describedby for form inputs
- [ ] Add aria-live regions for dynamic content
- [ ] Add aria-busy for loading states
- [ ] Add aria-invalid for validation errors

### 5.4 Screen Reader Support
- [ ] Add sr-only text for visual-only content
- [ ] Announce status changes
- [ ] Provide context for data tables
- [ ] Add alt text for any images

### 5.5 Color & Contrast
- [ ] Verify contrast ratios (4.5:1 for text)
- [ ] Don't rely solely on color for information
- [ ] Add focus visible styles
- [ ] Test with color blindness simulators

### 5.6 Form Accessibility
- [ ] Associate labels with inputs
- [ ] Add error messages linked to inputs
- [ ] Group related form fields
- [ ] Add autocomplete attributes

### 5.7 Loading & Error States
- [ ] Add loading announcements
- [ ] Improve error message clarity
- [ ] Add success confirmations
- [ ] Show progress for long operations

### 5.8 RTL Support
- [ ] Verify all components work in RTL
- [ ] Fix icon directions in RTL
- [ ] Test Arabic translations

---

## Detailed Implementation

### 5.1 Skip Links

```typescript
// src/components/layout/SkipLink.tsx
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:rounded focus:ring-2 focus:ring-ring"
    >
      Skip to main content
    </a>
  );
}

// Usage in layout
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SkipLink />
        <Header />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
```

### 5.2 Accessible Data Table

```typescript
// src/components/converter/AccessibleDataPreview.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useConverterStore } from '@/stores/converter-store';
import { useId } from 'react';

export function AccessibleDataPreview() {
  const t = useTranslations('preview');
  const parsedData = useConverterStore((state) => state.parsedData);
  const tableId = useId();
  const captionId = useId();

  if (!parsedData) return null;

  const { headers, rows } = parsedData;

  return (
    <div role="region" aria-labelledby={captionId}>
      <table
        id={tableId}
        className="w-full border-collapse"
        aria-describedby={captionId}
      >
        <caption id={captionId} className="sr-only">
          {t('tableCaption', { rows: rows.length, columns: headers.length })}
        </caption>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={header}
                scope="col"
                className="px-3 py-2 text-left bg-muted font-medium"
                aria-sort={sortColumn === header ? sortDirection : undefined}
              >
                <button
                  onClick={() => handleSort(header)}
                  className="flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-ring rounded"
                  aria-label={t('sortBy', { column: header })}
                >
                  {header}
                  {sortColumn === header && (
                    <span aria-hidden="true">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, displayCount).map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/50'}
            >
              {headers.map((header) => (
                <td key={header} className="px-3 py-2">
                  {String(row[header] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length > displayCount && (
        <p className="text-center py-2 text-muted-foreground" role="status">
          {t('showingRows', { shown: displayCount, total: rows.length })}
        </p>
      )}
    </div>
  );
}
```

### 5.3 Accessible File Upload

```typescript
// src/components/converter/AccessibleFileUpload.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useId, useRef, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

export function AccessibleFileUpload() {
  const t = useTranslations('upload');
  const inputId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const statusId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {t('label')}
      </label>

      <p id={descriptionId} className="text-sm text-muted-foreground">
        {t('supportedFormats')}: CSV, JSON, Excel, XML, TSV
      </p>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors focus:outline-none focus:ring-2 focus:ring-ring
          ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${error ? 'border-destructive' : ''}
        `}
        aria-describedby={`${descriptionId} ${error ? errorId : ''}`}
        aria-invalid={!!error}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <p className="mt-2">{t('dragDropOrClick')}</p>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".csv,.tsv,.json,.xlsx,.xls,.xml"
          onChange={handleFileChange}
          className="sr-only"
          aria-describedby={descriptionId}
        />
      </div>

      {error && (
        <p id={errorId} className="text-sm text-destructive flex items-center gap-1" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
      )}

      {/* Live region for status updates */}
      <div
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {status}
      </div>
    </div>
  );
}
```

### 5.4 Accessible Buttons with Icons

```typescript
// src/components/ui/icon-button.tsx
import { Button, ButtonProps } from './button';
import { forwardRef } from 'react';

interface IconButtonProps extends ButtonProps {
  icon: React.ReactNode;
  label: string;
  showLabel?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, showLabel = false, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={className}
        aria-label={!showLabel ? label : undefined}
        {...props}
      >
        <span aria-hidden="true">{icon}</span>
        {showLabel ? (
          <span className="ml-2">{label}</span>
        ) : (
          <span className="sr-only">{label}</span>
        )}
      </Button>
    );
  }
);
IconButton.displayName = 'IconButton';
```

### 5.5 Form with Proper Accessibility

```typescript
// src/components/converter/AccessibleConvertOptions.tsx
'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export function AccessibleConvertOptions() {
  const t = useTranslations('options');
  const tableNameId = useId();
  const tableNameErrorId = useId();
  const tableNameDescId = useId();

  const [tableName, setTableName] = useState('my_table');
  const [error, setError] = useState<string | null>(null);

  const validateTableName = (value: string) => {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
      setError(t('invalidTableName'));
      return false;
    }
    setError(null);
    return true;
  };

  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-semibold">{t('sqlOptions')}</legend>

      <div className="space-y-2">
        <Label htmlFor={tableNameId}>{t('tableName')}</Label>
        <Input
          id={tableNameId}
          value={tableName}
          onChange={(e) => {
            setTableName(e.target.value);
            validateTableName(e.target.value);
          }}
          aria-describedby={`${tableNameDescId} ${error ? tableNameErrorId : ''}`}
          aria-invalid={!!error}
          autoComplete="off"
        />
        <p id={tableNameDescId} className="text-sm text-muted-foreground">
          {t('tableNameHint')}
        </p>
        {error && (
          <p id={tableNameErrorId} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="include-create"
          onCheckedChange={(checked) => setIncludeCreate(!!checked)}
        />
        <Label htmlFor="include-create">{t('includeCreateTable')}</Label>
      </div>
    </fieldset>
  );
}
```

### 5.6 Loading and Status Announcements

```typescript
// src/components/converter/ConversionStatus.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useConverterStore } from '@/stores/converter-store';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export function ConversionStatus() {
  const t = useTranslations('status');
  const { isParsing, isConverting, parseError, convertError, result } = useConverterStore();
  const announcementRef = useRef<HTMLDivElement>(null);

  // Announce status changes
  useEffect(() => {
    if (isParsing) {
      announce(t('parsing'));
    } else if (isConverting) {
      announce(t('converting'));
    } else if (result?.success) {
      announce(t('conversionComplete'));
    } else if (parseError || convertError) {
      announce(t('error', { message: parseError || convertError }));
    }
  }, [isParsing, isConverting, result, parseError, convertError]);

  const announce = (message: string) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
    }
  };

  return (
    <>
      {/* Live region for announcements */}
      <div
        ref={announcementRef}
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Visual status indicator */}
      {(isParsing || isConverting) && (
        <div className="flex items-center gap-2 text-muted-foreground" aria-hidden="true">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{isParsing ? t('parsing') : t('converting')}</span>
        </div>
      )}

      {result?.success && (
        <div className="flex items-center gap-2 text-green-600" aria-hidden="true">
          <CheckCircle className="h-4 w-4" />
          <span>{t('conversionComplete')}</span>
        </div>
      )}

      {(parseError || convertError) && (
        <div className="flex items-center gap-2 text-destructive" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <span>{parseError || convertError}</span>
        </div>
      )}
    </>
  );
}
```

### 5.7 Focus Management

```typescript
// src/hooks/use-focus-trap.ts
import { useEffect, useRef } from 'react';

export function useFocusTrap<T extends HTMLElement>(isActive: boolean) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element on mount
    firstElement?.focus();

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}

// src/hooks/use-focus-return.ts
import { useEffect, useRef } from 'react';

export function useFocusReturn(isOpen: boolean) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);
}
```

### 5.8 RTL Fixes

```typescript
// src/components/layout/Header.tsx - RTL aware
'use client';

import { useLocale } from 'next-intl';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';

export function Header() {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  // Use correct chevron direction for RTL
  const BackIcon = isRTL ? ChevronRight : ChevronLeft;
  const ForwardIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <header className="border-b" dir={isRTL ? 'rtl' : 'ltr'}>
      <nav className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-semibold">CSV Converter</span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}

// src/styles/rtl.css
[dir="rtl"] .space-x-2 > * + * {
  margin-left: 0;
  margin-right: 0.5rem;
}

[dir="rtl"] .text-left {
  text-align: right;
}

[dir="rtl"] .ml-2 {
  margin-left: 0;
  margin-right: 0.5rem;
}
```

---

## Translation Updates

```json
// src/messages/en.json - Add accessibility strings
{
  "preview": {
    "tableCaption": "Data preview with {rows} rows and {columns} columns",
    "sortBy": "Sort by {column}",
    "showingRows": "Showing {shown} of {total} rows"
  },
  "upload": {
    "label": "Upload file",
    "supportedFormats": "Supported formats",
    "dragDropOrClick": "Drag and drop a file here, or click to browse"
  },
  "status": {
    "parsing": "Parsing file...",
    "converting": "Converting data...",
    "conversionComplete": "Conversion complete",
    "error": "Error: {message}"
  },
  "options": {
    "sqlOptions": "SQL Options",
    "tableName": "Table Name",
    "tableNameHint": "Must start with a letter or underscore",
    "invalidTableName": "Table name must start with a letter or underscore and contain only letters, numbers, and underscores",
    "includeCreateTable": "Include CREATE TABLE statement"
  }
}
```

---

## Testing

```typescript
// __tests__/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('home page should have no WCAG violations', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('should be fully keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Press Tab and verify focus moves to first interactive element
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();

    // Press Tab again
    await page.keyboard.press('Tab');
    const firstButton = page.locator('button').first();
    await expect(firstButton).toBeFocused();
  });

  test('skip link should work', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    const main = page.locator('#main-content');
    await expect(main).toBeFocused();
  });

  test('form errors should be announced', async ({ page }) => {
    await page.goto('/');

    // Trigger an error
    // ...

    // Verify error is in live region
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
  });

  test('should work in RTL mode', async ({ page }) => {
    await page.goto('/ar');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');

    // Verify layout is correct
    const header = page.locator('header');
    await expect(header).toHaveAttribute('dir', 'rtl');
  });
});
```

---

## Files to Create/Modify

### New Files:
- `src/components/layout/SkipLink.tsx`
- `src/components/ui/icon-button.tsx`
- `src/components/converter/ConversionStatus.tsx`
- `src/hooks/use-focus-trap.ts`
- `src/hooks/use-focus-return.ts`
- `src/styles/rtl.css`

### Modified Files:
- `src/app/[locale]/layout.tsx` - Add skip link, landmark roles
- `src/components/converter/DataPreview.tsx` - Add table accessibility
- `src/components/converter/FileUpload.tsx` - Add keyboard support, ARIA
- `src/components/converter/ConvertOptions.tsx` - Add form accessibility
- `src/components/converter/ConvertButton.tsx` - Add aria-label
- `src/components/converter/ConvertResult.tsx` - Add status announcements
- `src/components/layout/Header.tsx` - Add RTL support
- `src/messages/en.json` - Add accessibility strings
- `src/messages/ar.json` - Add Arabic accessibility strings

---

## Prompt for Claude Code

```
Execute Phase 5: Accessibility & UX Improvements for CSV-Excel-Converter

Read the plan at plans/05-phase-accessibility.md and implement:

1. Add skip links:
   - Create src/components/layout/SkipLink.tsx
   - Add to layout with proper styling

2. Make data table accessible:
   - Add proper thead/tbody/th with scope
   - Add table caption (sr-only)
   - Add aria-sort for sortable columns
   - Add keyboard navigation

3. Make file upload accessible:
   - Add proper label association
   - Add keyboard support (Enter/Space to open)
   - Add aria-describedby for instructions
   - Add aria-invalid for errors
   - Add live region for status updates

4. Create icon button component:
   - Add sr-only text for screen readers
   - Support showLabel prop

5. Add status announcements:
   - Create ConversionStatus component
   - Add live regions for status changes
   - Announce parsing, converting, complete, errors

6. Add focus management hooks:
   - Create use-focus-trap.ts
   - Create use-focus-return.ts

7. Fix RTL support:
   - Create src/styles/rtl.css
   - Fix icon directions in Header
   - Test Arabic layout

8. Update translations:
   - Add accessibility strings to en.json
   - Add accessibility strings to ar.json

9. Add accessibility tests:
   - Install @axe-core/playwright
   - Create comprehensive a11y tests

Run accessibility tests to verify compliance.
```
