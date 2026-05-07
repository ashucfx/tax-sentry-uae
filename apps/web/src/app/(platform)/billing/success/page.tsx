'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ShieldCheck, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

const MAX_POLL_ATTEMPTS = 12;

export default function BillingSuccessPage() {
  const router = useRouter();
  // Use a ref for the raw count so refetchInterval closure reads current value without stale capture
  const attemptsRef = useRef(0);
  const [attempts, setAttempts] = useState(0); // mirrors ref for render

  // Poll subscription status until it's ACTIVE (webhook may take a few seconds)
  const { data, isError } = useQuery({
    queryKey: ['billing-status-poll'],
    queryFn: async () => {
      const res = await api.get('/billing/status');
      return res.data.data;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.subscriptionStatus;
      // Stop polling once active or after max attempts (~60s total)
      if (status === 'ACTIVE' || attemptsRef.current >= MAX_POLL_ATTEMPTS) {
        return false;
      }
      return 5000;
    },
    enabled: true,
    retry: false,
  });

  useEffect(() => {
    attemptsRef.current += 1;
    setAttempts(attemptsRef.current);
  }, [data]);

  const isActive = data?.subscriptionStatus === 'ACTIVE';
  const isPolling = !isActive && attempts < 12;
  const hasTimedOut = !isActive && attempts >= 12;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-card border rounded-xl shadow-card-md p-8 text-center">
        {/* Icon */}
        <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center">
          {isActive ? (
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
              {isPolling ? (
                <span className="w-7 h-7 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
              ) : (
                <ShieldCheck className="w-7 h-7 text-blue-600" />
              )}
            </div>
          )}
        </div>

        {/* Heading */}
        {isActive ? (
          <>
            <h1 className="text-xl font-bold text-foreground">You&apos;re protected.</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Your subscription is active. TaxSentry is now monitoring your QFZP status.
            </p>
          </>
        ) : isPolling ? (
          <>
            <h1 className="text-xl font-bold text-foreground">Confirming your payment…</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Your payment was received. We&apos;re activating your subscription — this takes a few
              seconds.
            </p>
            <p className="text-xs text-muted-foreground mt-3 opacity-70">
              Attempt {attempts}/12
            </p>
          </>
        ) : hasTimedOut ? (
          <>
            <h1 className="text-xl font-bold text-amber-700">Payment received</h1>
            <p className="text-sm text-amber-600 mt-2">
              We're still processing your subscription. Usually this takes a few seconds, but can
              take up to 2 minutes.
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              If your dashboard doesn&apos;t reflect the change soon, please contact{' '}
              <a href="mailto:support@taxsentry.ae" className="text-primary hover:underline">
                support@taxsentry.ae
              </a>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-red-700">Error checking subscription</h1>
            <p className="text-sm text-red-600 mt-2">
              Unable to verify your subscription status. Your payment may still be processing.
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Please contact{' '}
              <a href="mailto:support@taxsentry.ae" className="text-primary hover:underline">
                support@taxsentry.ae
              </a>
              {' '}and we'll activate your account manually.
            </p>
          </>
        )}

        {/* Tier badge */}
        {data?.subscriptionTier && (
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy-900 text-white text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            {data.subscriptionTier} Plan · {data.subscriptionInterval === 'yearly' ? 'Annual' : 'Monthly'} billing
          </div>
        )}

        {/* Period end info */}
        {isActive && data?.currentPeriodEnd && (
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            Next renewal:{' '}
            {new Date(data.currentPeriodEnd).toLocaleDateString('en-AE', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        )}

        {/* CTA */}
        <div className="mt-6 space-y-2">
          {isActive && (
            <>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90"
              >
                Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => router.push('/billing')}
                className="w-full bg-muted text-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-muted/80"
              >
                View billing details
              </button>
            </>
          )}
          {(isPolling || hasTimedOut) && (
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-muted text-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-muted/80"
            >
              Go to Dashboard
            </button>
          )}
          {isError && !isActive && (
            <>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90"
              >
                Retry
              </button>
              <button
                onClick={() => router.push('/billing')}
                className="w-full bg-muted text-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-muted/80"
              >
                Go to Billing
              </button>
            </>
          )}
        </div>

        <p className="mt-5 text-[11px] text-muted-foreground">
          A receipt has been sent to your email by Dodo Payments.
        </p>
      </div>
    </div>
  );
}
