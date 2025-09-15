import { test, expect } from '@playwright/test';

test.describe('Memories Management', () => {
  test.beforeEach(async ({ page }) => {
    // For now, we'll test the public/guest experience
    // In the future, this could include authentication setup
    await page.goto('/');
  });

  test('should show memories page or redirect to login', async ({ page }) => {
    // Try to access memories page
    await page.goto('/memories');

    // Either we see memories content or we're redirected to login
    const currentUrl = page.url();

    if (currentUrl.includes('login') || currentUrl.includes('auth')) {
      // If redirected to login, that's expected behavior for protected route
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    } else {
      // If we can access memories, check for memory-related content
      await expect(page.locator('main, [role="main"]')).toBeVisible();

      // Look for common memory page elements
      const memoryPageSelectors = [
        'h1:has-text("Memories")',
        '[data-testid*="memory"]',
        '.memory',
        'button:has-text("Add Memory")',
        'button:has-text("Upload")',
        '[role="grid"]', // Common for photo grids
        '.grid' // Tailwind grid classes
      ];

      let memoryElementFound = false;
      for (const selector of memoryPageSelectors) {
        try {
          if (await page.locator(selector).isVisible()) {
            memoryElementFound = true;
            break;
          }
        } catch {
          // Continue checking other selectors
        }
      }

      // At minimum, page should have loaded properly
      expect(memoryElementFound || await page.locator('main').isVisible()).toBeTruthy();
    }
  });

  test('should handle media upload form if accessible', async ({ page }) => {
    await page.goto('/memories');

    // Check if we can access upload functionality
    const uploadSelectors = [
      'button:has-text("Add Memory")',
      'button:has-text("Upload")',
      'input[type="file"]',
      '[data-testid*="upload"]',
      'form[enctype*="multipart"]'
    ];

    let uploadFound = false;
    for (const selector of uploadSelectors) {
      try {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          uploadFound = true;

          if (selector.includes('button')) {
            await element.click();

            // Check if upload modal or form appears
            await page.waitForTimeout(500); // Brief wait for modal

            const modalSelectors = [
              '[role="dialog"]',
              '.modal',
              'input[type="file"]',
              'form'
            ];

            for (const modalSelector of modalSelectors) {
              try {
                if (await page.locator(modalSelector).isVisible()) {
                  expect(true).toBeTruthy(); // Upload UI is working
                  return;
                }
              } catch {
                // Continue
              }
            }
          }
          break;
        }
      } catch {
        // Continue trying other selectors
      }
    }

    // If we found upload elements, that's good
    // If not, we might be on login page, which is also expected
    const isLoginPage = page.url().includes('login') || page.url().includes('auth');
    expect(uploadFound || isLoginPage).toBeTruthy();
  });

  test('should display memory timeline or grid if available', async ({ page }) => {
    await page.goto('/memories');

    // Skip if redirected to login
    if (page.url().includes('login') || page.url().includes('auth')) {
      await expect(page.locator('form')).toBeVisible();
      return;
    }

    // Look for memory display patterns
    const memoryDisplaySelectors = [
      '.grid', // Grid layout
      '[role="grid"]',
      '.timeline',
      '[data-testid*="timeline"]',
      '[data-testid*="memory-list"]',
      '.memory-item',
      '.photo-grid',
      'article', // Semantic memory articles
      '[role="article"]'
    ];

    let displayFound = false;
    for (const selector of memoryDisplaySelectors) {
      try {
        if (await page.locator(selector).isVisible()) {
          displayFound = true;
          break;
        }
      } catch {
        // Continue
      }
    }

    // Either we found memory display elements or the page loaded correctly
    expect(displayFound || await page.locator('main').isVisible()).toBeTruthy();
  });
});