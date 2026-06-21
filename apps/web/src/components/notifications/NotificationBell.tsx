'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Bell, AlertTriangle, Info, AlertCircle, CheckCircle2, ChevronRight, Check } from 'lucide-react';

type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';

const SEVERITY_CONFIG: Record<AlertSeverity, { icon: React.ElementType; color: string; bg: string }> = {
  INFO:     { icon: Info,          color: 'var(--ts-blue-400)',  bg: 'oklch(0.55 0.22 260 / 0.12)' },
  WARNING:  { icon: AlertTriangle, color: 'var(--ts-amber-500)', bg: 'oklch(0.75 0.18 85 / 0.12)' },
  CRITICAL: { icon: AlertCircle,   color: 'var(--ts-red-400)',   bg: 'oklch(0.55 0.22 25 / 0.12)' },
  SUCCESS:  { icon: CheckCircle2,  color: 'var(--ts-green-500)', bg: 'oklch(0.70 0.20 155 / 0.12)' },
};

function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-AE', { day: 'numeric', month: 'short' });
}

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { data: alerts } = useQuery({
    queryKey: ['notification-alerts'],
    queryFn: () => api.get('/notifications/alerts').then((r) => r.data.data ?? r.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (alertId: string) =>
      api.patch(`/notifications/alerts/${alertId}/acknowledge`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-alerts'] });
    },
  });

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const alertsList: any[] = Array.isArray(alerts) ? alerts : (alerts?.alerts ?? alerts?.items ?? []);
  const unacknowledged = alertsList.filter((a: any) => a.acknowledgedAt === null || a.acknowledgedAt === undefined);
  const unreadCount = unacknowledged.length;
  const displayAlerts = alertsList.slice(0, 10);

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: 36,
          height: 36,
          background: isOpen ? 'oklch(0.55 0.22 260 / 0.08)' : 'var(--ts-bg-base)',
          border: `1px solid ${isOpen ? 'oklch(0.55 0.22 260 / 0.3)' : 'var(--ts-border)'}`,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell
          size={16}
          color={isOpen ? 'var(--ts-blue-400)' : 'var(--ts-fg-secondary)'}
          strokeWidth={1.5}
          style={{
            animation: unreadCount > 0 ? 'none' : undefined,
          }}
        />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-[9px] font-bold"
            style={{
              width: 18,
              height: 18,
              background: 'var(--ts-red-400)',
              color: 'white',
              border: '2px solid white',
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-11 z-50 rounded-2xl shadow-2xl overflow-hidden"
          style={{
            width: 360,
            background: 'var(--ts-bg-card)',
            border: '1px solid var(--ts-border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}
        >
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--ts-border-subtle)' }}
          >
            <div className="flex items-center gap-2">
              <Bell size={14} color="var(--ts-fg-secondary)" strokeWidth={1.5} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ts-fg-primary)' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ background: 'var(--ts-red-400)', color: 'white', lineHeight: 1 }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  unacknowledged.forEach((a: any) => acknowledgeMutation.mutate(a.id));
                }}
                style={{
                  fontSize: 11,
                  color: 'var(--ts-blue-400)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Alert list */}
          <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
            {displayAlerts.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={28} style={{ color: 'var(--ts-fg-muted)', margin: '0 auto 10px' }} strokeWidth={1} />
                <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>No notifications</p>
                <p style={{ fontSize: 12, color: 'var(--ts-fg-dimmer)' }}>You&apos;re all caught up</p>
              </div>
            ) : (
              displayAlerts.map((alert: any, idx: number) => {
                const severity: AlertSeverity =
                  (alert.severity as AlertSeverity) in SEVERITY_CONFIG
                    ? (alert.severity as AlertSeverity)
                    : 'INFO';
                const sc = SEVERITY_CONFIG[severity];
                const SeverityIcon = sc.icon;
                const isUnread = alert.acknowledgedAt === null || alert.acknowledgedAt === undefined;

                return (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 px-4 py-3"
                    style={{
                      borderBottom: idx < displayAlerts.length - 1 ? '1px solid var(--ts-border-subtle)' : 'none',
                      background: isUnread ? 'oklch(0.55 0.22 260 / 0.03)' : 'transparent',
                    }}
                  >
                    {/* Severity icon */}
                    <div
                      className="flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"
                      style={{ width: 30, height: 30, background: sc.bg }}
                    >
                      <SeverityIcon size={14} color={sc.color} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: isUnread ? 600 : 500,
                            color: 'var(--ts-fg-primary)',
                            margin: 0,
                            lineHeight: 1.4,
                          }}
                        >
                          {alert.title}
                        </p>
                        {isUnread && (
                          <span
                            className="flex-shrink-0 rounded-full"
                            style={{ width: 6, height: 6, background: 'var(--ts-blue-400)', marginTop: 5 }}
                          />
                        )}
                      </div>
                      {alert.message && (
                        <p
                          style={{
                            fontSize: 11,
                            color: 'var(--ts-fg-muted)',
                            margin: '2px 0 0',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {alert.message}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span style={{ fontSize: 10, color: 'var(--ts-fg-muted)' }}>
                          {formatTimeAgo(alert.triggeredAt ?? alert.createdAt)}
                        </span>
                        {isUnread && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              acknowledgeMutation.mutate(alert.id);
                            }}
                            disabled={acknowledgeMutation.isPending}
                            className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold"
                            style={{
                              background: 'var(--ts-bg-elevated)',
                              border: '1px solid var(--ts-border)',
                              color: 'var(--ts-fg-secondary)',
                              cursor: 'pointer',
                            }}
                          >
                            <Check size={9} />
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div
            className="px-4 py-3"
            style={{ borderTop: '1px solid var(--ts-border-subtle)' }}
          >
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/alerts');
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold"
              style={{
                background: 'var(--ts-bg-elevated)',
                border: '1px solid var(--ts-border)',
                color: 'var(--ts-fg-secondary)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'oklch(0.55 0.22 260 / 0.08)';
                (e.currentTarget as HTMLElement).style.color = 'var(--ts-blue-400)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--ts-bg-elevated)';
                (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-secondary)';
              }}
            >
              View all alerts
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
