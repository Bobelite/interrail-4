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
  const [saving, setSaving] = useState(false);

  const [equipmentName, setEquipmentName] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [currentMileage, setCurrentMileage] = useState('');
  const [currentHours, setCurrentHours] = useState('');
  const [nextOilChange, setNextOilChange] = useState('');

  const canManageVehicles = role === 'admin' || role === 'mechanic';

  useEffect(() => {
    if (!role) return;
    void loadData();
  }, [role]);

  async function loadData() {
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

    setSelectedVehicleId((current) => {
      if (current && vehicleRows.some((v) => v.id === current)) return current;
      return vehicleRows[0]?.id || null;
    });
  }

  async function addVehicle(e: React.FormEvent) {
    e.preventDefault();
    if (!canManageVehicles) return;

    if (!equipmentName.trim()) {
      setScreenError('Please enter an equipment name.');
      return;
    }

    setSaving(true);
    setScreenError(null);

    const payload: Record<string, any> = {
      equipment_name: equipmentName.trim(),
      unit_number: unitNumber.trim() || null,
      current_mileage: currentMileage ? Number(currentMileage) : null,
      current_hours: currentHours ? Number(currentHours) : null,
      next_oil_change: nextOilChange ? Number(nextOilChange) : null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('vehicles').insert(payload);

    setSaving(false);

    if (error) {
      setScreenError(error.message);
      return;
    }

    setEquipmentName('');
    setUnitNumber('');
    setCurrentMileage('');
    setCurrentHours('');
    setNextOilChange('');

    await loadData();
  }

  async function deleteVehicle() {
    if (!canManageVehicles || !selectedVehicleId) return;

    const vehicle = vehicles.find((v) => v.id === selectedVehicleId);

    const hasHistory = reports.some((r) => r.vehicle_id === selectedVehicleId);
    if (hasHistory) {
      setScreenError(
        'This vehicle has report history and cannot be deleted until its reports are removed or reassigned.'
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete vehicle "${vehicle?.equipment_name || 'Unnamed Vehicle'}" permanently?`
    );

    if (!confirmed) return;

    setSaving(true);
    setScreenError(null);

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', selectedVehicleId);

    setSaving(false);

    if (error) {
      setScreenError(error.message);
      return;
    }

    await loadData();
  }

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

      {canManageVehicles ? (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="section-title">Add Vehicle</div>
          <div className="section-sub">
            Admins and mechanics can add new equipment here.
          </div>

          <form onSubmit={addVehicle}>
            <div className="grid-2" style={{ marginTop: 16 }}>
              <div className="field">
                <label className="label">Equipment Name</label>
                <input
                  className="input"
                  value={equipmentName}
                  onChange={(e) => setEquipmentName(e.target.value)}
                  placeholder="Example: Service Truck"
                />
              </div>

              <div className="field">
                <label className="label">Unit Number</label>
                <input
                  className="input"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder="Example: 17"
                />
              </div>
            </div>

            <div className="grid-3" style={{ marginTop: 6 }}>
              <div className="field">
                <label className="label">Current Mileage</label>
                <input
                  className="input"
                  value={currentMileage}
                  onChange={(e) => setCurrentMileage(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="field">
                <label className="label">Current Hours</label>
                <input
                  className="input"
                  value={currentHours}
                  onChange={(e) => setCurrentHours(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="field">
                <label className="label">Next Oil Change</label>
                <input
                  className="input"
                  value={nextOilChange}
                  onChange={(e) => setNextOilChange(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="inline-row" style={{ marginTop: 16 }}>
              <button className="btn" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Add Vehicle'}
              </button>

              {selectedVehicle ? (
                <button
                  className="btn secondary"
                  type="button"
                  onClick={deleteVehicle}
                  disabled={saving}
                  style={{ borderColor: '#d9534f', color: '#b02a24' }}
                >
                  Delete Selected Vehicle
                </button>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}

      <div className="grid-2">
        <div className="card">
          <div className="section-title">Vehicle List</div>
          <div className="section-sub">
            Tap a vehicle to see readings and recent repair/service history.
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
