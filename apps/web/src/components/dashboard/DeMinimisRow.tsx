'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { TrendingUp, AlertTriangle, Info } from 'lucide-react';

function formatAed(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (num >= 1_000_000) return `AED ${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `AED ${(num / 1_000).toFixed(1)}K`;
  return `AED ${num.toFixed(0)}`;
}

/** SVG arc gauge with a 330 degree sweep */
function ArcGauge({ pct, color }: { pct: number; color: string }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const r = 40;
  const cx = 52;
  const cy = 52;
  const startAngle = 210; // degrees
  const endAngle = 330;   // total sweep in degrees
  const sweep = (endAngle * clamped) / 100;

  function polar(angle: number, radius: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function arc(start: number, end: number, r: number) {
    const s = polar(start, r);
    const e = polar(end, r);
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  return (
    <svg viewBox="0 0 104 80" className="w-28 h-20" aria-hidden>
      {/* Track */}
      <path d={arc(startAngle, startAngle + endAngle, r)} fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
      {/* Fill */}
      {clamped > 0 && (
        <path d={arc(startAngle, startAngle + sweep, r)} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      )}
      {/* Centre text */}
      <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fill={color} fontSize="16" fontWeight="700" fontFamily="Inter, sans-serif">
        {clamped}%
      </text>
    </svg>
  );
}

function colorForPct(pct: number, isBreached: boolean) {
  if (isBreached || pct >= 100) return '#b91c1c';
  if (pct >= 90) return '#dc2626';
  if (pct >= 80) return '#d97706';
  if (pct >= 60) return '#f59e0b';
  return '#16a34a';
}

function ThresholdCard({
  title,
  tooltip,
  current,
  projected,
  threshold,
  consumed,
  margin,
  isBreached,
}: {
  title: string;
  tooltip: string;
  current: string;
  projected: string | null;
  threshold: string;
  consumed: number;
  margin: string;
  isBreached: boolean;
}) {
  const color = colorForPct(consumed, isBreached);

  return (
    <div
      className={cn(
        'bg-card rounded-lg border shadow-card p-5 flex flex-col gap-4',
        isBreached && 'border-red-300 bg-red-50/40 ring-1 ring-red-300',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{tooltip}</p>
        </div>
        {isBreached && (
          <span className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full whitespace-nowrap">
            <AlertTriangle className="w-3 h-3" /> BREACHED
          </span>
        )}
      </div>

      {/* Gauge + stats */}
      <div className="flex items-center gap-5">
        <ArcGauge pct={consumed} color={color} />

        <div className="flex-1 space-y-2.5">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Current NQI</p>
            <p className="text-xl font-bold text-foreground leading-tight">{current}</p>
          </div>
          {projected && (
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Projected year-end: <span className="font-semibold text-foreground">{projected}</span></p>
            </div>
          )}
          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Threshold</span>
              <span className="font-medium text-foreground">{threshold}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Remaining margin</span>
              <span
                className={cn(
                  'font-semibold',
                  isBreached ? 'text-red-700' : consumed >= 80 ? 'text-amber-600' : 'text-emerald-600',
                )}
              >
                {margin}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isBreached && (
        <div className="flex items-start gap-2 p-3 bg-red-100 rounded border border-red-200 text-xs text-red-800">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            De-minimis threshold exceeded. Under Cabinet Decision 100/2023, QFZP status is forfeited.
            Contact your tax advisor immediately to assess remediation options.
          </span>
        </div>
      )}
    </div>
  );
}

export function DeMinimisRow() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['deminimis-status'],
    queryFn: () => api.get('/deminimis/status').then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <section>
        <SectionHeader />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map((i) => <div key={i} className="bg-card rounded-lg border h-52 animate-pulse" />)}
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section>
        <SectionHeader />
        <div className="bg-card rounded-lg border p-8 text-center text-muted-foreground text-sm">
          No transaction data yet. Upload a CSV or connect your accounting software to get started.
        </div>
      </section>
    );
  }

  const { deMinimis: dm, projections: proj } = data;

  const pctConsumed = Math.round((parseFloat(dm.nqrPercentage) / parseFloat(dm.pctThreshold)) * 100);
  const absConsumed = Math.round((parseFloat(dm.nqrAmount) / parseFloat(dm.absThreshold)) * 100);
  const overallStatus = dm.breachType !== 'NONE'
    ? 'BREACHED'
    : proj.projectedBreachRisk === 'RED'
      ? 'BREACH IMMINENT'
      : proj.projectedBreachRisk === 'AMBER' || Math.max(pctConsumed, absConsumed) >= 80
        ? 'AT RISK'
        : 'SAFE';
  const overallStatusClass =
    overallStatus === 'BREACHED' || overallStatus === 'BREACH IMMINENT'
      ? 'bg-red-50 text-red-700 border-red-200'
      : overallStatus === 'AT RISK'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  return (
    <section>
      <SectionHeader />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 shadow-card">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Overall De-Minimis Status
          </p>
          <p className="text-sm text-muted-foreground">
            Worst-case view across percentage and AED limits
          </p>
        </div>
        <span className={cn('rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide', overallStatusClass)}>
          {overallStatus}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ThresholdCard
          title="NQI % of Total Revenue"
          tooltip="Must stay below 5% of total revenue (Cabinet Decision 100/2023)"
          current={`${parseFloat(dm.nqrPercentage).toFixed(2)}%`}
          projected={
            proj.projectedNqrPct
              ? `${parseFloat(proj.projectedNqrPct).toFixed(2)}%`
              : null
          }
          threshold="5.00% of total revenue"
          consumed={pctConsumed}
          margin={`${parseFloat(dm.marginToBreachPct).toFixed(2)}% headroom`}
          isBreached={dm.breachType === 'PCT' || dm.breachType === 'BOTH'}
        />

        <ThresholdCard
          title="NQI Absolute Amount (AED)"
          tooltip="Must stay below AED 5,000,000 regardless of revenue size"
          current={formatAed(dm.nqrAmount)}
          projected={proj.projectedNqrAmount ? formatAed(proj.projectedNqrAmount) : null}
          threshold="AED 5,000,000"
          consumed={absConsumed}
          margin={`${formatAed(dm.marginToBreachAed)} headroom`}
          isBreached={dm.breachType === 'ABS' || dm.breachType === 'BOTH'}
        />
      </div>

      {/* Period progress bar */}
      <div className="mt-3 bg-card rounded-lg border px-5 py-3 shadow-card">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Tax period progress</span>
          <span className="font-medium text-foreground">
            Day {proj.daysElapsed} of {proj.daysInPeriod} ({proj.periodProgress}% elapsed)
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: `${proj.periodProgress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Period start</span>
          <span>Period end</span>
        </div>
      </div>

      {/* Legal note */}
      <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
        <Info className="w-3 h-3 inline" />
        Thresholds per <strong>Cabinet Decision No. 100/2023</strong> · Ministerial Decision 265/2023. Breach of <em>either</em> limit triggers disqualification.
      </p>
    </section>
  );
}

function SectionHeader() {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-foreground">De-Minimis Threshold Monitor</h2>
      <p className="text-xs text-muted-foreground mt-0.5">
        Non-Qualifying Income must stay below <strong>both</strong> limits to preserve 0% tax status.
        Breach of either = 5-year disqualification.
      </p>
    </div>
  );
}
