'use client';

import AppFrame from '../components/AppFrame';
import { useAuthPage } from '../lib/useAuth';

export default function HomePage() {
  const { loading, role, error } = useAuthPage();

  if (loading) return <div>Loading…</div>;
  if (error) return <div>{error}</div>;

  return (
    <AppFrame role={role}>
      <div>HOME CONTENT</div>
    </AppFrame>
  );
}
