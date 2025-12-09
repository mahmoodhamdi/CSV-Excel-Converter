import { test, expect } from '@playwright/test';

test.describe('CSV/Excel Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
  });

  test('should show home page with upload dropzone', async ({ page }) => {
    await page.screenshot({ path: 'screenshots/01-home-en.png', fullPage: true });
    await expect(page.locator('[data-testid="upload-dropzone"]')).toBeVisible({ timeout: 10000 });
  });

  test('should paste CSV data and show preview', async ({ page }) => {
    const csvData = 'name,age,city\nJohn,30,NYC\nJane,25,LA';

    // Find and fill the paste input
    const pasteInput = page.locator('[data-testid="paste-input"]');
    await expect(pasteInput).toBeVisible({ timeout: 10000 });
    await pasteInput.fill(csvData);
    await page.screenshot({ path: 'screenshots/02-csv-pasted.png' });

    // Click paste button - use text that matches the translation
    await page.locator('button:has-text("Paste")').click();

    // Wait for preview
    await page.waitForSelector('[data-testid="data-preview"]', { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/03-preview.png' });

    // Verify data is shown
    await expect(page.locator('[data-testid="data-preview"]')).toContainText('John');
  });

  test('should load sample data and show preview', async ({ page }) => {
    // Click Load Sample button
    await page.locator('button:has-text("Load Sample")').click();

    // Wait for data preview to appear with data
    await page.waitForSelector('[data-testid="data-preview"] table', { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/04-sample-loaded.png' });

    // Verify sample data is shown
    await expect(page.locator('[data-testid="data-preview"]')).toContainText('John Doe');
  });

  test('should convert CSV to JSON', async ({ page }) => {
    // Load sample data
    await page.locator('button:has-text("Load Sample")').click();
    await page.waitForSelector('[data-testid="data-preview"] table', { timeout: 10000 });

    // Select JSON output using the format selector
    const formatSelector = page.locator('[data-testid="output-format"]');
    await expect(formatSelector).toBeVisible({ timeout: 10000 });
    await formatSelector.click();
    await page.locator('[role="option"]:has-text("JSON")').click();

    // Convert
    await page.locator('[data-testid="convert-btn"]').click();

    // Wait for result
    await page.waitForSelector('[data-testid="convert-result"]', { timeout: 10000 });
    await page.screenshot({ path: 'screenshots/05-result.png' });

    // Verify result contains JSON
    await expect(page.locator('[data-testid="convert-result"]')).toBeVisible();
  });

  test('should toggle options panel', async ({ page }) => {
    // Load sample data first
    await page.locator('button:has-text("Load Sample")').click();
    await page.waitForSelector('[data-testid="data-preview"] table', { timeout: 10000 });

    // Toggle options
    const optionsToggle = page.locator('[data-testid="options-toggle"]');
    await expect(optionsToggle).toBeVisible({ timeout: 10000 });
    await optionsToggle.click();
    await page.screenshot({ path: 'screenshots/06-options.png' });
  });
});

test.describe('Pages Navigation', () => {
  test('should show batch page', async ({ page }) => {
    await page.goto('/en/batch');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/07-batch.png', fullPage: true });
    await expect(page.locator('h1:has-text("Batch Conversion")')).toBeVisible({ timeout: 10000 });
  });

  test('should show transform page', async ({ page }) => {
    await page.goto('/en/transform');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/08-transform.png', fullPage: true });
    await expect(page.locator('h1:has-text("Transform Data")')).toBeVisible({ timeout: 10000 });
  });

  test('should show API docs page', async ({ page }) => {
    await page.goto('/en/api-docs');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/09-api-docs.png', fullPage: true });
    await expect(page.locator('h1:has-text("API Documentation")')).toBeVisible({ timeout: 10000 });
  });

  test('should show history page', async ({ page }) => {
    await page.goto('/en/history');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/10-history.png', fullPage: true });
    await expect(page.locator('h1:has-text("Conversion History")')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Internationalization', () => {
  test('Arabic page with RTL', async ({ page }) => {
    await page.goto('/ar');
    await page.waitForLoadState('networkidle');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl', { timeout: 10000 });
    await expect(html).toHaveAttribute('lang', 'ar', { timeout: 10000 });

    await page.screenshot({ path: 'screenshots/11-home-ar.png', fullPage: true });
  });

  test('Arabic API docs', async ({ page }) => {
    await page.goto('/ar/api-docs');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/12-api-docs-ar.png', fullPage: true });
  });
});

test.describe('Responsive Design', () => {
  test('Mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/13-mobile.png', fullPage: true });
  });

  test('Tablet layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/14-tablet.png', fullPage: true });
  });

  test('Desktop layout', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/15-desktop.png', fullPage: true });
  });
});
