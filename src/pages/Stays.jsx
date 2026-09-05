import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Check } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import SearchBar from '../components/ui/SearchBar';
import EmptyState from '../components/ui/EmptyState';
import Avatar from '../components/ui/Avatar';
import CalendarView from '../components/CalendarView';
import { fmtDate } from '../utils/dateCalculations';
import { fmtMoney } from '../utils/format';

const STATUS_STYLE = {
  current: 'border-l-4 border-amber-500 bg-amber-50 text-amber-800',
  upcoming: 'border-l-4 border-sky-500 bg-sky-50 text-sky-800',
  completed: 'border-l-4 border-stone-400 bg-stone-100 text-stone-600',
};
const STATUS_LABEL = { current: 'Current', upcoming: 'Upcoming', completed: 'Completed' };
const PAY_STYLE = {
  'Not Paid': 'bg-rose-100 text-rose-700',
  'Partially Paid': 'bg-amber-100 text-amber-700',
  Paid: 'bg-emerald-100 text-emerald-700',
};

function StayRow({ stay, dog, owner, calc, onClick, onMarkPaid }) {
  return (
    <div className="w-full rounded-xl p-4 flex items-center gap-4 bg-white border border-stone-200 hover:shadow-sm transition">
      <button onClick={onClick} className="flex items-center gap-4 flex-1 min-w-0 text-left min-h-[44px]">
        <Avatar photo={dog?.photo_url} size="sm" name={dog?.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-stone-900">{dog?.name || 'Unknown dog'}</p>
            <Badge className={STATUS_STYLE[calc.status]}>{STATUS_LABEL[calc.status]}</Badge>
          </div>
          <p className="text-sm text-stone-500">Owner: {owner?.name || 'Unknown'}</p>
          <p className="text-sm text-stone-500">
            {fmtDate(stay.start_date)} – {fmtDate(stay.end_date)} · {calc.totalDays} {calc.totalDays === 1 ? 'day' : 'days'}
          </p>
        </div>
      </button>
      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
        <p className="text-sm font-semibold text-stone-800">{fmtMoney(calc.totalAmount)}</p>
        <Badge className={PAY_STYLE[calc.paymentStatus]}>{calc.paymentStatus}</Badge>
        {calc.paymentStatus !== 'Paid' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkPaid(stay.id, calc.totalAmount);
            }}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1 min-h-[44px]"
          >
            <Check size={13} aria-hidden="true" /> Mark paid
          </button>
        )}
      </div>
    </div>
  );
}

export default function Stays() {
  const { dogs, staysCalc, openAddStay, openEditStay, markPaid } = useOutletContext();
  const [search, setSearch] = useState('');
  const [stayFilter, setStayFilter] = useState('all');
  const [view, setView] = useState('list');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  const filteredStays = staysCalc
    .filter((s) => stayFilter === 'all' || s.calc.status === stayFilter)
    .filter((s) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return s.dog?.name.toLowerCase().includes(q) || s.owner?.name.toLowerCase().includes(q);
    })
    .sort((a, b) => a.stay.start_date.localeCompare(b.stay.start_date));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h2 className="text-xl font-serif font-semibold text-stone-900">Dog-sitting stays</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-stone-300 overflow-hidden">
            <button
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              className={`px-3 py-2 min-h-[44px] text-sm font-medium ${view === 'list' ? 'bg-emerald-700 text-white' : 'bg-white text-stone-600'}`}
            >
              List
            </button>
            <button
              onClick={() => setView('calendar')}
              aria-pressed={view === 'calendar'}
              className={`px-3 py-2 min-h-[44px] text-sm font-medium ${view === 'calendar' ? 'bg-emerald-700 text-white' : 'bg-white text-stone-600'}`}
            >
              Calendar
            </button>
          </div>
          <Button onClick={openAddStay} disabled={dogs.length === 0}>
            <Plus size={16} aria-hidden="true" /> Add stay
          </Button>
        </div>
      </div>
      {dogs.length === 0 && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          Add a dog first before creating a stay.
        </p>
      )}

      {view === 'calendar' ? (
        <CalendarView
          month={calendarMonth}
          onPrevMonth={() => setCalendarMonth((mo) => new Date(mo.getFullYear(), mo.getMonth() - 1, 1))}
          onNextMonth={() => setCalendarMonth((mo) => new Date(mo.getFullYear(), mo.getMonth() + 1, 1))}
          onToday={() => {
            const t = new Date();
            setCalendarMonth(new Date(t.getFullYear(), t.getMonth(), 1));
          }}
          staysCalc={staysCalc}
          onSelectStay={openEditStay}
        />
      ) : (
        <>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by dog or owner name" label="Search stays" />
          <div className="flex gap-2 mt-3 mb-4 flex-wrap">
            {['all', 'current', 'upcoming', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setStayFilter(f)}
                aria-pressed={stayFilter === f}
                className={`text-sm px-3 py-1.5 min-h-[44px] rounded-full border capitalize ${
                  stayFilter === f ? 'bg-emerald-700 text-white border-emerald-700' : 'border-stone-300 text-stone-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {filteredStays.length === 0 ? (
            <EmptyState text="No stays match your filters." />
          ) : (
            <div className="space-y-3">
              {filteredStays.map((s) => (
                <StayRow key={s.stay.id} stay={s.stay} dog={s.dog} owner={s.owner} calc={s.calc} onClick={() => openEditStay(s.stay)} onMarkPaid={markPaid} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
