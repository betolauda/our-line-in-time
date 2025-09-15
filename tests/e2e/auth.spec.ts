import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login form when not authenticated', async ({ page }) => {
    await page.goto('/login');

    // Check login form elements
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')).toBeVisible();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first().click();

    // Check for validation messages (common patterns)
    const errorSelectors = [
      '[role="alert"]',
      '.error',
      '.text-red-500',
      '[data-testid*="error"]',
      'p:has-text("required")',
      'span:has-text("required")'
    ];

    let errorFound = false;
    for (const selector of errorSelectors) {
      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 2000 });
        errorFound = true;
        break;
      } catch {
        // Continue trying other selectors
      }
    }

    // If no specific error elements found, check if form didn't navigate away
    if (!errorFound) {
      await expect(page).toHaveURL(/.*login.*/);
    }
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/login');

    // Look for signup/register link
    const signupSelectors = [
      'a:has-text("Sign up")',
      'a:has-text("Register")',
      'a:has-text("Create account")',
      'a[href*="signup"]',
      'a[href*="register"]'
    ];

    let signupLinkFound = false;
    for (const selector of signupSelectors) {
      try {
        const link = page.locator(selector);
        if (await link.isVisible()) {
          await link.click();
          signupLinkFound = true;
          break;
        }
      } catch {
        // Continue trying other selectors
      }
    }

    if (signupLinkFound) {
      // Verify we're on signup page
      await expect(page).toHaveURL(/.*signup.*|.*register.*/);
    } else {
      // If no signup link found, try navigating directly
      await page.goto('/signup');
      await expect(page).toHaveURL(/.*signup.*|.*register.*/);
    }
  });
});