import { useCallback, useEffect, useState } from 'react';
import * as dogsService from '../services/dogsService';

export function useDogs() {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDogs(await dogsService.listDogs());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveDog = useCallback(async (dog) => {
    if (dog.id) {
      const { id, ...patch } = dog;
      delete patch.created_at;
      delete patch.updated_at;
      const updated = await dogsService.updateDog(id, patch);
      setDogs((prev) => prev.map((d) => (d.id === id ? updated : d)));
      return updated;
    }
    const created = await dogsService.createDog(dog);
    setDogs((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  }, []);

  const removeDog = useCallback(async (id) => {
    await dogsService.deleteDog(id);
    setDogs((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return { dogs, loading, error, refresh, saveDog, removeDog };
}
