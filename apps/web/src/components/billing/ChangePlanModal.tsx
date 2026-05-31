'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { X, Check, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChangePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: string;
  currentInterval: string;
}

const PLANS = [
  {
    tier: 'STARTER',
    name: 'Starter',
    monthlyPrice: 82,
    yearlyPrice: 815,
    features: ['1 User', 'Basic Tax Filing', 'Standard Support'],
  },
  {
    tier: 'GROWTH',
    name: 'Growth',
    monthlyPrice: 218,
    yearlyPrice: 2176,
    features: ['Up to 5 Users', 'Advanced Compliance', 'Priority Support'],
  },
] as const;

export function ChangePlanModal({ isOpen, onClose, currentTier, currentInterval }: ChangePlanModalProps) {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>(
    (currentInterval as 'monthly' | 'yearly') || 'monthly'
  );
  const [selectedTier, setSelectedTier] = useState<string>(currentTier || 'STARTER');

  const queryClient = useQueryClient();

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/billing/subscription/upgrade', {
        tier: selectedTier,
        interval,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-status'] });
      toast.success('Subscription plan updated successfully!');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update plan.');
    },
  });

  if (!isOpen) return null;

  const isCurrentPlan = selectedTier === currentTier && interval === currentInterval;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">Change your plan</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select the plan that best fits your business needs.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Billing Toggle */}
        <div className="p-6 pb-2 flex justify-center">
          <div className="inline-flex items-center p-1 bg-muted rounded-lg border border-border">
            <button
              onClick={() => setInterval('monthly')}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                interval === 'monthly'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setInterval('yearly')}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                interval === 'yearly'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Yearly billing
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="p-6 grid sm:grid-cols-2 gap-4">
          {PLANS.map((plan) => {
            const isSelected = selectedTier === plan.tier;
            const price = interval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

            return (
              <div
                key={plan.tier}
                onClick={() => setSelectedTier(plan.tier)}
                className={cn(
                  'relative rounded-xl border-2 p-5 cursor-pointer transition-all duration-200',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50'
                )}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 text-primary">
                    <Check className="w-5 h-5" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <ShieldCheck className={cn('w-5 h-5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                  <h3 className="font-bold text-foreground">{plan.name}</h3>
                </div>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-bold text-foreground">${price}</span>
                  <span className="text-sm text-muted-foreground">/{interval === 'yearly' ? 'yr' : 'mo'}</span>
                </div>
                <ul className="space-y-2.5">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/30 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Changes take effect immediately. Prorated charges apply.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={upgradeMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={() => upgradeMutation.mutate()}
              disabled={isCurrentPlan || upgradeMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {upgradeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  Confirm Plan Change
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
