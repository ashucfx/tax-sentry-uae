import { Lock, ShieldCheck, Users } from 'lucide-react';

const CONTROLS = [
  { icon: Lock, title: 'Encrypted storage', copy: 'Customer data is protected with encrypted storage and secure transport.' },
  { icon: ShieldCheck, title: 'Immutable audit log', copy: 'Classification overrides and material actions preserve before/after evidence.' },
  { icon: Users, title: 'Role-based access', copy: 'OWNER, FINANCE, VIEWER, and AUDITOR roles keep access aligned with responsibility.' },
];

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Security Docs</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Current TaxSentry controls are listed below. We do not claim SOC 2 certification
            until an audit is complete.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {CONTROLS.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-lg border bg-card p-5 shadow-card">
              <Icon className="h-5 w-5 text-primary" />
              <h2 className="mt-4 text-base font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
