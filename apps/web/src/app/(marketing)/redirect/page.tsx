'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { refreshAction } from '@/lib/auth/actions';
import { api } from '@/lib/api/client';

/**
 * Post-login landing pad:
 *  - Restores session from httpOnly refresh token cookie
 *  - Not authenticated → /sign-in
 *  - Org pending setup (PENDING- trade license) → /onboarding
 *  - Org fully set up → /dashboard
 *  - Any API failure → /sign-in with error param (not silently to /dashboard)
 */
export default function RedirectPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function go() {
      const token = await refreshAction();
      if (!token) {
        router.push('/sign-in');
        return;
      }

      try {
        const response = await api.get('/organizations/me');
        const org = response.data?.data;

        if (!org) {
          // Org data missing — session valid but org not set up yet
          router.push('/onboarding');
          return;
        }

        if (org.tradeLicenseNo?.startsWith('PENDING-')) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403) {
          // Token was valid for refresh but org lookup failed auth — clear and re-sign-in
          router.push('/sign-in');
        } else {
          // Server error or network failure — show inline error, don't redirect blindly
          setError('Failed to load your workspace. Please try again.');
        }
      }
    }

    go();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--ts-bg-deepest)' }}
    >
      <div className="text-center">
        {error ? (
          <>
            <p className="text-sm font-medium" style={{ color: 'var(--ts-red-500)' }}>
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm underline"
              style={{ color: 'var(--ts-blue-500)' }}
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <div
              className="inline-block animate-spin rounded-full h-12 w-12 border-b-2"
              style={{ borderColor: 'var(--ts-blue-500)' }}
            />
            <p className="mt-4 text-sm" style={{ color: 'var(--ts-fg-muted)' }}>
              Setting up your workspace…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
