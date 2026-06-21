'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { TopRibbon } from '@/components/dashboard/TopRibbon';
import {
  BarChart3,
  Download,
  FileCheck,
  Clock,
  CheckCircle2,
  Lock,
  RefreshCw,
  History,
  FileJson,
  FileText,
  ChevronDown,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Report {
  id: string;
  title: string;
  type: 'COMPLIANCE' | 'AUDIT' | 'DE_MINIMIS' | 'SUBSTANCE';
  period: string;
  generatedAt: string;
  status: 'READY' | 'GENERATING' | 'PENDING';
  sizeKb?: number;
  endpoint?: string;
  taxPeriodId?: string | null;
}

interface HistoryItem {
  id: string;
  type: string;
  generatedAt: string;
  taxPeriodId: string | null;
  status: 'READY' | 'GENERATING' | 'FAILED';
  fileName?: string;
}

interface TaxPeriod {
  id: string;
  label: string;
  year: number;
  startDate: string;
  endDate: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  COMPLIANCE: { color: 'var(--ts-blue-400)', bg: 'oklch(0.55 0.22 260 / 0.1)', border: 'oklch(0.55 0.22 260 / 0.25)', label: 'Compliance Report' },
  AUDIT: { color: 'var(--ts-green-500)', bg: 'oklch(0.70 0.20 155 / 0.1)', border: 'oklch(0.70 0.20 155 / 0.25)', label: 'Audit Pack' },
  DE_MINIMIS: { color: 'var(--ts-amber-500)', bg: 'oklch(0.80 0.18 85 / 0.1)', border: 'oklch(0.80 0.18 85 / 0.25)', label: 'De-Minimis' },
  SUBSTANCE: { color: 'var(--ts-fg-muted)', bg: 'var(--ts-bg-elevated)', border: 'var(--ts-border)', label: 'Substance' },
  FTA_RETURN: { color: 'var(--ts-blue-500)', bg: 'oklch(0.55 0.22 260 / 0.1)', border: 'oklch(0.55 0.22 260 / 0.25)', label: 'FTA Return' },
  EXECUTIVE_SUMMARY: { color: 'var(--ts-green-500)', bg: 'oklch(0.70 0.20 155 / 0.1)', border: 'oklch(0.70 0.20 155 / 0.25)', label: 'Exec Summary' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function triggerBlobDownload(
  method: 'get' | 'post',
  url: string,
  body: object | undefined,
  filename: string,
  mime: string,
) {
  const res = await (method === 'post'
    ? api.post(url, body, { responseType: 'blob' })
    : api.get(url, { responseType: 'blob' }));
  const blob = new Blob([res.data], { type: mime });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function downloadReport(report: Report) {
  const url = (report.endpoint ?? '') + (report.taxPeriodId ? `?taxPeriodId=${report.taxPeriodId}` : '');
  await triggerBlobDownload(
    'get',
    url,
    undefined,
    `taxsentry-${report.id}-${new Date().toISOString().slice(0, 10)}.pdf`,
    'application/pdf',
  );
}

// ─── Tax Period Selector ──────────────────────────────────────────────────────

function TaxPeriodSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { data } = useQuery<{ periods: TaxPeriod[] }>({
    queryKey: ['tax-periods'],
    queryFn: () =>
      api
        .get('/tax-periods')
        .then((r) => r.data.data)
        .catch(() => ({ periods: [] })),
  });

  const periods = data?.periods ?? [];

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '7px 32px 7px 12px',
          background: 'var(--ts-bg-elevated)',
          border: '1px solid var(--ts-border)',
          borderRadius: 8,
          fontSize: 12,
          color: value ? 'var(--ts-fg-primary)' : 'var(--ts-fg-muted)',
          outline: 'none',
          appearance: 'none',
          cursor: 'pointer',
          minWidth: 180,
        }}
      >
        <option value="">Select tax period…</option>
        {periods.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label ?? `${p.year} (${p.startDate?.slice(0, 7)} – ${p.endDate?.slice(0, 7)})`}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ts-fg-muted)', pointerEvents: 'none' }}
      />
    </div>
  );
}

// ─── Report Row ───────────────────────────────────────────────────────────────

