import { supabase } from './supabaseClient';
import { ServiceError, friendlyError } from './errors';

export async function listDogs() {
  const { data, error } = await supabase.from('dogs').select('*').order('name', { ascending: true });
  if (error) throw new ServiceError(friendlyError(error), error);
  return data;
}

export async function getDog(id) {
  const { data, error } = await supabase.from('dogs').select('*').eq('id', id).maybeSingle();
  if (error) throw new ServiceError(friendlyError(error), error);
  return data;
}

export async function createDog(dog) {
  const { data, error } = await supabase.from('dogs').insert(dog).select().single();
  if (error) throw new ServiceError(friendlyError(error, 'Unable to save this dog. Please try again.'), error);
  return data;
}

export async function updateDog(id, patch) {
  const { data, error } = await supabase.from('dogs').update(patch).eq('id', id).select().single();
  if (error) throw new ServiceError(friendlyError(error, 'Unable to save this dog. Please try again.'), error);
  return data;
}

// Deleting a dog cascades to its stays at the database level (FK ON DELETE
// CASCADE) — no separate client-side cleanup step needed, and no risk of an
// orphaned stay if this call is interrupted partway through.
export async function deleteDog(id) {
  const { error } = await supabase.from('dogs').delete().eq('id', id);
  if (error) throw new ServiceError(friendlyError(error, 'Unable to delete this dog. Please try again.'), error);
}
