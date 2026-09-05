import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router-dom';
import Dogs from '../../src/pages/Dogs';

function renderWithContext(ctx) {
  const router = createMemoryRouter([
    {
      path: '/',
      element: <Outlet context={ctx} />,
      children: [{ index: true, element: <Dogs /> }],
    },
  ]);
  return render(<RouterProvider router={router} />);
}

const ownerById = new Map([['o1', { id: 'o1', name: 'Jane Doe' }]]);

describe('Dogs list', () => {
  it('shows an empty state with an "Add dog" action when there are no dogs', async () => {
    const openAddDog = vi.fn();
    renderWithContext({ dogs: [], ownerById, openAddDog });

    expect(screen.getByText('No dogs yet. Add your first dog to get started.')).toBeInTheDocument();
    const addButtons = screen.getAllByRole('button', { name: 'Add dog' });
    expect(addButtons).toHaveLength(2); // header action + empty-state action
    await userEvent.setup().click(addButtons[1]);
    expect(openAddDog).toHaveBeenCalled();
  });

  it('displays each dog with its owner', () => {
    const dogs = [{ id: 'd1', name: 'Max', breed: 'Golden Retriever', owner_id: 'o1', photo_url: '' }];
    renderWithContext({ dogs, ownerById, openAddDog: vi.fn() });

    expect(screen.getByText('Max')).toBeInTheDocument();
    expect(screen.getByText('Golden Retriever')).toBeInTheDocument();
    expect(screen.getByText('Owner: Jane Doe')).toBeInTheDocument();
  });

  it('filters dogs by search query (dog or owner name)', async () => {
    const dogs = [
      { id: 'd1', name: 'Max', breed: '', owner_id: 'o1', photo_url: '' },
      { id: 'd2', name: 'Bella', breed: '', owner_id: 'o1', photo_url: '' },
    ];
    renderWithContext({ dogs, ownerById, openAddDog: vi.fn() });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Search dogs'), 'bella');

    expect(screen.getByText('Bella')).toBeInTheDocument();
    expect(screen.queryByText('Max')).not.toBeInTheDocument();
  });
});