function ReportRow({ report }: { report: Report }) {
  const [loading, setLoading] = useState(false);
  const tc = TYPE_CONFIG[report.type] ?? TYPE_CONFIG.COMPLIANCE;
  const date = new Date(report.generatedAt);
  const dateStr = date.toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div
      className="flex items-center gap-4 rounded-[10px] transition-all"
      style={{ padding: '14px 16px', border: '1px solid var(--ts-border)', background: 'var(--ts-bg-card)' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.55 0.22 260 / 0.3)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--ts-border)'; }}
    >
      <div
        className="flex items-center justify-center flex-shrink-0 rounded-lg"
        style={{ width: 40, height: 40, background: tc.bg, border: `1px solid ${tc.border}` }}
      >
        {report.type === 'AUDIT' ? (
          <FileCheck size={18} color={tc.color} />
        ) : (
          <BarChart3 size={18} color={tc.color} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0, marginBottom: 2 }}>
          {report.title}
        </p>
        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}
          >
            {tc.label}
          </span>
          <span style={{ fontSize: 11, color: 'var(--ts-fg-muted)' }}>{report.period}</span>
          <span style={{ fontSize: 11, color: 'oklch(0.40 0 0)' }}>
            Generated {dateStr} at {timeStr}
          </span>
          {report.sizeKb && (
            <span style={{ fontSize: 11, color: 'oklch(0.40 0 0)' }}>
              {report.sizeKb >= 1000 ? `${(report.sizeKb / 1024).toFixed(1)} MB` : `${report.sizeKb} KB`}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {report.status === 'READY' ? (
          <button
            onClick={async () => {
              setLoading(true);
              try { await downloadReport(report); } finally { setLoading(false); }
            }}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all"
            style={{ background: 'var(--ts-bg-elevated)', color: 'var(--ts-fg-secondary)', border: '1px solid var(--ts-border)', cursor: loading ? 'not-allowed' : 'pointer' }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLElement).style.background = 'oklch(0.55 0.22 260 / 0.1)';
                (e.currentTarget as HTMLElement).style.color = 'var(--ts-blue-400)';
                (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.55 0.22 260 / 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--ts-bg-elevated)';
              (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-secondary)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--ts-border)';
            }}
          >
            {loading ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
            Download PDF
          </button>
        ) : report.status === 'GENERATING' ? (
          <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: 'var(--ts-amber-500)' }}>
            <RefreshCw size={13} className="animate-spin" />
            Generating…
          </div>
        ) : (
          <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: 'var(--ts-fg-muted)' }}>
            <Clock size={13} />
            Pending data
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Generate Card ────────────────────────────────────────────────────────────

