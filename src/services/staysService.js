import { supabase } from './supabaseClient';
import { ServiceError, friendlyError } from './errors';

export async function listStays() {
  const { data, error } = await supabase.from('stays').select('*').order('start_date', { ascending: true });
  if (error) throw new ServiceError(friendlyError(error), error);
  return data;
}

export async function createStay(stay) {
  const { data, error } = await supabase.from('stays').insert(stay).select().single();
  if (error) throw new ServiceError(friendlyError(error, 'Unable to save this stay. Please try again.'), error);
  return data;
}

export async function updateStay(id, patch) {
  const { data, error } = await supabase.from('stays').update(patch).eq('id', id).select().single();
  if (error) throw new ServiceError(friendlyError(error, 'Unable to save this stay. Please try again.'), error);
  return data;
}

export async function deleteStay(id) {
  const { error } = await supabase.from('stays').delete().eq('id', id);
  if (error) throw new ServiceError(friendlyError(error, 'Unable to delete this stay. Please try again.'), error);
}
