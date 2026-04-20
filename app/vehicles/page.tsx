'use client';

import { useEffect, useState } from 'react';
import AppFrame from '../../components/AppFrame';
import { supabase } from '../../lib/supabase';
import { useAuthPage } from '../../lib/useAuth';
import type { Vehicle } from '../../lib/types';

export default function VehiclesPage() {
  const { loading, role, error } = useAuthPage();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ equipment_name: '', unit_number: '', current_mileage: '', current_hours: '', next_oil_change: '' });

  async function loadVehicles() {
    const { data } = await supabase.from('vehicles').select('*').order('equipment_name');
    setVehicles((data || []) as Vehicle[]);
  }

  useEffect(() => { if (role) void loadVehicles(); }, [role]);

  async function addVehicle(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const canEdit = role === 'admin' || role === 'mechanic';
    if (!canEdit) {
      setMsg('Only admins and mechanics can add vehicles.');
      return;
    }
    const { error } = await supabase.from('vehicles').insert({
      equipment_name: form.equipment_name,
      unit_number: form.unit_number || null,
      current_mileage: form.current_mileage ? Number(form.current_mileage) : null,
      current_hours: form.current_hours ? Number(form.current_hours) : null,
      next_oil_change: form.next_oil_change ? Number(form.next_oil_change) : null,
    });
    if (error) {
      setMsg(error.message);
      return;
    }
    setForm({ equipment_name: '', unit_number: '', current_mileage: '', current_hours: '', next_oil_change: '' });
    setMsg('Vehicle added.');
    void loadVehicles();
  }

  if (loading) return <div className="page-shell"><div className="content"><div className="card">Loading…</div></div></div>;
  if (error) return <div className="page-shell"><div className="content"><div className="error">{error}</div></div></div>;

  return (
    <AppFrame role={role} title="Vehicles" subtitle="Equipment name, unit number, mileage, hours, and next oil change.">
      <div className="grid-2">
        <div className="card">
          <div className="title">Vehicle List</div>
          <div className="stack" style={{ marginTop: 14 }}>
            {vehicles.map((v) => (
              <div key={v.id} className="card" style={{ padding: 14 }}>
                <div className="spread">
                  <div>
                    <div style={{ fontWeight: 800 }}>{v.equipment_name}</div>
                    <div className="muted">Unit {v.unit_number || '—'}</div>
                  </div>
                </div>
                <div className="value-grid">
                  <div className="mini"><div className="mini-k">Current Mileage</div><div className="mini-v">{v.current_mileage ?? '—'}</div></div>
                  <div className="mini"><div className="mini-k">Current Hours</div><div className="mini-v">{v.current_hours ?? '—'}</div></div>
                  <div className="mini"><div className="mini-k">Next Oil Change</div><div className="mini-v">{v.next_oil_change ?? '—'}</div></div>
                </div>
              </div>
            ))}
            {vehicles.length === 0 ? <div className="notice">No vehicles yet. Add your first one on the right.</div> : null}
          </div>
        </div>

        <div className="card">
          <div className="title">Add Vehicle</div>
          <div className="subtitle">Managers and mechanics can add equipment here.</div>
          <form className="stack" style={{ marginTop: 14 }} onSubmit={addVehicle}>
            <div className="field"><label className="label">Equipment Name</label><input className="input" value={form.equipment_name} onChange={(e) => setForm({ ...form, equipment_name: e.target.value })} required /></div>
            <div className="field"><label className="label">Unit Number</label><input className="input" value={form.unit_number} onChange={(e) => setForm({ ...form, unit_number: e.target.value })} /></div>
            <div className="field"><label className="label">Current Mileage</label><input className="input" value={form.current_mileage} onChange={(e) => setForm({ ...form, current_mileage: e.target.value })} /></div>
            <div className="field"><label className="label">Current Hours</label><input className="input" value={form.current_hours} onChange={(e) => setForm({ ...form, current_hours: e.target.value })} /></div>
            <div className="field"><label className="label">Next Oil Change</label><input className="input" value={form.next_oil_change} onChange={(e) => setForm({ ...form, next_oil_change: e.target.value })} /></div>
            {msg ? <div className={msg.includes('added') ? 'notice' : 'error'}>{msg}</div> : null}
            <button className="btn" type="submit">Save Vehicle</button>
          </form>
        </div>
      </div>
    </AppFrame>
  );
}
