'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  User,
  Shield,
  Monitor,
  Save,
  CheckCircle2,
  Smartphone,
  Globe,
  LogOut,
  Clock,
  Mail,
  Phone,
  ChevronRight,
  Building2,
  Crown,
  QrCode,
  Copy,
  X,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

type TabId = 'profile' | 'security' | 'sessions' | 'mfa' | 'change-email';

interface UserProfile {
  id: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  organization?: {
    id: string;
    name: string;
    freeZone: string;
    tradeLicenseNo: string;
    subscriptionTier: string;
    subscriptionStatus: string;
  } | null;
}

interface MfaEnrollResponse {
  secret: string;
  otpauthUrl: string;
  qrCodeData: string;
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'sessions', label: 'Active Sessions', icon: Monitor },
  { id: 'mfa', label: 'Two-Factor Auth', icon: QrCode },
  { id: 'change-email', label: 'Change Email', icon: Mail },
];

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  FINANCE: 'Finance',
  VIEWER: 'Viewer',
  AUDITOR: 'Auditor',
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'var(--ts-blue-500)',
  FINANCE: 'var(--ts-green-500)',
  VIEWER: 'var(--ts-fg-muted)',
  AUDITOR: 'var(--ts-amber-500)',
};

function StyledInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="rounded-lg px-3 py-2 text-[13px] outline-none transition-all w-full"
      style={{
        background: disabled ? 'var(--ts-bg-muted)' : 'var(--ts-bg-elevated)',
        border: '1px solid var(--ts-border)',
        color: disabled ? 'var(--ts-fg-muted)' : 'var(--ts-fg-primary)',
        cursor: disabled ? 'not-allowed' : 'text',
        fontFamily: 'var(--font-sans)',
      }}
      onFocus={(e) => {
        if (!disabled) (e.target as HTMLElement).style.borderColor = 'var(--ts-blue-500)';
      }}
      onBlur={(e) => {
        (e.target as HTMLElement).style.borderColor = 'var(--ts-border)';
      }}
    />
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label
        style={{ fontSize: 12, fontWeight: 500, color: 'var(--ts-fg-secondary)', display: 'block' }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

// ── MFA TAB ──────────────────────────────────────────────────────────────────

function MfaTab({ profile, onProfileRefresh }: { profile: UserProfile; onProfileRefresh: () => void }) {
  const [enrollData, setEnrollData] = useState<MfaEnrollResponse | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [enrollError, setEnrollError] = useState('');

  // Disable flow
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState('');

  // Backup regeneration
  const [regenCodes, setRegenCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  const enrollMutation = useMutation({
    mutationFn: () => api.post('/auth/mfa/enroll').then((r) => r.data.data ?? r.data),
    onSuccess: (data: MfaEnrollResponse) => {
      setEnrollData(data);
      setEnrollError('');
    },
    onError: () => setEnrollError('Failed to start setup. Please try again.'),
  });

  const verifyMutation = useMutation({
    mutationFn: () => api.post('/auth/mfa/verify', { code: verifyCode }).then((r) => r.data.data ?? r.data),
    onSuccess: (data: { backupCodes: string[] }) => {
      setBackupCodes(data.backupCodes);
      setEnrollError('');
    },
    onError: () => setEnrollError('Invalid code. Please try again.'),
  });

  const disableMutation = useMutation({
    mutationFn: () => api.post('/auth/mfa/disable', { code: disableCode }).then((r) => r.data),
    onSuccess: () => {
      setShowDisableModal(false);
      setDisableCode('');
      setDisableError('');
      onProfileRefresh();
    },
    onError: () => setDisableError('Invalid code. Please try again.'),
  });

  const regenMutation = useMutation({
    mutationFn: () => api.get('/auth/mfa/backup-codes/regenerate').then((r) => r.data.data ?? r.data),
    onSuccess: (data: { backupCodes: string[] }) => setRegenCodes(data.backupCodes),
  });

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!profile.mfaEnabled) {
    // ── MFA NOT ENABLED ──
    return (
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0, marginBottom: 4 }}>
          Two-Factor Authentication
        </h2>
        <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 24 }}>
          Add an extra layer of protection to your account.
        </p>

        {backupCodes ? (
          // ── Step 3: Show backup codes ──
          <div>
            <div
              className="flex items-start gap-3 p-4 rounded-xl mb-6"
              style={{ background: 'oklch(0.75 0.18 85 / 0.1)', border: '1px solid oklch(0.75 0.18 85 / 0.3)' }}
            >
              <AlertTriangle size={16} style={{ color: 'var(--ts-amber-500)', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts-amber-500)', margin: 0 }}>
                  Save these backup codes — shown only once
                </p>
                <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0, marginTop: 2 }}>
                  Store them in a secure location. Each code can be used once to sign in if you lose access to your authenticator app.
                </p>
              </div>
            </div>
            <div
              className="grid grid-cols-2 gap-2 mb-6 p-4 rounded-xl"
              style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)' }}
            >
              {backupCodes.map((code) => (
                <div
                  key={code}
                  className="flex items-center justify-center py-2 rounded-lg"
                  style={{
                    background: 'var(--ts-bg-card)',
                    border: '1px solid var(--ts-border)',
                    fontFamily: 'monospace',
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--ts-fg-primary)',
                    letterSpacing: '0.1em',
                  }}
                >
                  {code}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => copyToClipboard(backupCodes.join('\n'))}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all"
                style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)', color: 'var(--ts-fg-secondary)', cursor: 'pointer' }}
              >
                <Copy size={13} />
                {copied ? 'Copied!' : 'Copy All Codes'}
              </button>
              <button
                onClick={() => { onProfileRefresh(); setBackupCodes(null); setEnrollData(null); setVerifyCode(''); }}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold transition-all"
                style={{ background: 'var(--ts-green-500)', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                <CheckCircle2 size={14} />
                Done
              </button>
            </div>
          </div>
        ) : enrollData ? (
          // ── Step 2: QR code + verify ──
          <div className="space-y-6">
            <div
              className="p-5 rounded-xl"
              style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)' }}
            >
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ts-fg-primary)', marginBottom: 12 }}>
                Scan this QR code with your authenticator app
              </p>
              <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 16 }}>
                Use Google Authenticator, Authy, or any TOTP-compatible app.
              </p>
              <div className="flex justify-center mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(enrollData.otpauthUrl)}&size=200x200`}
                  alt="TOTP QR Code"
                  width={200}
                  height={200}
                  style={{ borderRadius: 8, border: '4px solid white' }}
                />
              </div>
              <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 6 }}>
                Or enter the setup key manually:
              </p>
              <div
                className="flex items-center justify-between gap-2 p-3 rounded-lg"
                style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)' }}
              >
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 13,
                    color: 'var(--ts-fg-primary)',
                    letterSpacing: '0.08em',
                    wordBreak: 'break-all',
                  }}
                >
                  {enrollData.secret}
                </span>
                <button
                  onClick={() => copyToClipboard(enrollData.secret)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ts-fg-muted)', flexShrink: 0 }}
                  title="Copy secret"
                >
                  <Copy size={14} />
                </button>
              </div>
              <p style={{ fontSize: 11, color: 'var(--ts-fg-muted)', marginTop: 8 }}>
                OTPAuth URL:{' '}
                <span style={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: 11 }}>
                  {enrollData.otpauthUrl}
                </span>
              </p>
            </div>

            <div>
              <FieldGroup label="Enter the 6-digit code from your authenticator app">
                <StyledInput
                  value={verifyCode}
                  onChange={(v) => setVerifyCode(v.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  type="text"
                />
              </FieldGroup>
              {enrollError && (
                <p style={{ fontSize: 12, color: 'var(--ts-red-400)', marginTop: 6 }}>{enrollError}</p>
              )}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => verifyMutation.mutate()}
                  disabled={verifyCode.length !== 6 || verifyMutation.isPending}
                  className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold transition-all"
                  style={{
                    background: 'var(--ts-blue-500)',
                    color: 'white',
                    border: 'none',
                    cursor: verifyCode.length !== 6 || verifyMutation.isPending ? 'default' : 'pointer',
                    opacity: verifyCode.length !== 6 || verifyMutation.isPending ? 0.6 : 1,
                  }}
                >
                  <CheckCircle2 size={14} />
                  {verifyMutation.isPending ? 'Verifying…' : 'Verify & Enable'}
                </button>
                <button
                  onClick={() => { setEnrollData(null); setVerifyCode(''); setEnrollError(''); }}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all"
                  style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)', color: 'var(--ts-fg-secondary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          // ── Step 1: Start setup ──
          <div
            className="p-6 rounded-xl text-center"
            style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)' }}
          >
            <div
              className="flex items-center justify-center rounded-full mx-auto mb-4"
              style={{ width: 52, height: 52, background: 'oklch(0.55 0.22 260 / 0.1)', border: '2px solid oklch(0.55 0.22 260 / 0.2)' }}
            >
              <QrCode size={24} style={{ color: 'var(--ts-blue-400)' }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ts-fg-primary)', marginBottom: 8 }}>
              Enable Two-Factor Authentication
            </p>
            <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', maxWidth: 380, margin: '0 auto 20px' }}>
              Scan the QR code with your authenticator app (Google Authenticator, Authy) to set up TOTP-based 2FA. You'll be asked for a code on every login.
            </p>
            {enrollError && (
              <p style={{ fontSize: 12, color: 'var(--ts-red-400)', marginBottom: 12 }}>{enrollError}</p>
            )}
            <button
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold transition-all mx-auto"
              style={{
                background: 'var(--ts-blue-500)',
                color: 'white',
                border: 'none',
                cursor: enrollMutation.isPending ? 'default' : 'pointer',
                opacity: enrollMutation.isPending ? 0.7 : 1,
              }}
            >
              <QrCode size={14} />
              {enrollMutation.isPending ? 'Starting…' : 'Start Setup'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── MFA ENABLED ──
  return (
    <div>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0, marginBottom: 4 }}>
        Two-Factor Authentication
      </h2>
      <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 24 }}>
        TOTP-based 2FA is active on your account.
      </p>

      <div
        className="flex items-center gap-3 p-4 rounded-xl mb-6"
        style={{ background: 'oklch(0.70 0.20 155 / 0.08)', border: '1px solid oklch(0.70 0.20 155 / 0.25)' }}
      >
        <CheckCircle2 size={18} style={{ color: 'var(--ts-green-500)', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts-green-500)', margin: 0 }}>
            Two-Factor Authentication is enabled
          </p>
          <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0, marginTop: 2 }}>
            Your account requires a verification code from your authenticator app on each login.
          </p>
        </div>
      </div>

      {/* Regen codes area */}
      {regenCodes && (
        <div className="mb-6">
          <div
            className="flex items-start gap-3 p-4 rounded-xl mb-4"
            style={{ background: 'oklch(0.75 0.18 85 / 0.1)', border: '1px solid oklch(0.75 0.18 85 / 0.3)' }}
          >
            <AlertTriangle size={16} style={{ color: 'var(--ts-amber-500)', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0 }}>
              New backup codes generated. Save them securely — your old codes are no longer valid.
            </p>
          </div>
          <div
            className="grid grid-cols-2 gap-2 p-4 rounded-xl"
            style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)' }}
          >
            {regenCodes.map((code) => (
              <div
                key={code}
                className="flex items-center justify-center py-2 rounded-lg"
                style={{
                  background: 'var(--ts-bg-card)',
                  border: '1px solid var(--ts-border)',
                  fontFamily: 'monospace',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--ts-fg-primary)',
                  letterSpacing: '0.1em',
                }}
              >
                {code}
              </div>
            ))}
          </div>
          <button
            onClick={() => { copyToClipboard(regenCodes.join('\n')); }}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all mt-3"
            style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)', color: 'var(--ts-fg-secondary)', cursor: 'pointer' }}
          >
            <Copy size={13} />
            {copied ? 'Copied!' : 'Copy All Codes'}
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => regenMutation.mutate()}
          disabled={regenMutation.isPending}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all"
          style={{
            background: 'var(--ts-bg-elevated)',
            border: '1px solid var(--ts-border)',
            color: 'var(--ts-fg-secondary)',
            cursor: regenMutation.isPending ? 'default' : 'pointer',
            opacity: regenMutation.isPending ? 0.7 : 1,
          }}
        >
          <RefreshCw size={13} />
          {regenMutation.isPending ? 'Regenerating…' : 'Regenerate Backup Codes'}
        </button>
        <button
          onClick={() => { setShowDisableModal(true); setDisableCode(''); setDisableError(''); }}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all"
          style={{
            background: 'oklch(0.55 0.22 15 / 0.1)',
            border: '1px solid oklch(0.55 0.22 15 / 0.25)',
            color: 'var(--ts-red-400)',
            cursor: 'pointer',
          }}
        >
          <X size={13} />
          Disable MFA
        </button>
      </div>

      {/* Disable MFA modal */}
      {showDisableModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowDisableModal(false); }}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-sm"
            style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>
                Disable Two-Factor Auth
              </h3>
              <button
                onClick={() => setShowDisableModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ts-fg-muted)', padding: 2 }}
              >
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 16 }}>
              Enter the 6-digit code from your authenticator app to confirm disabling 2FA.
            </p>
            <FieldGroup label="Verification Code">
              <StyledInput
                value={disableCode}
                onChange={(v) => setDisableCode(v.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                type="text"
              />
            </FieldGroup>
            {disableError && (
              <p style={{ fontSize: 12, color: 'var(--ts-red-400)', marginTop: 6 }}>{disableError}</p>
            )}
            <button
              onClick={() => disableMutation.mutate()}
              disabled={disableCode.length !== 6 || disableMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold mt-4"
              style={{
                background: 'var(--ts-red-400)',
                color: 'white',
                border: 'none',
                cursor: disableCode.length !== 6 || disableMutation.isPending ? 'default' : 'pointer',
                opacity: disableCode.length !== 6 || disableMutation.isPending ? 0.6 : 1,
              }}
            >
              {disableMutation.isPending ? 'Disabling…' : 'Disable 2FA'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CHANGE EMAIL TAB ──────────────────────────────────────────────────────────

function ChangeEmailTab({ profile, onProfileRefresh }: { profile: UserProfile; onProfileRefresh: () => void }) {
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState('');
  const [token, setToken] = useState('');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [requestError, setRequestError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [success, setSuccess] = useState(false);

  const requestMutation = useMutation({
    mutationFn: () => api.post('/auth/change-email/request', { newEmail }).then((r) => r.data),
    onSuccess: () => {
      setPendingEmail(newEmail);
      setRequestError('');
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not send verification email. Please try again.';
      setRequestError(msg);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () => api.post('/auth/change-email/confirm', { token }).then((r) => r.data),
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      onProfileRefresh();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid or expired token. Please try again.';
      setConfirmError(msg);
    },
  });

  return (
    <div>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0, marginBottom: 4 }}>
        Change Email Address
      </h2>
      <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 24 }}>
        Update the email address associated with your account. A verification link will be sent to the new address.
      </p>

      {success ? (
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ background: 'oklch(0.70 0.20 155 / 0.08)', border: '1px solid oklch(0.70 0.20 155 / 0.25)' }}
        >
          <CheckCircle2 size={18} style={{ color: 'var(--ts-green-500)', flexShrink: 0 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts-green-500)', margin: 0 }}>
            Email updated successfully. Please sign in again with your new address.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <FieldGroup label="Current Email">
            <div className="relative">
              <Mail
                size={13}
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ts-fg-muted)' }}
              />
              <input
                value={profile.email ?? ''}
                readOnly
                className="rounded-lg pl-8 pr-3 py-2 text-[13px] w-full"
                style={{
                  background: 'var(--ts-bg-muted)',
                  border: '1px solid var(--ts-border)',
                  color: 'var(--ts-fg-muted)',
                  cursor: 'not-allowed',
                }}
              />
            </div>
          </FieldGroup>

          {!pendingEmail ? (
            <>
              <FieldGroup label="New Email Address">
                <StyledInput
                  value={newEmail}
                  onChange={setNewEmail}
                  placeholder="new@example.com"
                  type="email"
                />
              </FieldGroup>
              {requestError && (
                <p style={{ fontSize: 12, color: 'var(--ts-red-400)' }}>{requestError}</p>
              )}
              <button
                onClick={() => requestMutation.mutate()}
                disabled={!newEmail || requestMutation.isPending}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold transition-all"
                style={{
                  background: 'var(--ts-blue-500)',
                  color: 'white',
                  border: 'none',
                  cursor: !newEmail || requestMutation.isPending ? 'default' : 'pointer',
                  opacity: !newEmail || requestMutation.isPending ? 0.6 : 1,
                }}
              >
                <Mail size={14} />
                {requestMutation.isPending ? 'Sending…' : 'Send Verification'}
              </button>
            </>
          ) : (
            <>
              <div
                className="p-3 rounded-lg"
                style={{ background: 'oklch(0.55 0.22 260 / 0.08)', border: '1px solid oklch(0.55 0.22 260 / 0.2)' }}
              >
                <p style={{ fontSize: 13, color: 'var(--ts-fg-primary)', margin: 0 }}>
                  Verification email sent to{' '}
                  <strong style={{ color: 'var(--ts-blue-400)' }}>{pendingEmail}</strong>.
                  Enter the 6-character token below.
                </p>
              </div>
              <FieldGroup label="Verification Token">
                <StyledInput
                  value={token}
                  onChange={(v) => setToken(v.toUpperCase().slice(0, 6))}
                  placeholder="A1B2C3"
                  type="text"
                />
              </FieldGroup>
              {confirmError && (
                <p style={{ fontSize: 12, color: 'var(--ts-red-400)' }}>{confirmError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => confirmMutation.mutate()}
                  disabled={token.length < 6 || confirmMutation.isPending}
                  className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold transition-all"
                  style={{
                    background: 'var(--ts-blue-500)',
                    color: 'white',
                    border: 'none',
                    cursor: token.length < 6 || confirmMutation.isPending ? 'default' : 'pointer',
                    opacity: token.length < 6 || confirmMutation.isPending ? 0.6 : 1,
                  }}
                >
                  <CheckCircle2 size={14} />
                  {confirmMutation.isPending ? 'Confirming…' : 'Confirm Change'}
                </button>
                <button
                  onClick={() => { setPendingEmail(null); setToken(''); setConfirmError(''); }}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium"
                  style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)', color: 'var(--ts-fg-secondary)', cursor: 'pointer' }}
                >
                  Use Different Email
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(
    tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : 'profile'
  );
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saved, setSaved] = useState(false);

  // Sync active tab when query param changes (e.g. navigating from Settings → MFA link)
  useEffect(() => {
    if (tabParam && TABS.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const { data: profile, isLoading, refetch: refetchProfile } = useQuery<UserProfile>({
    queryKey: ['auth-me'],
    queryFn: () =>
      api.get('/auth/me').then((r) => {
        const d = r.data.data as UserProfile;
        setFirstName(d.firstName ?? '');
        setLastName(d.lastName ?? '');
        return d;
      }),
  });

  const { data: sessions, refetch: refetchSessions } = useQuery({
    queryKey: ['auth-sessions'],
    queryFn: () => api.get('/auth/sessions').then((r) => r.data.data),
    enabled: activeTab === 'sessions',
  });

  const updateMutation = useMutation({
    mutationFn: () => api.patch('/auth/me', { firstName, lastName }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/auth/sessions/${sessionId}`),
    onSuccess: () => refetchSessions(),
  });

  if (isLoading) return <AccountSkeleton />;

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: 'var(--ts-bg-base)' }}
    >
      <div className="flex-1 w-full max-w-[900px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <User size={18} color="var(--ts-blue-500)" />
          <h1
            style={{ fontSize: 20, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}
          >
            Account
          </h1>
        </div>

        <div className="flex gap-6">
          {/* Left nav */}
          <div
            className="flex-shrink-0 rounded-xl"
            style={{
              background: 'var(--ts-bg-card)',
              border: '1px solid var(--ts-border)',
              padding: 8,
              width: 200,
              height: 'fit-content',
            }}
          >
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all"
                style={{
                  background: activeTab === id ? 'oklch(0.55 0.22 260 / 0.1)' : 'transparent',
                  color:
                    activeTab === id ? 'var(--ts-blue-400)' : 'var(--ts-fg-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== id) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--ts-bg-elevated)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-secondary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== id) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-muted)';
                  }
                }}
              >
                <Icon size={15} color="currentColor" />
                {label}
                {activeTab === id && (
                  <ChevronRight size={13} style={{ marginLeft: 'auto' }} />
                )}
              </button>
            ))}
          </div>

          {/* Content panel */}
          <div className="flex-1 premium-card" style={{ padding: 28 }}>
            {/* ── PROFILE TAB ── */}
            {activeTab === 'profile' && (
              <div>
                <h2
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--ts-fg-primary)',
                    margin: 0,
                    marginBottom: 4,
                  }}
                >
                  Personal Profile
                </h2>
                <p
                  style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 24 }}
                >
                  Your name appears in reports, audit trails, and team views.
                </p>

                {/* Avatar + role */}
                <div
                  className="flex items-center gap-4 p-4 rounded-xl mb-6"
                  style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)' }}
                >
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{
                      width: 48,
                      height: 48,
                      background: 'oklch(0.55 0.22 260 / 0.15)',
                      border: '2px solid oklch(0.55 0.22 260 / 0.3)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'var(--ts-blue-400)',
                      }}
                    >
                      {(profile?.firstName?.[0] ?? profile?.email?.[0] ?? '?').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--ts-fg-primary)',
                        margin: 0,
                      }}
                    >
                      {[profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
                        profile?.email ||
                        'Unnamed User'}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0 }}>
                      {profile?.organization?.name}
                    </p>
                  </div>
                  <span
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold flex-shrink-0"
                    style={{
                      background: `${ROLE_COLORS[profile?.role ?? 'VIEWER']}22`,
                      color: ROLE_COLORS[profile?.role ?? 'VIEWER'],
                      border: `1px solid ${ROLE_COLORS[profile?.role ?? 'VIEWER']}44`,
                    }}
                  >
                    <Crown size={10} />
                    {ROLE_LABELS[profile?.role ?? 'VIEWER'] ?? profile?.role}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FieldGroup label="First Name">
                    <StyledInput
                      value={firstName}
                      onChange={setFirstName}
                      placeholder="Fatima"
                    />
                  </FieldGroup>
                  <FieldGroup label="Last Name">
                    <StyledInput
                      value={lastName}
                      onChange={setLastName}
                      placeholder="Al Rashidi"
                    />
                  </FieldGroup>
                </div>

                <FieldGroup label="Email Address">
                  <div className="relative">
                    <Mail
                      size={13}
                      style={{
                        position: 'absolute',
                        left: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--ts-fg-muted)',
                      }}
                    />
                    <input
                      value={profile?.email ?? ''}
                      readOnly
                      className="rounded-lg pl-8 pr-3 py-2 text-[13px] w-full"
                      style={{
                        background: 'var(--ts-bg-muted)',
                        border: '1px solid var(--ts-border)',
                        color: 'var(--ts-fg-muted)',
                        cursor: 'not-allowed',
                      }}
                    />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--ts-fg-dimmer)', marginTop: 4 }}>
                    To change your email, use the &quot;Change Email&quot; tab.
                  </p>
                </FieldGroup>

                {profile?.phone && (
                  <FieldGroup label="Phone">
                    <div className="relative">
                      <Phone
                        size={13}
                        style={{
                          position: 'absolute',
                          left: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--ts-fg-muted)',
                        }}
                      />
                      <input
                        value={profile.phone}
                        readOnly
                        className="rounded-lg pl-8 pr-3 py-2 text-[13px] w-full"
                        style={{
                          background: 'var(--ts-bg-muted)',
                          border: '1px solid var(--ts-border)',
                          color: 'var(--ts-fg-muted)',
                          cursor: 'not-allowed',
                        }}
                      />
                    </div>
                  </FieldGroup>
                )}

                <div
                  className="mt-4 p-3 rounded-lg flex items-center gap-3"
                  style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)' }}
                >
                  <Building2 size={14} style={{ color: 'var(--ts-fg-muted)', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--ts-fg-secondary)', margin: 0 }}>
                      Organisation
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--ts-fg-primary)', margin: 0 }}>
                      {profile?.organization?.name ?? '—'} · {profile?.organization?.freeZone ?? ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={() => updateMutation.mutate()}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold transition-all"
                    style={{
                      background: 'var(--ts-blue-500)',
                      color: 'white',
                      border: 'none',
                      cursor: updateMutation.isPending ? 'default' : 'pointer',
                      opacity: updateMutation.isPending ? 0.7 : 1,
                    }}
                  >
                    <Save size={14} />
                    {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                  </button>
                  {saved && (
                    <span
                      className="flex items-center gap-1.5"
                      style={{ fontSize: 13, color: 'var(--ts-green-500)' }}
                    >
                      <CheckCircle2 size={14} /> Saved
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === 'security' && (
              <div>
                <h2
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--ts-fg-primary)',
                    margin: 0,
                    marginBottom: 4,
                  }}
                >
                  Security
                </h2>
                <p
                  style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 24 }}
                >
                  Your account security settings and login history.
                </p>

                {[
                  {
                    label: 'Passwordless Authentication',
                    desc: 'Sign in via one-time passcode to your email — no password required',
                    status: 'ACTIVE',
                    color: 'var(--ts-green-500)',
                  },
                  {
                    label: 'Email Verification',
                    desc: 'Your email has been verified',
                    status: profile?.emailVerified ? 'VERIFIED' : 'UNVERIFIED',
                    color: profile?.emailVerified ? 'var(--ts-green-500)' : 'var(--ts-amber-500)',
                  },
                  {
                    label: 'Two-Factor Authentication',
                    desc: profile?.mfaEnabled ? 'TOTP-based 2FA is active on your account' : 'TOTP-based 2FA is not yet enabled',
                    status: profile?.mfaEnabled ? 'ENABLED' : 'NOT ENABLED',
                    color: profile?.mfaEnabled ? 'var(--ts-green-500)' : 'var(--ts-amber-500)',
                  },
                  {
                    label: 'Session Timeout',
                    desc: 'Sessions expire after 30 days of inactivity',
                    status: 'ACTIVE',
                    color: 'var(--ts-green-500)',
                  },
                ].map(({ label, desc, status, color }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-4"
                    style={{ borderBottom: '1px solid var(--ts-border-subtle)' }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'var(--ts-fg-primary)',
                          margin: 0,
                        }}
                      >
                        {label}
                      </p>
                      <p
                        style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0, marginTop: 2 }}
                      >
                        {desc}
                      </p>
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wide flex-shrink-0"
                      style={{
                        background: `${color}22`,
                        color,
                        border: `1px solid ${color}44`,
                      }}
                    >
                      {status}
                    </span>
                  </div>
                ))}

                {profile?.lastLoginAt && (
                  <div
                    className="mt-4 p-3 rounded-lg flex items-center gap-3"
                    style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)' }}
                  >
                    <Clock size={14} style={{ color: 'var(--ts-fg-muted)', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0 }}>
                        Last login
                      </p>
                      <p style={{ fontSize: 13, color: 'var(--ts-fg-primary)', margin: 0 }}>
                        {new Date(profile.lastLoginAt).toLocaleString('en-AE', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── SESSIONS TAB ── */}
            {activeTab === 'sessions' && (
              <div>
                <h2
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--ts-fg-primary)',
                    margin: 0,
                    marginBottom: 4,
                  }}
                >
                  Active Sessions
                </h2>
                <p
                  style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 24 }}
                >
                  All devices currently signed into your account. Revoke any session you don&apos;t
                  recognise.
                </p>

                {!sessions || sessions.length === 0 ? (
                  <div
                    className="text-center py-10"
                    style={{ color: 'var(--ts-fg-muted)', fontSize: 13 }}
                  >
                    No active sessions found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(sessions as {
                      id: string;
                      userAgent?: string;
                      deviceLabel: string;
                      ipAddress?: string;
                      createdAt: string;
                    }[]).map((session, idx) => {
                      const isMobile = /Mobile|Android|iPhone/i.test(session.userAgent ?? '');
                      const DeviceIcon = isMobile ? Smartphone : Globe;
                      return (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-4 rounded-xl"
                          style={{
                            background: idx === 0 ? 'oklch(0.55 0.22 260 / 0.06)' : 'var(--ts-bg-elevated)',
                            border: `1px solid ${idx === 0 ? 'oklch(0.55 0.22 260 / 0.2)' : 'var(--ts-border)'}`,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="flex items-center justify-center rounded-lg flex-shrink-0"
                              style={{
                                width: 36,
                                height: 36,
                                background: 'var(--ts-bg-card)',
                                border: '1px solid var(--ts-border)',
                              }}
                            >
                              <DeviceIcon size={16} style={{ color: 'var(--ts-fg-secondary)' }} />
                            </div>
                            <div>
                              <p
                                style={{
                                  fontSize: 13,
                                  fontWeight: 500,
                                  color: 'var(--ts-fg-primary)',
                                  margin: 0,
                                }}
                              >
                                {session.deviceLabel}
                                {idx === 0 && (
                                  <span
                                    className="ml-2 text-[10px] font-bold rounded-full px-2 py-0.5"
                                    style={{
                                      background: 'oklch(0.70 0.20 155 / 0.15)',
                                      color: 'var(--ts-green-500)',
                                    }}
                                  >
                                    Current
                                  </span>
                                )}
                              </p>
                              <p
                                style={{
                                  fontSize: 11,
                                  color: 'var(--ts-fg-muted)',
                                  margin: 0,
                                }}
                              >
                                {session.ipAddress ?? 'Unknown IP'} ·{' '}
                                {new Date(session.createdAt).toLocaleDateString('en-AE', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                          {idx !== 0 && (
                            <button
                              onClick={() => revokeMutation.mutate(session.id)}
                              disabled={revokeMutation.isPending}
                              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all"
                              style={{
                                background: 'var(--ts-bg-card)',
                                border: '1px solid var(--ts-border)',
                                color: 'var(--ts-red-400)',
                                cursor: 'pointer',
                              }}
                            >
                              <LogOut size={12} />
                              Revoke
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── MFA TAB ── */}
            {activeTab === 'mfa' && profile && (
              <MfaTab
                profile={profile}
                onProfileRefresh={() => {
                  queryClient.invalidateQueries({ queryKey: ['auth-me'] });
                  refetchProfile();
                }}
              />
            )}

            {/* ── CHANGE EMAIL TAB ── */}
            {activeTab === 'change-email' && profile && (
              <ChangeEmailTab
                profile={profile}
                onProfileRefresh={() => {
                  queryClient.invalidateQueries({ queryKey: ['auth-me'] });
                  refetchProfile();
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--ts-bg-base)' }}>
      <div className="flex-1 w-full max-w-[900px] mx-auto px-6 py-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-24 mb-6" />
        <div className="flex gap-6">
          <div className="w-48 h-40 rounded-xl bg-muted flex-shrink-0" />
          <div className="flex-1 rounded-xl bg-muted h-80" />
        </div>
      </div>
    </div>
  );
}
