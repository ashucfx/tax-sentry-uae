'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { TopRibbon } from '@/components/dashboard/TopRibbon';
import { Settings, Building2, Bell, Shield, Users, Save, ChevronRight, CheckCircle2, UserPlus, X, Trash2, Clock } from 'lucide-react';

type TabId = 'company' | 'notifications' | 'security' | 'team';

type Invitation = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  FINANCE: 'Finance',
  VIEWER: 'Viewer',
  AUDITOR: 'Auditor',
};

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'team', label: 'Team', icon: Users },
];

const FREE_ZONES = [
  'DMCC', 'DIFC', 'JAFZA', 'ADGM', 'Sharjah Media City',
  'Fujairah Creative City', 'IFZA', 'RAKEZ', 'Other',
];

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-start justify-between gap-4 py-4"
      style={{ borderBottom: '1px solid var(--ts-border-subtle)' }}
    >
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ts-fg-primary)', margin: 0 }}>{label}</p>
        {description && (
          <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0, marginTop: 2 }}>{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="relative flex-shrink-0 rounded-full transition-all"
      style={{
        width: 44,
        height: 24,
        background: enabled ? 'var(--ts-blue-500)' : 'var(--ts-bg-elevated)',
        border: `1px solid ${enabled ? 'var(--ts-blue-500)' : 'var(--ts-border)'}`,
        cursor: 'pointer',
      }}
    >
      <span
        className="absolute top-0.5 rounded-full transition-all"
        style={{
          width: 20,
          height: 20,
          background: 'white',
          left: enabled ? 22 : 2,
        }}
      />
    </button>
  );
}

function StyledInput({ value, onChange, type = 'text', placeholder }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="rounded-lg px-3 py-2 text-[13px] outline-none transition-all"
      style={{
        background: 'var(--ts-bg-elevated)',
        border: '1px solid var(--ts-border)',
        color: 'var(--ts-fg-primary)',
        minWidth: 220,
        fontFamily: 'var(--font-sans)',
      }}
      onFocus={e => { (e.target as HTMLElement).style.borderColor = 'var(--ts-blue-500)'; }}
      onBlur={e => { (e.target as HTMLElement).style.borderColor = 'var(--ts-border)'; }}
    />
  );
}

function StyledSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg px-3 py-2 text-[13px] outline-none transition-all"
      style={{
        background: 'var(--ts-bg-elevated)',
        border: '1px solid var(--ts-border)',
        color: 'var(--ts-fg-primary)',
        minWidth: 180,
        fontFamily: 'var(--font-sans)',
        cursor: 'pointer',
      }}
    >
      {options.map((o) => (
        <option key={o} value={o} style={{ background: 'var(--ts-bg-elevated)' }}>
          {o}
        </option>
      ))}
    </select>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('company');
  const [saved, setSaved] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [freeZone, setFreeZone] = useState('DMCC');
  const [licenseNo, setLicenseNo] = useState('');
  const [taxRegNo, setTaxRegNo] = useState('');

  const { data: orgData } = useQuery({
    queryKey: ['org-me'],
    queryFn: () => api.get('/organizations/me').then((r) => r.data.data ?? r.data),
    retry: false,
  });

  useEffect(() => {
    if (orgData) {
      setCompanyName(orgData.name ?? '');
      setFreeZone(orgData.freeZone ?? 'DMCC');
      setLicenseNo(orgData.tradeLicenseNo ?? '');
      setTaxRegNo(orgData.taxRegistrationNo ?? '');
    }
  }, [orgData]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.patch('/organizations/me', { name: companyName, taxRegistrationNo: taxRegNo }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-me'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [breachAlerts, setBreachAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [thresholdWarnings, setThresholdWarnings] = useState(true);

  // Team tab state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('VIEWER');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const { data: invitations, refetch: refetchInvitations } = useQuery<Invitation[]>({
    queryKey: ['org-invitations'],
    queryFn: () => api.get('/organizations/me/invitations').then((r) => r.data.data ?? r.data),
    enabled: activeTab === 'team',
    retry: false,
  });

  const inviteMutation = useMutation({
    mutationFn: () => api.post('/organizations/me/invite', { email: inviteEmail, role: inviteRole }),
    onSuccess: () => {
      setInviteSuccess(true);
      setInviteEmail('');
      refetchInvitations();
      setTimeout(() => {
        setInviteSuccess(false);
        setShowInviteModal(false);
      }, 2000);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not send invitation.';
      setInviteError(msg);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/organizations/me/invitations/${id}`),
    onSuccess: () => refetchInvitations(),
  });

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--ts-bg-base)' }}>
      <TopRibbon />

      <div className="flex-1 w-full max-w-[1000px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Settings size={18} color="var(--ts-blue-500)" />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}>
            Settings
          </h1>
        </div>

        <div className="flex gap-6">
          {/* Tab nav */}
          <div
            className="flex-shrink-0 rounded-xl"
            style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)', padding: 8, width: 200, height: 'fit-content' }}
          >
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all"
                style={{
                  background: activeTab === id ? 'oklch(0.55 0.22 260 / 0.1)' : 'transparent',
                  color: activeTab === id ? 'var(--ts-blue-400)' : 'var(--ts-fg-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={e => {
                  if (activeTab !== id) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--ts-bg-elevated)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-secondary)';
                  }
                }}
                onMouseLeave={e => {
                  if (activeTab !== id) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-muted)';
                  }
                }}
              >
                <Icon size={15} color="currentColor" />
                {label}
                {activeTab === id && <ChevronRight size={13} style={{ marginLeft: 'auto' }} />}
              </button>
            ))}
          </div>

          {/* Tab panel */}
          <div className="flex-1 premium-card" style={{ padding: 28 }}>
            {activeTab === 'company' && (
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0, marginBottom: 4 }}>
                  Company Details
                </h2>
                <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 20 }}>
                  These details appear in your compliance reports and the dashboard header.
                </p>

                <SettingRow label="Company Name" description="Legal registered name of your Free Zone entity">
                  <StyledInput value={companyName} onChange={setCompanyName} placeholder="Horizon Trading FZE" />
                </SettingRow>
                <SettingRow label="Free Zone" description="Your registered free zone authority">
                  <StyledSelect value={freeZone} onChange={setFreeZone} options={FREE_ZONES} />
                </SettingRow>
                <SettingRow label="Trade License Number" description="Your current active trade license number (read-only — contact support to change)">
                  <StyledInput value={licenseNo} onChange={() => {}} placeholder="DMCC-123456" />
                </SettingRow>
                <SettingRow label="Tax Registration Number (TRN)" description="UAE FTA tax registration number (optional)">
                  <StyledInput value={taxRegNo} onChange={setTaxRegNo} placeholder="100-XXXXXXXXX-X" />
                </SettingRow>
                <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold transition-all"
                    style={{ background: 'var(--ts-blue-500)', color: 'white', border: 'none', cursor: saveMutation.isPending ? 'default' : 'pointer', opacity: saveMutation.isPending ? 0.7 : 1 }}
                  >
                    <Save size={14} />
                    {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
                  </button>
                  {saved && (
                    <span className="flex items-center gap-1.5" style={{ fontSize: 13, color: 'var(--ts-green-500)' }}>
                      <CheckCircle2 size={14} /> Saved
                    </span>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0, marginBottom: 4 }}>
                  Notification Preferences
                </h2>
                <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 20 }}>
                  Configure how and when TaxSentry alerts you about compliance events.
                </p>

                <SettingRow label="Email Alerts" description="Receive alerts via email for all compliance events">
                  <Toggle enabled={emailAlerts} onChange={setEmailAlerts} />
                </SettingRow>
                <SettingRow label="Breach Imminent Alerts" description="Immediate notification when de-minimis exceeds 80%">
                  <Toggle enabled={breachAlerts} onChange={setBreachAlerts} />
                </SettingRow>
                <SettingRow label="Weekly Digest" description="Summary email every Monday with compliance status">
                  <Toggle enabled={weeklyDigest} onChange={setWeeklyDigest} />
                </SettingRow>
                <SettingRow label="Threshold Warnings" description="Warnings at 50%, 70%, and 90% of de-minimis limits">
                  <Toggle enabled={thresholdWarnings} onChange={setThresholdWarnings} />
                </SettingRow>

                <div style={{ marginTop: 24 }}>
                  <span style={{ fontSize: 12, color: 'var(--ts-fg-muted)', padding: '8px 12px', background: 'var(--ts-bg-elevated)', borderRadius: 8, border: '1px solid var(--ts-border)' }}>
                    Notification preferences — coming soon
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0, marginBottom: 4 }}>
                  Security
                </h2>
                <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 20 }}>
                  TaxSentry security configuration and data protection settings.
                </p>

                {[
                  { label: 'AES-256 Data Encryption', desc: 'All data at rest encrypted with AES-256-GCM', status: 'ACTIVE' },
                  { label: 'TLS 1.3 in Transit', desc: 'All API communication over TLS 1.3', status: 'ACTIVE' },
                  { label: 'Immutable Audit Log', desc: 'All actions logged and tamper-proof', status: 'ACTIVE' },
                  { label: 'Two-Factor Authentication', desc: 'TOTP-based 2FA — coming soon', status: 'CONFIGURE' },
                  { label: 'Session Timeout', desc: 'Auto-sign-out after 8 hours of inactivity', status: 'ACTIVE' },
                ].map(({ label, desc, status }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-4"
                    style={{ borderBottom: '1px solid var(--ts-border-subtle)' }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ts-fg-primary)', margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0, marginTop: 2 }}>{desc}</p>
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wide"
                      style={{
                        background: status === 'ACTIVE' ? 'oklch(0.70 0.20 155 / 0.1)' : 'oklch(0.55 0.22 260 / 0.1)',
                        color: status === 'ACTIVE' ? 'var(--ts-green-500)' : 'var(--ts-blue-400)',
                        border: `1px solid ${status === 'ACTIVE' ? 'oklch(0.70 0.20 155 / 0.25)' : 'oklch(0.55 0.22 260 / 0.25)'}`,
                      }}
                    >
                      {status === 'ACTIVE' ? '✓ Active' : 'Configure →'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'team' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>
                    Team Access
                  </h2>
                  <button
                    onClick={() => { setShowInviteModal(true); setInviteError(''); setInviteSuccess(false); }}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-medium"
                    style={{ background: 'var(--ts-blue-600)', color: 'white', border: 'none', cursor: 'pointer' }}
                  >
                    <UserPlus size={13} />
                    Invite member
                  </button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 20 }}>
                  Manage role-based access for CFOs, accountants, and auditors.
                </p>

                {/* Pending invitations */}
                {invitations && invitations.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--ts-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                      Pending Invitations
                    </p>
                    {invitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between py-3"
                        style={{ borderBottom: '1px solid var(--ts-border-subtle)' }}
                      >
                        <div className="flex items-center gap-3">
                          <Clock size={14} style={{ color: 'var(--ts-fg-muted)', flexShrink: 0 }} />
                          <div>
                            <p style={{ fontSize: 13, color: 'var(--ts-fg-primary)', margin: 0 }}>{inv.email}</p>
                            <p style={{ fontSize: 11, color: 'var(--ts-fg-muted)', margin: 0 }}>
                              {ROLE_LABELS[inv.role] ?? inv.role} · Expires {new Date(inv.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => revokeMutation.mutate(inv.id)}
                          disabled={revokeMutation.isPending}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ts-fg-muted)', padding: 4 }}
                          title="Revoke invitation"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {invitations && invitations.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)', marginBottom: 16 }}>
                    No pending invitations.
                  </p>
                )}

                {/* Invite modal */}
                {showInviteModal && (
                  <div
                    className="fixed inset-0 flex items-center justify-center z-50"
                    style={{ background: 'rgba(0,0,0,0.6)' }}
                    onClick={(e) => { if (e.target === e.currentTarget) setShowInviteModal(false); }}
                  >
                    <div
                      className="rounded-2xl p-6 w-full max-w-sm"
                      style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)' }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>
                          Invite team member
                        </h3>
                        <button
                          onClick={() => setShowInviteModal(false)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ts-fg-muted)', padding: 2 }}
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {inviteSuccess ? (
                        <div className="text-center py-4">
                          <CheckCircle2 size={28} style={{ color: 'var(--ts-green-500)', margin: '0 auto 8px' }} />
                          <p style={{ fontSize: 13, color: 'var(--ts-fg-primary)' }}>Invitation sent!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ts-fg-secondary)', display: 'block', marginBottom: 6 }}>
                              Email address
                            </label>
                            <input
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="colleague@company.ae"
                              className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
                              style={{
                                background: 'var(--ts-bg-elevated)',
                                border: '1px solid var(--ts-border)',
                                color: 'var(--ts-fg-primary)',
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ts-fg-secondary)', display: 'block', marginBottom: 6 }}>
                              Role
                            </label>
                            <select
                              value={inviteRole}
                              onChange={(e) => setInviteRole(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
                              style={{
                                background: 'var(--ts-bg-elevated)',
                                border: '1px solid var(--ts-border)',
                                color: 'var(--ts-fg-primary)',
                                cursor: 'pointer',
                              }}
                            >
                              <option value="FINANCE">Finance</option>
                              <option value="VIEWER">Viewer</option>
                              <option value="AUDITOR">Auditor</option>
                            </select>
                          </div>

                          {inviteError && (
                            <p style={{ fontSize: 12, color: 'var(--ts-red-400)' }}>{inviteError}</p>
                          )}

                          <button
                            onClick={() => { setInviteError(''); inviteMutation.mutate(); }}
                            disabled={!inviteEmail || inviteMutation.isPending}
                            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
                            style={{ background: 'var(--ts-blue-600)', color: '#fff', border: 'none', cursor: 'pointer' }}
                          >
                            {inviteMutation.isPending ? 'Sending…' : 'Send invitation'}
                          </button>
                        </div>
                      )}
                    </div>
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
