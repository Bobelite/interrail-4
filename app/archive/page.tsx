'use client';

import { useEffect, useMemo, useState } from 'react';
import AppFrame from '../../components/AppFrame';
import { supabase } from '../../lib/supabase';
import { useAuthPage } from '../../lib/useAuth';
import type { Report } from '../../lib/types';

export default function ArchivePage() {
  const { loading, role, error } = useAuthPage();
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    if (!role) return;
    if (!(role === 'admin' || role === 'mechanic')) return;
    void (async () => {
      const { data } = await supabase.from('reports').select('*').eq('status', 'Closed').order('closed_at', { ascending: false });
      const older = ((data || []) as Report[]).filter((r) => r.closed_at && ((Date.now() - new Date(r.closed_at).getTime()) / 86400000) > 30);
      setReports(older);
    })();
  }, [role]);

  const grouped = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of reports) {
      const key = r.closed_at ? new Date(r.closed_at).toLocaleString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown';
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [reports]);

  if (loading) return <div className="page-shell"><div className="content"><div className="card">Loading…</div></div></div>;
  if (error) return <div className="page-shell"><div className="content"><div className="error">{error}</div></div></div>;
  if (!(role === 'admin' || role === 'mechanic')) return <div className="page-shell"><div className="content"><div className="error">Archive is only for mechanics and admins.</div></div></div>;

  return (
    <AppFrame role={role} title="Monthly Archive" subtitle="Closed reports older than 30 days belong here.">
      <div className="card">
        <div className="stack">
          {Object.entries(grouped).map(([month, count]) => (
            <div className="card" key={month}><div className="spread"><div><div style={{ fontWeight: 800 }}>{month}</div><div className="muted">{count} closed reports</div></div></div></div>
          ))}
          {reports.length === 0 ? <div className="notice">No archived reports yet.</div> : null}
        </div>
      </div>
    </AppFrame>
  );
}
