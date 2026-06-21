'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import { NotificationBell } from '@/components/notifications/NotificationBell';

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

  const statusBadge: StatusBadge =
    dmData?.deMinimis?.statusBadge ?? 'SAFE';
  const sc = STATUS_CONFIG[statusBadge];

  const score: number | null = riskData?.total ?? null;
  const band: 'GREEN' | 'AMBER' | 'RED' = riskData?.band ?? 'GREEN';
  const daysRemaining: number | null = dmData?.period?.daysRemaining ?? null;
  const freeZone: string = user?.org?.freeZone ?? 'DMCC';
  const licenseNo: string = user?.org?.tradeLicenseNo ?? '';
  const companyName = user?.org?.name ?? 'Your Company';

  const riskBand = RISK_BAND_CONFIG[band];

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between"
      style={{
        padding: '0 24px',
        height: 72,
        flexShrink: 0,
        background: 'rgba(255, 255, 255, 0.9)',
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
                background: 'var(--ts-bg-muted)',
                color: 'var(--ts-fg-secondary)',
                fontSize: 10,
                padding: '2px 8px',
                border: '1px solid var(--ts-border)',
                fontWeight: 500,
              }}
            >
              {freeZone}
            </span>
            {licenseNo && (
              <span style={{ fontSize: 10, color: 'var(--ts-fg-muted)', fontWeight: 500 }}>
                License: {licenseNo}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Risk score, days remaining, actions */}
      <div className="flex items-center gap-4">
        {/* Risk score */}
        {score !== null && (
          <div
            className="flex items-center gap-3 rounded-[10px]"
            style={{
              border: `1px solid ${riskBand.border}`,
              background: riskBand.bg,
              padding: '8px 16px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  color: riskBand.color,
                  lineHeight: 1,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {score}
              </div>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ts-fg-muted)', marginTop: '2px', fontWeight: 600 }}>
                Risk
              </div>
            </div>
            <div
              style={{ width: 1, height: 28, background: 'var(--ts-border)' }}
            />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: riskBand.color }}>
                {riskBand.label}
              </div>
              <div style={{ fontSize: 9, color: 'var(--ts-fg-muted)', marginTop: '1px', fontWeight: 500 }}>of 100</div>
            </div>
          </div>
        )}

        {/* Days remaining */}
        {daysRemaining !== null && (
          <div
            className="flex items-center gap-2 rounded-[10px]"
            style={{
              border: '1px solid var(--ts-border)',
              background: 'var(--ts-bg-base)',
              padding: '8px 16px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ts-fg-muted)" strokeWidth="1.5" strokeLinecap="round">
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
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ts-fg-muted)', marginTop: '1px', fontWeight: 600 }}>
                Period Ends
              </div>
            </div>
          </div>
        )}

        <div style={{ width: 1, height: 32, background: 'var(--ts-border)', margin: '0 4px' }} />

        {/* Notification Bell */}
        <NotificationBell />

        {/* User avatar */}
        <button
          className="flex items-center justify-center rounded-full"
          style={{
            width: 36,
            height: 36,
            background: 'oklch(0.55 0.22 260 / 0.1)',
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
