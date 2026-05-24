'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, BarChart3, Lock, FileCheck, Zap, Menu, X } from 'lucide-react';
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

const NAV_LINKS = [
  { label: 'Platform', href: '#features' },
  { label: 'Solutions', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Security', href: '#security' },
  { label: 'About', href: '/about' },
];

const PRODUCT_ITEMS = [
  { icon: BarChart3, title: 'Core Dashboard', desc: 'Real-time QFZP risk monitoring', href: '/demo' },
  { icon: Zap, title: 'ERP Integrations', desc: 'Sync with Xero & QuickBooks', href: '/integrations' },
  { icon: FileCheck, title: 'Auditor Export', desc: 'Generate FTA-ready packs', href: '/platform/audit' },
  { icon: Lock, title: 'Security', desc: 'Enterprise-grade encryption', href: '/security' },
];

export function MarketingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 40);
  });

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          height: 68,
          background: scrolled || mobileOpen ? 'var(--ts-bg-base)' : 'transparent',
          borderBottom: `1px solid ${scrolled || mobileOpen ? 'var(--ts-border)' : 'transparent'}`,
          backdropFilter: scrolled && !mobileOpen ? 'blur(16px)' : 'none',
        }}
        onMouseLeave={() => setActiveMenu(null)}
      >
        <div
          className="flex items-center justify-between h-full"
          style={{ maxWidth: 1160, margin: '0 auto', padding: '0 20px' }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>
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

          {/* Desktop Nav links */}
          <ul className="hidden lg:flex items-center list-none" style={{ gap: 28 }}>
            <li className="relative h-full flex items-center" onMouseEnter={() => setActiveMenu('product')}>
              <button
                className="flex items-center gap-1"
                style={{ fontSize: 14, fontWeight: 600, color: activeMenu === 'product' ? 'var(--ts-blue-600)' : 'var(--ts-fg-secondary)', background: 'none', border: 'none', cursor: 'pointer', height: 68, transition: 'color 0.15s' }}
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
                      {PRODUCT_ITEMS.map((item, i) => (
                        <Link
                          key={i} href={item.href}
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
                      <Link href="/api-docs" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ts-blue-600)', textDecoration: 'none' }} onClick={() => setActiveMenu(null)}>View Documentation →</Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>

            {NAV_LINKS.slice(1).map(({ label, href }) => (
              <li key={label} className="h-full flex items-center" onMouseEnter={() => setActiveMenu(null)}>
                <Link
                  href={href}
                  className="relative group"
                  style={{ fontSize: 14, fontWeight: 600, color: 'var(--ts-fg-secondary)', textDecoration: 'none', height: 68, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-primary)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-secondary)'; }}
                >
                  {label}
                  <span className="absolute bottom-[20px] left-0 w-0 group-hover:w-full transition-all duration-200" style={{ height: '1.5px', background: 'var(--ts-blue-600)', display: 'block' }} />
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/sign-in"
              className="rounded-lg px-4 py-2 text-[13px] font-semibold"
              style={{ color: 'var(--ts-fg-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-secondary)'; }}
            >
              Sign In
            </Link>
            <Link
              href="/request-demo"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold"
              style={{ background: 'transparent', color: 'var(--ts-fg-secondary)', border: '1px solid oklch(0.40 0.025 255)', textDecoration: 'none', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--ts-blue-400)'; (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.40 0.025 255)'; (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-secondary)'; }}
            >
              Request Demo
            </Link>
            <motion.div whileHover={{ y: -1 }} whileTap={{ y: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
              <Link
                href="/sign-in"
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold"
                style={{ background: 'var(--ts-blue-600)', color: 'white', boxShadow: '0 4px 12px oklch(0 0 0 / 0.1)', textDecoration: 'none' }}
              >
                Start Free Trial <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>

          {/* Mobile: hamburger button */}
          <button
            className="lg:hidden flex items-center justify-center rounded-xl"
            style={{ width: 42, height: 42, background: 'var(--ts-bg-muted)', border: '1px solid var(--ts-border)', cursor: 'pointer' }}
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle navigation menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen
                ? <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X size={18} color="var(--ts-fg-primary)" /></motion.span>
                : <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu size={18} color="var(--ts-fg-primary)" /></motion.span>
              }
            </AnimatePresence>
          </button>
        </div>
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ top: 68, background: 'var(--ts-bg-base)', overflowY: 'auto', borderTop: '1px solid var(--ts-border)' }}
          >
            <div style={{ padding: '24px 20px 40px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Product section */}
              <div style={{ padding: '4px 0', borderBottom: '1px solid var(--ts-border-subtle)', marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ts-fg-muted)', padding: '8px 12px 12px' }}>Product</div>
                {PRODUCT_ITEMS.map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl"
                    style={{ padding: '12px', textDecoration: 'none', transition: 'background 0.15s' }}
                    onClick={() => setMobileOpen(false)}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--ts-bg-muted)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--ts-bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <item.icon size={16} color="var(--ts-blue-600)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ts-fg-primary)' }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--ts-fg-muted)' }}>{item.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Navigation links */}
              {NAV_LINKS.slice(1).map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center rounded-xl"
                  style={{ padding: '14px 12px', fontSize: 16, fontWeight: 600, color: 'var(--ts-fg-secondary)', textDecoration: 'none', transition: 'all 0.15s' }}
                  onClick={() => setMobileOpen(false)}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--ts-bg-muted)'; el.style.color = 'var(--ts-fg-primary)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--ts-fg-secondary)'; }}
                >
                  {label}
                </Link>
              ))}

              {/* Mobile CTAs */}
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Link
                  href="/request-demo"
                  className="flex items-center justify-center gap-2 rounded-xl font-bold"
                  style={{ padding: '15px 24px', fontSize: 15, border: '1px solid oklch(0.40 0.025 255)', color: 'var(--ts-fg-secondary)', textDecoration: 'none', textAlign: 'center' }}
                  onClick={() => setMobileOpen(false)}
                >
                  Request a Demo
                </Link>
                <Link
                  href="/sign-in"
                  className="flex items-center justify-center gap-2 rounded-xl font-bold"
                  style={{ padding: '15px 24px', fontSize: 15, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', boxShadow: '0 4px 20px rgba(37,99,235,0.35)', textDecoration: 'none', textAlign: 'center' }}
                  onClick={() => setMobileOpen(false)}
                >
                  Start Free Trial <ArrowRight size={16} />
                </Link>
                <Link
                  href="/sign-in"
                  style={{ fontSize: 14, color: 'var(--ts-fg-muted)', textDecoration: 'none', textAlign: 'center', padding: '8px' }}
                  onClick={() => setMobileOpen(false)}
                >
                  Already have an account? Sign in →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
