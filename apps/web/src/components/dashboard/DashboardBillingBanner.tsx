'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function DashboardBillingBanner() {
  const { data } = useQuery({
    queryKey: ['billing-status'],
    queryFn: () => api.get('/billing/status').then((r) => r.data.data),
    staleTime: 60_000,
  });

  if (!data) return null;

  const { subscriptionStatus, daysUntilExpiry, cancelAtPeriodEnd } = data;

  // 1. Trial expiring soon (<= 3 days)
  if (subscriptionStatus === 'TRIALING' && daysUntilExpiry !== null && daysUntilExpiry <= 3) {
    const isExpired = daysUntilExpiry <= 0;
    return (
      <div className={cn(
        "rounded-xl border p-4 flex items-center justify-between shadow-sm",
        isExpired ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-full",
            isExpired ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
          )}>
            {isExpired ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </div>
          <div>
            <h3 className={cn(
              "font-semibold text-sm",
              isExpired ? "text-red-900" : "text-amber-900"
            )}>
              {isExpired ? "Your free trial has ended" : `Your free trial ends in ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'day' : 'days'}`}
            </h3>
            <p className={cn(
              "text-xs mt-0.5",
              isExpired ? "text-red-700" : "text-amber-700"
            )}>
              {isExpired
                ? "Please upgrade to a paid plan to restore access to your compliance dashboard."
                : "Upgrade to a paid plan to ensure uninterrupted access."}
            </p>
          </div>
        </div>
        <Link
          href="/billing"
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shrink-0",
            isExpired 
              ? "bg-red-600 hover:bg-red-700 text-white" 
              : "bg-amber-600 hover:bg-amber-700 text-white"
          )}
        >
          Upgrade Plan
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // 2. Cancelled subscription ending soon
  if (subscriptionStatus === 'ACTIVE' && cancelAtPeriodEnd && daysUntilExpiry !== null && daysUntilExpiry <= 7) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-blue-100 text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-blue-900">
              Your subscription ends in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}
            </h3>
            <p className="text-xs text-blue-700 mt-0.5">
              Your plan is scheduled to be cancelled. Reactivate now to keep your access.
            </p>
          </div>
        </div>
        <Link
          href="/billing"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shrink-0"
        >
          Reactivate
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return null;
}
