import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Check, Trash2 } from 'lucide-react';
import Badge from '../components/ui/Badge';
import SearchBar from '../components/ui/SearchBar';
import EmptyState from '../components/ui/EmptyState';
import Avatar from '../components/ui/Avatar';
import { fmtDate } from '../utils/dateCalculations';
import { fmtMoney } from '../utils/format';

const PAY_STYLE = {
  'Not Paid': 'bg-rose-100 text-rose-700',
  'Partially Paid': 'bg-amber-100 text-amber-700',
  Paid: 'bg-emerald-100 text-emerald-700',
};

export default function History() {
  const { staysCalc, markPaid, requestDeleteStay } = useOutletContext();
  const [search, setSearch] = useState('');

  const completed = staysCalc
    .filter((s) => s.calc.status === 'completed')
    .filter((s) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return s.dog?.name.toLowerCase().includes(q) || s.owner?.name.toLowerCase().includes(q);
    })
    .sort((a, b) => b.stay.end_date.localeCompare(a.stay.end_date));

  return (
    <div>
      <h2 className="text-xl font-serif font-semibold text-stone-900 mb-5">History</h2>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by dog or owner name" label="Search history" />
      {completed.length === 0 ? (
        <EmptyState text="No completed stays yet." />
      ) : (
        <div className="space-y-3 mt-4">
          {completed.map(({ stay, dog, owner, calc }) => (
            <div key={stay.id} className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-4 flex-1 min-w-0 text-left">
                <Avatar photo={dog?.photo_url} size="sm" name={dog?.name} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-900">{dog?.name || 'Unknown dog'}</p>
                  <p className="text-sm text-stone-500">Owner: {owner?.name || 'Unknown'}</p>
                  <p className="text-sm text-stone-500">
                    {fmtDate(stay.start_date)} – {fmtDate(stay.end_date)} · {calc.totalDays} {calc.totalDays === 1 ? 'day' : 'days'} ·{' '}
                    {fmtMoney(stay.daily_rate)}/day
                  </p>
                </div>
              </div>
              {/* Payment summary: a row on mobile (so it's never hidden — a
                  daughter checking history on her phone still needs to see
                  what's been paid), a right-aligned column on larger screens. */}
              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 sm:gap-1 shrink-0">
                <div className="flex items-center gap-2 sm:flex-col sm:items-end text-sm text-stone-500">
                  <span>Total {fmtMoney(calc.totalAmount)}</span>
                  <span>Paid {fmtMoney(calc.amountPaid)}</span>
                </div>
                <Badge className={PAY_STYLE[calc.paymentStatus]}>{calc.paymentStatus}</Badge>
              </div>
              <div className="flex items-center justify-end gap-3 sm:flex-col sm:items-end sm:gap-1.5 shrink-0">
                {calc.paymentStatus !== 'Paid' && (
                  <button
                    onClick={() => markPaid(stay.id, calc.totalAmount)}
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1 min-h-[44px]"
                  >
                    <Check size={13} aria-hidden="true" /> Mark paid
                  </button>
                )}
                <button
                  onClick={() => requestDeleteStay(stay, dog?.name)}
                  className="text-stone-400 hover:text-rose-600 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={`Delete stay for ${dog?.name || 'this dog'}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
