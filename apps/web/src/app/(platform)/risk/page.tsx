'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { TopRibbon } from '@/components/dashboard/TopRibbon';
import {
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  X,
  BarChart2,
  Calculator,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatAed(v: number) {
  return `AED ${v.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Band = 'GREEN' | 'AMBER' | 'RED';

interface RiskScore {
  score: number;
  band: Band;
  delta: number | null;
  calculatedAt: string;
}

interface ComponentScore {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  weight: number;
}

interface Snapshot {
  id: string;
  score: number;
  band: Band;
  calculatedAt: string;
}

interface BreakdownDetail {
  component: string;
  score: number;
  maxScore: number;
  factors: Array<{ label: string; impact: number; detail: string }>;
  transactions?: Array<{ id: string; date: string; amount: number; description: string }>;
}

// ─── Band config ─────────────────────────────────────────────────────────────

const BAND_CONFIG: Record<Band, { color: string; bg: string; border: string; label: string }> = {
  GREEN: {
    color: 'var(--ts-green-500)',
    bg: 'oklch(0.70 0.20 155 / 0.1)',
    border: 'oklch(0.70 0.20 155 / 0.3)',
    label: 'Low Risk',
  },
  AMBER: {
    color: 'var(--ts-amber-500)',
    bg: 'oklch(0.80 0.18 85 / 0.1)',
    border: 'oklch(0.80 0.18 85 / 0.3)',
    label: 'Medium Risk',
  },
  RED: {
    color: 'var(--ts-red-400)',
    bg: 'oklch(0.65 0.20 25 / 0.1)',
    border: 'oklch(0.65 0.20 25 / 0.3)',
    label: 'High Risk',
  },
};

const COMPONENTS: ComponentScore[] = [
  { key: 'deMinimis', label: 'De-Minimis', score: 0, maxScore: 100, weight: 0.30 },
  { key: 'substance', label: 'Substance', score: 0, maxScore: 100, weight: 0.25 },
  { key: 'classification', label: 'Classification', score: 0, maxScore: 100, weight: 0.20 },
  { key: 'relatedParty', label: 'Related Party', score: 0, maxScore: 100, weight: 0.15 },
  { key: 'auditReadiness', label: 'Audit Readiness', score: 0, maxScore: 100, weight: 0.10 },
];

// ─── Score Circle ─────────────────────────────────────────────────────────────

function ScoreCircle({ score, band }: { score: number; band: Band }) {
  const cfg = BAND_CONFIG[band];
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={70}
          cy={70}
          r={radius}
          fill="none"
          stroke="var(--ts-border)"
          strokeWidth={10}
        />
        <circle
          cx={70}
          cy={70}
          r={radius}
          fill="none"
          stroke={cfg.color}
          strokeWidth={10}
          strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="ts-mono" style={{ fontSize: 32, fontWeight: 700, color: cfg.color, lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: 11, color: 'var(--ts-fg-muted)', marginTop: 2 }}>/ 100</span>
      </div>
    </div>
  );
}

// ─── Component Score Bar ──────────────────────────────────────────────────────

function ComponentBar({
  comp,
  onClick,
  isSelected,
}: {
  comp: ComponentScore;
  onClick: () => void;
  isSelected: boolean;
}) {
  const pct = comp.maxScore > 0 ? (comp.score / comp.maxScore) * 100 : 0;
  const barColor =
    pct < 33 ? 'var(--ts-red-400)' : pct < 66 ? 'var(--ts-amber-500)' : 'var(--ts-green-500)';

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl transition-all"
      style={{
        padding: '14px 16px',
        background: isSelected ? 'oklch(0.55 0.22 260 / 0.07)' : 'var(--ts-bg-card)',
        border: `1px solid ${isSelected ? 'oklch(0.55 0.22 260 / 0.35)' : 'var(--ts-border)'}`,
        cursor: 'pointer',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts-fg-primary)' }}>
          {comp.label}
        </span>
        <div className="flex items-center gap-2">
          <span className="ts-mono" style={{ fontSize: 13, fontWeight: 700, color: barColor }}>
            {comp.score}
          </span>
          <ChevronRight
            size={14}
            color="var(--ts-fg-muted)"
            style={{ transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
          />
        </div>
      </div>
      <div className="rounded-full overflow-hidden" style={{ height: 6, background: 'var(--ts-bg-elevated)' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: barColor,
            borderRadius: 99,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span style={{ fontSize: 10, color: 'var(--ts-fg-muted)' }}>
          Weight: {(comp.weight * 100).toFixed(0)}%
        </span>
        <span style={{ fontSize: 10, color: 'var(--ts-fg-muted)' }}>
          {pct.toFixed(0)}%
        </span>
      </div>
    </button>
  );
}

// ─── Breakdown Panel ──────────────────────────────────────────────────────────

function BreakdownPanel({
  componentKey,
  onClose,
}: {
  componentKey: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery<BreakdownDetail>({
    queryKey: ['risk-breakdown', componentKey],
    queryFn: () =>
      api.get(`/risk/score/breakdown/${componentKey}`).then((r) => r.data.data),
  });

  return (
    <div
      className="rounded-2xl"
      style={{
        background: 'var(--ts-bg-card)',
        border: '1px solid oklch(0.55 0.22 260 / 0.25)',
        padding: 20,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}>
          {componentKey} Breakdown
        </h3>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ts-fg-muted)' }}
        >
          <X size={15} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg"
              style={{ height: 40, background: 'var(--ts-bg-elevated)' }}
            />
          ))}
        </div>
      ) : !data ? (
        <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)', textAlign: 'center', padding: '24px 0' }}>
          No breakdown available for this component.
        </p>
      ) : (
        <div className="space-y-3">
          {(data.factors ?? []).map((f, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg p-3"
              style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)' }}
            >
              <div
                className="rounded-full flex-shrink-0"
                style={{
                  width: 8,
                  height: 8,
                  background: f.impact < 0 ? 'var(--ts-red-400)' : 'var(--ts-green-500)',
                  marginTop: 5,
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ts-fg-primary)' }}>{f.label}</span>
                  <span
                    className="ts-mono"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: f.impact < 0 ? 'var(--ts-red-400)' : 'var(--ts-green-500)',
                      flexShrink: 0,
                    }}
                  >
                    {f.impact > 0 ? '+' : ''}{f.impact}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--ts-fg-muted)', margin: '2px 0 0', lineHeight: 1.4 }}>
                  {f.detail}
                </p>
              </div>
            </div>
          ))}

          {(data.transactions ?? []).length > 0 && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--ts-fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Contributing Transactions
              </p>
              <div className="space-y-1">
                {data.transactions!.slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                    style={{ background: 'var(--ts-bg-elevated)', fontSize: 12 }}
                  >
                    <span style={{ color: 'var(--ts-fg-muted)' }}>
                      {new Date(tx.date).toLocaleDateString('en-AE', { day: '2-digit', month: 'short' })}
                    </span>
                    <span style={{ flex: 1, color: 'var(--ts-fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.description}
                    </span>
                    <span className="ts-mono" style={{ color: 'var(--ts-fg-primary)', fontWeight: 600, flexShrink: 0 }}>
                      {formatAed(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RiskPage() {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simRevenue, setSimRevenue] = useState('');
  const [simNqi, setSimNqi] = useState('');

  // ─ Queries ─────────────────────────────────────────────────────────────────

  const { data: scoreData, isLoading: scoreLoading } = useQuery<RiskScore>({
    queryKey: ['risk-score'],
    queryFn: () => api.get('/risk/score').then((r) => r.data.data),
  });

  const { data: componentsData } = useQuery<{ components: ComponentScore[] }>({
    queryKey: ['risk-components'],
    queryFn: () =>
      api
        .get('/risk/score/components')
        .then((r) => r.data.data)
        .catch(() => ({ components: COMPONENTS })),
  });

  const { data: snapshotsData } = useQuery<{ snapshots: Snapshot[] }>({
    queryKey: ['risk-snapshots'],
    queryFn: () =>
      api
        .get('/risk/snapshots')
        .then((r) => r.data.data)
        .catch(() => ({ snapshots: [] })),
  });

  const simulateMutation = useMutation({
    mutationFn: (payload: { additionalRevenue: number; additionalNqiRevenue: number }) =>
      api.post('/risk/simulate', payload).then((r) => r.data.data),
  });

  // ─ Derived ─────────────────────────────────────────────────────────────────

  const score = scoreData?.score ?? 0;
  const band: Band = scoreData?.band ?? 'GREEN';
  const delta = scoreData?.delta ?? null;
  const bandCfg = BAND_CONFIG[band];
  const components: ComponentScore[] = componentsData?.components ?? COMPONENTS;
  const snapshots: Snapshot[] = (snapshotsData?.snapshots ?? []).slice(0, 10);

  function handleSimulate() {
    simulateMutation.mutate({
      additionalRevenue: parseFloat(simRevenue) || 0,
      additionalNqiRevenue: parseFloat(simNqi) || 0,
    });
  }

  const simResult = simulateMutation.data;

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--ts-bg-base)' }}>
      <TopRibbon />

      <div className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert size={18} color="var(--ts-blue-500)" />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}>
            Risk Analysis
          </h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)', margin: '-20px 0 0' }}>
          Composite QFZP compliance risk scoring with component-level drill-down.
        </p>

        {/* ── Risk Score Overview ────────────────────────────────────────────── */}
        <div
          className="premium-card"
          style={{ padding: 28 }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: '0 0 20px' }}>
            Risk Score Overview
          </h2>

          {scoreLoading ? (
            <div className="animate-pulse rounded-2xl" style={{ height: 160, background: 'var(--ts-bg-elevated)' }} />
          ) : (
            <div className="flex items-center gap-8 flex-wrap">
              <ScoreCircle score={score} band={band} />

              <div className="flex-1 min-w-[200px] space-y-4">
                {/* Band badge */}
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5"
                  style={{ background: bandCfg.bg, border: `1px solid ${bandCfg.border}` }}
                >
                  <div
                    className="rounded-full"
                    style={{ width: 8, height: 8, background: bandCfg.color }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: bandCfg.color }}>
                    {bandCfg.label}
                  </span>
                </div>

                {/* Delta */}
                {delta !== null && (
                  <div className="flex items-center gap-2">
                    {delta > 0 ? (
                      <TrendingUp size={16} color="var(--ts-red-400)" />
                    ) : delta < 0 ? (
                      <TrendingDown size={16} color="var(--ts-green-500)" />
                    ) : (
                      <Minus size={16} color="var(--ts-fg-muted)" />
                    )}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color:
                          delta > 0
                            ? 'var(--ts-red-400)'
                            : delta < 0
                            ? 'var(--ts-green-500)'
                            : 'var(--ts-fg-muted)',
                      }}
                    >
                      {delta > 0 ? '+' : ''}{delta} pts vs prior period
                    </span>
                  </div>
                )}

                {/* Last calculated */}
                {scoreData?.calculatedAt && (
                  <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0 }}>
                    Last calculated: {formatDate(scoreData.calculatedAt)}
                  </p>
                )}
              </div>

              {/* Score bands legend */}
              <div className="space-y-2 ml-auto">
                {(Object.entries(BAND_CONFIG) as [Band, typeof BAND_CONFIG[Band]][]).map(([b, cfg]) => (
                  <div key={b} className="flex items-center gap-2.5">
                    <div
                      className="rounded-full"
                      style={{ width: 10, height: 10, background: cfg.color, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--ts-fg-secondary)', width: 80 }}>
                      {cfg.label}
                    </span>
                    <span className="ts-mono" style={{ fontSize: 11, color: 'var(--ts-fg-muted)' }}>
                      {b === 'GREEN' ? '66–100' : b === 'AMBER' ? '33–65' : '0–32'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Component Breakdown ───────────────────────────────────────────── */}
        <div className="premium-card" style={{ padding: 24 }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} color="var(--ts-blue-400)" />
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>
              Component Breakdown
            </h2>
          </div>
          <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 16 }}>
            Click any component to drill into its contributing factors and transactions.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {components.map((comp) => (
              <ComponentBar
                key={comp.key}
                comp={comp}
                isSelected={selectedComponent === comp.key}
                onClick={() =>
                  setSelectedComponent((prev) => (prev === comp.key ? null : comp.key))
                }
              />
            ))}
          </div>

          {selectedComponent && (
            <div style={{ marginTop: 16 }}>
              <BreakdownPanel
                componentKey={selectedComponent}
                onClose={() => setSelectedComponent(null)}
              />
            </div>
          )}
        </div>

        {/* ── What-If Simulator ─────────────────────────────────────────────── */}
        <div className="premium-card" style={{ padding: 24 }}>
          <button
            onClick={() => setSimulatorOpen((p) => !p)}
            className="w-full flex items-center justify-between"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div className="flex items-center gap-2">
              <Calculator size={16} color="var(--ts-blue-400)" />
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>
                What-If Simulator
              </h2>
            </div>
            <ChevronDown
              size={16}
              color="var(--ts-fg-muted)"
              style={{ transform: simulatorOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>

          {simulatorOpen && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 20 }}>
                Model how additional revenue would affect your risk score before committing to transactions.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
                <div>
                  <label
                    htmlFor="simRevenue"
                    style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ts-fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}
                  >
                    Additional Revenue (AED)
                  </label>
                  <input
                    id="simRevenue"
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={simRevenue}
                    onChange={(e) => setSimRevenue(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--ts-bg-elevated)',
                      border: '1px solid var(--ts-border)',
                      borderRadius: 8,
                      fontSize: 13,
                      color: 'var(--ts-fg-primary)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="simNqi"
                    style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ts-fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}
                  >
                    Additional NQI Revenue (AED)
                  </label>
                  <input
                    id="simNqi"
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={simNqi}
                    onChange={(e) => setSimNqi(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--ts-bg-elevated)',
                      border: '1px solid var(--ts-border)',
                      borderRadius: 8,
                      fontSize: 13,
                      color: 'var(--ts-fg-primary)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handleSimulate}
                disabled={simulateMutation.isPending}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold mb-5"
                style={{
                  background: simulateMutation.isPending ? 'var(--ts-bg-elevated)' : 'var(--ts-blue-500)',
                  color: simulateMutation.isPending ? 'var(--ts-fg-muted)' : 'white',
                  border: 'none',
                  cursor: simulateMutation.isPending ? 'not-allowed' : 'pointer',
                }}
              >
                {simulateMutation.isPending && <RefreshCw size={13} className="animate-spin" />}
                Run Simulation
              </button>

              {simulateMutation.isError && (
                <div
                  className="rounded-xl p-4 mb-4"
                  style={{ background: 'oklch(0.65 0.20 25 / 0.08)', border: '1px solid oklch(0.65 0.20 25 / 0.25)', fontSize: 13, color: 'var(--ts-red-400)' }}
                >
                  Simulation failed. Please try again.
                </div>
              )}

              {simResult && (
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: bandCfg.bg,
                      border: `1px solid ${bandCfg.border}`,
                    }}
                  >
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--ts-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                      Current Score
                    </p>
                    <p className="ts-mono" style={{ fontSize: 28, fontWeight: 700, color: bandCfg.color, margin: 0 }}>
                      {score}
                    </p>
                    <p style={{ fontSize: 12, color: bandCfg.color, marginTop: 4 }}>{bandCfg.label}</p>
                  </div>

                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: BAND_CONFIG[simResult.band as Band]?.bg ?? 'var(--ts-bg-elevated)',
                      border: `1px solid ${BAND_CONFIG[simResult.band as Band]?.border ?? 'var(--ts-border)'}`,
                    }}
                  >
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--ts-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                      Simulated Score
                    </p>
                    <p
                      className="ts-mono"
                      style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: BAND_CONFIG[simResult.band as Band]?.color ?? 'var(--ts-fg-primary)',
                        margin: 0,
                      }}
                    >
                      {simResult.score}
                    </p>
                    <p style={{ fontSize: 12, color: BAND_CONFIG[simResult.band as Band]?.color, marginTop: 4 }}>
                      {BAND_CONFIG[simResult.band as Band]?.label ?? simResult.band}
                    </p>
                    {simResult.score !== score && (
                      <p
                        style={{
                          fontSize: 11,
                          color: simResult.score > score ? 'var(--ts-red-400)' : 'var(--ts-green-500)',
                          marginTop: 6,
                          fontWeight: 600,
                        }}
                      >
                        {simResult.score > score ? '+' : ''}{simResult.score - score} pts change
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Trend Table ───────────────────────────────────────────────────── */}
        <div className="premium-card" style={{ padding: 24 }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} color="var(--ts-blue-400)" />
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>
              Score History
            </h2>
          </div>

          {snapshots.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-10"
              style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}
            >
              <BarChart2 size={28} color="oklch(0.48 0 0)" style={{ marginBottom: 10 }} />
              <p style={{ fontWeight: 600, color: 'var(--ts-fg-secondary)', marginBottom: 4 }}>No history yet</p>
              <p>Risk score snapshots will appear here as they are calculated.</p>
            </div>
          ) : (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--ts-border)' }}
            >
              {/* Table header */}
              <div
                className="grid"
                style={{
                  gridTemplateColumns: '1fr 100px 100px',
                  padding: '10px 16px',
                  background: 'var(--ts-bg-elevated)',
                  borderBottom: '1px solid var(--ts-border)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--ts-fg-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                <div>Calculated At</div>
                <div style={{ textAlign: 'right' }}>Score</div>
                <div style={{ textAlign: 'right' }}>Band</div>
              </div>

              {snapshots.map((snap, i) => {
                const cfg = BAND_CONFIG[snap.band] ?? BAND_CONFIG.GREEN;
                return (
                  <div
                    key={snap.id}
                    className="grid"
                    style={{
                      gridTemplateColumns: '1fr 100px 100px',
                      padding: '10px 16px',
                      borderBottom: i < snapshots.length - 1 ? '1px solid var(--ts-border)' : 'none',
                      background: i % 2 === 0 ? 'var(--ts-bg-card)' : 'var(--ts-bg-base)',
                      fontSize: 13,
                    }}
                  >
                    <div style={{ color: 'var(--ts-fg-muted)', fontSize: 12 }}>
                      {formatDate(snap.calculatedAt)}
                    </div>
                    <div className="ts-mono" style={{ fontWeight: 700, color: cfg.color, textAlign: 'right' }}>
                      {snap.score}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                      >
                        {snap.band}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
