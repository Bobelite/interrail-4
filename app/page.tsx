'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppFrame from '../components/AppFrame';
import { supabase } from '../lib/supabase';
import { useAuthPage } from '../lib/useAuth';

type ReportRow = {
  id: string;
  report_type: string | null;
  status: string | null;
  closed_at: string | null;
};

type VehicleRow = {
  id: string;
  equipment_name: string | null;
  unit_number: string | null;
  next_oil_change: number | null;
  current_mileage: number | null;
};

export default function HomePage() {
  const { loading, role, error } = useAuthPage();

  const [reportCounts, setReportCounts] = useState({
    repairs: 0,
    services: 0,
    notes: 0,
    inProgress: 0,
    recentlyClosed: 0
  });

  const [vehicleCount, setVehicleCount] = useState(0);
  const [screenError, setScreenError] = useState<string | null>(null);

  useEffect(() => {
    if (!role) return;

    void (async () => {
      setScreenError(null);

      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('id, report_type, status, closed_at');

      if (reportsError) {
        setScreenError(reportsError.message);
        return;
      }

      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, equipment_name, unit_number, next_oil_change, current_mileage');

      if (vehiclesError) {
        setScreenError(vehiclesError.message);
        return;
      }

      const reports = (reportsData || []) as ReportRow[];
      const vehicles = (vehiclesData || []) as VehicleRow[];

      const repairs = reports.filter(
        (r) => r.report_type === 'Repair' && r.status !== 'Closed'
      ).length;

      const services = reports.filter(
        (r) => r.report_type === 'Service' && r.status !== 'Closed'
      ).length;

      const notes = reports.filter(
        (r) => r.report_type === 'Note' && r.status !== 'Closed'
      ).length;

      const inProgress = reports.filter((r) => r.status === 'In Progress').length;

      const recentlyClosed = reports.filter((r) => {
        if (r.status !== 'Closed') return false;
        if (!r.closed_at) return true;
        const ageDays = (Date.now() - new Date(r.closed_at).getTime()) / 86400000;
        return ageDays <= 30;
      }).length;

      setReportCounts({
        repairs,
        services,
        notes,
        inProgress,
        recentlyClosed
      });

      setVehicleCount(vehicles.length);
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
    <AppFrame
      role={role}
      title="Home"
      subtitle="Fleet status, quick actions, and recent activity."
    >
      {screenError ? <div className="error">{screenError}</div> : null}

      <div className="grid-3">
        <div className="stat">
          <div className="stat-k">Open Repairs</div>
          <div className="stat-v">{reportCounts.repairs}</div>
        </div>

        <div className="stat">
          <div className="stat-k">Open Services</div>
          <div className="stat-v">{reportCounts.services}</div>
        </div>

        <div className="stat">
          <div className="stat-k">Open Notes</div>
          <div className="stat-v">{reportCounts.notes}</div>
        </div>
      </div>

      <div className="grid-3" style={{ marginTop: 18 }}>
        <div className="stat">
          <div className="stat-k">In Progress</div>
          <div className="stat-v">{reportCounts.inProgress}</div>
        </div>

        <div className="stat">
          <div className="stat-k">Recently Closed</div>
          <div className="stat-v">{reportCounts.recentlyClosed}</div>
          <div className="small">Closed reports stay visible for 30 days</div>
        </div>

        <div className="stat">
          <div className="stat-k">Vehicles</div>
          <div className="stat-v">{vehicleCount}</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <Link
          href="/new-report"
          className="card"
          style={{ background: 'var(--blue)', color: 'white' }}
        >
          <div className="title">New Report</div>
          <div className="subtitle" style={{ color: '#dbeafe' }}>
            Submit a service request, repair, or note
          </div>
        </Link>

        <Link href="/vehicles" className="card">
          <div className="title">Vehicles</div>
          <div className="subtitle">
            Check current mileage, hours, next oil change, and history
          </div>
        </Link>
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <Link href="/reports" className="card">
          <div className="title">Reports</div>
          <div className="subtitle">
            Review open reports, close work orders, and export records
          </div>
        </Link>

        <div className="card">
          <div className="title">Admin Records</div>
          <div className="subtitle">
            Closed reports remain in the database and can be downloaded as CSV for Excel.
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
