'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ArrowUpRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const LEGEND_LABELS: Record<string, string> = {
  QI: 'Qualifying Income',
  NQI: 'Non-Qualifying Income',
  EXCLUDED: 'Excluded Income',
};

function formatAedK(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2.5"
      style={{
        background: 'var(--ts-bg-elevated)',
        border: '1px solid var(--ts-border)',
        fontSize: 12,
        fontFamily: 'var(--font-sans)',
        minWidth: 160,
      }}
    >
      <p style={{ fontWeight: 600, color: 'var(--ts-fg-primary)', marginBottom: 6 }}>{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex justify-between gap-4 items-center mb-1">
          <span className="flex items-center gap-1.5" style={{ color: 'var(--ts-fg-muted)' }}>
            <span
              className="inline-block rounded-sm"
              style={{ width: 8, height: 8, background: entry.fill, flexShrink: 0 }}
            />
            {LEGEND_LABELS[entry.dataKey] ?? entry.dataKey}
          </span>
          <span className="ts-mono" style={{ fontWeight: 600, color: 'var(--ts-fg-primary)' }}>
            AED {formatAedK(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RevenueMixRow() {
  const { data, isLoading } = useQuery({
    queryKey: ['deminimis-history'],
    queryFn: () => api.get('/deminimis/history').then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <section>
        <SectionHeader />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div
            className="lg:col-span-2 animate-pulse rounded-xl"
            style={{ height: 288, background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)' }}
          />
          <div
            className="animate-pulse rounded-xl"
            style={{ height: 288, background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)' }}
          />
        </div>
      </section>
    );
  }

  const monthlyMap: Record<string, Record<string, number>> = {};
  (data?.monthly ?? []).forEach(
    (row: { month: string; classification: string; total: number }) => {
      if (!monthlyMap[row.month]) monthlyMap[row.month] = {};
      monthlyMap[row.month][row.classification] = Number(row.total);
    },
  );

  const chartData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, vals]) => ({
      month,
      QI: vals.QI ?? 0,
      NQI: vals.NQI ?? 0,
      EXCLUDED: vals.EXCLUDED ?? 0,
    }));

  const topNqi: Array<{ counterparty: string; _sum: { amountAed: string } }> =
    data?.topNqiCounterparties ?? [];

  return (
    <section>
      <SectionHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Stacked bar chart */}
        <div className="lg:col-span-2 premium-card" style={{ padding: 20 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--ts-fg-muted)',
              marginBottom: 16,
            }}
          >
            Monthly QI / NQI / Excluded Breakdown
          </p>
          {chartData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ts-border-subtle)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'oklch(0.45 0 0)', fontFamily: 'var(--font-sans)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatAedK}
                  tick={{ fontSize: 11, fill: 'oklch(0.45 0 0)', fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'oklch(0.98 0 0 / 0.03)', radius: 4 }} />
                <Bar dataKey="QI" stackId="a" fill="var(--ts-green-500)" name="QI" radius={[0, 0, 0, 0]} />
                <Bar dataKey="NQI" stackId="a" fill="var(--ts-amber-500)" name="NQI" radius={[0, 0, 0, 0]} />
                <Bar dataKey="EXCLUDED" stackId="a" fill="oklch(0.35 0.02 255)" name="EXCLUDED" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Legend */}
          <div className="flex items-center gap-5 mt-3">
            {[
              { color: 'var(--ts-green-500)', label: 'Qualifying Income' },
              { color: 'var(--ts-amber-500)', label: 'Non-Qualifying' },
              { color: 'oklch(0.35 0.02 255)', label: 'Excluded' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--ts-fg-muted)' }}>
                <span className="inline-block rounded-sm" style={{ width: 10, height: 10, background: color, flexShrink: 0 }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 NQI counterparties */}
        <div className="premium-card flex flex-col" style={{ padding: 20 }}>
          <div className="flex items-center justify-between mb-4">
            <h3
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--ts-fg-muted)',
                margin: 0,
              }}
            >
              Top NQI Sources
            </h3>
            <span style={{ fontSize: 11, color: 'oklch(0.40 0 0)' }}>by AED amount</span>
          </div>

          {topNqi.length === 0 ? (
            <div
              className="flex-1 flex items-center justify-center py-8 text-center"
              style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}
            >
              No NQI transactions yet.
            </div>
          ) : (
            <div className="flex-1 space-y-2.5">
              {topNqi.map((item, idx) => {
                const amount = Number(item._sum.amountAed);
                const maxAmount = Number(topNqi[0]._sum.amountAed);
                const barWidth = maxAmount > 0 ? Math.round((amount / maxAmount) * 100) : 0;
                return (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className="flex items-center gap-1.5 min-w-0"
                        style={{ fontSize: 12, color: 'var(--ts-fg-primary)' }}
                      >
                        <span
                          className="shrink-0 tabular-nums"
                          style={{ fontSize: 11, fontWeight: 700, color: 'var(--ts-fg-muted)', width: 16 }}
                        >
                          {idx + 1}
                        </span>
                        <span className="truncate">{item.counterparty}</span>
                      </span>
                      <span
                        className="ts-mono shrink-0"
                        style={{ fontSize: 12, fontWeight: 600, color: 'var(--ts-red-500)' }}
                      >
                        AED {formatAedK(amount)}
                      </span>
                    </div>
                    <div
                      className="w-full rounded-full overflow-hidden"
                      style={{ height: 3, background: 'var(--ts-bg-muted)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${barWidth}%`, background: 'oklch(0.62 0.24 25 / 0.5)' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div
            className="mt-4 pt-3"
            style={{ borderTop: '1px solid var(--ts-border-subtle)' }}
          >
            <Link
              href="/revenue"
              className="flex items-center gap-1 transition-colors hover:text-white"
              style={{ fontSize: 12, fontWeight: 500, color: 'var(--ts-blue-400)' }}
            >
              View all NQI transactions <ArrowUpRight size={12} />
            </Link>
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
        Revenue Mix
      </h2>
      <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0 }}>
        Income classification by month — NQI must stay below de-minimis thresholds
      </p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div
      className="h-48 flex flex-col items-center justify-center gap-2 text-center rounded-lg"
      style={{ background: 'var(--ts-bg-elevated)' }}
    >
      <TrendingUp size={32} color="oklch(0.48 0 0)" />
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ts-fg-muted)', margin: 0 }}>
        No revenue data yet
      </p>
      <p style={{ fontSize: 12, color: 'oklch(0.40 0 0)', maxWidth: 260, lineHeight: 1.5, margin: 0 }}>
        Upload transactions or connect your accounting software to see the revenue mix chart.
      </p>
    </div>
  );
}
