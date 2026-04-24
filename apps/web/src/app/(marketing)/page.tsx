import { ShieldCheck, ArrowRight, BarChart3, Lock, Zap } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {

  return (
    <div className="min-h-screen bg-navy-950 text-white selection:bg-blue-500/30">
      {/* ── Navigation ────────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight">TaxSentry</p>
            <p className="text-xs text-blue-400 font-bold tracking-wide uppercase -mt-1">QFZP Status Protection</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/sign-in" className="text-sm font-medium text-navy-100/60 hover:text-white transition-colors">
            Login
          </Link>
          <Link 
            href="/sign-up" 
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-sm font-bold hover:bg-blue-500 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-600/20"
          >
            Start Protecting Status
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────── */}
      <header className="relative pt-24 pb-32 overflow-hidden">
        {/* Abstract background decor */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Built for Qualifying Free Zone Person (QFZP) companies
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
            Protect Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">0% Status</span>
          </h1>
          
          <p className="text-xl text-navy-100/60 mb-12 max-w-2xl mx-auto leading-relaxed">
            Real-time de-minimis monitoring, revenue classification, and risk scoring. 
            Stop waiting for month-end reports—catch compliance breaches before they happen.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/sign-up" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 text-lg font-bold hover:bg-blue-500 transition-all hover:shadow-2xl hover:shadow-blue-600/40 flex items-center justify-center gap-2"
            >
              Get Started Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/demo" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-lg font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              See Product Demo
            </Link>
          </div>

          {/* Social Proof / Trust */}
          <div className="mt-20 pt-8 border-t border-white/5">
            <p className="text-xs uppercase font-bold tracking-[0.2em] text-white/20 mb-6">
              Compliant with UAE Federal Law & Cabinet Decisions
            </p>
            <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale contrast-125">
              {/* Placeholders for regulatory bodies/audit firms labels */}
              <span className="text-sm font-bold tracking-tighter">CABINET 100/2023</span>
              <span className="text-sm font-bold tracking-tighter">MINISTERIAL 265/2023</span>
              <span className="text-sm font-bold tracking-tighter">IMMUTABLE AUDIT LOG</span>
              <span className="text-sm font-bold tracking-tighter">AES-256 ENCRYPTED</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Value Props Grid ─────────────────────────── */}
      <section className="py-24 bg-navy-900">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">De-minimis Meter</h3>
              <p className="text-navy-100/50 leading-relaxed text-sm">
                Real-time tracking for the 5% / AED 5M Non-Qualifying Income threshold. 
                Get projected run-rates to avoid accidental exclusion.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">Auto-Classification</h3>
              <p className="text-navy-100/50 leading-relaxed text-sm">
                Rule-based classification of revenue into QI, NQI, and Excluded income 
                based on the latest FTA Qualifying Activity lists.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">Audit Readiness</h3>
              <p className="text-navy-100/50 leading-relaxed text-sm">
                Generate immutable audit logs and export standardized compliance packs 
                that accountants and tax auditors will actually accept.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-bold tracking-tight opacity-60">TaxSentry © 2026</span>
          </div>
          <div className="flex gap-8 text-xs font-semibold text-white/40">
            <Link href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link>
            <Link href="/security" className="hover:text-blue-400 transition-colors">Security Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
