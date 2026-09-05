import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from '../../src/hooks/useAuth';
import AppShell from '../../src/components/AppShell';
import Dashboard from '../../src/pages/Dashboard';
import Dogs from '../../src/pages/Dogs';
import DogProfile from '../../src/pages/DogProfile';
import Stays from '../../src/pages/Stays';
import History from '../../src/pages/History';

// This is an INTEGRATION test: it exercises the real AppShell, useAppData,
// useStays, and StayForm together, with only the services layer mocked out.
// It verifies the "create a stay" workflow end-to-end — including that the
// day count and total amount are computed and displayed for the saved stay,
// i.e. it checks the actual business outcome, not just that a click worked.

vi.mock('../../src/services/authService', () => ({
  getSession: vi.fn().mockResolvedValue({ user: { id: 'u1', email: 'daughter@example.com' } }),
  onAuthStateChange: vi.fn(() => () => {}),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('../../src/services/ownersService', () => ({
  listOwners: vi.fn(),
  createOwner: vi.fn(),
  updateOwner: vi.fn(),
  deleteOwner: vi.fn(),
}));

vi.mock('../../src/services/dogsService', () => ({
  listDogs: vi.fn(),
  getDog: vi.fn(),
  createDog: vi.fn(),
  updateDog: vi.fn(),
  deleteDog: vi.fn(),
}));

vi.mock('../../src/services/staysService', () => ({
  listStays: vi.fn(),
  createStay: vi.fn(),
  updateStay: vi.fn(),
  deleteStay: vi.fn(),
}));

import * as ownersService from '../../src/services/ownersService';
import * as dogsService from '../../src/services/dogsService';
import * as staysService from '../../src/services/staysService';

function renderApp(initialPath) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <AuthProvider>
            <AppShell />
          </AuthProvider>
        ),
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'dogs', element: <Dogs /> },
          { path: 'dogs/:id', element: <DogProfile /> },
          { path: 'stays', element: <Stays /> },
          { path: 'history', element: <History /> },
        ],
      },
    ],
    { initialEntries: [initialPath] }
  );
  return render(<RouterProvider router={router} />);
}

describe('Integration: create-stay workflow', () => {
  const dog = { id: 'dog-1', name: 'Max', owner_id: 'owner-1', photo_url: '' };
  const owner = { id: 'owner-1', name: 'Jane Doe' };

  beforeEach(() => {
    vi.clearAllMocks();
    dogsService.listDogs.mockResolvedValue([dog]);
    ownersService.listOwners.mockResolvedValue([owner]);
  });

  it('creates a new stay for an existing dog and shows it with the computed total', async () => {
    staysService.listStays.mockResolvedValue([]);
    staysService.createStay.mockResolvedValue({
      id: 'stay-1',
      dog_id: 'dog-1',
      start_date: '2026-09-05',
      end_date: '2026-09-10',
      drop_off_time: null,
      pickup_time: null,
      notes: '',
      daily_rate: 50,
      amount_paid: 0,
    });

    const user = userEvent.setup();
    renderApp('/stays');

    await user.click(await screen.findByRole('button', { name: /add stay/i }));

    const start = await screen.findByLabelText(/start date/i);
    const end = screen.getByLabelText(/end date/i);
    await user.clear(start);
    await user.type(start, '2026-09-05');
    await user.clear(end);
    await user.type(end, '2026-09-10');
    await user.type(screen.getByLabelText(/daily rate/i), '50');
    await user.click(screen.getByRole('button', { name: /save stay/i }));

    await waitFor(() => expect(staysService.createStay).toHaveBeenCalledTimes(1));
    expect(staysService.createStay.mock.calls[0][0]).toMatchObject({
      dog_id: 'dog-1',
      start_date: '2026-09-05',
      end_date: '2026-09-10',
      daily_rate: 50,
      amount_paid: 0,
    });

    // The modal closes and the saved stay now appears in the list, showing
    // the dog it belongs to, the computed total (5 days x $50 = $250), and
    // that no payment has been recorded yet.
    await waitFor(() => expect(screen.queryByLabelText(/start date/i)).not.toBeInTheDocument());
    expect(screen.getByText('Max')).toBeInTheDocument();
    expect(screen.getByText('$250.00')).toBeInTheDocument();
    expect(screen.getByText('Not Paid')).toBeInTheDocument();
  });

  it('warns about but still allows an overlapping stay for the same dog', async () => {
    staysService.listStays.mockResolvedValue([
      {
        id: 'existing-stay',
        dog_id: 'dog-1',
        start_date: '2026-09-01',
        end_date: '2026-09-08',
        drop_off_time: null,
        pickup_time: null,
        notes: '',
        daily_rate: 40,
        amount_paid: 0,
      },
    ]);
    staysService.createStay.mockResolvedValue({
      id: 'stay-2',
      dog_id: 'dog-1',
      start_date: '2026-09-05',
      end_date: '2026-09-10',
      drop_off_time: null,
      pickup_time: null,
      notes: '',
      daily_rate: 50,
      amount_paid: 0,
    });

    const user = userEvent.setup();
    renderApp('/stays');

    await user.click(await screen.findByRole('button', { name: /add stay/i }));

    const start = await screen.findByLabelText(/start date/i);
    const end = screen.getByLabelText(/end date/i);
    await user.clear(start);
    await user.type(start, '2026-09-05');
    await user.clear(end);
    await user.type(end, '2026-09-10');
    await user.type(screen.getByLabelText(/daily rate/i), '50');

    expect(
      await screen.findByText(/already has a stay that overlaps these dates/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /save stay/i }));
    await waitFor(() => expect(staysService.createStay).toHaveBeenCalledTimes(1));
  });
});
