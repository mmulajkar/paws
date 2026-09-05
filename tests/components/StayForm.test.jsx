import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StayForm from '../../src/components/StayForm';

const dogs = [{ id: 'dog-1', name: 'Max' }];

describe('StayForm', () => {
  it('shows a helpful error when the end date is before the start date', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<StayForm stay={null} dogs={dogs} stays={[]} onSave={onSave} onCancel={() => {}} />);

    await user.selectOptions(screen.getByLabelText(/select dog/i), ['dog-1']);
    const start = screen.getByLabelText(/start date/i);
    const end = screen.getByLabelText(/end date/i);
    await user.clear(start);
    await user.type(start, '2026-09-10');
    await user.clear(end);
    await user.type(end, '2026-09-05');
    await user.type(screen.getByLabelText(/daily rate/i), '50');
    await user.click(screen.getByRole('button', { name: /save stay/i }));

    expect(await screen.findByText('End date must be on or after the start date.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('computes and displays the day count and total automatically', async () => {
    const user = userEvent.setup();
    render(<StayForm stay={null} dogs={dogs} stays={[]} onSave={vi.fn()} onCancel={() => {}} />);

    const start = screen.getByLabelText(/start date/i);
    const end = screen.getByLabelText(/end date/i);
    await user.clear(start);
    await user.type(start, '2026-09-05');
    await user.clear(end);
    await user.type(end, '2026-09-10');
    await user.type(screen.getByLabelText(/daily rate/i), '50');

    expect(screen.getByText(/5 days/i)).toBeInTheDocument();
    // Both "Total amount" and "Remaining balance" read $250.00 before any payment is made.
    expect(screen.getAllByText('$250.00')).toHaveLength(2);
  });

  it('rejects an amount paid greater than the total amount', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<StayForm stay={null} dogs={dogs} stays={[]} onSave={onSave} onCancel={() => {}} />);

    await user.selectOptions(screen.getByLabelText(/select dog/i), ['dog-1']);
    const start = screen.getByLabelText(/start date/i);
    const end = screen.getByLabelText(/end date/i);
    await user.clear(start);
    await user.type(start, '2026-09-05');
    await user.clear(end);
    await user.type(end, '2026-09-06');
    await user.type(screen.getByLabelText(/daily rate/i), '50');
    await user.type(screen.getByLabelText(/amount paid/i), '9999');
    await user.click(screen.getByRole('button', { name: /save stay/i }));

    expect(await screen.findByText('Amount paid cannot exceed the total amount.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('submits a valid stay', async () => {
    const onSave = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<StayForm stay={null} dogs={dogs} stays={[]} onSave={onSave} onCancel={() => {}} />);

    await user.selectOptions(screen.getByLabelText(/select dog/i), ['dog-1']);
    const start = screen.getByLabelText(/start date/i);
    const end = screen.getByLabelText(/end date/i);
    await user.clear(start);
    await user.type(start, '2026-09-05');
    await user.clear(end);
    await user.type(end, '2026-09-10');
    await user.type(screen.getByLabelText(/daily rate/i), '50');
    await user.click(screen.getByRole('button', { name: /save stay/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).toMatchObject({ dog_id: 'dog-1', start_date: '2026-09-05', end_date: '2026-09-10', daily_rate: 50 });
  });
});
