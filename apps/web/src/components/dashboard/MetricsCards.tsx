'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { TrendingUp, TrendingDown } from 'lucide-react';

type Variant = 'default' | 'success' | 'warning' | 'danger';

const VARIANT_STYLES: Record<
  Variant,
  { border: string; bg: string; valueColor: string }
> = {
  default: {
    border: 'var(--ts-border)',
    bg: 'var(--ts-bg-card)',
    valueColor: 'var(--ts-fg-primary)',
  },
  success: {
    border: 'oklch(0.70 0.20 155 / 0.3)',
    bg: 'oklch(0.70 0.20 155 / 0.05)',
    valueColor: 'var(--ts-green-500)',
  },
  warning: {
    border: 'oklch(0.80 0.18 85 / 0.3)',
    bg: 'oklch(0.80 0.18 85 / 0.05)',
    valueColor: 'var(--ts-amber-500)',
  },
  danger: {
    border: 'oklch(0.62 0.24 25 / 0.3)',
    bg: 'oklch(0.62 0.24 25 / 0.05)',
    valueColor: 'var(--ts-red-500)',
  },
};

interface MetricCard {
  label: string;
  value: string;
  sub?: string;
  variant: Variant;
  trend?: string;
  trendDir?: 'up' | 'down';
}

function MetricCard({ label, value, sub, variant, trend, trendDir }: MetricCard) {
  const vs = VARIANT_STYLES[variant];
  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{ border: `1px solid ${vs.border}`, background: vs.bg, padding: '18px 20px' }}
    >
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${vs.border}, transparent)`,
        }}
      />
      <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 6 }}>{label}</p>
      <p
        className="ts-metric"
        style={{ color: vs.valueColor, fontSize: 24 }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: 11, color: 'oklch(0.45 0 0)', marginTop: 4 }}>{sub}</p>
      )}
      {trend && (
        <div className="flex items-center gap-1 mt-2.5">
          {trendDir === 'up' ? (
            <TrendingUp size={12} color="var(--ts-green-500)" />
          ) : (
            <TrendingDown size={12} color="var(--ts-red-500)" />
          )}
          <span
            style={{
              fontSize: 11,
              color: trendDir === 'up' ? 'var(--ts-green-500)' : 'var(--ts-red-500)',
            }}
          >
            {trend}
          </span>
        </div>
      )}
    </div>
  );
}

export function MetricsCards() {
  const { data: dmData } = useQuery({
    queryKey: ['deminimis-status'],
    queryFn: () => api.get('/deminimis/status').then((r) => r.data.data),
  });

  const { data: riskData } = useQuery({
    queryKey: ['risk-score'],
    queryFn: () => api.get('/risk/score').then((r) => r.data.data),
  });

  const { data: alertsData } = useQuery({
    queryKey: ['alerts-count'],
    queryFn: () => api.get('/alerts?limit=5').then((r) => r.data.data),
  });

  const dm = dmData?.deMinimis;
  const nqrPct = dm ? parseFloat(dm.nqrPercentage).toFixed(2) : '—';
  const nqrAmt = dm ? formatAed(parseFloat(dm.nqrAmount)) : '—';
  const pendingCount = alertsData?.unreadCount ?? alertsData?.total ?? 0;
  const riskScore = riskData?.total ?? null;

  const cards: MetricCard[] = [
    {
      label: 'Risk Score',
      value: riskScore !== null ? `${riskScore}/100` : '—',
      sub: riskData?.bandLabel ?? 'Overall QFZP health',
      variant: riskData?.band === 'GREEN' ? 'success' : riskData?.band === 'RED' ? 'danger' : 'warning',
    },
    {
      label: 'NQI % of Revenue',
      value: `${nqrPct}%`,
      sub: 'Threshold: 5.00%',
      variant:
        parseFloat(nqrPct) >= 5
          ? 'danger'
          : parseFloat(nqrPct) >= 4
          ? 'warning'
          : 'success',
    },
    {
      label: 'NQI Amount',
      value: nqrAmt,
      sub: 'Threshold: AED 5M',
      variant: dm
        ? parseFloat(dm.nqrAmount) >= 5_000_000
          ? 'danger'
          : parseFloat(dm.nqrAmount) >= 4_000_000
          ? 'warning'
          : 'success'
        : 'default',
    },
    {
      label: 'Pending Actions',
      value: pendingCount > 0 ? String(pendingCount) : '0',
      sub: pendingCount > 0 ? 'Require your attention' : 'All clear',
      variant: pendingCount > 2 ? 'danger' : pendingCount > 0 ? 'warning' : 'success',
    },
  ];

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        fontFamily: 'var(--font-sans)',
      }}
    >
      {cards.map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
  );
}

function formatAed(v: number) {
  if (v >= 1_000_000) return `AED ${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `AED ${(v / 1_000).toFixed(0)}K`;
  return `AED ${v}`;
}
