'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  FileCheck2,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Zap,
  Bell,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { MarketingNav, TaxSentryLogo } from '@/components/marketing/MarketingNav';

const TABS = [
  { id: 'dashboard', label: 'Risk Dashboard', icon: ShieldAlert },
  { id: 'transactions', label: 'Transactions', icon: BarChart3 },
  { id: 'deminimis', label: 'De-minimis', icon: TrendingUp },
  { id: 'substance', label: 'Substance Docs', icon: FileCheck2 },
  { id: 'alerts', label: 'Alerts', icon: Bell },
];

function DashboardPreview() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Risk header */}
      <div className="flex items-center justify-between">
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'oklch(0.58 0 0)', marginBottom: 4 }}>QFZP Risk Score</div>
          <div style={{ fontSize: 48, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.03em', color: '#fbbf24' }}>72</div>
          <div style={{ fontSize: 12, color: 'oklch(0.60 0 0)', marginTop: 2 }}>At Risk — 3 factors need attention</div>
        </div>
        <div style={{ padding: '8px 16px', borderRadius: 9999, background: 'oklch(0.80 0.18 85 / 0.15)', border: '1px solid oklch(0.80 0.18 85 / 0.30)', color: '#fbbf24', fontSize: 12, fontWeight: 700 }}>
          AT RISK
        </div>
      </div>
      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'NQI Ratio', value: '3.8%', sub: 'of 5% limit', color: '#fbbf24' },
          { label: 'Absolute NQI', value: 'AED 1.9M', sub: 'of AED 5M limit', color: '#34d399' },
          { label: 'Days to Year-End', value: '94', sub: 'days remaining', color: '#60a5fa' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{ padding: '12px 14px', borderRadius: 10, background: 'oklch(0.22 0.03 255 / 0.6)', border: '1px solid oklch(0.55 0.22 260 / 0.10)' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'oklch(0.58 0 0)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color, letterSpacing: '-0.02em' }}>{value}</div>
            <div style={{ fontSize: 11, color: 'oklch(0.55 0 0)', marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>
      {/* Risk factors */}
      <div style={{ borderRadius: 10, background: 'oklch(0.22 0.03 255 / 0.5)', border: '1px solid oklch(0.55 0.22 260 / 0.10)', overflow: 'hidden' }}>
        {[
          { label: 'Mainland consulting revenue >2% of total', severity: 'HIGH', color: '#ef4444' },
          { label: 'Trade license expires in 23 days', severity: 'MEDIUM', color: '#f59e0b' },
          { label: 'NQI trending toward threshold at current run rate', severity: 'LOW', color: '#60a5fa' },
        ].map((r, i) => (
          <div key={r.label} className="flex items-center justify-between" style={{ padding: '10px 14px', borderTop: i > 0 ? '1px solid oklch(0.55 0.22 260 / 0.08)' : undefined }}>
            <div style={{ fontSize: 12, color: 'oklch(0.75 0 0)' }}>{r.label}</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: r.color, background: `${r.color}22`, padding: '2px 8px', borderRadius: 4 }}>{r.severity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionsPreview() {
  const rows = [
    { desc: 'DMCC - Software License Q1', amount: 'AED 485,000', type: 'QI', color: '#34d399' },
    { desc: 'Abu Dhabi Consulting Retainer', amount: 'AED 120,000', type: 'NQI', color: '#ef4444' },
    { desc: 'DIFC Entity — SaaS Subscription', amount: 'AED 62,000', type: 'QI', color: '#34d399' },
    { desc: 'Mainland Office Support Fee', amount: 'AED 38,500', type: 'NQI', color: '#ef4444' },
    { desc: 'Government Grant — DWTC', amount: 'AED 200,000', type: 'EXCLUDED', color: '#a78bfa' },
    { desc: 'JAFZA — Annual Service Contract', amount: 'AED 310,000', type: 'QI', color: '#34d399' },
  ];
  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 12, color: 'oklch(0.58 0 0)', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <span>Q1 2026 · 247 transactions classified</span>
        <span style={{ color: '#60a5fa', fontWeight: 600 }}>View all →</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div className="grid" style={{ gridTemplateColumns: '1fr auto auto', gap: 12, padding: '6px 10px', fontSize: 10, fontWeight: 700, color: 'oklch(0.52 0 0)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <span>Description</span><span>Amount</span><span>Type</span>
        </div>
        {rows.map((r) => (
          <div key={r.desc} className="grid" style={{ gridTemplateColumns: '1fr auto auto', gap: 12, padding: '10px 10px', background: 'oklch(0.20 0.03 255 / 0.5)', borderRadius: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'oklch(0.80 0 0)' }}>{r.desc}</span>
            <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'oklch(0.85 0 0)', fontWeight: 600 }}>{r.amount}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: r.color, background: `${r.color}22`, padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap' }}>{r.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeMinimisPreview() {
  const pct = 76;
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'oklch(0.58 0 0)', marginBottom: 8 }}>NQI Percentage Test</div>
        <div className="flex items-end gap-3 mb-3">
          <div style={{ fontSize: 40, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: '#fbbf24' }}>3.8%</div>
          <div style={{ fontSize: 13, color: 'oklch(0.60 0 0)', paddingBottom: 6 }}>of 5.0% limit</div>
        </div>
        <div style={{ height: 10, borderRadius: 99, background: 'oklch(0.22 0.03 255)', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #34d399, #fbbf24)', transition: 'width 1s ease' }} />
        </div>
        <div className="flex justify-between" style={{ marginTop: 6, fontSize: 11, color: 'oklch(0.55 0 0)' }}>
          <span>0%</span><span style={{ color: '#fbbf24' }}>76% of limit used</span><span>5%</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'oklch(0.58 0 0)', marginBottom: 8 }}>AED Absolute Test</div>
        <div className="flex items-end gap-3 mb-3">
          <div style={{ fontSize: 40, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', color: '#34d399' }}>AED 1.9M</div>
          <div style={{ fontSize: 13, color: 'oklch(0.60 0 0)', paddingBottom: 6 }}>of AED 5M limit</div>
        </div>
        <div style={{ height: 10, borderRadius: 99, background: 'oklch(0.22 0.03 255)', overflow: 'hidden' }}>
          <div style={{ width: '38%', height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #34d399, #34d399cc)', transition: 'width 1s ease' }} />
        </div>
        <div className="flex justify-between" style={{ marginTop: 6, fontSize: 11, color: 'oklch(0.55 0 0)' }}>
          <span>AED 0</span><span style={{ color: '#34d399' }}>38% used</span><span>AED 5M</span>
        </div>
      </div>
      <div style={{ padding: 14, borderRadius: 10, background: 'oklch(0.80 0.18 85 / 0.08)', border: '1px solid oklch(0.80 0.18 85 / 0.20)', fontSize: 12, color: '#fbbf24' }}>
        ⚠ At current NQI run rate, you will breach the 5% threshold in approximately <strong>61 days</strong>. Reclassify or restructure eligible transactions.
      </div>
    </div>
  );
}

function SubstancePreview() {
  const docs = [
    { label: 'Trade License', status: 'PASS', expires: 'Dec 2026', color: '#34d399' },
    { label: 'Lease Agreement', status: 'EXPIRING', expires: '23 days', color: '#fbbf24' },
    { label: 'Emirates IDs (Directors)', status: 'PASS', expires: 'Mar 2027', color: '#34d399' },
    { label: 'Organisation Chart', status: 'MISSING', expires: '—', color: '#ef4444' },
    { label: 'Payroll Register (Q1 2026)', status: 'PASS', expires: 'On file', color: '#34d399' },
    { label: 'Board Minutes — last meeting', status: 'MISSING', expires: '—', color: '#ef4444' },
  ];
  return (
    <div style={{ padding: 24 }}>
      <div className="grid" style={{ gridTemplateColumns: '1fr auto auto', gap: 12, padding: '6px 10px', fontSize: 10, fontWeight: 700, color: 'oklch(0.52 0 0)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
        <span>Document</span><span>Status</span><span>Expiry</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {docs.map((d) => (
          <div key={d.label} className="grid" style={{ gridTemplateColumns: '1fr auto auto', gap: 12, padding: '10px 10px', background: 'oklch(0.20 0.03 255 / 0.5)', borderRadius: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'oklch(0.80 0 0)' }}>{d.label}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: d.color, background: `${d.color}22`, padding: '2px 8px', borderRadius: 4 }}>{d.status}</span>
            <span style={{ fontSize: 11, color: 'oklch(0.60 0 0)', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }}>{d.expires}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertsPreview() {
  const alerts = [
    { severity: 'HIGH', msg: 'NQI ratio at 76% of limit — reclassification recommended', time: '2h ago', color: '#ef4444' },
    { severity: 'MEDIUM', msg: 'Trade license expires in 23 days — renewal required', time: '1d ago', color: '#f59e0b' },
    { severity: 'MEDIUM', msg: 'Board minutes not uploaded for Q1 — substance risk', time: '3d ago', color: '#f59e0b' },
    { severity: 'INFO', msg: 'Monthly compliance snapshot generated', time: '7d ago', color: '#60a5fa' },
  ];
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {alerts.map((a) => (
        <div key={a.msg} style={{ padding: '12px 14px', borderRadius: 10, background: 'oklch(0.20 0.03 255 / 0.5)', borderLeft: `3px solid ${a.color}`, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: a.color, background: `${a.color}22`, padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap', marginTop: 1 }}>{a.severity}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'oklch(0.82 0 0)', lineHeight: 1.5 }}>{a.msg}</div>
            <div style={{ fontSize: 11, color: 'oklch(0.52 0 0)', marginTop: 3 }}>{a.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const PREVIEW_MAP: Record<string, React.ReactNode> = {
  dashboard: <DashboardPreview />,
  transactions: <TransactionsPreview />,
  deminimis: <DeMinimisPreview />,
  substance: <SubstancePreview />,
  alerts: <AlertsPreview />,
};

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen" style={{ background: 'var(--ts-bg-base)', color: 'var(--ts-fg-primary)', fontFamily: 'var(--font-sans)' }}>
      <MarketingNav />

      {/* Hero */}
      <section style={{ padding: '140px 32px 60px', textAlign: 'center', maxWidth: 860, margin: '0 auto' }}>
        <div className="inline-flex items-center gap-2 mb-6" style={{ padding: '6px 16px', borderRadius: 9999, background: 'oklch(0.55 0.22 260 / 0.10)', border: '1px solid oklch(0.55 0.22 260 / 0.28)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#93c5fd' }}>
          <Play size={12} /> Live Product Demo
        </div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.06, marginBottom: 20 }}>
          See TaxSentry protect your<br />
          <span style={{ background: 'linear-gradient(125deg, #60a5fa 0%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>0% tax rate in real time</span>
        </h1>
        <p style={{ fontSize: 16, color: 'oklch(0.62 0 0)', lineHeight: 1.7, marginBottom: 36, maxWidth: 600, margin: '0 auto 36px' }}>
          Explore the live dashboard below. This shows a realistic QFZP entity at 76% of its de-minimis threshold — the exact situation most Free Zone finance teams are flying blind on today.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-xl font-bold transition-all hover:-translate-y-px"
            style={{ fontSize: 14, padding: '12px 24px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', boxShadow: '0 4px 20px rgba(37,99,235,0.35)', textDecoration: 'none' }}
          >
            Start Free Trial <ArrowRight size={14} />
          </Link>
          <a
            href="mailto:demo@taxsentry.ae?subject=TaxSentry guided demo request"
            style={{ fontSize: 14, padding: '12px 24px', borderRadius: 12, border: '1px solid oklch(0.40 0.025 255)', color: 'oklch(0.78 0 0)', textDecoration: 'none', fontWeight: 600, background: 'transparent' }}
          >
            Book a guided demo
          </a>
        </div>
      </section>

      {/* Interactive demo */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 32px 80px' }}>
        {/* Tab bar */}
        <div className="flex flex-wrap gap-1 mb-1" style={{ padding: '6px', background: 'oklch(0.18 0.035 255)', borderRadius: '14px 14px 0 0', border: '1px solid oklch(0.55 0.22 260 / 0.12)', borderBottom: 'none' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                background: activeTab === id ? 'oklch(0.55 0.22 260 / 0.18)' : 'transparent',
                color: activeTab === id ? '#93c5fd' : 'oklch(0.58 0 0)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
        {/* Preview pane */}
        <div style={{ background: 'oklch(0.17 0.03 255)', border: '1px solid oklch(0.55 0.22 260 / 0.14)', borderRadius: '0 0 14px 14px', minHeight: 340, overflow: 'hidden' }}>
          {/* Browser chrome */}
          <div className="flex items-center gap-2" style={{ padding: '10px 16px', background: 'oklch(0.15 0.025 255)', borderBottom: '1px solid oklch(0.55 0.22 260 / 0.10)' }}>
            {['#ef4444', '#fbbf24', '#34d399'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />)}
            <div style={{ flex: 1, maxWidth: 280, margin: '0 auto', background: 'oklch(0.20 0.03 255)', borderRadius: 6, padding: '3px 12px', fontSize: 11, color: 'oklch(0.50 0 0)', textAlign: 'center' }}>
              app.taxsentry.ae/dashboard
            </div>
          </div>
          {PREVIEW_MAP[activeTab]}
        </div>
      </section>

      {/* Three feature callouts */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 32px 100px' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Upload, title: 'Import in minutes', body: 'Upload a CSV from Zoho, QuickBooks, or Xero. TaxSentry classifies every line — QI, NQI, or Excluded — automatically against Cabinet Decision 100/2023.', color: '#60a5fa' },
            { icon: Zap, title: 'Live threshold tracking', body: 'Both de-minimis tests (5% ratio and AED 5M absolute) update the moment you save a transaction. No manual spreadsheets.', color: '#34d399' },
            { icon: FileCheck2, title: 'FTA-ready audit pack', body: 'Generate a classification evidence pack in one click. Includes transaction log, substance checklist, and risk narrative — formatted for FTA review.', color: '#a78bfa' },
          ].map(({ icon: Icon, title, body, color }) => (
            <div key={title} style={{ padding: '28px 24px', borderRadius: 14, background: 'oklch(0.18 0.035 255)', border: '1px solid oklch(0.55 0.22 260 / 0.12)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}18`, marginBottom: 16 }}>
                <Icon size={20} color={color} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--ts-fg-primary)' }}>{title}</h3>
              <p style={{ fontSize: 13, color: 'oklch(0.62 0 0)', lineHeight: 1.65, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA footer */}
      <div style={{ borderTop: '1px solid oklch(0.55 0.22 260 / 0.12)', padding: '60px 32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12 }}>Ready to protect your QFZP status?</h2>
        <p style={{ fontSize: 15, color: 'oklch(0.62 0 0)', marginBottom: 28 }}>14-day free trial. No credit card required.</p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 rounded-xl font-bold"
          style={{ fontSize: 15, padding: '14px 28px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 24px rgba(37,99,235,0.4)' }}
        >
          Start Free Trial <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
