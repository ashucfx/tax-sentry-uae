import Link from 'next/link';
import { ArrowRight, BarChart3, FileCheck2, ShieldAlert, ShieldCheck } from 'lucide-react';

const STEPS = [
  {
    icon: ShieldAlert,
    title: 'Risk score first',
    copy: 'Start with the CFO view: QFZP status, top risk factors, and the next action to protect the 0% rate.',
  },
  {
    icon: BarChart3,
    title: 'De-minimis monitoring',
    copy: 'Track Non-Qualifying Income against both the 5% revenue limit and AED 5M absolute limit.',
  },
  {
    icon: FileCheck2,
    title: 'Substance readiness',
    copy: 'Monitor required documents, expiry dates, and missing evidence before audit pressure arrives.',
  },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-10">
        <section className="rounded-xl border bg-card p-8 shadow-card">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" />
            Product walkthrough
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground">
            See how TaxSentry catches QFZP risk before month-end.
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            This pre-launch demo shows the operating flow finance teams use after uploading
            revenue data: classify transactions, monitor de-minimis exposure, and keep
            substance documentation audit-ready.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="mailto:demo@taxsentry.ae?subject=TaxSentry product demo"
              className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Book a guided demo
            </a>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-lg border bg-card p-5 shadow-card">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
