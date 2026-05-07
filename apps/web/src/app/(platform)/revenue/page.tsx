'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { TopRibbon } from '@/components/dashboard/TopRibbon';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle2, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

function formatAed(v: number) {
  if (v >= 1_000_000) return `AED ${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `AED ${(v / 1_000).toFixed(0)}K`;
  return `AED ${v}`;
}

function PageHeader() {
  return (
    <div style={{ marginBottom: 24 }}>
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp size={18} color="var(--ts-blue-500)" />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}>
          Revenue Classification
        </h1>
      </div>
      <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)', margin: 0 }}>
        Real-time breakdown of Qualifying Income, Non-Qualifying Income, and Excluded Income.
      </p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  color,
  border,
  bg,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  border: string;
  bg: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{ border: `1px solid ${border}`, background: bg, padding: '18px 20px' }}
    >
      <div
        className="absolute top-0 left-0 right-0"
        style={{ height: 1, background: `linear-gradient(90deg, transparent, ${border}, transparent)` }}
      />
      <p style={{ fontSize: 11, color: 'var(--ts-fg-muted)', marginBottom: 6 }}>{label}</p>
      <p className="ts-mono" style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, color: 'oklch(0.45 0 0)', marginTop: 4 }}>{sub}</p>
    </div>
  );
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
            {entry.name}
          </span>
          <span className="ts-mono" style={{ fontWeight: 600, color: 'var(--ts-fg-primary)' }}>
            {formatAed(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function RevenuePage() {
  const { data: dmData } = useQuery({
    queryKey: ['deminimis-status'],
    queryFn: () => api.get('/deminimis/status').then((r) => r.data.data),
  });

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['deminimis-history'],
    queryFn: () => api.get('/deminimis/history').then((r) => r.data.data),
  });

  const dm = dmData?.deMinimis;
  const monthlyMap: Record<string, Record<string, number>> = {};
  (historyData?.monthly ?? []).forEach(
    (row: { month: string; classification: string; total: number }) => {
      if (!monthlyMap[row.month]) monthlyMap[row.month] = {};
      monthlyMap[row.month][row.classification] = Number(row.total);
    },
  );
  const chartData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, vals]) => ({ month, ...vals }));

  const totalQi = historyData?.totals?.QI ?? 0;
  const totalNqi = historyData?.totals?.NQI ?? 0;
  const totalExcluded = historyData?.totals?.EXCLUDED ?? 0;
  const totalRevenue = totalQi + totalNqi + totalExcluded;

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--ts-bg-base)' }}>
      <TopRibbon />

      <div className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-6 space-y-6">
        <PageHeader />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Revenue (YTD)"
            value={formatAed(totalRevenue)}
            sub="Excl. exempt income"
            color="var(--ts-fg-primary)"
            border="var(--ts-border)"
            bg="var(--ts-bg-card)"
          />
          <KpiCard
            label="Qualifying Income"
            value={formatAed(totalQi)}
            sub="0% corporate tax"
            color="var(--ts-green-500)"
            border="oklch(0.70 0.20 155 / 0.3)"
            bg="oklch(0.70 0.20 155 / 0.05)"
          />
          <KpiCard
            label="Non-Qualifying Income"
            value={formatAed(totalNqi)}
            sub={`${dm ? parseFloat(dm.nqrPercentage).toFixed(2) : '—'}% of revenue`}
            color="var(--ts-amber-500)"
            border="oklch(0.80 0.18 85 / 0.3)"
            bg="oklch(0.80 0.18 85 / 0.05)"
          />
          <KpiCard
            label="Excluded Income"
            value={formatAed(totalExcluded)}
            sub="Not counted for de-minimis"
            color="var(--ts-fg-muted)"
            border="var(--ts-border)"
            bg="var(--ts-bg-card)"
          />
        </div>

        {/* Monthly bar chart */}
        <div
          className="premium-card"
          style={{ padding: 24 }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>
                Monthly Revenue Breakdown
              </h2>
              <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0, marginTop: 3 }}>
                Classification by income type across tax period
              </p>
            </div>
            <Link
              href="/transactions"
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-medium"
              style={{ background: 'var(--ts-bg-elevated)', color: 'var(--ts-fg-muted)', border: '1px solid var(--ts-border)' }}
            >
              Import Transactions <ArrowUpRight size={12} />
            </Link>
          </div>

          {isLoading ? (
            <div
              className="animate-pulse rounded-lg"
              style={{ height: 240, background: 'var(--ts-bg-elevated)' }}
            />
          ) : chartData.length === 0 ? (
            <div
              className="flex items-center justify-center rounded-lg"
              style={{ height: 200, background: 'var(--ts-bg-elevated)', fontSize: 13, color: 'var(--ts-fg-muted)' }}
            >
              No monthly data. Upload a CSV to see your revenue breakdown.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} barGap={2} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ts-border-subtle)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'oklch(0.45 0 0)', fontSize: 11, fontFamily: 'var(--font-sans)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                  tick={{ fill: 'oklch(0.45 0 0)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'oklch(0.98 0 0 / 0.03)' }} />
                <Bar dataKey="QI" name="Qualifying Income" fill="var(--ts-green-500)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="NQI" name="Non-Qualifying" fill="var(--ts-amber-500)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="EXCLUDED" name="Excluded" fill="oklch(0.35 0.02 255)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Legend */}
          <div className="flex items-center gap-5 mt-3">
            {[
              { color: 'var(--ts-green-500)', label: 'Qualifying Income (QI)' },
              { color: 'var(--ts-amber-500)', label: 'Non-Qualifying (NQI)' },
              { color: 'oklch(0.35 0.02 255)', label: 'Excluded' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--ts-fg-muted)' }}>
                <span className="inline-block rounded-sm" style={{ width: 10, height: 10, background: color, flexShrink: 0 }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* NQI warning */}
        {dm && parseFloat(dm.nqrPercentage) >= 3.5 && (
          <div
            className="flex items-start gap-3 rounded-xl p-4"
            style={{
              border: '1px solid oklch(0.80 0.18 85 / 0.3)',
              background: 'oklch(0.80 0.18 85 / 0.08)',
            }}
          >
            <AlertTriangle size={16} color="var(--ts-amber-500)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts-amber-500)', margin: 0, marginBottom: 3 }}>
                Approaching De-Minimis Threshold
              </p>
              <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0, lineHeight: 1.5 }}>
                NQI is at {parseFloat(dm.nqrPercentage).toFixed(2)}% — only {(5 - parseFloat(dm.nqrPercentage)).toFixed(2)}% headroom remaining.
                Review unclassified transactions to avoid exceeding the 5% limit.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
