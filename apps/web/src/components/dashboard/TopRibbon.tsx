'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { ShieldCheck, AlertTriangle, AlertOctagon, Clock, Building2, RefreshCw } from 'lucide-react';
import { useOrganization } from '@clerk/nextjs';

type StatusBadge = 'SAFE' | 'AT_RISK' | 'BREACH_IMMINENT' | 'BREACHED';

const STATUS_CONFIG: Record<
  StatusBadge,
  {
    label: string;
    sub: string;
    outerBg: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dotColor: string;
    icon: React.ElementType;
    pulse: boolean;
  }
> = {
  SAFE: {
    label: 'QFZP Protected',
    sub: '0% corporate tax status is active',
    outerBg: 'bg-white border-b border-border',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    dotColor: 'text-emerald-500',
    icon: ShieldCheck,
    pulse: false,
  },
  AT_RISK: {
    label: 'QFZP At Risk',
    sub: 'De-minimis threshold above 60% — review NQI transactions',
    outerBg: 'bg-amber-50 border-b border-amber-200',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
    dotColor: 'text-amber-500',
    icon: AlertTriangle,
    pulse: false,
  },
  BREACH_IMMINENT: {
    label: 'Breach Imminent',
    sub: 'NQI threshold above 90% — immediate remediation required',
    outerBg: 'bg-red-50 border-b border-red-300',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-800',
    badgeBorder: 'border-red-300',
    dotColor: 'text-red-500',
    icon: AlertOctagon,
    pulse: true,
  },
  BREACHED: {
    label: 'QFZP STATUS BREACHED',
    sub: 'QFZP status lost — contact your tax advisor immediately',
    outerBg: 'bg-red-700 border-b border-red-800',
    badgeBg: 'bg-red-600',
    badgeText: 'text-white',
    badgeBorder: 'border-red-500',
    dotColor: 'text-red-200',
    icon: AlertOctagon,
    pulse: true,
  },
};

const BAND_STYLES = {
  GREEN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  AMBER: 'bg-amber-50  text-amber-700  border-amber-200',
  RED:   'bg-red-50    text-red-700    border-red-200',
};

export function TopRibbon() {
  const { organization } = useOrganization();

  const { data: dmData, dataUpdatedAt: dmUpdated } = useQuery({
    queryKey: ['deminimis-status'],
    queryFn: () => api.get('/deminimis/status').then((r) => r.data),
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: riskData } = useQuery({
    queryKey: ['risk-score'],
    queryFn: () => api.get('/risk/score').then((r) => r.data),
    refetchInterval: 5 * 60 * 1000,
  });

  const statusBadge: StatusBadge = dmData?.data?.deMinimis?.statusBadge ?? 'SAFE';
  const config = STATUS_CONFIG[statusBadge];
  const Icon = config.icon;

  const score: number | null = riskData?.data?.total ?? null;
  const band: 'GREEN' | 'AMBER' | 'RED' = riskData?.data?.band ?? 'GREEN';
  const daysRemaining: number | null = dmData?.data?.period?.daysRemaining ?? null;
  const isBreached = statusBadge === 'BREACHED';

  const lastSynced = dmUpdated
    ? new Date(dmUpdated).toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null;

  return (
    <header className={cn('sticky top-0 z-30', config.outerBg)}>
      <div className="max-w-full px-6 py-2.5">
        <div className="flex items-center justify-between gap-4">

          {/* Left: Org + Status badge */}
          <div className="flex items-center gap-3 min-w-0">
            {organization?.name && (
              <div className={cn(
                'flex items-center gap-1.5 text-sm border-r pr-3 mr-0 shrink-0',
                isBreached ? 'text-red-200 border-red-600' : 'text-muted-foreground border-border',
              )}>
                <Building2 className="w-3.5 h-3.5" />
                <span className="font-medium truncate max-w-[160px]">{organization.name}</span>
              </div>
            )}

            {/* Status badge with pulsing dot */}
            <div
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide uppercase',
                config.badgeBg,
                config.badgeText,
                config.badgeBorder,
              )}
            >
              {config.pulse ? (
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className={cn(
                    'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                    isBreached ? 'bg-red-300' : 'bg-red-400',
                  )} />
                  <span className={cn(
                    'relative inline-flex rounded-full h-2 w-2',
                    isBreached ? 'bg-red-200' : 'bg-red-500',
                  )} />
                </span>
              ) : (
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              <span>{config.label}</span>
            </div>

            <span className={cn(
              'text-xs hidden lg:block',
              isBreached ? 'text-red-200' : 'text-muted-foreground',
            )}>
              {config.sub}
            </span>
          </div>

          {/* Right: Metrics row */}
          <div className="flex items-center gap-4 shrink-0">

            {/* Days remaining */}
            {daysRemaining !== null && (
              <div className={cn(
                'flex items-center gap-1.5 text-xs',
                isBreached ? 'text-red-200' : 'text-muted-foreground',
              )}>
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  <strong className={isBreached ? 'text-red-100' : 'text-foreground'}>
                    {daysRemaining}
                  </strong>
                  {' '}days to period end
                </span>
              </div>
            )}

            {/* Risk score chip */}
            {score !== null && (
              <div
                className={cn(
                  'flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-bold',
                  BAND_STYLES[band],
                )}
                title="Risk score: 85–100 = Protected · 60–84 = At Risk · <60 = Critical"
              >
                <span className="font-normal opacity-70">Risk&nbsp;</span>
                <span className="tabular-nums">{score}</span>
                <span className="font-normal opacity-70">/100</span>
              </div>
            )}

            {/* Last synced */}
            {lastSynced && (
              <span className={cn(
                'text-xs hidden xl:flex items-center gap-1',
                isBreached ? 'text-red-300' : 'text-muted-foreground',
              )}>
                <RefreshCw className="w-3 h-3" />
                Synced {lastSynced}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
