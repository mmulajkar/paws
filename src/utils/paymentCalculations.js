// Payment math. Kept dependency-free and pure so it's trivial to unit test.

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Total amount owed for a stay.
 * Total Amount = Daily Rate x Number of (billing) Days.
 * Negative inputs are treated as 0 rather than allowed to flip the sign —
 * real negative values should be rejected by form validation before this
 * is ever called; this is a defensive floor, not a substitute for validation.
 */
export function totalAmountFor(dailyRate, billingDays) {
  const rate = Math.max(0, Number(dailyRate) || 0);
  const days = Math.max(0, Number(billingDays) || 0);
  return round2(rate * days);
}

/** Remaining Balance = Total Amount - Amount Paid, floored at 0. */
export function remainingBalanceFor(totalAmount, amountPaid) {
  const total = Number(totalAmount) || 0;
  const paid = Math.max(0, Number(amountPaid) || 0);
  return round2(Math.max(total - paid, 0));
}

export const PAYMENT_STATUS = {
  NOT_PAID: 'Not Paid',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
};

/**
 * Not Paid: amount paid is 0 (or less, defensively).
 * Paid: amount paid >= total AND total > 0 (a $0 stay is never "Paid").
 * Partially Paid: anything in between.
 */
export function paymentStatusFor(totalAmount, amountPaid) {
  const total = Number(totalAmount) || 0;
  const paid = Number(amountPaid) || 0;
  if (paid <= 0) return PAYMENT_STATUS.NOT_PAID;
  if (paid >= total && total > 0) return PAYMENT_STATUS.PAID;
  if (paid >= total && total === 0) return PAYMENT_STATUS.NOT_PAID;
  return PAYMENT_STATUS.PARTIALLY_PAID;
}

/** Convenience: compute total, remaining, and status together. */
export function computePayment(dailyRate, billingDays, amountPaid) {
  const total = totalAmountFor(dailyRate, billingDays);
  const paid = round2(Math.max(0, Number(amountPaid) || 0));
  const remaining = remainingBalanceFor(total, paid);
  const status = paymentStatusFor(total, paid);
  return { total, paid, remaining, status };
}
