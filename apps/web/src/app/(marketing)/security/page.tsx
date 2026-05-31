import { Metadata } from 'next';
import { Shield, Lock, Server, FileCheck, EyeOff, Activity } from 'lucide-react';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const metadata: Metadata = {
  title: 'Security & Trust | TaxSentry UAE',
  description: 'Enterprise-grade security, AES-256 encryption, and immutable audit logs for UAE Free Zone compliance.',
};

const FEATURES = [
  {
    icon: Lock,
    title: 'Bank-Grade Encryption',
    description: 'All sensitive data, including Trade Licenses and Revenue streams, are encrypted at rest using AES-256. Data in transit is secured via TLS 1.3.',
  },
  {
    icon: Server,
    title: 'UAE Data Residency',
    description: 'Your data is hosted on secure, managed infrastructure in close geographic proximity to ensure minimal latency and compliance with corporate data preferences.',
  },
  {
    icon: FileCheck,
    title: 'Immutable Audit Trails',
    description: 'Every configuration change, override, and document upload generates an immutable audit log ensuring 100% traceability for FTA audits.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access Control',
    description: 'Granular RBAC ensures that only authorized personnel (e.g., CFOs) can execute destructive actions or finalize compliance reports.',
  },
  {
    icon: EyeOff,
    title: 'Zero Knowledge Architecture',
    description: 'We do not have access to your raw, unencrypted accounting credentials. Webhook integrations are strictly limited to necessary data ingestion.',
  },
  {
    icon: Activity,
    title: 'Continuous Monitoring',
    description: 'Our infrastructure is monitored 24/7 by advanced APM and error tracking systems to guarantee 99.9% uptime during critical tax periods.',
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[var(--ts-bg-base)]">
      {/* Hero Section */}
      <section className="ts-section ts-container pb-12 pt-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-[var(--ts-bg-muted)] border border-[var(--ts-border)] text-sm font-semibold text-[var(--ts-blue-500)]">
          <Shield size={16} />
          Enterprise Trust
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[var(--ts-fg-primary)] mb-6">
          Security is not a feature.<br />
          <span className="ts-gradient-text">It is our foundation.</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-[var(--ts-fg-secondary)]">
          We protect your Corporate Tax compliance data with the same rigorous standards demanded by global financial institutions and the UAE Federal Tax Authority.
        </p>
      </section>

      {/* Grid Section */}
      <section className="ts-section ts-container pt-8 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feat) => (
            <div key={feat.title} className="premium-card p-8 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-[oklch(0.55_0.22_260_/_0.1)] border border-[oklch(0.55_0.22_260_/_0.2)] flex items-center justify-center mb-6 text-[var(--ts-blue-500)]">
                <feat.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-[var(--ts-fg-primary)] mb-3">{feat.title}</h3>
              <p className="text-[var(--ts-fg-secondary)] leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Compliance Block */}
      <section className="border-y border-[var(--ts-border-subtle)] bg-[var(--ts-bg-card)]">
        <div className="ts-section ts-container text-center">
          <h2 className="text-3xl font-bold text-[var(--ts-fg-primary)] mb-6">Built for UAE Free Zones</h2>
          <p className="max-w-3xl mx-auto text-[var(--ts-fg-secondary)] mb-8">
            TaxSentry is explicitly designed to calculate and protect your Qualifying Free Zone Person (QFZP) status under the new UAE Corporate Tax regime. We align our security and data practices with the expectations of the FTA and leading UAE auditors.
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
