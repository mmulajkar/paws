import { useOutletContext, useNavigate } from 'react-router-dom';
import { Plus, Check } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Avatar from '../components/ui/Avatar';
import { fmtDate } from '../utils/dateCalculations';
import { fmtMoney } from '../utils/format';

const STATUS_LABEL = { current: 'Current', upcoming: 'Upcoming', completed: 'Completed' };
const PAY_STYLE = {
  'Not Paid': 'bg-rose-100 text-rose-700',
  'Partially Paid': 'bg-amber-100 text-amber-700',
  Paid: 'bg-emerald-100 text-emerald-700',
};

function MetricCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <p className="text-xs font-medium text-stone-500 mb-1">{label}</p>
      <p className="text-2xl font-serif font-semibold text-stone-900">{value}</p>
    </div>
  );
}

function DogStayCard({ entry, borderClass, onOpenDog, onMarkPaid, showBadge }) {
  const { stay, dog, owner, calc } = entry;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenDog(dog?.id)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenDog(dog?.id)}
      className={`cursor-pointer bg-white rounded-xl border border-stone-200 border-l-4 ${borderClass} p-4 hover:shadow-sm transition`}
    >
      <div className="flex items-center gap-3 mb-2">
        <Avatar photo={dog?.photo_url} size="sm" name={dog?.name} />
        <div>
          <p className="font-medium text-stone-900">{dog?.name}</p>
          <p className="text-xs text-stone-500">Owner: {owner?.name}</p>
        </div>
      </div>
      <p className="text-sm text-stone-600">
        {fmtDate(stay.start_date)} – {fmtDate(stay.end_date)} · {calc.totalDays} {calc.totalDays === 1 ? 'day' : 'days'}
      </p>
      {showBadge === 'money' && (
        <>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-stone-700">{fmtMoney(stay.daily_rate)}/day</span>
            <span className="text-sm font-semibold text-stone-900">{fmtMoney(calc.totalAmount)}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
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
        </>
      )}
      {showBadge === 'upcoming' && (
        <div className="mt-2">
          <Badge className="bg-sky-100 text-sky-700">{STATUS_LABEL.upcoming}</Badge>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { staysCalc, markPaid, openAddStay } = useOutletContext();
  const navigate = useNavigate();

  const current = staysCalc.filter((s) => s.calc.status === 'current');
  const upcoming = staysCalc
    .filter((s) => s.calc.status === 'upcoming')
    .sort((a, b) => a.stay.start_date.localeCompare(b.stay.start_date));

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonth = staysCalc.filter((s) => s.stay.start_date.startsWith(monthPrefix));
  const totalDaysThisMonth = thisMonth.reduce((sum, s) => sum + s.calc.billingDays, 0);
  const earningsThisMonth = thisMonth.reduce((sum, s) => sum + s.calc.totalAmount, 0);

  const onOpenDog = (id) => id && navigate(`/dogs/${id}`);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-serif font-semibold text-stone-900">Dashboard</h2>
        <Button onClick={openAddStay}>
          <Plus size={16} aria-hidden="true" /> Add stay
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <MetricCard label="Current dogs" value={current.length} />
        <MetricCard label="Upcoming stays" value={upcoming.length} />
        <MetricCard label="Days this month" value={totalDaysThisMonth} />
        <MetricCard label="Earnings this month" value={fmtMoney(earningsThisMonth)} />
      </div>

      <section className="mb-8">
        <h3 className="font-serif font-semibold text-stone-900 mb-3">Currently being cared for</h3>
        {current.length === 0 ? (
          <EmptyState text="No dogs are currently being cared for." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {current.map((entry) => (
              <DogStayCard key={entry.stay.id} entry={entry} borderClass="border-l-amber-500" onOpenDog={onOpenDog} onMarkPaid={markPaid} showBadge="money" />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="font-serif font-semibold text-stone-900 mb-3">Upcoming stays</h3>
        {upcoming.length === 0 ? (
          <EmptyState text="No upcoming stays scheduled." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {upcoming.map((entry) => (
              <DogStayCard key={entry.stay.id} entry={entry} borderClass="border-l-sky-500" onOpenDog={onOpenDog} showBadge="upcoming" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
