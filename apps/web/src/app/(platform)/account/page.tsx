'use client';

import { useState } from 'react';
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
  Trash2,
  Clock,
  Mail,
  Phone,
  ChevronRight,
  Building2,
  Crown,
} from 'lucide-react';

type TabId = 'profile' | 'security' | 'sessions';

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

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'sessions', label: 'Active Sessions', icon: Monitor },
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

export default function AccountPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saved, setSaved] = useState(false);

  const { data: profile, isLoading } = useQuery<UserProfile>({
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
                    Email is your login identifier and cannot be changed
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
                    desc: 'TOTP-based 2FA — coming soon',
                    status: 'COMING SOON',
                    color: 'var(--ts-fg-muted)',
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
                  All devices currently signed into your account. Revoke any session you don't
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
                    {(sessions as any[]).map((session, idx) => {
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
