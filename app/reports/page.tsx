'use client';

import { useEffect, useMemo, useState } from 'react';
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
  vehicle_id: string | null;
  submitted_mileage: number | null;
  submitted_hours: number | null;
  closing_notes: string | null;
  next_oil_change_at_close: number | null;
  closed_by: string | null;
  closed_by_name: string | null;
};

type VehicleRow = {
  id: string;
  equipment_name: string | null;
  unit_number: string | null;
  current_mileage: number | null;
  current_hours: number | null;
  next_oil_change: number | null;
};

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function formatNumber(value: number | null) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat().format(value);
}

function reportBadgeClass(status: string | null) {
  if (status === 'Closed') return 'badge closed';
  if (status === 'In Progress') return 'badge progress';
  return 'badge open';
}

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

  const canClose = role === 'admin' || role === 'mechanic';
  const isAdmin = role === 'admin';

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

    const filtered = ((reportsData || []) as ReportRow[]).filter((r) => {
      if (r.status !== 'Closed') return true;
      if (!r.closed_at) return true;
      const ageDays = (Date.now() - new Date(r.closed_at).getTime()) / 86400000;
      return ageDays <= 30;
    });

    setReports(filtered);
    setSelectedReport((current) => {
      if (current) {
        const updated = filtered.find((r) => r.id === current.id);
        if (updated) return updated;
      }
      return filtered[0] || null;
    });
  }

  async function markInProgress() {
    if (!selectedReport) return;

    setSaving(true);
    setScreenError(null);

    const { error } = await supabase
      .from('reports')
      .update({
        status: 'In Progress',
        updated_at: new Date().toISOString()
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

    const { error: reportError } = await supabase
      .from('reports')
      .update({
        status: 'Closed',
        closed_at: new Date().toISOString(),
        closed_by: profile.id,
        closed_by_name: profile.full_name,
        closing_notes: closingNotes || null,
        closed_mileage: closeMileage ? Number(closeMileage) : null,
        closed_hours: closeHours ? Number(closeHours) : null,
        next_oil_change_at_close: nextOil ? Number(nextOil) : null,
        updated_at: new Date().toISOString()
      })
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

        const newMileage = closeMileage
          ? Number(closeMileage)
          : selectedReport.submitted_mileage ?? null;

        const newHours = closeHours
          ? Number(closeHours)
          : selectedReport.submitted_hours ?? null;

        if (
          newMileage !== null &&
          (!vehicle.current_mileage || newMileage > vehicle.current_mileage)
        ) {
          vehicleUpdate.current_mileage = newMileage;
        }

        if (
          newHours !== null &&
          (!vehicle.current_hours || newHours > vehicle.current_hours)
        ) {
          vehicleUpdate.current_hours = newHours;
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

  async function deleteReport() {
    if (!selectedReport || !isAdmin) return;

    const confirmed = window.confirm(
      'Delete this report permanently? This cannot be undone.'
    );

    if (!confirmed) return;

    setSaving(true);
    setScreenError(null);

    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', selectedReport.id);

    setSaving(false);

    if (error) {
      setScreenError(error.message);
      return;
    }

    setSelectedReport(null);
    await loadData();
  }

  async function exportAllReportsCsv() {
    setScreenError(null);

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      setScreenError(error.message);
      return;
    }

    const rows = (data || []) as any[];

    const headers = [
      'title',
      'report_type',
      'status',
      'vehicle_id',
      'submitted_at',
      'closed_at',
      'closed_by_name',
      'submitted_mileage',
      'submitted_hours',
      'closed_mileage',
      'closed_hours',
      'next_oil_change_at_close',
      'description',
      'closing_notes'
    ];

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const value = row[header] ?? '';
            const escaped = String(value).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interrail-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const reportCountText = useMemo(() => {
    if (reports.length === 1) return '1 report';
    return `${reports.length} reports`;
  }, [reports.length]);

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
      subtitle="Open, in progress, and recently closed reports."
    >
      {screenError ? <div className="error">{screenError}</div> : null}

      <div className="inline-row" style={{ marginBottom: 16 }}>
        {isAdmin ? (
          <button className="btn secondary" onClick={exportAllReportsCsv}>
            Download All Reports (CSV for Excel)
          </button>
        ) : null}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-title">Reports</div>
          <div className="section-sub">{reportCountText}</div>

          <div className="stack" style={{ marginTop: 16 }}>
            {reports.length === 0 ? (
              <div className="card">No reports found.</div>
            ) : (
              reports.map((report) => {
                const vehicle = report.vehicle_id ? vehicles[report.vehicle_id] : null;

                return (
                  <button
                    key={report.id}
                    type="button"
                    className={`report-list-button ${selectedReport?.id === report.id ? 'active' : ''}`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div className="title" style={{ fontSize: 20 }}>
                          {report.title || 'Untitled Report'}
                        </div>
                        <div className="subtitle">
                          {report.report_type || 'Report'} • {vehicle?.equipment_name || 'Vehicle'}
                        </div>
                      </div>

                      <div>
                        <span className={reportBadgeClass(report.status)}>
                          {report.status || 'Open'}
                        </span>
                      </div>
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
              <div className="title">{selectedReport.title || 'Untitled Report'}</div>
              <div className="subtitle" style={{ marginTop: 6 }}>
                {selectedReport.report_type || 'Report'} • {selectedReport.status || 'Open'}
              </div>

              <div style={{ marginTop: 18 }}>
                <div className="label">Description</div>
                <div className="card" style={{ padding: 16 }}>
                  {selectedReport.description || 'No description'}
                </div>
              </div>

              <div className="grid-2" style={{ marginTop: 18 }}>
                <div className="card" style={{ padding: 16 }}>
                  <div className="small" style={{ fontWeight: 700 }}>Submitted</div>
                  <div style={{ marginTop: 6 }}>{formatDateTime(selectedReport.submitted_at)}</div>
                </div>

                <div className="card" style={{ padding: 16 }}>
                  <div className="small" style={{ fontWeight: 700 }}>Closed</div>
                  <div style={{ marginTop: 6 }}>{formatDateTime(selectedReport.closed_at)}</div>
                </div>
              </div>

              <div className="grid-2" style={{ marginTop: 18 }}>
                <div className="card" style={{ padding: 16 }}>
                  <div className="small" style={{ fontWeight: 700 }}>Submitted Mileage</div>
                  <div style={{ marginTop: 6 }}>{formatNumber(selectedReport.submitted_mileage)}</div>
                </div>

                <div className="card" style={{ padding: 16 }}>
                  <div className="small" style={{ fontWeight: 700 }}>Submitted Hours</div>
                  <div style={{ marginTop: 6 }}>{formatNumber(selectedReport.submitted_hours)}</div>
                </div>
              </div>

              <div className="grid-2" style={{ marginTop: 18 }}>
                <div className="card" style={{ padding: 16 }}>
                  <div className="small" style={{ fontWeight: 700 }}>Closed By</div>
                  <div style={{ marginTop: 6 }}>
                    {selectedReport.closed_by_name || '—'}
                  </div>
                </div>

                <div className="card" style={{ padding: 16 }}>
                  <div className="small" style={{ fontWeight: 700 }}>Closed Timestamp</div>
                  <div style={{ marginTop: 6 }}>{formatDateTime(selectedReport.closed_at)}</div>
                </div>
              </div>

              {selectedReport.closing_notes ? (
                <div style={{ marginTop: 18 }}>
                  <div className="label">Closing Notes</div>
                  <div className="card" style={{ padding: 16 }}>
                    {selectedReport.closing_notes}
                  </div>
                </div>
              ) : null}

              {canClose && selectedReport.status !== 'Closed' ? (
                <div className="card" style={{ marginTop: 18 }}>
                  <div className="section-title">Mechanic / Admin Close-Out</div>
                  <div className="section-sub">
                    Mileage, hours, and next oil change update the vehicle when entered here.
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

                  <div className="field">
                    <label className="label">Next Oil Change</label>
                    <input
                      className="input"
                      value={nextOil}
                      onChange={(e) => setNextOil(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label className="label">Closing Notes</label>
                    <textarea
                      value={closingNotes}
                      onChange={(e) => setClosingNotes(e.target.value)}
                    />
                  </div>

                  <div className="inline-row" style={{ marginTop: 16 }}>
                    <button className="btn secondary" onClick={markInProgress} disabled={saving}>
                      Mark In Progress
                    </button>

                    <button className="btn" onClick={closeReport} disabled={saving}>
                      {saving ? 'Saving…' : 'Close Report'}
                    </button>
                  </div>
                </div>
              ) : null}

              {isAdmin ? (
                <div className="card" style={{ marginTop: 18, borderColor: '#f0b8b2' }}>
                  <div className="section-title">Admin Only</div>
                  <div className="section-sub">
                    Permanently delete this report and remove it from the system.
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <button
                      className="btn secondary"
                      onClick={deleteReport}
                      disabled={saving}
                      style={{ borderColor: '#d9534f', color: '#b02a24' }}
                    >
                      Delete Report Permanently
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
