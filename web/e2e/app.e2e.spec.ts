import { test, expect } from '@playwright/test';

function createMockToken(username = 'testuser'): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      unique_name: username,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  ).toString('base64url');
  return `${header}.${payload}.mockSignature`;
}

const mockBooks = [
  {
    id: 'book-1',
    title: 'Ett eget rum och en lång titel som testar overflow på mycket smala skärmar',
    author: 'Virginia Woolf med ett väldigt långt författarnamn som ska brytas snyggt',
    publishedDate: '1929-10-24',
    description: 'En essä om kvinnors förutsättningar att skapa litteratur.',
  },
  {
    id: 'book-2',
    title: 'Kallocain',
    author: 'Karin Boye',
    publishedDate: '1940-01-01',
    description: 'En dystopisk framtidsskildring.',
  },
];

test.describe('E2E Tests: Responsiveness, Zero Horizontal Scroll, Theme Toggle & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Mock health check and book API
    await page.route('**/api/health', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'Healthy' }) })
    );

    await page.route('**/api/books', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockBooks) })
    );

    // Set auth token in localStorage before loading
    await page.addInitScript((token: string) => {
      localStorage.setItem('marginalia.token', token);
    }, createMockToken());
  });

  test('should ensure 0px horizontal scroll on book list', async ({ page }) => {
    await page.goto('/books');
    await page.waitForSelector('.book-row, .mobile-book-card');

    const hasHorizontalScroll = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > window.innerWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });

  test('should display responsive book list correctly based on viewport', async ({ page }) => {
    await page.goto('/books');
    await page.waitForSelector('.book-row, .mobile-book-card');

    const viewport = page.viewportSize();
    const width = viewport ? viewport.width : 1440;

    if (width >= 768) {
      // Desktop / Tablet table
      await expect(page.locator('.book-table')).toBeVisible();
      await expect(page.locator('.mobile-book-card').first()).not.toBeVisible();
    } else {
      // Mobile cards
      await expect(page.locator('.mobile-book-card').first()).toBeVisible();
      await expect(page.locator('.book-table')).not.toBeVisible();
    }
  });

  test('should toggle theme and persist selection without FOUC', async ({ page }) => {
    await page.goto('/books');

    // On mobile viewports (<992px), expand navbar if collapsed
    const toggler = page.locator('button.app-navbar-toggler');
    if (await toggler.isVisible()) {
      await toggler.click();
    }

    // Click theme toggle button in navbar
    const themeBtn = page.locator('button.theme-toggle').first();
    await expect(themeBtn).toBeVisible();

    const initialTheme = await page.getAttribute('html', 'data-bs-theme');
    const expectedNext = initialTheme === 'dark' ? 'light' : 'dark';

    await themeBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', expectedNext);

    // Verify localStorage has saved the theme
    const storedTheme = await page.evaluate(() => localStorage.getItem('marginalia.theme'));
    expect(storedTheme).toBe(expectedNext);

    // Reload page and verify that theme is preserved synchronously
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', expectedNext);
  });

  test('should have accessible dialog and interactive elements with no nested buttons', async ({ page }) => {
    await page.goto('/books');
    await page.waitForSelector('.book-row, .mobile-book-card');

    // Verify CustomSelect has a visible label with matching "for" attribute
    const selectLabel = page.locator('label[for="customSelectTrigger"]').first();
    await expect(selectLabel).toBeVisible();

    // Verify that tr and article do not have role="button" (no nested interactive elements)
    const nestedRoleButtons = await page.evaluate(() => {
      const rowsAndArticles = document.querySelectorAll('tr[role="button"], article[role="button"]');
      return rowsAndArticles.length;
    });
    expect(nestedRoleButtons).toBe(0);

    // Click book title or glyph to open BookDetailModal
    const viewport = page.viewportSize();
    const isMobile = viewport ? viewport.width < 768 : false;

    if (isMobile) {
      await page.locator('.mobile-book-title-btn').first().click();
    } else {
      await page.locator('.book-title-btn').first().click();
    }

    // Verify dialog modal ARIA attributes
    const modal = page.locator('.book-detail-wrapper[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-labelledby', 'book-detail-modal-title');

    // Close modal
    await page.locator('.book-detail-wrapper button.btn-icon').click();
    await expect(modal).not.toBeVisible();
  });
});
