'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { TopRibbon } from '@/components/dashboard/TopRibbon';
import { ShieldCheck, Download } from 'lucide-react';

interface AuditEntry {
  id: string;
  actorEmail: string | null;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('ALL');
  const limit = 50;

  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', page, actionFilter],
    queryFn: () => {
      let url = `/audit-log?page=${page}&limit=${limit}`;
      if (actionFilter !== 'ALL') url += `&action=${actionFilter}`;
      return api.get(url).then((r) => r.data.data ?? r.data);
    },
    retry: false,
  });

  const entries: AuditEntry[] = data?.items ?? Array.isArray(data) ? data : data?.items ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  const handleExport = async () => {
    try {
      let url = `/audit-log/export`;
      if (actionFilter !== 'ALL') url += `?action=${actionFilter}`;
      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `audit-log-export-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (e) {
      alert('Failed to export audit log.');
    }
  };

  const actionTypes = [
    'ALL',
    'CREATE_TRANSACTION',
    'OVERRIDE_CLASSIFICATION',
    'SOFT_DELETE_TRANSACTION',
    'CSV_IMPORT'
  ];

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--ts-bg-base)' }}>
      <TopRibbon />

      <div className="w-full max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} color="var(--ts-blue-500)" />
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}>
              Audit Log
            </h1>
          </div>
          <button
            onClick={handleExport}
            disabled={entries.length === 0}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-bold transition-all"
            style={{ background: 'var(--ts-bg-elevated)', color: 'var(--ts-fg-secondary)', border: '1px solid var(--ts-border)', cursor: 'pointer' }}
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          {actionTypes.map((c) => (
            <button
              key={c}
              onClick={() => { setActionFilter(c); setPage(1); }}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                background: actionFilter === c ? 'var(--ts-blue-500)' : 'var(--ts-bg-elevated)',
                color: actionFilter === c ? 'white' : 'var(--ts-fg-secondary)',
                border: `1px solid ${actionFilter === c ? 'var(--ts-blue-500)' : 'var(--ts-border)'}`,
                cursor: 'pointer',
              }}
            >
              {c === 'ALL' ? 'All Actions' : c.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table header */}
          <div
            className="grid grid-cols-4 gap-3 px-5 py-3"
            style={{ background: 'var(--ts-bg-elevated)', borderBottom: '1px solid var(--ts-border)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ts-fg-muted)' }}
          >
            <span>Timestamp</span>
            <span>Actor</span>
            <span>Action</span>
            <span>Entity</span>
          </div>

          {isLoading ? (
            <div style={{ height: 200 }} className="animate-pulse" />
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16" style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>
              <ShieldCheck size={32} color="oklch(0.48 0 0)" style={{ marginBottom: 12 }} />
              <p style={{ fontWeight: 600, color: 'var(--ts-fg-secondary)', marginBottom: 4 }}>No audit entries found</p>
              <p>Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div>
                {entries.map((entry) => {
                  const ts = new Date(entry.timestamp);
                  const dateStr = ts.toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' });
                  const timeStr = ts.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

                  return (
                    <div
                      key={entry.id}
                      className="grid grid-cols-4 gap-3 px-5 py-3"
                      style={{ borderBottom: '1px solid var(--ts-border-subtle)', fontSize: 12 }}
                    >
                      <span className="ts-mono" style={{ color: 'var(--ts-fg-muted)', fontSize: 11 }}>
                        {dateStr} {timeStr}
                      </span>
                      <span className="truncate" style={{ color: 'var(--ts-fg-secondary)' }}>
                        {entry.actorEmail ?? 'System'}
                      </span>
                      <span style={{ color: 'var(--ts-fg-primary)', fontWeight: 500 }}>
                        {entry.action}
                      </span>
                      <span style={{ color: 'var(--ts-fg-muted)' }}>
                        {entry.entity} <span className="ts-mono" style={{ fontSize: 10 }}>{entry.entityId?.slice(-8)}</span>
                      </span>
                    </div>
                  );
                })}
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
    </div>
  );
}
