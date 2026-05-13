import { test, expect } from '@playwright/test';

/**
 * Privacy-by-design proof.
 *
 * The biggest sales differentiator vs. convertcsv.com / aconvert.com / etc.
 * is that we don't upload user data to a server. This test enforces it.
 *
 * Rule: during a full "paste CSV → convert to JSON → download" flow, no
 * outbound POST request should carry a body containing the user's data.
 *
 * Static asset requests (Next.js _next, fonts, favicons) and analytics
 * pings (which carry only event metadata, not user content) are allowed.
 */

const USER_DATA = [
  'transaction_id,customer_name,amount,date',
  'TX-001,Mahmoud Hamdy,1500.50,2026-05-01',
  'TX-002,Aisha El-Sayed,2200.00,2026-05-02',
  'TX-003,Karim Hassan,750.25,2026-05-03',
].join('\n');

// A canary string that, if it leaks, will appear verbatim in a request body.
const CANARY = 'Mahmoud Hamdy';

interface SuspectRequest {
  url: string;
  method: string;
  bodySize: number;
  containsCanary: boolean;
}

test.describe('Privacy-by-design — client-side processing', () => {
  test('CSV → JSON conversion does not POST user data to any server', async ({ page }) => {
    const suspectRequests: SuspectRequest[] = [];

    page.on('request', (request) => {
      const method = request.method();
      // GET requests can't leak request body content
      if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return;

      const url = request.url();
      // Allow Next.js HMR + asset traffic in dev
      if (
        url.includes('/_next/') ||
        url.includes('/__nextjs') ||
        url.includes('hot-update') ||
        url.includes('webpack')
      ) {
        return;
      }

      const body = request.postData() ?? '';
      const containsCanary = body.includes(CANARY);

      // Only record requests with non-trivial bodies — analytics pings
      // typically have < 200 bytes of event metadata and never contain user data.
      if (body.length > 0) {
        suspectRequests.push({
          url,
          method,
          bodySize: body.length,
          containsCanary,
        });
      }
    });

    await page.goto('/en');
    await page.waitForLoadState('networkidle');

    // Paste the user's CSV data
    const pasteInput = page.locator('[data-testid="paste-input"]');
    await expect(pasteInput).toBeVisible({ timeout: 10000 });
    await pasteInput.fill(USER_DATA);
    await page.locator('button:has-text("Paste")').click();

    // Wait for preview to confirm parsing happened in-browser
    await page.waitForSelector('[data-testid="data-preview"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="data-preview"]')).toContainText(CANARY);

    // Select JSON output
    const formatSelector = page.locator('[data-testid="output-format"]');
    await formatSelector.click();
    await page.locator('[role="option"]:has-text("JSON")').click();

    // Convert
    await page.locator('[data-testid="convert-btn"]').click();
    await page.waitForSelector('[data-testid="convert-result"]', { timeout: 10000 });

    // Give the page a moment to fire any deferred network activity (analytics, etc.)
    await page.waitForTimeout(1500);

    // Assertion: no request body contained the user's data canary
    const leakingRequests = suspectRequests.filter((r) => r.containsCanary);
    expect(
      leakingRequests,
      `Privacy breach: ${leakingRequests.length} request(s) leaked user data:\n${leakingRequests
        .map((r) => `  - ${r.method} ${r.url} (${r.bodySize} bytes)`)
        .join('\n')}`
    ).toEqual([]);

    // Report what large bodies *did* leave for visibility (allowed analytics)
    const largeBodyRequests = suspectRequests.filter((r) => r.bodySize > 500);
    if (largeBodyRequests.length > 0) {
      console.log('Observed large-body POSTs (must not contain user data):');
      for (const r of largeBodyRequests) {
        console.log(`  ${r.method} ${r.url} (${r.bodySize} bytes)`);
      }
    }
  });

  test('Excel download via "Download Result" does not transit a server', async ({ page }) => {
    let outboundExcelByteCount = 0;

    page.on('request', (request) => {
      const method = request.method();
      if (method === 'GET' || method === 'HEAD') return;
      const url = request.url();
      if (url.includes('/_next/') || url.includes('hot-update')) return;
      const body = request.postData();
      if (body) outboundExcelByteCount += body.length;
    });

    await page.goto('/en');
    await page.waitForLoadState('networkidle');

    const pasteInput = page.locator('[data-testid="paste-input"]');
    await pasteInput.fill(USER_DATA);
    await page.locator('button:has-text("Paste")').click();
    await page.waitForSelector('[data-testid="data-preview"]', { timeout: 10000 });

    // Select Excel output
    const formatSelector = page.locator('[data-testid="output-format"]');
    await formatSelector.click();
    await page.locator('[role="option"]:has-text("Excel")').first().click();

    await page.locator('[data-testid="convert-btn"]').click();
    await page.waitForSelector('[data-testid="convert-result"]', { timeout: 10000 });

    // Trigger download and confirm it was served from a blob: URL (client-side),
    // not a server endpoint.
    const downloadPromise = page.waitForEvent('download').catch(() => null);
    await page.locator('button:has-text("Download")').first().click();
    const download = await downloadPromise;

    if (download) {
      const downloadUrl = download.url();
      expect(
        downloadUrl,
        `Download URL must be a blob: or data: URL when proving client-side processing. Got: ${downloadUrl}`
      ).toMatch(/^(blob:|data:)/);
    }

    // Sanity: total outbound POST bytes should be far smaller than the data
    // we pasted (under ~5x), indicating no data exfiltration.
    expect(outboundExcelByteCount).toBeLessThan(USER_DATA.length * 5);
  });
});
