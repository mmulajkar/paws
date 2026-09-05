import { useCallback, useEffect, useState } from 'react';
import * as staysService from '../services/staysService';

export function useStays() {
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStays(await staysService.listStays());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveStay = useCallback(async (stay) => {
    if (stay.id) {
      const { id, ...patch } = stay;
      delete patch.created_at;
      delete patch.updated_at;
      const updated = await staysService.updateStay(id, patch);
      setStays((prev) => prev.map((s) => (s.id === id ? updated : s)));
      return updated;
    }
    const created = await staysService.createStay(stay);
    setStays((prev) => [...prev, created]);
    return created;
  }, []);

  const removeStay = useCallback(async (id) => {
    await staysService.deleteStay(id);
    setStays((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const markPaid = useCallback(
    async (id, totalAmount) => {
      return saveStay({ id, amount_paid: totalAmount });
    },
    [saveStay]
  );

  return { stays, loading, error, refresh, saveStay, removeStay, markPaid };
}
