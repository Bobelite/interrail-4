'use client';

import { useEffect, useMemo, useState } from 'react';
import AppFrame from '../../components/AppFrame';
import { supabase } from '../../lib/supabase';
import { useAuthPage } from '../../lib/useAuth';
import type { Report, Vehicle } from '../../lib/types';

export default function ReportsPage() {
  const { loading, role, error, userId } = useAuthPage();
  const [reports, setReports] = useState<Report[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [closeout, setCloseout] = useState({ closed_mileage: '', closed_hours: '', next_oil_change_at_close: '', closing_notes: '' });

  async function loadAll() {
    const [{ data: reportData }, { data: vehicleData }] = await Promise.all([
      supabase.from('reports').select('*').order('submitted_at', { ascending: false }),
      supabase.from('vehicles').select('*')
    ]);
    const visible = ((reportData || []) as Report[]).filter((r) => r.status !== 'Closed' || !r.closed_at || ((Date.now() - new Date(r.closed_at).getTime()) / 86400000) <= 30);
    setReports(visible);
    setVehicles((vehicleData || []) as Vehicle[]);
    if (visible[0]) setSelectedId(visible[0].id);
  }

  useEffect(() => { if (role) void loadAll(); }, [role]);

  const vehicleMap = useMemo(() => Object.fromEntries(vehicles.map((v) => [v.id, v])), [vehicles]);
  const selected = reports.find((r) => r.id === selectedId) || null;
  const canClose = role === 'admin' || role === 'mechanic';

  async function setInProgress() {
    if (!selected || !canClose) return;
    const { error } = await supabase.from('reports').update({ status: 'In Progress' }).eq('id', selected.id);
    if (error) setMsg(error.message); else { setMsg('Report updated.'); void loadAll(); }
  }

  async function closeReport() {
    if (!selected || !canClose || !userId) return;
    setMsg(null);
    const closeMileage = closeout.closed_mileage ? Number(closeout.closed_mileage) : null;
    const closeHours = closeout.closed_hours ? Number(closeout.closed_hours) : null;
    const nextOil = closeout.next_oil_change_at_close ? Number(closeout.next_oil_change_at_close) : null;

    const { error: reportError } = await supabase.from('reports').update({
      status: 'Closed',
      closed_mileage: closeMileage,
      closed_hours: closeHours,
      next_oil_change_at_close: nextOil,
      closing_notes: closeout.closing_notes || null,
      closed_at: new Date().toISOString(),
      closed_by: userId,
    }).eq('id', selected.id);

    if (reportError) {
      setMsg(reportError.message);
      return;
    }

    const vehicle = vehicleMap[selected.vehicle_id];
    if (vehicle) {
      const update: Record<string, number | null> = {};
      if (closeMileage && (!vehicle.current_mileage || closeMileage > vehicle.current_mileage)) update.current_mileage = closeMileage;
      if (closeHours && (!vehicle.current_hours || closeHours > vehicle.current_hours)) update.current_hours = closeHours;
      if (nextOil) update.next_oil_change = nextOil;
      if (Object.keys(update).length) {
        const { error: vehicleError } = await supabase.from('vehicles').update(update).eq('id', vehicle.id);
        if (vehicleError) {
          setMsg(vehicleError.message);
          return;
        }
      }
    }

    setCloseout({ closed_mileage: '', closed_hours: '', next_oil_change_at_close: '', closing_notes: '' });
    setMsg('Report closed and vehicle updated.');
    void loadAll();
  }

  if (loading) return <div className="page-shell"><div className="content"><div className="card">Loading…</div></div></div>;
  if (error) return <div className="page-shell"><div className="content"><div className="error">{error}</div></div></div>;

  return (
    <AppFrame role={role} title="Reports" subtitle="Open and in-progress stay visible to everyone. Closed stay visible for 30 days.">
      <div className="grid-2">
        <div className="card">
          <div className="title">Active Reports</div>
          <div className="stack" style={{ marginTop: 14 }}>
            {reports.map((r) => (
              <button key={r.id} className="card" style={{ textAlign: 'left', padding: 14, background: selectedId === r.id ? '#eff6ff' : 'white' }} onClick={() => setSelectedId(r.id)}>
                <div className="spread">
                  <div>
                    <div style={{ fontWeight: 800 }}>{r.title}</div>
                    <div className="muted">{vehicleMap[r.vehicle_id]?.equipment_name || 'Vehicle'} • {r.report_type}</div>
                  </div>
                  <span className={`badge ${r.status === 'Closed' ? 'closed' : r.status === 'In Progress' ? 'progress' : 'open'}`}>{r.status}</span>
                </div>
              </button>
            ))}
            {reports.length === 0 ? <div className="notice">No active reports yet.</div> : null}
          </div>
        </div>

        <div className="card">
          {!selected ? <div className="notice">Select a report.</div> : (
            <>
              <div className="spread">
                <div>
                  <div className="title">{selected.title}</div>
                  <div className="subtitle">{vehicleMap[selected.vehicle_id]?.equipment_name} • Unit {vehicleMap[selected.vehicle_id]?.unit_number || '—'}</div>
                </div>
                <span className={`badge ${selected.status === 'Closed' ? 'closed' : selected.status === 'In Progress' ? 'progress' : 'open'}`}>{selected.status}</span>
              </div>
              <div className="card" style={{ marginTop: 14, padding: 14 }}>{selected.description || 'No description.'}</div>
              <div className="value-grid">
                <div className="mini"><div className="mini-k">Submitted</div><div className="mini-v">{new Date(selected.submitted_at).toLocaleDateString()}</div></div>
                <div className="mini"><div className="mini-k">Closed</div><div className="mini-v">{selected.closed_at ? new Date(selected.closed_at).toLocaleDateString() : '—'}</div></div>
                <div className="mini"><div className="mini-k">Mileage</div><div className="mini-v">{selected.closed_mileage ?? selected.submitted_mileage ?? '—'}</div></div>
                <div className="mini"><div className="mini-k">Hours</div><div className="mini-v">{selected.closed_hours ?? selected.submitted_hours ?? '—'}</div></div>
              </div>
              {msg ? <div className={msg.includes('updated') || msg.includes('closed') ? 'notice' : 'error'} style={{ marginTop: 14 }}>{msg}</div> : null}
              {canClose && selected.status !== 'Closed' ? (
                <div className="card" style={{ marginTop: 14 }}>
                  <div className="title">Mechanic / Admin Close-Out</div>
                  <div className="subtitle">Mileage, hours, and next oil change update the vehicle when entered here.</div>
                  <div className="grid-2" style={{ marginTop: 14 }}>
                    <div className="field"><label className="label">Mileage at Close</label><input className="input" value={closeout.closed_mileage} onChange={(e) => setCloseout({ ...closeout, closed_mileage: e.target.value })} /></div>
                    <div className="field"><label className="label">Hours at Close</label><input className="input" value={closeout.closed_hours} onChange={(e) => setCloseout({ ...closeout, closed_hours: e.target.value })} /></div>
                  </div>
                  <div className="field"><label className="label">Next Oil Change</label><input className="input" value={closeout.next_oil_change_at_close} onChange={(e) => setCloseout({ ...closeout, next_oil_change_at_close: e.target.value })} /></div>
                  <div className="field"><label className="label">Closing Notes</label><textarea className="textarea" value={closeout.closing_notes} onChange={(e) => setCloseout({ ...closeout, closing_notes: e.target.value })} /></div>
                  <div className="row" style={{ marginTop: 14 }}>
                    <button className="btn secondary" onClick={setInProgress}>Mark In Progress</button>
                    <button className="btn" onClick={closeReport}>Close Report</button>
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
