'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ArrowUpDown,
  Bell,
  BarChart2,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

const NAV_ITEMS = [
  { href: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transactions',  icon: ArrowUpDown,     label: 'Transactions' },
  { href: '/alerts',        icon: Bell,            label: 'Alerts' },
  { href: '/reports',       icon: BarChart2,       label: 'Reports' },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-60 flex flex-col bg-navy-900 z-40 select-none">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-navy-800/80">
        <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-none tracking-tight">TaxSentry</p>
          <p className="text-navy-100/40 text-xs mt-0.5 leading-none tracking-wide uppercase">
            QFZP Status Protection
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 sidebar-nav">
        <p className="text-xs font-bold uppercase tracking-wide text-navy-100/30 px-3 mb-2">
          Compliance Tools
        </p>
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium relative',
                  active
                    ? 'bg-navy-800 text-white'
                    : 'text-navy-100/60 hover:bg-navy-800/50 hover:text-navy-100',
                )}
              >
                {/* Active left-border indicator */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-r-full" />
                )}
                <Icon className={cn(
                  'w-4 h-4 flex-shrink-0',
                  active ? 'text-blue-400' : 'text-navy-100/40 group-hover:text-navy-100/70',
                )} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom: settings + user */}
      <div className="px-3 py-3 border-t border-navy-800/80 space-y-0.5">
        <Link
          href="/settings"
          className="group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-navy-100/60 hover:bg-navy-800/50 hover:text-navy-100"
        >
          <Settings className="w-4 h-4 text-navy-100/40 group-hover:text-navy-100/70" />
          Settings
        </Link>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-6 h-6' } }} />
          <span className="text-navy-100/50 text-xs">Account</span>
        </div>
      </div>
    </aside>
  );
}
