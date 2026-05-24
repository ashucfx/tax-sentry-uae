import Link from 'next/link';
import { ArrowLeft, Clock, ShieldCheck } from 'lucide-react';
import { TaxSentryLogo } from '@/components/marketing/MarketingNav';

export default function ComingSoonPage({ params }: { params: { slug: string[] } }) {
  // Try to create a nice title from the URL path
  const path = params.slug.join(' / ').replace(/-/g, ' ');
  const title = path.replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--ts-bg-base)', color: 'var(--ts-fg-primary)' }}>
      {/* Simple Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5 text-inherit no-underline">
          <TaxSentryLogo size={28} />
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>Tax<span style={{ color: 'var(--ts-blue-600)' }}>Sentry</span></span>
        </Link>
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--ts-fg-secondary)' }}>
          <ArrowLeft size={16} /> Back to Platform
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6" style={{ padding: '120px 20px' }}>
        <div className="inline-flex items-center justify-center rounded-2xl mb-8" style={{ width: 64, height: 64, background: 'oklch(0.60 0.15 260 / 0.1)' }}>
          <Clock size={32} color="var(--ts-blue-600)" />
        </div>
        <div className="inline-flex items-center gap-2 mb-6" style={{ padding: '6px 14px', borderRadius: 9999, background: 'var(--ts-bg-muted)', border: '1px solid var(--ts-border)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ts-fg-muted)' }}>
          Enterprise Roadmap
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 16 }}>
          {title}
        </h1>
        <p style={{ fontSize: 18, color: 'var(--ts-fg-muted)', maxWidth: 500, margin: '0 auto 40px', lineHeight: 1.6 }}>
          We are currently building out this section of the TaxSentry platform. Institutional-grade compliance infrastructure takes time to perfect.
        </p>
        
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all hover:-translate-y-px"
          style={{ fontSize: 15, padding: '0 28px', height: 48, background: 'var(--ts-fg-primary)', color: 'var(--ts-bg-base)', textDecoration: 'none' }}
        >
          Return Home
        </Link>

        <div className="mt-20 flex items-center justify-center gap-6" style={{ borderTop: '1px solid var(--ts-border)', paddingTop: 40, width: '100%', maxWidth: 400 }}>
          <div className="flex items-center gap-2" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ts-fg-muted)' }}>
            <ShieldCheck size={14} color="var(--ts-blue-500)" /> UAE Data Locality
          </div>
        </div>
      </main>
    </div>
  );
}
