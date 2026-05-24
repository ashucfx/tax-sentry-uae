'use client';

import { motion } from 'framer-motion';
import { LucideIcon, CheckCircle2 } from 'lucide-react';

export interface BenefitRowProps {
  reversed?: boolean;
  badge: string;
  badgeIcon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
}

export function BenefitRow({ reversed = false, badge, badgeIcon: BadgeIcon, title, description, bullets }: BenefitRowProps) {
  return (
    <section style={{ padding: '80px 32px', background: 'var(--ts-bg-deepest)', borderTop: '1px solid var(--ts-border)' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${reversed ? 'lg:flex-row-reverse' : ''}`}>
          
          {/* Content Side */}
          <div className={reversed ? 'lg:order-2' : 'lg:order-1'}>
            <motion.div initial={{ opacity: 0, x: reversed ? 30 : -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 mb-6" style={{ padding: '6px 16px', borderRadius: 9999, background: 'var(--ts-bg-muted)', border: '1px solid var(--ts-border)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ts-blue-600)' }}>
                <BadgeIcon size={14} /> {badge}
              </div>
              <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.5rem)', fontWeight: 800, color: 'var(--ts-fg-primary)', marginBottom: 20, lineHeight: 1.15 }}>
                {title}
              </h2>
              <p style={{ fontSize: 18, color: 'var(--ts-fg-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
                {description}
              </p>
              <div className="flex flex-col gap-4">
                {bullets.map((bullet, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={20} color="#34d399" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 16, color: 'var(--ts-fg-primary)' }}>{bullet}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Visual Side Placeholder */}
          <div className={reversed ? 'lg:order-1' : 'lg:order-2'}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              whileInView={{ opacity: 1, scale: 1 }} 
              viewport={{ once: true, margin: "-50px" }} 
              transition={{ duration: 0.6 }}
              style={{ width: '100%', height: 400, borderRadius: 24, background: 'linear-gradient(135deg, var(--ts-bg-muted) 0%, var(--ts-bg-base) 100%)', border: '1px solid var(--ts-border)', position: 'relative', overflow: 'hidden' }}
            >
              {/* Abstract decorative elements to represent the app UI */}
              <div style={{ position: 'absolute', top: 40, left: 40, right: 40, bottom: 40, border: '1px solid var(--ts-border-subtle)', borderRadius: 12, background: 'var(--ts-bg-base)', padding: 24 }}>
                 <div style={{ width: '40%', height: 16, background: 'var(--ts-bg-muted)', borderRadius: 4, marginBottom: 24 }} />
                 <div style={{ width: '100%', height: 60, background: 'var(--ts-bg-muted)', borderRadius: 8, marginBottom: 12 }} />
                 <div style={{ width: '100%', height: 60, background: 'var(--ts-bg-muted)', borderRadius: 8, marginBottom: 12 }} />
                 <div style={{ width: '70%', height: 60, background: 'var(--ts-bg-muted)', borderRadius: 8 }} />
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
