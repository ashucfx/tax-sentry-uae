'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyEmailAction, resendVerificationAction } from '@/lib/auth/actions';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error' | 'resent'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;

    setStatus('verifying');
    verifyEmailAction(token)
      .then(() => {
        setStatus('success');
        setTimeout(() => router.push('/sign-in?verified=1'), 2000);
      })
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'This verification link has expired or is invalid.';
        setErrorMsg(msg);
        setStatus('error');
      });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerificationAction();
      setStatus('resent');
    } catch {
      setErrorMsg('Could not resend — please sign in and try again from the banner.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--ts-bg-deepest)' }}
    >
      <div
        className="w-full max-w-md p-8 rounded-2xl text-center space-y-5"
        style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border-subtle)' }}
      >
        {/* No token — show waiting state */}
        {!token && (
          <>
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-full mx-auto"
              style={{ background: 'rgba(59,130,246,0.1)' }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--ts-blue-400)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--ts-fg-primary)' }}>
              Verify your email
            </h2>
            <p className="text-sm" style={{ color: 'var(--ts-fg-muted)' }}>
              Check your inbox for a verification link. Click it to activate your account.
            </p>
            <button
              onClick={handleResend}
              disabled={resending || status === 'resent'}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
              style={{ background: 'var(--ts-blue-600)', color: '#fff' }}
            >
              {resending ? 'Sending…' : status === 'resent' ? 'Email sent!' : 'Resend verification email'}
            </button>
            <Link href="/sign-in" className="block text-sm" style={{ color: 'var(--ts-fg-muted)' }}>
              Back to sign in
            </Link>
          </>
        )}

        {/* Token present — verifying */}
        {token && status === 'verifying' && (
          <>
            <div
              className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 mx-auto"
              style={{ borderColor: 'var(--ts-blue-500)' }}
            />
            <h2 className="text-xl font-bold" style={{ color: 'var(--ts-fg-primary)' }}>
              Verifying your email…
            </h2>
          </>
        )}

        {/* Success */}
        {status === 'success' && (
          <>
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-full mx-auto"
              style={{ background: 'rgba(34,197,94,0.1)' }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--ts-green-400)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--ts-fg-primary)' }}>
              Email verified!
            </h2>
            <p className="text-sm" style={{ color: 'var(--ts-fg-muted)' }}>
              Your account is active. Redirecting to sign in…
            </p>
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-full mx-auto"
              style={{ background: 'rgba(239,68,68,0.1)' }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--ts-red-400)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--ts-fg-primary)' }}>
              Verification failed
            </h2>
            <p className="text-sm" style={{ color: 'var(--ts-red-400)' }}>{errorMsg}</p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
              style={{ background: 'var(--ts-blue-600)', color: '#fff' }}
            >
              {resending ? 'Sending…' : 'Resend verification email'}
            </button>
            <Link href="/sign-in" className="block text-sm" style={{ color: 'var(--ts-fg-muted)' }}>
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ts-bg-deepest)' }}>
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: 'var(--ts-blue-500)' }} />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
