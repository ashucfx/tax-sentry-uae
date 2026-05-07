'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { loginAction } from '@/lib/auth/actions';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified') === '1';
  const reset = searchParams.get('reset') === '1';
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await loginAction(data.email, data.password);
      router.push('/redirect');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Sign in failed. Please check your credentials.';
      setServerError(msg);
    }
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--ts-fg-primary)' }}>
          Welcome back
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--ts-fg-muted)' }}>
          Sign in to your TaxSentry account
        </p>
      </div>

      {verified && (
        <div
          className="mb-5 p-3 rounded-lg text-sm"
          style={{
            background: 'rgba(34,197,94,0.1)',
            color: 'var(--ts-green-400)',
            border: '1px solid rgba(34,197,94,0.2)',
          }}
        >
          Email verified — you can now sign in.
        </div>
      )}

      {reset && (
        <div
          className="mb-5 p-3 rounded-lg text-sm"
          style={{
            background: 'rgba(59,130,246,0.1)',
            color: 'var(--ts-blue-400)',
            border: '1px solid rgba(59,130,246,0.2)',
          }}
        >
          Password updated — sign in with your new password.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--ts-fg-secondary)' }}
          >
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
            style={{
              background: 'var(--ts-bg-input)',
              border: `1px solid ${errors.email ? 'var(--ts-red-500)' : 'var(--ts-border-default)'}`,
              color: 'var(--ts-fg-primary)',
            }}
          />
          {errors.email && (
            <p className="mt-1 text-xs" style={{ color: 'var(--ts-red-400)' }}>
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--ts-fg-secondary)' }}
          >
            Password
          </label>
          <input
            {...register('password')}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
            style={{
              background: 'var(--ts-bg-input)',
              border: `1px solid ${errors.password ? 'var(--ts-red-500)' : 'var(--ts-border-default)'}`,
              color: 'var(--ts-fg-primary)',
            }}
          />
          {errors.password && (
            <p className="mt-1 text-xs" style={{ color: 'var(--ts-red-400)' }}>
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs"
            style={{ color: 'var(--ts-blue-400)' }}
          >
            Forgot password?
          </Link>
        </div>

        {serverError && (
          <div
            className="p-3 rounded-lg text-sm"
            style={{
              background: 'rgba(239,68,68,0.1)',
              color: 'var(--ts-red-400)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
          style={{ background: 'var(--ts-blue-600)', color: '#fff' }}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--ts-fg-muted)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" style={{ color: 'var(--ts-blue-400)' }}>
          Sign up
        </Link>
      </p>
    </>
  );
}

export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--ts-bg-deepest)' }}
    >
      <div
        className="w-full max-w-md p-8 rounded-2xl"
        style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border-subtle)' }}
      >
        <Suspense
          fallback={
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--ts-blue-500)' }} />
            </div>
          }
        >
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
