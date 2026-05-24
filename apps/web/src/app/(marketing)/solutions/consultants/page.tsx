import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function Page() {
  return (
    <div style={{ background: 'var(--ts-bg-base)', color: 'var(--ts-fg-primary)', minHeight: '100vh', paddingTop: 120, paddingBottom: 100 }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 32px' }}>
        <div className="inline-flex items-center gap-2 mb-6" style={{ padding: '6px 16px', borderRadius: 9999, background: 'var(--ts-bg-muted)', border: '1px solid var(--ts-border)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ts-blue-600)' }}>
          <ShieldCheck size={12} /> Enterprise Class
        </div>
        
        <h1 style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 24 }}>
          For Tax Consultants
        </h1>
        
        <p style={{ fontSize: 18, color: 'var(--ts-fg-muted)', maxWidth: 600, lineHeight: 1.7, marginBottom: 48 }}>
          Discover how TaxSentry’s For Tax Consultants capabilities provide board-level visibility and airtight compliance for UAE Free Zone Qualifying Persons.
        </p>

        <div className="flex gap-4 mb-20">
          <Link href="/sign-in" className="flex items-center gap-2 rounded-xl font-bold" style={{ padding: '0 32px', height: 56, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', textDecoration: 'none' }}>
            Start Free Trial <ArrowRight size={18} />
          </Link>
          <Link href="/contact" className="flex items-center gap-2 rounded-xl font-bold" style={{ padding: '0 32px', height: 56, border: '1px solid var(--ts-border)', color: 'var(--ts-fg-secondary)', textDecoration: 'none' }}>
            Contact Sales
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: 'Real-Time Sync', desc: 'Connects directly with your systems without manual CSV uploads.' },
            { icon: CheckCircle2, title: 'FTA Aligned', desc: 'Every calculation maps strictly to the latest UAE Ministry of Finance guidelines.' },
            { icon: ShieldCheck, title: 'Audit Ready', desc: 'Generates comprehensive evidentiary packs instantly upon request.' }
          ].map(({icon: Icon, title: t, desc}, i) => (
            <div key={i} style={{ padding: 32, background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)', borderRadius: 16 }}>
              <div className="flex items-center justify-center rounded-xl mb-6" style={{ width: 48, height: 48, background: 'var(--ts-bg-muted)' }}>
                <Icon size={24} color="var(--ts-blue-500)" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>{t}</h3>
              <p style={{ fontSize: 14, color: 'var(--ts-fg-muted)', lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
