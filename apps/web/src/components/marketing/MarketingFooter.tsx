'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Lock,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Mail,
} from 'lucide-react';
import { TaxSentryLogo } from './MarketingNav';

export function MarketingFooter() {
  return (
    <>
      {/* ── CTA ──────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="relative overflow-hidden"
        style={{ textAlign: 'center', background: 'var(--ts-bg-deepest)' }}
      >
        <div
          className="ts-section ts-container"
          style={{ paddingTop: 'clamp(64px, 10vw, 120px)', paddingBottom: 'clamp(64px, 10vw, 100px)' }}
        >
          <div className="pointer-events-none absolute" style={{ top: '0', left: '50%', transform: 'translateX(-50%)', width: 800, height: 400, background: 'radial-gradient(ellipse at top, oklch(0.55 0.22 260 / 0.15), transparent 70%)', zIndex: 0 }} />
          <div className="relative z-10" style={{ maxWidth: 800, margin: '0 auto' }}>
            <div className="inline-flex items-center gap-2 mb-6" style={{ padding: '6px 16px', borderRadius: 9999, background: 'var(--ts-bg-muted)', border: '1px solid var(--ts-border)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ts-fg-secondary)' }}>
              <Lock size={12} /> Enterprise Ready
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 20, color: 'var(--ts-fg-primary)', lineHeight: 1.1 }}>
              The FTA doesn&apos;t send warnings.<br />
              <span style={{ background: 'linear-gradient(125deg, #60a5fa 0%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>We do.</span>
            </h2>
            <p style={{ fontSize: 'clamp(14px, 2vw, 18px)', color: 'var(--ts-fg-secondary)', marginBottom: 40, maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.6 }}>
              Start your 14-day free trial. Connect your accounting data in minutes. Monitor your UAE QFZP status continuously with board-level visibility.
            </p>

            {/* CTA Buttons */}
            <div
              className="ts-cta-group"
              style={{ justifyContent: 'center', marginBottom: 36 }}
            >
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/sign-in"
                  className="flex items-center justify-center gap-2 rounded-xl font-bold"
                  style={{ fontSize: 'clamp(14px, 2vw, 16px)', padding: '0 clamp(24px, 4vw, 36px)', height: 54, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', boxShadow: '0 4px 20px rgba(37,99,235,0.3)', textDecoration: 'none' }}
                >
                  Get Protected Today <ArrowRight size={18} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/request-demo"
                  className="flex items-center justify-center gap-2 rounded-xl font-bold"
                  style={{ fontSize: 'clamp(14px, 2vw, 16px)', padding: '0 clamp(24px, 4vw, 36px)', height: 54, background: 'transparent', color: 'var(--ts-fg-secondary)', border: '1px solid oklch(0.40 0.025 255)', textDecoration: 'none' }}
                >
                  Request a Demo
                </Link>
              </motion.div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(12px, 3vw, 24px)', flexWrap: 'wrap' }}>
              <div className="flex items-center gap-2" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ts-fg-muted)' }}>
                <ShieldCheck size={14} color="#34d399" /> Zero IT Integration
              </div>
              <div className="flex items-center gap-2" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ts-fg-muted)' }}>
                <Lock size={14} color="#60a5fa" /> Bank-Grade Encryption
              </div>
              <div className="flex items-center gap-2" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ts-fg-muted)' }}>
                <CheckCircle2 size={14} color="#34d399" /> Cancel Anytime
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer style={{ background: 'var(--ts-bg-deepest)', borderTop: '1px solid var(--ts-border)' }}>
        <div className="ts-container" style={{ maxWidth: 1280 }}>

          {/* 5-column responsive grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="ts-footer-grid"
          >
            {/* Brand */}
            <div className="ts-footer-brand">
              <div className="flex items-center gap-2.5 mb-5">
                <TaxSentryLogo size={32} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--ts-fg-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    Tax<span style={{ color: 'var(--ts-blue-400)' }}>Sentry</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)', lineHeight: 1.6, marginBottom: 20, maxWidth: 280 }}>
                Institutional-grade financial compliance infrastructure. Architected exclusively for UAE Free Zone Qualifying Persons navigating the 9% corporate tax regime.
              </p>
              <div className="flex gap-3">
                {[
                  { icon: Mail, href: 'mailto:hello@taxsentry.com' },
                ].map(({ icon: Icon, href }, i) => (
                  <Link
                    key={i}
                    href={href}
                    className="flex items-center justify-center rounded-lg"
                    style={{ width: 36, height: 36, background: 'var(--ts-bg-muted)', border: '1px solid var(--ts-border)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--ts-blue-400)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--ts-border)'; }}
                  >
                    <Icon size={16} color="var(--ts-fg-secondary)" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ts-fg-primary)', marginBottom: 20 }}>Platform</div>
              <div className="flex flex-col gap-3">
                {[
                  ['De-Minimis Tracker', '/platform/de-minimis'],
                  ['Classification Engine', '/platform/classification'],
                  ['Substance Vault', '/platform/substance'],
                  ['Audit Pack Generation', '/platform/audit'],
                  ['API Access', '/api-docs'],
                  ['Accounting Sync', '/integrations'],
                ].map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    style={{ fontSize: 13, color: 'var(--ts-fg-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-primary)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-secondary)'; }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Solutions */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ts-fg-primary)', marginBottom: 20 }}>Solutions</div>
              <div className="flex flex-col gap-3">
                {[
                  ['For CFOs', '/solutions/cfos'],
                  ['For Free Zones', '/solutions/free-zones'],
                  ['For Auditors', '/solutions/auditors'],
                  ['For Tax Consultants', '/solutions/consultants'],
                  ['Startups & SMEs', '/solutions/startups'],
                  ['Enterprise', '/solutions/enterprise'],
                ].map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    style={{ fontSize: 13, color: 'var(--ts-fg-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-primary)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-secondary)'; }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ts-fg-primary)', marginBottom: 20 }}>Resources</div>
              <div className="flex flex-col gap-3">
                {[
                  ['Documentation', '/docs'],
                  ['Developer Hub', '/developers'],
                  ['UAE Tax Glossary', '/glossary'],
                  ['FTA Guidelines', '/fta-guidelines'],
                  ['System Status', '/status'],
                  ['Security & Architecture', '/security'],
                ].map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    style={{ fontSize: 13, color: 'var(--ts-fg-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-primary)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-secondary)'; }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Company & Legal */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ts-fg-primary)', marginBottom: 20 }}>Company</div>
              <div className="flex flex-col gap-3">
                {[
                  ['About Us', '/about'],
                  ['Contact Sales', '/contact'],
                  ['Privacy Policy', '/privacy'],
                  ['Terms of Service', '/terms'],
                  ['Cookie Policy', '/cookies'],
                ].map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    style={{ fontSize: 13, color: 'var(--ts-fg-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-primary)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-secondary)'; }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Trust Badges Bar */}
          <div className="ts-trust-bar">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 24px' }}>
              <div className="flex items-center gap-2" style={{ fontSize: 11, fontWeight: 600, color: 'var(--ts-fg-muted)' }}>
                <Globe size={14} /> Architected for UAE Data Sovereignty
              </div>
              <div className="flex items-center gap-2" style={{ fontSize: 11, fontWeight: 600, color: 'var(--ts-fg-muted)' }}>
                <Lock size={14} /> Industry Standard Encryption
              </div>
              <div className="flex items-center gap-2" style={{ fontSize: 11, fontWeight: 600, color: 'var(--ts-fg-muted)' }}>
                <CheckCircle2 size={14} /> FTA-Aligned Methodology
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.6)' }}
              />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', letterSpacing: '0.02em' }}>All systems operational</span>
            </div>
          </div>

          {/* Copyright Bar */}
          <div className="ts-copyright-bar">
            <div style={{ fontSize: 12, color: 'var(--ts-fg-muted)' }}>
              © 2026 TaxSentry. All rights reserved.
            </div>
            <div style={{ fontSize: 12, color: 'var(--ts-fg-muted)' }}>
              A product of{' '}
              <a
                href="https://www.theripplenexus.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--ts-fg-secondary)', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-secondary)'; }}
              >
                Ripple Nexus
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
