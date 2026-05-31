import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require an active session
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/billing',
  '/revenue',
  '/substance',
  '/alerts',
  '/reports',
  '/settings',
  '/transactions',
  '/audit-log',
  '/onboarding',
];

// Routes that should redirect to /redirect when already signed in
const AUTH_ROUTES = ['/sign-in'];

export function middleware(request: NextRequest) {
  // In cross-domain deployments (e.g. Vercel frontend, Render backend),
  // the Next.js middleware cannot read the backend's httpOnly cookies.
  // Therefore, we bypass middleware auth checks and rely on client-side
  // interceptors (client.ts) and AuthProvider to protect routes and handle 401s.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match everything except static files, Next.js internals, and API routes
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
};
