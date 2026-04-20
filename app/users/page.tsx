'use client';

import { useEffect, useState } from 'react';
import AppFrame from '../../components/AppFrame';
import { supabase } from '../../lib/supabase';
import { useAuthPage } from '../../lib/useAuth';
import type { Profile } from '../../lib/types';

export default function UsersPage() {
  const { loading, role, error } = useAuthPage();
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    if (!role) return;
    if (role !== 'admin') return;
    void (async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, role').order('full_name');
      setProfiles((data || []) as Profile[]);
    })();
  }, [role]);

  if (loading) return <div className="page-shell"><div className="content"><div className="card">Loading…</div></div></div>;
  if (error) return <div className="page-shell"><div className="content"><div className="error">{error}</div></div></div>;
  if (role !== 'admin') return <div className="page-shell"><div className="content"><div className="error">User management is admin-only.</div></div></div>;

  return (
    <AppFrame role={role} title="Users" subtitle="This page lists profile roles. Create auth users in Supabase for now.">
      <div className="card">
        <table className="table">
          <thead><tr><th>Name</th><th>Role</th><th>User ID</th></tr></thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id}><td>{p.full_name || '—'}</td><td>{p.role}</td><td>{p.id}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="notice" style={{ marginTop: 14 }}>Creating login accounts from inside the app needs a secure server-side function. For this first real build, add users in Supabase Auth, then add their profile rows in the profiles table.</div>
      </div>
    </AppFrame>
  );
}
