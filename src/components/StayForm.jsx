import { useState } from 'react';
import Field, { inputCls } from './ui/Field';
import Button from './ui/Button';
import { InlineBanner } from './ui/ErrorState';
import { totalDaysFor, billingDaysFor, isValidDateRange, toISO } from '../utils/dateCalculations';
import { totalAmountFor, remainingBalanceFor } from '../utils/paymentCalculations';
import { findOverlappingStay } from '../utils/stayCalculations';
import { fmtMoney } from '../utils/format';
import { AlertTriangle } from 'lucide-react';

export default function StayForm({ stay, dogs, stays, onSave, onCancel, onDelete }) {
  const [dogId, setDogId] = useState(stay?.dog_id || dogs[0]?.id || '');
  const [startDate, setStartDate] = useState(stay?.start_date || toISO(new Date()));
  const [endDate, setEndDate] = useState(stay?.end_date || toISO(new Date()));
  const [dropOff, setDropOff] = useState(stay?.drop_off_time || '');
  const [pickup, setPickup] = useState(stay?.pickup_time || '');
  const [notes, setNotes] = useState(stay?.notes || '');
  const [dailyRate, setDailyRate] = useState(stay?.daily_rate ?? '');
  const [amountPaid, setAmountPaid] = useState(stay?.amount_paid ?? '');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const totalDays = totalDaysFor(startDate, endDate) ?? 0;
  const billingDays = billingDaysFor(startDate, endDate) ?? 0;
  const rateNum = Number(dailyRate) || 0;
  const paidNum = Number(amountPaid) || 0;
  const totalAmount = totalAmountFor(rateNum, billingDays);
  const remaining = remainingBalanceFor(totalAmount, paidNum);
  const dogName = dogs.find((d) => d.id === dogId)?.name || 'This dog';
  const overlap = findOverlappingStay(stays || [], dogId, startDate, endDate, stay?.id);

  const validate = () => {
    const e = {};
    if (!dogId) e.dogId = 'Please select a dog.';
    if (!startDate) e.startDate = 'Start date is required.';
    if (!endDate) e.endDate = 'End date is required.';
    if (startDate && endDate && !isValidDateRange(startDate, endDate)) {
      e.endDate = 'End date must be on or after the start date.';
    }
    if (dailyRate !== '' && rateNum < 0) e.dailyRate = 'Daily rate cannot be negative.';
    if (dailyRate === '') e.dailyRate = 'Daily rate is required.';
    if (amountPaid !== '' && paidNum < 0) e.amountPaid = 'Amount paid cannot be negative.';
    if (paidNum > totalAmount) e.amountPaid = 'Amount paid cannot exceed the total amount.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        id: stay?.id,
        dog_id: dogId,
        start_date: startDate,
        end_date: endDate,
        drop_off_time: dropOff || null,
        pickup_time: pickup || null,
        notes: notes.trim(),
        daily_rate: rateNum,
        amount_paid: paidNum,
      });
    } catch (err) {
      setSubmitError(err.message || 'Unable to save this stay. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <InlineBanner message={submitError} />
      <Field label="Select dog" required error={errors.dogId} htmlFor="stay-dog">
        <select id="stay-dog" className={inputCls} value={dogId} onChange={(e) => setDogId(e.target.value)}>
          <option value="">Choose a dog...</option>
          {dogs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Start date" required error={errors.startDate} htmlFor="stay-start">
          <input id="stay-start" type="date" className={inputCls} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="End date" required error={errors.endDate} htmlFor="stay-end">
          <input id="stay-end" type="date" className={inputCls} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Drop-off time" optional htmlFor="stay-dropoff">
          <input id="stay-dropoff" type="time" className={inputCls} value={dropOff} onChange={(e) => setDropOff(e.target.value)} />
        </Field>
        <Field label="Pick-up time" optional htmlFor="stay-pickup">
          <input id="stay-pickup" type="time" className={inputCls} value={pickup} onChange={(e) => setPickup(e.target.value)} />
        </Field>
      </div>
      {overlap && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2.5 mb-4 text-sm text-amber-800" role="alert">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            {dogName} already has a stay that overlaps these dates. You can still save, but double-check this is intentional.
          </span>
        </div>
      )}
      <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 mb-4 text-sm text-stone-700">
        Total stay: <span className="font-semibold">{totalDays} {totalDays === 1 ? 'day' : 'days'}</span>
        {totalDays === 0 && <span className="text-stone-500"> (billed as 1 day)</span>}
      </div>
      <Field label="Notes" optional htmlFor="stay-notes">
        <textarea id="stay-notes" className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything special about this stay" />
      </Field>
      <div className="border-t border-stone-200 pt-4 mt-2">
        <h3 className="font-serif font-semibold text-stone-900 mb-3">Payment</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Daily rate ($)" required error={errors.dailyRate} htmlFor="stay-rate">
            <input id="stay-rate" type="number" min="0" step="0.01" className={inputCls} value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} placeholder="50" />
          </Field>
          <Field label="Amount paid ($)" optional error={errors.amountPaid} htmlFor="stay-paid">
            <input id="stay-paid" type="number" min="0" step="0.01" className={inputCls} value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0" />
          </Field>
        </div>
        <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-sm text-stone-700 space-y-1">
          <div className="flex justify-between">
            <span>Total amount</span>
            <span className="font-semibold">{fmtMoney(totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Remaining balance</span>
            <span className="font-semibold">{fmtMoney(remaining)}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save stay'}
        </Button>
      </div>
      {stay && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="mt-3 text-sm text-rose-600 hover:text-rose-700 flex items-center gap-1 min-h-[44px]"
        >
          Delete this stay
        </button>
      )}
    </form>
  );
}
