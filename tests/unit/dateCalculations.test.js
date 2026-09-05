import { describe, it, expect } from 'vitest';
import {
  parseISO,
  toISO,
  totalDaysFor,
  billingDaysFor,
  isValidDateRange,
  todayISO,
  fmtDate,
} from '../../src/utils/dateCalculations';

describe('totalDaysFor', () => {
  it('computes the example from the spec: Sep 5 -> Sep 10 = 5 days', () => {
    expect(totalDaysFor('2026-09-05', '2026-09-10')).toBe(5);
  });

  it('returns 0 raw days for a same-day stay', () => {
    expect(totalDaysFor('2026-09-05', '2026-09-05')).toBe(0);
  });

  it('computes a one-day span correctly', () => {
    expect(totalDaysFor('2026-09-05', '2026-09-06')).toBe(1);
  });

  it('handles a span crossing months', () => {
    expect(totalDaysFor('2026-01-28', '2026-02-03')).toBe(6);
  });

  it('handles a span crossing years', () => {
    expect(totalDaysFor('2025-12-30', '2026-01-02')).toBe(3);
  });

  it('returns null for invalid dates', () => {
    expect(totalDaysFor('not-a-date', '2026-09-10')).toBeNull();
    expect(totalDaysFor('2026-02-30', '2026-03-01')).toBeNull();
  });

  it('floors at 0 for an end date before the start date (validation should reject this upstream)', () => {
    expect(totalDaysFor('2026-09-10', '2026-09-05')).toBe(0);
  });
});

describe('billingDaysFor', () => {
  it('bills a same-day stay as a minimum of 1 day', () => {
    expect(billingDaysFor('2026-09-05', '2026-09-05')).toBe(1);
  });

  it('matches totalDaysFor when the span is more than 0 days', () => {
    expect(billingDaysFor('2026-09-05', '2026-09-10')).toBe(5);
  });
});

describe('isValidDateRange', () => {
  it('accepts end date on or after start date', () => {
    expect(isValidDateRange('2026-09-05', '2026-09-05')).toBe(true);
    expect(isValidDateRange('2026-09-05', '2026-09-06')).toBe(true);
  });

  it('rejects end date before start date', () => {
    expect(isValidDateRange('2026-09-10', '2026-09-05')).toBe(false);
  });

  it('rejects invalid dates', () => {
    expect(isValidDateRange('bogus', '2026-09-05')).toBe(false);
  });
});

describe('parseISO / toISO round-trip', () => {
  it('round-trips a date string', () => {
    expect(toISO(parseISO('2026-09-05'))).toBe('2026-09-05');
  });
});

describe('todayISO', () => {
  it('uses an injected clock rather than the real one', () => {
    expect(todayISO(new Date(2026, 8, 5, 23, 59))).toBe('2026-09-05');
  });
});

describe('fmtDate', () => {
  it('formats an ISO date for display', () => {
    expect(fmtDate('2026-09-05')).toBe('Sep 5, 2026');
  });

  it('returns an empty string for missing/invalid input', () => {
    expect(fmtDate('')).toBe('');
    expect(fmtDate(null)).toBe('');
  });
});
