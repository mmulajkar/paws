import { useMemo } from 'react';
import { useOwners } from './useOwners';
import { useDogs } from './useDogs';
import { useStays } from './useStays';
import { computeStay } from '../utils/stayCalculations';

/**
 * Combines the three data hooks and derives the enriched stay list
 * ({ stay, dog, owner, calc }) that every page needs, in one place, so no
 * page has to duplicate the join-and-compute logic.
 */
export function useAppData() {
  const ownersHook = useOwners();
  const dogsHook = useDogs();
  const staysHook = useStays();

  const loading = ownersHook.loading || dogsHook.loading || staysHook.loading;
  const error = ownersHook.error || dogsHook.error || staysHook.error;

  const ownerById = useMemo(() => {
    const map = new Map();
    ownersHook.owners.forEach((o) => map.set(o.id, o));
    return map;
  }, [ownersHook.owners]);

  const dogById = useMemo(() => {
    const map = new Map();
    dogsHook.dogs.forEach((d) => map.set(d.id, d));
    return map;
  }, [dogsHook.dogs]);

  const staysCalc = useMemo(
    () =>
      staysHook.stays.map((stay) => {
        const dog = dogById.get(stay.dog_id) || null;
        const owner = dog ? ownerById.get(dog.owner_id) || null : null;
        return { stay, dog, owner, calc: computeStay(stay) };
      }),
    [staysHook.stays, dogById, ownerById]
  );

  const refreshAll = async () => {
    await Promise.all([ownersHook.refresh(), dogsHook.refresh(), staysHook.refresh()]);
  };

  return {
    owners: ownersHook.owners,
    dogs: dogsHook.dogs,
    stays: staysHook.stays,
    staysCalc,
    ownerById,
    dogById,
    loading,
    error,
    refreshAll,
    createOwner: ownersHook.createOwner,
    saveDog: dogsHook.saveDog,
    removeDog: dogsHook.removeDog,
    saveStay: staysHook.saveStay,
    removeStay: staysHook.removeStay,
    markPaid: staysHook.markPaid,
  };
}
