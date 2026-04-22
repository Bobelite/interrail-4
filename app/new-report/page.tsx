'use client';

import { useEffect, useState } from 'react';
import AppFrame from '../../components/AppFrame';
import { supabase } from '../../lib/supabase';
import { useAuthPage } from '../../lib/useAuth';

type VehicleRow = {
  id: string;
  equipment_name: string | null;
  unit_number: string | null;
};

export default function NewReportPage() {
  const { loading, role, profile, error } = useAuthPage();

  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const [vehicleId, setVehicleId] = useState('');
  const [reportType, setReportType] = useState('Repair');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mileage, setMileage] = useState('');
  const [hours, setHours] = useState('');

  useEffect(() => {
    if (!role) return;

    void (async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, equipment_name, unit_number')
        .order('equipment_name', { ascending: true });

      if (error) {
        setScreenError(error.message);
        return;
      }

      const rows = (data || []) as VehicleRow[];
      setVehicles(rows);

      if (rows.length > 0) {
        setVehicleId(rows[0].id);
      }
    })();
  }, [role]);

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();

    if (!profile) {
      setScreenError('You must be logged in to submit a report.');
      return;
    }

    if (!vehicleId) {
      setScreenError('Please select a vehicle.');
      return;
    }

    if (!title.trim()) {
      setScreenError('Please enter a title.');
      return;
    }

    if (!description.trim()) {
      setScreenError('Please enter a description.');
      return;
    }

    setSaving(true);
    setScreenError(null);
    setSavedMessage(null);

    const payload: Record<string, any> = {
      vehicle_id: vehicleId,
      report_type: reportType,
      title: title.trim(),
      description: description.trim(),
      status: 'Open',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: profile.id,
      created_by_name: profile.full_name,
      submitted_by: profile.full_name,
      submitted_mileage: mileage ? Number(mileage) : null,
      submitted_hours: hours ? Number(hours) : null
    };

    const { error } = await supabase.from('reports').insert(payload);

    setSaving(false);

    if (error) {
      setScreenError(error.message);
      return;
    }

    setSavedMessage('Report submitted successfully.');
    setReportType('Repair');
    setTitle('');
    setDescription('');
    setMileage('');
    setHours('');
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
      title="New Report"
      subtitle="Service, repair, or note. Mileage and hours stay optional."
    >
      {screenError ? <div className="error">{screenError}</div> : null}

      {savedMessage ? (
        <div
          className="card"
          style={{
            marginBottom: 16,
            borderColor: '#cfe8d7',
            background: '#f3fbf6'
          }}
        >
          <div style={{ fontWeight: 800, color: '#187144' }}>{savedMessage}</div>
        </div>
      ) : null}

      <div className="card" style={{ maxWidth: 860 }}>
        <form onSubmit={submitReport}>
          <div className="field">
            <label className="label">Vehicle</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.equipment_name || 'Unnamed Vehicle'} • Unit{' '}
                  {vehicle.unit_number || '—'}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="Service">Service</option>
              <option value="Repair">Repair</option>
              <option value="Note">Note</option>
            </select>
          </div>

          <div className="field">
            <label className="label">Title</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short description"
            />
          </div>

          <div className="field">
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue, service need, or note"
            />
          </div>

          <div className="grid-2">
            <div className="field">
              <label className="label">Mileage</label>
              <input
                className="input"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="field">
              <label className="label">Hours</label>
              <input
                className="input"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="small" style={{ marginTop: 14 }}>
            Photo upload can be added next. This version saves the report data now.
          </div>

          <div style={{ marginTop: 18 }}>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </AppFrame>
  );
}
