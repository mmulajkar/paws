import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { ChevronLeft, Pencil, Trash2, Phone, Mail } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
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

function InfoRow({ icon: Icon, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 text-sm text-stone-700 py-1">
      <Icon size={15} className="text-stone-400 mt-0.5 shrink-0" aria-hidden="true" />
      <span>{value}</span>
    </div>
  );
}

function CareBlock({ title, children }) {
  const content = Array.isArray(children) ? children.filter(Boolean) : children;
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1.5">{title}</p>
      <div className="text-sm text-stone-700 space-y-1">{content}</div>
    </div>
  );
}

export default function DogProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dogById, ownerById, staysCalc, openEditDog, requestDeleteDog } = useOutletContext();

  const dog = dogById.get(id);

  if (!dog) {
    return (
      <div>
        <button onClick={() => navigate('/dogs')} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-4 min-h-[44px]">
          <ChevronLeft size={16} aria-hidden="true" /> Back to dogs
        </button>
        <EmptyState text="This dog record was not found. It may have been deleted from another device." />
      </div>
    );
  }

  const owner = ownerById.get(dog.owner_id);
  const dogStays = staysCalc
    .filter((s) => s.stay.dog_id === dog.id)
    .sort((a, b) => b.stay.start_date.localeCompare(a.stay.start_date));

  return (
    <div>
      <button onClick={() => navigate('/dogs')} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-4 min-h-[44px]">
        <ChevronLeft size={16} aria-hidden="true" /> Back to dogs
      </button>
      <div className="bg-white rounded-xl border border-stone-200 p-5 mb-5">
        <div className="flex flex-col sm:flex-row gap-5">
          <Avatar photo={dog.photo_url} size="lg" name={dog.name} />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-serif font-semibold text-stone-900">{dog.name}</h2>
                <p className="text-stone-500 text-sm">
                  {[dog.breed, dog.age != null && `${dog.age} yrs`, dog.gender].filter(Boolean).join(' · ') || 'No details added'}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="secondary" onClick={() => openEditDog(dog)}>
                  <Pencil size={14} aria-hidden="true" /> Edit
                </Button>
                <Button variant="danger" onClick={() => requestDeleteDog(dog)} aria-label={`Delete ${dog.name}`}>
                  <Trash2 size={14} aria-hidden="true" />
                </Button>
              </div>
            </div>
            {dog.notes && <p className="text-sm text-stone-600 mt-3">{dog.notes}</p>}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mt-6 pt-5 border-t border-stone-200">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Owner</p>
            <p className="font-medium text-stone-900">{owner?.name || 'Unknown'}</p>
            <InfoRow icon={Phone} value={owner?.phone} />
            <InfoRow icon={Mail} value={owner?.email} />
            {(owner?.emergency_contact || owner?.emergency_phone) && (
              <div className="mt-2 pt-2 border-t border-stone-100">
                <p className="text-xs text-stone-400 mb-1">Emergency contact</p>
                <p className="text-sm text-stone-700">
                  {owner.emergency_contact} {owner.emergency_phone && `· ${owner.emergency_phone}`}
                </p>
              </div>
            )}
            {owner?.notes && <p className="text-sm text-stone-600 mt-2">{owner.notes}</p>}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Care instructions</p>
            <CareBlock title="Feeding">
              {dog.food_type && <p>{dog.food_type}</p>}
              {dog.feeding_instructions && <p>{dog.feeding_instructions}</p>}
              {!dog.food_type && !dog.feeding_instructions && <p className="text-stone-400">Not provided.</p>}
            </CareBlock>
            <CareBlock title="Walking">
              {dog.walks_per_day != null && <p>{dog.walks_per_day}x per day</p>}
              {dog.walking_instructions && <p>{dog.walking_instructions}</p>}
              {dog.walks_per_day == null && !dog.walking_instructions && <p className="text-stone-400">Not provided.</p>}
            </CareBlock>
            <CareBlock title="Special instructions">
              <p>{dog.special_instructions || <span className="text-stone-400">Not provided.</span>}</p>
            </CareBlock>
            <CareBlock title="Medical">
              {dog.allergies && <p>Allergies: {dog.allergies}</p>}
              {dog.medications && <p>Medications: {dog.medications}</p>}
              {dog.medical_notes && <p>{dog.medical_notes}</p>}
              {!dog.allergies && !dog.medications && !dog.medical_notes && <p className="text-stone-400">Not provided.</p>}
            </CareBlock>
          </div>
        </div>
      </div>

      <h3 className="font-serif font-semibold text-stone-900 mb-3">Stay history for {dog.name}</h3>
      {dogStays.length === 0 ? (
        <EmptyState text="No stays recorded for this dog yet." />
      ) : (
        <div className="space-y-3">
          {dogStays.map(({ stay, calc }) => (
            <div key={stay.id} className="bg-white rounded-xl border border-stone-200 p-4 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge className={STATUS_STYLE[calc.status]}>{STATUS_LABEL[calc.status]}</Badge>
                  <Badge className={PAY_STYLE[calc.paymentStatus]}>{calc.paymentStatus}</Badge>
                </div>
                <p className="text-sm text-stone-600">
                  {fmtDate(stay.start_date)} – {fmtDate(stay.end_date)} · {calc.totalDays} {calc.totalDays === 1 ? 'day' : 'days'}
                </p>
              </div>
              <p className="font-semibold text-stone-800">{fmtMoney(calc.totalAmount)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
