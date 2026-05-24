'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface FeatureGridProps {
  heading: string;
  subheading?: string;
  features: FeatureItem[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } }
};

export function FeatureGrid({ heading, subheading, features }: FeatureGridProps) {
  return (
    <section style={{ padding: '100px 32px', background: 'var(--ts-bg-base)' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--ts-fg-primary)', marginBottom: 16 }}>
            {heading}
          </h2>
          {subheading && (
            <p style={{ fontSize: 18, color: 'var(--ts-fg-secondary)', maxWidth: 700, margin: '0 auto' }}>
              {subheading}
            </p>
          )}
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="relative overflow-hidden"
              style={{
                padding: 32,
                background: 'var(--ts-bg-muted)',
                borderRadius: 24,
                border: '1px solid var(--ts-border)',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--ts-blue-400)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--ts-border)'; }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(29,78,216,0.05))', border: '1px solid rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <feature.icon size={24} color="var(--ts-blue-500)" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ts-fg-primary)', marginBottom: 12 }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: 15, color: 'var(--ts-fg-secondary)', lineHeight: 1.6 }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
