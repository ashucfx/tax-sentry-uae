'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

const BAND_CONFIG = {
  GREEN: {
    color: 'var(--ts-green-500)',
    bg: 'oklch(0.70 0.20 155 / 0.1)',
    border: 'oklch(0.70 0.20 155 / 0.3)',
    label: 'Excellent — Low Risk',
  },
  AMBER: {
    color: 'var(--ts-amber-500)',
    bg: 'oklch(0.80 0.18 85 / 0.1)',
    border: 'oklch(0.80 0.18 85 / 0.3)',
    label: 'Moderate — Monitor Closely',
  },
  RED: {
    color: 'var(--ts-red-500)',
    bg: 'oklch(0.62 0.24 25 / 0.1)',
    border: 'oklch(0.62 0.24 25 / 0.3)',
    label: 'High Risk — Action Required',
  },
};

interface Factor {
  label: string;
  value: number;
}

function FactorBar({ label, value }: Factor) {
  let barColor = 'var(--ts-green-500)';
  if (value < 60) barColor = 'var(--ts-red-500)';
  else if (value < 80) barColor = 'var(--ts-amber-500)';

  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: '7px 0',
        borderBottom: '1px solid var(--ts-border-subtle)',
      }}
    >
      <span style={{ fontSize: 12, color: 'oklch(0.80 0 0)' }}>{label}</span>
      <div className="flex items-center gap-2">
        <div
          className="overflow-hidden rounded-full"
          style={{ width: 64, height: 4, background: 'var(--ts-bg-muted)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${value}%`, background: barColor }}
          />
        </div>
        <span
          className="ts-mono text-right"
          style={{ fontSize: 12, fontWeight: 600, color: barColor, minWidth: 38 }}
        >
          {value}%
        </span>
      </div>
    </div>
  );
}

export function RiskHeroCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['risk-score'],
    queryFn: () => api.get('/risk/score').then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div
        className="w-full rounded-xl animate-pulse"
        style={{
          height: 280,
          background: 'var(--ts-bg-card)',
          border: '1px solid var(--ts-border)',
        }}
      />
    );
  }

  if (!data) return null;

  const band: 'GREEN' | 'AMBER' | 'RED' = data.band ?? 'AMBER';
  const bc = BAND_CONFIG[band];
  const score: number = data.total ?? 72;
  const lastCalc = new Date().toLocaleDateString('en-AE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const factors: Factor[] = data.factors ?? [
    { label: 'De-Minimis Buffer', value: 76 },
    { label: 'Substance Completeness', value: 85 },
    { label: 'Audit Readiness', value: 90 },
    { label: 'Related Party Safety', value: 68 },
    { label: 'Classification Confidence', value: 82 },
  ];

  return (
    <div
      className="premium-card w-full"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <div className="flex flex-col md:flex-row" style={{ padding: 24, gap: 24 }}>
        {/* Score display */}
        <div className="flex flex-col" style={{ minWidth: 200 }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0, marginBottom: 3 }}>
                Compliance Risk Score
              </h3>
              <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0 }}>
                Overall QFZP health assessment
              </p>
            </div>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={bc.color} strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 2L3 7v7c0 5.25 3.75 10.15 9 11.5C17.25 24.15 21 19.25 21 14V7L12 2z" fill={bc.bg} />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>

          {/* Big Score */}
          <div
            className="rounded-[10px] text-center"
            style={{
              border: `1px solid ${bc.border}`,
              background: bc.bg,
              padding: '16px 20px',
              marginBottom: 16,
            }}
          >
            <div
              className="ts-metric-lg"
              style={{ color: bc.color }}
            >
              {score}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginTop: 4 }}>
              {bc.label}
            </div>
          </div>

          <p style={{ fontSize: 10, color: 'oklch(0.40 0 0)', margin: 0 }}>
            Last calculated: {lastCalc}
          </p>
        </div>

        {/* Divider */}
        <div
          className="hidden md:block"
          style={{ width: 1, background: 'var(--ts-border-subtle)', flexShrink: 0 }}
        />

        {/* Breakdown */}
        <div className="flex-1">
          <p
            className="mb-2"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'oklch(0.58 0 0)',
            }}
          >
            Score Breakdown
          </p>
          {factors.map((f) => (
            <FactorBar key={f.label} {...f} />
          ))}
        </div>
      </div>
    </div>
  );
}
