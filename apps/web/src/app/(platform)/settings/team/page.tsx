'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { UserPlus, X, Trash2, Mail, ShieldAlert } from 'lucide-react';

const ROLE_DESCRIPTIONS = {
  OWNER: 'Full access. Can manage billing, settings, and delete the organization.',
  FINANCE: 'Can upload transactions, override classifications, and upload substance documents.',
  AUDITOR: 'Read-only access to reports, transactions, and substance documentation.',
};

function InviteModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'FINANCE' | 'AUDITOR'>('FINANCE');
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
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
        
        <h2 className="text-lg font-bold text-gray-900 mb-6">Invite Team Member</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
            <div className="space-y-2">
              {(['FINANCE', 'AUDITOR'] as const).map(r => (
                <label key={r} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={() => setRole(r)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{r}</div>
                    <div className="text-xs text-gray-500">{ROLE_DESCRIPTIONS[r]}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
              <ShieldAlert size={16} /> {error}
            </div>
          )}

          <button
            onClick={() => inviteMutation.mutate()}
            disabled={!email || inviteMutation.isPending}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeamSettingsPage() {
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => api.get('/organizations/me/members').then(r => r.data.data ?? r.data),
  });

  const { data: invitations, isLoading: loadingInvites } = useQuery({
    queryKey: ['team-invitations'],
    queryFn: () => api.get('/organizations/me/invitations').then(r => r.data.data ?? r.data),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/organizations/me/invitations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-invitations'] }),
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team & Roles</h1>
          <p className="text-gray-500 mt-1">Manage who has access to your organization.</p>
        </div>
        <button
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <UserPlus size={16} /> Invite Member
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Active Members</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {loadingMembers ? (
            <div className="p-6 text-center text-gray-400">Loading members...</div>
          ) : members?.map((member: any) => (
            <div key={member.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold uppercase">
                  {member.email.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{member.email}</div>
                  <div className="text-xs text-gray-500">Joined {new Date(member.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                  member.role === 'OWNER' ? 'bg-purple-100 text-purple-700' :
                  member.role === 'FINANCE' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {member.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {invitations && invitations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Pending Invitations</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {invitations.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{inv.email}</div>
                    <div className="text-xs text-gray-500">
                      Invited as {inv.role} · Expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => revokeMutation.mutate(inv.id)}
                  disabled={revokeMutation.isPending}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Revoke Invite"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isInviteOpen && <InviteModal onClose={() => setIsInviteOpen(false)} />}
    </div>
  );
}
