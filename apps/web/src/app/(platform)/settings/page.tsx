'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { TopRibbon } from '@/components/dashboard/TopRibbon';
import {
  Settings,
  Building2,
  Bell,
  Shield,
  Users,
  Save,
  ChevronRight,
  CheckCircle2,
  UserPlus,
  X,
  Trash2,
  Clock,
  Key,
  Copy,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

type TabId = 'company' | 'notifications' | 'security' | 'team' | 'apikeys';

type Invitation = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
};

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
}

interface AlertThresholds {
  warningPct?: number;
  dangerPct?: number;
  absLimitM?: number;
}

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
  { id: 'apikeys', label: 'API Keys', icon: Key },
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

function StyledInput({
  value,
  onChange,
  type = 'text',
  placeholder,
  min,
  max,
  step,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
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

function NumberInput({
  value,
  onChange,
  min,
  max,
  label,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ts-fg-secondary)', display: 'block' }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          className="rounded-lg px-3 py-2 text-[13px] outline-none transition-all"
          style={{
            background: 'var(--ts-bg-elevated)',
            border: '1px solid var(--ts-border)',
            color: 'var(--ts-fg-primary)',
            width: 100,
            fontFamily: 'var(--font-sans)',
          }}
          onFocus={e => { (e.target as HTMLElement).style.borderColor = 'var(--ts-blue-500)'; }}
          onBlur={e => { (e.target as HTMLElement).style.borderColor = 'var(--ts-border)'; }}
        />
        {suffix && (
          <span style={{ fontSize: 12, color: 'var(--ts-fg-muted)' }}>{suffix}</span>
        )}
      </div>
    </div>
  );
}

// ── API KEYS TAB ──────────────────────────────────────────────────────────────

function ApiKeysTab() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [createError, setCreateError] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: apiKeys, isLoading } = useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: () => api.get('/api-keys').then((r) => r.data.data ?? r.data),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/api-keys', {
        name: newKeyName,
        ...(newKeyExpiry ? { expiresAt: new Date(newKeyExpiry).toISOString() } : {}),
      }).then((r) => r.data.data ?? r.data),
    onSuccess: (data: { key: string }) => {
      setCreatedKey(data.key);
      setCreateError('');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not create API key.';
      setCreateError(msg);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api-keys/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  function copyKey(key: string) {
    navigator.clipboard.writeText(key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function closeCreateModal() {
    setShowCreateModal(false);
    setNewKeyName('');
    setNewKeyExpiry('');
    setCreatedKey(null);
    setCreateError('');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>
            API Keys
          </h2>
        </div>
        <button
          onClick={() => { setShowCreateModal(true); setCreateError(''); setCreatedKey(null); }}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-medium"
          style={{ background: 'var(--ts-blue-600)', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          <Key size={13} />
          Create New Key
        </button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 20 }}>
        Create long-lived API keys for integrations and automation. Keys are shown only once at creation.
      </p>

      {isLoading ? (
        <div style={{ color: 'var(--ts-fg-muted)', fontSize: 13 }}>Loading keys…</div>
      ) : !apiKeys || apiKeys.length === 0 ? (
        <div
          className="text-center py-10 rounded-xl"
          style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)', color: 'var(--ts-fg-muted)', fontSize: 13 }}
        >
          No API keys yet. Create one to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{ width: 36, height: 36, background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)' }}
                >
                  <Key size={15} style={{ color: 'var(--ts-fg-muted)' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ts-fg-primary)', margin: 0 }}>
                    {key.name}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--ts-fg-muted)', margin: 0 }}>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        background: 'var(--ts-bg-card)',
                        padding: '1px 4px',
                        borderRadius: 4,
                        border: '1px solid var(--ts-border)',
                        marginRight: 6,
                      }}
                    >
                      {key.prefix}…
                    </span>
                    Created {new Date(key.createdAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {key.lastUsedAt && (
                      <> · Last used {new Date(key.lastUsedAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}</>
                    )}
                    {key.expiresAt && (
                      <> · Expires {new Date(key.expiresAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => revokeMutation.mutate(key.id)}
                disabled={revokeMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all"
                style={{
                  background: 'oklch(0.55 0.22 15 / 0.08)',
                  border: '1px solid oklch(0.55 0.22 15 / 0.2)',
                  color: 'var(--ts-red-400)',
                  cursor: revokeMutation.isPending ? 'default' : 'pointer',
                }}
              >
                <Trash2 size={12} />
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Key Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeCreateModal(); }}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-sm"
            style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>
                Create API Key
              </h3>
              <button
                onClick={closeCreateModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ts-fg-muted)', padding: 2 }}
              >
                <X size={16} />
              </button>
            </div>

            {createdKey ? (
              <div>
                <div
                  className="flex items-start gap-3 p-4 rounded-xl mb-4"
                  style={{ background: 'oklch(0.75 0.18 85 / 0.12)', border: '1px solid oklch(0.75 0.18 85 / 0.35)' }}
                >
                  <AlertTriangle size={16} style={{ color: 'var(--ts-amber-500)', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: 'var(--ts-fg-primary)', margin: 0, fontWeight: 500 }}>
                    This key will not be shown again. Copy it now.
                  </p>
                </div>
                <div
                  className="flex items-center gap-2 p-3 rounded-lg mb-4"
                  style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)' }}
                >
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 12,
                      color: 'var(--ts-fg-primary)',
                      flex: 1,
                      wordBreak: 'break-all',
                    }}
                  >
                    {createdKey}
                  </span>
                  <button
                    onClick={() => copyKey(createdKey)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ts-fg-muted)', flexShrink: 0 }}
                    title="Copy key"
                  >
                    <Copy size={14} style={{ color: copied ? 'var(--ts-green-500)' : 'var(--ts-fg-muted)' }} />
                  </button>
                </div>
                {copied && (
                  <p style={{ fontSize: 12, color: 'var(--ts-green-500)', marginBottom: 8 }}>Copied to clipboard!</p>
                )}
                <button
                  onClick={closeCreateModal}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--ts-blue-600)', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ts-fg-secondary)', display: 'block', marginBottom: 6 }}>
                    Key Name <span style={{ color: 'var(--ts-red-400)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value.slice(0, 50))}
                    placeholder="e.g. CI/CD Pipeline"
                    maxLength={50}
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
                    style={{
                      background: 'var(--ts-bg-elevated)',
                      border: '1px solid var(--ts-border)',
                      color: 'var(--ts-fg-primary)',
                    }}
                    onFocus={e => { (e.target as HTMLElement).style.borderColor = 'var(--ts-blue-500)'; }}
                    onBlur={e => { (e.target as HTMLElement).style.borderColor = 'var(--ts-border)'; }}
                  />
                  <p style={{ fontSize: 11, color: 'var(--ts-fg-muted)', marginTop: 4 }}>
                    {newKeyName.length}/50 characters
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ts-fg-secondary)', display: 'block', marginBottom: 6 }}>
                    Expiry Date <span style={{ color: 'var(--ts-fg-muted)' }}>(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={newKeyExpiry}
                    onChange={(e) => setNewKeyExpiry(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
                    style={{
                      background: 'var(--ts-bg-elevated)',
                      border: '1px solid var(--ts-border)',
                      color: 'var(--ts-fg-primary)',
                      cursor: 'pointer',
                    }}
                    onFocus={e => { (e.target as HTMLElement).style.borderColor = 'var(--ts-blue-500)'; }}
                    onBlur={e => { (e.target as HTMLElement).style.borderColor = 'var(--ts-border)'; }}
                  />
                </div>

                {createError && (
                  <p style={{ fontSize: 12, color: 'var(--ts-red-400)' }}>{createError}</p>
                )}

                <button
                  onClick={() => { setCreateError(''); createMutation.mutate(); }}
                  disabled={!newKeyName.trim() || createMutation.isPending}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
                  style={{ background: 'var(--ts-blue-600)', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                  {createMutation.isPending ? 'Creating…' : 'Create Key'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('company');
  const [saved, setSaved] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [freeZone, setFreeZone] = useState('DMCC');
  const [licenseNo, setLicenseNo] = useState('');
  const [taxRegNo, setTaxRegNo] = useState('');

  // Alert thresholds
  const [warningPct, setWarningPct] = useState(50);
  const [dangerPct, setDangerPct] = useState(80);
  const [absLimitM, setAbsLimitM] = useState(5);

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

      const thresholds = orgData.alertThresholdsJson as AlertThresholds | null | undefined;
      if (thresholds) {
        if (thresholds.warningPct != null) setWarningPct(thresholds.warningPct);
        if (thresholds.dangerPct != null) setDangerPct(thresholds.dangerPct);
        if (thresholds.absLimitM != null) setAbsLimitM(thresholds.absLimitM);
      }
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

  const [notifSaved, setNotifSaved] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    emailAlerts: true,
    breachAlerts: true,
    weeklyDigest: false,
    thresholdWarnings: true,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: () => api.get('/organizations/me/notifications').then((r) => r.data.data),
    onSuccess: (d: Record<string, boolean>) => {
      if (d) setNotifPrefs((prev) => ({ ...prev, ...d }));
    },
    enabled: activeTab === 'notifications',
  } as Parameters<typeof useQuery>[0]);

  // Keep linter happy — notifData used only for side-effect via onSuccess
  void notifData;

  const saveNotifMutation = useMutation({
    mutationFn: () =>
      Promise.all([
        api.patch('/organizations/me/notifications', notifPrefs),
        api.patch('/organizations/me/thresholds', {
          alertThresholdsJson: { warningPct, dangerPct, absLimitM },
        }),
      ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-prefs'] });
      queryClient.invalidateQueries({ queryKey: ['org-me'] });
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 3000);
    },
  });

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
                  <Toggle enabled={notifPrefs.emailAlerts} onChange={(v) => setNotifPrefs((p) => ({ ...p, emailAlerts: v }))} />
                </SettingRow>
                <SettingRow label="Breach Imminent Alerts" description="Immediate notification when de-minimis exceeds 80%">
                  <Toggle enabled={notifPrefs.breachAlerts} onChange={(v) => setNotifPrefs((p) => ({ ...p, breachAlerts: v }))} />
                </SettingRow>
                <SettingRow label="Weekly Digest" description="Summary email every Monday with compliance status">
                  <Toggle enabled={notifPrefs.weeklyDigest} onChange={(v) => setNotifPrefs((p) => ({ ...p, weeklyDigest: v }))} />
                </SettingRow>
                <SettingRow label="Threshold Warnings" description="Warnings at 50%, 70%, and 90% of de-minimis limits">
                  <Toggle enabled={notifPrefs.thresholdWarnings} onChange={(v) => setNotifPrefs((p) => ({ ...p, thresholdWarnings: v }))} />
                </SettingRow>

                {/* Custom Alert Thresholds */}
                <div
                  className="mt-6 p-5 rounded-xl"
                  style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)' }}
                >
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts-fg-primary)', marginBottom: 4 }}>
                    Custom Alert Thresholds
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', marginBottom: 16 }}>
                    Override the default thresholds that trigger warning and danger alerts for your organisation.
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <NumberInput
                      label="De-Minimis Warning (%)"
                      value={warningPct}
                      onChange={setWarningPct}
                      min={1}
                      max={99}
                      suffix="%"
                    />
                    <NumberInput
                      label="De-Minimis Danger (%)"
                      value={dangerPct}
                      onChange={setDangerPct}
                      min={1}
                      max={100}
                      suffix="%"
                    />
                    <NumberInput
                      label="NQI Absolute Limit (AED M)"
                      value={absLimitM}
                      onChange={setAbsLimitM}
                      min={0}
                      suffix="M AED"
                    />
                  </div>
                </div>

                <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={() => saveNotifMutation.mutate()}
                    disabled={saveNotifMutation.isPending}
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold transition-all"
                    style={{ background: 'var(--ts-blue-500)', color: 'white', border: 'none', cursor: saveNotifMutation.isPending ? 'default' : 'pointer', opacity: saveNotifMutation.isPending ? 0.7 : 1 }}
                  >
                    <Save size={14} />
                    {saveNotifMutation.isPending ? 'Saving…' : 'Save Preferences'}
                  </button>
                  {notifSaved && (
                    <span className="flex items-center gap-1.5" style={{ fontSize: 13, color: 'var(--ts-green-500)' }}>
                      <CheckCircle2 size={14} /> Saved
                    </span>
                  )}
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
                  { label: 'AES-256 Data Encryption', desc: 'All data at rest encrypted with AES-256-GCM', status: 'ACTIVE', actionHref: null },
                  { label: 'TLS 1.3 in Transit', desc: 'All API communication over TLS 1.3', status: 'ACTIVE', actionHref: null },
                  { label: 'Immutable Audit Log', desc: 'All actions logged and tamper-proof', status: 'ACTIVE', actionHref: null },
                  { label: 'Two-Factor Authentication', desc: 'Set up TOTP-based 2FA on your personal account', status: 'CONFIGURE', actionHref: '/account?tab=mfa' },
                  { label: 'Session Timeout', desc: 'Auto-sign-out after 8 hours of inactivity', status: 'ACTIVE', actionHref: null },
                ].map(({ label, desc, status, actionHref }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-4"
                    style={{ borderBottom: '1px solid var(--ts-border-subtle)' }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ts-fg-primary)', margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0, marginTop: 2 }}>{desc}</p>
                    </div>
                    {actionHref ? (
                      <Link
                        href={actionHref}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide"
                        style={{
                          background: 'oklch(0.55 0.22 260 / 0.1)',
                          color: 'var(--ts-blue-400)',
                          border: '1px solid oklch(0.55 0.22 260 / 0.25)',
                          textDecoration: 'none',
                        }}
                      >
                        Configure
                        <ExternalLink size={10} />
                      </Link>
                    ) : (
                      <span
                        className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wide"
                        style={{
                          background: 'oklch(0.70 0.20 155 / 0.1)',
                          color: 'var(--ts-green-500)',
                          border: '1px solid oklch(0.70 0.20 155 / 0.25)',
                        }}
                      >
                        Active
                      </span>
                    )}
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

            {activeTab === 'apikeys' && <ApiKeysTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
