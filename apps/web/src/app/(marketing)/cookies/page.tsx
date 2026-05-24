export default function Page() {
  return (
    <div style={{ background: 'var(--ts-bg-base)', color: 'var(--ts-fg-primary)', minHeight: '100vh', paddingTop: 140, paddingBottom: 100 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 32px' }}>
        <div className="inline-flex items-center gap-2 mb-6" style={{ padding: '6px 16px', borderRadius: 9999, background: 'var(--ts-bg-muted)', border: '1px solid var(--ts-border)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ts-fg-secondary)' }}>
          Legal Department
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 24 }}>
          TaxSentry Cookie Policy
        </h1>
        <p style={{ fontSize: 16, color: 'var(--ts-fg-muted)', marginBottom: 60, paddingBottom: 40, borderBottom: '1px solid var(--ts-border)' }}>
          Last updated: May 2026. This document constitutes a legally binding agreement between you and Ripple Nexus ("Company," "we," "us," or "our"), the parent entity of TaxSentry.
        </p>
        
        <div style={{ fontSize: 15, color: 'var(--ts-fg-secondary)', lineHeight: 1.85, fontFamily: 'var(--font-sans)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ts-fg-primary)', marginTop: 48, marginBottom: 16 }}>1. Agreement to Terms</h2>
          <p style={{ marginBottom: 24 }}>
            By accessing or using TaxSentry, a financial compliance infrastructure product operated by Ripple Nexus, you agree to be bound by this Cookie Policy. TaxSentry is architected exclusively for UAE Free Zone Qualifying Persons navigating the 9% corporate tax regime. If you do not agree with any part of these terms, you must not use our services.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ts-fg-primary)', marginTop: 48, marginBottom: 16 }}>2. UAE Data Sovereignty & Ripple Nexus Obligations</h2>
          <p style={{ marginBottom: 24 }}>
            Ripple Nexus guarantees that all data processed through TaxSentry is securely encrypted and hosted entirely within domestic UAE infrastructure (Google Cloud me-central1). This architecture ensures strict alignment with UAE Federal Tax Authority (FTA) data locality expectations.
          </p>
          <p style={{ marginBottom: 24 }}>
            The Cookie Policy governs how Ripple Nexus accesses, categorizes, and audits your financial transactions (including Qualifying and Non-Qualifying Income thresholds). We act solely as a data processor under UAE law, while you retain all rights as the data controller.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ts-fg-primary)', marginTop: 48, marginBottom: 16 }}>3. Enterprise Liability Limitations</h2>
          <p style={{ marginBottom: 24 }}>
            While TaxSentry provides real-time de-minimis tracking and risk scoring, Ripple Nexus does not provide licensed legal or tax advice. The platform's automated generation of FTA audit packs is intended solely to support your independent financial professionals. Ripple Nexus shall not be held liable for any loss of Qualifying Free Zone Person (QFZP) status, penalties, or corporate tax assessments levied by the FTA.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ts-fg-primary)', marginTop: 48, marginBottom: 16 }}>4. Subscription & Access Provisions</h2>
          <p style={{ marginBottom: 24 }}>
            Access to TaxSentry is granted on a subscription basis. Ripple Nexus reserves the right to modify, suspend, or terminate access to the platform in the event of a breach of this Cookie Policy, failure to process payments, or instances of suspected unauthorized access.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ts-fg-primary)', marginTop: 48, marginBottom: 16 }}>5. Changes to the Document</h2>
          <p style={{ marginBottom: 24 }}>
            Ripple Nexus reserves the right to update this Cookie Policy at any time. Significant changes will be communicated to your administrative account holders. Continued use of TaxSentry following any changes indicates your acceptance of the updated document.
          </p>

          <div style={{ marginTop: 80, padding: 32, background: 'var(--ts-bg-muted)', borderRadius: 16, border: '1px solid var(--ts-border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--ts-fg-primary)', marginBottom: 12 }}>Contact the Legal Team</h3>
            <p style={{ fontSize: 14, margin: 0 }}>
              If you have any questions regarding this Cookie Policy, please contact Ripple Nexus legal counsel at legal@theripplenexus.com.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
