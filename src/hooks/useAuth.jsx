import { createContext, useContext, useEffect, useState } from 'react';
import { getSession, onAuthStateChange, signIn as doSignIn, signOut as doSignOut } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const current = await getSession();
      setSession(current);
      setLoading(false);
      unsub = onAuthStateChange((next) => setSession(next));
    })();
    return () => unsub();
  }, []);

  const value = {
    session,
    user: session?.user || null,
    loading,
    signIn: doSignIn,
    signOut: doSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- context hook, not a component
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
