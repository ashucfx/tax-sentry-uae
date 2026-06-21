'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  HelpCircle,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  ChevronRight,
  MessageSquare,
  Zap,
  FileQuestion,
  CreditCard,
  Wrench,
  Shield,
  Send,
  ChevronDown,
} from 'lucide-react';

type SupportCategory = 'BILLING' | 'TECHNICAL' | 'COMPLIANCE' | 'FEATURE_REQUEST' | 'OTHER';
type SupportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

const CATEGORY_CONFIG: Record<SupportCategory, { label: string; icon: React.ElementType; color: string }> = {
  BILLING:         { label: 'Billing',           icon: CreditCard,    color: 'var(--ts-green-500)' },
  TECHNICAL:       { label: 'Technical Issue',   icon: Wrench,        color: 'var(--ts-blue-400)' },
  COMPLIANCE:      { label: 'Compliance',         icon: Shield,        color: 'var(--ts-amber-500)' },
  FEATURE_REQUEST: { label: 'Feature Request',   icon: Zap,           color: 'var(--ts-blue-400)' },
  OTHER:           { label: 'Other',             icon: FileQuestion,  color: 'var(--ts-fg-muted)' },
};

const STATUS_CONFIG: Record<SupportStatus, { label: string; color: string; bg: string }> = {
  OPEN:        { label: 'Open',        color: 'var(--ts-blue-400)',   bg: 'oklch(0.55 0.22 260 / 0.12)' },
  IN_PROGRESS: { label: 'In Progress', color: 'var(--ts-amber-500)', bg: 'oklch(0.75 0.18 85 / 0.12)' },
  RESOLVED:    { label: 'Resolved',    color: 'var(--ts-green-500)', bg: 'oklch(0.70 0.20 155 / 0.12)' },
  CLOSED:      { label: 'Closed',      color: 'var(--ts-fg-muted)',  bg: 'oklch(0.50 0 0 / 0.12)' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW:    { label: 'Low',    color: 'var(--ts-fg-muted)' },
  NORMAL: { label: 'Normal', color: 'var(--ts-blue-400)' },
  HIGH:   { label: 'High',   color: 'var(--ts-amber-500)' },
  URGENT: { label: 'Urgent', color: 'var(--ts-red-400)' },
};

const FAQS = [
  {
    q: 'How is QI/NQI classification determined?',
    a: "Classification follows UAE Cabinet Decision 100/2023. Income from UAE Free Zone entities (arm's-length transactions) qualifies by default. Related-party income requires additional review.",
  },
  {
    q: 'What happens if I exceed the de-minimis threshold?',
    a: 'Exceeding the 5% or AED 5M NQI threshold triggers a 5-year QFZP disqualification. TaxSentry alerts you at 50%, 70%, 80%, and 90% so you can take corrective action.',
  },
  {
    q: 'How do I upload my accounting data?',
    a: 'Go to Revenue → Upload CSV. Download our template, fill in your transactions, and upload. Classification runs automatically within seconds.',
  },
  {
    q: 'Can I change the classification of a transaction?',
    a: 'Yes. Go to Revenue, click any transaction, and select Override Classification. All overrides are logged in the audit trail with your reason.',
  },
  {
    q: 'How do I add team members?',
    a: "Go to Settings → Team → Invite Member. Enter their email and select a role (Finance, Viewer, or Auditor). They'll receive an invitation link.",
  },
];

function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-AE', { day: 'numeric', month: 'short' });
}

