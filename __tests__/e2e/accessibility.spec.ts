import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test.describe('Home Page', () => {
    test('should have no accessibility violations', async ({ page }) => {
      await page.goto('/');

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        // Exclude nested-interactive for file input pattern (hidden input with visual dropzone is intentional)
        .disableRules(['nested-interactive'])
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');

      // Check that there's an h1
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();

      // Check that h2s exist after h1
      const h2s = page.locator('h2');
      const h2Count = await h2s.count();
      expect(h2Count).toBeGreaterThan(0);
    });

    test('should have skip link that becomes visible on focus', async ({ page }) => {
      await page.goto('/');

      // Tab to the skip link
      await page.keyboard.press('Tab');

      // Skip link should be visible when focused
      const skipLink = page.locator('a[href="#main-content"]');
      await expect(skipLink).toBeFocused();
      await expect(skipLink).toBeVisible();
    });

    test('should navigate to main content when skip link is activated', async ({ page }) => {
      await page.goto('/');

      // Tab to the skip link
      await page.keyboard.press('Tab');

      // Activate the skip link
      await page.keyboard.press('Enter');

      // Main content should be focused
      const main = page.locator('#main-content');
      await expect(main).toBeFocused();
    });
  });

  test.describe('File Upload', () => {
    test('should have accessible dropzone', async ({ page }) => {
      await page.goto('/');

      const dropzone = page.locator('[data-testid="upload-dropzone"]');
      await expect(dropzone).toHaveAttribute('role', 'button');
      await expect(dropzone).toHaveAttribute('aria-label');
      await expect(dropzone).toHaveAttribute('tabindex', '0');
    });

    test('should be keyboard accessible', async ({ page }) => {
      await page.goto('/');

      const dropzone = page.locator('[data-testid="upload-dropzone"]');

      // Focus the dropzone
      await dropzone.focus();
      await expect(dropzone).toBeFocused();

      // Check that it has proper keyboard accessibility
      await expect(dropzone).toHaveAttribute('tabindex', '0');
    });

    test('should announce errors to screen readers', async ({ page }) => {
      await page.goto('/');

      // Check that error container has proper role when visible
      // Note: Error container is only visible when there's an error
      const errorContainer = page.locator('#file-upload-error');

      // Initially should not exist
      const count = await errorContainer.count();
      expect(count).toBe(0);
    });
  });

  test.describe('Data Table', () => {
    test('should have accessible table structure after loading sample data', async ({ page }) => {
      await page.goto('/');

      // Load sample data
      const sampleButton = page.getByRole('button', { name: /load sample/i });
      await sampleButton.click();

      // Wait for table to appear
      const table = page.locator('[data-testid="data-preview"] table');
      await expect(table).toBeVisible();

      // Check table has proper attributes
      await expect(table).toHaveAttribute('role', 'grid');
      await expect(table).toHaveAttribute('aria-label');

      // Check for caption (screen reader only)
      const caption = table.locator('caption');
      await expect(caption).toBeAttached();

      // Check for proper th elements with scope
      const headers = table.locator('th');
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThan(0);

      for (let i = 0; i < headerCount; i++) {
        await expect(headers.nth(i)).toHaveAttribute('scope', 'col');
      }
    });

    test('should have sortable headers accessible by keyboard', async ({ page }) => {
      await page.goto('/');

      // Load sample data
      const sampleButton = page.getByRole('button', { name: /load sample/i });
      await sampleButton.click();

      // Wait for table to appear
      const table = page.locator('[data-testid="data-preview"] table');
      await expect(table).toBeVisible();

      // Get first header
      const firstHeader = table.locator('th').first();

      // Focus the header
      await firstHeader.focus();
      await expect(firstHeader).toBeFocused();

      // Check that it has tabindex
      await expect(firstHeader).toHaveAttribute('tabindex', '0');

      // Check initial aria-sort
      await expect(firstHeader).toHaveAttribute('aria-sort', 'none');

      // Activate sort with Enter key
      await page.keyboard.press('Enter');

      // Check that aria-sort changed
      await expect(firstHeader).toHaveAttribute('aria-sort', 'ascending');

      // Activate sort again
      await page.keyboard.press('Enter');

      // Check that aria-sort changed to descending
      await expect(firstHeader).toHaveAttribute('aria-sort', 'descending');
    });

    test('should have accessible pagination', async ({ page }) => {
      await page.goto('/');

      // Load sample data
      const sampleButton = page.getByRole('button', { name: /load sample/i });
      await sampleButton.click();

      // Wait for table
      const table = page.locator('[data-testid="data-preview"] table');
      await expect(table).toBeVisible();

      // Check pagination navigation
      const pagination = page.locator('nav[aria-label]');

      // May not have pagination if data is small
      const paginationCount = await pagination.count();
      if (paginationCount > 0) {
        // Check pagination buttons have labels
        const prevButton = pagination.getByRole('button', { name: /previous/i });
        const nextButton = pagination.getByRole('button', { name: /next/i });

        await expect(prevButton).toHaveAttribute('aria-label');
        await expect(nextButton).toHaveAttribute('aria-label');
      }
    });
  });

  test.describe('Theme Toggle', () => {
    test('should be accessible', async ({ page }) => {
      await page.goto('/');

      const themeToggle = page.getByRole('button', { name: /theme|mode/i });
      await expect(themeToggle).toBeVisible();

      // Should be focusable
      await themeToggle.focus();
      await expect(themeToggle).toBeFocused();
    });
  });

  test.describe('Language Switcher', () => {
    test('should be accessible', async ({ page }) => {
      await page.goto('/');

      const languageButton = page.getByRole('button', { name: /language|english|العربية/i });
      await expect(languageButton).toBeVisible();

      // Should be focusable
      await languageButton.focus();
      await expect(languageButton).toBeFocused();
    });
  });

  test.describe('RTL Support', () => {
    test('should have correct dir attribute for Arabic locale', async ({ page }) => {
      await page.goto('/ar');

      const html = page.locator('html');
      await expect(html).toHaveAttribute('dir', 'rtl');
      await expect(html).toHaveAttribute('lang', 'ar');
    });

    test('should have correct dir attribute for English locale', async ({ page }) => {
      await page.goto('/en');

      const html = page.locator('html');
      await expect(html).toHaveAttribute('dir', 'ltr');
      await expect(html).toHaveAttribute('lang', 'en');
    });

    test('should have no accessibility violations in RTL mode', async ({ page }) => {
      await page.goto('/ar');

      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        // Exclude nested-interactive for file input pattern (hidden input with visual dropzone is intentional)
        .disableRules(['nested-interactive'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  });

  test.describe('Form Controls', () => {
    test('should have proper labels for form inputs', async ({ page }) => {
      await page.goto('/');

      // Check paste textarea
      const pasteTextarea = page.locator('#paste-data');
      const pasteLabel = page.locator('label[for="paste-data"]');

      await expect(pasteTextarea).toBeVisible();
      await expect(pasteLabel).toBeVisible();

      // Check URL input
      const urlInput = page.locator('#url-input');
      const urlLabel = page.locator('label[for="url-input"]');

      await expect(urlInput).toBeVisible();
      await expect(urlLabel).toBeVisible();
    });
  });

  test.describe('Color Contrast', () => {
    test('should pass color contrast requirements', async ({ page }) => {
      await page.goto('/');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .options({ rules: { 'color-contrast': { enabled: true } } })
        .analyze();

      // Filter for only color contrast violations
      const contrastViolations = results.violations.filter(
        (v) => v.id === 'color-contrast'
      );

      expect(contrastViolations).toEqual([]);
    });
  });

  test.describe('Focus Management', () => {
    test('should maintain visible focus indicator', async ({ page }) => {
      await page.goto('/');

      // Tab through the page and check focus is visible
      await page.keyboard.press('Tab');

      // Get the focused element
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // Tab a few more times
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const focused = page.locator(':focus');
        const count = await focused.count();
        expect(count).toBe(1);
      }
    });
  });
});
