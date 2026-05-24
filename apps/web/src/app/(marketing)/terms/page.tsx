import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | TaxSentry',
  description:
    'TaxSentry Terms of Service — the legally binding agreement governing your use of the TaxSentry platform operated by Ripple Nexus.',
};

const SECTIONS = [
  {
    id: 's1',
    title: '1. Parties & Acceptance',
    content: `These Terms of Service ("Terms") constitute a legally binding agreement between you (the "Customer", "you", "your") and Ripple Nexus ("Company", "we", "us", "our"), the entity operating TaxSentry. By accessing, registering for, or using TaxSentry, you confirm that you have read, understood, and agree to be bound by these Terms.

If you are entering these Terms on behalf of a company or organisation, you represent that you have the authority to bind that entity, and "you" refers to that entity.

These Terms apply to all users of TaxSentry, including administrators, finance team members, auditors, and viewers.`,
  },
  {
    id: 's2',
    title: '2. Service Description',
    content: `TaxSentry is a financial compliance monitoring platform designed for UAE Free Zone companies maintaining Qualifying Free Zone Person (QFZP) status under UAE Federal Decree-Law No. 47 of 2022 on the Taxation of Corporations and Businesses ("Corporate Tax Law").

The Service includes:
• De-minimis threshold tracking (dual percentage and absolute tests)
• Revenue classification engine (QI, NQI, Excluded categories)
• Substance document vault with expiry monitoring
• Composite QFZP risk scoring
• FTA audit pack generation
• Alert management and threshold notifications

The Service is expressly not a licensed tax advisory, legal, or accounting service. All outputs are tools to support your independent professional advisors.`,
  },
  {
    id: 's3',
    title: '3. Subscription & Access',
    content: `3.1 Free Trial: New accounts receive a 14-day free trial with full platform access. No credit card is required during the trial. At the end of the trial, a subscription is required to maintain access.

3.2 Subscription Plans: Paid subscriptions are available on monthly or annual billing cycles. Plan details, features, and pricing are published at taxsentry.com/pricing.

3.3 Auto-Renewal: Subscriptions automatically renew at the end of each billing period unless cancelled before the renewal date.

3.4 Cancellation: You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period; you retain platform access until then.

3.5 Refunds: We offer a 30-day money-back guarantee on new paid subscriptions. Refund requests must be submitted by email to hello@gettaxsentry.com within 30 days of the first charge. Refunds are not available for renewal charges.

3.6 Suspension: We may suspend or terminate your access if: (a) you breach these Terms; (b) payment is overdue and remains unpaid after a 7-day grace period; or (c) we suspect fraudulent, abusive, or illegal activity.`,
  },
  {
    id: 's4',
    title: '4. Customer Data & Content',
    content: `4.1 Ownership: You retain full ownership of all financial data, revenue transactions, documents, and other content you upload to TaxSentry ("Customer Data"). We acquire no intellectual property rights in your Customer Data.

4.2 Licence to Us: You grant Ripple Nexus a limited, non-exclusive licence to host, process, and transmit your Customer Data solely for the purpose of providing the Service.

4.3 Data Accuracy: You are responsible for the accuracy, completeness, and legality of all Customer Data you submit. TaxSentry outputs are only as accurate as the data provided.

4.4 Data Portability: You may export your Customer Data at any time via the reports and CSV export features. Following account closure, you have 30 days to export your data before it enters the deletion queue, subject to legal retention requirements.`,
  },
  {
    id: 's5',
    title: '5. Acceptable Use',
    content: `You agree not to:

• Use TaxSentry for any unlawful purpose or in violation of UAE law.
• Upload data belonging to individuals or organisations without their authorisation.
• Attempt to gain unauthorised access to other users' accounts, data, or platform infrastructure.
• Conduct automated scraping, bulk data extraction, or vulnerability scanning of the platform.
• Reverse-engineer, decompile, or create derivative works based on the TaxSentry platform.
• Resell, sublicense, or provide access to TaxSentry to third parties without our written consent.
• Introduce malware, viruses, or malicious code to the platform.
• Submit false or misleading information for the purpose of manipulating compliance outputs.

Violation of these terms may result in immediate account suspension without refund.`,
  },
  {
    id: 's6',
    title: '6. Intellectual Property',
    content: `TaxSentry, the platform software, user interface, classification rules, risk scoring methodology, report templates, and all associated intellectual property are owned by or licensed to Ripple Nexus. Nothing in these Terms grants you ownership of or intellectual property rights in the platform.

You may provide feedback, suggestions, or feature requests. You agree that we may use any such feedback without obligation to you.`,
  },
  {
    id: 's7',
    title: '7. Disclaimers & Limitation of Liability',
    content: `7.1 No Tax Advice: TaxSentry is a compliance monitoring tool, not a source of legal, tax, or accounting advice. All classification results, risk scores, de-minimis calculations, and audit pack contents must be reviewed by a qualified UAE tax advisor or licensed accountant before use in FTA submissions.

7.2 No Guarantee of QFZP Status: We make no warranty that use of TaxSentry will result in or preserve your QFZP status. QFZP qualification is determined solely by the FTA based on applicable law.

7.3 Service Availability: We target 99.9% monthly uptime but do not guarantee uninterrupted service. Planned maintenance will be communicated in advance where possible.

7.4 Limitation of Liability: To the maximum extent permitted by UAE law, Ripple Nexus shall not be liable for:
(a) Indirect, incidental, special, or consequential damages;
(b) Loss of profits, revenue, data, goodwill, or QFZP status;
(c) FTA assessments, penalties, or audit findings;
(d) Errors arising from inaccurate Customer Data.

Our total aggregate liability shall not exceed the greater of: (i) subscription fees paid in the three (3) months prior to the event giving rise to the claim; or (ii) AED 5,000.

7.5 Indemnification: You agree to indemnify Ripple Nexus against any claims, damages, or costs arising from your breach of these Terms, your use of the Service, or the accuracy of Customer Data you submit.`,
  },
  {
    id: 's8',
    title: '8. Third-Party Services',
    content: `TaxSentry integrates with or links to third-party services including Dodo Payments (payment processing), Resend (email delivery), Google Cloud Platform (infrastructure), and accounting software providers (Zoho Books, Xero, QuickBooks).

Your use of these third-party services is subject to their respective terms and privacy policies. Ripple Nexus is not responsible for the acts or omissions of any third-party service provider.`,
  },
  {
    id: 's9',
    title: '9. Confidentiality',
    content: `Each party agrees to keep confidential the other party's non-public information received in connection with the Service, including Customer Data, pricing, and platform methodology.

This obligation of confidentiality does not apply to information that: (a) becomes publicly known through no breach of these Terms; (b) was already known to the receiving party; or (c) must be disclosed by applicable law or court order.`,
  },
  {
    id: 's10',
    title: '10. Term & Termination',
    content: `These Terms commence on your first access of TaxSentry and continue until terminated.

Either party may terminate by: (i) the Customer cancelling their subscription; or (ii) either party providing 30 days' written notice.

We may terminate immediately upon material breach, non-payment, or where required by law.

Upon termination: your access ceases; Customer Data is retained for the statutory retention period then deleted; outstanding invoices become immediately due.`,
  },
  {
    id: 's11',
    title: '11. Changes to Terms',
    content: `We may update these Terms from time to time. We will provide at least 14 days' notice of material changes by email to account administrators. Continued use of TaxSentry after the effective date of changes constitutes acceptance.

If you do not agree to revised Terms, you may terminate your subscription before the effective date of the changes.`,
  },
  {
    id: 's12',
    title: '12. Governing Law & Dispute Resolution',
    content: `These Terms are governed by the laws of the United Arab Emirates. Any dispute arising from or relating to these Terms or the Service shall first be submitted to good-faith negotiation. If not resolved within 30 days, disputes shall be referred to the courts of the Dubai International Financial Centre (DIFC).

If DIFC jurisdiction does not apply to your entity, disputes shall be subject to UAE federal courts with jurisdiction in Dubai.`,
  },
  {
    id: 's13',
    title: '13. General Provisions',
    content: `Entire Agreement: These Terms, together with the Privacy Policy and Cookie Policy, constitute the entire agreement between you and Ripple Nexus regarding TaxSentry.

Severability: If any provision of these Terms is found unenforceable, the remaining provisions shall remain in full force and effect.

No Waiver: Failure to enforce any provision of these Terms shall not constitute a waiver of that provision.

Assignment: You may not assign your rights under these Terms without our prior written consent. We may assign our rights to a successor entity in a merger, acquisition, or asset sale.

Force Majeure: Neither party shall be liable for failure to perform obligations due to events beyond their reasonable control, including acts of God, government actions, or internet infrastructure failures.`,
  },
];

