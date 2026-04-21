'use client';

import { useEffect, useState } from 'react';
import AppFrame from '../../components/AppFrame';
import { supabase } from '../../lib/supabase';
import { useAuthPage } from '../../lib/useAuth';

type ReportRow = {
  id: string;
  title: string | null;
  description: string | null;
  report_type: string | null;
  status: string | null;
  submitted_at: string | null;
  closed_at: string | null;
  submitted_by: string | null;
  created_by_name: string | null;
  submitted_mileage: number | null;
  submitted_hours: number | null;
  vehicle_id: string | null;
};

type VehicleRow = {
  id: string;
  equipment_name: string | null;
  unit_number: string | null;
  current_mileage: number | null;
  current_hours: number | null;
  next_oil_change: number | null;
};

export default function ReportsPage() {
  const { loading, role, profile, error } = useAuthPage();

  const [reports, setReports] = useState<ReportRow[]>([]);
  const [vehicles, setVehicles] = useState<Record<string, VehicleRow>>({});
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [closeMileage, setCloseMileage] = useState('');
  const [closeHours, setCloseHours] = useState('');
  const [nextOil, setNextOil] = useState('');
  const [closingNotes, setClosingNotes] = useState('');

  // ✅ FIXED HERE (removed "manager")
  const canClose = role === 'admin' || role === 'mechanic';

  useEffect(() => {
    if (!role) return;
    void loadData();
  }, [role]);

  async function loadData() {
    setScreenError(null);

    const { data: reportsData, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (reportsError) {
      setScreenError(reportsError.message);
      return;
    }

    const { data: vehiclesData, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*');

    if (vehiclesError) {
      setScreenError(vehiclesError.message);
      return;
    }

    const vehicleMap: Record<string, VehicleRow> = {};
    (vehiclesData || []).forEach((v) => {
      vehicleMap[v.id] = v as VehicleRow;
    });

    setVehicles(vehicleMap);
    setReports((reportsData || []) as ReportRow[]);

    if (reportsData && reportsData.length > 0) {
      setSelectedReport(reportsData[0] as ReportRow);
    } else {
      setSelectedReport(null);
    }
  }

  async function markInProgress() {
    if (!selectedReport) return;

    setSaving(true);
    setScreenError(null);

    const { error } = await supabase
      .from('reports')
      .update({ status: 'In Progress' })
      .eq('id', selectedReport.id);

    setSaving(false);

    if (error) {
      setScreenError(error.message);
      return;
    }

    await loadData();
  }

  async function closeReport() {
    if (!selectedReport || !profile) return;

    setSaving(true);
    setScreenError(null);

    const closePayload: Record<string, any> = {
      status: 'Closed',
      closed_at: new Date().toISOString(),
      closed_by: profile.id,
      closed_by_name: profile.full_name,
      closing_notes: closingNotes || null,
      closed_mileage: closeMileage ? Number(closeMileage) : null,
      closed_hours: closeHours ? Number(closeHours) : null,
      next_oil_change_at_close: nextOil ? Number(nextOil) : null,
      updated_at: new Date().toISOString()
    };

    const { error: reportError } = await supabase
      .from('reports')
      .update(closePayload)
      .eq('id', selectedReport.id);

    if (reportError) {
      setSaving(false);
      setScreenError(reportError.message);
      return;
    }

    if (selectedReport.vehicle_id) {
      const vehicle = vehicles[selectedReport.vehicle_id];

      if (vehicle) {
        const vehicleUpdate: Record<string, any> = {
          updated_at: new Date().toISOString()
        };

        if (closeMileage) {
          const newMileage = Number(closeMileage);
          if (!vehicle.current_mileage || newMileage > vehicle.current_mileage) {
            vehicleUpdate.current_mileage = newMileage;
          }
        }

        if (closeHours) {
          const newHours = Number(closeHours);
          if (!vehicle.current_hours || newHours > vehicle.current_hours) {
            vehicleUpdate.current_hours = newHours;
          }
        }

        if (nextOil) {
          vehicleUpdate.next_oil_change = Number(nextOil);
        }

        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update(vehicleUpdate)
          .eq('id', selectedReport.vehicle_id);

        if (vehicleError) {
          setSaving(false);
          setScreenError(vehicleError.message);
          return;
        }
      }
    }

    setSaving(false);
    setCloseMileage('');
    setCloseHours('');
    setNextOil('');
    setClosingNotes('');

    await loadData();
  }

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
      title="Reports"
      subtitle="Open, in progress, and recently closed reports"
    >
      {screenError && <div className="error">{screenError}</div>}

      <div className="grid-2">
        <div className="card">
          <div className="section-title">Reports</div>

          <div className="stack" style={{ marginTop: 16 }}>
            {reports.map((report) => (
              <button
                key={report.id}
                className="card"
                onClick={() => setSelectedReport(report)}
              >
                <div className="title">{report.title}</div>
                <div className="subtitle">
                  {report.report_type} • {report.status}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          {!selectedReport ? (
            <div>No report selected</div>
          ) : (
            <>
              <div className="title">{selectedReport.title}</div>

              {canClose && selectedReport.status !== 'Closed' && (
                <div style={{ marginTop: 16 }}>
                  <button className="btn" onClick={closeReport}>
                    Close Report
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppFrame>
  );
}
