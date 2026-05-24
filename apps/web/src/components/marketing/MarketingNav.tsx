'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, BarChart3, Lock, FileCheck, Zap } from 'lucide-react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';

export function TaxSentryLogo({ size = 32 }: { size?: number }) {
  const h = Math.round(size * 42 / 36);
  return (
    <svg width={size} height={h} viewBox="0 0 36 42" fill="none">
      <defs>
        <linearGradient id="ts-logo-grad" x1="0" y1="0" x2="36" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--ts-blue-600)" />
          <stop offset="100%" stopColor="var(--ts-blue-500)" />
        </linearGradient>
      </defs>
      <path d="M18 2L3 8.5v11C3 28.5 9.8 36.8 18 40c8.2-3.2 15-11.5 15-20.5v-11L18 2z" fill="url(#ts-logo-grad)" />
      <path d="M18 2L3 8.5v11C3 28.5 9.8 36.8 18 40c8.2-3.2 15-11.5 15-20.5v-11L18 2z" fill="none" stroke="var(--ts-blue-400)" strokeWidth="1.5" />
      <path d="M18 6L6 11.5v9.5C6 27.5 11.2 34 18 37c6.8-3 12-9.5 12-16v-9.5L18 6z" fill="var(--ts-blue-600)" fillOpacity="0.1" />
      <path d="M12 21l4 4 8-9" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MarketingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        height: 68,
        padding: scrolled ? '0' : '8px 0',
        background: scrolled ? 'oklch(1 0 0 / 0.85)' : 'transparent',
        borderBottom: `1px solid ${scrolled ? 'var(--ts-border)' : 'transparent'}`,
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
      }}
      onMouseLeave={() => setActiveMenu(null)}
    >
      <div
        className="flex items-center justify-between h-full"
        style={{ maxWidth: 1160, margin: '0 auto', padding: '0 32px' }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
          <TaxSentryLogo size={28} />
          <div>
            <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--ts-fg-primary)', letterSpacing: '-0.02em', lineHeight: 1, margin: 0 }}>
              Tax<span style={{ color: 'var(--ts-blue-600)' }}>Sentry</span>
            </p>
            <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ts-fg-muted)', lineHeight: 1, marginTop: 2 }}>
              UAE QFZP Monitor
            </p>
          </div>
        </Link>

        {/* Nav links */}
        <ul className="hidden md:flex items-center list-none" style={{ gap: 32 }}>
          <li className="relative h-full flex items-center" onMouseEnter={() => setActiveMenu('product')}>
            <button
              className="flex items-center gap-1 transition-colors hover:text-black"
              style={{ fontSize: 14, fontWeight: 600, color: activeMenu === 'product' ? 'var(--ts-blue-600)' : 'var(--ts-fg-secondary)', background: 'none', border: 'none', cursor: 'pointer', height: 68 }}
            >
              Product <ChevronDown size={14} className={`transition-transform duration-200 ${activeMenu === 'product' ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {activeMenu === 'product' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[480px] rounded-2xl overflow-hidden"
                  style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}
                >
                  <div className="grid grid-cols-2 p-3">
                    {[
                      { icon: BarChart3, title: 'Core Dashboard', desc: 'Real-time QFZP risk monitoring' },
                      { icon: Zap, title: 'ERP Integrations', desc: 'Sync with Xero & QuickBooks' },
                      { icon: FileCheck, title: 'Auditor Export', desc: 'Generate FTA-ready packs' },
                      { icon: Lock, title: 'Security', desc: 'Enterprise-grade encryption' },
                    ].map((item, i) => (
                      <Link
                        key={i} href="#features"
                        className="group flex gap-3 p-3 rounded-xl transition-colors hover:bg-slate-50"
                        style={{ textDecoration: 'none' }}
                        onClick={() => setActiveMenu(null)}
                      >
                        <div className="flex items-center justify-center rounded-lg mt-0.5" style={{ width: 36, height: 36, background: 'var(--ts-bg-muted)', color: 'var(--ts-blue-600)', flexShrink: 0 }}>
                          <item.icon size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ts-fg-primary)', marginBottom: 2 }}>{item.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--ts-fg-muted)', lineHeight: 1.4 }}>{item.desc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="p-4 flex justify-between items-center" style={{ background: 'var(--ts-bg-muted)', borderTop: '1px solid var(--ts-border)' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts-fg-secondary)' }}>Looking for API access?</span>
                    <Link href="#contact" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ts-blue-600)', textDecoration: 'none' }} onClick={() => setActiveMenu(null)}>View Documentation →</Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>

          {['Pricing', 'Security', 'Company'].map(label => (
            <li key={label} className="h-full flex items-center" onMouseEnter={() => setActiveMenu(null)}>
              <Link
                href={`#${label.toLowerCase()}`}
                className="relative group transition-colors hover:text-black"
                style={{ fontSize: 14, fontWeight: 600, color: 'var(--ts-fg-secondary)', textDecoration: 'none', height: 68, display: 'flex', alignItems: 'center' }}
              >
                {label}
                <span
                  className="absolute bottom-[20px] left-0 w-0 group-hover:w-full transition-all duration-250"
                  style={{ height: '1.5px', background: 'var(--ts-blue-600)', display: 'block' }}
                />
              </Link>
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors hover:text-black"
            style={{ color: 'var(--ts-fg-secondary)', textDecoration: 'none' }}
          >
            Sign In
          </Link>
          <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
            <Link
              href="/sign-up"
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold transition-shadow"
              style={{
                background: 'var(--ts-blue-600)',
                color: 'white',
                boxShadow: '0 4px 12px oklch(0 0 0 / 0.1)',
                border: '1px solid var(--ts-blue-600)',
                textDecoration: 'none',
              }}
            >
              Start Free Trial <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
}
