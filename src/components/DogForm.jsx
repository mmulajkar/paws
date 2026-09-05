import { useState } from 'react';
import Field, { inputCls } from './ui/Field';
import Button from './ui/Button';
import PhotoUpload from './ui/PhotoUpload';
import { InlineBanner } from './ui/ErrorState';
import { removeDogPhoto } from '../services/photosService';

export default function DogForm({ dog, owners, onSave, onCancel }) {
  const [name, setName] = useState(dog?.name || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [breed, setBreed] = useState(dog?.breed || '');
  const [age, setAge] = useState(dog?.age ?? '');
  const [gender, setGender] = useState(dog?.gender || '');
  const [notes, setNotes] = useState(dog?.notes || '');
  const [ownerMode, setOwnerMode] = useState(dog ? 'existing' : owners.length ? 'existing' : 'new');
  const [ownerId, setOwnerId] = useState(dog?.owner_id || owners[0]?.id || '');
  const [oName, setOName] = useState('');
  const [oPhone, setOPhone] = useState('');
  const [oEmail, setOEmail] = useState('');
  const [oEmContact, setOEmContact] = useState('');
  const [oEmPhone, setOEmPhone] = useState('');
  const [oNotes, setONotes] = useState('');
  const [foodType, setFoodType] = useState(dog?.food_type || '');
  const [feedingInstructions, setFeedingInstr] = useState(dog?.feeding_instructions || '');
  const [walksPerDay, setWalksPerDay] = useState(dog?.walks_per_day ?? '');
  const [walkingInstructions, setWalkingInstr] = useState(dog?.walking_instructions || '');
  const [specialInstructions, setSpecialInstr] = useState(dog?.special_instructions || '');
  const [allergies, setAllergies] = useState(dog?.allergies || '');
  const [medications, setMedications] = useState(dog?.medications || '');
  const [medicalNotes, setMedicalNotes] = useState(dog?.medical_notes || '');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Dog name is required.';
    if (ownerMode === 'existing' && !ownerId) e.owner = 'Please select an owner.';
    if (ownerMode === 'new') {
      if (!oName.trim()) e.oName = 'Owner name is required.';
      if (!oPhone.trim()) e.oPhone = 'Phone number is required.';
    }
    if (age !== '' && (Number.isNaN(Number(age)) || Number(age) < 0)) e.age = 'Age must be a positive number.';
    if (walksPerDay !== '' && (Number.isNaN(Number(walksPerDay)) || Number(walksPerDay) < 0)) {
      e.walksPerDay = 'Walks per day must be a positive number.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setSaving(true);
    try {
      const dogData = {
        id: dog?.id,
        owner_id: ownerMode === 'existing' ? ownerId : undefined,
        name: name.trim(),
        breed: breed.trim(),
        age: age === '' ? null : Number(age),
        gender,
        notes: notes.trim(),
        food_type: foodType.trim(),
        feeding_instructions: feedingInstructions.trim(),
        walks_per_day: walksPerDay === '' ? null : Number(walksPerDay),
        walking_instructions: walkingInstructions.trim(),
        special_instructions: specialInstructions.trim(),
        allergies: allergies.trim(),
        medications: medications.trim(),
        medical_notes: medicalNotes.trim(),
      };

      const newOwner =
        ownerMode === 'new'
          ? {
              name: oName.trim(),
              phone: oPhone.trim(),
              email: oEmail.trim(),
              emergency_contact: oEmContact.trim(),
              emergency_phone: oEmPhone.trim(),
              notes: oNotes.trim(),
            }
          : null;

      let photoUrl = dog?.photo_url || '';
      if (photoRemoved) {
        await removeDogPhoto(dog?.photo_url);
        photoUrl = '';
      }

      await onSave({ dogData, newOwner, photoFile, previousPhotoUrl: dog?.photo_url, photoRemoved, photoUrlIfNoChange: photoUrl });
    } catch (err) {
      setSubmitError(err.message || 'Unable to save this dog. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <InlineBanner message={submitError} />
      <PhotoUpload
        previewUrl={dog?.photo_url}
        onFileSelected={(file) => {
          setPhotoFile(file);
          setPhotoRemoved(false);
        }}
        onRemove={() => {
          setPhotoFile(null);
          setPhotoRemoved(true);
        }}
      />
      <div className="h-4" />
      <Field label="Dog name" required error={errors.name} htmlFor="dog-name">
        <input id="dog-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Max" />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Breed" optional htmlFor="dog-breed">
          <input id="dog-breed" className={inputCls} value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Golden Retriever" />
        </Field>
        <Field label="Age" optional error={errors.age} htmlFor="dog-age">
          <input id="dog-age" type="number" min="0" className={inputCls} value={age} onChange={(e) => setAge(e.target.value)} placeholder="4" />
        </Field>
      </div>
      <Field label="Gender" optional htmlFor="dog-gender">
        <select id="dog-gender" className={inputCls} value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Not specified</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </Field>
      <Field label="Notes" optional htmlFor="dog-notes">
        <textarea id="dog-notes" className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything else worth knowing" />
      </Field>

      <div className="border-t border-stone-200 pt-4 mt-2 mb-2">
        <h3 className="font-serif font-semibold text-stone-900 mb-3">Owner</h3>
        {owners.length > 0 && (
          <div className="flex gap-2 mb-3" role="group" aria-label="Owner selection mode">
            <button
              type="button"
              onClick={() => setOwnerMode('existing')}
              className={`text-sm px-3 py-1.5 min-h-[44px] rounded-full border ${ownerMode === 'existing' ? 'bg-emerald-700 text-white border-emerald-700' : 'border-stone-300 text-stone-600'}`}
            >
              Existing owner
            </button>
            <button
              type="button"
              onClick={() => setOwnerMode('new')}
              className={`text-sm px-3 py-1.5 min-h-[44px] rounded-full border ${ownerMode === 'new' ? 'bg-emerald-700 text-white border-emerald-700' : 'border-stone-300 text-stone-600'}`}
            >
              New owner
            </button>
          </div>
        )}
        {ownerMode === 'existing' ? (
          <Field label="Select owner" required error={errors.owner} htmlFor="dog-owner">
            <select id="dog-owner" className={inputCls} value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
              <option value="">Choose an owner...</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <>
            <Field label="Owner name" required error={errors.oName} htmlFor="owner-name">
              <input id="owner-name" className={inputCls} value={oName} onChange={(e) => setOName(e.target.value)} placeholder="Jane Doe" />
            </Field>
            <Field label="Phone number" required error={errors.oPhone} htmlFor="owner-phone">
              <input id="owner-phone" className={inputCls} value={oPhone} onChange={(e) => setOPhone(e.target.value)} placeholder="(555) 123-4567" />
            </Field>
            <Field label="Email" optional htmlFor="owner-email">
              <input id="owner-email" className={inputCls} value={oEmail} onChange={(e) => setOEmail(e.target.value)} placeholder="jane@email.com" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Emergency contact" optional htmlFor="owner-em-contact">
                <input id="owner-em-contact" className={inputCls} value={oEmContact} onChange={(e) => setOEmContact(e.target.value)} />
              </Field>
              <Field label="Emergency phone" optional htmlFor="owner-em-phone">
                <input id="owner-em-phone" className={inputCls} value={oEmPhone} onChange={(e) => setOEmPhone(e.target.value)} />
              </Field>
            </div>
            <Field label="Owner notes" optional htmlFor="owner-notes">
              <textarea id="owner-notes" className={inputCls} rows={2} value={oNotes} onChange={(e) => setONotes(e.target.value)} />
            </Field>
          </>
        )}
      </div>

      <div className="border-t border-stone-200 pt-4 mt-2">
        <h3 className="font-serif font-semibold text-stone-900 mb-3">Dog facts and care instructions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Food type" optional htmlFor="dog-food-type">
            <input id="dog-food-type" className={inputCls} value={foodType} onChange={(e) => setFoodType(e.target.value)} placeholder="Dry kibble brand" />
          </Field>
          <Field label="Walks per day" optional error={errors.walksPerDay} htmlFor="dog-walks">
            <input id="dog-walks" type="number" min="0" className={inputCls} value={walksPerDay} onChange={(e) => setWalksPerDay(e.target.value)} placeholder="2" />
          </Field>
        </div>
        <Field label="Feeding instructions" optional htmlFor="dog-feeding">
          <textarea id="dog-feeding" className={inputCls} rows={2} value={feedingInstructions} onChange={(e) => setFeedingInstr(e.target.value)} placeholder="1 cup in the morning and 1 cup in the evening." />
        </Field>
        <Field label="Walking instructions" optional htmlFor="dog-walking">
          <textarea id="dog-walking" className={inputCls} rows={2} value={walkingInstructions} onChange={(e) => setWalkingInstr(e.target.value)} placeholder="Walk twice per day for approximately 30 minutes." />
        </Field>
        <Field label="Special instructions" optional hint="Favorite toys, activities, commands, things to avoid, behavior." htmlFor="dog-special">
          <textarea id="dog-special" className={inputCls} rows={3} value={specialInstructions} onChange={(e) => setSpecialInstr(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Allergies" optional htmlFor="dog-allergies">
            <input id="dog-allergies" className={inputCls} value={allergies} onChange={(e) => setAllergies(e.target.value)} />
          </Field>
          <Field label="Medications" optional htmlFor="dog-medications">
            <input id="dog-medications" className={inputCls} value={medications} onChange={(e) => setMedications(e.target.value)} />
          </Field>
        </div>
        <Field label="Medical notes" optional htmlFor="dog-medical-notes">
          <textarea id="dog-medical-notes" className={inputCls} rows={2} value={medicalNotes} onChange={(e) => setMedicalNotes(e.target.value)} />
        </Field>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save dog'}
        </Button>
      </div>
    </form>
  );
}
