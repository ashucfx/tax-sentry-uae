'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Clock, XCircle, Upload, ExternalLink } from 'lucide-react';
import Link from 'next/link';

type DocStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'MISSING';

const STATUS_CONFIG: Record<
  DocStatus,
  { icon: React.ElementType; dotCls: string; labelCls: string; label: string }
> = {
  ACTIVE:        { icon: CheckCircle2, dotCls: 'text-emerald-500', labelCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',   label: 'Valid' },
  EXPIRING_SOON: { icon: Clock,        dotCls: 'text-amber-500',   labelCls: 'bg-amber-50  text-amber-700  border-amber-200',       label: 'Expiring' },
  EXPIRED:       { icon: XCircle,      dotCls: 'text-red-500',     labelCls: 'bg-red-50    text-red-700    border-red-200',         label: 'Expired' },
  MISSING:       { icon: AlertCircle,  dotCls: 'text-red-400',     labelCls: 'bg-red-50    text-red-700    border-red-200',         label: 'Missing' },
};

export function SubstanceHealthRow() {
  const { data, isLoading } = useQuery({
    queryKey: ['substance-checklist'],
    queryFn: () => api.get('/substance/checklist').then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <section>
        <SectionHeader pct={null} />
        <div className="bg-card rounded-lg border h-64 animate-pulse shadow-card" />
      </section>
    );
  }

  const checklist: Array<{
    docType: string;
    label: string;
    status: DocStatus;
    document: { fileName: string; expiresAt: string } | null;
  }> = data?.checklist ?? [];

  const completionPct: number = data?.completionPct ?? 0;
  const expiringCount = checklist.filter((d) => d.status === 'EXPIRING_SOON').length;
  const criticalCount = checklist.filter((d) => d.status === 'MISSING' || d.status === 'EXPIRED').length;

  return (
    <section>
      <SectionHeader pct={completionPct} />

      <div className="bg-card rounded-lg border shadow-card p-5">
        {/* Compact progress bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 bg-muted rounded-full h-1.5">
            <div
              className={cn(
                'h-1.5 rounded-full transition-all',
                completionPct === 100 ? 'bg-emerald-500' : completionPct >= 70 ? 'bg-amber-400' : 'bg-red-400',
              )}
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-foreground w-10 text-right">{completionPct}%</span>
        </div>

        {/* Callouts */}
        {expiringCount > 0 && (
          <div className="mb-3 flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            {expiringCount} document{expiringCount > 1 ? 's' : ''} expiring within 30 days — renew to avoid breach risk
          </div>
        )}

        {/* Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {checklist.map((item) => {
            const config = STATUS_CONFIG[item.status];
            const Icon = config.icon;
            return (
              <div
                key={item.docType}
                className="flex items-center gap-2.5 p-2.5 rounded-md bg-background border border-border/60"
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0', config.dotCls)} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.label}</p>
                  {item.document?.expiresAt && (
                    <p className="text-xs text-muted-foreground">
                      Expires {new Date(item.document.expiresAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded border', config.labelCls)}>
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        {criticalCount > 0 ? (
          <div className="mt-4">
            <Link
              href="/substance"
              className="flex items-center justify-center gap-2 w-full text-xs font-semibold bg-red-600 text-white px-4 py-2.5 rounded-md hover:bg-red-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload {criticalCount} missing document{criticalCount > 1 ? 's' : ''}
            </Link>
          </div>
        ) : (
          <div className="mt-4 flex justify-end">
            <Link
              href="/substance"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Manage all documents <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function SectionHeader({ pct }: { pct: number | null }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h2 className="text-base font-semibold text-foreground">Substance Requirements</h2>
        <p className="text-xs text-muted-foreground mt-0.5">FTA-required documentation status</p>
      </div>
      {pct !== null && (
        <span className={cn(
          'text-xs font-bold px-2 py-1 rounded border',
          pct === 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          pct >= 70 ? 'bg-amber-50 text-amber-700 border-amber-200' :
          'bg-red-50 text-red-700 border-red-200'
        )}>
          {pct}% complete
        </span>
      )}
    </div>
  );
}
