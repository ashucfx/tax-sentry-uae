'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { TopRibbon } from '@/components/dashboard/TopRibbon';
import { ArrowUpDown, Upload, X, CheckCircle2, AlertCircle, Edit2 } from 'lucide-react';

const CLASS_COLORS: Record<string, string> = {
  QI: 'var(--ts-green-500)',
  NQI: 'var(--ts-amber-500)',
  EXCLUDED: 'oklch(0.55 0.22 260)',
  UNCLASSIFIED: 'var(--ts-fg-muted)',
};

function CsvImportDialog({
  taxPeriodId,
  onClose,
}: {
  taxPeriodId: string | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ imported: number; errors: any[] } | null>(null);

  const importMutation = useMutation({
    mutationFn: async (f: File) => {
      const form = new FormData();
      form.append('file', f);
      const url = `/revenue/transactions/csv-import${taxPeriodId ? `?taxPeriodId=${taxPeriodId}` : ''}`;
      const res = await api.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data?.data ?? res.data;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['transactions-page'] });
      queryClient.invalidateQueries({ queryKey: ['deminimis-status'] });
      queryClient.invalidateQueries({ queryKey: ['risk-score'] });
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="premium-card w-full max-w-lg" style={{ padding: 32, margin: 20 }}>
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}>
            Import CSV Transactions
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ts-fg-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {!result ? (
          <>
            <div
              className="rounded-xl text-center"
              style={{
                padding: '32px 20px', border: '2px dashed var(--ts-border)', background: 'var(--ts-bg-elevated)',
                cursor: 'pointer', marginBottom: 20,
              }}
              onClick={() => document.getElementById('csv-input')?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f?.name.endsWith('.csv')) setFile(f);
              }}
            >
              <Upload size={28} color="var(--ts-fg-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts-fg-primary)', marginBottom: 4 }}>
                {file ? file.name : 'Drop CSV file here or click to browse'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0 }}>
                Required columns: date, amount_aed, counterparty<br />
                Optional: activity_code, counterparty_type, invoice_no, description
              </p>
              <input id="csv-input" type="file" accept=".csv" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
            </div>

            {!taxPeriodId && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'oklch(0.80 0.18 85 / 0.1)', border: '1px solid oklch(0.80 0.18 85 / 0.3)', fontSize: 12, color: 'var(--ts-amber-500)', marginBottom: 16 }}>
                No active tax period found. Complete onboarding first.
              </div>
            )}

            {importMutation.isError && (
              <p style={{ fontSize: 12, color: 'var(--ts-red-500)', marginBottom: 12 }}>
                Import failed. Please check your file format and try again.
              </p>
            )}

            <button
              disabled={!file || !taxPeriodId || importMutation.isPending}
              onClick={() => file && importMutation.mutate(file)}
              className="w-full rounded-xl font-bold transition-all"
              style={{
                padding: '12px 24px', fontSize: 14,
                background: !file || !taxPeriodId ? 'var(--ts-bg-elevated)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: !file || !taxPeriodId ? 'var(--ts-fg-muted)' : 'white',
                border: 'none', cursor: !file || !taxPeriodId ? 'not-allowed' : 'pointer',
                opacity: importMutation.isPending ? 0.7 : 1,
              }}
            >
              {importMutation.isPending ? 'Importing…' : 'Import Transactions'}
            </button>
          </>
        ) : (
          <div className="text-center">
            <CheckCircle2 size={40} color="var(--ts-green-500)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ts-fg-primary)', marginBottom: 4 }}>
              {result.imported} transactions imported
            </p>
            {result.errors?.length > 0 && (
              <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'oklch(0.62 0.24 25 / 0.08)', border: '1px solid oklch(0.62 0.24 25 / 0.2)', textAlign: 'left' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ts-red-500)', marginBottom: 6 }}>
                  {result.errors.length} rows skipped:
                </p>
                {result.errors.slice(0, 5).map((e: any, i: number) => (
                  <p key={i} style={{ fontSize: 11, color: 'var(--ts-fg-muted)', margin: '2px 0' }}>
                    Row {e.row}: {e.error}
                  </p>
                ))}
              </div>
            )}
            <button
              onClick={onClose}
              className="mt-4 rounded-xl px-6 py-2.5 text-sm font-bold"
              style={{ background: 'var(--ts-blue-500)', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ClassifyDialog({
  transaction,
  onClose,
}: {
  transaction: any;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [classification, setClassification] = useState<'QI' | 'NQI' | 'EXCLUDED'>('QI');
  const [reasonCode, setReasonCode] = useState('MANUAL_REVIEW');
  const [reasonText, setReasonText] = useState('');

  const classifyMutation = useMutation({
    mutationFn: async () => {
      const url = `/revenue/transactions/${transaction.id}/classification`;
      const payload = { newClassification: classification, reasonCode, reasonText };
      const res = await api.patch(url, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions-page'] });
      queryClient.invalidateQueries({ queryKey: ['deminimis-status'] });
      queryClient.invalidateQueries({ queryKey: ['risk-score'] });
      onClose();
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="premium-card w-full max-w-md" style={{ padding: 32, margin: 20 }}>
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}>
            Classify Transaction
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ts-fg-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 4 }}>Counterparty</p>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ts-fg-primary)' }}>{transaction.counterparty}</p>
        </div>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 4 }}>Amount (AED)</p>
          <p className="ts-mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ts-fg-primary)' }}>
            {Number(transaction.amountAed).toLocaleString('en-AE', { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ts-fg-primary)', marginBottom: 8 }}>
            Classification
          </label>
          <select
            value={classification}
            onChange={(e) => setClassification(e.target.value as 'QI' | 'NQI' | 'EXCLUDED')}
            className="w-full rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            style={{ padding: '10px 12px', background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)', color: 'var(--ts-fg-primary)', fontSize: 14 }}
          >
            <option value="QI">Qualifying Income (QI)</option>
            <option value="NQI">Non-Qualifying Income (NQI)</option>
            <option value="EXCLUDED">Excluded (EXCLUDED)</option>
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ts-fg-primary)', marginBottom: 8 }}>
            Reason (Required for audit, min 20 chars)
          </label>
          <textarea
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="Explain why this classification was chosen..."
            className="w-full rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            style={{ padding: '10px 12px', background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)', color: 'var(--ts-fg-primary)', fontSize: 13, minHeight: 80, resize: 'none' }}
          />
        </div>

        {classifyMutation.isError && (
          <p style={{ fontSize: 12, color: 'var(--ts-red-500)', marginBottom: 12 }}>
            Classification failed. Check audit reason length.
          </p>
        )}

        <button
          disabled={classifyMutation.isPending || reasonText.length < 20}
          onClick={() => classifyMutation.mutate()}
          className="w-full rounded-xl font-bold transition-all"
          style={{
            padding: '12px 24px', fontSize: 14,
            background: reasonText.length < 20 ? 'var(--ts-bg-elevated)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: reasonText.length < 20 ? 'var(--ts-fg-muted)' : 'white',
            border: 'none', cursor: reasonText.length < 20 ? 'not-allowed' : 'pointer',
            opacity: classifyMutation.isPending ? 0.7 : 1,
          }}
        >
          {classifyMutation.isPending ? 'Saving…' : 'Save Classification'}
        </button>
      </div>
    </div>
  );
}

import { useSearchParams } from 'next/navigation';

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'ALL';

  const [showImport, setShowImport] = useState(false);
  const [classifyingTx, setClassifyingTx] = useState<any>(null);
  
  // New state for pagination and filtering
  const [page, setPage] = useState(1);
  const [classificationFilter, setClassificationFilter] = useState<string>(initialFilter);
  const limit = 25;

  const { data: orgData } = useQuery({
    queryKey: ['org-me'],
    queryFn: () => api.get('/organizations/me').then((r) => r.data.data ?? r.data),
    retry: false,
  });

  const taxPeriodId: string | null = orgData?.taxPeriods?.[0]?.id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ['transactions-page', page, classificationFilter, taxPeriodId],
    queryFn: () => {
      let url = `/revenue/transactions?page=${page}&limit=${limit}`;
      if (taxPeriodId) url += `&taxPeriodId=${taxPeriodId}`;
      if (classificationFilter !== 'ALL') url += `&classification=${classificationFilter}`;
      return api.get(url).then((r) => r.data.data ?? r.data);
    },
    retry: false,
  });

  const transactions: any[] = data?.transactions ?? data?.items ?? data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  const handleExport = async () => {
    if (!taxPeriodId) return;
    try {
      const res = await api.get(`/revenue/transactions/export?taxPeriodId=${taxPeriodId}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `transactions-export-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (e) {
      alert('Failed to export transactions.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--ts-bg-base)' }}>
      <TopRibbon />

      <div className="w-full max-w-5xl mx-auto px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0, marginBottom: 4 }}>
              Transactions
            </h1>
            <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)', margin: 0 }}>
              Revenue classifications and Non-Qualifying Income exposure.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={!taxPeriodId || transactions.length === 0}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all"
              style={{ background: 'var(--ts-bg-elevated)', color: 'var(--ts-fg-secondary)', border: '1px solid var(--ts-border)', cursor: 'pointer' }}
            >
              Export CSV
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              <Upload size={14} />
              Import CSV
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          {['ALL', 'UNCLASSIFIED', 'QI', 'NQI', 'EXCLUDED'].map((c) => (
            <button
              key={c}
              onClick={() => { setClassificationFilter(c); setPage(1); }}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
              style={{
                background: classificationFilter === c ? 'var(--ts-blue-500)' : 'var(--ts-bg-elevated)',
                color: classificationFilter === c ? 'white' : 'var(--ts-fg-secondary)',
                border: `1px solid ${classificationFilter === c ? 'var(--ts-blue-500)' : 'var(--ts-border)'}`,
                cursor: 'pointer',
              }}
            >
              {c === 'ALL' ? 'All Transactions' : c}
            </button>
          ))}
        </div>

        <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ height: 200, background: 'var(--ts-bg-card)' }} className="animate-pulse rounded-xl" />
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ArrowUpDown size={32} color="oklch(0.48 0 0)" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ts-fg-secondary)', marginBottom: 4 }}>
                No transactions yet
              </p>
              <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)', maxWidth: 340, lineHeight: 1.5 }}>
                Import a CSV from your accounting system to start QFZP classification and de-minimis monitoring.
              </p>
              <button
                onClick={() => setShowImport(true)}
                className="mt-4 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                style={{ background: 'oklch(0.55 0.22 260 / 0.1)', color: 'var(--ts-blue-400)', border: '1px solid oklch(0.55 0.22 260 / 0.2)', cursor: 'pointer' }}
              >
                <Upload size={13} /> Import CSV
              </button>
            </div>
          ) : (
            <>
              <div
                className="grid grid-cols-5 gap-2 px-4 py-2.5"
                style={{ background: 'var(--ts-bg-elevated)', borderBottom: '1px solid var(--ts-border)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ts-fg-muted)' }}
              >
                <span>Counterparty</span>
                <span>Activity</span>
                <span>Amount (AED)</span>
                <span>Classification</span>
                <span className="text-right">Action</span>
              </div>
              <div>
                {transactions.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="grid grid-cols-5 gap-2 px-4 py-3 items-center"
                    style={{ borderBottom: '1px solid var(--ts-border-subtle)', fontSize: 13 }}
                  >
                    <span style={{ color: 'var(--ts-fg-primary)', fontWeight: 500 }}>{tx.counterparty}</span>
                    <span style={{ color: 'var(--ts-fg-muted)' }}>{tx.activityCode ?? '—'}</span>
                    <span className="ts-mono" style={{ color: 'var(--ts-fg-primary)', fontWeight: 600 }}>
                      {Number(tx.amountAed).toLocaleString('en-AE', { maximumFractionDigits: 0 })}
                    </span>
                    <span style={{ color: CLASS_COLORS[tx.classification] ?? 'var(--ts-fg-muted)', fontWeight: 600, fontSize: 11, letterSpacing: '0.06em' }}>
                      {tx.classification}
                    </span>
                    <div className="flex justify-end">
                      {tx.classification === 'UNCLASSIFIED' && (
                        <button
                          onClick={() => setClassifyingTx(tx)}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:bg-blue-500/10 hover:text-blue-500"
                          style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)', color: 'var(--ts-fg-primary)', cursor: 'pointer' }}
                        >
                          <Edit2 size={12} /> Classify
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--ts-border)', background: 'var(--ts-bg-elevated)' }}>
                  <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)', margin: 0 }}>
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all disabled:opacity-50"
                      style={{ background: 'var(--ts-bg-card)', color: 'var(--ts-fg-primary)', border: '1px solid var(--ts-border)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all disabled:opacity-50"
                      style={{ background: 'var(--ts-bg-card)', color: 'var(--ts-fg-primary)', border: '1px solid var(--ts-border)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showImport && (
        <CsvImportDialog taxPeriodId={taxPeriodId} onClose={() => setShowImport(false)} />
      )}
      {classifyingTx && (
        <ClassifyDialog transaction={classifyingTx} onClose={() => setClassifyingTx(null)} />
      )}
    </div>
  );
}
