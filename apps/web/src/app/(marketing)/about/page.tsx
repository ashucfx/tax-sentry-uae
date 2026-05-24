export default function Page() {
  return (
    <div style={{ background: 'var(--ts-bg-base)', color: 'var(--ts-fg-primary)', minHeight: '100vh', paddingTop: 140, paddingBottom: 100 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 32px' }}>
        <h1 style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 24 }}>
          About Us
        </h1>
        <p style={{ fontSize: 16, color: 'var(--ts-fg-muted)', marginBottom: 60 }}>Last updated: May 2026</p>
        
        <div style={{ fontSize: 16, color: 'var(--ts-fg-secondary)', lineHeight: 1.8 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ts-fg-primary)', marginTop: 40, marginBottom: 16 }}>1. Introduction</h2>
          <p style={{ marginBottom: 24 }}>
            Welcome to the TaxSentry About Us. This section outlines the structural foundations, compliance parameters, and operational frameworks governing our enterprise platform in the United Arab Emirates.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ts-fg-primary)', marginTop: 40, marginBottom: 16 }}>2. UAE Data Sovereignty</h2>
          <p style={{ marginBottom: 24 }}>
            TaxSentry is architected exclusively for UAE Free Zone Qualifying Persons. All data processed through the About Us module is securely encrypted and hosted entirely within domestic UAE data centers (me-central1) to guarantee absolute data locality.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ts-fg-primary)', marginTop: 40, marginBottom: 16 }}>3. Compliance & Auditing</h2>
          <p style={{ marginBottom: 24 }}>
            We adhere to the strictest enterprise standards. By leveraging the About Us, users agree to standard monitoring terms designed to prevent the breach of the AED 5M / 5% Non-Qualifying Income thresholds.
          </p>
        </div>
      </div>
    </div>
  );
}
