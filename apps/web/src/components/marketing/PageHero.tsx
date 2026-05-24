'use client';

import { motion } from 'framer-motion';

export interface PageHeroProps {
  badge?: string;
  title: string;
  titleHighlight?: string;
  description: string;
}

export function PageHero({ badge, title, titleHighlight, description }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', padding: '160px 0 80px' }}>
      {/* Grid bg */}
      <div className="pointer-events-none absolute inset-0 grid-pattern" style={{ opacity: 0.5 }} />
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute"
        style={{ inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% -5%, oklch(0.96 0.01 240) 0%, transparent 65%)', zIndex: 0 }}
      />

      <div className="relative z-10 w-full text-center" style={{ maxWidth: 1000, margin: '0 auto', padding: '0 32px' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 35 }}>
          {badge && (
            <div className="inline-flex items-center gap-2 mb-6 mx-auto" style={{ padding: '6px 16px', borderRadius: 9999, background: 'var(--ts-bg-muted)', border: '1px solid var(--ts-border)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ts-blue-600)' }}>
              {badge}
            </div>
          )}

          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, lineHeight: 1.06, letterSpacing: '-0.04em', marginBottom: 24, color: 'var(--ts-fg-primary)' }}>
            {title}{' '}
            {titleHighlight && (
              <span style={{ background: 'linear-gradient(125deg, #60a5fa 0%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {titleHighlight}
              </span>
            )}
          </h1>

          <p style={{ fontSize: 'clamp(1.1rem, 2vw, 1.25rem)', lineHeight: 1.6, color: 'var(--ts-fg-secondary)', maxWidth: 650, margin: '0 auto 40px' }}>
            {description}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
