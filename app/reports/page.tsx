'use client';

import { useEffect, useMemo, useState } from 'react';
import AppFrame from '../../components/AppFrame';
import { supabase } from '../../lib/supabase';
import { useAuthPage } from '../../lib/useAuth';

type VehicleRow = {
  id: string;
  equipment_name: string | null;
  unit_number: string | null;
  current_mileage: number | null;
  current_hours: number | null;
  next_oil_change: number | null;
};

type ReportRow = {
  id: string;
  vehicle_id: string | null;
  title: string | null;
  report_type: string | null;
  status: string | null;
  submitted_at: string | null;
  closed_at: string | null;
  description: string | null;
  closing_notes: string | null;
};

function formatNumber(value: number | null) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat().format(value);
}

function formatShortDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function badgeClass(status: string | null) {
  if (status === 'Closed') return 'badge closed';
  if (status === 'In Progress') return 'badge progress';
  return 'badge open';
}

export default function VehiclesPage() {
  const { loading, role, error } = useAuthPage();

  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);

  useEffect(() => {
    if (!role) return;

    void (async () => {
      setScreenError(null);

      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .order('equipment_name', { ascending: true });

      if (vehicleError) {
        setScreenError(vehicleError.message);
        return;
      }

      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('id, vehicle_id, title, report_type, status, submitted_at, closed_at, description, closing_notes')
        .order('submitted_at', { ascending: false });

      if (reportError) {
        setScreenError(reportError.message);
        return;
      }

      const vehicleRows = (vehicleData || []) as VehicleRow[];
      setVehicles(vehicleRows);
      setReports((reportData || []) as ReportRow[]);

      if (vehicleRows.length > 0) {
        setSelectedVehicleId(vehicleRows[0].id);
      }
    })();
  }, [role]);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedVehicleId) || null,
    [vehicles, selectedVehicleId]
  );

  const selectedVehicleHistory = useMemo(() => {
    if (!selectedVehicleId) return [];
    return reports
      .filter((r) => r.vehicle_id === selectedVehicleId)
      .sort((a, b) => {
        const aDate = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
        const bDate = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, 8);
  }, [reports, selectedVehicleId]);

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
      title="Vehicles"
      subtitle="Equipment details, current readings, and recent history."
    >
      {screenError ? <div className="error">{screenError}</div> : null}

      <div className="grid-2">
        <div className="card">
          <div className="section-title">Vehicle List</div>
          <div className="section-sub">
            Tap a vehicle to see current readings and recent repair/service history.
          </div>

          <div className="stack" style={{ marginTop: 16 }}>
            {vehicles.length === 0 ? (
              <div className="card">No vehicles found.</div>
            ) : (
              vehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  type="button"
                  className={`report-list-button ${selectedVehicleId === vehicle.id ? 'active' : ''}`}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div className="title" style={{ fontSize: 20 }}>
                        {vehicle.equipment_name || 'Unnamed Vehicle'}
                      </div>
                      <div className="subtitle">
                        Unit {vehicle.unit_number || '—'}
                      </div>
                    </div>

                    <div className="small" style={{ fontWeight: 700 }}>
                      {reports.filter((r) => r.vehicle_id === vehicle.id && r.status !== 'Closed').length} open
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="card">
          {!selectedVehicle ? (
            <div>No vehicle selected.</div>
          ) : (
            <>
              <div className="title">
                {selectedVehicle.equipment_name || 'Unnamed Vehicle'}
              </div>
              <div className="subtitle" style={{ marginTop: 4 }}>
                Unit {selectedVehicle.unit_number || '—'}
              </div>

              <div className="grid-3" style={{ marginTop: 18 }}>
                <div className="card" style={{ padding: 16 }}>
                  <div className="small" style={{ fontWeight: 700 }}>Current Mileage</div>
                  <div style={{ marginTop: 8, fontSize: 24, fontWeight: 800 }}>
                    {formatNumber(selectedVehicle.current_mileage)}
                  </div>
                </div>

                <div className="card" style={{ padding: 16 }}>
                  <div className="small" style={{ fontWeight: 700 }}>Current Hours</div>
                  <div style={{ marginTop: 8, fontSize: 24, fontWeight: 800 }}>
                    {formatNumber(selectedVehicle.current_hours)}
                  </div>
                </div>

                <div className="card" style={{ padding: 16 }}>
                  <div className="small" style={{ fontWeight: 700 }}>Next Oil Change</div>
                  <div style={{ marginTop: 8, fontSize: 24, fontWeight: 800 }}>
                    {formatNumber(selectedVehicle.next_oil_change)}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 22 }}>
                <div className="section-title">Recent History</div>
                <div className="section-sub">
                  Recent reports, repairs, and services for this vehicle.
                </div>

                <div className="stack" style={{ marginTop: 14 }}>
                  {selectedVehicleHistory.length === 0 ? (
                    <div className="card" style={{ padding: 16 }}>
                      No history found for this vehicle.
                    </div>
                  ) : (
                    selectedVehicleHistory.map((report) => (
                      <div key={report.id} className="card" style={{ padding: 16 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 12,
                            alignItems: 'flex-start'
                          }}
                        >
                          <div>
                            <div className="title" style={{ fontSize: 18 }}>
                              {report.title || 'Untitled Report'}
                            </div>
                            <div className="subtitle" style={{ marginTop: 4 }}>
                              {report.report_type || 'Report'} • Submitted {formatShortDate(report.submitted_at)}
                            </div>
                          </div>

                          <span className={badgeClass(report.status)}>
                            {report.status || 'Open'}
                          </span>
                        </div>

                        {report.description ? (
                          <div className="small" style={{ marginTop: 10 }}>
                            {report.description}
                          </div>
                        ) : null}

                        {report.closing_notes ? (
                          <div className="small" style={{ marginTop: 10 }}>
                            <strong>Closing Notes:</strong> {report.closing_notes}
                          </div>
                        ) : null}

                        <div className="small" style={{ marginTop: 10 }}>
                          Closed: {formatShortDate(report.closed_at)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppFrame>
  );
}
