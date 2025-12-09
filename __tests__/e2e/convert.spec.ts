import { test, expect } from '@playwright/test';

test.describe('CSV/Excel Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en');
  });

  test('should show home page with upload dropzone', async ({ page }) => {
    await page.screenshot({ path: 'screenshots/01-home-en.png', fullPage: true });
    await expect(page.locator('[data-testid="upload-dropzone"]')).toBeVisible();
  });

  test('should paste CSV data and show preview', async ({ page }) => {
    const csvData = 'name,age,city\nJohn,30,NYC\nJane,25,LA';

    // Find and fill the paste input
    await page.fill('[data-testid="paste-input"]', csvData);
    await page.screenshot({ path: 'screenshots/02-csv-pasted.png' });

    // Click paste button
    await page.getByRole('button', { name: 'Paste' }).click();

    // Wait for preview
    await page.waitForSelector('[data-testid="data-preview"]');
    await page.screenshot({ path: 'screenshots/03-preview.png' });

    // Verify data is shown
    await expect(page.locator('[data-testid="data-preview"]')).toContainText('John');
  });

  test('should select output format', async ({ page }) => {
    // First load sample data
    await page.getByRole('button', { name: 'Load Sample' }).click();
    await page.waitForSelector('[data-testid="data-preview"]');

    // Select JSON output
    await page.click('[data-testid="output-format"]');
    await page.getByRole('option', { name: 'JSON' }).click();

    await page.screenshot({ path: 'screenshots/04-format-selected.png' });
  });

  test('should convert CSV to JSON', async ({ page }) => {
    // Load sample data
    await page.getByRole('button', { name: 'Load Sample' }).click();
    await page.waitForSelector('[data-testid="data-preview"]');

    // Select JSON output
    await page.click('[data-testid="output-format"]');
    await page.getByRole('option', { name: 'JSON' }).click();

    // Convert
    await page.click('[data-testid="convert-btn"]');

    // Wait for result
    await page.waitForSelector('[data-testid="convert-result"]');
    await page.screenshot({ path: 'screenshots/05-result.png' });

    // Verify result contains JSON
    await expect(page.locator('[data-testid="convert-result"]')).toBeVisible();
  });

  test('should toggle options panel', async ({ page }) => {
    // Load sample data
    await page.getByRole('button', { name: 'Load Sample' }).click();
    await page.waitForSelector('[data-testid="data-preview"]');

    // Toggle options
    await page.click('[data-testid="options-toggle"]');
    await page.screenshot({ path: 'screenshots/06-options.png' });
  });
});

test.describe('Pages Navigation', () => {
  test('should show batch page', async ({ page }) => {
    await page.goto('/en/batch');
    await page.screenshot({ path: 'screenshots/07-batch.png', fullPage: true });
    await expect(page.getByRole('heading', { name: 'Batch Conversion' })).toBeVisible();
  });

  test('should show transform page', async ({ page }) => {
    await page.goto('/en/transform');
    await page.screenshot({ path: 'screenshots/08-transform.png', fullPage: true });
    await expect(page.getByRole('heading', { name: 'Transform Data' })).toBeVisible();
  });

  test('should show API docs page', async ({ page }) => {
    await page.goto('/en/api-docs');
    await page.screenshot({ path: 'screenshots/09-api-docs.png', fullPage: true });
    await expect(page.getByRole('heading', { name: 'API Documentation' })).toBeVisible();
  });

  test('should show history page', async ({ page }) => {
    await page.goto('/en/history');
    await page.screenshot({ path: 'screenshots/10-history.png', fullPage: true });
    await expect(page.getByRole('heading', { name: 'Conversion History' })).toBeVisible();
  });
});

test.describe('Internationalization', () => {
  test('Arabic page with RTL', async ({ page }) => {
    await page.goto('/ar');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(html).toHaveAttribute('lang', 'ar');

    await page.screenshot({ path: 'screenshots/11-home-ar.png', fullPage: true });
  });

  test('Arabic API docs', async ({ page }) => {
    await page.goto('/ar/api-docs');
    await page.screenshot({ path: 'screenshots/12-api-docs-ar.png', fullPage: true });
  });
});

test.describe('Responsive Design', () => {
  test('Mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/en');
    await page.screenshot({ path: 'screenshots/13-mobile.png', fullPage: true });
  });

  test('Tablet layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/en');
    await page.screenshot({ path: 'screenshots/14-tablet.png', fullPage: true });
  });

  test('Desktop layout', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/en');
    await page.screenshot({ path: 'screenshots/15-desktop.png', fullPage: true });
  });
});
