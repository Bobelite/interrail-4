'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import type { Profile, Role } from '../lib/types';

type State = {
  loading: boolean;
  userId: string | null;
  role: Role | null;
  profile: Profile | null;
  error: string | null;
};

export default function AuthGate({ children }: { children: (ctx: { userId: string; role: Role; profile: Profile | null; refreshProfile: () => Promise<void>; }) => React.ReactNode; }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ loading: true, userId: null, role: null, profile: null, error: null });

  async function load() {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      router.replace('/login');
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', user.id)
      .single();

    if (error) {
      setState({ loading: false, userId: user.id, role: 'employee', profile: null, error: 'Your login works, but no profile row exists yet. Add one in Supabase for this user.' });
      return;
    }

    setState({ loading: false, userId: user.id, role: profile.role, profile, error: null });
  }

  useEffect(() => { void load(); }, []);

  if (state.loading) return <div className="card">Loading…</div>;
  if (!state.userId || !state.role) return null;
  if (state.error) {
    return (
      <div className="page-shell"><div className="content"><div className="error">{state.error}</div></div></div>
    );
  }

  return <>{children({ userId: state.userId, role: state.role, profile: state.profile, refreshProfile: load })}</>;
}
