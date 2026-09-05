import { parseISO, totalDaysFor, billingDaysFor, todayISO } from './dateCalculations';
import { computePayment } from './paymentCalculations';

export const STAY_STATUS = {
  UPCOMING: 'upcoming',
  CURRENT: 'current',
  COMPLETED: 'completed',
};

export const STAY_STATUS_LABEL = {
  [STAY_STATUS.UPCOMING]: 'Upcoming',
  [STAY_STATUS.CURRENT]: 'Current',
  [STAY_STATUS.COMPLETED]: 'Completed',
};

/**
 * Upcoming: start is after today.
 * Completed: end is before today.
 * Current: everything else (today falls within [start, end], inclusive).
 */
export function stayStatusFor(startISO, endISO, now = new Date()) {
  const today = todayISO(now);
  if (today < startISO) return STAY_STATUS.UPCOMING;
  if (today > endISO) return STAY_STATUS.COMPLETED;
  return STAY_STATUS.CURRENT;
}

/** Does [aStart,aEnd] overlap [bStart,bEnd]? (inclusive on both ends) */
export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  const aS = parseISO(aStart), aE = parseISO(aEnd);
  const bS = parseISO(bStart), bE = parseISO(bEnd);
  if (!aS || !aE || !bS || !bE) return false;
  return !(aE < bS || aS > bE);
}

/** Find another stay for the same dog that overlaps these dates (excluding excludeId). */
export function findOverlappingStay(stays, dogId, startISO, endISO, excludeId) {
  if (!dogId || !startISO || !endISO) return null;
  return (
    stays.find(
      (s) => s.id !== excludeId && s.dog_id === dogId && rangesOverlap(startISO, endISO, s.start_date, s.end_date)
    ) || null
  );
}

/**
 * Full derived-state computation for a single stay row.
 * Nothing here is persisted — it's recomputed every time from start_date,
 * end_date, daily_rate and amount_paid so the numbers can never drift out
 * of sync with the underlying record.
 */
export function computeStay(stay, now = new Date()) {
  const totalDays = totalDaysFor(stay.start_date, stay.end_date);
  const billingDays = billingDaysFor(stay.start_date, stay.end_date);
  const pay = computePayment(stay.daily_rate, billingDays, stay.amount_paid);
  const status = stayStatusFor(stay.start_date, stay.end_date, now);
  return {
    totalDays,
    billingDays,
    totalAmount: pay.total,
    amountPaid: pay.paid,
    remaining: pay.remaining,
    paymentStatus: pay.status,
    status,
  };
}
