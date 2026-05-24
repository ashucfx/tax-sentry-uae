import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | TaxSentry',
  description:
    'TaxSentry Privacy Policy — how Ripple Nexus collects, processes, and protects your financial data in compliance with UAE Federal Decree-Law No. 45 of 2021.',
};

const SECTIONS = [
  {
    id: 's1',
    title: '1. Introduction & Controller Identity',
    content: `This Privacy Policy ("Policy") is issued by Ripple Nexus ("Company", "we", "us", "our"), the entity operating TaxSentry, a financial compliance infrastructure platform for UAE Free Zone companies. Ripple Nexus acts as the Data Controller in respect of personal data collected through this website and platform.

By accessing or using TaxSentry, you acknowledge you have read and understood this Policy. If you do not agree, you must discontinue use of the Service immediately.

Our contact for data matters: hello@taxsentry.com`,
  },
  {
    id: 's2',
    title: '2. Categories of Data We Collect',
    content: `We collect the following categories of personal and organisational data:

Identity Data: First name, last name, job title, employer organisation name, trade licence number.

Contact Data: Work email address, phone number, physical business address.

Financial & Compliance Data: Revenue transaction records, counterparty names, invoice numbers, activity codes, Non-Qualifying Income classifications, de-minimis threshold positions, risk scores, and FTA audit pack contents. This data is uploaded by you or your authorised users.

Technical Data: IP address, browser type and version, time zone, operating system, cookie identifiers, server log data.

Usage Data: Platform interaction records including pages viewed, features used, upload history, and session duration.

Authentication Data: One-Time Passwords (OTPs), session tokens (stored as SHA-256 hashes; raw tokens are never persisted).

We do not collect Sensitive Personal Data (biometric, health, or racial data) and we do not knowingly collect data from individuals under the age of 18.`,
  },
  {
    id: 's3',
    title: '3. Legal Basis for Processing',
    content: `Under UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data (PDPL) and applicable international standards, we rely on the following legal bases:

Contractual Necessity: Processing required to fulfil our obligations under the TaxSentry Subscription Agreement — including authentication, compliance engine operation, and report generation.

Legitimate Interests: Analytics, fraud prevention, system security, and product improvement, provided these do not override your fundamental rights.

Legal Obligation: Where we are required to retain data under UAE law, including Federal Tax Authority (FTA) record-keeping requirements.

Consent: Where you have explicitly opted in, such as marketing communications. You may withdraw consent at any time by contacting hello@taxsentry.com.`,
  },
  {
    id: 's4',
    title: '4. Data Sovereignty & Infrastructure',
    content: `TaxSentry is architected for UAE Data Sovereignty. All financial compliance data processed through the platform is hosted on Google Cloud Platform in the me-central1 region (Doha, Qatar / Middle East), which aligns with UAE Federal Tax Authority (FTA) data locality expectations.

Authentication and session data are stored in a PostgreSQL database instance located within the same GCP region.

No financial transaction data is transferred to servers outside the Middle East region without your explicit written instruction. Analytics and operational monitoring may use services with global infrastructure; where this applies, appropriate Standard Contractual Clauses (SCCs) or equivalent data transfer mechanisms are in place.`,
  },
  {
    id: 's5',
    title: '5. How We Use Your Data',
    content: `We use collected data for the following purposes:

• Providing the TaxSentry platform and all contracted features (de-minimis tracking, classification engine, risk scoring, audit pack generation, substance vault).
• Authenticating your identity via OTP-based passwordless sign-in.
• Processing and classifying revenue transactions you upload or import.
• Generating compliance reports, risk scores, and FTA audit packs.
• Sending transactional emails (OTP codes, subscription receipts, threshold alerts).
• Providing customer and enterprise support.
• Detecting fraud, abuse, and unauthorised access.
• Improving platform performance and product features.
• Complying with applicable UAE legal and regulatory obligations.

We do not sell your personal data or financial data to any third party. We do not use your financial data for profiling, advertising, or training machine-learning models not directly related to your compliance outputs.`,
  },
  {
    id: 's6',
    title: '6. Data Sharing & Third-Party Processors',
    content: `We engage the following categories of sub-processors, each bound by data processing agreements:

Infrastructure: Google Cloud Platform (hosting, database, storage) — UAE/Middle East region.
Email Delivery: Resend Inc. — for transactional emails including OTP codes and alerts.
Payment Processing: Dodo Payments — for subscription billing. Dodo receives your email and organisation name only; no financial transaction data is shared.
Error Monitoring: Sentry (optional, disabled in production unless configured) — anonymised crash reports.

We will not disclose your data to any governmental or regulatory body unless compelled by applicable UAE law, a valid court order, or FTA audit request — in which case we will notify you to the extent permitted by law.`,
  },
  {
    id: 's7',
    title: '7. Liability Limitations',
    content: `TaxSentry is a financial compliance monitoring tool. It is not a licensed tax advisory, accounting, or legal service. All classifications, risk scores, de-minimis calculations, and reports generated by TaxSentry are based on the data you provide and should be reviewed by a qualified UAE tax advisor or chartered accountant before submission to the FTA.

Ripple Nexus shall not be liable for: (a) loss of Qualifying Free Zone Person (QFZP) status; (b) tax assessments or penalties levied by the FTA; (c) decisions made solely on the basis of TaxSentry outputs without independent professional verification; or (d) data inaccuracies arising from incorrect or incomplete input data.

Our total aggregate liability to you under or in connection with this Policy shall not exceed the subscription fees paid by you in the three (3) months immediately preceding the event giving rise to the claim.`,
  },
  {
    id: 's8',
    title: '8. Data Retention',
    content: `We retain your data for the following periods:

Account Data: For the duration of your active subscription and for five (5) years after account closure, to comply with UAE commercial record-keeping requirements.
Financial Transaction Data: Seven (7) years from the end of the relevant UAE tax period, aligning with FTA audit window requirements.
Authentication Logs (OTP codes, sessions): 90 days from creation; or until revoked.
Audit Logs: Seven (7) years.
Marketing Enquiries (demo requests): Two (2) years.

You may request earlier deletion subject to applicable legal retention obligations. See Section 10 for your rights.`,
  },
  {
    id: 's9',
    title: '9. Security Measures',
    content: `We implement technical and organisational security measures including:

• AES-256 encryption at rest for all stored financial data.
• TLS 1.2+ encryption in transit for all API communications.
• OTP codes stored as SHA-256 hashes; raw codes are never persisted.
• Refresh tokens stored as SHA-256 hashes; raw tokens are never persisted.
• JWT access tokens with 15-minute expiry.
• Account lockout after 5 failed authentication attempts (15-minute lockout).
• Rate limiting on all authentication and submission endpoints.
• Strict CORS policies — API only accepts requests from authorised origins.
• Input validation and parameterised queries to prevent SQL injection.
• Audit logging of all data access, classification overrides, and admin actions.
• Principle of Least Privilege applied across all infrastructure components.

No system can be guaranteed 100% secure. In the event of a data breach affecting your personal data, we will notify you and applicable UAE authorities within the timeframes required by law.`,
  },
  {
    id: 's10',
    title: '10. Your Rights',
    content: `Under UAE Federal Decree-Law No. 45 of 2021 (PDPL) and, where applicable, the EU General Data Protection Regulation (GDPR), you have the following rights:

Right of Access: Request a copy of the personal data we hold about you.
Right to Rectification: Request correction of inaccurate or incomplete data.
Right to Erasure: Request deletion of your data, subject to legal retention obligations.
Right to Restriction: Request that we restrict processing of your data in certain circumstances.
Right to Data Portability: Receive your data in a structured, machine-readable format.
Right to Object: Object to processing based on legitimate interests.
Right to Withdraw Consent: Where processing is based on consent, you may withdraw at any time.

To exercise any of these rights, email our data team at hello@taxsentry.com with subject line "Data Rights Request". We will respond within 30 days. We may require identity verification before processing the request.`,
  },
  {
    id: 's11',
    title: '11. Cookies',
    content: `TaxSentry uses strictly necessary cookies for platform operation (session management via httpOnly, Secure cookies) and functional cookies for user preferences. We do not use third-party advertising cookies.

For full details, see our Cookie Policy.`,
  },
  {
    id: 's12',
    title: '12. Changes to This Policy',
    content: `We may update this Policy from time to time. Where changes are material, we will notify account administrators by email at least 14 days before the change takes effect. Continued use of TaxSentry following notification constitutes acceptance of the updated Policy.

This Policy was last substantively updated in May 2026.`,
  },
  {
    id: 's13',
    title: '13. Governing Law & Disputes',
    content: `This Policy is governed by the laws of the United Arab Emirates. Any dispute arising out of or in connection with this Policy shall be subject to the exclusive jurisdiction of the courts of the Dubai International Financial Centre (DIFC) or, where applicable, the UAE federal courts.

If you have a complaint about how we handle your data and we have been unable to resolve it, you may refer the matter to the UAE Data Office established under Federal Decree-Law No. 45 of 2021.`,
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--ts-bg-base)', color: 'var(--ts-fg-primary)', minHeight: '100vh', paddingTop: 140, paddingBottom: 120 }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: 64 }}>
          <div className="inline-flex items-center gap-2 mb-5" style={{ padding: '5px 14px', borderRadius: 9999, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#f87171' }}>
            Legal · Privacy
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 20, lineHeight: 1.1 }}>
            Privacy Policy
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', marginBottom: 28, paddingBottom: 28, borderBottom: '1px solid var(--ts-border)' }}>
            <span style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>
              <strong style={{ color: 'var(--ts-fg-secondary)' }}>Controller:</strong> Ripple Nexus
            </span>
            <span style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>
              <strong style={{ color: 'var(--ts-fg-secondary)' }}>Effective:</strong> 1 May 2026
            </span>
            <span style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>
              <strong style={{ color: 'var(--ts-fg-secondary)' }}>Governing Law:</strong> UAE
            </span>
          </div>
          <p style={{ fontSize: 15, color: 'var(--ts-fg-secondary)', lineHeight: 1.8 }}>
            This Privacy Policy describes how Ripple Nexus ("we", "us", "our") collects, uses, and protects information about you when you use TaxSentry. It complies with UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data (PDPL) and applicable international data protection standards.
          </p>
        </div>

        {/* Table of Contents */}
        <nav style={{ padding: '24px 28px', borderRadius: 14, background: 'var(--ts-bg-muted)', border: '1px solid var(--ts-border)', marginBottom: 60 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ts-fg-secondary)', marginBottom: 16 }}>Table of Contents</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '6px 24px' }}>
            {SECTIONS.map(s => (
              <a key={s.id} href={`#${s.id}`} style={{ fontSize: 13, color: 'var(--ts-fg-secondary)', textDecoration: 'none', display: 'block', padding: '3px 0' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-secondary)'; }}>
                {s.title}
              </a>
            ))}
          </div>
        </nav>

        {/* Sections */}
        <div style={{ fontSize: 15, color: 'var(--ts-fg-secondary)', lineHeight: 1.85 }}>
          {SECTIONS.map((section, idx) => (
            <div key={section.id} id={section.id} style={{ marginBottom: 56, paddingTop: idx > 0 ? 8 : 0 }}>
              <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--ts-fg-primary)', marginTop: 0, marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--ts-border)' }}>
                {section.title}
              </h2>
              {section.content.split('\n').filter(Boolean).map((para, i) => (
                <p key={i} style={{ marginBottom: 14 }}>
                  {para}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Contact box */}
        <div style={{ marginTop: 72, padding: '32px 36px', background: 'var(--ts-bg-card)', borderRadius: 16, border: '1px solid var(--ts-border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ts-fg-secondary)', marginBottom: 12 }}>Data & Legal Enquiries</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ts-fg-primary)', marginBottom: 12 }}>Contact Ripple Nexus</h3>
          <p style={{ fontSize: 14, color: 'var(--ts-fg-muted)', marginBottom: 20, lineHeight: 1.7 }}>
            For data rights requests, legal notices, or privacy queries, please contact us at:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="mailto:hello@taxsentry.com" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ts-blue-400)', textDecoration: 'none' }}>
              hello@taxsentry.com
            </a>
            <span style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>
              Ripple Nexus · Dubai International Financial Centre · United Arab Emirates
            </span>
          </div>
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--ts-border)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <Link href="/terms" style={{ fontSize: 13, color: 'var(--ts-fg-secondary)', textDecoration: 'none' }}>Terms of Service →</Link>
            <Link href="/cookies" style={{ fontSize: 13, color: 'var(--ts-fg-secondary)', textDecoration: 'none' }}>Cookie Policy →</Link>
            <Link href="/security" style={{ fontSize: 13, color: 'var(--ts-fg-secondary)', textDecoration: 'none' }}>Security & Architecture →</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
