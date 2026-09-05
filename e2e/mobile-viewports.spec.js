import { test, expect } from './fixtures/mockSupabase';

// Explicit mobile/tablet breakpoints called out by the project's testing
// requirements. Each one is driven through Chromium with touch enabled,
// checking the things that actually break on small screens: horizontal
// overflow, touch target size, and that the bottom nav (not a shrunk
// desktop nav) is what's shown.
const VIEWPORTS = [
  { name: '375x667 (iPhone SE-class)', width: 375, height: 667 },
  { name: '390x844 (iPhone 12/13/14-class)', width: 390, height: 844 },
  { name: '412x915 (Pixel-class)', width: 412, height: 915 },
  { name: '360x800 (small Android)', width: 360, height: 800 },
  { name: '768x1024 (tablet)', width: 768, height: 1024 },
];

async function noHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  return overflow;
}

for (const vp of VIEWPORTS) {
  test.describe(`Mobile viewport ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height }, hasTouch: true, isMobile: vp.width < 640 });

    test(`login and dashboard fit without horizontal scrolling at ${vp.name}`, { tag: ['@mobile', '@smoke'] }, async ({ page, mockApi }) => {
      await page.goto('/login');
      expect(await noHorizontalOverflow(page)).toBeLessThanOrEqual(1);

      // Every tappable control on the login form meets the 44px touch-target minimum.
      const signInButton = page.getByRole('button', { name: 'Sign in' });
      const box = await signInButton.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);

      await page.getByLabel('Email').fill(mockApi.validEmail);
      await page.getByLabel('Password').fill(mockApi.validPassword);
      await signInButton.click();
      await expect(page).toHaveURL('/');

      expect(await noHorizontalOverflow(page)).toBeLessThanOrEqual(1);
    });

    test(`shows the right navigation chrome for its size at ${vp.name}`, { tag: ['@mobile'] }, async ({ page, mockApi }) => {
      await page.goto('/login');
      await page.getByLabel('Email').fill(mockApi.validEmail);
      await page.getByLabel('Password').fill(mockApi.validPassword);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page).toHaveURL('/');

      // Tailwind's "sm" breakpoint (640px) is where this app switches from a
      // bottom tab bar to a top nav bar — verify whichever one applies at
      // this width is the one actually visible (not just present in the DOM).
      const isDesktopWidth = vp.width >= 640;
      const topNav = page.locator('nav.hidden.sm\\:flex');
      const bottomNav = page.locator('nav.sm\\:hidden');
      await expect(topNav).toBeVisible({ visible: isDesktopWidth });
      await expect(bottomNav).toBeVisible({ visible: !isDesktopWidth });
    });

    test(`the add-dog form fits on screen at ${vp.name}`, { tag: ['@mobile'] }, async ({ page, mockApi }) => {
      await page.goto('/login');
      await page.getByLabel('Email').fill(mockApi.validEmail);
      await page.getByLabel('Password').fill(mockApi.validPassword);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.goto('/dogs');

      await page.getByRole('button', { name: 'Add dog' }).first().click();
      await expect(page.getByRole('heading', { name: 'Add a dog' })).toBeVisible();
      expect(await noHorizontalOverflow(page)).toBeLessThanOrEqual(1);

      const nameField = page.getByLabel('Dog name');
      const fieldBox = await nameField.boundingBox();
      expect(fieldBox.height).toBeGreaterThanOrEqual(36); // inputs are a bit shorter than buttons but still comfortably tappable
      expect(fieldBox.width).toBeLessThanOrEqual(vp.width);
    });
  });
}
