'use client';

import { useEffect, useState } from 'react';
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

function formatNumber(value: number | null) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat().format(value);
}

export default function VehiclesPage() {
  const { loading, role, error } = useAuthPage();
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [screenError, setScreenError] = useState<string | null>(null);

  useEffect(() => {
    if (!role) return;

    void (async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('equipment_name', { ascending: true });

      if (error) {
        setScreenError(error.message);
        return;
      }

      setVehicles((data || []) as VehicleRow[]);
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
      title="Vehicles"
      subtitle="Equipment name, unit number, mileage, hours, and next oil change."
    >
      {screenError ? <div className="error">{screenError}</div> : null}

      <div className="card">
        <div className="section-title">Vehicle List</div>
        <div className="section-sub">
          Current readings update when reports are closed out.
        </div>

        <div className="stack" style={{ marginTop: 18 }}>
          {vehicles.length === 0 ? (
            <div className="card">No vehicles found.</div>
          ) : (
            vehicles.map((vehicle) => (
              <div key={vehicle.id} className="card" style={{ padding: 18 }}>
                <div className="title" style={{ fontSize: 22 }}>
                  {vehicle.equipment_name || 'Unnamed Vehicle'}
                </div>
                <div className="subtitle" style={{ marginTop: 4 }}>
                  Unit {vehicle.unit_number || '—'}
                </div>

                <div className="grid-3" style={{ marginTop: 16 }}>
                  <div>
                    <div className="small" style={{ fontWeight: 700 }}>Current Mileage</div>
                    <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>
                      {formatNumber(vehicle.current_mileage)}
                    </div>
                  </div>

                  <div>
                    <div className="small" style={{ fontWeight: 700 }}>Current Hours</div>
                    <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>
                      {formatNumber(vehicle.current_hours)}
                    </div>
                  </div>

                  <div>
                    <div className="small" style={{ fontWeight: 700 }}>Next Oil Change</div>
                    <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>
                      {formatNumber(vehicle.next_oil_change)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppFrame>
  );
}
