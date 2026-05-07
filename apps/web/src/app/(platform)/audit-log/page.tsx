'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { TopRibbon } from '@/components/dashboard/TopRibbon';
import { ShieldCheck } from 'lucide-react';

interface AuditEntry {
  id: string;
  actorEmail: string | null;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
}

export default function AuditLogPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-log'],
    queryFn: () => api.get('/audit-log?limit=50').then((r) => r.data.data ?? r.data),
    retry: false,
  });

  const entries: AuditEntry[] = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--ts-bg-base)' }}>
      <TopRibbon />

      <div className="w-full max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck size={18} color="var(--ts-blue-500)" />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}>
            Audit Log
          </h1>
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
              <p style={{ fontWeight: 600, color: 'var(--ts-fg-secondary)', marginBottom: 4 }}>No audit entries yet</p>
              <p>Actions taken in TaxSentry will appear here.</p>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
