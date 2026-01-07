import { test, expect } from '@playwright/test';

test('app loads and shows home page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText(/Home|Demo Household/i);
});

test('navigation works', async ({ page }) => {
  await page.goto('/');
  
  // Click on Today tab
  await page.click('text=Today');
  await expect(page.locator('h1')).toContainText('Today');
  
  // Click on Chores tab
  await page.click('text=Chores');
  await expect(page.locator('h1')).toContainText('Chores');
});

