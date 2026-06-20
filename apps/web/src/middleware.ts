import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
  '/account',
  '/activity',
  '/support',
];

const AUTH_ROUTES = ['/sign-in'];

// Non-httpOnly indicator cookie managed by store.ts on setAuth / clearAuth.
// The API enforces real JWT auth — this cookie is for SSR routing only.
const SESSION_COOKIE = 'ts_session_exists';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  if (AUTH_ROUTES.some((prefix) => pathname.startsWith(prefix)) && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
};
