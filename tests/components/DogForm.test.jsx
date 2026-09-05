import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DogForm from '../../src/components/DogForm';

const owners = [{ id: 'owner-1', name: 'Jane Doe' }];

describe('DogForm', () => {
  it('shows a validation error and does not submit when the dog name is missing', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<DogForm dog={null} owners={owners} onSave={onSave} onCancel={() => {}} />);

    await user.click(screen.getByRole('button', { name: /save dog/i }));

    expect(await screen.findByText('Dog name is required.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('requires an owner to be selected when picking an existing owner', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<DogForm dog={null} owners={owners} onSave={onSave} onCancel={() => {}} />);

    await user.type(screen.getByLabelText(/dog name/i), 'Max');
    await user.selectOptions(screen.getByLabelText(/select owner/i), ['']); // explicitly clear
    await user.click(screen.getByRole('button', { name: /save dog/i }));

    expect(await screen.findByText('Please select an owner.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('submits valid data for a new dog with an existing owner', async () => {
    const onSave = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<DogForm dog={null} owners={owners} onSave={onSave} onCancel={() => {}} />);

    await user.type(screen.getByLabelText(/dog name/i), 'Max');
    await user.selectOptions(screen.getByLabelText(/select owner/i), ['owner-1']);
    await user.click(screen.getByRole('button', { name: /save dog/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const arg = onSave.mock.calls[0][0];
    expect(arg.dogData.name).toBe('Max');
    expect(arg.dogData.owner_id).toBe('owner-1');
    expect(arg.newOwner).toBeNull();
  });

  it('collects a new owner\'s name and phone when "New owner" is chosen', async () => {
    const onSave = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<DogForm dog={null} owners={owners} onSave={onSave} onCancel={() => {}} />);

    await user.type(screen.getByLabelText(/dog name/i), 'Bella');
    await user.click(screen.getByRole('button', { name: /new owner/i }));
    await user.click(screen.getByRole('button', { name: /save dog/i }));

    expect(await screen.findByText('Owner name is required.')).toBeInTheDocument();
    expect(screen.getByText('Phone number is required.')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/owner name/i), 'New Owner');
    await user.type(screen.getByLabelText(/phone number/i), '555-0000');
    await user.click(screen.getByRole('button', { name: /save dog/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].newOwner).toMatchObject({ name: 'New Owner', phone: '555-0000' });
  });

  it('rejects a negative age', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<DogForm dog={null} owners={owners} onSave={onSave} onCancel={() => {}} />);

    await user.type(screen.getByLabelText(/dog name/i), 'Max');
    await user.selectOptions(screen.getByLabelText(/select owner/i), ['owner-1']);
    await user.type(screen.getByLabelText(/^age/i), '-2');
    await user.click(screen.getByRole('button', { name: /save dog/i }));

    expect(await screen.findByText('Age must be a positive number.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
