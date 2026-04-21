'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function PageShell({ title, subtitle, children }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', color: '#1f2937' }}>
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 20px',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700 }}>Interrail Fleet</div>
        <div style={{ fontSize: 14, color: '#64748b' }}>{subtitle || 'Fleet reporting'}</div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 28 }}>{title}</h1>
        </div>
        {children}
      </main>

      <nav
        style={{
          position: 'sticky',
          bottom: 0,
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          padding: 12,
          display: 'flex',
          justifyContent: 'space-around'
        }}
      >
        <Link href="/">Home</Link>
        <Link href="/vehicles">Vehicles</Link>
        <Link href="/new-report">New Report</Link>
        <Link href="/reports">Reports</Link>
      </nav>
    </div>
  );
}
