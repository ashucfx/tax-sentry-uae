'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sendOtpAction, verifyOtpAction } from '@/lib/auth/actions';

// ─── types ────────────────────────────────────────────────────────────────────

type Step = 'identifier' | 'otp';
type Channel = 'email' | 'sms';

// ─── helpers ──────────────────────────────────────────────────────────────────

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isPhone(v: string) {
  return /^\+[1-9]\d{7,14}$/.test(v);
}

function normalizePhone(v: string): string {
  // Accept UAE local format: 05XXXXXXXX → +97105XXXXXXXX
  if (/^0\d{9}$/.test(v)) return `+971${v.slice(1)}`;
  return v;
}

function extractError(err: unknown): string {
  const e = err as { response?: { data?: { message?: string | string[] } } };
  const msg = e?.response?.data?.message;
  if (Array.isArray(msg)) return msg[0];
  return msg ?? 'Something went wrong — please try again';
}

// ─── OTP digit input ──────────────────────────────────────────────────────────

function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.padEnd(6, '').split('').slice(0, 6);

  const handleChange = (idx: number, v: string) => {
    const digit = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = digit;
    onChange(next.join('').replace(/ /g, ''));
    if (digit && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) refs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      onChange(pasted);
      refs.current[5]?.focus();
      e.preventDefault();
    }
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d === ' ' ? '' : d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          className="w-11 h-14 text-center text-xl font-bold rounded-lg outline-none transition-all disabled:opacity-50"
          style={{
            background: 'var(--ts-bg-input)',
            border: `2px solid ${d ? 'var(--ts-blue-500)' : 'var(--ts-border-default)'}`,
            color: 'var(--ts-fg-primary)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--ts-blue-400)')}
          onBlur={(e) => (e.target.style.borderColor = d ? 'var(--ts-blue-500)' : 'var(--ts-border-default)')}
        />
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [channel, setChannel] = useState<Channel>('email');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // ── Step 1: send OTP ───────────────────────────────────────────────────────

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalized = normalizePhone(identifier.trim());
    const isValidEmail = isEmail(normalized);
    const isValidPhone = isPhone(normalized);

    if (!isValidEmail && !isValidPhone) {
      setError('Enter a valid email address or phone number (e.g. +971501234567)');
      return;
    }

    setLoading(true);
    try {
      const payload = isValidEmail ? { email: normalized } : { phone: normalized };
      const result = await sendOtpAction(payload);
      setChannel(result.channel);
      setIdentifier(normalized);
      setStep('otp');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { code?: string; waitSeconds?: number; message?: string | string[] } } };
      if (e?.response?.data?.code === 'OTP_COOLDOWN') {
        const secs = e.response!.data!.waitSeconds ?? 60;
        setCooldown(secs);
        const timer = setInterval(() => {
          setCooldown((s) => {
            if (s <= 1) { clearInterval(timer); return 0; }
            return s - 1;
          });
        }, 1000);
      }
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP ────────────────────────────────────────────────────

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError('Enter the full 6-digit code');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload = isEmail(identifier) ? { email: identifier } : { phone: identifier };
      await verifyOtpAction(payload, otp);
      router.push('/redirect');
    } catch (err: unknown) {
      setOtp('');
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Resend ────────────────────────────────────────────────────────────────

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    setOtp('');
    setLoading(true);
    try {
      const payload = isEmail(identifier) ? { email: identifier } : { phone: identifier };
      await sendOtpAction(payload);
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown((s) => { if (s <= 1) { clearInterval(timer); return 0; } return s - 1; });
      }, 1000);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    background: 'var(--ts-bg-card)',
    border: '1px solid var(--ts-border-subtle)',
  };

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    background: 'var(--ts-bg-input)',
    border: `1px solid ${hasError ? 'var(--ts-red-500)' : 'var(--ts-border-default)'}`,
    color: 'var(--ts-fg-primary)',
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--ts-bg-deepest)' }}
    >
      <div className="w-full max-w-md p-8 rounded-2xl" style={cardStyle}>

        {/* ── Step 1: enter email or phone ── */}
        {step === 'identifier' && (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--ts-fg-primary)' }}>
                Sign in to TaxSentry
              </h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--ts-fg-muted)' }}>
                We&apos;ll send a one-time code to your email or phone
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--ts-fg-secondary)' }}
                >
                  Email or phone number
                </label>
                <input
                  type="text"
                  autoComplete="email tel"
                  autoFocus
                  placeholder="you@company.com or +971501234567"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError(null); }}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
                  style={inputStyle(!!error)}
                />
              </div>

              {error && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    color: 'var(--ts-red-400)',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  {error}
                  {cooldown > 0 && ` (${cooldown}s)`}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !identifier.trim() || cooldown > 0}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
                style={{ background: 'var(--ts-blue-600)', color: '#fff' }}
              >
                {loading ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send code'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm" style={{ color: 'var(--ts-fg-muted)' }}>
              Prefer password?{' '}
              <Link href="/sign-in" style={{ color: 'var(--ts-blue-400)' }}>
                Sign in with password
              </Link>
            </p>
          </>
        )}

        {/* ── Step 2: enter OTP ── */}
        {step === 'otp' && (
          <>
            <div className="mb-8 text-center">
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
                style={{ background: 'rgba(59,130,246,0.15)' }}
              >
                <span style={{ fontSize: 22 }}>{channel === 'email' ? '📧' : '📱'}</span>
              </div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--ts-fg-primary)' }}>
                Enter your code
              </h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--ts-fg-muted)' }}>
                We sent a 6-digit code to{' '}
                <span className="font-medium" style={{ color: 'var(--ts-fg-secondary)' }}>
                  {identifier}
                </span>
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--ts-fg-muted)' }}>
                Expires in 5 minutes
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <OtpInput value={otp} onChange={setOtp} disabled={loading} />

              {error && (
                <div
                  className="p-3 rounded-lg text-sm text-center"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    color: 'var(--ts-red-400)',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
                style={{ background: 'var(--ts-blue-600)', color: '#fff' }}
              >
                {loading ? 'Verifying…' : 'Verify code'}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm">
              <button
                onClick={() => { setStep('identifier'); setOtp(''); setError(null); }}
                style={{ color: 'var(--ts-fg-muted)' }}
              >
                ← Change {channel === 'email' ? 'email' : 'number'}
              </button>

              <button
                onClick={handleResend}
                disabled={loading || cooldown > 0}
                className="disabled:opacity-50"
                style={{ color: 'var(--ts-blue-400)' }}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
