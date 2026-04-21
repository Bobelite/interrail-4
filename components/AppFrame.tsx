'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function AppFrame({
  children,
  title,
  subtitle,
  role
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  role?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const items = [
    { href: '/', label: 'Home' },
    { href: '/vehicles', label: 'Vehicles' },
    { href: '/new-report', label: 'New' },
    { href: '/reports', label: 'Reports' }
  ];

  return (
    <div className="page-shell">
      <div className="topbar">
        <div>
          <div className="logo-row">
            <Image
              src="/logo.webp"
              alt="Interrail"
              width={180}
              height={40}
              className="logo"
            />
          </div>
         <div className="title">{title || 'INTERRAIL FLEET'}</div>
          <div className="subtitle">
            {subtitle || (role ? `${role} view` : 'Fleet reporting')}
          </div>
        </div>

        <button className="btn secondary" onClick={logout}>
          Log out
        </button>
      </div>

      <div className="desktop-nav">
        <div className="desktop-nav-inner">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? 'active' : ''}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="content with-bottom-nav">{children}</div>

      <div className="nav">
        <div className="nav-inner">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? 'active' : ''}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
