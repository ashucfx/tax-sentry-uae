'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { TopRibbon } from '@/components/dashboard/TopRibbon';
import { Blocks, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function IntegrationsPage() {
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['integrations-status'],
    queryFn: () => api.get('/integrations/status').then(r => r.data),
  });

  const connectMutation = useMutation({
    mutationFn: (provider: string) => api.post('/integrations/connect/mock', { provider }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations-status'] });
    }
  });

  const syncMutation = useMutation({
    mutationFn: (provider: string) => api.post('/integrations/sync', { provider }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations-status'] });
    }
  });

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--ts-bg-base)' }}>
      <TopRibbon />

      <div className="flex-1 w-full max-w-[1000px] mx-auto px-6 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Blocks size={18} color="var(--ts-blue-500)" />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}>
            Accounting Integrations
          </h1>
        </div>

        <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)', marginBottom: 24 }}>
          Connect your accounting software to automatically sync ledgers and classify revenue.
        </p>

        {isLoading ? (
          <div className="animate-pulse h-32 bg-[var(--ts-bg-card)] rounded-xl border border-[var(--ts-border)]" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Xero */}
            <div className="premium-card p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-amber-200">
                Beta (Q3)
              </div>
              <div>
                <div className="flex items-center justify-between mb-4 mt-2">
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>Xero</h3>
                </div>
                <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)' }}>
                  Continuous two-way sync for revenue transactions and chart of accounts mapping.
                </p>
              </div>

              <div className="mt-6 flex items-center gap-3">
                  <button
                    disabled
                    className="w-full py-2 rounded-lg text-[13px] font-semibold text-white bg-[var(--ts-blue-500)] hover:bg-[var(--ts-blue-600)] transition-colors opacity-50 cursor-not-allowed"
                  >
                    Join Waitlist
                  </button>
              </div>
            </div>

            {/* Zoho */}
            <div className="premium-card p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-amber-200">
                Beta (Q3)
              </div>
              <div>
                <div className="flex items-center justify-between mb-4 mt-2">
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>Zoho Books</h3>
                </div>
                <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)' }}>
                  Continuous two-way sync for revenue transactions and chart of accounts mapping.
                </p>
              </div>

              <div className="mt-6 flex items-center gap-3">
                  <button
                    disabled
                    className="w-full py-2 rounded-lg text-[13px] font-semibold text-white bg-[var(--ts-blue-500)] hover:bg-[var(--ts-blue-600)] transition-colors opacity-50 cursor-not-allowed"
                  >
                    Join Waitlist
                  </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
