'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Building2,
  User,
  Upload,
  BarChart3,
  Shield,
  CreditCard,
  Rocket,
} from 'lucide-react';

const STEP_ICONS: Record<string, React.ElementType> = {
  org_setup:    Building2,
  profile:      User,
  revenue_data: Upload,
  classification: BarChart3,
  substance:    Shield,
  subscription: CreditCard,
};

const STEP_ACTIONS: Record<string, { label: string; href: string }> = {
  org_setup:      { label: 'Complete setup', href: '/onboarding' },
  profile:        { label: 'Update profile', href: '/settings' },
  revenue_data:   { label: 'Upload transactions', href: '/revenue' },
  classification: { label: 'Review classifications', href: '/revenue' },
  substance:      { label: 'Upload documents', href: '/substance' },
  subscription:   { label: 'Choose a plan', href: '/billing' },
};

export default function OnboardingProgressPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: () => api.get('/organizations/me/onboarding').then((r) => r.data.data),
  });

  if (isLoading) return <ProgressSkeleton />;

  const { steps = [], completedCount = 0, totalSteps = 6, percentComplete = 0, isComplete = false } = data ?? {};

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--ts-bg-base)' }}>
      <div className="flex-1 w-full max-w-[720px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Rocket size={18} color="var(--ts-blue-500)" />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}>
            Getting Started
          </h1>
        </div>

        {/* Progress overview */}
        <div
          className="rounded-xl p-6 mb-6"
          style={{
            background: isComplete
              ? 'oklch(0.70 0.20 155 / 0.08)'
              : 'oklch(0.55 0.22 260 / 0.06)',
            border: `1px solid ${isComplete ? 'oklch(0.70 0.20 155 / 0.25)' : 'oklch(0.55 0.22 260 / 0.2)'}`,
          }}
        >
          {isComplete ? (
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{ width: 48, height: 48, background: 'oklch(0.70 0.20 155 / 0.15)' }}
              >
                <CheckCircle2 size={24} style={{ color: 'var(--ts-green-500)' }} />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}>
                  All steps complete!
                </p>
                <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)', margin: 0 }}>
                  Your TaxSentry account is fully set up and monitoring your QFZP compliance.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>
                    {completedCount} of {totalSteps} steps complete
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0, marginTop: 2 }}>
                    Complete all steps to activate full QFZP compliance monitoring
                  </p>
                </div>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: 'var(--ts-blue-400)',
                    fontFamily: 'var(--font-mono)',
                    lineHeight: 1,
                  }}
                >
                  {percentComplete}%
                </span>
              </div>
              {/* Progress bar */}
              <div
                className="rounded-full overflow-hidden"
                style={{ height: 6, background: 'var(--ts-bg-elevated)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${percentComplete}%`,
                    background: 'linear-gradient(90deg, var(--ts-blue-500), oklch(0.65 0.22 240))',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Steps */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--ts-border)', background: 'var(--ts-bg-card)' }}
        >
          {steps.map((step: any, idx: number) => {
            const Icon = STEP_ICONS[step.id] ?? Circle;
            const action = STEP_ACTIONS[step.id];
            return (
              <div
                key={step.id}
                className="flex items-start gap-4 px-5 py-4"
                style={{
                  borderBottom: idx < steps.length - 1 ? '1px solid var(--ts-border-subtle)' : 'none',
                  background: step.complete ? 'transparent' : 'transparent',
                  opacity: step.complete ? 0.85 : 1,
                }}
              >
                {/* Step number / check */}
                <div className="flex-shrink-0 mt-0.5">
                  {step.complete ? (
                    <div
                      className="flex items-center justify-center rounded-full"
                      style={{
                        width: 32,
                        height: 32,
                        background: 'oklch(0.70 0.20 155 / 0.15)',
                      }}
                    >
                      <CheckCircle2 size={16} style={{ color: 'var(--ts-green-500)' }} />
                    </div>
                  ) : (
                    <div
                      className="flex items-center justify-center rounded-full"
                      style={{
                        width: 32,
                        height: 32,
                        background: 'oklch(0.55 0.22 260 / 0.1)',
                        border: '1px solid oklch(0.55 0.22 260 / 0.3)',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--ts-blue-400)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {idx + 1}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon size={14} style={{ color: step.complete ? 'var(--ts-green-500)' : 'var(--ts-blue-400)', flexShrink: 0 }} />
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: step.complete ? 'var(--ts-fg-muted)' : 'var(--ts-fg-primary)',
                        margin: 0,
                        textDecoration: step.complete ? 'line-through' : 'none',
                      }}
                    >
                      {step.label}
                    </p>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--ts-fg-muted)',
                      margin: 0,
                      marginTop: 2,
                    }}
                  >
                    {step.description}
                  </p>
                </div>

                {/* Action */}
                {!step.complete && action && (
                  <Link
                    href={action.href}
                    className="flex items-center gap-1.5 flex-shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
                    style={{
                      background: 'oklch(0.55 0.22 260 / 0.1)',
                      color: 'var(--ts-blue-400)',
                      border: '1px solid oklch(0.55 0.22 260 / 0.25)',
                      textDecoration: 'none',
                    }}
                  >
                    {action.label}
                    <ArrowRight size={11} />
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA if not complete */}
        {!isComplete && (
          <div
            className="mt-6 rounded-xl p-4 flex items-center justify-between"
            style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)' }}
          >
            <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)', margin: 0 }}>
              Need help getting set up?
            </p>
            <Link
              href="/support"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium"
              style={{
                background: 'var(--ts-bg-elevated)',
                color: 'var(--ts-blue-400)',
                border: '1px solid var(--ts-border)',
                textDecoration: 'none',
              }}
            >
              Contact Support
              <ArrowRight size={11} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressSkeleton() {
  return (
    <div className="flex min-h-screen flex-col animate-pulse" style={{ background: 'var(--ts-bg-base)' }}>
      <div className="flex-1 w-full max-w-[720px] mx-auto px-6 py-6">
        <div className="h-6 bg-muted rounded w-40 mb-6" />
        <div className="h-24 rounded-xl bg-muted mb-6" />
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--ts-border)' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: i < 6 ? '1px solid var(--ts-border-subtle)' : 'none' }}>
              <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-muted rounded w-36" />
                <div className="h-2.5 bg-muted rounded w-56" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
