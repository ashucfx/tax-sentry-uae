'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import Link from 'next/link';
import { Rocket, CheckCircle2, ArrowRight } from 'lucide-react';

export function OnboardingProgressBanner() {
  const { data } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: () => api.get('/organizations/me/onboarding').then((r) => r.data.data),
    staleTime: 60_000,
  });

  // Don't show if loading or if complete
  if (!data || data.isComplete) return null;

  const { completedCount, totalSteps, percentComplete, steps } = data;
  const nextStep = steps.find((s: any) => !s.complete);

  return (
    <div
      className="rounded-xl p-4 flex items-center justify-between"
      style={{
        background: 'oklch(0.55 0.22 260 / 0.06)',
        border: '1px solid oklch(0.55 0.22 260 / 0.2)',
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{
            width: 36,
            height: 36,
            background: 'oklch(0.55 0.22 260 / 0.12)',
          }}
        >
          <Rocket size={16} style={{ color: 'var(--ts-blue-400)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ts-fg-primary)',
                margin: 0,
              }}
            >
              Getting started — {completedCount}/{totalSteps} steps complete
            </p>
            {completedCount > 0 && (
              <span
                className="flex items-center gap-0.5 text-[10px] font-semibold rounded-full px-2 py-0.5"
                style={{ background: 'oklch(0.70 0.20 155 / 0.15)', color: 'var(--ts-green-500)' }}
              >
                <CheckCircle2 size={9} />
                {completedCount} done
              </span>
            )}
          </div>
          {/* Progress bar */}
          <div
            className="rounded-full overflow-hidden"
            style={{ height: 4, background: 'oklch(0.55 0.22 260 / 0.15)', maxWidth: 320 }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percentComplete}%`,
                background: 'var(--ts-blue-500)',
              }}
            />
          </div>
          {nextStep && (
            <p style={{ fontSize: 11, color: 'var(--ts-fg-muted)', margin: 0, marginTop: 3 }}>
              Next: {nextStep.label}
            </p>
          )}
        </div>
      </div>
      <Link
        href="/onboarding/progress"
        className="flex items-center gap-1.5 flex-shrink-0 ml-4 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
        style={{
          background: 'var(--ts-blue-500)',
          color: 'white',
          textDecoration: 'none',
        }}
      >
        View steps
        <ArrowRight size={11} />
      </Link>
    </div>
  );
}
