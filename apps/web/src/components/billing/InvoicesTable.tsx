'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Download, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export function InvoicesTable() {
  const { data, isLoading } = useQuery({
    queryKey: ['billing-invoices'],
    queryFn: () => api.get('/billing/invoices').then((r) => r.data.data),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Billing History</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-muted rounded w-full" />
          <div className="h-10 bg-muted rounded w-full" />
        </div>
      </div>
    );
  }

  const invoices = Array.isArray(data) ? data : [];

  return (
    <div className="bg-card rounded-xl border shadow-card p-6 space-y-4 overflow-hidden">
      <h2 className="text-sm font-semibold text-foreground">Billing History</h2>
      
      {invoices.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground border-t border-border">
          No invoices found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium rounded-tl-lg">Date</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv: any) => {
                const date = new Date(inv.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });
                const amount = new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: inv.currency || 'USD',
                }).format((inv.total_amount || 0) / 100);

                const isPaid = inv.status === 'succeeded';

                return (
                  <tr key={inv.payment_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-foreground font-medium">{date}</td>
                    <td className="px-4 py-3 text-muted-foreground">{amount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'px-2 py-1 text-[10px] font-semibold rounded-full uppercase tracking-wider',
                          isPaid
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        )}
                      >
                        {isPaid ? 'Paid' : inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* Usually MoRs like Dodo return a receipt URL, we map it if available */}
                      {inv.receipt_url || inv.payment_link ? (
                        <a
                          href={inv.receipt_url || inv.payment_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <FileText className="w-3.5 h-3.5" />
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
