import { useCallback, useEffect, useState } from 'react';
import * as ownersService from '../services/ownersService';

export function useOwners() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOwners(await ownersService.listOwners());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createOwner = useCallback(async (owner) => {
    const created = await ownersService.createOwner(owner);
    setOwners((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  }, []);

  return { owners, loading, error, refresh, createOwner };
}
