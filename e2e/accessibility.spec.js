import { test, expect } from './fixtures/mockSupabase';

test.describe('Accessibility spot checks', () => {
  test('the login form can be completed with the keyboard alone', async ({ page, mockApi }) => {
    await page.goto('/login');

    await page.keyboard.press('Tab'); // -> email field
    await expect(page.getByLabel('Email')).toBeFocused();
    await page.keyboard.type(mockApi.validEmail);

    await page.keyboard.press('Tab'); // -> password field
    await expect(page.getByLabel('Password')).toBeFocused();
    await page.keyboard.type(mockApi.validPassword);

    await page.keyboard.press('Tab'); // -> sign in button
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL('/');
  });

  test('a focused control shows a visible focus outline', async ({ page, mockApi }) => {
    void mockApi;
    await page.goto('/login');
    const email = page.getByLabel('Email');
    await email.focus();
    const outline = await email.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
  });

  test('icon-only buttons expose an accessible name', async ({ page, mockApi }) => {
    mockApi.seed('owners', [{ id: 'owner-1', name: 'Jane Doe', phone: '555-0001', email: '', emergency_contact: '', emergency_phone: '', notes: '' }]);
    mockApi.seed('dogs', [{ id: 'dog-1', owner_id: 'owner-1', name: 'Max', photo_url: '', breed: '' }]);

    await page.goto('/login');
    await page.getByLabel('Email').fill(mockApi.validEmail);
    await page.getByLabel('Password').fill(mockApi.validPassword);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // The always-visible sign-out control is icon-only on mobile widths, but
    // must still expose a real accessible name via aria-label everywhere.
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

    await page.goto('/dogs');
    await page.getByRole('button', { name: 'Add dog' }).first().click();
    await expect(page.getByRole('button', { name: 'Close dialog' })).toBeVisible();
  });
});
