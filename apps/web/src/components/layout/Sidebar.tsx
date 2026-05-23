'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  TrendingUp,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { logoutAction } from '@/lib/auth/actions';
import { useState, useEffect } from 'react';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/revenue',      icon: TrendingUp,      label: 'Revenue',  badge: 1 },
  { href: '/substance',    icon: FileText,        label: 'Substance' },
  { href: '/reports',      icon: BarChart3,       label: 'Reports' },
  { href: '/settings',     icon: Settings,        label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on navigation on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await logoutAction();
    router.push('/sign-in');
  };

  return (
    <>
      {/* Mobile Header (Sticky Top) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 z-30 flex items-center justify-between px-4" style={{ background: 'var(--ts-bg-deepest)', borderBottom: '1px solid var(--ts-border-subtle)' }}>
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ts-blue-500)" strokeWidth="1.5">
            <path d="M12 2L3 7v7c0 5.25 3.75 10.15 9 11.5C17.25 24.15 21 19.25 21 14V7L12 2z" fill="oklch(0.55 0.22 260 / 0.15)" />
            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-bold" style={{ color: 'var(--ts-fg-primary)' }}>Tax<span style={{ color: 'var(--ts-blue-500)' }}>Sentry</span></span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2" style={{ color: 'var(--ts-fg-primary)' }}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col select-none transition-transform duration-300 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          width: 240,
          background: 'var(--ts-bg-deepest)',
          borderRight: '1px solid var(--ts-border-subtle)',
        }}
      >
        {/* Logo */}
        <div
          className="hidden md:flex items-center gap-2.5 px-5"
          style={{ height: 64, borderBottom: '1px solid var(--ts-border-subtle)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ts-blue-500)" strokeWidth="1.5">
            <path d="M12 2L3 7v7c0 5.25 3.75 10.15 9 11.5C17.25 24.15 21 19.25 21 14V7L12 2z"
              fill="oklch(0.55 0.22 260 / 0.15)" />
            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <p className="text-sm font-bold leading-none" style={{ color: 'var(--ts-fg-primary)' }}>
              Tax<span style={{ color: 'var(--ts-blue-500)' }}>Sentry</span>
            </p>
            <p
              className="mt-0.5 leading-none"
              style={{
                fontSize: 8,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'oklch(0.40 0 0)',
              }}
            >
              UAE QFZP Monitor
            </p>
          </div>
        </div>

        {/* Mobile Sidebar Header */}
        <div className="md:hidden flex items-center justify-between px-5" style={{ height: 64, borderBottom: '1px solid var(--ts-border-subtle)' }}>
           <span className="text-sm font-bold" style={{ color: 'var(--ts-fg-primary)' }}>Tax<span style={{ color: 'var(--ts-blue-500)' }}>Sentry</span> Menu</span>
           <button onClick={() => setIsOpen(false)} style={{ color: 'oklch(0.60 0 0)' }}><X size={20} /></button>
        </div>

      {/* Navigation */}
      <nav className="flex-1 sidebar-nav px-2.5 py-4">
        <p
          className="px-2.5 mb-2"
          style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'oklch(0.52 0 0)',
          }}
        >
          Main Menu
        </p>
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'group relative flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] font-medium transition-all',
                  active
                    ? 'text-[oklch(0.55_0.22_260)]'
                    : 'hover:text-[oklch(0.88_0_0)]',
                )}
                style={{
                  background: active
                    ? 'oklch(0.55 0.22 260 / 0.1)'
                    : 'transparent',
                  color: active
                    ? 'oklch(0.55 0.22 260)'
                    : 'oklch(0.60 0 0)',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--ts-bg-card)';
                    (e.currentTarget as HTMLElement).style.color = 'oklch(0.88 0 0)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'oklch(0.60 0 0)';
                  }
                }}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                    style={{ width: 3, height: 20, background: 'var(--ts-blue-500)' }}
                  />
                )}
                <Icon
                  className="flex-shrink-0"
                  size={17}
                  color={active ? 'var(--ts-blue-500)' : 'currentColor'}
                />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span
                    className="flex items-center justify-center rounded-full text-[9px] font-bold"
                    style={{
                      width: 18,
                      height: 18,
                      background: 'var(--ts-amber-500)',
                      color: 'oklch(0.20 0.05 85)',
                    }}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Help & Sign Out */}
      <div className="px-2.5" style={{ borderTop: '1px solid var(--ts-border-subtle)' }}>
        <button
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12px] transition-all"
          style={{ color: 'oklch(0.50 0 0)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--ts-bg-card)';
            (e.currentTarget as HTMLElement).style.color = 'oklch(0.75 0 0)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'oklch(0.50 0 0)';
          }}
        >
          <HelpCircle size={15} color="currentColor" />
          Help &amp; Support
        </button>
        <button
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12px] transition-all"
          style={{ color: 'oklch(0.50 0 0)' }}
          onClick={handleSignOut}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--ts-bg-card)';
            (e.currentTarget as HTMLElement).style.color = 'oklch(0.75 0 0)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'oklch(0.50 0 0)';
          }}
        >
          <LogOut size={15} color="currentColor" />
          Sign Out
        </button>
      </div>

      {/* System Status Footer */}
      <div className="p-3">
        <div
          className="relative overflow-hidden rounded-[10px] p-3"
          style={{
            background: 'linear-gradient(135deg, var(--ts-bg-card), var(--ts-bg-deepest))',
            border: '1px solid oklch(0.28 0.025 255 / 0.6)',
          }}
        >
          <div
            className="absolute top-0 left-0 right-0"
            style={{
              height: 1,
              background: 'linear-gradient(90deg, transparent, oklch(0.55 0.22 260 / 0.5), transparent)',
            }}
          />
          <div className="mb-1.5 flex items-center gap-1.5">
            <span
              className="inline-block rounded-full"
              style={{
                width: 6,
                height: 6,
                background: 'var(--ts-green-500)',
                boxShadow: '0 0 6px var(--ts-green-500)',
              }}
            />
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ts-green-500)' }}>
              System Operational
            </span>
          </div>
          {[
            ['Region', 'me-central1'],
            ['Encryption', 'AES-256'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between" style={{ fontSize: 9, marginBottom: 2 }}>
              <span style={{ color: 'oklch(0.40 0 0)' }}>{k}</span>
              <span style={{ color: 'oklch(0.70 0 0)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
    </>
  );
}
