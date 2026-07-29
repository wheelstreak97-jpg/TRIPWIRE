import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Organization, Profile } from '@/lib/types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  organization: Organization | null;
  loading: boolean;
  needsOnboarding: boolean;
  signUp: (opts: {
    email: string;
    password: string;
    fullName: string;
    orgName: string;
  }) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  completeOnboarding: (orgName: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const loadWorkspace = async (userId: string) => {
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(prof ?? null);
    if (prof?.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', prof.organization_id)
        .maybeSingle();
      setOrganization(org ?? null);
      setNeedsOnboarding(false);
    } else {
      setOrganization(null);
      setNeedsOnboarding(true);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) await loadWorkspace(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        if (newSession?.user) {
          await loadWorkspace(newSession.user.id);
        } else {
          setProfile(null);
          setOrganization(null);
        }
      })();
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp: AuthContextValue['signUp'] = async ({ email, password, fullName, orgName }) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Could not create your account. Please try again.' };

    const { error: rpcError } = await supabase.rpc('create_organization_with_owner', {
      org_name: orgName,
      owner_name: fullName,
    });
    if (rpcError) return { error: 'Account created, but setting up your team failed. Try signing in.' };

    await loadWorkspace(data.user.id);
    return { error: null };
  };

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return {
        error:
          error.message === 'Invalid login credentials'
            ? 'Wrong email or password.'
            : error.message,
      };
    }
    return { error: null };
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    });
  };

  const completeOnboarding = async (orgName: string, fullName: string) => {
    if (!session?.user) return { error: 'Not signed in.' };
    const { error: rpcError } = await supabase.rpc('create_organization_with_owner', {
      org_name: orgName,
      owner_name: fullName,
    });
    if (rpcError) return { error: 'Could not finish setting up your workspace. Try again.' };
    await loadWorkspace(session.user.id);
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setNeedsOnboarding(false);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        organization,
        loading,
        needsOnboarding,
        signUp,
        signIn,
        signInWithGoogle,
        completeOnboarding,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
