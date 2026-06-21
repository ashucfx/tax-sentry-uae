'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  X,
  AlertCircle,
} from 'lucide-react';
import { InvoicesTable } from '@/components/billing/InvoicesTable';
import { ChangePlanModal } from '@/components/billing/ChangePlanModal';

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

type CancelMode = 'period_end' | 'immediately';

function CancelSubscriptionModal({
  periodEnd,
  onClose,
  onSuccess,
}: {
  periodEnd: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<CancelMode>('period_end');
  const [error, setError] = useState('');

  const cancelMutation = useMutation({
    mutationFn: () =>
      api.post('/billing/subscription/cancel', { immediately: mode === 'immediately' }).then((r) => r.data),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? 'Failed to cancel subscription. Please try again.');
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div
        className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)' }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex items-center justify-center rounded-full"
          style={{ width: 28, height: 28, background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)', cursor: 'pointer' }}
        >
          <X size={14} color="var(--ts-fg-muted)" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 40, height: 40, background: 'oklch(0.55 0.22 25 / 0.12)' }}
          >
            <AlertCircle size={20} color="var(--ts-red-400)" />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}>
              Cancel Subscription
            </h2>
            <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0 }}>
              This action cannot be easily undone
            </p>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--ts-fg-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
          Are you sure you want to cancel your subscription?
          {periodEnd && (
            <>
              {' '}Your access continues until{' '}
              <span style={{ fontWeight: 600, color: 'var(--ts-fg-primary)' }}>{periodEnd}</span>.
            </>
          )}{' '}
          After that, you&apos;ll lose access to all paid features.
        </p>

        {/* Mode selection */}
        <div className="space-y-2 mb-5">
          {([
            {
              value: 'period_end' as CancelMode,
              title: 'Cancel at Period End',
              desc: periodEnd ? `Access continues until ${periodEnd}` : 'Access continues until end of billing period',
            },
            {
              value: 'immediately' as CancelMode,
              title: 'Cancel Immediately',
              desc: 'Lose access right now — no refunds',
            },
          ] as const).map(({ value, title, desc }) => (
            <label
              key={value}
              className="flex items-start gap-3 rounded-xl p-3 cursor-pointer"
              style={{
                background: mode === value ? 'oklch(0.55 0.22 25 / 0.06)' : 'var(--ts-bg-elevated)',
                border: `1px solid ${mode === value ? 'oklch(0.55 0.22 25 / 0.35)' : 'var(--ts-border)'}`,
              }}
            >
              <input
                type="radio"
                name="cancel-mode"
                value={value}
                checked={mode === value}
                onChange={() => setMode(value)}
                className="mt-0.5 flex-shrink-0"
              />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>{title}</p>
                <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0 }}>{desc}</p>
              </div>
            </label>
          ))}
        </div>

        {error && (
          <p style={{ fontSize: 12, color: 'var(--ts-red-400)', marginBottom: 12 }}>{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold"
            style={{
              background: 'var(--ts-bg-elevated)',
              border: '1px solid var(--ts-border)',
              color: 'var(--ts-fg-secondary)',
              cursor: 'pointer',
            }}
          >
            Keep Subscription
          </button>
          <button
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="flex-1 rounded-xl py-2.5 text-[13px] font-bold disabled:opacity-50"
            style={{
              background: 'var(--ts-red-400)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            {cancelMutation.isPending ? 'Cancelling…' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState('');

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

  const reactivateMutation = useMutation({
    mutationFn: () => api.delete('/billing/subscription/cancel').then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-status'] });
      setCancelSuccess('Subscription reactivated. You will be billed at the end of your current period.');
      setTimeout(() => setCancelSuccess(''), 5000);
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
  const canCancel = status === 'ACTIVE' && !isCancelPending;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Subscription & Billing</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your plan, payment method, and invoices
        </p>
      </div>

      {/* Cancel success toast */}
      {cancelSuccess && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: 'oklch(0.70 0.20 155 / 0.12)',
            border: '1px solid oklch(0.70 0.20 155 / 0.3)',
          }}
        >
          <CheckCircle2 size={16} color="var(--ts-green-500)" className="flex-shrink-0" />
          <p style={{ fontSize: 13, color: 'var(--ts-green-500)', margin: 0 }}>{cancelSuccess}</p>
        </div>
      )}

      {/* Scheduled cancellation banner */}
      {isCancelPending && (
        <div
          className="flex items-center justify-between gap-4 rounded-xl px-4 py-3"
          style={{
            background: 'oklch(0.80 0.18 85 / 0.1)',
            border: '1px solid oklch(0.80 0.18 85 / 0.3)',
          }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} color="var(--ts-amber-500)" className="flex-shrink-0" />
            <p style={{ fontSize: 13, color: 'var(--ts-fg-secondary)', margin: 0 }}>
              Your subscription is scheduled to cancel on{' '}
              <span style={{ fontWeight: 600, color: 'var(--ts-fg-primary)' }}>{periodEnd ?? '—'}</span>.
              You retain access until then.
            </p>
          </div>
          <button
            onClick={() => reactivateMutation.mutate()}
            disabled={reactivateMutation.isPending}
            className="flex-shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-semibold disabled:opacity-50"
            style={{
              background: 'var(--ts-amber-500)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {reactivateMutation.isPending ? 'Reactivating…' : 'Reactivate'}
          </button>
        </div>
      )}

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

        {/* Change Plan (Active subscriptions only) */}
        {status === 'ACTIVE' && (
          <button
            onClick={() => setIsPlanModalOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted"
          >
            <span className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
              Change subscription plan
            </span>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Cancel subscription (Active, not pending cancel) */}
        {canCancel && (
          <button
            onClick={() => setIsCancelModalOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium"
            style={{
              background: 'oklch(0.55 0.22 25 / 0.05)',
              borderColor: 'oklch(0.55 0.22 25 / 0.25)',
              color: 'var(--ts-red-400)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'oklch(0.55 0.22 25 / 0.10)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'oklch(0.55 0.22 25 / 0.05)';
            }}
          >
            <span className="flex items-center gap-2.5">
              <XCircle className="w-4 h-4" />
              Cancel subscription
            </span>
          </button>
        )}
      </div>

      {/* Invoice History Native UI */}
      <InvoicesTable />

      {/* Info footer */}
      <p className="text-[11px] text-muted-foreground text-center">
        Payments processed by{' '}
        <span className="font-medium text-foreground">Dodo Payments</span> (Merchant of Record) ·
        AED invoicing · No card data stored by TaxSentry
      </p>

      {/* Modals */}
      <ChangePlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        currentTier={data?.subscriptionTier}
        currentInterval={data?.subscriptionInterval}
      />

      {isCancelModalOpen && (
        <CancelSubscriptionModal
          periodEnd={periodEnd}
          onClose={() => setIsCancelModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['billing-status'] });
            setCancelSuccess('Subscription cancelled. Your access continues until the end of the billing period.');
            setTimeout(() => setCancelSuccess(''), 6000);
          }}
        />
      )}
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
