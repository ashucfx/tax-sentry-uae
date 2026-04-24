'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { AlertOctagon, AlertTriangle, Info, CheckCircle, X, BellOff, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

type Severity = 'RED' | 'AMBER' | 'INFO';

const SEVERITY_CONFIG: Record<
  Severity,
  {
    icon: React.ElementType;
    cardCls: string;
    leftBorder: string;
    iconCls: string;
    titleCls: string;
    timeCls: string;
    chipCls: string;
    label: string;
  }
> = {
  RED: {
    icon: AlertOctagon,
    cardCls: 'bg-red-50/70 border-red-200',
    leftBorder: 'border-l-red-500',
    iconCls: 'text-red-600',
    titleCls: 'text-red-900',
    timeCls: 'text-red-400',
    chipCls: 'bg-red-100 text-red-800 border-red-200',
    label: 'Critical',
  },
  AMBER: {
    icon: AlertTriangle,
    cardCls: 'bg-amber-50/60 border-amber-200',
    leftBorder: 'border-l-amber-400',
    iconCls: 'text-amber-600',
    titleCls: 'text-amber-900',
    timeCls: 'text-amber-400',
    chipCls: 'bg-amber-100 text-amber-800 border-amber-200',
    label: 'Warning',
  },
  INFO: {
    icon: Info,
    cardCls: 'bg-card border-border',
    leftBorder: 'border-l-blue-400',
    iconCls: 'text-primary',
    titleCls: 'text-foreground',
    timeCls: 'text-muted-foreground',
    chipCls: 'bg-blue-50 text-blue-700 border-blue-200',
    label: 'Notice',
  },
};

interface Alert {
  id: string;
  severity: Severity;
  title: string;
  message: string;
  triggeredAt: string;
  acknowledgedAt?: string | null;
  snoozedUntil?: string | null;
}

export function ActionFeedRow() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['alerts-active'],
    queryFn: () =>
      api
        .get('/alerts?isResolved=false&limit=10&orderBy=severity')
        .then((r) => r.data.data),
    refetchInterval: 2 * 60 * 1000,
  });

  const acknowledge = useMutation({
    mutationFn: (alertId: string) => api.patch(`/alerts/${alertId}/acknowledge`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts-active'] }),
  });

  const alerts: Alert[] = data?.alerts ?? [];
  const redAlerts = alerts.filter((a) => a.severity === 'RED');
  const otherAlerts = alerts.filter((a) => a.severity !== 'RED');

  if (isLoading) {
    return (
      <section>
        <SectionHeader count={null} hasRed={false} />
        <div className="bg-card rounded-lg border shadow-card h-40 animate-pulse" />
      </section>
    );
  }

  return (
    <section>
      <SectionHeader count={alerts.length || null} hasRed={redAlerts.length > 0} />

      {alerts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2.5">
          {redAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onAck={undefined} />
          ))}
          {otherAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAck={() => acknowledge.mutate(alert.id)}
            />
          ))}
          {alerts.length >= 5 && (
            <Link
              href="/alerts"
              className="flex items-center justify-center gap-1 text-xs text-primary hover:text-primary/80 font-medium pt-1"
            >
              View all alerts <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

function AlertCard({ alert, onAck }: { alert: Alert; onAck?: () => void }) {
  const config = SEVERITY_CONFIG[alert.severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-lg border border-l-4 p-3.5 flex items-start gap-3 shadow-card',
        config.cardCls,
        config.leftBorder,
      )}
    >
      <div className="mt-0.5 flex-shrink-0">
        <Icon className={cn('w-3.5 h-3.5', config.iconCls)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className={cn(
                'text-xs font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border',
              config.chipCls,
            )}
          >
            {config.label}
          </span>
        </div>
        <p className={cn('text-xs font-semibold leading-snug', config.titleCls)}>
          {alert.title}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
          {alert.message}
        </p>
        <p className={cn('text-xs mt-1', config.timeCls)}>
          {formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true })}
        </p>
      </div>

      <div className="flex-shrink-0 flex items-center">
        {alert.severity === 'RED' ? (
          <span className="text-xs text-red-500 font-semibold uppercase tracking-wide">
            Cannot dismiss
          </span>
        ) : (
          <button
            onClick={onAck}
            className="p-1.5 rounded-md hover:bg-black/5 group"
            title="Acknowledge — mark as seen"
          >
            <X className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ count, hasRed }: { count: number | null; hasRed: boolean }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          Action Required
          {count !== null && count > 0 && (
            <span
              className={cn(
                'inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full',
                hasRed ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-700 border border-amber-200',
              )}
            >
              {count}
            </span>
          )}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">Active compliance alerts</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-card rounded-lg border shadow-card p-6 text-center">
      <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
        <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
      </div>
      <p className="text-sm font-semibold text-foreground">No active alerts</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto leading-relaxed">
        QFZP status is protected. TaxSentry monitors thresholds daily.
      </p>
      <p className="text-xs text-muted-foreground/70 mt-3 flex items-center justify-center gap-1">
        <BellOff className="w-3 h-3" /> Next check at 08:00 UAE time
      </p>
    </div>
  );
}
