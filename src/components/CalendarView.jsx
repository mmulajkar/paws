import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, toISO, fmtDate, parseISO, todayStart } from '../utils/dateCalculations';

const DOT_CLASS = { current: 'bg-amber-500', upcoming: 'bg-sky-500', completed: 'bg-stone-400' };

export default function CalendarView({ month, onPrevMonth, onNextMonth, onToday, staysCalc, onSelectStay }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstOfMonth = new Date(year, m, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = addDays(firstOfMonth, -startOffset);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const today = todayStart();
  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const staysForDay = (day) =>
    staysCalc.filter((s) => {
      const st = parseISO(s.stay.start_date);
      const en = parseISO(s.stay.end_date);
      return day >= st && day <= en;
    });

  const selectedDayStays = selectedDay ? staysForDay(selectedDay) : [];

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrevMonth} aria-label="Previous month" className="p-2 min-h-[44px] min-w-[44px] rounded-lg hover:bg-stone-100 text-stone-600">
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <h3 className="font-serif font-semibold text-stone-900">{monthLabel}</h3>
          <button
            onClick={onToday}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 border border-emerald-200 bg-emerald-50 rounded-full px-2.5 py-1 min-h-[32px]"
          >
            Today
          </button>
        </div>
        <button onClick={onNextMonth} aria-label="Next month" className="p-2 min-h-[44px] min-w-[44px] rounded-lg hover:bg-stone-100 text-stone-600">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-stone-400 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          const inMonth = day.getMonth() === m;
          const isToday = day.getTime() === today.getTime();
          const isSelected = selectedDay && day.getTime() === selectedDay.getTime();
          const dayStays = staysForDay(day);
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedDay(dayStays.length ? day : null)}
              aria-label={`${day.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}${dayStays.length ? `, ${dayStays.length} stay${dayStays.length === 1 ? '' : 's'}` : ''}`}
              className={`min-h-[56px] sm:min-h-[76px] rounded-lg border p-1 text-left ${inMonth ? 'border-stone-100' : 'border-transparent'} ${
                isToday ? 'bg-emerald-50 border-emerald-300' : 'bg-white'
              } ${isSelected ? 'ring-2 ring-emerald-500' : ''}`}
            >
              <span className={`text-xs px-1 ${inMonth ? 'text-stone-600' : 'text-stone-300'} ${isToday ? 'font-semibold text-emerald-700' : ''}`}>
                {day.getDate()}
              </span>
              {dayStays.length > 0 && (
                <div className="flex gap-0.5 mt-1 px-1 flex-wrap">
                  {dayStays.slice(0, 4).map(({ stay, calc }) => (
                    <span key={stay.id} className={`w-1.5 h-1.5 rounded-full ${DOT_CLASS[calc.status]}`} aria-hidden="true" />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-stone-100 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" /> Current
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-500" aria-hidden="true" /> Upcoming
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-stone-400" aria-hidden="true" /> Completed
        </span>
      </div>

      {selectedDay && selectedDayStays.length > 0 && (
        <div className="mt-4 pt-4 border-t border-stone-200">
          <p className="text-sm font-medium text-stone-700 mb-2">{fmtDate(toISO(selectedDay))}</p>
          <div className="space-y-2">
            {selectedDayStays.map(({ stay, dog }) => (
              <button
                key={stay.id}
                onClick={() => onSelectStay(stay)}
                className="w-full text-left flex items-center gap-2 text-sm px-3 py-2.5 min-h-[44px] rounded-lg hover:bg-stone-50 border border-stone-200"
              >
                <span className="font-medium text-stone-900">{dog?.name || 'Dog'}</span>
                <span className="text-stone-400">·</span>
                <span className="text-stone-500">
                  {fmtDate(stay.start_date)} – {fmtDate(stay.end_date)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
