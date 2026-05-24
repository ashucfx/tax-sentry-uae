import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Trust Center | TaxSentry',
  description: 'Security architecture, compliance posture, and system status for TaxSentry.',
};

const COMPLIANCE_ITEMS = [
  {
    title: 'UAE Data Sovereignty',
    description: '100% of financial data and PII is stored and processed in Google Cloud Platform me-central1 (Doha), aligning with UAE FTA requirements for local data residency.',
    icon: '🇦🇪',
    status: 'Verified',
  },
  {
    title: 'Data Protection Law (PDPL)',
    description: 'Fully compliant with UAE Federal Decree-Law No. 45 of 2021 regarding data processing principles, consent management, and data subject access rights (DSAR).',
    icon: '⚖️',
    status: 'Compliant',
  },
  {
    title: 'Encryption Standards',
    description: 'AES-256-GCM encryption at rest for all databases. TLS 1.2+ for all data in transit. Passwordless OTP hashes use SHA-256. Application-layer encryption for PII.',
    icon: '🔐',
    status: 'Active',
  },
  {
    title: 'Role-Based Access Control',
    description: 'Granular permissions differentiating Owners, Finance personnel, and Auditors, strictly enforced at the API routing layer.',
    icon: '👥',
    status: 'Active',
  },
];

const SUBPROCESSORS = [
  { name: 'Google Cloud Platform', role: 'Primary Infrastructure & Database', location: 'Middle East (me-central1)' },
  { name: 'Resend', role: 'Transactional Email (OTP & Alerts)', location: 'Global' },
  { name: 'Dodo Payments', role: 'Subscription Billing', location: 'Global' },
  { name: 'Sentry', role: 'Crash Reporting & APM', location: 'Global' },
];

export default function TrustCenterPage() {
  return (
    <div style={{ background: 'var(--ts-bg-base)', color: 'var(--ts-fg-primary)', minHeight: '100vh', paddingTop: 140, paddingBottom: 120 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 32px' }}>
        
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 80 }} aria-labelledby="trust-center-title">
          <div className="inline-flex items-center justify-center gap-2 mb-6" style={{ padding: '6px 16px', borderRadius: 9999, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', fontSize: 12, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#34d399' }} aria-hidden="true">
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            All Systems Operational
          </div>
          <h1 id="trust-center-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 24, lineHeight: 1.1 }}>
            TaxSentry Trust Center
          </h1>
          <p style={{ fontSize: 18, color: 'var(--ts-fg-secondary)', lineHeight: 1.7, maxWidth: 640, margin: '0 auto' }}>
            Enterprise-grade security, uncompromising data sovereignty, and radical transparency. Built for UAE Free Zone CFOs.
          </p>
        </header>

        {/* Security Architecture Grid */}
        <section aria-labelledby="security-posture" style={{ marginBottom: 80 }}>
          <h2 id="security-posture" style={{ fontSize: 24, fontWeight: 800, marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid var(--ts-border)' }}>
            Security Posture & Compliance
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {COMPLIANCE_ITEMS.map((item, i) => (
              <div key={i} style={{ padding: 32, background: 'var(--ts-bg-card)', borderRadius: 16, border: '1px solid var(--ts-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div style={{ fontSize: 32 }} aria-hidden="true">{item.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: 9999 }}>
                    {item.status}
                  </div>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, color: 'var(--ts-fg-primary)' }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--ts-fg-muted)', lineHeight: 1.6, margin: 0 }}>{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Subprocessors */}
        <section aria-labelledby="sub-processors" style={{ marginBottom: 80 }}>
          <h2 id="sub-processors" style={{ fontSize: 24, fontWeight: 800, marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid var(--ts-border)' }}>
            Authorised Sub-Processors
          </h2>
          <p style={{ fontSize: 15, color: 'var(--ts-fg-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
            To deliver our service, we engage the following industry-leading infrastructure providers. All providers are bound by strict Data Processing Agreements (DPAs).
          </p>
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--ts-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }} aria-label="List of authorised sub-processors">
              <thead>
                <tr style={{ background: 'var(--ts-bg-muted)' }}>
                  <th scope="col" style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: 'var(--ts-fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Provider</th>
                  <th scope="col" style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: 'var(--ts-fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Purpose</th>
                  <th scope="col" style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: 'var(--ts-fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data Location</th>
                </tr>
              </thead>
              <tbody>
                {SUBPROCESSORS.map((sp, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--ts-border)' }}>
                    <td style={{ padding: '16px 24px', fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)' }}>{sp.name}</td>
                    <td style={{ padding: '16px 24px', fontSize: 14, color: 'var(--ts-fg-muted)' }}>{sp.role}</td>
                    <td style={{ padding: '16px 24px', fontSize: 14, color: 'var(--ts-fg-muted)' }}>{sp.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Legal Directory */}
        <section aria-labelledby="legal-directory">
          <h2 id="legal-directory" style={{ fontSize: 24, fontWeight: 800, marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid var(--ts-border)' }}>
            Legal Directory
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            <Link href="/privacy" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: 'var(--ts-bg-card)', borderRadius: 12, border: '1px solid var(--ts-border)', textDecoration: 'none', transition: 'all 0.2s' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ts-fg-primary)', marginBottom: 4 }}>Privacy Policy</div>
                <div style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>Data collection & DSAR rights</div>
              </div>
              <span aria-hidden="true" style={{ color: 'var(--ts-fg-muted)' }}>→</span>
            </Link>
            <Link href="/terms" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: 'var(--ts-bg-card)', borderRadius: 12, border: '1px solid var(--ts-border)', textDecoration: 'none', transition: 'all 0.2s' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ts-fg-primary)', marginBottom: 4 }}>Terms of Service</div>
                <div style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>Usage rights & liability caps</div>
              </div>
              <span aria-hidden="true" style={{ color: 'var(--ts-fg-muted)' }}>→</span>
            </Link>
            <Link href="/cookies" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: 'var(--ts-bg-card)', borderRadius: 12, border: '1px solid var(--ts-border)', textDecoration: 'none', transition: 'all 0.2s' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ts-fg-primary)', marginBottom: 4 }}>Cookie Policy</div>
                <div style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>Zero-analytics pledge</div>
              </div>
              <span aria-hidden="true" style={{ color: 'var(--ts-fg-muted)' }}>→</span>
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
