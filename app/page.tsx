'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppFrame from '../components/AppFrame';
import { supabase } from '../lib/supabase';
import { useAuthPage } from '../lib/useAuth';

export default function HomePage() {
  const { loading, role, error } = useAuthPage();
  const [counts, setCounts] = useState({ open: 0, progress: 0, closed: 0 });

  useEffect(() => {
    if (!role) return;

    void (async () => {
      const { data } = await supabase.from('reports').select('status, closed_at');

      const open = data?.filter((r) => r.status === 'Open').length || 0;
      const progress = data?.filter((r) => r.status === 'In Progress').length || 0;
      const closed =
        data?.filter(
          (r) =>
            r.status === 'Closed' &&
            (!r.closed_at ||
              (Date.now() - new Date(r.closed_at).getTime()) / 86400000 <= 30)
        ).length || 0;

      setCounts({ open, progress, closed });
    })();
  }, [role]);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="content">
          <div className="card">Loading…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="content">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <AppFrame role={role}>
      <div className="grid-3">
        <div className="stat">
          <div className="stat-k">Open Reports</div>
          <div className="stat-v">{counts.open}</div>
        </div>

        <div className="stat">
          <div className="stat-k">In Progress</div>
          <div className="stat-v">{counts.progress}</div>
        </div>

        <div className="stat">
          <div className="stat-k">Recently Closed</div>
          <div className="stat-v">{counts.closed}</div>
          <div className="small">Closed reports stay visible for 30 days</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 14 }}>
        <Link
          href="/new-report"
          className="card"
          style={{ background: 'var(--blue)', color: 'white' }}
        >
          <div className="title">New Report</div>
          <div className="subtitle" style={{ color: '#dbeafe' }}>
            Service, repair, or note
          </div>
        </Link>

        <Link href="/vehicles" className="card">
          <div className="title">Vehicles</div>
          <div className="subtitle">
            View current mileage, hours, and next oil change
          </div>
        </Link>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="title">System Status</div>
        <div className="subtitle">
          If you see this inside the AppFrame, navigation is working correctly.
        </div>
      </div>
    </AppFrame>
  );
}
