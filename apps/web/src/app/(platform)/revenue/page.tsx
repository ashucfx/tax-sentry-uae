'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  RefreshCw,
  CheckSquare,
  Square,
  X,
  ClipboardCheck,
} from 'lucide-react';
import Link from 'next/link';

function formatAed(v: number) {
  if (v >= 1_000_000) return `AED ${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `AED ${(v / 1_000).toFixed(0)}K`;
  return `AED ${v}`;
}

function formatAedFull(v: number) {
  return `AED ${v.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Classification = 'QI' | 'NQI' | 'EXCLUDED' | 'UNCLASSIFIED';

type ReasonCode =
  | 'MANUAL_REVIEW'
  | 'AUDITOR_INSTRUCTION'
  | 'TREATY_APPLICATION'
  | 'ACTIVITY_CHANGE'
  | 'OTHER';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  counterparty: string;
  description: string;
  classification: Classification;
  requiresReview?: boolean;
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

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

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

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

// ─── Bulk Classify Modal ─────────────────────────────────────────────────────

const REASON_CODES: { value: ReasonCode; label: string }[] = [
  { value: 'MANUAL_REVIEW', label: 'Manual Review' },
  { value: 'AUDITOR_INSTRUCTION', label: 'Auditor Instruction' },
  { value: 'TREATY_APPLICATION', label: 'Treaty Application' },
  { value: 'ACTIVITY_CHANGE', label: 'Activity Change' },
  { value: 'OTHER', label: 'Other' },
];

const CLASS_LABELS: Record<Classification, string> = {
  QI: 'Qualifying Income',
  NQI: 'Non-Qualifying Income',
  EXCLUDED: 'Excluded',
  UNCLASSIFIED: 'Unclassified',
};

const CLASS_COLORS: Record<Classification, string> = {
  QI: 'var(--ts-green-500)',
  NQI: 'var(--ts-amber-500)',
  EXCLUDED: 'var(--ts-fg-muted)',
  UNCLASSIFIED: 'var(--ts-blue-400)',
};

function BulkClassifyModal({
  classification,
  count,
  onClose,
  onSubmit,
  isPending,
}: {
  classification: Classification;
  count: number;
  onClose: () => void;
  onSubmit: (reasonCode: ReasonCode, reasonText: string) => void;
  isPending: boolean;
}) {
  const [reasonCode, setReasonCode] = useState<ReasonCode>('MANUAL_REVIEW');
  const [reasonText, setReasonText] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reasonText.trim()) return;
    onSubmit(reasonCode, reasonText.trim());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'oklch(0 0 0 / 0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl"
        style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)', padding: 28 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1"
          style={{ color: 'var(--ts-fg-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>

        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: '0 0 4px' }}>
          Bulk Classify as{' '}
          <span style={{ color: CLASS_COLORS[classification] }}>{CLASS_LABELS[classification]}</span>
        </h3>
        <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 20 }}>
          Applying to {count} selected transaction{count !== 1 ? 's' : ''}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="reasonCode"
              style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ts-fg-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              Reason Code
            </label>
            <select
              id="reasonCode"
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value as ReasonCode)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--ts-bg-elevated)',
                border: '1px solid var(--ts-border)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--ts-fg-primary)',
                outline: 'none',
              }}
            >
              {REASON_CODES.map((rc) => (
                <option key={rc.value} value={rc.value}>{rc.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="reasonText"
              style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ts-fg-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              Reason Description <span style={{ color: 'var(--ts-red-400)' }}>*</span>
            </label>
            <textarea
              id="reasonText"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              required
              placeholder="Describe why these transactions are being reclassified…"
              rows={4}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--ts-bg-elevated)',
                border: '1px solid var(--ts-border)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--ts-fg-primary)',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'var(--font-sans)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending || !reasonText.trim()}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold"
              style={{
                background: isPending || !reasonText.trim() ? 'var(--ts-bg-elevated)' : 'var(--ts-blue-500)',
                color: isPending || !reasonText.trim() ? 'var(--ts-fg-muted)' : 'white',
                border: 'none',
                cursor: isPending || !reasonText.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending && <RefreshCw size={13} className="animate-spin" />}
              Apply Classification
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--ts-border)',
                borderRadius: 10,
                padding: '8px 16px',
                fontSize: 13,
                color: 'var(--ts-fg-muted)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Floating Action Bar ─────────────────────────────────────────────────────

function FloatingActionBar({
  count,
  onClassify,
  onClear,
}: {
  count: number;
  onClassify: (cls: Classification) => void;
  onClear: () => void;
}) {
  if (count === 0) return null;

  const buttons: { cls: Classification; short: string; color: string; border: string; bg: string }[] = [
    { cls: 'QI', short: 'QI', color: 'var(--ts-green-500)', border: 'oklch(0.70 0.20 155 / 0.4)', bg: 'oklch(0.70 0.20 155 / 0.12)' },
    { cls: 'NQI', short: 'NQI', color: 'var(--ts-amber-500)', border: 'oklch(0.80 0.18 85 / 0.4)', bg: 'oklch(0.80 0.18 85 / 0.12)' },
    { cls: 'EXCLUDED', short: 'EXCL', color: 'var(--ts-fg-muted)', border: 'var(--ts-border)', bg: 'var(--ts-bg-elevated)' },
    { cls: 'UNCLASSIFIED', short: 'UNCL', color: 'var(--ts-blue-400)', border: 'oklch(0.55 0.22 260 / 0.4)', bg: 'oklch(0.55 0.22 260 / 0.12)' },
  ];

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl px-5 py-3 shadow-2xl"
      style={{
        background: 'var(--ts-bg-card)',
        border: '1px solid var(--ts-border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts-fg-primary)', whiteSpace: 'nowrap' }}>
        {count} selected — Classify as:
      </span>
      <div className="flex items-center gap-2">
        {buttons.map((b) => (
          <button
            key={b.cls}
            onClick={() => onClassify(b.cls)}
            className="rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all"
            style={{ background: b.bg, color: b.color, border: `1px solid ${b.border}`, cursor: 'pointer' }}
          >
            {b.short}
          </button>
        ))}
      </div>
      <button
        onClick={onClear}
        className="rounded-lg p-1.5 ml-1 transition-all"
        style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)', color: 'var(--ts-fg-muted)', cursor: 'pointer' }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Transaction Row ─────────────────────────────────────────────────────────

function TransactionRow({
  tx,
  selected,
  onToggle,
}: {
  tx: Transaction;
  selected: boolean;
  onToggle: () => void;
}) {
  const cls = tx.classification;
  const clsColor = CLASS_COLORS[cls] ?? 'var(--ts-fg-muted)';
  const date = new Date(tx.date).toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div
      className="flex items-center gap-4"
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        border: `1px solid ${selected ? 'oklch(0.55 0.22 260 / 0.35)' : 'var(--ts-border)'}`,
        background: selected ? 'oklch(0.55 0.22 260 / 0.05)' : 'var(--ts-bg-card)',
        cursor: 'pointer',
      }}
      onClick={onToggle}
    >
      <div style={{ flexShrink: 0, color: selected ? 'var(--ts-blue-500)' : 'var(--ts-fg-muted)' }}>
        {selected ? <CheckSquare size={16} /> : <Square size={16} />}
      </div>
      <div style={{ width: 90, flexShrink: 0, fontSize: 12, color: 'var(--ts-fg-muted)' }}>{date}</div>
      <div className="ts-mono" style={{ width: 130, flexShrink: 0, fontSize: 13, fontWeight: 600, color: 'var(--ts-fg-primary)' }}>
        {formatAedFull(tx.amount)}
      </div>
      <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'var(--ts-fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {tx.counterparty}
      </div>
      <div style={{ flex: 1.5, minWidth: 0, fontSize: 12, color: 'var(--ts-fg-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {tx.description}
      </div>
      <div
        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
        style={{ color: clsColor, background: `${clsColor.replace('var', '').replace('(', '').replace(')', '')}15`, border: `1px solid ${clsColor}30`, flexShrink: 0 }}
      >
        {cls}
      </div>
    </div>
  );
}

// ─── Review Queue Row ─────────────────────────────────────────────────────────

function ReviewQueueRow({
  tx,
  onResolve,
  isPending,
}: {
  tx: Transaction;
  onResolve: (id: string) => void;
  isPending: boolean;
}) {
  const clsColor = CLASS_COLORS[tx.classification] ?? 'var(--ts-fg-muted)';
  const date = new Date(tx.date).toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div
      className="flex items-center gap-4"
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        border: '1px solid oklch(0.80 0.18 85 / 0.25)',
        background: 'oklch(0.80 0.18 85 / 0.04)',
      }}
    >
      <div style={{ width: 90, flexShrink: 0, fontSize: 12, color: 'var(--ts-fg-muted)' }}>{date}</div>
      <div className="ts-mono" style={{ width: 130, flexShrink: 0, fontSize: 13, fontWeight: 600, color: 'var(--ts-fg-primary)' }}>
        {formatAedFull(tx.amount)}
      </div>
      <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'var(--ts-fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {tx.counterparty}
      </div>
      <div style={{ flex: 1.5, minWidth: 0, fontSize: 12, color: 'var(--ts-fg-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {tx.description}
      </div>
      <div
        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
        style={{ color: clsColor, flexShrink: 0, border: '1px solid transparent' }}
      >
        {tx.classification}
      </div>
      <button
        onClick={() => onResolve(tx.id)}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium"
        style={{
          background: 'oklch(0.70 0.20 155 / 0.12)',
          color: 'var(--ts-green-500)',
          border: '1px solid oklch(0.70 0.20 155 / 0.3)',
          cursor: isPending ? 'not-allowed' : 'pointer',
          flexShrink: 0,
        }}
      >
        {isPending ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
        Resolve
      </button>
    </div>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl px-5 py-3 shadow-xl"
      style={{ background: 'var(--ts-bg-card)', border: '1px solid oklch(0.70 0.20 155 / 0.4)', minWidth: 260 }}
    >
      <CheckCircle2 size={16} color="var(--ts-green-500)" />
      <span style={{ fontSize: 13, color: 'var(--ts-fg-primary)' }}>{message}</span>
      <button
        onClick={onDismiss}
        style={{ background: 'transparent', border: 'none', color: 'var(--ts-fg-muted)', cursor: 'pointer', marginLeft: 'auto' }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RevenuePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'review'>('overview');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkClassifyTarget, setBulkClassifyTarget] = useState<Classification | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // ─ Queries ─────────────────────────────────────────────────────────────────

  const { data: dmData } = useQuery({
    queryKey: ['deminimis-status'],
    queryFn: () => api.get('/deminimis/status').then((r) => r.data.data),
  });

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['deminimis-history'],
    queryFn: () => api.get('/deminimis/history').then((r) => r.data.data),
  });

  const { data: txData } = useQuery({
    queryKey: ['revenue-transactions'],
    queryFn: () =>
      api
        .get('/revenue/transactions')
        .then((r) => r.data.data)
        .catch(() => ({ transactions: [] })),
    enabled: activeTab === 'transactions',
  });

  const { data: reviewData } = useQuery({
    queryKey: ['revenue-review-queue'],
    queryFn: () =>
      api
        .get('/revenue/transactions/review-queue')
        .then((r) => r.data.data)
        .catch(() => ({ transactions: [] })),
  });

  // ─ Mutations ────────────────────────────────────────────────────────────────

  const resolveMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/revenue/transactions/${id}/review`, { resolved: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-review-queue'] });
      showToast('Transaction resolved');
    },
  });

  const bulkClassifyMutation = useMutation({
    mutationFn: ({
      transactionIds,
      classification,
      reasonCode,
      reasonText,
    }: {
      transactionIds: string[];
      classification: Classification;
      reasonCode: ReasonCode;
      reasonText: string;
    }) =>
      api.post('/revenue/transactions/bulk-classify', {
        transactionIds,
        classification,
        reasonCode,
        reasonText,
      }),
    onSuccess: (_data, vars) => {
      setSelectedIds(new Set());
      setBulkClassifyTarget(null);
      queryClient.invalidateQueries({ queryKey: ['revenue-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['deminimis-history'] });
      showToast(`Classified ${vars.transactionIds.length} transaction${vars.transactionIds.length !== 1 ? 's' : ''} as ${vars.classification}`);
    },
  });

  const reclassifyAllMutation = useMutation({
    mutationFn: () =>
      api.post('/revenue/transactions/reclassify-all', { taxPeriodId: undefined }).then((r) => r.data.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['revenue-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['deminimis-history'] });
      queryClient.invalidateQueries({ queryKey: ['deminimis-status'] });
      const count = data?.count ?? data?.reclassified ?? 0;
      showToast(`Reclassified ${count} transaction${count !== 1 ? 's' : ''}`);
    },
  });

  // ─ Helpers ─────────────────────────────────────────────────────────────────

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function toggleAll(txList: Transaction[]) {
    if (selectedIds.size === txList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(txList.map((t) => t.id)));
    }
  }

  // ─ Derived data ────────────────────────────────────────────────────────────

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

  const transactions: Transaction[] = txData?.transactions ?? [];
  const reviewQueue: Transaction[] = reviewData?.transactions ?? [];
  const reviewCount = reviewQueue.length;

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'review', label: 'Review Queue', badge: reviewCount > 0 ? reviewCount : null },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--ts-bg-base)' }}>
      <TopRibbon />

      <div className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div style={{ marginBottom: 0 }}>
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

          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => reclassifyAllMutation.mutate()}
              disabled={reclassifyAllMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all"
              style={{
                background: 'var(--ts-bg-elevated)',
                color: reclassifyAllMutation.isPending ? 'var(--ts-fg-muted)' : 'var(--ts-fg-secondary)',
                border: '1px solid var(--ts-border)',
                cursor: reclassifyAllMutation.isPending ? 'not-allowed' : 'pointer',
              }}
            >
              {reclassifyAllMutation.isPending ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              Re-classify All
            </button>
            <Link
              href="/transactions"
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-medium"
              style={{ background: 'var(--ts-bg-elevated)', color: 'var(--ts-fg-muted)', border: '1px solid var(--ts-border)' }}
            >
              Import CSV <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

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

        {/* Tabs */}
        <div className="flex items-center gap-1" style={{ borderBottom: '1px solid var(--ts-border)', paddingBottom: 0 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-all relative"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: activeTab === tab.id ? 'var(--ts-blue-400)' : 'var(--ts-fg-muted)',
                borderBottom: activeTab === tab.id ? '2px solid var(--ts-blue-500)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {tab.label}
              {'badge' in tab && tab.badge != null && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ background: 'oklch(0.80 0.18 85 / 0.2)', color: 'var(--ts-amber-500)', minWidth: 18, textAlign: 'center' }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <>
            {/* Monthly bar chart */}
            <div className="premium-card" style={{ padding: 24 }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>
                    Monthly Revenue Breakdown
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0, marginTop: 3 }}>
                    Classification by income type across tax period
                  </p>
                </div>
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
          </>
        )}

        {/* Tab: Transactions (with checkboxes + bulk select) */}
        {activeTab === 'transactions' && (
          <div className="premium-card" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>
                Transactions
              </h2>
              {transactions.length > 0 && (
                <button
                  onClick={() => toggleAll(transactions)}
                  className="flex items-center gap-1.5 text-[12px]"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ts-fg-muted)' }}
                >
                  {selectedIds.size === transactions.length ? (
                    <><CheckSquare size={14} /> Deselect all</>
                  ) : (
                    <><Square size={14} /> Select all</>
                  )}
                </button>
              )}
            </div>

            {/* Column headers */}
            <div className="flex items-center gap-4 mb-2" style={{ padding: '0 14px', fontSize: 11, fontWeight: 600, color: 'var(--ts-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              <div style={{ width: 16, flexShrink: 0 }} />
              <div style={{ width: 90, flexShrink: 0 }}>Date</div>
              <div style={{ width: 130, flexShrink: 0 }}>Amount</div>
              <div style={{ flex: 1 }}>Counterparty</div>
              <div style={{ flex: 1.5 }}>Description</div>
              <div style={{ width: 90, flexShrink: 0 }}>Class.</div>
            </div>

            <div className="space-y-1.5">
              {transactions.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-12"
                  style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}
                >
                  <ClipboardCheck size={28} color="oklch(0.48 0 0)" style={{ marginBottom: 10 }} />
                  <p style={{ fontWeight: 600, color: 'var(--ts-fg-secondary)', marginBottom: 4 }}>No transactions</p>
                  <p>Import a CSV to populate your transaction list.</p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    selected={selectedIds.has(tx.id)}
                    onToggle={() => toggleSelect(tx.id)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab: Review Queue */}
        {activeTab === 'review' && (
          <div className="premium-card" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>
                  Review Queue
                </h2>
                <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0, marginTop: 3 }}>
                  Transactions flagged for manual review before finalisation
                </p>
              </div>
              {reviewCount > 0 && (
                <span
                  className="rounded-full px-3 py-1 text-[12px] font-bold"
                  style={{ background: 'oklch(0.80 0.18 85 / 0.15)', color: 'var(--ts-amber-500)', border: '1px solid oklch(0.80 0.18 85 / 0.3)' }}
                >
                  {reviewCount} pending
                </span>
              )}
            </div>

            {/* Column headers */}
            <div className="flex items-center gap-4 mb-2" style={{ padding: '0 14px', fontSize: 11, fontWeight: 600, color: 'var(--ts-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              <div style={{ width: 90, flexShrink: 0 }}>Date</div>
              <div style={{ width: 130, flexShrink: 0 }}>Amount</div>
              <div style={{ flex: 1 }}>Counterparty</div>
              <div style={{ flex: 1.5 }}>Description</div>
              <div style={{ width: 80, flexShrink: 0 }}>Class.</div>
              <div style={{ width: 90, flexShrink: 0 }}>Action</div>
            </div>

            <div className="space-y-1.5">
              {reviewQueue.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-12"
                  style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}
                >
                  <CheckCircle2 size={28} color="var(--ts-green-500)" style={{ marginBottom: 10 }} />
                  <p style={{ fontWeight: 600, color: 'var(--ts-fg-secondary)', marginBottom: 4 }}>Review queue is clear</p>
                  <p>No transactions require manual review at this time.</p>
                </div>
              ) : (
                reviewQueue.map((tx) => (
                  <ReviewQueueRow
                    key={tx.id}
                    tx={tx}
                    onResolve={(id) => resolveMutation.mutate(id)}
                    isPending={resolveMutation.isPending && resolveMutation.variables === tx.id}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <FloatingActionBar
        count={selectedIds.size}
        onClassify={(cls) => setBulkClassifyTarget(cls)}
        onClear={() => setSelectedIds(new Set())}
      />

      {/* Bulk Classify Modal */}
      {bulkClassifyTarget && (
        <BulkClassifyModal
          classification={bulkClassifyTarget}
          count={selectedIds.size}
          onClose={() => setBulkClassifyTarget(null)}
          isPending={bulkClassifyMutation.isPending}
          onSubmit={(reasonCode, reasonText) => {
            bulkClassifyMutation.mutate({
              transactionIds: Array.from(selectedIds),
              classification: bulkClassifyTarget,
              reasonCode,
              reasonText,
            });
          }}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
