/** @type {import('next').NextConfig} */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Block framing (clickjacking protection)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Legacy XSS filter (belt-and-suspenders)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Limit referrer information on cross-origin navigations
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Force HTTPS for 1 year (production only — doesn't harm dev)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  // Restrict browser feature access
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(self), usb=()',
  },
  // Content Security Policy
  // - default-src: only same-origin
  // - script-src: self + Next.js inline scripts (unsafe-inline needed for App Router hydration)
  // - style-src: self + inline (Tailwind applies inline styles)
  // - img-src: self + data URIs (charts, avatars)
  // - connect-src: self + API backend
  // - font-src: self + Google Fonts
  // - frame-ancestors: none (redundant with X-Frame-Options but defence-in-depth)
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob:",
      `connect-src 'self' ${API_URL}`,
      "font-src 'self' https://fonts.gstatic.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  headers: async () => [
    {
      source: '/(.*)',
      headers: securityHeaders,
    },
  ],
};

module.exports = nextConfig;
