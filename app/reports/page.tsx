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
  vehicle_id: string | null;
};

export default function ReportsPage() {
  const { loading, role, profile, error } = useAuthPage();

  const [reports, setReports] = useState<ReportRow[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ✅ FIXED HERE (no "manager")
  const canClose = role === 'admin' || role === 'mechanic'; //NEW COMMIT

  useEffect(() => {
    if (!role) return;
    loadReports();
  }, [role]);

  async function loadReports() {
    setScreenError(null);

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      setScreenError(error.message);
      return;
    }

    setReports(data || []);
    setSelectedReport(data?.[0] || null);
  }

  async function closeReport() {
    if (!selectedReport || !profile) return;

    setSaving(true);
    setScreenError(null);

    const { error } = await supabase
      .from('reports')
      .update({
        status: 'Closed',
        closed_at: new Date().toISOString(),
        closed_by: profile.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedReport.id);

    setSaving(false);

    if (error) {
      setScreenError(error.message);
      return;
    }

    await loadReports();
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
    <AppFrame role={role} title="Reports">
      {screenError && <div className="error">{screenError}</div>}

      <div className="grid-2">
        <div className="card">
          <div className="section-title">Reports</div>

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

        <div className="card">
          {!selectedReport ? (
            <div>No report selected</div>
          ) : (
            <>
              <div className="title">{selectedReport.title}</div>
              <div className="subtitle">{selectedReport.description}</div>

              {canClose && selectedReport.status !== 'Closed' && (
                <button
                  className="btn"
                  onClick={closeReport}
                  style={{ marginTop: 16 }}
                  disabled={saving}
                >
                  {saving ? 'Closing…' : 'Close Report'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </AppFrame>
  );
}
