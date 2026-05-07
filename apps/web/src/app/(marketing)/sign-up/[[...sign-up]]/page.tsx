'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { signupAction } from '@/lib/auth/actions';

const schema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(80),
    lastName: z.string().min(1, 'Last name is required').max(80),
    email: z.string().email('Enter a valid email address'),
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

export default function SignUpPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await signupAction(data.email, data.password, data.firstName, data.lastName);
      setEmailSent(data.email);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Sign up failed. Please try again.';
      setServerError(msg);
    }
  };

  if (emailSent) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'var(--ts-bg-deepest)' }}
      >
        <div
          className="w-full max-w-md p-8 rounded-2xl text-center space-y-4"
          style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border-subtle)' }}
        >
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-full mx-auto"
            style={{ background: 'rgba(34,197,94,0.1)' }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--ts-green-400)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--ts-fg-primary)' }}>Check your email</h2>
          <p className="text-sm" style={{ color: 'var(--ts-fg-muted)' }}>
            We sent a verification link to <strong style={{ color: 'var(--ts-fg-secondary)' }}>{emailSent}</strong>.
            Click the link to activate your account.
          </p>
          <Link
            href="/sign-in"
            className="block text-sm font-medium"
            style={{ color: 'var(--ts-blue-400)' }}
          >
            Already verified? Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--ts-bg-deepest)' }}
    >
      <div
        className="w-full max-w-md p-8 rounded-2xl"
        style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border-subtle)' }}
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ts-fg-primary)' }}>
            Start your free trial
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--ts-fg-muted)' }}>
            14-day free trial · No credit card required
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--ts-fg-secondary)' }}
              >
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
                <p className="mt-1 text-xs" style={{ color: 'var(--ts-red-400)' }}>
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--ts-fg-secondary)' }}
              >
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
                <p className="mt-1 text-xs" style={{ color: 'var(--ts-red-400)' }}>
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--ts-fg-secondary)' }}
            >
              Work email
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
              <p className="mt-1 text-xs" style={{ color: 'var(--ts-red-400)' }}>
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--ts-fg-secondary)' }}
            >
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
              <p className="mt-1 text-xs" style={{ color: 'var(--ts-red-400)' }}>
                {errors.confirmPassword.message}
              </p>
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
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--ts-fg-muted)' }}>
          Already have an account?{' '}
          <Link href="/sign-in" style={{ color: 'var(--ts-blue-400)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
