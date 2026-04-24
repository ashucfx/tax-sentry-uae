import { BookOpen, Database, ShieldCheck } from 'lucide-react';

export default function AuditLogPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div>
        <h1 className="text-xl font-bold text-foreground">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Immutable activity history for classification, billing, document, and account events.
        </p>
      </div>

      <section className="mt-6 rounded-xl border bg-card p-6 shadow-card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-background p-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="mt-3 text-sm font-semibold text-foreground">Before/after evidence</h2>
            <p className="mt-1 text-sm text-muted-foreground">Overrides preserve the prior and new state.</p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="mt-3 text-sm font-semibold text-foreground">Actor attribution</h2>
            <p className="mt-1 text-sm text-muted-foreground">Events are tied to users where available.</p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="mt-3 text-sm font-semibold text-foreground">Export-ready trail</h2>
            <p className="mt-1 text-sm text-muted-foreground">Use the audit trail during review and advisory workflows.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
