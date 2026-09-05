import { describe, it, expect } from 'vitest';
import {
  stayStatusFor,
  rangesOverlap,
  findOverlappingStay,
  computeStay,
  STAY_STATUS,
} from '../../src/utils/stayCalculations';

const FIXED_TODAY = new Date(2026, 8, 10); // Sep 10, 2026 — a fixed clock so tests never depend on the real date.

describe('stayStatusFor', () => {
  it('is upcoming when start is after today', () => {
    expect(stayStatusFor('2026-09-15', '2026-09-20', FIXED_TODAY)).toBe(STAY_STATUS.UPCOMING);
  });

  it('is completed when end is before today', () => {
    expect(stayStatusFor('2026-09-01', '2026-09-05', FIXED_TODAY)).toBe(STAY_STATUS.COMPLETED);
  });

  it('is current when today falls within the stay', () => {
    expect(stayStatusFor('2026-09-08', '2026-09-12', FIXED_TODAY)).toBe(STAY_STATUS.CURRENT);
  });

  it('is current on the first day of a stay that starts today', () => {
    expect(stayStatusFor('2026-09-10', '2026-09-15', FIXED_TODAY)).toBe(STAY_STATUS.CURRENT);
  });

  it('is current on the last day of a stay that ends today', () => {
    expect(stayStatusFor('2026-09-05', '2026-09-10', FIXED_TODAY)).toBe(STAY_STATUS.CURRENT);
  });

  it('is current for a same-day stay happening today', () => {
    expect(stayStatusFor('2026-09-10', '2026-09-10', FIXED_TODAY)).toBe(STAY_STATUS.CURRENT);
  });
});

describe('rangesOverlap', () => {
  it('detects overlapping ranges', () => {
    expect(rangesOverlap('2026-09-01', '2026-09-10', '2026-09-05', '2026-09-15')).toBe(true);
  });

  it('detects non-overlapping ranges', () => {
    expect(rangesOverlap('2026-09-01', '2026-09-05', '2026-09-06', '2026-09-10')).toBe(false);
  });

  it('treats touching end/start dates as overlapping (inclusive)', () => {
    expect(rangesOverlap('2026-09-01', '2026-09-05', '2026-09-05', '2026-09-10')).toBe(true);
  });
});

describe('findOverlappingStay', () => {
  const stays = [
    { id: 's1', dog_id: 'max', start_date: '2026-09-01', end_date: '2026-09-05' },
    { id: 's2', dog_id: 'bella', start_date: '2026-09-02', end_date: '2026-09-06' },
  ];

  it('finds an overlap for the same dog', () => {
    const found = findOverlappingStay(stays, 'max', '2026-09-03', '2026-09-04');
    expect(found?.id).toBe('s1');
  });

  it('ignores a different dog even if dates overlap', () => {
    const found = findOverlappingStay(stays, 'charlie', '2026-09-03', '2026-09-04');
    expect(found).toBeNull();
  });

  it('excludes the stay being edited', () => {
    const found = findOverlappingStay(stays, 'max', '2026-09-03', '2026-09-04', 's1');
    expect(found).toBeNull();
  });
});

describe('computeStay', () => {
  it('combines day count, payment, and status for a stay', () => {
    const stay = {
      start_date: '2026-09-05',
      end_date: '2026-09-10',
      daily_rate: 50,
      amount_paid: 100,
    };
    const result = computeStay(stay, FIXED_TODAY);
    expect(result.totalDays).toBe(5);
    expect(result.billingDays).toBe(5);
    expect(result.totalAmount).toBe(250);
    expect(result.remaining).toBe(150);
    expect(result.paymentStatus).toBe('Partially Paid');
    expect(result.status).toBe(STAY_STATUS.CURRENT);
  });

  it('bills a same-day stay as 1 day', () => {
    const stay = { start_date: '2026-09-10', end_date: '2026-09-10', daily_rate: 40, amount_paid: 0 };
    const result = computeStay(stay, FIXED_TODAY);
    expect(result.totalDays).toBe(0);
    expect(result.billingDays).toBe(1);
    expect(result.totalAmount).toBe(40);
  });
});
