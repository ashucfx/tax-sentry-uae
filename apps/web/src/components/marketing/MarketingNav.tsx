'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function TaxSentryLogo({ size = 32, gradId = 'ts-logo-grad', filterId = 'ts-logo-glow' }: { size?: number; gradId?: string; filterId?: string }) {
  const h = Math.round(size * 42 / 36);
  return (
    <svg width={size} height={h} viewBox="0 0 36 42" fill="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="36" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <filter id={filterId}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d="M18 2L3 8.5v11C3 28.5 9.8 36.8 18 40c8.2-3.2 15-11.5 15-20.5v-11L18 2z" fill={`url(#${gradId})`} />
      <path d="M18 2L3 8.5v11C3 28.5 9.8 36.8 18 40c8.2-3.2 15-11.5 15-20.5v-11L18 2z" fill="none" stroke="#3b82f6" strokeWidth="1.5" filter={`url(#${filterId})`} />
      <path d="M18 6L6 11.5v9.5C6 27.5 11.2 34 18 37c6.8-3 12-9.5 12-16v-9.5L18 6z" fill="rgba(96,165,250,0.12)" />
      <path d="M12 21l4 4 8-9" stroke="#60a5fa" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${filterId})`} />
    </svg>
  );
}

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        height: 68,
        padding: scrolled ? '0' : '8px 0',
        background: scrolled ? 'oklch(0.12 0.025 255 / 0.94)' : 'transparent',
        borderBottom: `1px solid ${scrolled ? 'var(--ts-border-subtle)' : 'transparent'}`,
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        className="flex items-center justify-between h-full"
        style={{ maxWidth: 1160, margin: '0 auto', padding: '0 32px' }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
          <TaxSentryLogo size={28} gradId="nav-sg" filterId="nav-sf" />
          <div>
            <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--ts-fg-primary)', letterSpacing: '-0.02em', lineHeight: 1, margin: 0 }}>
              Tax<span style={{ color: '#60a5fa' }}>Sentry</span>
            </p>
            <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'oklch(0.58 0.12 260)', lineHeight: 1, marginTop: 2 }}>
              UAE QFZP Monitor
            </p>
          </div>
        </Link>

        {/* Nav links */}
        <ul className="hidden md:flex items-center list-none" style={{ gap: 36 }}>
          {[
            ['How It Works', '#how'],
            ['Features', '#features'],
            ['Pricing', '#pricing'],
            ['Security', '#security'],
          ].map(([label, href]) => (
            <li key={label}>
              <Link
                href={href}
                className="relative group transition-colors hover:text-white"
                style={{ fontSize: 14, fontWeight: 500, color: 'var(--ts-fg-muted)', textDecoration: 'none' }}
              >
                {label}
                <span
                  className="absolute bottom-[-3px] left-0 w-0 group-hover:w-full transition-all duration-250"
                  style={{ height: '1.5px', background: '#3b82f6', display: 'block' }}
                />
              </Link>
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="rounded-lg px-4 py-2 text-[13px] font-medium transition-colors hover:text-white"
            style={{ color: 'var(--ts-fg-muted)', textDecoration: 'none' }}
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold transition-all hover:-translate-y-px"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white',
              boxShadow: '0 4px 20px rgba(37,99,235,0.35)',
              textDecoration: 'none',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(37,99,235,0.55)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(37,99,235,0.35)'; }}
          >
            Start Free Trial <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
