import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Dog, Home, CalendarDays, History as HistoryIcon, LogOut } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useAuth } from '../hooks/useAuth';
import Modal from './ui/Modal';
import ConfirmDialog from './ui/ConfirmDialog';
import DogForm from './DogForm';
import StayForm from './StayForm';
import LoadingState from './ui/LoadingState';
import ErrorState from './ui/ErrorState';
import { uploadDogPhoto } from '../services/photosService';

const NAV = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/dogs', label: 'Dogs', icon: Dog },
  { to: '/stays', label: 'Stays', icon: CalendarDays },
  { to: '/history', label: 'History', icon: HistoryIcon },
];

export default function AppShell() {
  const appData = useAppData();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showDogForm, setShowDogForm] = useState(false);
  const [editingDog, setEditingDog] = useState(null);
  const [showStayForm, setShowStayForm] = useState(false);
  const [editingStay, setEditingStay] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [modalError, setModalError] = useState('');

  const openAddDog = () => {
    setEditingDog(null);
    setShowDogForm(true);
  };
  const openEditDog = (dog) => {
    setEditingDog(dog);
    setShowDogForm(true);
  };
  const openAddStay = () => {
    setEditingStay(null);
    setShowStayForm(true);
  };
  const openEditStay = (stay) => {
    setEditingStay(stay);
    setShowStayForm(true);
  };

  const handleSaveDog = async ({ dogData, newOwner, photoFile, photoRemoved, photoUrlIfNoChange }) => {
    let ownerId = dogData.owner_id;
    if (newOwner) {
      const created = await appData.createOwner(newOwner);
      ownerId = created.id;
    }

    // Save (or create) the dog row first so we have an id to upload the photo under.
    const saved = await appData.saveDog({ ...dogData, owner_id: ownerId, photo_url: photoUrlIfNoChange });

    if (photoFile) {
      const url = await uploadDogPhoto(saved.id, photoFile);
      await appData.saveDog({ id: saved.id, photo_url: url });
    } else if (photoRemoved) {
      await appData.saveDog({ id: saved.id, photo_url: '' });
    }

    setShowDogForm(false);
    setEditingDog(null);
  };

  const handleSaveStay = async (stayData) => {
    await appData.saveStay(stayData);
    setShowStayForm(false);
    setEditingStay(null);
  };

  const runDelete = async () => {
    setModalError('');
    try {
      if (confirmDelete.type === 'dog') {
        await appData.removeDog(confirmDelete.id);
        if (location.pathname === `/dogs/${confirmDelete.id}`) navigate('/dogs');
      } else {
        await appData.removeStay(confirmDelete.id);
      }
      setConfirmDelete(null);
      setShowStayForm(false);
    } catch (err) {
      setModalError(err.message || 'Unable to delete. Please try again.');
    }
  };

  const ctx = {
    ...appData,
    openAddDog,
    openEditDog,
    openAddStay,
    openEditStay,
    requestDeleteDog: (dog) => setConfirmDelete({ type: 'dog', id: dog.id, name: dog.name }),
    requestDeleteStay: (stay, dogName) => setConfirmDelete({ type: 'stay', id: stay.id, name: `the stay for ${dogName || 'this dog'}` }),
  };

  if (appData.loading) return <LoadingState label="Loading your dogs' info…" />;
  if (appData.error) return <ErrorState message={appData.error} onRetry={appData.refreshAll} />;

  return (
    <div className="min-h-screen bg-stone-50 font-sans pb-24 sm:pb-8">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center" aria-hidden="true">
              <Dog size={20} className="text-white" />
            </div>
            <h1 className="font-serif text-lg font-semibold text-stone-900">Paws Log</h1>
          </div>
          <div className="flex items-center gap-1">
            <nav className="hidden sm:flex gap-1" aria-label="Main navigation">
              {NAV.map((n) => (
                <button
                  key={n.to}
                  onClick={() => navigate(n.to)}
                  aria-current={location.pathname === n.to ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-lg text-sm font-medium transition ${
                    location.pathname === n.to ? 'bg-emerald-700 text-white' : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <n.icon size={16} aria-hidden="true" /> {n.label}
                </button>
              ))}
            </nav>
            {/* Always visible (not just on desktop) — on a phone the bottom tab
                bar has no room for it, so this is the only way to sign out. */}
            <button
              onClick={signOut}
              aria-label="Sign out"
              className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] min-w-[44px] rounded-lg text-sm font-medium text-stone-500 hover:bg-stone-100"
            >
              <LogOut size={18} aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Outlet context={ctx} />
      </main>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 flex z-30" aria-label="Main navigation">
        {NAV.map((n) => (
          <button
            key={n.to}
            onClick={() => navigate(n.to)}
            aria-current={location.pathname === n.to ? 'page' : undefined}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 min-h-[44px] text-xs font-medium ${
              location.pathname === n.to ? 'text-emerald-700' : 'text-stone-500'
            }`}
          >
            <n.icon size={20} aria-hidden="true" /> {n.label}
          </button>
        ))}
      </nav>

      {showDogForm && (
        <Modal title={editingDog ? 'Edit dog' : 'Add a dog'} onClose={() => { setShowDogForm(false); setEditingDog(null); }} wide>
          <DogForm dog={editingDog} owners={appData.owners} onSave={handleSaveDog} onCancel={() => { setShowDogForm(false); setEditingDog(null); }} />
        </Modal>
      )}

      {showStayForm && (
        <Modal title={editingStay ? 'Edit stay' : 'Create a stay'} onClose={() => { setShowStayForm(false); setEditingStay(null); }}>
          <StayForm
            stay={editingStay}
            dogs={appData.dogs}
            stays={appData.stays}
            onSave={handleSaveStay}
            onCancel={() => { setShowStayForm(false); setEditingStay(null); }}
            onDelete={
              editingStay
                ? () => setConfirmDelete({ type: 'stay', id: editingStay.id, name: `this stay for ${appData.dogById.get(editingStay.dog_id)?.name || 'this dog'}` })
                : null
            }
          />
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={confirmDelete.type === 'dog' ? 'Delete dog?' : 'Delete stay?'}
          message={
            modalError ||
            (confirmDelete.type === 'dog'
              ? `Are you sure you want to delete ${confirmDelete.name}? This will also remove all of their dog-sitting stays. This cannot be undone.`
              : `Are you sure you want to delete ${confirmDelete.name}? This cannot be undone.`)
          }
          onCancel={() => { setConfirmDelete(null); setModalError(''); }}
          onConfirm={runDelete}
        />
      )}
    </div>
  );
}
