import { describe, it, expect } from 'vitest';
import {
  totalAmountFor,
  remainingBalanceFor,
  paymentStatusFor,
  computePayment,
  PAYMENT_STATUS,
} from '../../src/utils/paymentCalculations';

describe('totalAmountFor', () => {
  it('computes the example from the spec: $50 x 5 days = $250', () => {
    expect(totalAmountFor(50, 5)).toBe(250);
  });

  it('returns 0 for zero days or zero rate', () => {
    expect(totalAmountFor(50, 0)).toBe(0);
    expect(totalAmountFor(0, 5)).toBe(0);
  });

  it('treats a negative rate as 0 rather than producing a negative total', () => {
    expect(totalAmountFor(-50, 5)).toBe(0);
  });

  it('rounds to the nearest cent', () => {
    expect(totalAmountFor(33.333, 3)).toBe(100);
  });
});

describe('remainingBalanceFor', () => {
  it('computes total minus paid', () => {
    expect(remainingBalanceFor(250, 100)).toBe(150);
  });

  it('floors at 0 when paid exceeds total', () => {
    expect(remainingBalanceFor(250, 400)).toBe(0);
  });

  it('treats a negative paid amount as 0', () => {
    expect(remainingBalanceFor(250, -50)).toBe(250);
  });
});

describe('paymentStatusFor', () => {
  it('is Not Paid when nothing has been paid', () => {
    expect(paymentStatusFor(250, 0)).toBe(PAYMENT_STATUS.NOT_PAID);
  });

  it('is Partially Paid for an amount between 0 and total', () => {
    expect(paymentStatusFor(250, 100)).toBe(PAYMENT_STATUS.PARTIALLY_PAID);
  });

  it('is Paid when amount paid equals total', () => {
    expect(paymentStatusFor(250, 250)).toBe(PAYMENT_STATUS.PAID);
  });

  it('is Paid when amount paid exceeds total', () => {
    expect(paymentStatusFor(250, 300)).toBe(PAYMENT_STATUS.PAID);
  });

  it('is Not Paid (not Paid) for a $0 total with $0 paid', () => {
    expect(paymentStatusFor(0, 0)).toBe(PAYMENT_STATUS.NOT_PAID);
  });
});

describe('computePayment', () => {
  it('combines total/remaining/status for a partially paid stay', () => {
    const result = computePayment(50, 5, 100);
    expect(result).toEqual({ total: 250, paid: 100, remaining: 150, status: PAYMENT_STATUS.PARTIALLY_PAID });
  });
});
