'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/store';
import { doRefresh } from '@/lib/api/client';

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
    let mounted = true;

    const performRefresh = async () => {
      try {
        await doRefresh();
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (mounted && (status === 401 || status === 403)) {
          router.push('/sign-in');
        }
      }
    };

    // Initial load: restore session if missing in this tab
    if (!accessToken) {
      performRefresh();
    }

    // Proactive refresh: automatically renew token 1 minute before 15m expiry
    const interval = setInterval(() => {
      performRefresh();
    }, 14 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [accessToken, router]);

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
