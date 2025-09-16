import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(email) {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) throw error;
  }
  async function signOut() { await supabase.auth.signOut(); }

  const user = session?.user ? { id: session.user.id, email: session.user.email } : null;
  const accessToken = session?.access_token || null;
  return <AuthCtx.Provider value={{ user, accessToken, loading, signIn, signOut }}>{children}</AuthCtx.Provider>;
}

export function useAuth() { return useContext(AuthCtx); }
