'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import { Bell } from 'lucide-react';

type StatusBadge = 'SAFE' | 'AT_RISK' | 'BREACH_IMMINENT' | 'BREACHED';

const STATUS_CONFIG: Record<
  StatusBadge,
  { label: string; color: string; bg: string; border: string; glow: string }
> = {
  SAFE: {
    label: 'QFZP PROTECTED',
    color: 'oklch(0.70 0.20 155)',
    bg: 'oklch(0.70 0.20 155 / 0.15)',
    border: 'oklch(0.70 0.20 155 / 0.3)',
    glow: '0 0 20px oklch(0.70 0.20 155 / 0.25)',
  },
  AT_RISK: {
    label: 'AT RISK',
    color: 'oklch(0.80 0.18 85)',
    bg: 'oklch(0.80 0.18 85 / 0.15)',
    border: 'oklch(0.80 0.18 85 / 0.3)',
    glow: '0 0 20px oklch(0.80 0.18 85 / 0.25)',
  },
  BREACH_IMMINENT: {
    label: 'BREACH IMMINENT',
    color: 'oklch(0.62 0.24 25)',
    bg: 'oklch(0.62 0.24 25 / 0.15)',
    border: 'oklch(0.62 0.24 25 / 0.3)',
    glow: '0 0 20px oklch(0.62 0.24 25 / 0.25)',
  },
  BREACHED: {
    label: 'QFZP BREACHED',
    color: 'oklch(0.62 0.24 25)',
    bg: 'oklch(0.62 0.24 25 / 0.2)',
    border: 'oklch(0.62 0.24 25 / 0.5)',
    glow: '0 0 30px oklch(0.62 0.24 25 / 0.4)',
  },
};

const RISK_BAND_CONFIG = {
  GREEN: {
    color: 'oklch(0.70 0.20 155)',
    bg: 'oklch(0.70 0.20 155 / 0.1)',
    border: 'oklch(0.70 0.20 155 / 0.3)',
    label: 'Low Risk',
  },
  AMBER: {
    color: 'oklch(0.80 0.18 85)',
    bg: 'oklch(0.80 0.18 85 / 0.1)',
    border: 'oklch(0.80 0.18 85 / 0.3)',
    label: 'Monitor',
  },
  RED: {
    color: 'oklch(0.62 0.24 25)',
    bg: 'oklch(0.62 0.24 25 / 0.1)',
    border: 'oklch(0.62 0.24 25 / 0.3)',
    label: 'High Risk',
  },
};

export function TopRibbon() {
  const { user } = useAuthStore();

  const { data: dmData } = useQuery({
    queryKey: ['deminimis-status'],
    queryFn: () => api.get('/deminimis/status').then((r) => r.data.data),
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: riskData } = useQuery({
    queryKey: ['risk-score'],
    queryFn: () => api.get('/risk/score').then((r) => r.data.data),
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: alertsData } = useQuery({
    queryKey: ['alerts-count'],
    queryFn: () => api.get('/alerts?limit=1').then((r) => r.data.data),
    refetchInterval: 60 * 1000,
  });

  const statusBadge: StatusBadge =
    dmData?.deMinimis?.statusBadge ?? 'SAFE';
  const sc = STATUS_CONFIG[statusBadge];

  const score: number | null = riskData?.total ?? null;
  const band: 'GREEN' | 'AMBER' | 'RED' = riskData?.band ?? 'GREEN';
  const daysRemaining: number | null = dmData?.period?.daysRemaining ?? null;
  const freeZone: string = user?.org?.freeZone ?? 'DMCC';
  const licenseNo: string = user?.org?.tradeLicenseNo ?? '';
  const companyName = user?.org?.name ?? 'Your Company';
  const pendingCount: number = alertsData?.unreadCount ?? 0;

  const riskBand = RISK_BAND_CONFIG[band];

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between"
      style={{
        padding: '0 24px',
        height: 72,
        flexShrink: 0,
        background: 'oklch(0.18 0.035 255 / 0.9)',
        borderBottom: '1px solid var(--ts-border)',
        backdropFilter: 'blur(16px)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Left: Status badge + company info */}
      <div className="flex items-center gap-4">
        <div
          className="flex items-center gap-2 rounded-full text-[12px] font-bold tracking-[0.06em]"
          style={{
            padding: '8px 16px',
            background: sc.bg,
            color: sc.color,
            border: `1px solid ${sc.border}`,
            boxShadow: sc.glow,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L3 7v7c0 5.25 3.75 10.15 9 11.5C17.25 24.15 21 19.25 21 14V7L12 2z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          {sc.label}
        </div>

        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ts-fg-primary)' }}>
            {companyName}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="rounded"
              style={{
                background: 'var(--ts-bg-elevated)',
                color: 'var(--ts-fg-muted)',
                fontSize: 10,
                padding: '1px 7px',
              }}
            >
              {freeZone}
            </span>
            {licenseNo && (
              <span style={{ fontSize: 10, color: 'oklch(0.45 0 0)' }}>
                License: {licenseNo}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Risk score, days remaining, actions */}
      <div className="flex items-center gap-3">
        {/* Risk score */}
        {score !== null && (
          <div
            className="flex items-center gap-2.5 rounded-[10px]"
            style={{
              border: `1px solid ${riskBand.border}`,
              background: riskBand.bg,
              padding: '8px 14px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  color: riskBand.color,
                  lineHeight: 1,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {score}
              </div>
              <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'oklch(0.45 0 0)' }}>
                Risk
              </div>
            </div>
            <div
              style={{ width: 1, height: 28, background: 'var(--ts-border)' }}
            />
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: riskBand.color }}>
                {riskBand.label}
              </div>
              <div style={{ fontSize: 8, color: 'oklch(0.45 0 0)' }}>of 100</div>
            </div>
          </div>
        )}

        {/* Days remaining */}
        {daysRemaining !== null && (
          <div
            className="flex items-center gap-2 rounded-[10px]"
            style={{
              border: '1px solid var(--ts-border)',
              background: 'var(--ts-bg-elevated)',
              padding: '8px 14px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="oklch(0.55 0 0)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--ts-fg-primary)',
                  lineHeight: 1,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {daysRemaining}
              </div>
              <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'oklch(0.45 0 0)' }}>
                Period Ends
              </div>
            </div>
          </div>
        )}

        <div style={{ width: 1, height: 32, background: 'var(--ts-border)' }} />

        {/* Bell */}
        <button
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: 36,
            height: 36,
            background: 'var(--ts-bg-elevated)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Bell size={16} color="var(--ts-blue-500)" strokeWidth={1.5} />
          {pendingCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-[8px] font-bold"
              style={{
                width: 16,
                height: 16,
                background: 'var(--ts-amber-500)',
                color: 'oklch(0.20 0.05 85)',
              }}
            >
              {pendingCount}
            </span>
          )}
        </button>

        {/* User avatar */}
        <button
          className="flex items-center justify-center rounded-full"
          style={{
            width: 36,
            height: 36,
            background: 'oklch(0.55 0.22 260 / 0.15)',
            border: '1px solid oklch(0.55 0.22 260 / 0.3)',
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ts-blue-500)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>
    </header>
  );
}
