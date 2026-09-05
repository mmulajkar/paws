import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router-dom';
import Dashboard from '../../src/pages/Dashboard';
import { computeStay } from '../../src/utils/stayCalculations';

function renderWithContext(ctx) {
  const router = createMemoryRouter([
    {
      path: '/',
      element: <Outlet context={ctx} />,
      children: [{ index: true, element: <Dashboard /> }],
    },
  ]);
  return render(<RouterProvider router={router} />);
}

function makeStay(overrides) {
  const stay = {
    id: 's1',
    dog_id: 'd1',
    start_date: '2026-09-01',
    end_date: '2026-09-05',
    daily_rate: 50,
    amount_paid: 0,
    ...overrides,
  };
  return { stay, dog: { id: 'd1', name: 'Max', photo_url: '' }, owner: { name: 'Jane' }, calc: computeStay(stay) };
}

function metricValue(label) {
  // Metric tile labels are the only occurrence styled with "text-xs" —
  // section headings use the same words ("Upcoming stays") but as an <h3>.
  const el = screen.getAllByText(label).find((node) => node.className.includes('text-xs'));
  return el.nextElementSibling.textContent;
}

describe('Dashboard', () => {
  it('shows empty states and zeroed summary tiles when there are no stays', () => {
    renderWithContext({ staysCalc: [], markPaid: vi.fn(), openAddStay: vi.fn() });

    expect(screen.getByText('No dogs are currently being cared for.')).toBeInTheDocument();
    expect(screen.getByText('No upcoming stays scheduled.')).toBeInTheDocument();
    expect(metricValue('Current dogs')).toBe('0');
    expect(metricValue('Upcoming stays')).toBe('0');
    expect(metricValue('Days this month')).toBe('0');
    expect(metricValue('Earnings this month')).toBe('$0.00');
  });

  it('lists a currently-active stay under "Currently being cared for"', () => {
    const today = new Date();
    const iso = (d) => d.toISOString().slice(0, 10);
    const entry = makeStay({ start_date: iso(today), end_date: iso(today) });
    renderWithContext({ staysCalc: [entry], markPaid: vi.fn(), openAddStay: vi.fn() });

    const section = screen.getByRole('heading', { name: 'Currently being cared for' }).closest('section');
    expect(within(section).getByText('Max')).toBeInTheDocument();
    expect(metricValue('Current dogs')).toBe('1');
  });

  it('lists an upcoming stay under "Upcoming stays" and not as current', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const isoFuture = future.toISOString().slice(0, 10);
    const entry = makeStay({ start_date: isoFuture, end_date: isoFuture });
    renderWithContext({ staysCalc: [entry], markPaid: vi.fn(), openAddStay: vi.fn() });

    const upcomingSection = screen.getByRole('heading', { name: 'Upcoming stays' }).closest('section');
    expect(within(upcomingSection).getByText('Max')).toBeInTheDocument();
    expect(screen.getByText('No dogs are currently being cared for.')).toBeInTheDocument();
    expect(metricValue('Upcoming stays')).toBe('1');
  });
});
