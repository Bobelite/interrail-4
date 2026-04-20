'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/');
  }

  return (
    <div className="page-shell">
      <div className="login-wrap">
        <div className="card login-card">
          <Image src="/logo.webp" alt="Interrail" width={220} height={50} className="logo" style={{ display: 'block', margin: '0 auto 16px' }} />
          <div className="section-title" style={{ textAlign: 'center', fontSize: 34 }}>Interrail Fleet</div>
          <div className="section-sub" style={{ textAlign: 'center' }}>Sign in with your Supabase user email and password.</div>
          <form className="stack" style={{ marginTop: 18 }} onSubmit={onSubmit}>
            <div className="field">
              <label className="label">Email</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error ? <div className="error">{error}</div> : null}
            <button className="btn" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Log In'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
