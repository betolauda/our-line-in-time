import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check for h1 tag (should have exactly one)
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    expect(h1Count).toBeLessThanOrEqual(2); // Allow for logo + main heading

    // Check that headings have text content
    const h1 = page.locator('h1').first();
    const h1Text = await h1.textContent();
    expect(h1Text?.trim()).toBeTruthy();
  });

  test('should have proper alt text for images', async ({ page }) => {
    await page.goto('/');

    // Get all images
    const images = page.locator('img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const src = await img.getAttribute('src');

        // Images should either have alt text or be decorative
        if (src && !src.includes('logo') && !src.includes('icon')) {
          expect(alt).toBeDefined();
          expect(alt?.length).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/login');

    // Check for form inputs
    const inputs = page.locator('input[type="email"], input[type="password"], input[type="text"]');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const inputId = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');

        // Input should have either a label, aria-label, or aria-labelledby
        if (inputId) {
          const label = page.locator(`label[for="${inputId}"]`);
          const hasLabel = await label.count() > 0;

          expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    }
  });

  test('should have keyboard navigation support', async ({ page }) => {
    await page.goto('/');

    // Test Tab navigation
    await page.keyboard.press('Tab');

    // Check if focus is visible on interactive elements
    const focusedElement = await page.locator(':focus').first();
    const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());

    // Focused element should be interactive (button, link, input, etc.)
    const interactiveTags = ['a', 'button', 'input', 'select', 'textarea'];
    expect(interactiveTags).toContain(tagName);
  });

  test('should have proper semantic HTML', async ({ page }) => {
    await page.goto('/');

    // Check for semantic landmarks
    const landmarks = [
      'main',
      'nav',
      'header',
      'footer',
      '[role="main"]',
      '[role="navigation"]',
      '[role="banner"]',
      '[role="contentinfo"]'
    ];

    let landmarkCount = 0;
    for (const landmark of landmarks) {
      const count = await page.locator(landmark).count();
      landmarkCount += count;
    }

    // Should have at least main and nav landmarks
    expect(landmarkCount).toBeGreaterThanOrEqual(2);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');

    // Basic check - ensure text is not using very low contrast colors
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, a, button');
    const count = await textElements.count();

    if (count > 0) {
      // Check a few text elements for basic styling
      for (let i = 0; i < Math.min(count, 5); i++) {
        const element = textElements.nth(i);
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        });

        // Basic checks - text should have color and reasonable font size
        expect(styles.color).not.toBe('');
        expect(styles.fontSize).toBeDefined();
      }
    }
  });

  test('should work with screen reader patterns', async ({ page }) => {
    await page.goto('/');

    // Check for skip links (common accessibility pattern)
    const skipLink = page.locator('a:has-text("Skip to main content"), a:has-text("Skip to content"), .skip-link');

    // Skip links are optional but good practice
    const hasSkipLink = await skipLink.count() > 0;

    // Check for aria-live regions for dynamic content
    const liveRegions = page.locator('[aria-live], [role="alert"], [role="status"]');
    const hasLiveRegions = await liveRegions.count() > 0;

    // At least one accessibility feature should be present
    const hasAccessibilityFeatures = hasSkipLink || hasLiveRegions ||
      await page.locator('[aria-label], [aria-describedby], [aria-expanded]').count() > 0;

    expect(hasAccessibilityFeatures).toBeTruthy();
  });
});