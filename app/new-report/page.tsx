'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppFrame from '../../components/AppFrame';
import { supabase } from '../../lib/supabase';
import { useAuthPage } from '../../lib/useAuth';
import type { Vehicle } from '../../lib/types';

export default function NewReportPage() {
  const router = useRouter();
  const { loading, role, error, profile, userId } = useAuthPage();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ vehicle_id: '', report_type: 'Repair', title: '', description: '', submitted_mileage: '', submitted_hours: '' });

  useEffect(() => {
    if (!role) return;
    void (async () => {
      const { data } = await supabase.from('vehicles').select('*').order('equipment_name');
      const list = (data || []) as Vehicle[];
      setVehicles(list);
      if (list[0]) setForm((f) => ({ ...f, vehicle_id: list[0].id }));
    })();
  }, [role]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    const { error } = await supabase.from('reports').insert({
      vehicle_id: form.vehicle_id,
      report_type: form.report_type,
      title: form.title,
      description: form.description || null,
      submitted_mileage: form.submitted_mileage ? Number(form.submitted_mileage) : null,
      submitted_hours: form.submitted_hours ? Number(form.submitted_hours) : null,
      status: 'Open',
      created_by_name: profile?.full_name || 'User',
      submitted_by: userId,
    });
    if (error) {
      setMsg(error.message);
      return;
    }
    router.push('/reports');
  }

  if (loading) return <div className="page-shell"><div className="content"><div className="card">Loading…</div></div></div>;
  if (error) return <div className="page-shell"><div className="content"><div className="error">{error}</div></div></div>;

  return (
    <AppFrame role={role} title="New Report" subtitle="Service, repair, or note. Mileage and hours stay optional.">
      <div className="card" style={{ maxWidth: 760 }}>
        <form className="stack" onSubmit={submit}>
          <div className="field"><label className="label">Vehicle</label><select className="select" value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.equipment_name} • Unit {v.unit_number || '—'}</option>)}</select></div>
          <div className="field"><label className="label">Report Type</label><select className="select" value={form.report_type} onChange={(e) => setForm({ ...form, report_type: e.target.value })}><option>Service</option><option>Repair</option><option>Note</option></select></div>
          <div className="field"><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="field"><label className="label">Description</label><textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid-2">
            <div className="field"><label className="label">Mileage</label><input className="input" value={form.submitted_mileage} onChange={(e) => setForm({ ...form, submitted_mileage: e.target.value })} /></div>
            <div className="field"><label className="label">Hours</label><input className="input" value={form.submitted_hours} onChange={(e) => setForm({ ...form, submitted_hours: e.target.value })} /></div>
          </div>
          <div className="small">Photo upload can be added next, but this build will save the actual report data now.</div>
          {msg ? <div className="error">{msg}</div> : null}
          <button className="btn" type="submit">Submit Report</button>
        </form>
      </div>
    </AppFrame>
  );
}
