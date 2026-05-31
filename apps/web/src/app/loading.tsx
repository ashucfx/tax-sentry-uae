import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-navy-950 animate-in fade-in duration-300">
      <div className="w-16 h-16 bg-white dark:bg-navy-900 rounded-2xl shadow-xl border border-slate-200 dark:border-navy-800 flex items-center justify-center mb-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse">
        Loading TaxSentry...
      </p>
    </div>
  );
}
