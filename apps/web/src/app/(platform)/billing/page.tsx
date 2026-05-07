'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import {
  ShieldCheck,
  CreditCard,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pause,
  RefreshCw,
} from 'lucide-react';

type SubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'PAUSED';

const STATUS_CONFIG: Record<
  SubscriptionStatus,
  { label: string; icon: React.ElementType; cls: string; badgeCls: string }
> = {
  TRIALING:   { label: 'Free Trial',   icon: Clock,         cls: 'bg-blue-50 border-blue-200',   badgeCls: 'bg-blue-100 text-blue-800 border-blue-200' },
  ACTIVE:     { label: 'Active',       icon: CheckCircle2,  cls: 'bg-emerald-50 border-emerald-200', badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  PAST_DUE:   { label: 'Past Due',     icon: AlertTriangle, cls: 'bg-amber-50 border-amber-200', badgeCls: 'bg-amber-100 text-amber-800 border-amber-200' },
  CANCELLED:  { label: 'Cancelled',    icon: XCircle,       cls: 'bg-muted border-border',        badgeCls: 'bg-muted text-muted-foreground border-border' },
  EXPIRED:    { label: 'Expired',      icon: XCircle,       cls: 'bg-red-50 border-red-200',      badgeCls: 'bg-red-100 text-red-800 border-red-200' },
  PAUSED:     { label: 'Paused',       icon: Pause,         cls: 'bg-muted border-border',        badgeCls: 'bg-muted text-muted-foreground border-border' },
};

const TIER_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  GROWTH: 'Growth',
  ENTERPRISE: 'Enterprise',
};

export default function BillingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['billing-status'],
    queryFn: () => api.get('/billing/status').then((r) => r.data.data),
    staleTime: 30_000,
  });

  const portalMutation = useMutation({
    mutationFn: () => api.get('/billing/portal').then((r) => r.data.data),
    onSuccess: (d) => {
      window.location.href = d.url;
    },
  });

  if (isLoading) return <BillingPageSkeleton />;

  const status: SubscriptionStatus = data?.subscriptionStatus ?? 'TRIALING';
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  const periodEnd = data?.currentPeriodEnd
    ? new Date(data.currentPeriodEnd).toLocaleDateString('en-AE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const isCancelPending = data?.cancelAtPeriodEnd && status === 'ACTIVE';
  const needsAction = status === 'PAST_DUE' || status === 'EXPIRED';

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Subscription & Billing</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your plan, payment method, and invoices
        </p>
      </div>

      {/* Current plan card */}
      <div className={cn('rounded-xl border p-6 space-y-4', config.cls)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">
                TaxSentry {TIER_LABELS[data?.subscriptionTier] ?? 'Starter'}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {data?.subscriptionInterval === 'yearly' ? 'Annual billing' : 'Monthly billing'}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <span
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold flex-shrink-0',
              config.badgeCls,
            )}
          >
            <StatusIcon className="w-3 h-3" />
            {config.label}
          </span>
        </div>

        {/* Renewal / expiry line */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          {isCancelPending
            ? `Access ends on ${periodEnd} (cancelled)`
            : status === 'ACTIVE' || status === 'TRIALING'
            ? `Renews on ${periodEnd ?? '—'}`
            : `${config.label} since ${periodEnd ?? '—'}`}
        </div>

        {/* Grace period warning */}
        {status === 'PAST_DUE' && (
          <div className="flex items-start gap-2.5 p-3 bg-amber-100 border border-amber-200 rounded-lg text-xs text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              Your last payment failed. Update your payment method within the 7-day grace period
              to avoid losing access.
            </span>
          </div>
        )}

        {/* Expired warning */}
        {status === 'EXPIRED' && (
          <div className="flex items-start gap-2.5 p-3 bg-red-100 border border-red-200 rounded-lg text-xs text-red-800">
            <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              Your subscription has expired. Renew now to restore access to your compliance dashboard.
            </span>
          </div>
        )}

        {/* Days remaining for trial */}
        {status === 'TRIALING' && data?.daysUntilExpiry !== null && (
          <div className="flex items-center gap-2 p-3 bg-blue-100 border border-blue-200 rounded-lg text-xs text-blue-800">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            {data.daysUntilExpiry > 0
              ? `${data.daysUntilExpiry} days remaining in your free trial`
              : 'Your trial has ended — please subscribe to continue'}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-card rounded-xl border shadow-card p-6 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Billing Actions</h2>

        {/* Manage via portal */}
        <button
          onClick={() => portalMutation.mutate()}
          disabled={portalMutation.isPending || !data?.dodoCustomerId}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium',
            data?.dodoCustomerId
              ? 'bg-card hover:bg-muted border-border text-foreground'
              : 'bg-muted border-border text-muted-foreground cursor-not-allowed',
          )}
        >
          <span className="flex items-center gap-2.5">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            {needsAction ? 'Update payment method' : 'Manage plan, invoices & payment method'}
          </span>
          {portalMutation.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Upgrade / choose plan */}
        {(status === 'TRIALING' || status === 'EXPIRED') && (
          <a
            href="/pricing"
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-primary/30 bg-blue-50 text-sm font-medium text-primary hover:bg-blue-100"
          >
            <span className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4" />
              {status === 'EXPIRED' ? 'Reactivate subscription' : 'View all plans'}
            </span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Info footer */}
      <p className="text-[11px] text-muted-foreground text-center">
        Payments processed by{' '}
        <span className="font-medium text-foreground">Dodo Payments</span> (Merchant of Record) ·
        AED invoicing · No card data stored by TaxSentry
      </p>
    </div>
  );
}

function BillingPageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6 animate-pulse">
      <div className="space-y-1.5">
        <div className="h-5 bg-muted rounded w-48" />
        <div className="h-3.5 bg-muted rounded w-72" />
      </div>
      <div className="bg-card rounded-xl border p-6 h-36" />
      <div className="bg-card rounded-xl border p-6 h-28" />
    </div>
  );
}
