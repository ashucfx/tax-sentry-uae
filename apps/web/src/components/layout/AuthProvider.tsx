'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/store';
import { refreshAction } from '@/lib/auth/actions';

/**
 * Restores the session on every platform page load by calling /auth/refresh.
 * The httpOnly refreshToken cookie is sent automatically (withCredentials).
 * Shows a spinner until the session check resolves, then either renders
 * children (authenticated) or redirects to /sign-in (no valid session).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, accessToken } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    refreshAction().then((token) => {
      if (!token) {
        router.push('/sign-in');
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: 'var(--ts-bg-deepest)' }}
      >
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-10 w-10 border-b-2"
            style={{ borderColor: 'var(--ts-blue-500)' }}
          />
          <p className="mt-3 text-sm" style={{ color: 'var(--ts-fg-muted)' }}>
            Loading your workspace…
          </p>
        </div>
      </div>
    );
  }

  // Session check failed — router.push('/sign-in') is in flight; render nothing
  if (!accessToken) return null;

  return <>{children}</>;
}
