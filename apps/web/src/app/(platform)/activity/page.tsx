'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import {
  Activity,
  LogIn,
  LogOut,
  Shield,
  User,
  Building2,
  Plus,
  Upload,
  Edit3,
  FileText,
  BarChart3,
  Bell,
  CreditCard,
  XCircle,
  ArrowUp,
  UserPlus,
  HelpCircle,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Filter,
  Download,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  login: LogIn,
  logout: LogOut,
  shield: Shield,
  user: User,
  building: Building2,
  plus: Plus,
  upload: Upload,
  edit: Edit3,
  file: FileText,
  report: BarChart3,
  bell: Bell,
  'credit-card': CreditCard,
  'x-circle': XCircle,
  'arrow-up': ArrowUp,
  'user-plus': UserPlus,
  'help-circle': HelpCircle,
  'refresh-cw': RefreshCw,
  'check-circle': CheckCircle,
  'alert-triangle': AlertTriangle,
  activity: Activity,
  trash: XCircle,
};

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  auth:       { bg: 'oklch(0.55 0.22 260 / 0.12)', color: 'var(--ts-blue-400)' },
  security:   { bg: 'oklch(0.65 0.18 30 / 0.12)',  color: 'var(--ts-red-400)' },
  account:    { bg: 'oklch(0.55 0.22 260 / 0.12)', color: 'var(--ts-blue-400)' },
  revenue:    { bg: 'oklch(0.70 0.20 155 / 0.12)', color: 'var(--ts-green-500)' },
  compliance: { bg: 'oklch(0.75 0.18 85 / 0.12)',  color: 'var(--ts-amber-500)' },
  substance:  { bg: 'oklch(0.70 0.20 155 / 0.12)', color: 'var(--ts-green-500)' },
  reports:    { bg: 'oklch(0.55 0.22 260 / 0.12)', color: 'var(--ts-blue-400)' },
  alerts:     { bg: 'oklch(0.75 0.18 85 / 0.12)',  color: 'var(--ts-amber-500)' },
  billing:    { bg: 'oklch(0.70 0.20 155 / 0.12)', color: 'var(--ts-green-500)' },
  team:       { bg: 'oklch(0.55 0.22 260 / 0.12)', color: 'var(--ts-blue-400)' },
  support:    { bg: 'oklch(0.55 0.22 260 / 0.12)', color: 'var(--ts-blue-400)' },
  system:     { bg: 'oklch(0.50 0 0 / 0.12)',       color: 'var(--ts-fg-muted)' },
};

const ALL_CATEGORIES = ['all', 'auth', 'revenue', 'compliance', 'billing', 'team', 'security', 'support'];

function formatTime(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  if (diff < 7 * 86400_000) return `${Math.floor(diff / 86400_000)}d ago`;
  return d.toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function groupByDate(items: any[]) {
  const groups: Record<string, any[]> = {};
  for (const item of items) {
    const d = new Date(item.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    let key: string;
    if (d.toDateString() === today.toDateString()) key = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday';
    else key = d.toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

export default function ActivityPage() {
  const [category, setCategory] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: () =>
      api.get('/audit-log/activity-feed?limit=100').then((r) => r.data.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const filtered =
    category === 'all' ? data ?? [] : (data ?? []).filter((i: any) => i.category === category);

  const grouped = groupByDate(filtered);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: 'var(--ts-bg-base)' }}
    >
      <div className="flex-1 w-full max-w-[820px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity size={18} color="var(--ts-blue-500)" />
            <div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'var(--ts-fg-primary)',
                  margin: 0,
                }}
              >
                Activity History
              </h1>
              <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0 }}>
                All actions and events for your organisation
              </p>
            </div>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <Filter size={13} style={{ color: 'var(--ts-fg-muted)', flexShrink: 0 }} />
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="rounded-full px-3 py-1 text-[12px] font-medium capitalize transition-all"
              style={{
                background:
                  category === cat
                    ? 'var(--ts-blue-500)'
                    : 'var(--ts-bg-elevated)',
                color: category === cat ? 'white' : 'var(--ts-fg-secondary)',
                border: `1px solid ${category === cat ? 'var(--ts-blue-500)' : 'var(--ts-border)'}`,
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <ActivitySkeleton />
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-16"
            style={{ color: 'var(--ts-fg-muted)', fontSize: 13 }}
          >
            <Activity size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            No activity yet for this category.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <p
                  className="mb-3"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--ts-fg-muted)',
                  }}
                >
                  {date}
                </p>
                <div
                  className="rounded-xl overflow-hidden"
                  style={{
                    border: '1px solid var(--ts-border)',
                    background: 'var(--ts-bg-card)',
                  }}
                >
                  {items.map((item: any, idx: number) => {
                    const IconComp = ICON_MAP[item.icon] ?? Activity;
                    const coloring =
                      CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.system;
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 px-4 py-3"
                        style={{
                          borderBottom:
                            idx < items.length - 1
                              ? '1px solid var(--ts-border-subtle)'
                              : 'none',
                        }}
                      >
                        {/* Icon */}
                        <div
                          className="flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"
                          style={{
                            width: 32,
                            height: 32,
                            background: coloring.bg,
                          }}
                        >
                          <IconComp size={14} style={{ color: coloring.color }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: 'var(--ts-fg-primary)',
                              margin: 0,
                            }}
                          >
                            {item.label}
                          </p>
                          <p
                            style={{
                              fontSize: 11,
                              color: 'var(--ts-fg-muted)',
                              margin: 0,
                              marginTop: 1,
                            }}
                          >
                            {item.actor !== 'System' && item.actor !== 'Dodo Payments'
                              ? `by ${item.actor} · `
                              : ''}
                            {item.actor === 'Dodo Payments' ? 'Dodo Payments · ' : ''}
                            {formatTime(item.timestamp)}
                          </p>
                        </div>

                        {/* Category badge */}
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize flex-shrink-0"
                          style={{
                            background: coloring.bg,
                            color: coloring.color,
                          }}
                        >
                          {item.category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((g) => (
        <div key={g}>
          <div className="h-3 bg-muted rounded w-20 mb-3" />
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--ts-border)' }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < 4 ? '1px solid var(--ts-border-subtle)' : 'none' }}
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-muted rounded w-40" />
                  <div className="h-2.5 bg-muted rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
