import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-navy-950">
      <div className="w-full max-w-md text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-24 h-24 bg-slate-200/50 dark:bg-navy-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-slate-500 dark:text-slate-400" />
        </div>
        
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
          404 — Page not found
        </h2>
        
        <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed max-w-sm mx-auto">
          We couldn't find the page you're looking for. It might have been moved, deleted, or perhaps the URL is misspelled.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
          <Home className="w-4 h-4" /> Return to TaxSentry
        </Link>
      </div>
    </div>
  );
}
