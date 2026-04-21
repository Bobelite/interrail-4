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

  const canClose =
    role === 'admin' || role === 'mechanic' || role === 'manager';

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
      setSelectedReport((reportsData[0] as ReportRow) || null);
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
      .update({
        status: 'In Progress'
      })
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
      {screenError ? <div className="error">{screenError}</div> : null}

      <div className="grid-2">
        <div className="card">
          <div className="section-title">Reports</div>
          <div className="section-sub">
            Open, in progress, and recently closed reports.
          </div>

          <div className="stack" style={{ marginTop: 16 }}>
            {reports.length === 0 ? (
              <div className="card">No reports found.</div>
            ) : (
              reports.map((report) => {
                const vehicle = report.vehicle_id
                  ? vehicles[report.vehicle_id]
                  : null;

                return (
                  <button
                    key={report.id}
                    type="button"
                    className="card"
                    style={{
                      textAlign: 'left',
                      border:
                        selectedReport?.id === report.id
                          ? '2px solid var(--blue)'
                          : undefined
                    }}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="title">{report.title || 'Untitled report'}</div>
                    <div className="subtitle">
                      {report.report_type || 'Report'} • {report.status || 'Open'}
                    </div>
                    <div className="small" style={{ marginTop: 6 }}>
                      {vehicle
                        ? `${vehicle.equipment_name || 'Vehicle'} • Unit ${vehicle.unit_number || '—'}`
                        : 'Vehicle not found'}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="card">
          {!selectedReport ? (
            <div>No report selected.</div>
          ) : (
            <>
              <div className="section-title">
                {selectedReport.title || 'Untitled report'}
              </div>
              <div className="section-sub">
                {selectedReport.report_type || 'Report'} •{' '}
                {selectedReport.status || 'Open'}
              </div>

              <div style={{ marginTop: 16 }}>
                <div className="label">Description</div>
                <div className="card" style={{ marginTop: 8 }}>
                  {selectedReport.description || 'No description'}
                </div>
              </div>

              <div className="grid-2" style={{ marginTop: 16 }}>
                <div>
                  <div className="label">Submitted</div>
                  <div className="card" style={{ marginTop: 8 }}>
                    {selectedReport.submitted_at
                      ? new Date(selectedReport.submitted_at).toLocaleString()
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="label">Closed</div>
                  <div className="card" style={{ marginTop: 8 }}>
                    {selectedReport.closed_at
                      ? new Date(selectedReport.closed_at).toLocaleString()
                      : '—'}
                  </div>
                </div>
              </div>

              <div className="grid-2" style={{ marginTop: 16 }}>
                <div>
                  <div className="label">Submitted Mileage</div>
                  <div className="card" style={{ marginTop: 8 }}>
                    {selectedReport.submitted_mileage ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="label">Submitted Hours</div>
                  <div className="card" style={{ marginTop: 8 }}>
                    {selectedReport.submitted_hours ?? '—'}
                  </div>
                </div>
              </div>

              {canClose && selectedReport.status !== 'Closed' ? (
                <div className="card" style={{ marginTop: 18 }}>
                  <div className="section-title">Mechanic / Admin Close-Out</div>
                  <div className="section-sub">
                    Mileage, hours, and next oil change update the vehicle when
                    entered here.
                  </div>

                  <div className="grid-2" style={{ marginTop: 16 }}>
                    <div className="field">
                      <label className="label">Mileage at Close</label>
                      <input
                        className="input"
                        value={closeMileage}
                        onChange={(e) => setCloseMileage(e.target.value)}
                      />
                    </div>

                    <div className="field">
                      <label className="label">Hours at Close</label>
                      <input
                        className="input"
                        value={closeHours}
                        onChange={(e) => setCloseHours(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="field" style={{ marginTop: 14 }}>
                    <label className="label">Next Oil Change</label>
                    <input
                      className="input"
                      value={nextOil}
                      onChange={(e) => setNextOil(e.target.value)}
                    />
                  </div>

                  <div className="field" style={{ marginTop: 14 }}>
                    <label className="label">Closing Notes</label>
                    <textarea
                      className="input"
                      value={closingNotes}
                      onChange={(e) => setClosingNotes(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={markInProgress}
                      disabled={saving}
                    >
                      Mark In Progress
                    </button>

                    <button
                      className="btn"
                      type="button"
                      onClick={closeReport}
                      disabled={saving}
                    >
                      {saving ? 'Saving…' : 'Close Report'}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </AppFrame>
  );
}
