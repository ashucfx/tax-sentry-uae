'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ArrowUpDown, Upload } from 'lucide-react';

export default function TransactionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['transactions-page'],
    queryFn: () => api.get('/revenue/transactions?limit=25').then((r) => r.data.data ?? r.data),
    retry: false,
  });

  const transactions = data?.transactions ?? data?.items ?? [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review revenue classifications and Non-Qualifying Income exposure.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          <Upload className="h-4 w-4" />
          Upload CSV
        </button>
      </div>

      <section className="mt-6 rounded-xl border bg-card shadow-card">
        {isLoading ? (
          <div className="h-48 animate-pulse rounded-xl bg-muted" />
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <ArrowUpDown className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-semibold text-foreground">No transactions loaded</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Upload a CSV from your accounting system to populate classification, de-minimis,
              and risk monitoring.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="grid grid-cols-1 gap-2 p-4 text-sm md:grid-cols-4">
                <span className="font-medium text-foreground">{tx.counterparty}</span>
                <span className="text-muted-foreground">{tx.activityCode ?? 'Unmapped activity'}</span>
                <span className="font-semibold text-foreground">AED {Number(tx.amountAed).toLocaleString()}</span>
                <span className="text-muted-foreground">{tx.classification}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
