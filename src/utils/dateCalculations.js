// Date helpers and the "number of days" business rule.
//
// Business rule (confirmed against the original app + real usage):
//   Number of Days = End Date - Start Date
//   A same-day stay (start === end) still bills as a minimum of 1 day.
//
// All dates in this app are plain "YYYY-MM-DD" strings. We parse them as
// local calendar dates (not UTC) so a stay from Sep 5 to Sep 10 is always
// "Sep 5 to Sep 10" regardless of the browser's timezone.

/** Parse a "YYYY-MM-DD" string into a local Date at midnight. */
export function parseISO(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  // Guard against JS's date rollover for invalid dates like 2026-02-30.
  if (date.getFullYear() !== Number(y) || date.getMonth() !== Number(mo) - 1 || date.getDate() !== Number(d)) {
    return null;
  }
  return date;
}

/** Format a Date (local) back to "YYYY-MM-DD". */
export function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function todayStart(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function todayISO(now = new Date()) {
  return toISO(todayStart(now));
}

export function fmtDate(iso) {
  const d = parseISO(iso);
  if (!d) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtDateShort(iso) {
  const d = parseISO(iso);
  if (!d) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function fmtRange(startISO, endISO) {
  return `${fmtDateShort(startISO)} – ${fmtDateShort(endISO)}`;
}

export function fmtTime(t) {
  if (!t) return '';
  const [hStr, m] = t.split(':');
  let h = parseInt(hStr, 10);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ap}`;
}

/**
 * Raw number of days between two ISO date strings (End - Start).
 * Returns null if either date is invalid. Never negative (floored at 0);
 * validation elsewhere is responsible for rejecting end < start.
 */
export function totalDaysFor(startISO, endISO) {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  if (!s || !e) return null;
  const days = Math.round((e - s) / 86400000);
  return days < 0 ? 0 : days;
}

/**
 * Days used for billing: same as totalDaysFor, but a same-day stay
 * (0 raw days) bills as a minimum of 1 day. This matches the existing,
 * already-in-production business rule — a drop-off and pick-up on the
 * same calendar day is still one day of care.
 */
export function billingDaysFor(startISO, endISO) {
  const days = totalDaysFor(startISO, endISO);
  if (days === null) return null;
  return days === 0 ? 1 : days;
}

export function isValidDateRange(startISO, endISO) {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  if (!s || !e) return false;
  return e >= s;
}
