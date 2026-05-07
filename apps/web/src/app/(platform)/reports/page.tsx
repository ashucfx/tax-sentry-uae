'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { TopRibbon } from '@/components/dashboard/TopRibbon';
import { BarChart3, Download, FileCheck, Clock, CheckCircle2, Lock, RefreshCw } from 'lucide-react';

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

const TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  COMPLIANCE: { color: 'var(--ts-blue-400)', bg: 'oklch(0.55 0.22 260 / 0.1)', border: 'oklch(0.55 0.22 260 / 0.25)', label: 'Compliance Report' },
  AUDIT: { color: 'var(--ts-green-500)', bg: 'oklch(0.70 0.20 155 / 0.1)', border: 'oklch(0.70 0.20 155 / 0.25)', label: 'Audit Pack' },
  DE_MINIMIS: { color: 'var(--ts-amber-500)', bg: 'oklch(0.80 0.18 85 / 0.1)', border: 'oklch(0.80 0.18 85 / 0.25)', label: 'De-Minimis' },
  SUBSTANCE: { color: 'var(--ts-fg-muted)', bg: 'var(--ts-bg-elevated)', border: 'var(--ts-border)', label: 'Substance' },
};

const SAMPLE_REPORTS: Report[] = [
  { id: '1', title: 'Q1 2026 FTA-Ready Compliance Pack', type: 'AUDIT', period: 'Jan–Mar 2026', generatedAt: '2026-04-01T09:00:00Z', status: 'READY', sizeKb: 840 },
  { id: '2', title: 'Q1 2026 De-Minimis Threshold Report', type: 'DE_MINIMIS', period: 'Jan–Mar 2026', generatedAt: '2026-04-01T09:15:00Z', status: 'READY', sizeKb: 212 },
  { id: '3', title: 'FY 2025 Annual Compliance Summary', type: 'COMPLIANCE', period: 'Full Year 2025', generatedAt: '2026-01-15T11:00:00Z', status: 'READY', sizeKb: 1840 },
  { id: '4', title: 'FY 2025 Substance Requirements Report', type: 'SUBSTANCE', period: 'Full Year 2025', generatedAt: '2026-01-15T11:20:00Z', status: 'READY', sizeKb: 430 },
];

async function downloadReport(report: Report) {
  const { api } = await import('@/lib/api/client');
  const url = report.endpoint + (report.taxPeriodId ? `?taxPeriodId=${report.taxPeriodId}` : '');
  try {
    const res = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `taxsentry-${report.id}-${new Date().toISOString().slice(0, 10)}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch {
    alert('Report generation failed. Please try again.');
  }
}

function ReportRow({ report }: { report: Report }) {
  const tc = TYPE_CONFIG[report.type];
  const date = new Date(report.generatedAt);
  const dateStr = date.toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div
      className="flex items-center gap-4 rounded-[10px] transition-all"
      style={{ padding: '14px 16px', border: '1px solid var(--ts-border)', background: 'var(--ts-bg-card)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.55 0.22 260 / 0.3)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--ts-border)'; }}
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
            onClick={() => downloadReport(report)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all"
            style={{ background: 'var(--ts-bg-elevated)', color: 'var(--ts-fg-secondary)', border: '1px solid var(--ts-border)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'oklch(0.55 0.22 260 / 0.1)';
              (e.currentTarget as HTMLElement).style.color = 'var(--ts-blue-400)';
              (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.55 0.22 260 / 0.3)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--ts-bg-elevated)';
              (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-secondary)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--ts-border)';
            }}
          >
            <Download size={13} />
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

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);

  const { data: reportsData } = useQuery({
    queryKey: ['reports'],
    queryFn: () => api.get('/reports').then((r) => r.data.data).catch(() => null),
  });

  const reports: Report[] = reportsData?.reports ?? SAMPLE_REPORTS;

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

        {/* Report types info */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(TYPE_CONFIG).map(([type, tc]) => (
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

        {/* Report list */}
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
      </div>
    </div>
  );
}
