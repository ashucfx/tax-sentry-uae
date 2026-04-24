import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAed(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatAedCompact(amount: number): string {
  if (amount >= 1_000_000) return `AED ${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `AED ${(amount / 1_000).toFixed(1)}K`;
  return `AED ${amount.toFixed(0)}`;
}
