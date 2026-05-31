'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DunningBanner() {
  const { data } = useQuery({
    queryKey: ['billing-status'],
    queryFn: () => api.get('/billing/status').then((r) => r.data.data),
    staleTime: 30_000, // 30s cache
  });

  const portalMutation = useMutation({
    mutationFn: () => api.get('/billing/portal').then((r) => r.data.data),
    onSuccess: (d) => {
      window.location.href = d.url;
    },
  });

  if (data?.subscriptionStatus !== 'PAST_DUE') return null;

  return (
    <div className="bg-red-500 text-white px-4 py-3 flex items-center justify-center gap-4 w-full z-50">
      <div className="flex items-center gap-2 font-medium text-sm">
        <AlertTriangle className="w-4 h-4" />
        <span>
          Payment Action Required: Your latest subscription charge failed. Please update your payment method to avoid suspension.
        </span>
      </div>
      <button
        onClick={() => portalMutation.mutate()}
        disabled={portalMutation.isPending || !data?.dodoCustomerId}
        className={cn(
          'bg-white text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md text-sm font-semibold flex items-center gap-1.5 transition-colors',
          portalMutation.isPending && 'opacity-70 cursor-not-allowed'
        )}
      >
        {portalMutation.isPending ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            Update Payment Method
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </div>
  );
}
