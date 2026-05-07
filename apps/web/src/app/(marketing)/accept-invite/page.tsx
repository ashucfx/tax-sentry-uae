'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { acceptInviteAction } from '@/lib/auth/actions';

const schema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(80),
    lastName: z.string().min(1, 'Last name is required').max(80),
    password: z
      .string()
      .min(10, 'Password must be at least 10 characters')
      .max(128)
      .regex(/^(?=.*[\d\W])/, 'Password must contain at least one number or symbol'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm" style={{ color: 'var(--ts-red-400)' }}>
          Invalid or missing invitation token.
        </p>
        <Link href="/sign-in" className="text-sm font-medium" style={{ color: 'var(--ts-blue-400)' }}>
          Go to sign in
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await acceptInviteAction(token, data.password, data.firstName, data.lastName);
      router.push('/redirect');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invitation could not be accepted. The link may have expired.';
      setServerError(msg);
    }
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--ts-fg-primary)' }}>
          Accept invitation
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--ts-fg-muted)' }}>
          Create your account to join your team on TaxSentry
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ts-fg-secondary)' }}>
              First name
            </label>
            <input
              {...register('firstName')}
              type="text"
              autoComplete="given-name"
              placeholder="Ahmed"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--ts-bg-input)',
                border: `1px solid ${errors.firstName ? 'var(--ts-red-500)' : 'var(--ts-border-default)'}`,
                color: 'var(--ts-fg-primary)',
              }}
            />
            {errors.firstName && (
              <p className="mt-1 text-xs" style={{ color: 'var(--ts-red-400)' }}>{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ts-fg-secondary)' }}>
              Last name
            </label>
            <input
              {...register('lastName')}
              type="text"
              autoComplete="family-name"
              placeholder="Al Rashidi"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--ts-bg-input)',
                border: `1px solid ${errors.lastName ? 'var(--ts-red-500)' : 'var(--ts-border-default)'}`,
                color: 'var(--ts-fg-primary)',
              }}
            />
            {errors.lastName && (
              <p className="mt-1 text-xs" style={{ color: 'var(--ts-red-400)' }}>{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ts-fg-secondary)' }}>
            Password
          </label>
          <input
            {...register('password')}
            type="password"
            autoComplete="new-password"
            placeholder="At least 10 characters, 1 number or symbol"
            className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
            style={{
              background: 'var(--ts-bg-input)',
              border: `1px solid ${errors.password ? 'var(--ts-red-500)' : 'var(--ts-border-default)'}`,
              color: 'var(--ts-fg-primary)',
            }}
          />
          {errors.password && (
            <p className="mt-1 text-xs" style={{ color: 'var(--ts-red-400)' }}>{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ts-fg-secondary)' }}>
            Confirm password
          </label>
          <input
            {...register('confirmPassword')}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
            style={{
              background: 'var(--ts-bg-input)',
              border: `1px solid ${errors.confirmPassword ? 'var(--ts-red-500)' : 'var(--ts-border-default)'}`,
              color: 'var(--ts-fg-primary)',
            }}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs" style={{ color: 'var(--ts-red-400)' }}>{errors.confirmPassword.message}</p>
          )}
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
          className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60 mt-2"
          style={{ background: 'var(--ts-blue-600)', color: '#fff' }}
        >
          {isSubmitting ? 'Creating account…' : 'Join team'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--ts-fg-muted)' }}>
        Already have an account?{' '}
        <Link href="/sign-in" style={{ color: 'var(--ts-blue-400)' }}>
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function AcceptInvitePage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
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
          <AcceptInviteForm />
        </Suspense>
      </div>
    </div>
  );
}
