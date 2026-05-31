'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service like Sentry
    console.error('TaxSentry Global Error Caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-navy-950">
      <div className="w-full max-w-md bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl shadow-xl overflow-hidden p-8 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Something went wrong
        </h2>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          We apologize for the interruption. An unexpected error occurred in the application. Our engineering team has been notified.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
          
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all"
          >
            <Home className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>

        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-8 text-left bg-slate-100 dark:bg-navy-950 p-4 rounded-lg overflow-x-auto border border-slate-200 dark:border-navy-800">
            <p className="text-xs font-mono text-red-600 dark:text-red-400 font-bold mb-2">Developer details:</p>
            <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-400 break-all whitespace-pre-wrap">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
