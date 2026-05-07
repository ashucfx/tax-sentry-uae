'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Lock,
  Zap,
  FileCheck,
  CheckCircle2,
  Building2,
  Clock,
  Upload,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Bell,
  Globe,
  Users,
} from 'lucide-react';
import { MarketingNav, TaxSentryLogo } from '@/components/marketing/MarketingNav';

/* ─── Divider ───────────────────────────────────────── */
function Divider() {
  return (
    <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, transparent, oklch(0.55 0.22 260 / 0.15), transparent)' }} />
  );
}

export function LandingPage() {
  return (
    <div
      className="min-h-screen selection:bg-blue-500/30"
      style={{ background: 'var(--ts-bg-base)', color: 'var(--ts-fg-primary)', fontFamily: 'var(--font-sans)' }}
    >
      <MarketingNav />

      {/* ── Hero ─────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '140px 0 80px' }}
      >
        {/* Grid bg */}
        <div className="pointer-events-none absolute inset-0 grid-pattern" style={{ opacity: 0.5 }} />
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute"
          style={{ inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% -5%, oklch(0.55 0.22 260 / 0.13) 0%, transparent 65%)', zIndex: 0 }}
        />
        {/* Orbs */}
        <div className="pointer-events-none absolute" style={{ width: 500, height: 500, top: '5%', left: '-8%', borderRadius: '50%', background: 'oklch(0.55 0.22 260 / 0.07)', filter: 'blur(100px)', zIndex: 0 }} />
        <div className="pointer-events-none absolute" style={{ width: 400, height: 400, bottom: 0, right: '-6%', borderRadius: '50%', background: 'oklch(0.70 0.20 155 / 0.05)', filter: 'blur(100px)', zIndex: 0 }} />

        <div className="relative z-10 w-full" style={{ maxWidth: 1160, margin: '0 auto', padding: '0 32px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            {/* Left: Content */}
            <div>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 mb-6" style={{ padding: '6px 16px', borderRadius: 9999, background: 'oklch(0.55 0.22 260 / 0.10)', border: '1px solid oklch(0.55 0.22 260 / 0.28)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#93c5fd' }}>
                <ShieldCheck size={12} />
                Real-Time QFZP Protection Platform
              </div>

              <h1
                className="fade-in-up"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', fontWeight: 900, lineHeight: 1.06, letterSpacing: '-0.04em', marginBottom: 24, color: 'var(--ts-fg-primary)' }}
              >
                Your 0% Tax Rate<br />
                Has a{' '}
                <span
                  style={{
                    background: 'linear-gradient(125deg, #60a5fa 0%, #34d399 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Kill Switch.
                </span>
                <br />
                We Monitor It.
              </h1>

              <p
                className="fade-in-up stagger-1"
                style={{ fontSize: 17, color: 'var(--ts-fg-muted)', lineHeight: 1.75, marginBottom: 40, maxWidth: 480 }}
              >
                UAE Free Zone companies can lose their 0% corporate tax status overnight. TaxSentry watches every revenue stream, document, and threshold — continuously — so your CFO never gets a surprise from the FTA.
              </p>

              <div className="fade-in-up stagger-2 flex flex-wrap gap-3 mb-12">
                <Link
                  href="/sign-up"
                  className="flex items-center gap-2 rounded-xl font-bold transition-all hover:-translate-y-px"
                  style={{ fontSize: 16, padding: '15px 30px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', boxShadow: '0 4px 20px rgba(37,99,235,0.4)', textDecoration: 'none' }}
                >
                  Get Protected Today <ArrowRight size={16} />
                </Link>
                <Link
                  href="#how"
                  className="flex items-center gap-2 rounded-xl font-bold transition-all"
                  style={{ fontSize: 16, padding: '15px 30px', background: 'transparent', color: 'var(--ts-fg-secondary)', border: '1px solid oklch(0.40 0.025 255)', textDecoration: 'none' }}
                >
                  See How It Works
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4">
                <div className="flex">
                  {[
                    { initials: 'CF', bg: '#1d4ed8' },
                    { initials: 'AM', bg: '#059669' },
                    { initials: 'RK', bg: '#7c3aed' },
                    { initials: 'SJ', bg: '#b45309' },
                  ].map(({ initials, bg }, i) => (
                    <div
                      key={initials}
                      className="flex items-center justify-center rounded-full text-white"
                      style={{ width: 30, height: 30, border: '2px solid var(--ts-bg-base)', background: bg, fontSize: 10, fontWeight: 700, marginLeft: i === 0 ? 0 : -8, zIndex: 4 - i, position: 'relative' }}
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>
                  <strong style={{ color: 'var(--ts-fg-secondary)' }}>50+ CFOs and finance teams</strong> trust TaxSentry across DMCC, DIFC, and JAFZA
                </p>
              </div>
            </div>

            {/* Right: Dashboard mockup */}
            <div className="hidden lg:block">
              <div
                className="relative overflow-hidden rounded-2xl"
                style={{ background: '#0c1a30', border: '1px solid oklch(0.55 0.22 260 / 0.18)', boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px oklch(0.55 0.22 260 / 0.08)' }}
              >
                <div className="absolute top-0 left-0 right-0" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.5), rgba(52,211,153,0.3), transparent)' }} />
                {/* Browser bar */}
                <div className="flex items-center gap-2" style={{ background: '#060e1c', padding: '10px 16px', borderBottom: '1px solid rgba(37,99,235,0.1)' }}>
                  {[['#ff5f57', '#febc2e', '#28c840']].map(colors => colors.map((c, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                  )))}
                  <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#2a3d58', marginRight: 28 }}>TaxSentry — QFZP Dashboard</div>
                </div>
                {/* Content */}
                <div style={{ padding: 20 }}>
                  {/* Status row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 rounded-full" style={{ padding: '5px 13px', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', fontSize: 11, fontWeight: 700, color: '#34d399', letterSpacing: '0.06em' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                      QFZP PROTECTED
                    </div>
                    <span style={{ fontSize: 11, color: '#2a3d58', fontFamily: 'JetBrains Mono, monospace' }}>147 days remaining</span>
                  </div>
                  {/* KPI row */}
                  <div className="grid grid-cols-3 gap-2.5 mb-3">
                    {[
                      { label: 'Total Revenue', value: 'AED 5.04M', color: '#eaf0ff', border: 'rgba(37,99,235,0.12)', bg: '#0f1f3d' },
                      { label: 'Qualifying', value: 'AED 4.83M', color: '#34d399', border: 'rgba(52,211,153,0.2)', bg: 'rgba(52,211,153,0.04)' },
                      { label: 'Non-Qualifying', value: 'AED 214K', color: '#fbbf24', border: 'rgba(245,158,11,0.2)', bg: 'rgba(245,158,11,0.04)' },
                    ].map(c => (
                      <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontSize: 9, color: '#3a5580', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{c.label}</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: c.color, fontFamily: 'JetBrains Mono, monospace' }}>{c.value}</div>
                      </div>
                    ))}
                  </div>
                  {/* Chart row */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div style={{ background: '#0f1f3d', border: '1px solid rgba(37,99,235,0.1)', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 10, color: '#4a6080', fontWeight: 600, marginBottom: 10 }}>De-Minimis Tracker</div>
                      <svg viewBox="0 0 100 56" style={{ width: '100%', overflow: 'visible' }}>
                        <circle cx="50" cy="52" r="36" fill="none" stroke="rgba(37,99,235,0.12)" strokeWidth="7" strokeDasharray="113 113" strokeDashoffset="-56.5" />
                        <circle cx="50" cy="52" r="36" fill="none" stroke="#10b981" strokeWidth="7" strokeLinecap="round" strokeDasharray="43 170" strokeDashoffset="-56.5" style={{ filter: 'drop-shadow(0 0 4px #10b981)' }} />
                        <text x="50" y="46" textAnchor="middle" fill="#34d399" fontSize="13" fontWeight="700" fontFamily="JetBrains Mono,monospace">3.8%</text>
                        <text x="50" y="55" textAnchor="middle" fill="#2a3d58" fontSize="7" fontFamily="Inter,sans-serif">of 5% limit</text>
                      </svg>
                    </div>
                    <div style={{ background: '#0f1f3d', border: '1px solid rgba(37,99,235,0.1)', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 10, color: '#4a6080', fontWeight: 600, marginBottom: 8 }}>Risk Score</div>
                      <div className="flex items-end gap-1" style={{ height: 44, marginBottom: 6 }}>
                        {[60, 75, 55, 80, 65, 72].map((h, i) => (
                          <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '2px 2px 0 0', background: i === 5 ? '#f59e0b' : '#1a3a6e', boxShadow: i === 5 ? '0 0 6px rgba(245,158,11,0.4)' : 'none' }} />
                        ))}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: 22, fontWeight: 700, color: '#fbbf24', fontFamily: 'JetBrains Mono,monospace' }}>72</span>
                        <span style={{ fontSize: 10, color: '#2a3d58' }}> / 100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────── */}
      <Divider />
      <div style={{ padding: '28px 32px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'oklch(0.58 0 0)' }}>Trusted by companies in</div>
          <div className="flex flex-wrap gap-7 items-center">
            {['DMCC', 'DIFC', 'JAFZA', 'ADGM', 'RAKEZ', 'DIC'].map(fz => (
              <span key={fz} style={{ fontSize: 13, fontWeight: 700, color: 'oklch(0.75 0 0)' }}>{fz}</span>
            ))}
          </div>
        </div>
      </div>
      <Divider />

      {/* ── Problem ──────────────────────────────────── */}
      <section style={{ padding: '100px 32px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 80, alignItems: 'center' }}>
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 mb-6" style={{ padding: '5px 14px', borderRadius: 9999, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ts-red-400)' }}>
              The Risk Is Real
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20, color: 'var(--ts-fg-primary)' }}>
              Most Free Zone<br />companies don't<br />know they're at risk<br />until the{' '}
              <span style={{ background: 'linear-gradient(125deg, #ef4444, #f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>FTA does.</span>
            </h2>
            <p style={{ fontSize: 16, color: 'var(--ts-fg-muted)', lineHeight: 1.75, marginBottom: 32 }}>
              The 9% corporate tax trap isn't complex — it's invisible. A few misclassified invoices, a single mainland contract, or one expired document can silently revoke your QFZP status. By then, the damage is done.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-xl font-bold transition-all hover:opacity-90"
              style={{ fontSize: 14, padding: '11px 22px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', boxShadow: '0 4px 16px rgba(37,99,235,0.3)', textDecoration: 'none' }}
            >
              See How TaxSentry Fixes This <ArrowRight size={14} />
            </Link>
          </div>
          {/* Right: stat cards */}
          <div className="flex flex-col gap-7">
            {[
              { stat: '9%', label: 'Corporate Tax on Loss', desc: 'Corporate tax triggered the moment your NQI exceeds 5% of total revenue — with no grace period.', borderColor: '#ef4444', bg: 'rgba(239,68,68,0.04)', statColor: '#f87171' },
              { stat: 'AED 5M', label: 'Absolute NQI Threshold', desc: 'Even if your percentage is fine, exceeding AED 5M in Non-Qualifying Income costs your QFZP status.', borderColor: '#f59e0b', bg: 'rgba(245,158,11,0.04)', statColor: '#fbbf24' },
              { stat: '2 tests', label: 'To Fail Simultaneously', desc: 'You must pass both the percentage test and the absolute test simultaneously. Failing either disqualifies you.', borderColor: '#3b82f6', bg: 'rgba(59,130,246,0.04)', statColor: '#60a5fa' },
            ].map(({ stat, label, desc, borderColor, bg, statColor }) => (
              <div key={stat} style={{ borderLeft: `3px solid ${borderColor}`, padding: '20px 24px', borderRadius: '0 12px 12px 0', background: bg }}>
                <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', fontFamily: 'JetBrains Mono, monospace', color: statColor, marginBottom: 4 }}>{stat}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ts-fg-secondary)', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 14, color: 'var(--ts-fg-muted)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── How It Works ─────────────────────────────── */}
      <section id="how" style={{ padding: '100px 32px', background: 'var(--ts-bg-deepest)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div className="text-center" style={{ marginBottom: 60 }}>
            <div className="inline-flex items-center gap-2 mb-5" style={{ padding: '5px 14px', borderRadius: 9999, background: 'oklch(0.55 0.22 260 / 0.10)', border: '1px solid oklch(0.55 0.22 260 / 0.25)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ts-blue-400)' }}>
              How It Works
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--ts-fg-primary)', marginBottom: 16 }}>
              From data to protection<br />in three steps
            </h2>
            <p style={{ maxWidth: 500, margin: '0 auto', fontSize: 15, color: 'var(--ts-fg-muted)', lineHeight: 1.65 }}>
              Connects to your accounting system, classifies every transaction, and gives your finance team a live compliance signal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 2 }}>
            {[
              {
                step: 'Step 01', icon: Upload, title: 'Connect Your Data',
                body: 'Sync Zoho Books, QuickBooks, or Xero — or import a CSV. TaxSentry ingests your full transaction history in minutes.',
                showArrow: true,
              },
              {
                step: 'Step 02', icon: Zap, title: 'Classify Every Transaction',
                body: 'Each revenue line is categorised as QI, NQI, or Excluded. Related party transactions are flagged automatically.',
                showArrow: true,
              },
              {
                step: 'Step 03', icon: ShieldCheck, title: 'Stay Protected',
                body: 'Your QFZP status is monitored live. Receive threshold alerts before you breach, and generate FTA-ready audit packs on demand.',
                showArrow: false,
              },
            ].map(({ step, icon: Icon, title, body, showArrow }, i) => (
              <div
                key={step}
                className="relative"
                style={{
                  padding: '40px 36px',
                  background: 'rgba(255,255,255,0.015)',
                  border: '1px solid oklch(0.55 0.22 260 / 0.10)',
                  borderRadius: i === 0 ? '16px 0 0 16px' : i === 2 ? '0 16px 16px 0' : 0,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'oklch(0.58 0.12 260)', marginBottom: 20 }}>{step}</div>
                <div className="flex items-center justify-center rounded-[13px] mb-5" style={{ width: 48, height: 48, background: 'oklch(0.55 0.22 260 / 0.12)' }}>
                  <Icon size={22} color="#3b82f6" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ts-fg-primary)', marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 14, color: 'var(--ts-fg-muted)', lineHeight: 1.65, margin: 0 }}>{body}</p>
                {showArrow && (
                  <div
                    className="hidden md:flex absolute items-center justify-center"
                    style={{ right: -14, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 28, height: 28, background: 'var(--ts-bg-deepest)', border: '1px solid oklch(0.55 0.22 260 / 0.20)', borderRadius: '50%' }}
                  >
                    <ArrowRight size={12} color="oklch(0.55 0.22 260)" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Features ─────────────────────────────────── */}
      <section id="features" style={{ padding: '100px 32px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div className="text-center" style={{ marginBottom: 60 }}>
            <div className="inline-flex items-center gap-2 mb-5" style={{ padding: '5px 14px', borderRadius: 9999, background: 'oklch(0.55 0.22 260 / 0.10)', border: '1px solid oklch(0.55 0.22 260 / 0.25)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ts-blue-400)' }}>
              Platform Features
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--ts-fg-primary)', marginBottom: 16 }}>
              Built for the UAE.<br />Designed for{' '}
              <span style={{ background: 'linear-gradient(125deg, #60a5fa 0%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>your CFO.</span>
            </h2>
            <p style={{ maxWidth: 500, margin: '0 auto', fontSize: 15, color: 'var(--ts-fg-muted)', lineHeight: 1.65 }}>
              Every feature maps directly to an FTA requirement or a common compliance failure point.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { badge: 'Most Critical', badgeGreen: true, icon: Clock, iconColor: '#34d399', iconBg: 'rgba(52,211,153,0.12)', greenBorder: true, title: 'Dual De-Minimis Tracker', body: 'Simultaneous tracking of both the 5% percentage test and the AED 5M absolute threshold. Live gauges update with every transaction. Alerts at 80% and 95%.' },
              { icon: TrendingUp, iconColor: '#3b82f6', iconBg: 'oklch(0.55 0.22 260 / 0.12)', title: 'Revenue Classification Engine', body: 'QI, NQI, and Excluded categorisation with full audit trail. Related party detection. One-click reclassification with documented rationale.' },
              { icon: FileCheck, iconColor: '#3b82f6', iconBg: 'oklch(0.55 0.22 260 / 0.12)', title: 'Substance Document Vault', body: 'Centralised repository for trade licenses, leases, payroll records, and board resolutions. Expiry tracking with automated renewal reminders.' },
              { icon: ShieldCheck, iconColor: '#3b82f6', iconBg: 'oklch(0.55 0.22 260 / 0.12)', title: 'Composite Risk Score', body: 'A single 0–100 QFZP health score across five dimensions: de-minimis headroom, substance completeness, audit readiness, related party exposure, and classification confidence.' },
              { icon: BarChart3, iconColor: '#3b82f6', iconBg: 'oklch(0.55 0.22 260 / 0.12)', title: 'FTA Audit Pack Generation', body: 'Generate a complete, FTA-formatted compliance pack in seconds. De-minimis workings, substance evidence, and revenue breakdown — ready for submission.' },
              { badge: 'Coming Soon', badgeSoon: true, icon: Building2, iconColor: '#3b82f6', iconBg: 'oklch(0.55 0.22 260 / 0.12)', title: 'Accounting Sync', body: 'Direct integration with Zoho Books, QuickBooks, and Xero. Transactions pull automatically every 24 hours. No manual CSV uploads.' },
            ].map(({ badge, badgeGreen, badgeSoon, greenBorder, icon: Icon, iconColor, iconBg, title, body }) => (
              <div
                key={title}
                className="relative overflow-hidden transition-all"
                style={{
                  padding: '32px 28px',
                  borderRadius: 16,
                  border: `1px solid ${greenBorder ? 'rgba(52,211,153,0.2)' : 'oklch(0.55 0.22 260 / 0.10)'}`,
                  background: 'linear-gradient(145deg, oklch(0.18 0.035 255 / 0.8), oklch(0.14 0.03 255 / 0.9))',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.55 0.22 260 / 0.28)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px rgba(0,0,0,0.4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = greenBorder ? 'rgba(52,211,153,0.2)' : 'oklch(0.55 0.22 260 / 0.10)'; (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
              >
                <div className="absolute top-0 left-0 right-0" style={{ height: 1, background: greenBorder ? 'linear-gradient(90deg, transparent, rgba(52,211,153,0.4), transparent)' : 'linear-gradient(90deg, transparent, rgba(37,99,235,0.3), transparent)' }} />
                {badge && (
                  <span
                    className="inline-block mb-4"
                    style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 9999, background: badgeGreen ? 'rgba(52,211,153,0.12)' : 'oklch(0.55 0.22 260 / 0.12)', color: badgeGreen ? '#34d399' : 'var(--ts-blue-400)', border: `1px solid ${badgeGreen ? 'rgba(52,211,153,0.25)' : 'oklch(0.55 0.22 260 / 0.25)'}` }}
                  >
                    {badge}
                  </span>
                )}
                <div className="flex items-center justify-center rounded-[13px] mb-5" style={{ width: 46, height: 46, background: iconBg }}>
                  <Icon size={22} color={iconColor} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#dce8ff', marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)', lineHeight: 1.65, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Security ─────────────────────────────────── */}
      <section id="security" style={{ padding: '100px 32px', background: 'var(--ts-bg-deepest)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{ padding: '52px 56px', background: 'linear-gradient(135deg, #0c1a30 0%, #091222 100%)', border: '1px solid oklch(0.55 0.22 260 / 0.18)' }}
          >
            <div className="absolute top-0 left-0 right-0" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.5), transparent)' }} />
            <div className="absolute" style={{ top: -40, right: -40, width: 200, height: 200, background: 'rgba(37,99,235,0.08)', borderRadius: '50%', filter: 'blur(60px)' }} />

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 items-center relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 mb-6" style={{ padding: '5px 14px', borderRadius: 9999, background: 'oklch(0.55 0.22 260 / 0.10)', border: '1px solid oklch(0.55 0.22 260 / 0.25)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ts-blue-400)' }}>
                  Enterprise Security
                </div>
                <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--ts-fg-primary)', marginBottom: 16 }}>
                  Your financial data<br />never leaves the UAE.
                </h2>
                <p style={{ fontSize: 15, color: 'var(--ts-fg-muted)', lineHeight: 1.75, marginBottom: 4 }}>
                  TaxSentry is hosted entirely within UAE infrastructure (Google Cloud me-central1). Every data point is encrypted in transit and at rest. Role-based access controls ensure your CFO, auditor, and board see exactly what they need — nothing more.
                </p>
                <div className="grid grid-cols-2 gap-3" style={{ marginTop: 28 }}>
                  {[
                    { icon: Lock, label: 'AES-256 Encryption' },
                    { icon: Globe, label: 'UAE-Only Hosting' },
                    { icon: Users, label: 'Role-Based Access' },
                    { icon: CheckCircle2, label: 'FTA-Aligned Methodology' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-3" style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid oklch(0.55 0.22 260 / 0.12)' }}>
                      <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 32, height: 32, background: 'oklch(0.55 0.22 260 / 0.12)' }}>
                        <Icon size={15} color="#3b82f6" />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ts-fg-secondary)' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden lg:block text-center">
                <div
                  style={{ fontSize: 52, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.03em', background: 'linear-gradient(125deg, #60a5fa 0%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                >
                  256
                </div>
                <div style={{ fontSize: 13, color: 'oklch(0.62 0 0)', marginTop: 4 }}>bit encryption</div>
                <div style={{ marginTop: 32, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'oklch(0.78 0 0)' }}>Hosted in</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--ts-fg-primary)', marginTop: 6, fontFamily: 'JetBrains Mono, monospace' }}>🇦🇪 UAE</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Testimonials ─────────────────────────────── */}
      <section style={{ padding: '100px 32px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div className="text-center" style={{ marginBottom: 52 }}>
            <div className="inline-flex items-center gap-2 mb-5" style={{ padding: '5px 14px', borderRadius: 9999, background: 'oklch(0.55 0.22 260 / 0.10)', border: '1px solid oklch(0.55 0.22 260 / 0.25)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ts-blue-400)' }}>
              What CFOs Say
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--ts-fg-primary)' }}>
              Built for the people<br />who sign the tax returns.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { quote: '"We had no idea three of our contracts were borderline NQI. TaxSentry flagged them within the first week. At our revenue level, that\'s a multi-million dirham exposure we caught in time."', name: 'CFO, DMCC Trading Co.', role: 'Technology Distributor · DMCC', avatar: 'CF', bg: '#1d4ed8' },
              { quote: '"Our auditor asked for a full de-minimis workings pack during the FTA review. I generated it in 90 seconds. The auditor said it was the most prepared file they\'d seen from a Free Zone company."', name: 'Finance Director, Gulf Logistics FZE', role: 'Logistics & Freight · JAFZA', avatar: 'AM', bg: '#059669' },
              { quote: '"The risk score alone is worth the subscription. Our board now reviews it monthly. It\'s become the single metric everyone watches to make sure we stay at 0%."', name: 'Group CFO, MENA Holdings', role: 'Multi-entity · DIFC', avatar: 'RK', bg: '#7c3aed' },
            ].map(({ quote, name, role, avatar, bg }) => (
              <div key={name} style={{ padding: 32, borderRadius: 16, background: 'oklch(0.18 0.035 255 / 0.6)', border: '1px solid oklch(0.55 0.22 260 / 0.10)' }}>
                <div className="flex gap-1 mb-5">
                  {'★★★★★'.split('').map((s, i) => <span key={i} style={{ color: '#f59e0b', fontSize: 14 }}>{s}</span>)}
                </div>
                <p style={{ fontSize: 15, color: 'var(--ts-fg-muted)', lineHeight: 1.7, marginBottom: 24, fontStyle: 'italic' }}>{quote}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-full text-white flex-shrink-0" style={{ width: 38, height: 38, background: bg, fontSize: 13, fontWeight: 700 }}>{avatar}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#c8d8f0' }}>{name}</div>
                    <div style={{ fontSize: 11, color: 'oklch(0.60 0 0)', marginTop: 1 }}>{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Pricing ──────────────────────────────────── */}
      <section id="pricing" style={{ padding: '100px 32px', background: 'var(--ts-bg-deepest)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div className="text-center" style={{ marginBottom: 56 }}>
            <div className="inline-flex items-center gap-2 mb-5" style={{ padding: '5px 14px', borderRadius: 9999, background: 'oklch(0.55 0.22 260 / 0.10)', border: '1px solid oklch(0.55 0.22 260 / 0.25)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ts-blue-400)' }}>
              Pricing
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--ts-fg-primary)', marginBottom: 16 }}>
              One breach costs more<br />than years of{' '}
              <span style={{ background: 'linear-gradient(125deg, #60a5fa 0%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>TaxSentry.</span>
            </h2>
            <p style={{ maxWidth: 460, margin: '0 auto', fontSize: 15, color: 'var(--ts-fg-muted)', lineHeight: 1.65 }}>
              The 9% tax on a single year of AED 10M revenue is AED 900,000. TaxSentry Starter is AED 11,880/year.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5" style={{ maxWidth: 1000, margin: '0 auto' }}>
            {[
              {
                name: 'Starter', price: 'AED 990', period: '/month',
                desc: 'Single-entity Free Zone company with straightforward revenue',
                icon: FileCheck, iconBg: 'oklch(0.55 0.22 260 / 0.10)',
                features: ['Single entity monitoring', 'Dual de-minimis tracking', 'Substance document vault', 'Threshold alerts at 80% & 95%', 'Monthly compliance report'],
                featColor: 'var(--ts-green-500)',
                cta: 'Start Free Trial', ctaStyle: 'outline', featured: false,
              },
              {
                name: 'Professional', price: 'AED 2,490', period: '/month',
                desc: 'Growing businesses with multiple entities or complex revenue structures',
                icon: ShieldCheck, iconBg: 'var(--ts-blue-500)',
                features: ['Everything in Starter, plus:', 'Up to 5 entities', 'Accounting software sync', 'Related party transaction tracking', 'FTA audit pack generation', 'Priority support'],
                featColor: 'var(--ts-blue-400)',
                cta: 'Start Free Trial', ctaStyle: 'primary', featured: true,
              },
              {
                name: 'Enterprise', price: 'Custom', period: '',
                desc: 'Groups, holding structures, and companies requiring custom integrations',
                icon: Building2, iconBg: 'oklch(0.55 0.22 260 / 0.10)',
                features: ['Everything in Professional, plus:', 'Unlimited entities', 'Group consolidation view', 'ERP & custom API integrations', 'Dedicated account manager', 'SLA guarantee'],
                featColor: 'var(--ts-green-500)',
                cta: 'Contact Sales', ctaStyle: 'outline', featured: false,
              },
            ].map(({ name, price, period, desc, icon: Icon, iconBg, features, featColor, cta, ctaStyle, featured }) => (
              <div
                key={name}
                className="relative"
                style={{
                  borderRadius: 20,
                  padding: '36px 32px',
                  background: 'linear-gradient(145deg, #0c1a30, #091222)',
                  border: `1px solid ${featured ? 'oklch(0.55 0.22 260 / 0.40)' : 'oklch(0.55 0.22 260 / 0.14)'}`,
                  boxShadow: featured ? '0 0 60px oklch(0.55 0.22 260 / 0.12)' : 'none',
                  transform: featured ? 'scale(1.04)' : 'none',
                  transition: 'transform 0.2s',
                }}
              >
                <div className="absolute top-0 left-0 right-0" style={{ height: 1, background: featured ? 'linear-gradient(90deg, transparent, rgba(37,99,235,0.7), transparent)' : 'linear-gradient(90deg, transparent, rgba(37,99,235,0.35), transparent)', borderRadius: '20px 20px 0 0' }} />
                {featured && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[10px] font-bold whitespace-nowrap"
                    style={{ background: '#2563eb', color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                  >
                    Most Popular
                  </div>
                )}
                <div className="flex items-center justify-center rounded-xl mb-5" style={{ width: 44, height: 44, background: iconBg }}>
                  <Icon size={22} color={featured ? '#fff' : '#3b82f6'} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ts-fg-primary)', marginBottom: 6 }}>{name}</div>
                <div style={{ fontSize: 13, color: 'var(--ts-fg-muted)', marginBottom: 24, lineHeight: 1.5 }}>{desc}</div>
                <div style={{ marginBottom: 28 }}>
                  <span style={{ fontSize: 34, fontWeight: 900, color: 'var(--ts-fg-primary)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.02em' }}>{price}</span>
                  {period && <span style={{ fontSize: 14, color: 'oklch(0.62 0 0)', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>{period}</span>}
                </div>
                <div className="flex flex-col gap-2.5" style={{ marginBottom: 28 }}>
                  {features.map((f, i) => (
                    <div key={f} className="flex items-start gap-2.5" style={{ fontSize: 13, color: i === 0 && f.includes('Everything') ? '#c8d8f0' : 'var(--ts-fg-secondary)', fontWeight: i === 0 && f.includes('Everything') ? 500 : 400 }}>
                      {!(i === 0 && f.includes('Everything')) && (
                        <CheckCircle2 size={14} color={featColor} style={{ flexShrink: 0, marginTop: 1 }} />
                      )}
                      <span style={{ marginLeft: i === 0 && f.includes('Everything') ? 22 : 0 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  className="w-full rounded-xl font-bold transition-all"
                  style={{
                    display: 'block', width: '100%', padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 700, textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit',
                    background: ctaStyle === 'primary' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                    color: ctaStyle === 'primary' ? '#fff' : 'var(--ts-fg-secondary)',
                    boxShadow: ctaStyle === 'primary' ? '0 4px 16px rgba(37,99,235,0.35)' : 'none',
                    border: ctaStyle === 'outline' ? '1px solid oklch(0.40 0.025 255)' : 'none',
                  } as React.CSSProperties}
                  onClick={() => { window.location.href = name === 'Enterprise' ? '/contact' : '/sign-up'; }}
                >
                  {cta}
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 rounded-full" style={{ padding: '12px 24px', background: 'oklch(0.70 0.20 155 / 0.07)', border: '1px solid oklch(0.70 0.20 155 / 0.18)', fontSize: 13, fontWeight: 600, color: '#34d399' }}>
              <CheckCircle2 size={16} color="#34d399" />
              30-day money-back guarantee — no questions asked
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ padding: '100px 32px', textAlign: 'center' }}>
        <div className="pointer-events-none absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, oklch(0.55 0.22 260 / 0.12), transparent 70%)' }} />
        <div className="relative z-10" style={{ maxWidth: 1160, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 20, color: 'var(--ts-fg-primary)' }}>
            The FTA doesn't send warnings.{' '}
            <span style={{ background: 'linear-gradient(125deg, #60a5fa 0%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>We do.</span>
          </h2>
          <p style={{ fontSize: 17, color: 'var(--ts-fg-muted)', marginBottom: 40, maxWidth: 500, margin: '0 auto 40px', lineHeight: 1.65 }}>
            Start your 14-day free trial. Connect your accounting data. Know your QFZP status in under 10 minutes.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/sign-up"
              className="flex items-center gap-2 rounded-xl font-bold transition-all hover:-translate-y-px hover:opacity-95"
              style={{ fontSize: 16, padding: '15px 30px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', boxShadow: '0 4px 20px rgba(37,99,235,0.4)', textDecoration: 'none' }}
            >
              Get Protected Today <ArrowRight size={16} />
            </Link>
            <Link
              href="/demo"
              className="flex items-center gap-2 rounded-xl font-bold transition-all"
              style={{ fontSize: 16, padding: '15px 30px', background: 'transparent', color: 'var(--ts-fg-secondary)', border: '1px solid oklch(0.40 0.025 255)', textDecoration: 'none' }}
            >
              Request a Demo
            </Link>
          </div>
          <p style={{ fontSize: 12, color: 'oklch(0.58 0 0)', marginTop: 20 }}>
            No credit card required · 14-day free trial · Setup in under 10 minutes
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid oklch(0.55 0.22 260 / 0.18)', background: 'oklch(0.12 0.015 260)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 32px' }}>
          {/* 4-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-12" style={{ padding: '64px 0 48px', borderBottom: '1px solid oklch(0.55 0.22 260 / 0.08)' }}>
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <TaxSentryLogo size={30} gradId="ft-sg" filterId="ft-sf" />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ts-fg-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    Tax<span style={{ color: '#60a5fa' }}>Sentry</span>
                  </div>
                  <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'oklch(0.55 0.12 260)', marginTop: 2 }}>UAE QFZP Monitor</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'oklch(0.62 0 0)', lineHeight: 1.7, marginBottom: 16, maxWidth: 240 }}>
                Real-time QFZP status protection for UAE Free Zone companies navigating the 9% corporate tax regime.
              </p>
              <p style={{ fontSize: 11, color: 'oklch(0.50 0 0)', lineHeight: 1.5, marginBottom: 20, maxWidth: 240 }}>
                A product of{' '}
                <a href="https://www.theripplenexus.com" target="_blank" rel="noopener noreferrer" style={{ color: 'oklch(0.72 0.10 260)', fontWeight: 600, textDecoration: 'none' }}>Ripple Nexus</a>
              </p>
              {/* Social icons */}
              <div className="flex gap-2.5">
                {[
                  { label: 'LinkedIn', path: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z' },
                  { label: 'X/Twitter', path: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
                ].map(({ label, path }) => (
                  <div
                    key={label}
                    className="flex items-center justify-center rounded-lg cursor-pointer transition-all"
                    style={{ width: 32, height: 32, background: 'oklch(0.55 0.22 260 / 0.08)', border: '1px solid oklch(0.55 0.22 260 / 0.15)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.55 0.22 260 / 0.35)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.55 0.22 260 / 0.15)'; }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="oklch(0.65 0 0)" strokeWidth="1.8" strokeLinecap="round">
                      <path d={path} />
                      {label === 'LinkedIn' && <><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></>}
                    </svg>
                  </div>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'oklch(0.78 0 0)', marginBottom: 16 }}>Product</div>
              <div className="flex flex-col gap-2.5">
                {[['Features', '#features'], ['Pricing', '#pricing'], ['Security', '#security']].map(([label, href]) => (
                  <Link key={label} href={href} style={{ fontSize: 13, color: 'oklch(0.60 0 0)', textDecoration: 'none', transition: 'color 0.2s' }} className="hover:text-white">{label}</Link>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'oklch(0.78 0 0)', marginBottom: 16 }}>Company</div>
              <div className="flex flex-col gap-2.5">
                {[['About', '/about'], ['Blog', '/blog'], ['Contact', '/contact']].map(([label, href]) => (
                  <Link key={label} href={href} style={{ fontSize: 13, color: 'oklch(0.60 0 0)', textDecoration: 'none', transition: 'color 0.2s' }} className="hover:text-white">{label}</Link>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'oklch(0.78 0 0)', marginBottom: 16 }}>Legal</div>
              <div className="flex flex-col gap-2.5">
                {[['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Security', '/security']].map(([label, href]) => (
                  <Link key={label} href={href} style={{ fontSize: 13, color: 'oklch(0.60 0 0)', textDecoration: 'none', transition: 'color 0.2s' }} className="hover:text-white">{label}</Link>
                ))}
              </div>
              {/* Trust badges */}
              <div className="flex flex-col gap-2" style={{ marginTop: 24 }}>
                {[
                  { icon: Lock, label: 'AES-256 Encrypted' },
                  { icon: Globe, label: 'UAE-Hosted Data' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5" style={{ fontSize: 10, fontWeight: 600, color: 'oklch(0.60 0 0)' }}>
                    <Icon size={11} color="oklch(0.60 0 0)" />{label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-wrap items-center justify-between gap-3" style={{ padding: '24px 0' }}>
            <div style={{ fontSize: 12, color: 'oklch(0.48 0 0)' }}>
              TaxSentry is a product of{' '}
              <a href="https://www.theripplenexus.com" target="_blank" rel="noopener noreferrer" style={{ color: 'oklch(0.68 0.10 260)', fontWeight: 600, textDecoration: 'none' }}>Ripple Nexus</a>
              {' '}· © 2026 Ripple Nexus. All rights reserved.
            </div>
            <div className="flex items-center gap-2">
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'oklch(0.60 0 0)' }}>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
