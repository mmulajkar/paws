import { supabase } from './supabaseClient';
import { ServiceError } from './errors';

const BUCKET = 'dog-photos';
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function validatePhotoFile(file) {
  if (!file) return 'No file selected.';
  if (!ALLOWED_TYPES.includes(file.type)) return 'Please choose a JPG, PNG, WEBP, or GIF image.';
  if (file.size > MAX_BYTES) return 'That image is too large (max 5MB). Please choose a smaller photo.';
  return null;
}

/** Upload (or replace) a dog's photo. Returns the public URL to store on the dog record. */
export async function uploadDogPhoto(dogId, file) {
  const validationError = validatePhotoFile(file);
  if (validationError) throw new ServiceError(validationError);

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${dogId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (uploadError) {
    throw new ServiceError('Unable to upload that photo. Please check your connection and try again.', uploadError);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Best-effort removal of a previously uploaded photo (by its public URL). Never throws. */
export async function removeDogPhoto(photoUrl) {
  if (!photoUrl) return;
  try {
    const marker = `/${BUCKET}/`;
    const idx = photoUrl.indexOf(marker);
    if (idx === -1) return;
    const path = photoUrl.slice(idx + marker.length);
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    // Deliberately swallow — a failed cleanup of an old photo file should
    // never block the user from saving their change.
  }
}
