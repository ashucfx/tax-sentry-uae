'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Severity = 'RED' | 'AMBER' | 'INFO';

const SEVERITY: Record<Severity, { icon: React.ElementType; cls: string; label: string }> = {
  RED: { icon: AlertOctagon, cls: 'bg-red-50 text-red-800 border-red-200', label: 'Critical' },
  AMBER: { icon: AlertTriangle, cls: 'bg-amber-50 text-amber-800 border-amber-200', label: 'Warning' },
  INFO: { icon: Info, cls: 'bg-blue-50 text-blue-800 border-blue-200', label: 'Notice' },
};

export default function AlertsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['alerts-page'],
    queryFn: () => api.get('/alerts?limit=50').then((r) => r.data.data),
  });

  const alerts = data?.alerts ?? [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div>
        <h1 className="text-xl font-bold text-foreground">Alerts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Active and recent compliance alerts for your organization.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          <div className="h-40 rounded-lg border bg-card animate-pulse" />
        ) : alerts.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center shadow-card">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
            <p className="mt-3 text-sm font-semibold text-foreground">No alerts found</p>
            <p className="mt-1 text-sm text-muted-foreground">TaxSentry will list threshold, document, and risk alerts here.</p>
          </div>
        ) : (
          alerts.map((alert: any) => {
            const config = SEVERITY[alert.severity as Severity] ?? SEVERITY.INFO;
            const Icon = config.icon;
            return (
              <article key={alert.id} className="rounded-lg border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-semibold', config.cls)}>
                      <Icon className="h-3.5 w-3.5" />
                      {config.label}
                    </span>
                    <h2 className="mt-3 text-sm font-semibold text-foreground">{alert.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{alert.message}</p>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true })}
                  </p>
                </div>
              </article>
            );
          })
        )}
      </div>
    </main>
  );
}
