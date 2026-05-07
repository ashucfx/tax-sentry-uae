'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { AlertOctagon, AlertTriangle, Info, CheckCircle2, X, ExternalLink, BellOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

type Severity = 'RED' | 'AMBER' | 'INFO';

const SEVERITY_CONFIG: Record<
  Severity,
  { icon: React.ElementType; color: string; bg: string; border: string; label: string }
> = {
  RED: {
    icon: AlertOctagon,
    color: 'var(--ts-red-500)',
    bg: 'oklch(0.62 0.24 25 / 0.08)',
    border: 'oklch(0.62 0.24 25 / 0.25)',
    label: 'Critical',
  },
  AMBER: {
    icon: AlertTriangle,
    color: 'var(--ts-amber-500)',
    bg: 'oklch(0.80 0.18 85 / 0.08)',
    border: 'oklch(0.80 0.18 85 / 0.25)',
    label: 'Warning',
  },
  INFO: {
    icon: Info,
    color: 'var(--ts-blue-400)',
    bg: 'oklch(0.55 0.22 260 / 0.08)',
    border: 'oklch(0.55 0.22 260 / 0.25)',
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
}

function AlertCard({ alert, onAck }: { alert: Alert; onAck?: () => void }) {
  const config = SEVERITY_CONFIG[alert.severity];
  const Icon = config.icon;

  return (
    <div
      className="flex gap-2.5 rounded-[9px]"
      style={{
        border: `1px solid ${config.border}`,
        background: config.bg,
        padding: '12px 14px',
      }}
    >
      <Icon
        size={16}
        color={config.color}
        strokeWidth={2}
        style={{ flexShrink: 0, marginTop: 1 }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts-fg-primary)' }}>
            {alert.title}
          </span>
          <button
            onClick={onAck}
            disabled={alert.severity === 'RED'}
            className="flex-shrink-0 rounded"
            style={{
              background: 'none',
              border: 'none',
              cursor: alert.severity === 'RED' ? 'default' : 'pointer',
              color: 'oklch(0.45 0 0)',
              padding: 2,
              opacity: alert.severity === 'RED' ? 0.4 : 1,
            }}
            title="Dismiss"
          >
            <X size={12} />
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0, marginBottom: 8, lineHeight: 1.4 }}>
          {alert.message}
        </p>
        <span style={{ fontSize: 10, color: 'oklch(0.40 0 0)' }}>
          {formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
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
  const unread = alerts.filter((a) => a.severity !== 'INFO' || !a.acknowledgedAt).length;

  if (isLoading) {
    return (
      <section>
        <SectionHeader unread={null} />
        <div
          className="animate-pulse rounded-xl"
          style={{ height: 160, background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)' }}
        />
      </section>
    );
  }

  return (
    <section>
      <SectionHeader unread={alerts.length > 0 ? unread : null} />

      <div
        className="premium-card"
        style={{ padding: 24 }}
      >
        {alerts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2.5">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAck={alert.severity !== 'RED' ? () => acknowledge.mutate(alert.id) : undefined}
              />
            ))}
            {alerts.length >= 5 && (
              <Link
                href="/alerts"
                className="flex items-center justify-center gap-1 pt-1"
                style={{ fontSize: 12, fontWeight: 500, color: 'var(--ts-blue-400)' }}
              >
                View all alerts <ExternalLink size={12} />
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function SectionHeader({ unread }: { unread: number | null }) {
  return (
    <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0, marginBottom: 2 }}>
          Action Required
        </h2>
        <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0 }}>
          {unread != null && unread > 0 ? `${unread} items need your attention` : 'Active compliance alerts'}
        </p>
      </div>
      {unread != null && unread > 0 && (
        <span
          className="flex items-center justify-center rounded-full text-[10px] font-bold"
          style={{
            width: 22,
            height: 22,
            background: 'var(--ts-red-500)',
            color: 'white',
          }}
        >
          {unread}
        </span>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-4">
      <div
        className="mx-auto mb-3 flex items-center justify-center rounded-full"
        style={{
          width: 36,
          height: 36,
          background: 'oklch(0.70 0.20 155 / 0.1)',
          border: '1px solid oklch(0.70 0.20 155 / 0.25)',
        }}
      >
        <CheckCircle2 size={18} color="var(--ts-green-500)" />
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts-fg-primary)', marginBottom: 4 }}>
        No active alerts
      </p>
      <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', maxWidth: 200, margin: '0 auto', lineHeight: 1.5 }}>
        QFZP status is protected. TaxSentry monitors thresholds daily.
      </p>
      <p
        className="flex items-center justify-center gap-1 mt-3"
        style={{ fontSize: 11, color: 'oklch(0.40 0 0)' }}
      >
        <BellOff size={12} /> Next check at 08:00 UAE time
      </p>
    </div>
  );
}
