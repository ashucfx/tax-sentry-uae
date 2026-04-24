'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ArrowUpRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const CLASSIFICATION_COLORS = {
  QI:       '#16a34a',  /* emerald — qualifying, safe */
  NQI:      '#dc2626',  /* red — non-qualifying, risk */
  EXCLUDED: '#94a3b8',  /* slate — excluded, neutral */
};

const LEGEND_LABELS: Record<string, string> = {
  QI: 'Qualifying Income',
  NQI: 'Non-Qualifying Income',
  EXCLUDED: 'Excluded Income',
};

function formatAedK(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border rounded-lg shadow-card-md px-3 py-2.5 text-xs space-y-1 min-w-[160px]">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex justify-between gap-4 items-center">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2 h-2 rounded-sm inline-block flex-shrink-0" style={{ background: entry.fill }} />
            {LEGEND_LABELS[entry.dataKey] ?? entry.dataKey}
          </span>
          <span className="font-medium text-foreground tabular-nums">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-lg border shadow-card p-6 h-72 animate-pulse" />
          <div className="bg-card rounded-lg border shadow-card p-6 h-72 animate-pulse" />
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

  const chartData = Object.entries(monthlyMap).map(([month, vals]) => ({
    month,
    QI:       vals.QI       ?? 0,
    NQI:      vals.NQI      ?? 0,
    EXCLUDED: vals.EXCLUDED ?? 0,
  }));

  const topNqi: Array<{ counterparty: string; _sum: { amountAed: string } }> =
    data?.topNqiCounterparties ?? [];

  return (
    <section>
      <SectionHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Stacked bar chart */}
        <div className="lg:col-span-2 bg-card rounded-lg border shadow-card p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Monthly QI / NQI / Excluded Breakdown
          </p>
          {chartData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatAedK}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', radius: 4 }} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                  formatter={(value) => LEGEND_LABELS[value] ?? value}
                />
                <Bar dataKey="QI"       stackId="a" fill={CLASSIFICATION_COLORS.QI}       name="QI"       radius={[0, 0, 0, 0]} />
                <Bar dataKey="NQI"      stackId="a" fill={CLASSIFICATION_COLORS.NQI}      name="NQI"      radius={[3, 3, 0, 0]} />
                <Bar dataKey="EXCLUDED" stackId="a" fill={CLASSIFICATION_COLORS.EXCLUDED} name="EXCLUDED" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top 5 NQI counterparties */}
        <div className="bg-card rounded-lg border shadow-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Top NQI Sources
            </h3>
            <span className="text-xs text-muted-foreground">by AED amount</span>
          </div>

          {topNqi.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground text-center py-8">
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
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="flex items-center gap-1.5 text-xs text-foreground min-w-0">
                        <span className="text-xs font-bold text-muted-foreground w-4 shrink-0 tabular-nums">
                          {idx + 1}
                        </span>
                        <span className="truncate max-w-[220px] lg:max-w-[190px]">{item.counterparty}</span>
                      </span>
                      <span className="text-xs font-semibold text-red-600 tabular-nums shrink-0">
                        AED {formatAedK(amount)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1">
                      <div
                        className="bg-red-400/60 h-1 rounded-full"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 pt-3 border-t">
            <Link
              href="/transactions?filter=NQI"
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
            >
              View all NQI transactions <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader() {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-foreground">Revenue Mix</h2>
      <p className="text-xs text-muted-foreground mt-0.5">
        Income classification by month — NQI must stay below de-minimis thresholds
      </p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-48 flex flex-col items-center justify-center gap-2 text-center">
      <TrendingUp className="w-8 h-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">No revenue data yet</p>
      <p className="text-xs text-muted-foreground/70 max-w-xs">
        Upload transactions or connect your accounting software to see the revenue mix chart.
      </p>
    </div>
  );
}
