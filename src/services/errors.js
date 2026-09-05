// Turns a raw Supabase/PostgREST error into a short, non-technical message
// safe to show directly to the user (PART 21: no raw technical errors).
export function friendlyError(error, fallback = 'Something went wrong. Please check your connection and try again.') {
  if (!error) return fallback;
  const message = String(error.message || '');
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Unable to reach the server. Please check your internet connection and try again.';
  }
  if (error.code === '23503') return "That record is linked to other data and can't be changed that way.";
  if (error.code === '23505') return 'That record already exists.';
  if (error.code === 'PGRST301' || error.status === 401 || error.status === 403) {
    return "You're not signed in, or don't have permission to do that. Try signing in again.";
  }
  return fallback;
}

export class ServiceError extends Error {
  constructor(userMessage, cause) {
    super(userMessage);
    this.name = 'ServiceError';
    this.cause = cause;
  }
}