function TicketThread({ requestId, onClose }: { requestId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [replyBody, setReplyBody] = useState('');
  const [replyError, setReplyError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: comments, isLoading } = useQuery({
    queryKey: ['support-comments', requestId],
    queryFn: () => api.get(`/support/requests/${requestId}/comments`).then((r) => r.data.data ?? r.data),
    staleTime: 30_000,
  });

  const replyMutation = useMutation({
    mutationFn: () =>
      api.post(`/support/requests/${requestId}/comments`, { body: replyBody }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-comments', requestId] });
      setReplyBody('');
      setReplyError('');
    },
    onError: (err: any) => {
      setReplyError(err?.response?.data?.message ?? 'Failed to send reply. Please try again.');
    },
  });

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    if (comments?.length) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments?.length]);

  return (
    <div
      className="rounded-xl overflow-hidden mt-1"
      style={{
        background: 'var(--ts-bg-elevated)',
        border: '1px solid var(--ts-border)',
      }}
    >
      {/* Thread header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--ts-border-subtle)', background: 'var(--ts-bg-card)' }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={14} color="var(--ts-blue-400)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts-fg-primary)' }}>
            Conversation Thread
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ts-fg-muted)', padding: 4 }}
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Comments */}
      <div className="px-4 py-3 space-y-4 max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="py-4 text-center">
            <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)' }}>Loading conversation…</p>
          </div>
        ) : !comments || comments.length === 0 ? (
          <div className="py-6 text-center">
            <MessageSquare size={24} style={{ color: 'var(--ts-fg-muted)', margin: '0 auto 8px' }} />
            <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>No replies yet</p>
            <p style={{ fontSize: 12, color: 'var(--ts-fg-dimmer)' }}>Our team will respond within 24 hours</p>
          </div>
        ) : (
          (comments as any[]).map((comment: any) => {
            const isAgent = comment.authorRole === 'AGENT' || comment.authorRole === 'ADMIN';
            const initial = (comment.authorName ?? comment.authorEmail ?? 'U').charAt(0).toUpperCase();
            return (
              <div key={comment.id} className={`flex gap-3 ${isAgent ? '' : 'flex-row-reverse'}`}>
                {/* Avatar */}
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0 text-[11px] font-bold"
                  style={{
                    width: 30,
                    height: 30,
                    background: isAgent
                      ? 'oklch(0.55 0.22 260 / 0.15)'
                      : 'oklch(0.70 0.20 155 / 0.15)',
                    color: isAgent ? 'var(--ts-blue-400)' : 'var(--ts-green-500)',
                    border: `1px solid ${isAgent ? 'oklch(0.55 0.22 260 / 0.3)' : 'oklch(0.70 0.20 155 / 0.3)'}`,
                  }}
                >
                  {initial}
                </div>
                {/* Bubble */}
                <div className={`flex-1 max-w-[80%] ${isAgent ? '' : 'flex flex-col items-end'}`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ts-fg-secondary)' }}>
                      {isAgent ? (comment.authorName ?? 'Support Team') : (comment.authorName ?? 'You')}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--ts-fg-muted)' }}>
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <div
                    className="rounded-xl px-3 py-2.5"
                    style={{
                      background: isAgent ? 'var(--ts-bg-card)' : 'oklch(0.55 0.22 260 / 0.1)',
                      border: `1px solid ${isAgent ? 'var(--ts-border)' : 'oklch(0.55 0.22 260 / 0.2)'}`,
                      fontSize: 13,
                      color: 'var(--ts-fg-primary)',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {comment.body}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      <div
        className="px-4 py-3"
        style={{ borderTop: '1px solid var(--ts-border-subtle)', background: 'var(--ts-bg-card)' }}
      >
        {replyError && (
          <p style={{ fontSize: 11, color: 'var(--ts-red-400)', marginBottom: 8 }}>{replyError}</p>
        )}
        <div className="flex gap-2">
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Write a reply…"
            rows={2}
            className="flex-1 rounded-lg px-3 py-2 text-[13px] outline-none resize-none"
            style={{
              background: 'var(--ts-bg-elevated)',
              border: '1px solid var(--ts-border)',
              color: 'var(--ts-fg-primary)',
              fontFamily: 'var(--font-sans)',
            }}
            onFocus={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--ts-blue-500)'; }}
            onBlur={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--ts-border)'; }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && replyBody.trim()) {
                e.preventDefault();
                replyMutation.mutate();
              }
            }}
          />
          <button
            onClick={() => replyMutation.mutate()}
            disabled={!replyBody.trim() || replyMutation.isPending}
            className="flex items-center justify-center rounded-lg flex-shrink-0 disabled:opacity-40"
            style={{
              width: 40,
              background: 'var(--ts-blue-500)',
              border: 'none',
              cursor: 'pointer',
              color: 'white',
            }}
            title="Send reply (Ctrl+Enter)"
          >
            {replyMutation.isPending ? (
              <div
                className="rounded-full border-2 border-white/30 border-t-white animate-spin"
                style={{ width: 14, height: 14 }}
              />
            ) : (
              <Send size={14} />
            )}
          </button>
        </div>
        <p style={{ fontSize: 10, color: 'var(--ts-fg-muted)', marginTop: 4 }}>
          Ctrl+Enter to send
        </p>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState<{ referenceNo: string } | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  const [category, setCategory] = useState<SupportCategory>('TECHNICAL');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [formError, setFormError] = useState('');

  const { data: requests } = useQuery({
    queryKey: ['support-requests'],
    queryFn: () => api.get('/support/requests').then((r) => r.data.data),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      api.post('/support/submit', { category, subject, description, priority }).then((r) => r.data.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['support-requests'] });
      setSubmitted({ referenceNo: data.referenceNo });
      setSubject('');
      setDescription('');
      setCategory('TECHNICAL');
      setPriority('NORMAL');
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? 'Could not submit request. Please try again.');
    },
  });

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--ts-bg-base)' }}>
      <div className="flex-1 w-full max-w-[860px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-2">
            <HelpCircle size={18} color="var(--ts-blue-500)" />
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}>
                Help &amp; Support
              </h1>
              <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0 }}>
                Get help with TaxSentry or submit a support request
              </p>
            </div>
          </div>
          <button
            onClick={() => { setShowForm(true); setSubmitted(null); setFormError(''); }}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold"
            style={{ background: 'var(--ts-blue-500)', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            <Plus size={14} />
            New Request
          </button>
        </div>

        {/* Quick help cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: MessageSquare, label: 'Submit a ticket', sub: 'Get help from our team', action: () => { setShowForm(true); setSubmitted(null); } },
            { icon: Shield, label: 'Compliance docs', sub: 'UAE QFZP guidelines', action: () => {} },
            { icon: Zap, label: 'Feature requests', sub: 'Suggest improvements', action: () => { setCategory('FEATURE_REQUEST'); setShowForm(true); setSubmitted(null); } },
          ].map(({ icon: Icon, label, sub, action }) => (
            <button
              key={label}
              onClick={action}
              className="rounded-xl p-4 text-left transition-all"
              style={{
                background: 'var(--ts-bg-card)',
                border: '1px solid var(--ts-border)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'oklch(0.55 0.22 260 / 0.4)';
                (e.currentTarget as HTMLElement).style.background = 'oklch(0.55 0.22 260 / 0.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--ts-border)';
                (e.currentTarget as HTMLElement).style.background = 'var(--ts-bg-card)';
              }}
            >
              <Icon size={18} style={{ color: 'var(--ts-blue-400)', marginBottom: 8 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>{label}</p>
              <p style={{ fontSize: 11, color: 'var(--ts-fg-muted)', margin: 0 }}>{sub}</p>
            </button>
          ))}
        </div>

        {/* New request form */}
        {showForm && (
          <div
            className="rounded-xl p-6 mb-6"
            style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>
                Submit Support Request
              </h2>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ts-fg-muted)', padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-6">
                <CheckCircle2 size={32} style={{ color: 'var(--ts-green-500)', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ts-fg-primary)', marginBottom: 4 }}>
                  Request Submitted
                </p>
                <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)', marginBottom: 12 }}>
                  Reference: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ts-blue-400)', fontWeight: 600 }}>{submitted.referenceNo}</span>
                </p>
                <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)' }}>
                  Our team will respond within 24 hours.
                </p>
                <button
                  onClick={() => { setSubmitted(null); setShowForm(false); }}
                  className="mt-4 rounded-xl px-5 py-2 text-[13px] font-semibold"
                  style={{ background: 'var(--ts-blue-500)', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Category */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ts-fg-secondary)', display: 'block', marginBottom: 8 }}>
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(CATEGORY_CONFIG) as [SupportCategory, typeof CATEGORY_CONFIG[SupportCategory]][]).map(([key, cfg]) => {
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setCategory(key)}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-all"
                          style={{
                            background: category === key ? `${cfg.color}22` : 'var(--ts-bg-elevated)',
                            border: `1px solid ${category === key ? cfg.color + '66' : 'var(--ts-border)'}`,
                            color: category === key ? cfg.color : 'var(--ts-fg-secondary)',
                            cursor: 'pointer',
                          }}
                        >
                          <Icon size={12} />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ts-fg-secondary)', display: 'block', marginBottom: 8 }}>
                    Priority
                  </label>
                  <div className="flex gap-2">
                    {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => setPriority(key)}
                        className="rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all"
                        style={{
                          background: priority === key ? `${cfg.color}22` : 'var(--ts-bg-elevated)',
                          border: `1px solid ${priority === key ? cfg.color + '66' : 'var(--ts-border)'}`,
                          color: priority === key ? cfg.color : 'var(--ts-fg-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ts-fg-secondary)', display: 'block', marginBottom: 6 }}>
                    Subject <span style={{ color: 'var(--ts-red-400)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
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

                {/* Description */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ts-fg-secondary)', display: 'block', marginBottom: 6 }}>
                    Description <span style={{ color: 'var(--ts-red-400)' }}>*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, or context that would help us assist you faster."
                    rows={5}
                    className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none resize-none"
                    style={{
                      background: 'var(--ts-bg-elevated)',
                      border: '1px solid var(--ts-border)',
                      color: 'var(--ts-fg-primary)',
                      fontFamily: 'var(--font-sans)',
                    }}
                    onFocus={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--ts-blue-500)'; }}
                    onBlur={(e) => { (e.target as HTMLElement).style.borderColor = 'var(--ts-border)'; }}
                  />
                  <p style={{ fontSize: 11, color: 'var(--ts-fg-dimmer)', marginTop: 4 }}>
                    {description.length}/5000
                  </p>
                </div>

                {formError && (
                  <p style={{ fontSize: 12, color: 'var(--ts-red-400)' }}>{formError}</p>
                )}

                <button
                  onClick={() => { setFormError(''); submitMutation.mutate(); }}
                  disabled={!subject.trim() || subject.length < 5 || !description.trim() || description.length < 10 || submitMutation.isPending}
                  className="rounded-xl px-5 py-2.5 text-[13px] font-bold transition-opacity disabled:opacity-50"
                  style={{ background: 'var(--ts-blue-500)', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                  {submitMutation.isPending ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Existing requests */}
        {requests && requests.length > 0 && (
          <div className="mb-6">
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ts-fg-primary)', marginBottom: 12 }}>
              Your Requests
            </h2>
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--ts-border)', background: 'var(--ts-bg-card)' }}
            >
              {(requests as any[]).map((req, idx) => {
                const catCfg = CATEGORY_CONFIG[req.category as SupportCategory] ?? CATEGORY_CONFIG.OTHER;
                const stsCfg = STATUS_CONFIG[req.status as SupportStatus] ?? STATUS_CONFIG.OPEN;
                const CatIcon = catCfg.icon;
                const isExpanded = expandedTicket === req.id;
                return (
                  <div
                    key={req.id}
                    style={{ borderBottom: idx < requests.length - 1 ? '1px solid var(--ts-border-subtle)' : 'none' }}
                  >
                    {/* Ticket row — clickable */}
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                      style={{
                        background: isExpanded ? 'oklch(0.55 0.22 260 / 0.04)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() => setExpandedTicket(isExpanded ? null : req.id)}
                      onMouseEnter={(e) => {
                        if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'var(--ts-bg-elevated)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <div
                        className="flex items-center justify-center rounded-lg flex-shrink-0"
                        style={{ width: 32, height: 32, background: `${catCfg.color}22` }}
                      >
                        <CatIcon size={14} style={{ color: catCfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ts-fg-primary)', margin: 0 }}>
                          {req.subject}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--ts-fg-muted)', margin: 0 }}>
                          {req.referenceNo} · {catCfg.label} · {PRIORITY_CONFIG[req.priority]?.label ?? req.priority}
                        </p>
                      </div>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold flex-shrink-0"
                        style={{ background: stsCfg.bg, color: stsCfg.color }}
                      >
                        {stsCfg.label}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--ts-fg-muted)', flexShrink: 0 }}>
                        {new Date(req.createdAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}
                      </span>
                      <ChevronRight
                        size={14}
                        style={{
                          color: 'var(--ts-fg-muted)',
                          flexShrink: 0,
                          transform: isExpanded ? 'rotate(90deg)' : 'none',
                          transition: 'transform 0.2s',
                        }}
                      />
                    </button>

                    {/* Expanded: description + thread */}
                    {isExpanded && (
                      <div className="px-4 pb-4">
                        {/* Full description */}
                        {req.description && (
                          <div
                            className="rounded-lg px-3 py-3 mb-3"
                            style={{
                              background: 'var(--ts-bg-elevated)',
                              border: '1px solid var(--ts-border-subtle)',
                              fontSize: 13,
                              color: 'var(--ts-fg-secondary)',
                              lineHeight: 1.6,
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--ts-fg-muted)', marginBottom: 6, margin: '0 0 6px' }}>
                              Original Request
                            </p>
                            {req.description}
                          </div>
                        )}
                        <TicketThread
                          requestId={req.id}
                          onClose={() => setExpandedTicket(null)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ts-fg-primary)', marginBottom: 12 }}>
            Frequently Asked Questions
          </h2>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--ts-border)', background: 'var(--ts-bg-card)' }}
          >
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                style={{ borderBottom: idx < FAQS.length - 1 ? '1px solid var(--ts-border-subtle)' : 'none' }}
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="flex items-center justify-between w-full px-4 py-3.5 text-left"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ts-fg-primary)' }}>
                    {faq.q}
                  </span>
                  <ChevronRight
                    size={14}
                    style={{
                      color: 'var(--ts-fg-muted)',
                      flexShrink: 0,
                      marginLeft: 12,
                      transform: expandedFaq === idx ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>
                {expandedFaq === idx && (
                  <div
                    className="px-4 pb-4"
                    style={{ fontSize: 13, color: 'var(--ts-fg-muted)', lineHeight: 1.6 }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact info */}
        <div
          className="mt-6 rounded-xl p-4 flex items-center gap-4"
          style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)' }}
        >
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 40, height: 40, background: 'oklch(0.55 0.22 260 / 0.12)' }}
          >
            <MessageSquare size={18} style={{ color: 'var(--ts-blue-400)' }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>
              Need urgent help?
            </p>
            <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0 }}>
              Email us at{' '}
              <a
                href="mailto:support@gettaxsentry.com"
                style={{ color: 'var(--ts-blue-400)', textDecoration: 'none' }}
              >
                support@gettaxsentry.com
              </a>{' '}
              · We respond within 24 hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
