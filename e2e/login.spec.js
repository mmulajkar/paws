import { test, expect } from './fixtures/mockSupabase';

test.describe('Login and route protection', () => {
  test('redirects an unauthenticated visitor to the login page', async ({ page, mockApi }) => {
    void mockApi;
    await page.goto('/dogs');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Paws Log' })).toBeVisible();
  });

  test('shows a friendly error for an incorrect password', async ({ page, mockApi }) => {
    void mockApi;
    await page.goto('/login');
    await page.getByLabel('Email').fill('daughter@example.com');
    await page.getByLabel('Password').fill('the-wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Incorrect email or password.')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('requires both email and password before submitting', async ({ page, mockApi }) => {
    void mockApi;
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Email is required.')).toBeVisible();
    await expect(page.getByText('Password is required.')).toBeVisible();
  });

  test('signs in with valid credentials and reaches the dashboard', async ({ page, mockApi }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(mockApi.validEmail);
    await page.getByLabel('Password').fill(mockApi.validPassword);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Paws Log' })).toBeVisible();
    await expect(page.getByText('No dogs are currently being cared for.')).toBeVisible();
  });

  test('sends a visitor back to the page they wanted after signing in', async ({ page, mockApi }) => {
    await page.goto('/dogs');
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel('Email').fill(mockApi.validEmail);
    await page.getByLabel('Password').fill(mockApi.validPassword);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/dogs$/);
  });

  test('can sign out from the dashboard', async ({ page, mockApi }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(mockApi.validEmail);
    await page.getByLabel('Password').fill(mockApi.validPassword);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/');

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
