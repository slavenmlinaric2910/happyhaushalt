import { test, expect } from '@playwright/test';

test('app loads and shows home page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText(/Tasks|Demo Household/i);
});

test('navigation works', async ({ page }) => {
  await page.goto('/');
  
  // Click on Tasks tab
  await page.click('text=Tasks');
  await expect(page.locator('h1')).toContainText('Tasks');
  
  // Click on Household tab
  await page.click('text=Household');
  await expect(page.locator('h1')).toContainText('Household');
});

