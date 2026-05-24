import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy | TaxSentry',
  description:
    'TaxSentry Cookie Policy — how we use cookies and similar tracking technologies on our platform and website.',
};

const COOKIE_TABLE = [
  { name: 'refreshToken', type: 'Strictly Necessary', purpose: 'Stores your session refresh token (httpOnly, Secure). Required for platform authentication. Never accessible to JavaScript.', duration: '30 days', provider: 'TaxSentry (Ripple Nexus)' },
  { name: '__Host-XSRF', type: 'Strictly Necessary', purpose: 'CSRF protection token for authenticated form submissions.', duration: 'Session', provider: 'TaxSentry (Ripple Nexus)' },
  { name: 'ts_pref', type: 'Functional', purpose: 'Stores your UI preferences (theme, table column settings). No personal data.', duration: '1 year', provider: 'TaxSentry (Ripple Nexus)' },
];

export default function CookiesPage() {
  return (
    <div style={{ background: 'var(--ts-bg-base)', color: 'var(--ts-fg-primary)', minHeight: '100vh', paddingTop: 140, paddingBottom: 120 }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: 64 }}>
          <div className="inline-flex items-center gap-2 mb-5" style={{ padding: '5px 14px', borderRadius: 9999, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#f87171' }}>
            Legal · Cookies
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 20, lineHeight: 1.1 }}>
            Cookie Policy
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', marginBottom: 28, paddingBottom: 28, borderBottom: '1px solid var(--ts-border)' }}>
            <span style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>
              <strong style={{ color: 'var(--ts-fg-secondary)' }}>Controller:</strong> Ripple Nexus
            </span>
            <span style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>
              <strong style={{ color: 'var(--ts-fg-secondary)' }}>Effective:</strong> 1 May 2026
            </span>
          </div>
          <p style={{ fontSize: 15, color: 'var(--ts-fg-secondary)', lineHeight: 1.8 }}>
            This Cookie Policy explains how TaxSentry (operated by Ripple Nexus) uses cookies and similar technologies. We are committed to minimal, privacy-first cookie usage.
          </p>
        </div>

        <div style={{ fontSize: 15, color: 'var(--ts-fg-secondary)', lineHeight: 1.85 }}>

          <div id="s1" style={{ marginBottom: 52 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--ts-fg-primary)', marginTop: 0, marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--ts-border)' }}>
              1. What Are Cookies?
            </h2>
            <p style={{ marginBottom: 14 }}>
              Cookies are small text files placed on your device by a website you visit. They serve various functions, including maintaining your login state, remembering preferences, and analysing how you use a site.
            </p>
            <p>
              TaxSentry takes a minimal-cookie approach. We do not use advertising cookies, third-party tracking pixels, or social media embeds that set cookies.
            </p>
          </div>

          <div id="s2" style={{ marginBottom: 52 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--ts-fg-primary)', marginTop: 0, marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--ts-border)' }}>
              2. Categories of Cookies We Use
            </h2>
            <p style={{ marginBottom: 24 }}>
              We use two categories of cookies. We do not use analytics, advertising, or third-party tracking cookies.
            </p>
            <div style={{ marginBottom: 20, padding: '20px 24px', borderRadius: 12, background: 'var(--ts-bg-muted)', border: '1px solid var(--ts-border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ts-fg-primary)', marginBottom: 8 }}>🔒 Strictly Necessary Cookies</div>
              <p style={{ fontSize: 14, color: 'var(--ts-fg-muted)', margin: 0, lineHeight: 1.65 }}>
                Required for the platform to function. These include session authentication cookies. You cannot opt out of these cookies while using the platform — they are essential to service delivery. They do not track you for advertising or analytics.
              </p>
            </div>
            <div style={{ padding: '20px 24px', borderRadius: 12, background: 'var(--ts-bg-muted)', border: '1px solid var(--ts-border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ts-fg-primary)', marginBottom: 8 }}>⚙️ Functional Cookies</div>
              <p style={{ fontSize: 14, color: 'var(--ts-fg-muted)', margin: 0, lineHeight: 1.65 }}>
                Used to remember your preferences (e.g., UI theme, table column visibility) so you do not need to re-configure them on each visit. These cookies do not contain personal or financial data and cannot be used to identify you across other sites.
              </p>
            </div>
          </div>

          <div id="s3" style={{ marginBottom: 52 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--ts-fg-primary)', marginTop: 0, marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--ts-border)' }}>
              3. Specific Cookies in Use
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--ts-bg-muted)', borderBottom: '2px solid var(--ts-border)' }}>
                    {['Cookie Name', 'Category', 'Purpose', 'Duration', 'Provider'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--ts-fg-secondary)', fontSize: 12, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COOKIE_TABLE.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--ts-border)', background: i % 2 === 0 ? 'transparent' : 'var(--ts-bg-muted)' }}>
                      <td style={{ padding: '12px 14px', color: 'var(--ts-fg-primary)', fontWeight: 600, fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap' }}>{row.name}</td>
                      <td style={{ padding: '12px 14px', color: row.type === 'Strictly Necessary' ? '#34d399' : 'var(--ts-blue-400)', fontWeight: 600, whiteSpace: 'nowrap' }}>{row.type}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--ts-fg-muted)', lineHeight: 1.5 }}>{row.purpose}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--ts-fg-secondary)', whiteSpace: 'nowrap' }}>{row.duration}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--ts-fg-secondary)', whiteSpace: 'nowrap' }}>{row.provider}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div id="s4" style={{ marginBottom: 52 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--ts-fg-primary)', marginTop: 0, marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--ts-border)' }}>
              4. What We Do NOT Use
            </h2>
            <p style={{ marginBottom: 14 }}>
              TaxSentry does not use:
            </p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Google Analytics, Mixpanel, or any third-party web analytics platforms',
                'Facebook Pixel, LinkedIn Insight Tag, or advertising cookies of any kind',
                'Hotjar, FullStory, or session recording tools',
                'Social media sharing widgets that set cookies',
                'Cross-site tracking cookies or persistent advertising IDs',
              ].map(item => (
                <li key={item} style={{ fontSize: 14, color: 'var(--ts-fg-secondary)', lineHeight: 1.6 }}>{item}</li>
              ))}
            </ul>
          </div>

          <div id="s5" style={{ marginBottom: 52 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--ts-fg-primary)', marginTop: 0, marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--ts-border)' }}>
              5. Managing Cookies
            </h2>
            <p style={{ marginBottom: 14 }}>
              You can control and delete cookies through your browser settings. Deleting or blocking strictly necessary cookies (particularly the <code style={{ fontFamily: 'monospace', background: 'var(--ts-bg-muted)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>refreshToken</code> cookie) will sign you out of TaxSentry and require re-authentication.
            </p>
            <p>
              Most browsers allow you to: (a) view and delete existing cookies; (b) block cookies from specific sites; or (c) block all cookies. Please note that blocking all cookies will impair the functionality of most web applications, including TaxSentry.
            </p>
          </div>

          <div id="s6" style={{ marginBottom: 52 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--ts-fg-primary)', marginTop: 0, marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--ts-border)' }}>
              6. Changes to This Policy
            </h2>
            <p>
              We may update this Cookie Policy if we introduce new features that use additional cookies. Where changes are material, we will notify account administrators by email at least 14 days before the change takes effect.
            </p>
          </div>

        </div>

        {/* Contact box */}
        <div style={{ marginTop: 72, padding: '32px 36px', background: 'var(--ts-bg-card)', borderRadius: 16, border: '1px solid var(--ts-border)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ts-fg-primary)', marginBottom: 12 }}>Questions About Cookies?</h3>
          <p style={{ fontSize: 14, color: 'var(--ts-fg-muted)', marginBottom: 16, lineHeight: 1.7 }}>
            Contact our data team at <a href="mailto:hello@gettaxsentry.com" style={{ color: 'var(--ts-blue-400)', textDecoration: 'none' }}>hello@gettaxsentry.com</a>
          </p>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid var(--ts-border)' }}>
            <Link href="/privacy" style={{ fontSize: 13, color: 'var(--ts-fg-secondary)', textDecoration: 'none' }}>Privacy Policy →</Link>
            <Link href="/terms" style={{ fontSize: 13, color: 'var(--ts-fg-secondary)', textDecoration: 'none' }}>Terms of Service →</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
