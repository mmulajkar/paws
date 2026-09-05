import { supabase } from './supabaseClient';
import { ServiceError, friendlyError } from './errors';

export async function listOwners() {
  const { data, error } = await supabase.from('owners').select('*').order('name', { ascending: true });
  if (error) throw new ServiceError(friendlyError(error), error);
  return data;
}

export async function createOwner(owner) {
  const { data, error } = await supabase.from('owners').insert(owner).select().single();
  if (error) throw new ServiceError(friendlyError(error, 'Unable to save this owner. Please try again.'), error);
  return data;
}

export async function updateOwner(id, patch) {
  const { data, error } = await supabase.from('owners').update(patch).eq('id', id).select().single();
  if (error) throw new ServiceError(friendlyError(error, 'Unable to save this owner. Please try again.'), error);
  return data;
}

export async function deleteOwner(id) {
  const { error } = await supabase.from('owners').delete().eq('id', id);
  if (error) throw new ServiceError(friendlyError(error, 'Unable to delete this owner. Please try again.'), error);
}
