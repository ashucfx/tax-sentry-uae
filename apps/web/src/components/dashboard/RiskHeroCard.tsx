'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, ShieldX, ArrowRight, Info } from 'lucide-react';
import Link from 'next/link';

export function RiskHeroCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['risk-score'],
    queryFn: () => api.get('/risk/score').then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="w-full bg-card rounded-2xl border border-border h-48 animate-pulse shadow-sm" />
    );
  }

  if (!data) return null;

  const { total, band, bandLabel, plainEnglishSummary, topRiskFactors } = data;

  const bandConfig = {
    GREEN: {
      icon: ShieldCheck,
      color: '#059669',
      bg: 'bg-emerald-500/5',
      border: 'border-emerald-200/60',
      text: 'text-emerald-700',
      accent: 'bg-emerald-600',
      ring: 'ring-emerald-500/20',
      glow: 'shadow-emerald-500/10',
    },
    AMBER: {
      icon: ShieldAlert,
      color: '#d97706',
      bg: 'bg-amber-500/5',
      border: 'border-amber-200/60',
      text: 'text-amber-700',
      accent: 'bg-amber-600',
      ring: 'ring-amber-500/20',
      glow: 'shadow-amber-500/10',
    },
    RED: {
      icon: ShieldX,
      color: '#dc2626',
      bg: 'bg-red-500/5',
      border: 'border-red-200/60',
      text: 'text-red-700',
      accent: 'bg-red-600',
      ring: 'ring-red-500/20',
      glow: 'shadow-red-500/10',
    },
  }[band as 'GREEN' | 'AMBER' | 'RED'];

  const Icon = bandConfig.icon;

  return (
    <div className={cn(
      "relative overflow-hidden w-full bg-card rounded-2xl border transition-all shadow-sm",
      bandConfig.bg,
      bandConfig.border,
      bandConfig.glow
    )}>
      {/* Decorative background element */}
      <div className={cn(
        "absolute -top-12 -right-12 w-64 h-64 rounded-full blur-3xl opacity-20",
        bandConfig.accent
      )} />

      <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
        
        {/* Score Gauge */}
        <div className="relative shrink-0">
          <div
            className={cn("w-32 h-32 rounded-full p-[10px] ring-8", bandConfig.ring)}
            style={{
              background: `conic-gradient(${bandConfig.color} ${Math.min(100, Math.max(0, total)) * 3.6}deg, hsl(var(--muted)) 0deg)`,
            }}
            aria-hidden
          >
            <div className="w-full h-full rounded-full bg-card flex flex-col items-center justify-center">
              <span className={cn("text-4xl font-extrabold tracking-tighter", bandConfig.text)}>
                {total}
              </span>
              <span className="text-xs font-bold uppercase tracking-widest opacity-40 -mt-1">
                Score
              </span>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <Icon className={cn("w-5 h-5", bandConfig.text)} />
            <h2 className={cn("text-sm font-bold uppercase tracking-[0.2em]", bandConfig.text)}>
              {bandLabel} Status
            </h2>
          </div>
          
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-3 leading-tight">
            {plainEnglishSummary}
          </h1>

          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            {topRiskFactors.slice(0, 2).map((risk: string, i: number) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white/50 px-2 py-1 rounded border border-border/40">
                <Info className="w-3 h-3" />
                {risk}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0 w-full md:w-auto">
          <Link 
            href="/transactions" 
            className={cn(
              "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all",
              "text-white shadow-lg",
              bandConfig.accent,
              "hover:scale-[1.02] active:scale-95"
            )}
          >
            Review Transactions <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
