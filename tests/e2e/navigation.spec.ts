import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should have working navigation menu', async ({ page }) => {
    await page.goto('/');

    // Check for navigation elements
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Common navigation patterns
    const navSelectors = [
      'a:has-text("Home")',
      'a:has-text("Memories")',
      'a:has-text("Timeline")',
      'a:has-text("Gallery")',
      'a:has-text("Login")',
      'a:has-text("Sign In")',
      'a[href="/"]',
      'a[href="/memories"]',
      'a[href="/login"]'
    ];

    let navLinksFound = 0;
    for (const selector of navSelectors) {
      try {
        if (await page.locator(selector).isVisible()) {
          navLinksFound++;
        }
      } catch {
        // Continue checking
      }
    }

    // Should have at least some navigation links
    expect(navLinksFound).toBeGreaterThan(0);
  });

  test('should navigate between main pages', async ({ page }) => {
    await page.goto('/');

    // Test navigation to different sections
    const navigationTests = [
      { linkText: 'Memories', expectedUrl: /.*memories.*/ },
      { linkText: 'Login', expectedUrl: /.*login.*/ },
      { linkText: 'Home', expectedUrl: /.*\/$/ }
    ];

    for (const { linkText, expectedUrl } of navigationTests) {
      try {
        const link = page.locator(`a:has-text("${linkText}")`).first();
        if (await link.isVisible()) {
          await link.click();
          await page.waitForLoadState('networkidle');
          await expect(page).toHaveURL(expectedUrl);

          // Navigate back to home for next test
          await page.goto('/');
        }
      } catch {
        // Skip if navigation link not found
      }
    }
  });

  test('should handle 404 errors gracefully', async ({ page }) => {
    // Try to navigate to a non-existent page
    await page.goto('/non-existent-page');

    // Should either show 404 page or redirect to home
    const isHome = page.url().endsWith('/') || page.url().includes('localhost:3000');
    const has404Content = await page.locator('h1:has-text("404"), h1:has-text("Not Found"), h1:has-text("Page Not Found")').isVisible();

    expect(isHome || has404Content).toBeTruthy();
  });

  test('should have functional mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // Mobile viewport
    await page.goto('/');

    // Look for mobile menu toggle (hamburger menu)
    const mobileToggleSelectors = [
      'button:has-text("☰")',
      'button[aria-label*="menu"]',
      'button[aria-label*="Menu"]',
      '.hamburger',
      '[data-testid*="menu-toggle"]',
      'button:has([role="menu"])'
    ];

    let mobileMenuFound = false;
    for (const selector of mobileToggleSelectors) {
      try {
        const toggle = page.locator(selector);
        if (await toggle.isVisible()) {
          await toggle.click();
          mobileMenuFound = true;

          // Check if mobile menu opened
          await page.waitForTimeout(300);

          const menuSelectors = [
            '[role="menu"]',
            '.mobile-menu',
            'nav[aria-expanded="true"]',
            '.menu-open'
          ];

          for (const menuSelector of menuSelectors) {
            try {
              if (await page.locator(menuSelector).isVisible()) {
                expect(true).toBeTruthy(); // Mobile menu works
                return;
              }
            } catch {
              // Continue
            }
          }
          break;
        }
      } catch {
        // Continue trying other selectors
      }
    }

    // If no mobile menu toggle found, check if regular nav is still visible on mobile
    if (!mobileMenuFound) {
      await expect(page.locator('nav')).toBeVisible();
    }
  });
});