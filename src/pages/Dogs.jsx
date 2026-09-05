import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Plus, ChevronRight } from 'lucide-react';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import EmptyState from '../components/ui/EmptyState';
import Avatar from '../components/ui/Avatar';

export default function Dogs() {
  const { dogs, ownerById, openAddDog } = useOutletContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredDogs = dogs.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const owner = ownerById.get(d.owner_id);
    return d.name.toLowerCase().includes(q) || owner?.name.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h2 className="text-xl font-serif font-semibold text-stone-900">Dogs</h2>
        <Button onClick={openAddDog}>
          <Plus size={16} aria-hidden="true" /> Add dog
        </Button>
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by dog or owner name" label="Search dogs" />
      {filteredDogs.length === 0 ? (
        <EmptyState
          text={dogs.length === 0 ? 'No dogs yet. Add your first dog to get started.' : 'No dogs match your search.'}
          actionLabel={dogs.length === 0 ? 'Add dog' : undefined}
          onAction={dogs.length === 0 ? openAddDog : undefined}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          {filteredDogs.map((d) => (
            <button
              key={d.id}
              onClick={() => navigate(`/dogs/${d.id}`)}
              className="w-full text-left bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-4 hover:border-emerald-300 hover:shadow-sm transition min-h-[44px]"
            >
              <Avatar photo={d.photo_url} name={d.name} />
              <div className="min-w-0">
                <p className="font-serif font-semibold text-stone-900 truncate">{d.name}</p>
                <p className="text-sm text-stone-500 truncate">{d.breed || 'Breed not set'}</p>
                <p className="text-sm text-stone-500 truncate">Owner: {ownerById.get(d.owner_id)?.name || 'Unknown'}</p>
              </div>
              <ChevronRight size={18} className="ml-auto text-stone-400 shrink-0" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
