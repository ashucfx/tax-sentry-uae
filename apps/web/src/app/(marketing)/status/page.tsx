import { CheckCircle2, Clock, Server } from 'lucide-react';

export default function StatusPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div>
        <h1 className="text-xl font-bold text-foreground">System Status</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Current operational status for TaxSentry services.
        </p>
      </div>

      <section className="mt-6 rounded-xl border bg-card p-6 shadow-card">
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 className="h-5 w-5" />
          <div>
            <p className="text-sm font-semibold">All monitored services operational</p>
            <p className="text-xs">No active incidents reported.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-background p-4">
            <Server className="h-4 w-4 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium text-foreground">API and dashboard</p>
            <p className="text-xs text-muted-foreground">Operational</p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium text-foreground">Scheduled checks</p>
            <p className="text-xs text-muted-foreground">Daily checks at 08:00 UAE time</p>
          </div>
        </div>
      </section>
    </main>
  );
}
