import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <article className="mx-auto max-w-3xl rounded-xl border bg-card p-8 shadow-card">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="mt-4 text-3xl font-bold text-foreground">Terms of Service</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: April 24, 2026</p>
        <div className="mt-8 space-y-5 text-sm leading-7 text-muted-foreground">
          <p>
            TaxSentry provides software for monitoring QFZP compliance risk. It does not
            replace legal, tax, or accounting advice from a qualified professional.
          </p>
          <p>
            Customers are responsible for the accuracy of uploaded transactions,
            counterparty details, classifications, and documents.
          </p>
          <p>
            Subscription access, billing, cancellations, and invoices are managed through
            the billing provider shown in the product.
          </p>
          <p>
            For contract questions, contact legal@taxsentry.ae.
          </p>
        </div>
      </article>
    </main>
  );
}
