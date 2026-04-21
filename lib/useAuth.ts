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
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError) {
          console.error('Auth error:', authError);
          setError(authError.message);
          setLoading(false);
          return;
        }

        const user = authData.user;

        if (!user) {
          router.replace('/login');
          return;
        }

        setUserId(user.id);

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          setError(profileError.message);
          setLoading(false);
          return;
        }

        if (!data) {
          console.warn('No profile found for user:', user.id);
          setError('Profile not found.');
          setLoading(false);
          return;
        }

        setProfile(data as Profile);
        setRole((data as Profile).role);
        setLoading(false);
      } catch (err: any) {
        console.error('Unexpected auth error:', err);
        setError('Unexpected error occurred.');
        setLoading(false);
      }
    })();
  }, [router]);

  return { loading, userId, role, profile, error };
}
