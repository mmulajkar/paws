import { test, expect } from './fixtures/mockSupabase';

// A fixed "today" so stay status (current/upcoming/completed) is
// deterministic and never depends on the real calendar date.
const TODAY = new Date('2026-06-15T12:00:00');

async function login(page, mockApi) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(mockApi.validEmail);
  await page.getByLabel('Password').fill(mockApi.validPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/');
}

test.describe('Full dog-sitting workflow', () => {
  test.beforeEach(async ({ page, mockApi }) => {
    await page.clock.setFixedTime(TODAY);
    mockApi.seed('owners', [{ id: 'owner-1', name: 'Jane Doe', phone: '555-0001', email: '', emergency_contact: '', emergency_phone: '', notes: '' }]);
  });

  test('adds a dog, creates a current stay, and marks it paid', async ({ page, mockApi }) => {
    await login(page, mockApi);

    // 1. Add a dog for the existing owner.
    await page.goto('/dogs');
    await page.getByRole('button', { name: 'Add dog' }).first().click();
    await page.getByLabel('Dog name').fill('Max');
    await page.getByLabel('Select owner').selectOption('owner-1');
    await page.getByRole('button', { name: 'Save dog' }).click();
    await expect(page.getByRole('heading', { name: 'Add a dog' })).toBeHidden();
    await expect(page.getByText('Max')).toBeVisible();

    // 2. Create a stay spanning today, so it shows up as "current".
    await page.goto('/');
    await page.getByRole('button', { name: 'Add stay' }).click();
    await page.getByLabel('Select dog').selectOption({ label: 'Max' });
    await page.getByLabel('Start date').fill('2026-06-13');
    await page.getByLabel('End date').fill('2026-06-18');
    await page.getByLabel('Daily rate ($)').fill('40');
    await page.getByRole('button', { name: 'Save stay' }).click();
    await expect(page.getByRole('heading', { name: 'Create a stay' })).toBeHidden();

    // 3. Dashboard reflects the current stay with the right totals.
    await expect(page.getByRole('heading', { name: 'Currently being cared for' })).toBeVisible();
    const currentSection = page.locator('section', { has: page.getByRole('heading', { name: 'Currently being cared for' }) });
    await expect(currentSection.getByText('Max')).toBeVisible();
    await expect(currentSection.getByText('$200.00')).toBeVisible(); // 5 days x $40
    await expect(currentSection.getByText('Not Paid')).toBeVisible();

    // 4. Mark the stay paid and confirm the payment status transitions.
    // (Scoped to a real <button> tag: the dog card itself is a div[role="button"]
    // whose computed accessible name also happens to contain "Mark paid".)
    await currentSection.locator('button', { hasText: 'Mark paid' }).click();
    await expect(currentSection.getByText('Paid', { exact: true })).toBeVisible();
    await expect(currentSection.locator('button', { hasText: 'Mark paid' })).toHaveCount(0);
  });

  test('shows a past stay under History with its payment status', async ({ page, mockApi }) => {
    mockApi.seed('dogs', [{ id: 'dog-1', owner_id: 'owner-1', name: 'Bella', photo_url: '', breed: '' }]);
    mockApi.seed('stays', [
      {
        id: 'stay-past',
        dog_id: 'dog-1',
        start_date: '2026-05-01',
        end_date: '2026-05-04',
        daily_rate: 30,
        amount_paid: 30,
        drop_off_time: null,
        pickup_time: null,
        notes: '',
      },
    ]);

    await login(page, mockApi);
    await page.goto('/history');

    await expect(page.getByText('Bella')).toBeVisible();
    await expect(page.getByText('Total $90.00')).toBeVisible();
    await expect(page.getByText('Paid $30.00')).toBeVisible();
    await expect(page.getByText('Partially Paid')).toBeVisible();

    await page.getByRole('button', { name: /mark paid/i }).click();
    await expect(page.getByText('Paid', { exact: true })).toBeVisible();
  });

  test('shows a future stay under Upcoming on the dashboard, not as current', async ({ page, mockApi }) => {
    mockApi.seed('dogs', [{ id: 'dog-2', owner_id: 'owner-1', name: 'Cooper', photo_url: '', breed: '' }]);
    mockApi.seed('stays', [
      {
        id: 'stay-future',
        dog_id: 'dog-2',
        start_date: '2026-07-01',
        end_date: '2026-07-03',
        daily_rate: 35,
        amount_paid: 0,
        drop_off_time: null,
        pickup_time: null,
        notes: '',
      },
    ]);

    await login(page, mockApi);

    await expect(page.getByText('No dogs are currently being cared for.')).toBeVisible();
    const upcomingSection = page.locator('section', { has: page.getByRole('heading', { name: 'Upcoming stays' }) });
    await expect(upcomingSection.getByText('Cooper')).toBeVisible();
  });
});
