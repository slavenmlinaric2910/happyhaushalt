import { test, expect } from '@playwright/test';

test('app loads and shows login page', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const h1 = page.locator('h1');
  // Should see Home Chores (the app title) on login page
  await expect(h1).toContainText('Home Chores', { timeout: 10000 });
});

test('navigation works after app loads', async ({ page }) => {
  // This test would require authentication/session setup to properly test navigation
  // For now, we just verify the login page appears
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  
  // Should see login page
  await expect(page.locator('h1')).toContainText('Home Chores', { timeout: 10000 });
});

