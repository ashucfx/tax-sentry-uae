'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

function formatAed(v: string | number): string {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `AED ${(n / 1_000).toFixed(0)}K`;
  return `AED ${n.toFixed(0)}`;
}

function gaugeColor(pct: number) {
  if (pct >= 100) return 'var(--ts-red-500)';
  if (pct >= 80) return 'var(--ts-red-400)';
  if (pct >= 60) return 'var(--ts-amber-500)';
  return 'var(--ts-green-500)';
}

function CircularGauge({
  value,
  max,
  displayValue,
  sublabel,
  size = 150,
}: {
  value: number;
  max: number;
  displayValue: string;
  sublabel: string;
  size?: number;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const sw = 11;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = gaugeColor(pct);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="absolute inset-0"
        style={{ transform: 'rotate(-90deg)' }}
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ts-bg-muted)"
          strokeWidth={sw}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
            transition: 'stroke-dashoffset 0.7s ease',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="ts-mono"
          style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}
        >
          {displayValue}
        </span>
        <span style={{ fontSize: 10, color: 'oklch(0.45 0 0)', marginTop: 2 }}>
          {sublabel}
        </span>
      </div>
    </div>
  );
}

function ThresholdCard({
  title,
  pctValue,
  pctMax,
  absValue,
  absMax,
  isBreached,
}: {
  title: string;
  pctValue: number;
  pctMax: number;
  absValue: number;
  absMax: number;
  isBreached: boolean;
}) {
  const headroomPct = Math.max(0, pctMax - pctValue).toFixed(1);
  const headroomAbs = Math.max(0, absMax - absValue);

  return (
    <div
      className="premium-card"
      style={{
        padding: 24,
        border: isBreached ? '1px solid oklch(0.62 0.24 25 / 0.4)' : undefined,
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0, marginBottom: 4 }}>
          {title}
        </h3>
        <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0 }}>
          Non-Qualifying Revenue must stay below <strong style={{ color: 'var(--ts-fg-secondary)' }}>both</strong> thresholds
        </p>
      </div>

      <div className="flex justify-center gap-10 mb-5">
        <div className="text-center">
          <CircularGauge
            value={pctValue}
            max={pctMax}
            displayValue={`${pctValue.toFixed(1)}%`}
            sublabel={`of ${pctMax}%`}
          />
          <p style={{ marginTop: 8, fontSize: 12, fontWeight: 500, color: 'oklch(0.80 0 0)' }}>
            Percentage Test
          </p>
          <p style={{ fontSize: 10, color: 'oklch(0.45 0 0)' }}>Threshold: 5%</p>
        </div>
        <div className="text-center">
          <CircularGauge
            value={absValue}
            max={absMax}
            displayValue={formatAed(absValue)}
            sublabel="of AED 5M"
          />
          <p style={{ marginTop: 8, fontSize: 12, fontWeight: 500, color: 'oklch(0.80 0 0)' }}>
            Absolute Test
          </p>
          <p style={{ fontSize: 10, color: 'oklch(0.45 0 0)' }}>Threshold: AED 5M</p>
        </div>
      </div>

      {/* Headroom bar */}
      <div
        className="flex items-center justify-between rounded-lg"
        style={{
          background: 'oklch(0.22 0.03 255 / 0.6)',
          padding: '12px 16px',
        }}
      >
        <div>
          <p style={{ fontSize: 10, color: 'oklch(0.45 0 0)', marginBottom: 2 }}>Headroom (Pct)</p>
          <p className="ts-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ts-green-500)' }}>
            {headroomPct}%
          </p>
        </div>
        <div style={{ width: 1, height: 32, background: 'var(--ts-border)' }} />
        <div>
          <p style={{ fontSize: 10, color: 'oklch(0.45 0 0)', marginBottom: 2 }}>Headroom (Abs)</p>
          <p className="ts-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ts-green-500)' }}>
            {formatAed(headroomAbs)}
          </p>
        </div>
      </div>

      {isBreached && (
        <div
          className="mt-3 rounded-lg p-3 text-[12px]"
          style={{
            border: '1px solid oklch(0.80 0.18 85 / 0.3)',
            background: 'oklch(0.80 0.18 85 / 0.1)',
            color: 'var(--ts-amber-500)',
          }}
        >
          <strong>Warning:</strong> Approaching de-minimis threshold. Review pending NQI transactions.
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
          {[0, 1].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl"
              style={{ height: 340, background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)' }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section>
        <SectionHeader />
        <div
          className="rounded-xl p-8 text-center text-[14px]"
          style={{
            background: 'var(--ts-bg-card)',
            border: '1px solid var(--ts-border)',
            color: 'var(--ts-fg-muted)',
          }}
        >
          No transaction data yet. Upload a CSV to get started.
        </div>
      </section>
    );
  }

  const { deMinimis: dm, projections: proj } = data;
  const pctValue = parseFloat(dm.nqrPercentage);
  const absValue = parseFloat(dm.nqrAmount);
  const pctIsBreached = dm.breachType === 'PCT' || dm.breachType === 'BOTH';
  const absIsBreached = dm.breachType === 'ABS' || dm.breachType === 'BOTH';

  return (
    <section>
      <SectionHeader />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ThresholdCard
          title="De-Minimis Tracker"
          pctValue={pctValue}
          pctMax={5}
          absValue={absValue}
          absMax={5_000_000}
          isBreached={pctIsBreached || absIsBreached}
        />

        {/* Period card */}
        <div className="premium-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0, marginBottom: 4 }}>
            Tax Period Progress
          </h3>
          <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0, marginBottom: 20 }}>
            Projected run-rate based on elapsed period
          </p>

          <div className="flex justify-between mb-1.5" style={{ fontSize: 12, color: 'var(--ts-fg-muted)' }}>
            <span>Period progress</span>
            <span style={{ fontWeight: 600, color: 'var(--ts-fg-primary)' }}>
              Day {proj.daysElapsed} of {proj.daysInPeriod} ({proj.periodProgress}%)
            </span>
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 6, background: 'var(--ts-bg-muted)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${proj.periodProgress}%`,
                background: 'var(--ts-blue-500)',
              }}
            />
          </div>

          <div className="mt-5 space-y-3">
            {[
              { label: 'Projected NQI %', value: proj.projectedNqrPct ? `${parseFloat(proj.projectedNqrPct).toFixed(2)}%` : 'N/A', threshold: '5.00%' },
              { label: 'Projected NQI Amount', value: proj.projectedNqrAmount ? formatAed(proj.projectedNqrAmount) : 'N/A', threshold: 'AED 5M' },
            ].map(({ label, value, threshold }) => (
              <div key={label} className="flex justify-between items-center" style={{ fontSize: 12 }}>
                <span style={{ color: 'var(--ts-fg-muted)' }}>{label}</span>
                <div className="flex items-center gap-3">
                  <span className="ts-mono" style={{ fontWeight: 600, color: 'var(--ts-fg-primary)' }}>{value}</span>
                  <span style={{ color: 'oklch(0.40 0 0)' }}>/ {threshold}</span>
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-5 rounded-lg p-3"
            style={{ background: 'var(--ts-bg-elevated)', fontSize: 11, color: 'oklch(0.45 0 0)', lineHeight: 1.5 }}
          >
            Cabinet Decision No. 100/2023 · Ministerial Decision 265/2023.
            Breach of <em>either</em> limit triggers 5-year QFZP disqualification.
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader() {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0, marginBottom: 3 }}>
        De-Minimis Threshold Monitor
      </h2>
      <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0 }}>
        Non-Qualifying Income must stay below <strong>both</strong> limits to preserve 0% tax status.
      </p>
    </div>
  );
}
