import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { StoreRole } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  storeId: string | null;
  userRole: StoreRole | null;
  signUp: (email: string, password: string, storeCode: string, role: StoreRole) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function loadStoreMembership(userId: string) {
  const { data } = await supabase
    .from('store_members')
    .select('store_id, role')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  return data ? { storeId: data.store_id as string, role: data.role as StoreRole } : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<StoreRole | null>(null);

  const loadMembership = async (userId: string) => {
    const membership = await loadStoreMembership(userId);
    if (membership) {
      setStoreId(membership.storeId);
      setUserRole(membership.role);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // defer to avoid Supabase deadlock
        setTimeout(() => loadMembership(session.user.id), 0);
      } else {
        setStoreId(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadMembership(session.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, storeCode: string, role: StoreRole) => {
    // 1. Create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) return { error: authError as Error };

    const userId = authData.user?.id;
    if (!userId) return { error: new Error('Signup succeeded but no user ID returned') };

    // 2. Find or create the store by code
    let foundStoreId: string | null = null;

    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .eq('code', storeCode.toUpperCase())
      .maybeSingle();

    if (existingStore) {
      foundStoreId = existingStore.id;
    } else {
      const { data: newStore, error: storeError } = await supabase
        .from('stores')
        .insert({ code: storeCode.toUpperCase(), name: storeCode.toUpperCase() })
        .select('id')
        .single();
      if (storeError) return { error: storeError as Error };
      foundStoreId = newStore.id;
    }

    // 3. Create the store membership
    const { error: memberError } = await supabase
      .from('store_members')
      .insert({ user_id: userId, store_id: foundStoreId, role });

    if (memberError) return { error: memberError as Error };

    setStoreId(foundStoreId);
    setUserRole(role);

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setStoreId(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, storeId, userRole, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