function GenerateCard({
  icon: Icon,
  title,
  description,
  color,
  bg,
  border,
  buttonLabel,
  onGenerate,
  isLoading,
  needsPeriod,
  periodId,
  onPeriodChange,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  buttonLabel: string;
  onGenerate: () => void;
  isLoading: boolean;
  needsPeriod?: boolean;
  periodId?: string;
  onPeriodChange?: (v: string) => void;
}) {
  return (
    <div
      className="rounded-xl"
      style={{ background: bg, border: `1px solid ${border}`, padding: '18px 20px' }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ width: 36, height: 36, background: 'var(--ts-bg-card)', border: `1px solid ${border}` }}
        >
          <Icon size={18} color={color} />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0, marginBottom: 3 }}>
            {title}
          </p>
          <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0, lineHeight: 1.4 }}>
            {description}
          </p>
        </div>
      </div>

      {needsPeriod && onPeriodChange !== undefined && (
        <div style={{ marginBottom: 12 }}>
          <TaxPeriodSelector value={periodId ?? ''} onChange={onPeriodChange} />
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={isLoading || (needsPeriod && !periodId)}
        className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-bold transition-all"
        style={{
          background: isLoading || (needsPeriod && !periodId) ? 'var(--ts-bg-elevated)' : color,
          color: isLoading || (needsPeriod && !periodId) ? 'var(--ts-fg-muted)' : 'white',
          border: 'none',
          cursor: isLoading || (needsPeriod && !periodId) ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
        {buttonLabel}
      </button>
    </div>
  );
}

// ─── History Row ──────────────────────────────────────────────────────────────

function HistoryRow({ item }: { item: HistoryItem }) {
  const tc = TYPE_CONFIG[item.type] ?? { color: 'var(--ts-fg-muted)', bg: 'var(--ts-bg-elevated)', border: 'var(--ts-border)', label: item.type };
  const date = new Date(item.generatedAt).toLocaleDateString('en-AE', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const statusColor =
    item.status === 'READY'
      ? 'var(--ts-green-500)'
      : item.status === 'FAILED'
      ? 'var(--ts-red-400)'
      : 'var(--ts-amber-500)';

  return (
    <div
      className="flex items-center gap-4 rounded-[10px]"
      style={{ padding: '12px 16px', border: '1px solid var(--ts-border)', background: 'var(--ts-bg-card)' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}
          >
            {tc.label}
          </span>
          {item.taxPeriodId && (
            <span style={{ fontSize: 11, color: 'var(--ts-fg-muted)' }}>
              Period: {item.taxPeriodId}
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'oklch(0.40 0 0)', margin: 0 }}>{date}</p>
      </div>
      <span
        className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
        style={{ color: statusColor, background: `${statusColor}18`, border: `1px solid ${statusColor}40`, flexShrink: 0 }}
      >
        {item.status}
      </span>
      {item.fileName && (
        <span style={{ fontSize: 11, color: 'var(--ts-fg-muted)', flexShrink: 0 }}>{item.fileName}</span>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'reports' | 'generate' | 'history'>('reports');
  const [ftaPeriodId, setFtaPeriodId] = useState('');
  const [execPeriodId, setExecPeriodId] = useState('');
  const [generating, setGenerating] = useState(false);

  // ─ Queries ─────────────────────────────────────────────────────────────────

  const { data: reportsData } = useQuery({
    queryKey: ['reports'],
    queryFn: () => api.get('/reports').then((r) => r.data.data).catch(() => null),
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['reports-history'],
    queryFn: () =>
      api
        .get('/reports/history')
        .then((r) => r.data.data)
        .catch(() => ({ history: [] })),
    enabled: activeTab === 'history',
  });

  // ─ Mutations ────────────────────────────────────────────────────────────────

  const ftaMutation = useMutation({
    mutationFn: async (taxPeriodId: string) => {
      await triggerBlobDownload(
        'post',
        `/reports/fta-return?taxPeriodId=${taxPeriodId}`,
        { taxPeriodId },
        `fta-return-${new Date().toISOString().slice(0, 10)}.json`,
        'application/json',
      );
    },
  });

  const execMutation = useMutation({
    mutationFn: async (taxPeriodId: string) => {
      await triggerBlobDownload(
        'post',
        `/reports/executive-summary?taxPeriodId=${taxPeriodId}`,
        { taxPeriodId },
        `executive-summary-${new Date().toISOString().slice(0, 10)}.pdf`,
        'application/pdf',
      );
    },
  });

  // ─ Derived ─────────────────────────────────────────────────────────────────

  const reports: Report[] = reportsData?.reports ?? [];
  const historyItems: HistoryItem[] = historyData?.history ?? [];

  const TABS = [
    { id: 'reports', label: 'Available Reports' },
    { id: 'generate', label: 'Generate' },
    { id: 'history', label: 'History' },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--ts-bg-base)' }}>
      <TopRibbon />

      <div className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={18} color="var(--ts-blue-500)" />
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}>
                Compliance Reports
              </h1>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)', margin: 0 }}>
              FTA-ready audit packs and compliance summaries for UAE QFZP requirements.
            </p>
          </div>

          <button
            onClick={() => {
              const pack = reports.find((r) => r.id === 'classification-pack');
              if (pack && pack.status === 'READY') {
                setGenerating(true);
                downloadReport(pack).finally(() => setGenerating(false));
              }
            }}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all"
            style={{
              background: generating ? 'var(--ts-bg-elevated)' : 'var(--ts-blue-500)',
              color: generating ? 'var(--ts-fg-muted)' : 'white',
              border: 'none',
              cursor: generating ? 'default' : 'pointer',
            }}
          >
            {generating ? (
              <><RefreshCw size={14} className="animate-spin" /> Generating…</>
            ) : (
              <><FileCheck size={14} /> Generate New Report</>
            )}
          </button>
        </div>

        {/* Report type info cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(TYPE_CONFIG)
            .filter(([k]) => ['COMPLIANCE', 'AUDIT', 'DE_MINIMIS', 'SUBSTANCE'].includes(k))
            .map(([type, tc]) => (
              <div
                key={type}
                className="rounded-xl"
                style={{ background: tc.bg, border: `1px solid ${tc.border}`, padding: '14px 16px' }}
              >
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: tc.color, marginBottom: 4 }}>
                  {tc.label}
                </p>
                <p style={{ fontSize: 11, color: 'var(--ts-fg-muted)', lineHeight: 1.4, margin: 0 }}>
                  {type === 'AUDIT' && 'Complete FTA audit documentation package.'}
                  {type === 'COMPLIANCE' && 'Quarterly QFZP compliance summary report.'}
                  {type === 'DE_MINIMIS' && 'De-minimis threshold analysis and projections.'}
                  {type === 'SUBSTANCE' && 'Economic substance requirements assessment.'}
                </p>
              </div>
            ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1" style={{ borderBottom: '1px solid var(--ts-border)', paddingBottom: 0 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-all"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: activeTab === tab.id ? 'var(--ts-blue-400)' : 'var(--ts-fg-muted)',
                borderBottom: activeTab === tab.id ? '2px solid var(--ts-blue-500)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {tab.id === 'history' && <History size={13} />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Available Reports */}
        {activeTab === 'reports' && (
          <div className="premium-card" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>
                Available Reports
              </h2>
              <div className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'oklch(0.40 0 0)' }}>
                <Lock size={11} />
                Encrypted · Immutable audit log
              </div>
            </div>

            <div className="space-y-2.5">
              {reports.map((r) => (
                <ReportRow key={r.id} report={r} />
              ))}
            </div>

            {reports.length === 0 && (
              <div
                className="flex flex-col items-center justify-center py-12"
                style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}
              >
                <CheckCircle2 size={32} color="oklch(0.48 0 0)" style={{ marginBottom: 12 }} />
                <p style={{ fontWeight: 600, color: 'var(--ts-fg-secondary)', marginBottom: 4 }}>No reports yet</p>
                <p>Upload transactions and generate your first compliance pack.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Generate */}
        {activeTab === 'generate' && (
          <div className="space-y-4">
            <div className="premium-card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: '0 0 16px' }}>
                Generate On-Demand Reports
              </h2>
              <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 20 }}>
                Select a tax period and generate FTA-compliant reports. Downloads begin immediately after generation.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <GenerateCard
                  icon={FileJson}
                  title="FTA Annual Return"
                  description="Generates the FTA-format annual return JSON file for submission to the Federal Tax Authority."
                  color="var(--ts-blue-500)"
                  bg="oklch(0.55 0.22 260 / 0.08)"
                  border="oklch(0.55 0.22 260 / 0.25)"
                  buttonLabel="Download JSON"
                  needsPeriod
                  periodId={ftaPeriodId}
                  onPeriodChange={setFtaPeriodId}
                  isLoading={ftaMutation.isPending}
                  onGenerate={() => {
                    if (ftaPeriodId) ftaMutation.mutate(ftaPeriodId);
                  }}
                />

                <GenerateCard
                  icon={FileText}
                  title="Executive Summary"
                  description="High-level compliance summary for board and executive review. Covers QFZP status, risk score, and key metrics."
                  color="var(--ts-green-500)"
                  bg="oklch(0.70 0.20 155 / 0.08)"
                  border="oklch(0.70 0.20 155 / 0.25)"
                  buttonLabel="Download Summary"
                  needsPeriod
                  periodId={execPeriodId}
                  onPeriodChange={setExecPeriodId}
                  isLoading={execMutation.isPending}
                  onGenerate={() => {
                    if (execPeriodId) execMutation.mutate(execPeriodId);
                  }}
                />
              </div>

              {(ftaMutation.isError || execMutation.isError) && (
                <div
                  className="rounded-xl p-4 mt-4"
                  style={{ background: 'oklch(0.65 0.20 25 / 0.08)', border: '1px solid oklch(0.65 0.20 25 / 0.25)', fontSize: 13, color: 'var(--ts-red-400)' }}
                >
                  Report generation failed. Please check your connection and try again.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: History */}
        {activeTab === 'history' && (
          <div className="premium-card" style={{ padding: 24 }}>
            <div className="flex items-center gap-2 mb-4">
              <History size={16} color="var(--ts-blue-400)" />
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>
                Report History
              </h2>
            </div>
            <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 16 }}>
              All previously generated reports, including status and associated tax period.
            </p>

            {historyLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-lg"
                    style={{ height: 56, background: 'var(--ts-bg-elevated)' }}
                  />
                ))}
              </div>
            ) : historyItems.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-12"
                style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}
              >
                <History size={28} color="oklch(0.48 0 0)" style={{ marginBottom: 10 }} />
                <p style={{ fontWeight: 600, color: 'var(--ts-fg-secondary)', marginBottom: 4 }}>No report history</p>
                <p>Generated reports will appear here with their status and metadata.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {historyItems.map((item) => (
                  <HistoryRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
