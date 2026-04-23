'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppFrame from '../components/AppFrame';
import { supabase } from '../lib/supabase';
import { useAuthPage } from '../lib/useAuth';

export default function HomePage() {
  const { loading, role } = useAuthPage();

  const [stats, setStats] = useState({
    repairs: 0,
    services: 0,
    notes: 0,
    inProgress: 0,
    recentlyClosed: 0,
    vehicles: 0
  });

  useEffect(() => {
    if (!role) return;

    void (async () => {
      const { data: reports } = await supabase
        .from('reports')
        .select('report_type,status,closed_at');

      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id');

      const r = reports || [];

      setStats({
        repairs: r.filter(x=>x.report_type==='Repair' && x.status!=='Closed').length,
        services: r.filter(x=>x.report_type==='Service' && x.status!=='Closed').length,
        notes: r.filter(x=>x.report_type==='Note' && x.status!=='Closed').length,
        inProgress: r.filter(x=>x.status==='In Progress').length,
        recentlyClosed: r.filter(x=>x.status==='Closed').length,
        vehicles: vehicles?.length || 0
      });
    })();
  }, [role]);

  if (loading){
    return <div style={{padding:40}}>Loading…</div>;
  }

  return (
    <AppFrame
      title="Interrail Fleet"
      subtitle="Fleet status and quick actions"
      role={role}
    >

      <div className="grid-3">
        <div className="stat">
          <div className="stat-k">Open Repairs</div>
          <div className="stat-v">{stats.repairs}</div>
        </div>

        <div className="stat">
          <div className="stat-k">Open Services</div>
          <div className="stat-v">{stats.services}</div>
        </div>

        <div className="stat">
          <div className="stat-k">Open Notes</div>
          <div className="stat-v">{stats.notes}</div>
        </div>
      </div>


      <div className="grid-3" style={{marginTop:20}}>
        <div className="stat">
          <div className="stat-k">In Progress</div>
          <div className="stat-v">{stats.inProgress}</div>
        </div>

        <div className="stat">
          <div className="stat-k">Recently Closed</div>
          <div className="stat-v">{stats.recentlyClosed}</div>
        </div>

        <div className="stat">
          <div className="stat-k">Vehicles</div>
          <div className="stat-v">{stats.vehicles}</div>
        </div>
      </div>


      <div className="grid-2" style={{marginTop:20}}>
        <Link
          href="/new-report"
          className="card"
          style={{
            background:'#0b63b6',
            color:'#fff'
          }}
        >
          <div className="title">New Report</div>
          <div className="subtitle" style={{color:'#dbeafe'}}>
            Submit service, repair or note
          </div>
        </Link>

        <Link href="/vehicles" className="card">
          <div className="title">Vehicles</div>
          <div className="subtitle">
            Mileage, hours, oil changes and history
          </div>
        </Link>
      </div>


      <div className="grid-2" style={{marginTop:20}}>
        <Link href="/reports" className="card">
          <div className="title">Reports</div>
          <div className="subtitle">
            Review, close out and export reports
          </div>
        </Link>

        <div className="card">
          <div className="title">Admin Archive</div>
          <div className="subtitle">
            All reports remain exportable to Excel/CSV.
          </div>
        </div>
      </div>

    </AppFrame>
  );
}