export default function TermsPage() {
  return (
    <div style={{ background: 'var(--ts-bg-base)', color: 'var(--ts-fg-primary)', minHeight: '100vh', paddingTop: 140, paddingBottom: 120 }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: 64 }}>
          <div className="inline-flex items-center gap-2 mb-5" style={{ padding: '5px 14px', borderRadius: 9999, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#f87171' }}>
            Legal · Terms
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 20, lineHeight: 1.1 }}>
            Terms of Service
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', marginBottom: 28, paddingBottom: 28, borderBottom: '1px solid var(--ts-border)' }}>
            <span style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>
              <strong style={{ color: 'var(--ts-fg-secondary)' }}>Operator:</strong> Ripple Nexus
            </span>
            <span style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>
              <strong style={{ color: 'var(--ts-fg-secondary)' }}>Effective:</strong> 1 May 2026
            </span>
            <span style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>
              <strong style={{ color: 'var(--ts-fg-secondary)' }}>Governing Law:</strong> UAE
            </span>
          </div>
          <p style={{ fontSize: 15, color: 'var(--ts-fg-secondary)', lineHeight: 1.8 }}>
            These Terms of Service govern your use of TaxSentry, a financial compliance infrastructure platform operated by Ripple Nexus. Please read them carefully before using the platform.
          </p>
        </div>

        {/* Table of Contents */}
        <nav style={{ padding: '24px 28px', borderRadius: 14, background: 'var(--ts-bg-muted)', border: '1px solid var(--ts-border)', marginBottom: 60 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ts-fg-secondary)', marginBottom: 16 }}>Table of Contents</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '6px 24px' }}>
            {SECTIONS.map(s => (
              <a key={s.id} href={`#${s.id}`} className="text-[var(--ts-fg-secondary)] hover:text-[var(--ts-fg-primary)] transition-colors" style={{ fontSize: 13, textDecoration: 'none', display: 'block', padding: '3px 0' }}>
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
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ts-fg-secondary)', marginBottom: 12 }}>Legal & Contractual Enquiries</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ts-fg-primary)', marginBottom: 12 }}>Contact Ripple Nexus</h3>
          <p style={{ fontSize: 14, color: 'var(--ts-fg-muted)', marginBottom: 20, lineHeight: 1.7 }}>
            For contractual queries, notices, or legal requests, contact us at:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="mailto:hello@gettaxsentry.com" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ts-blue-400)', textDecoration: 'none' }}>
              hello@gettaxsentry.com
            </a>
            <span style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>
              Ripple Nexus · Dubai International Financial Centre · United Arab Emirates
            </span>
          </div>
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--ts-border)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <Link href="/privacy" style={{ fontSize: 13, color: 'var(--ts-fg-secondary)', textDecoration: 'none' }}>Privacy Policy →</Link>
            <Link href="/cookies" style={{ fontSize: 13, color: 'var(--ts-fg-secondary)', textDecoration: 'none' }}>Cookie Policy →</Link>
            <Link href="/security" style={{ fontSize: 13, color: 'var(--ts-fg-secondary)', textDecoration: 'none' }}>Security & Architecture →</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
