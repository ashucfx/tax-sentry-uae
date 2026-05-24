'use client';

import { PageHero } from './PageHero';
import { FeatureGrid } from './FeatureGrid';
import { BenefitRow } from './BenefitRow';
import * as Icons from 'lucide-react';

export interface PageConfig {
  hero: {
    badge?: string;
    title: string;
    titleHighlight?: string;
    description: string;
  };
  features?: {
    heading: string;
    subheading?: string;
    items: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
  benefits?: Array<{
    badge: string;
    badgeIcon: string;
    title: string;
    description: string;
    bullets: string[];
  }>;
}

export function PageLayout({ config }: { config: PageConfig }) {
  return (
    <div style={{ background: 'var(--ts-bg-base)', minHeight: '100vh' }}>
      <PageHero {...config.hero} />
      
      {config.features && (
        <FeatureGrid
          heading={config.features.heading}
          subheading={config.features.subheading}
          features={config.features.items.map(item => ({
            ...item,
            icon: (Icons as any)[item.icon] || Icons.Circle,
          }))}
        />
      )}

      {config.benefits && config.benefits.map((benefit, idx) => (
        <BenefitRow
          key={idx}
          reversed={idx % 2 !== 0}
          badge={benefit.badge}
          badgeIcon={(Icons as any)[benefit.badgeIcon] || Icons.Circle}
          title={benefit.title}
          description={benefit.description}
          bullets={benefit.bullets}
        />
      ))}
    </div>
  );
}
