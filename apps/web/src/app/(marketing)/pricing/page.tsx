'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Lock,
  Zap,
  Building2,
  Minus,
} from 'lucide-react';

// ─── Plan definitions ─────────────────────────────────────────────────────────

const PLANS = [
  {
    tier: 'STARTER' as const,
    name: 'Starter',
    tagline: 'For single Free Zone entities',
    priceMonthly: 299,
    priceYearly: 2990,
    highlight: false,
    features: [
      { text: '1 Free Zone organization', included: true },
      { text: 'De-minimis threshold monitoring', included: true },
      { text: 'Risk score dashboard', included: true },
      { text: 'Manual CSV upload', included: true },
      { text: 'Email alerts', included: true },
      { text: 'Substance document vault', included: true },
      { text: 'Basic compliance report (PDF)', included: true },
      { text: 'Accounting integrations (Zoho/Xero)', included: false },
      { text: 'Advanced analytics', included: false },
      { text: 'Multi-entity management', included: false },
    ],
    cta: 'Start Free Trial',
    badge: null,
  },
  {
    tier: 'GROWTH' as const,
    name: 'Growth',
    tagline: 'For CFOs managing multiple entities',
    priceMonthly: 799,
    priceYearly: 7990,
    highlight: true,
    features: [
      { text: 'Up to 3 Free Zone organizations', included: true },
      { text: 'De-minimis threshold monitoring', included: true },
      { text: 'Risk score dashboard', included: true },
      { text: 'Manual CSV upload', included: true },
      { text: 'Priority email alerts', included: true },
      { text: 'Substance document vault', included: true },
      { text: 'Full compliance report (PDF)', included: true },
      { text: 'Accounting integrations (Zoho/Xero)', included: true },
      { text: 'Advanced analytics & trend charts', included: true },
      { text: 'Multi-entity management', included: true },
    ],
    cta: 'Start Free Trial',
    badge: 'Most Popular',
  },
  {
    tier: 'ENTERPRISE' as const,
    name: 'Enterprise',
    tagline: 'For groups with 4+ entities',
    priceMonthly: null,
    priceYearly: null,
    highlight: false,
    features: [
      { text: 'Unlimited organizations', included: true },
      { text: 'Everything in Growth', included: true },
      { text: 'Dedicated onboarding & training', included: true },
      { text: 'Custom SLA & uptime guarantee', included: true },
      { text: 'API access for ERP integration', included: true },
      { text: 'Audit-ready data export', included: true },
      { text: 'FTA audit support package', included: true },
      { text: 'Custom contract & invoicing', included: true },
    ],
    cta: 'Contact Sales',
    badge: null,
  },
] as const;

type Tier = 'STARTER' | 'GROWTH' | 'ENTERPRISE';

// ─── Component ────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState<Tier | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function handleCheckout(tier: Tier) {
    if (tier === 'ENTERPRISE') {
      window.location.href = 'mailto:sales@taxsentry.ae?subject=Enterprise Enquiry';
      return;
    }

    setCheckoutError(null);
    setLoading(tier);
    try {
      const { data } = await api.post('/billing/checkout', { tier, interval });
      window.location.href = data.data.checkoutUrl;
    } catch (err: any) {
      setCheckoutError(err?.response?.data?.message ?? 'Something went wrong. Please try again.');
      setLoading(null);
    }
  }

  const yearlySaving = Math.round(((299 * 12 - 2990) / (299 * 12)) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
          <ShieldCheck className="w-3.5 h-3.5" />
          UAE Free Zone QFZP Compliance
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Monitor risk before it becomes tax exposure
        </h1>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
          Every month without de-minimis monitoring is risk carried blind. All plans include a 14-day free trial.
        </p>

        {/* Interval toggle */}
        <div className="mt-8 inline-flex items-center bg-muted rounded-lg p-1 gap-1">
          <button
            onClick={() => setInterval('monthly')}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              interval === 'monthly'
                ? 'bg-card text-foreground shadow-card'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('yearly')}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
              interval === 'yearly'
                ? 'bg-card text-foreground shadow-card'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Yearly
            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
              Save {yearlySaving}%
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.tier}
              plan={plan}
              interval={interval}
              loading={loading === plan.tier}
              onCheckout={() => handleCheckout(plan.tier)}
            />
          ))}
        </div>
        {checkoutError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {checkoutError}
          </div>
        )}

        {/* Trust row */}
        <div className="mt-10 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> AES-256 encrypted
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Compliant with Cabinet Decision 100/2023
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Payments via Dodo Payments (MoR)
          </span>
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Invoiced in AED
          </span>
        </div>

        {/* FAQ callout */}
        <div className="mt-8 bg-card border rounded-lg p-6 text-sm text-center max-w-xl mx-auto">
          <p className="font-semibold text-foreground">Questions before you commit?</p>
          <p className="text-muted-foreground mt-1">
            Book a 15-minute demo with our compliance team — we'll walk you through your specific
            Free Zone scenario.
          </p>
          <a
            href="mailto:demo@taxsentry.ae"
            className="inline-flex items-center gap-1 mt-3 text-primary font-medium hover:underline"
          >
            Book a demo <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── PlanCard ─────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  interval,
  loading,
  onCheckout,
}: {
  plan: (typeof PLANS)[number];
  interval: 'monthly' | 'yearly';
  loading: boolean;
  onCheckout: () => void;
}) {
  const price =
    plan.priceMonthly === null
      ? null
      : interval === 'yearly'
      ? plan.priceYearly
      : plan.priceMonthly;

  return (
    <div
      className={cn(
        'relative bg-card rounded-xl border flex flex-col',
        plan.highlight
          ? 'border-primary shadow-card-md ring-1 ring-primary/20'
          : 'shadow-card',
      )}
    >
      {/* Popular badge */}
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full">
            {plan.badge}
          </span>
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col">
        {/* Plan name */}
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {plan.name}
          </p>
          <p className="text-xs text-muted-foreground">{plan.tagline}</p>
        </div>

        {/* Price */}
        <div className="mb-6">
          {price === null ? (
            <div>
              <p className="text-3xl font-bold text-foreground">Custom</p>
              <p className="text-xs text-muted-foreground mt-1">Tailored to your group</p>
            </div>
          ) : (
            <div className="flex items-end gap-1">
              <span className="text-xs text-muted-foreground self-start mt-2">AED</span>
              <span className="text-3xl font-bold text-foreground tabular-nums">
                {price.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground mb-1">
                /{interval === 'yearly' ? 'yr' : 'mo'}
              </span>
            </div>
          )}
          {interval === 'yearly' && plan.priceMonthly && (
            <p className="text-xs text-emerald-600 mt-1 font-medium">
              Equivalent to AED {Math.round(plan.priceYearly! / 12)}/month
            </p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-2.5 flex-1 mb-6">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs">
              {f.included ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Minus className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
              )}
              <span className={cn(f.included ? 'text-foreground' : 'text-muted-foreground/60')}>
                {f.text}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={onCheckout}
          disabled={loading}
          className={cn(
            'w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2',
            plan.highlight
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-navy-900 text-white hover:bg-navy-800',
            loading && 'opacity-70 cursor-not-allowed',
          )}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Redirecting…
            </span>
          ) : (
            <>
              {plan.cta}
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {plan.tier !== 'ENTERPRISE' && (
        <div className="border-t px-6 py-2.5">
          <p className="text-xs text-muted-foreground text-center">
            14-day free trial · Cancel anytime · AED invoicing
          </p>
        </div>
      )}
    </div>
  );
}
