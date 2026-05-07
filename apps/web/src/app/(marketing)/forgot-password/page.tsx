'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { forgotPasswordAction } from '@/lib/auth/actions';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    await forgotPasswordAction(data.email).catch(() => {});
    setSubmitted(true); // always show success — don't leak whether email exists
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--ts-bg-deepest)' }}
    >
      <div
        className="w-full max-w-md p-8 rounded-2xl"
        style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border-subtle)' }}
      >
        {submitted ? (
          <div className="text-center space-y-4">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-full"
              style={{ background: 'rgba(34,197,94,0.1)' }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--ts-green-400)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--ts-fg-primary)' }}>Check your email</h2>
            <p className="text-sm" style={{ color: 'var(--ts-fg-muted)' }}>
              If that email is registered, you&apos;ll receive a reset link within a few minutes.
            </p>
            <Link
              href="/sign-in"
              className="block text-sm font-medium"
              style={{ color: 'var(--ts-blue-400)' }}
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--ts-fg-primary)' }}>
                Reset password
              </h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--ts-fg-muted)' }}>
                Enter your email and we&apos;ll send a reset link
              </p>
            </div>

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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
                style={{ background: 'var(--ts-blue-600)', color: '#fff' }}
              >
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm" style={{ color: 'var(--ts-fg-muted)' }}>
              <Link href="/sign-in" style={{ color: 'var(--ts-blue-400)' }}>
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
