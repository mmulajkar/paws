import { supabase } from './supabaseClient';
import { ServiceError } from './errors';

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const message =
      error.status === 400 || /invalid/i.test(error.message)
        ? 'Incorrect email or password.'
        : 'Unable to sign in right now. Please check your connection and try again.';
    throw new ServiceError(message, error);
  }
  return data.session;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}
