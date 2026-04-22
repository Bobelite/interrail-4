'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';
import type { Profile, Role } from './types';

export function useAuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message);
          setLoading(false);
          return;
        }

        const session = sessionData.session;

        if (!session?.user) {
          router.replace('/login');
          return;
        }

        const user = session.user;
        setUserId(user.id);

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          setError(profileError.message);
          setLoading(false);
          return;
        }

        if (!data) {
          setError('Profile not found.');
          setLoading(false);
          return;
        }

        setProfile(data as Profile);
        setRole((data as Profile).role);
        setLoading(false);
      } catch {
        setError('Unexpected error occurred.');
        setLoading(false);
      }
    })();
  }, [router]);

  return { loading, userId, role, profile, error };
}
