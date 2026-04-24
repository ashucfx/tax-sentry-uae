import { ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <article className="mx-auto max-w-3xl rounded-xl border bg-card p-8 shadow-card">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <h1 className="mt-4 text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: April 24, 2026</p>
        <div className="mt-8 space-y-5 text-sm leading-7 text-muted-foreground">
          <p>
            TaxSentry processes organization, user, billing, revenue transaction, and
            compliance document metadata to provide UAE Free Zone tax compliance monitoring.
          </p>
          <p>
            Customer financial data is used to calculate classifications, de-minimis
            thresholds, alerts, reports, and audit logs. We do not sell customer data.
          </p>
          <p>
            Access is role-based. Audit events are retained to support accountability and
            compliance evidence. Customers can request export or deletion subject to legal,
            security, and audit retention obligations.
          </p>
          <p>
            For privacy requests, contact privacy@taxsentry.ae.
          </p>
        </div>
      </article>
    </main>
  );
}
