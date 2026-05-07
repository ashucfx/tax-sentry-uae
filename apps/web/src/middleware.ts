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
const AUTH_ROUTES = ['/sign-in', '/sign-up'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Presence of the refresh token cookie = active session.
  // Actual session validity is verified by AuthProvider calling /auth/refresh.
  const hasSession = !!request.cookies.get('refreshToken');

  // Signed-in user on auth routes or home page → send to redirect
  if (hasSession && (AUTH_ROUTES.some((p) => pathname.startsWith(p)) || pathname === '/')) {
    return NextResponse.redirect(new URL('/redirect', request.url));
  }

  // Protected platform routes without a session → send to sign-in
  if (!hasSession && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = new URL('/sign-in', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match everything except static files, Next.js internals, and API routes
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
};
