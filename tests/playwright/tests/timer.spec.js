// @ts-check
const { test, expect } = require('@playwright/test');

const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 568 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1024', width: 1024, height: 768 },
  { name: 'wide-2560', width: 2560, height: 1440 },
];

const COLOR_SCHEMES = ['light', 'dark'];

/**
 * Wait for Blazor to finish loading (loading spinner gone, timer page visible).
 */
async function waitForBlazor(page) {
  // Wait for the loading progress to disappear
  await page.waitForSelector('.loading-progress', { state: 'hidden', timeout: 20000 });
  // Wait for the timer page to appear
  await page.waitForSelector('.timer-page', { timeout: 10000 });
  // Small buffer for any animations/transitions to settle
  await page.waitForTimeout(500);
}

// ─── Visual snapshots ─────────────────────────────────────────────────────────

for (const scheme of COLOR_SCHEMES) {
  for (const vp of VIEWPORTS) {
    test(`visual: ${vp.name} ${scheme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/timer-app/');
      await waitForBlazor(page);

      await page.screenshot({
        path: `screenshots/${vp.name}-${scheme}.png`,
        fullPage: false,
      });

      // App shell rendered
      await expect(page.locator('.timer-page')).toBeVisible();
      await expect(page.locator('.time-display')).toBeVisible();
      await expect(page.locator('.timer-wheel')).toBeVisible();
      await expect(page.locator('.control-buttons')).toBeVisible();
    });
  }
}

// ─── Initial state ────────────────────────────────────────────────────────────

test('initial state: shows 00:00', async ({ page }) => {
  await page.goto('/timer-app/');
  await waitForBlazor(page);

  const display = page.locator('.time-display');
  await expect(display).toBeVisible();
  const text = await display.textContent();
  expect(text).toMatch(/0\s*min|0:00|00:00/);
});

test('initial state: Start button is disabled', async ({ page }) => {
  await page.goto('/timer-app/');
  await waitForBlazor(page);

  const startBtn = page.locator('button', { hasText: /start/i });
  await expect(startBtn).toBeDisabled();
});

test('initial state: SVG wheel is rendered', async ({ page }) => {
  await page.goto('/timer-app/');
  await waitForBlazor(page);

  const svg = page.locator('.timer-wheel');
  await expect(svg).toBeVisible();
});

// ─── +1 / -1 minute buttons ───────────────────────────────────────────────────

test('plus-one button increments time by 1 minute', async ({ page }) => {
  await page.goto('/timer-app/');
  await waitForBlazor(page);

  const plusBtn = page.locator('button[aria-label="+1 minute"], button', { hasText: '+1' });
  await plusBtn.first().click();

  const display = page.locator('.time-display');
  const text = await display.textContent();
  expect(text).toMatch(/1\s*min|1:00|01:00/);
});

test('minus-one button is disabled at zero', async ({ page }) => {
  await page.goto('/timer-app/');
  await waitForBlazor(page);

  const minusBtn = page.locator('button[aria-label="-1 minute"], button', { hasText: '-1' });
  await expect(minusBtn.first()).toBeDisabled();
});

test('plus-one then minus-one returns to 0', async ({ page }) => {
  await page.goto('/timer-app/');
  await waitForBlazor(page);

  const plusBtn = page.locator('button[aria-label="+1 minute"], button', { hasText: '+1' });
  const minusBtn = page.locator('button[aria-label="-1 minute"], button', { hasText: '-1' });

  await plusBtn.first().click();
  await minusBtn.first().click();

  const display = page.locator('.time-display');
  const text = await display.textContent();
  expect(text).toMatch(/0\s*min|0:00|00:00/);
});

// ─── Timer start / pause / reset ─────────────────────────────────────────────

test('Start button enables after setting time', async ({ page }) => {
  await page.goto('/timer-app/');
  await waitForBlazor(page);

  const plusBtn = page.locator('button[aria-label="+1 minute"], button', { hasText: '+1' });
  await plusBtn.first().click();

  const startBtn = page.locator('button', { hasText: /start/i });
  await expect(startBtn).toBeEnabled();
});

test('clicking Start transitions to running state', async ({ page }) => {
  await page.goto('/timer-app/');
  await waitForBlazor(page);

  // Set 5 minutes
  const plusBtn = page.locator('button[aria-label="+1 minute"], button', { hasText: '+1' });
  for (let i = 0; i < 5; i++) await plusBtn.first().click();

  const startBtn = page.locator('button', { hasText: /start/i });
  await startBtn.click();

  // Pause button should now be visible
  const pauseBtn = page.locator('button', { hasText: /pause/i });
  await expect(pauseBtn).toBeVisible();
});

test('clicking Pause shows Resume button', async ({ page }) => {
  await page.goto('/timer-app/');
  await waitForBlazor(page);

  const plusBtn = page.locator('button[aria-label="+1 minute"], button', { hasText: '+1' });
  for (let i = 0; i < 5; i++) await plusBtn.first().click();

  await page.locator('button', { hasText: /start/i }).click();
  await page.locator('button', { hasText: /pause/i }).click();

  const resumeBtn = page.locator('button', { hasText: /resume/i });
  await expect(resumeBtn).toBeVisible();
});

test('Reset returns to idle state', async ({ page }) => {
  await page.goto('/timer-app/');
  await waitForBlazor(page);

  const plusBtn = page.locator('button[aria-label="+1 minute"], button', { hasText: '+1' });
  for (let i = 0; i < 5; i++) await plusBtn.first().click();

  await page.locator('button', { hasText: /start/i }).click();
  await page.locator('button', { hasText: /pause/i }).click();
  await page.locator('button', { hasText: /reset/i }).click();

  // Start should be disabled again
  const startBtn = page.locator('button', { hasText: /start/i });
  await expect(startBtn).toBeDisabled();
});

// ─── Accessibility ────────────────────────────────────────────────────────────

test('page title is set', async ({ page }) => {
  await page.goto('/timer-app/');
  await waitForBlazor(page);
  await expect(page).toHaveTitle(/Timer/i);
});

test('interactive buttons have accessible labels', async ({ page }) => {
  await page.goto('/timer-app/');
  await waitForBlazor(page);

  // All buttons should have some accessible text (via aria-label or inner text)
  const buttons = page.locator('button');
  const count = await buttons.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i);
    const label = await btn.getAttribute('aria-label');
    const text = await btn.textContent();
    expect((label || text || '').trim().length).toBeGreaterThan(0);
  }
});

test('SVG wheel has aria-label', async ({ page }) => {
  await page.goto('/timer-app/');
  await waitForBlazor(page);

  const wheel = page.locator('.timer-wheel[aria-label], .timer-wheel[role]');
  await expect(wheel.first()).toBeVisible();
});

// ─── PWA manifest ─────────────────────────────────────────────────────────────

test('PWA manifest is linked', async ({ page }) => {
  await page.goto('/timer-app/');
  const manifestLink = page.locator('link[rel="manifest"]');
  await expect(manifestLink).toHaveCount(1);
});

test('PWA manifest is valid JSON with required fields', async ({ page }) => {
  const response = await page.request.get('/timer-app/manifest.webmanifest');
  expect(response.status()).toBe(200);

  const manifest = await response.json();
  expect(manifest.name).toBeTruthy();
  expect(manifest.short_name).toBeTruthy();
  expect(manifest.start_url).toContain('/timer-app/');
  expect(manifest.scope).toContain('/timer-app/');
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons).toBeDefined();
  expect(manifest.icons.length).toBeGreaterThan(0);
});
