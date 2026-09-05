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

// This is an INTEGRATION test: it exercises the real AppShell, the real
// useAppData/useDogs/useOwners hooks, and the real DogForm together, with
// only the network-facing services layer mocked out. It verifies the "add a
// dog" workflow end-to-end (open form -> fill -> save -> list updates),
// not just that individual pieces render.

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

describe('Integration: add-dog workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    staysService.listStays.mockResolvedValue([]);
  });

  it('creates a new dog together with a brand-new owner and lists it on the Dogs page', async () => {
    ownersService.listOwners.mockResolvedValue([]);
    dogsService.listDogs.mockResolvedValue([]);
    ownersService.createOwner.mockResolvedValue({ id: 'owner-1', name: 'New Owner', phone: '555-0000' });
    dogsService.createDog.mockResolvedValue({
      id: 'dog-1',
      name: 'Bella',
      owner_id: 'owner-1',
      photo_url: '',
      breed: '',
    });

    const user = userEvent.setup();
    renderApp('/dogs');

    await waitFor(() => expect(screen.getByText('No dogs yet. Add your first dog to get started.')).toBeInTheDocument());

    await user.click(screen.getAllByRole('button', { name: 'Add dog' })[0]);

    // With no owners yet, the form skips the existing/new owner toggle
    // entirely and goes straight to the new-owner fields.
    await user.type(await screen.findByLabelText(/dog name/i), 'Bella');
    await user.type(screen.getByLabelText(/owner name/i), 'New Owner');
    await user.type(screen.getByLabelText(/phone number/i), '555-0000');
    await user.click(screen.getByRole('button', { name: /save dog/i }));

    await waitFor(() => expect(dogsService.createDog).toHaveBeenCalledTimes(1));
    expect(ownersService.createOwner).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Owner', phone: '555-0000' })
    );
    expect(dogsService.createDog.mock.calls[0][0]).toMatchObject({ name: 'Bella', owner_id: 'owner-1' });

    // The modal closes and the newly-created dog now shows up in the list —
    // this is the observable business outcome, not just "the function ran".
    await waitFor(() => expect(screen.queryByLabelText(/dog name/i)).not.toBeInTheDocument());
    expect(screen.getByText('Bella')).toBeInTheDocument();
    expect(screen.getByText('Owner: New Owner')).toBeInTheDocument();
  });

  it('creates a new dog for an existing owner without creating a duplicate owner', async () => {
    const existingOwner = { id: 'owner-1', name: 'Jane Doe' };
    ownersService.listOwners.mockResolvedValue([existingOwner]);
    dogsService.listDogs.mockResolvedValue([]);
    dogsService.createDog.mockResolvedValue({
      id: 'dog-2',
      name: 'Max',
      owner_id: 'owner-1',
      photo_url: '',
      breed: '',
    });

    const user = userEvent.setup();
    renderApp('/dogs');

    await user.click((await screen.findAllByRole('button', { name: 'Add dog' }))[0]);
    await user.type(await screen.findByLabelText(/dog name/i), 'Max');
    await user.selectOptions(screen.getByLabelText(/select owner/i), ['owner-1']);
    await user.click(screen.getByRole('button', { name: /save dog/i }));

    await waitFor(() => expect(dogsService.createDog).toHaveBeenCalledTimes(1));
    expect(ownersService.createOwner).not.toHaveBeenCalled();
    expect(dogsService.createDog.mock.calls[0][0]).toMatchObject({ name: 'Max', owner_id: 'owner-1' });

    await waitFor(() => expect(screen.getByText('Max')).toBeInTheDocument());
    expect(screen.getByText('Owner: Jane Doe')).toBeInTheDocument();
  });
});
