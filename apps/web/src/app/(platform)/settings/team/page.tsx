'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import { UserPlus, X, Trash2, Mail, ShieldAlert, ChevronDown, Crown, AlertTriangle } from 'lucide-react';

type MemberRole = 'OWNER' | 'FINANCE' | 'VIEWER' | 'AUDITOR';

const ASSIGNABLE_ROLES: MemberRole[] = ['FINANCE', 'VIEWER', 'AUDITOR'];

const ROLE_DESCRIPTIONS: Record<MemberRole, string> = {
  OWNER: 'Full access. Can manage billing, settings, and delete the organization.',
  FINANCE: 'Can upload transactions, override classifications, and upload substance documents.',
  VIEWER: 'Read-only access to the compliance dashboard and reports.',
  AUDITOR: 'Read-only access to reports, transactions, and substance documentation.',
};

const ROLE_COLOR: Record<MemberRole, { bg: string; color: string }> = {
  OWNER:   { bg: 'oklch(0.55 0.22 290 / 0.12)', color: 'oklch(0.55 0.22 290)' },
  FINANCE: { bg: 'oklch(0.55 0.22 260 / 0.12)', color: 'var(--ts-blue-400)' },
  VIEWER:  { bg: 'oklch(0.50 0 0 / 0.10)',       color: 'var(--ts-fg-muted)' },
  AUDITOR: { bg: 'oklch(0.75 0.18 85 / 0.12)',   color: 'var(--ts-amber-500)' },
};

function InviteModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'FINANCE' | 'VIEWER' | 'AUDITOR'>('FINANCE');
  const [error, setError] = useState('');

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/organizations/me/invite', { email, role });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to send invitation');
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl relative"
        style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)' }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex items-center justify-center rounded-full"
          style={{ width: 28, height: 28, background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)', cursor: 'pointer' }}
        >
          <X size={14} color="var(--ts-fg-muted)" />
        </button>

        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ts-fg-primary)', marginBottom: 20 }}>
          Invite Team Member
        </h2>

        <div className="space-y-4">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ts-fg-secondary)', display: 'block', marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
              style={{
                background: 'var(--ts-bg-elevated)',
                border: '1px solid var(--ts-border)',
                color: 'var(--ts-fg-primary)',
              }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--ts-blue-500)'; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--ts-border)'; }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ts-fg-secondary)', display: 'block', marginBottom: 6 }}>
              Role
            </label>
            <div className="space-y-2">
              {(['FINANCE', 'VIEWER', 'AUDITOR'] as const).map((r) => {
                const rc = ROLE_COLOR[r];
                return (
                  <label
                    key={r}
                    className="flex items-start gap-3 rounded-xl p-3 cursor-pointer"
                    style={{
                      background: role === r ? rc.bg : 'var(--ts-bg-elevated)',
                      border: `1px solid ${role === r ? rc.color + '55' : 'var(--ts-border)'}`,
                    }}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={role === r}
                      onChange={() => setRole(r)}
                      className="mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts-fg-primary)' }}>{r}</div>
                      <div style={{ fontSize: 11, color: 'var(--ts-fg-muted)' }}>{ROLE_DESCRIPTIONS[r]}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg text-[12px]"
              style={{ background: 'oklch(0.55 0.22 25 / 0.08)', border: '1px solid oklch(0.55 0.22 25 / 0.25)', color: 'var(--ts-red-400)' }}
            >
              <ShieldAlert size={14} /> {error}
            </div>
          )}

          <button
            onClick={() => inviteMutation.mutate()}
            disabled={!email || inviteMutation.isPending}
            className="w-full rounded-xl py-2.5 text-[13px] font-bold disabled:opacity-50"
            style={{ background: 'var(--ts-blue-500)', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {inviteMutation.isPending ? 'Sending…' : 'Send Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeactivateConfirmModal({
  member,
  onClose,
  onConfirm,
  isPending,
}: {
  member: any;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 40, height: 40, background: 'oklch(0.55 0.22 25 / 0.12)' }}
          >
            <Trash2 size={18} color="var(--ts-red-400)" />
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}>Remove Member</h2>
            <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0 }}>This will revoke their access</p>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ts-fg-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
          Are you sure you want to remove{' '}
          <span style={{ fontWeight: 600, color: 'var(--ts-fg-primary)' }}>
            {member.name ?? member.email}
          </span>{' '}
          from the organization? They will immediately lose access.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold"
            style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)', color: 'var(--ts-fg-secondary)', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded-xl py-2.5 text-[13px] font-bold disabled:opacity-50"
            style={{ background: 'var(--ts-red-400)', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            {isPending ? 'Removing…' : 'Remove Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TransferOwnershipModal({
  members,
  onClose,
}: {
  members: any[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  const transferMutation = useMutation({
    mutationFn: () =>
      api.post('/organizations/me/transfer-ownership', { userId: selectedUserId }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? 'Transfer failed. Please try again.');
    },
  });

  const nonOwners = members.filter((m) => m.role !== 'OWNER');
  const selected = nonOwners.find((m) => m.id === selectedUserId || m.userId === selectedUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)' }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 40, height: 40, background: 'oklch(0.55 0.22 290 / 0.15)' }}
          >
            <Crown size={18} color="oklch(0.55 0.22 290)" />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}>Transfer Ownership</h2>
            <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0 }}>Select a member to become the new Owner</p>
          </div>
        </div>

        {/* Warning */}
        <div
          className="flex items-start gap-3 rounded-xl p-3 mb-5"
          style={{ background: 'oklch(0.80 0.18 85 / 0.1)', border: '1px solid oklch(0.80 0.18 85 / 0.3)' }}
        >
          <AlertTriangle size={14} color="var(--ts-amber-500)" className="flex-shrink-0 mt-0.5" />
          <p style={{ fontSize: 12, color: 'var(--ts-fg-secondary)', margin: 0, lineHeight: 1.6 }}>
            This action transfers your <strong>Owner</strong> role to another member. You will become
            a <strong>Finance</strong> user. This action cannot be undone without the new owner&apos;s cooperation.
          </p>
        </div>

        {/* Select member */}
        <div className="mb-4">
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ts-fg-secondary)', display: 'block', marginBottom: 6 }}>
            Transfer ownership to
          </label>
          <div className="relative">
            <select
              value={selectedUserId}
              onChange={(e) => { setSelectedUserId(e.target.value); setConfirmed(false); }}
              className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none appearance-none"
              style={{
                background: 'var(--ts-bg-elevated)',
                border: '1px solid var(--ts-border)',
                color: selectedUserId ? 'var(--ts-fg-primary)' : 'var(--ts-fg-muted)',
              }}
            >
              <option value="" disabled>Select a member…</option>
              {nonOwners.map((m) => (
                <option key={m.id} value={m.userId ?? m.id}>
                  {m.name ?? m.email} ({m.role})
                </option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ts-fg-muted)', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Double confirmation checkbox */}
        {selectedUserId && (
          <label
            className="flex items-start gap-3 rounded-xl p-3 mb-4 cursor-pointer"
            style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)' }}
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 flex-shrink-0"
            />
            <span style={{ fontSize: 12, color: 'var(--ts-fg-secondary)', lineHeight: 1.6 }}>
              I understand that{' '}
              <strong style={{ color: 'var(--ts-fg-primary)' }}>
                {selected?.name ?? selected?.email ?? 'the selected member'}
              </strong>{' '}
              will become the new Owner and I will be downgraded to Finance. This cannot be easily reversed.
            </span>
          </label>
        )}

        {error && (
          <p style={{ fontSize: 12, color: 'var(--ts-red-400)', marginBottom: 12 }}>{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold"
            style={{ background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)', color: 'var(--ts-fg-secondary)', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={() => transferMutation.mutate()}
            disabled={!selectedUserId || !confirmed || transferMutation.isPending}
            className="flex-1 rounded-xl py-2.5 text-[13px] font-bold disabled:opacity-40"
            style={{ background: 'oklch(0.55 0.22 290)', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            {transferMutation.isPending ? 'Transferring…' : 'Transfer Ownership'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleDropdown({
  currentRole,
  memberId,
  onChanged,
}: {
  currentRole: MemberRole;
  memberId: string;
  onChanged: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const changeMutation = useMutation({
    mutationFn: (role: MemberRole) =>
      api.patch(`/organizations/me/members/${memberId}/role`, { role }).then((r) => r.data),
    onSuccess: () => {
      onChanged();
      setIsOpen(false);
    },
    onSettled: () => setPending(false),
  });

  const rc = ROLE_COLOR[currentRole] ?? ROLE_COLOR.VIEWER;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={pending}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold"
        style={{
          background: rc.bg,
          color: rc.color,
          border: `1px solid ${rc.color}44`,
          cursor: 'pointer',
          opacity: pending ? 0.6 : 1,
        }}
      >
        {currentRole}
        <ChevronDown size={10} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 top-8 z-20 rounded-xl overflow-hidden shadow-xl"
            style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)', minWidth: 160 }}
          >
            {ASSIGNABLE_ROLES.map((role) => {
              const rrc = ROLE_COLOR[role];
              return (
                <button
                  key={role}
                  onClick={() => {
                    setPending(true);
                    changeMutation.mutate(role);
                  }}
                  className="w-full flex items-start gap-2 px-3 py-2.5 text-left"
                  style={{
                    background: role === currentRole ? rrc.bg : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (role !== currentRole) (e.currentTarget as HTMLElement).style.background = 'var(--ts-bg-elevated)';
                  }}
                  onMouseLeave={(e) => {
                    if (role !== currentRole) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: role === currentRole ? rrc.color : 'var(--ts-fg-primary)', margin: 0 }}>
                      {role}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--ts-fg-muted)', margin: 0 }}>
                      {ROLE_DESCRIPTIONS[role]}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function TeamSettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currentUserId = user?.id ?? '';

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [memberToDeactivate, setMemberToDeactivate] = useState<any | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => api.get('/organizations/me/members').then((r) => r.data.data ?? r.data),
  });

  const { data: invitations, isLoading: loadingInvites } = useQuery({
    queryKey: ['team-invitations'],
    queryFn: () => api.get('/organizations/me/invitations').then((r) => r.data.data ?? r.data),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/organizations/me/invitations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-invitations'] }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/organizations/me/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setMemberToDeactivate(null);
    },
  });

  const membersList: any[] = members ?? [];
  const currentMember = membersList.find((m) => (m.userId ?? m.id) === currentUserId);
  const isOwner = currentMember?.role === 'OWNER';

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--ts-bg-base)' }}
    >
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}>Team &amp; Roles</h1>
            <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)', margin: '4px 0 0' }}>
              Manage who has access to your organization.
            </p>
          </div>
          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold"
            style={{ background: 'var(--ts-blue-500)', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            <UserPlus size={15} />
            Invite Member
          </button>
        </div>

        {/* Active Members */}
        <div
          className="rounded-xl overflow-hidden mb-6"
          style={{ border: '1px solid var(--ts-border)', background: 'var(--ts-bg-card)' }}
        >
          <div
            className="px-5 py-4"
            style={{ borderBottom: '1px solid var(--ts-border-subtle)' }}
          >
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>Active Members</h2>
          </div>

          {loadingMembers ? (
            <div className="px-5 py-8 text-center">
              <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>Loading members…</p>
            </div>
          ) : membersList.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>No members found</p>
            </div>
          ) : (
            <div>
              {membersList.map((member: any, idx: number) => {
                const memberId = member.userId ?? member.id;
                const isSelf = memberId === currentUserId;
                const role: MemberRole = member.role ?? 'VIEWER';
                const rc = ROLE_COLOR[role] ?? ROLE_COLOR.VIEWER;
                const initial = (member.name ?? member.email ?? '?').charAt(0).toUpperCase();
                const lastLogin = member.lastLoginAt
                  ? new Date(member.lastLoginAt).toLocaleDateString('en-AE', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })
                  : null;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-5 py-4"
                    style={{
                      borderBottom: idx < membersList.length - 1 ? '1px solid var(--ts-border-subtle)' : 'none',
                    }}
                  >
                    {/* Avatar + info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="flex items-center justify-center rounded-full flex-shrink-0 text-[14px] font-bold"
                        style={{
                          width: 38,
                          height: 38,
                          background: 'oklch(0.55 0.22 260 / 0.12)',
                          color: 'var(--ts-blue-400)',
                          border: '1px solid oklch(0.55 0.22 260 / 0.2)',
                        }}
                      >
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts-fg-primary)' }}>
                          {member.name ?? member.email}
                          {isSelf && (
                            <span
                              className="ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                              style={{ background: 'oklch(0.55 0.22 260 / 0.12)', color: 'var(--ts-blue-400)' }}
                            >
                              You
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ts-fg-muted)' }}>
                          {member.name ? member.email : null}
                          {lastLogin && (
                            <span className={member.name ? 'ml-2' : ''}>
                              Last login: {lastLogin}
                            </span>
                          )}
                          {!member.name && !lastLogin && member.email}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Role badge / dropdown */}
                      {role === 'OWNER' || isSelf ? (
                        <span
                          className="rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                          style={{ background: rc.bg, color: rc.color, border: `1px solid ${rc.color}44` }}
                        >
                          {role}
                        </span>
                      ) : (
                        <RoleDropdown
                          currentRole={role}
                          memberId={memberId}
                          onChanged={() => queryClient.invalidateQueries({ queryKey: ['team-members'] })}
                        />
                      )}

                      {/* Deactivate button (not self, not owner) */}
                      {!isSelf && role !== 'OWNER' && isOwner && (
                        <button
                          onClick={() => setMemberToDeactivate(member)}
                          className="flex items-center justify-center rounded-lg"
                          style={{
                            width: 32,
                            height: 32,
                            background: 'oklch(0.55 0.22 25 / 0.06)',
                            border: '1px solid oklch(0.55 0.22 25 / 0.2)',
                            cursor: 'pointer',
                            color: 'var(--ts-red-400)',
                          }}
                          title="Remove member"
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(0.55 0.22 25 / 0.14)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(0.55 0.22 25 / 0.06)'; }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Invitations */}
        {!loadingInvites && invitations && invitations.length > 0 && (
          <div
            className="rounded-xl overflow-hidden mb-6"
            style={{ border: '1px solid var(--ts-border)', background: 'var(--ts-bg-card)' }}
          >
            <div
              className="px-5 py-4"
              style={{ borderBottom: '1px solid var(--ts-border-subtle)' }}
            >
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>Pending Invitations</h2>
            </div>
            <div>
              {invitations.map((inv: any, idx: number) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: idx < invitations.length - 1 ? '1px solid var(--ts-border-subtle)' : 'none' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center rounded-full flex-shrink-0"
                      style={{
                        width: 38,
                        height: 38,
                        background: 'var(--ts-bg-elevated)',
                        border: '1px solid var(--ts-border)',
                        color: 'var(--ts-fg-muted)',
                      }}
                    >
                      <Mail size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ts-fg-primary)' }}>{inv.email}</div>
                      <div style={{ fontSize: 11, color: 'var(--ts-fg-muted)' }}>
                        Invited as {inv.role} · Expires {new Date(inv.expiresAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => revokeMutation.mutate(inv.id)}
                    disabled={revokeMutation.isPending}
                    className="flex items-center justify-center rounded-lg"
                    style={{
                      width: 32,
                      height: 32,
                      background: 'oklch(0.55 0.22 25 / 0.06)',
                      border: '1px solid oklch(0.55 0.22 25 / 0.2)',
                      cursor: 'pointer',
                      color: 'var(--ts-red-400)',
                    }}
                    title="Revoke invitation"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(0.55 0.22 25 / 0.14)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(0.55 0.22 25 / 0.06)'; }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transfer Ownership — only visible to the owner */}
        {isOwner && membersList.filter((m) => m.role !== 'OWNER').length > 0 && (
          <div
            className="rounded-xl p-5"
            style={{
              border: '1px solid oklch(0.55 0.22 290 / 0.3)',
              background: 'oklch(0.55 0.22 290 / 0.04)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center rounded-xl flex-shrink-0 mt-0.5"
                  style={{ width: 36, height: 36, background: 'oklch(0.55 0.22 290 / 0.15)' }}
                >
                  <Crown size={16} color="oklch(0.55 0.22 290)" />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}>
                    Transfer Organization Ownership
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
                    This action transfers your Owner role to another member. You will become a Finance user.
                    This action is irreversible without the new owner&apos;s cooperation.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTransferOpen(true)}
                className="flex-shrink-0 rounded-xl px-3 py-2 text-[12px] font-semibold"
                style={{
                  background: 'oklch(0.55 0.22 290 / 0.12)',
                  border: '1px solid oklch(0.55 0.22 290 / 0.35)',
                  color: 'oklch(0.55 0.22 290)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(0.55 0.22 290 / 0.2)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'oklch(0.55 0.22 290 / 0.12)'; }}
              >
                Transfer Ownership
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {isInviteOpen && <InviteModal onClose={() => setIsInviteOpen(false)} />}

      {memberToDeactivate && (
        <DeactivateConfirmModal
          member={memberToDeactivate}
          onClose={() => setMemberToDeactivate(null)}
          onConfirm={() => deactivateMutation.mutate(memberToDeactivate.userId ?? memberToDeactivate.id)}
          isPending={deactivateMutation.isPending}
        />
      )}

      {isTransferOpen && (
        <TransferOwnershipModal
          members={membersList}
          onClose={() => setIsTransferOpen(false)}
        />
      )}
    </div>
  );
}
