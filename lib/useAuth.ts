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
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        router.replace('/login');
        return;
      }
      setUserId(user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        setError('Your login works, but your profile row is missing. Add a row in the profiles table for this auth user.');
        setLoading(false);
        return;
      }

      setProfile(data as Profile);
      setRole((data as Profile).role);
      setLoading(false);
    })();
  }, [router]);

  return { loading, userId, role, profile, error };
}
