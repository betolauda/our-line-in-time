import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display welcome message and navigation', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/Our Line in Time/);

    // Check main heading
    await expect(page.locator('h1')).toContainText('Our Line in Time');

    // Verify key navigation elements are present
    await expect(page.locator('nav')).toBeVisible();

    // Check for main call-to-action or content areas
    await expect(page.locator('main')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size
    await page.goto('/');

    // Ensure content is visible on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });
});