import { test, expect } from './fixtures/mockSupabase';

// Regression coverage for a real bug found on the first deployment: with a
// brand-new (empty) database — no owners yet — the "Add a dog" form defaults
// to its longer "new owner" layout. On any viewport 640px or wider, the
// modal's backdrop used `items-center` together with `overflow-y-auto`, a
// combination that (once the dialog is taller than the viewport) makes the
// browser open the dialog pre-scrolled to its vertical middle instead of its
// top — hiding the "Dog name" field the user needs first. See Modal.jsx.

async function login(page, mockApi) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(mockApi.validEmail);
  await page.getByLabel('Password').fill(mockApi.validPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/');
}

test.describe('First run: adding the very first dog with no owners yet', () => {
  // Intentionally no mockApi.seed(...) here — this is the true "just
  // deployed, empty database" state the bug actually occurred in.

  test('the Dog name field is visible and usable without scrolling, on a desktop-width viewport', async ({ page, mockApi }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page, mockApi);
    await page.goto('/dogs');
    await page.getByRole('button', { name: 'Add dog' }).first().click();

    const nameInput = page.getByLabel('Dog name');
    await expect(nameInput).toBeVisible();
    // The field must actually be within the visible viewport, not just
    // present in the DOM below the fold — this is what the bug broke.
    const box = await nameInput.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);

    await nameInput.fill('Buddy');
    await expect(nameInput).toHaveValue('Buddy');
  });

  test('the Dog name field is visible and usable without scrolling, on a tablet-width viewport', async ({ page, mockApi }) => {
    await page.setViewportSize({ width: 700, height: 700 });
    await login(page, mockApi);
    await page.goto('/dogs');
    await page.getByRole('button', { name: 'Add dog' }).first().click();

    const nameInput = page.getByLabel('Dog name');
    await expect(nameInput).toBeVisible();
    const box = await nameInput.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);

    await nameInput.fill('Rex');
    await expect(nameInput).toHaveValue('Rex');
  });

  test('can add the first dog end to end with a brand-new owner, at desktop width', async ({ page, mockApi }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page, mockApi);
    await page.goto('/dogs');
    await page.getByRole('button', { name: 'Add dog' }).first().click();
    await page.getByLabel('Dog name').fill('Buddy');
    await page.getByLabel('Owner name').fill('Jane Doe');
    await page.getByLabel('Phone number').fill('555-0001');
    await page.getByRole('button', { name: 'Save dog' }).click();
    await expect(page.getByRole('heading', { name: 'Add a dog' })).toBeHidden();
    await expect(page.getByText('Buddy')).toBeVisible();
  });
});
