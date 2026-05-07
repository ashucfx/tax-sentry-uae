'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { TopRibbon } from '@/components/dashboard/TopRibbon';
import { FileText, CheckCircle2, AlertCircle, Clock, Users, Building2, Briefcase } from 'lucide-react';

type RequirementStatus = 'PASS' | 'FAIL' | 'PARTIAL' | 'PENDING';

interface Requirement {
  id: string;
  category: string;
  label: string;
  description: string;
  status: RequirementStatus;
  detail?: string;
}

const STATUS_CONFIG: Record<RequirementStatus, { icon: React.ElementType; color: string; bg: string; border: string; label: string }> = {
  PASS: {
    icon: CheckCircle2,
    color: 'var(--ts-green-500)',
    bg: 'oklch(0.70 0.20 155 / 0.1)',
    border: 'oklch(0.70 0.20 155 / 0.25)',
    label: 'Satisfied',
  },
  PARTIAL: {
    icon: Clock,
    color: 'var(--ts-amber-500)',
    bg: 'oklch(0.80 0.18 85 / 0.1)',
    border: 'oklch(0.80 0.18 85 / 0.25)',
    label: 'Partial',
  },
  FAIL: {
    icon: AlertCircle,
    color: 'var(--ts-red-500)',
    bg: 'oklch(0.62 0.24 25 / 0.1)',
    border: 'oklch(0.62 0.24 25 / 0.25)',
    label: 'Not Met',
  },
  PENDING: {
    icon: Clock,
    color: 'var(--ts-fg-muted)',
    bg: 'var(--ts-bg-elevated)',
    border: 'var(--ts-border)',
    label: 'Pending',
  },
};

function RequirementRow({ req }: { req: Requirement }) {
  const sc = STATUS_CONFIG[req.status];
  const Icon = sc.icon;

  return (
    <div
      className="flex items-start gap-3 rounded-[10px] transition-all"
      style={{ padding: '14px 16px', border: `1px solid ${sc.border}`, background: sc.bg, marginBottom: 8 }}
    >
      <Icon size={16} color={sc.color} style={{ flexShrink: 0, marginTop: 1 }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>
            {req.label}
          </p>
          <span
            className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide"
            style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
          >
            {sc.label}
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0, marginTop: 3, lineHeight: 1.5 }}>
          {req.description}
        </p>
        {req.detail && (
          <p style={{ fontSize: 11, color: sc.color, margin: 0, marginTop: 4 }}>{req.detail}</p>
        )}
      </div>
    </div>
  );
}

const SUBSTANCE_REQUIREMENTS: Requirement[] = [
  {
    id: 'ciga-1',
    category: 'Core Income Generating Activity',
    label: 'Decision-Making in UAE',
    description: 'Key management and commercial decisions must be made by qualified employees in the UAE Free Zone.',
    status: 'PASS',
    detail: '3 board meetings held in UAE this year.',
  },
  {
    id: 'ciga-2',
    category: 'Core Income Generating Activity',
    label: 'Qualified Employees',
    description: 'Adequate number of qualified full-time employees must be present in the free zone.',
    status: 'PASS',
    detail: '8 qualified employees on record.',
  },
  {
    id: 'ciga-3',
    category: 'Core Income Generating Activity',
    label: 'Operating Expenditure',
    description: 'Adequate operating expenditure must be incurred in the free zone.',
    status: 'PARTIAL',
    detail: 'Review Q3 expense records — some operating costs may need re-classification.',
  },
  {
    id: 'premises',
    category: 'Physical Presence',
    label: 'Registered Office / Premises',
    description: 'Active registered office or physical premises in the free zone must be maintained.',
    status: 'PASS',
    detail: 'DMCC office lease active through Dec 2026.',
  },
  {
    id: 'employees-physical',
    category: 'Physical Presence',
    label: 'Physical Employee Presence',
    description: 'Qualified employees must physically perform CIGA in the UAE.',
    status: 'PASS',
  },
  {
    id: 'assets',
    category: 'Asset Test',
    label: 'Sufficient Assets in UAE',
    description: 'Sufficient assets must be present in the UAE free zone for the qualifying activity.',
    status: 'PENDING',
    detail: 'Asset register not yet uploaded. Add documents to continue.',
  },
  {
    id: 'related-party',
    category: 'Related Party Transactions',
    label: 'Arm\'s Length Pricing',
    description: 'Transactions with related parties must be at arm\'s length with proper documentation.',
    status: 'PARTIAL',
    detail: '2 related-party transactions require transfer pricing documentation.',
  },
  {
    id: 'outsourcing',
    category: 'Outsourcing',
    label: 'Outsourcing Oversight',
    description: 'If CIGA is outsourced, the company must monitor and control the outsourced activity.',
    status: 'PASS',
    detail: 'No CIGA outsourcing reported.',
  },
];

export default function SubstancePage() {
  const { data: substanceData } = useQuery({
    queryKey: ['substance-health'],
    queryFn: () => api.get('/substance/health').then((r) => r.data.data).catch(() => null),
  });

  const requirements: Requirement[] = substanceData?.requirements ?? SUBSTANCE_REQUIREMENTS;

  const categories = Array.from(new Set(requirements.map((r) => r.category)));
  const passCount = requirements.filter((r) => r.status === 'PASS').length;
  const failCount = requirements.filter((r) => r.status === 'FAIL').length;
  const partialCount = requirements.filter((r) => r.status === 'PARTIAL').length;
  const score = Math.round((passCount / requirements.length) * 100);

  const overallBand =
    failCount > 0 ? 'FAIL' : partialCount > 0 ? 'PARTIAL' : 'PASS';
  const overallSc = STATUS_CONFIG[overallBand];

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--ts-bg-base)' }}>
      <TopRibbon />

      <div className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div style={{ marginBottom: 8 }}>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={18} color="var(--ts-blue-500)" />
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}>
              Substance Requirements
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)', margin: 0 }}>
            QFZP economic substance checklist. All requirements must be satisfied to maintain 0% tax status.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Overall Score', value: `${score}%`, color: score >= 80 ? 'var(--ts-green-500)' : score >= 60 ? 'var(--ts-amber-500)' : 'var(--ts-red-500)' },
            { label: 'Satisfied', value: String(passCount), color: 'var(--ts-green-500)' },
            { label: 'Partial', value: String(partialCount), color: 'var(--ts-amber-500)' },
            { label: 'Not Met', value: String(failCount), color: failCount > 0 ? 'var(--ts-red-500)' : 'var(--ts-fg-muted)' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="relative overflow-hidden rounded-xl"
              style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)', padding: '16px 20px' }}
            >
              <p style={{ fontSize: 11, color: 'var(--ts-fg-muted)', marginBottom: 6 }}>{label}</p>
              <p className="ts-metric" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Requirements by category */}
        {categories.map((category) => {
          const catReqs = requirements.filter((r) => r.category === category);
          const catIcon =
            category === 'Physical Presence' ? Building2 :
            category === 'Core Income Generating Activity' ? Briefcase :
            Users;
          const CatIcon = catIcon;

          return (
            <div key={category} className="premium-card" style={{ padding: 24 }}>
              <div className="flex items-center gap-2 mb-4">
                <CatIcon size={16} color="var(--ts-blue-500)" />
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ts-fg-primary)', margin: 0 }}>
                  {category}
                </h2>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: 'var(--ts-bg-elevated)', color: 'var(--ts-fg-muted)' }}
                >
                  {catReqs.length} items
                </span>
              </div>
              {catReqs.map((req) => (
                <RequirementRow key={req.id} req={req} />
              ))}
            </div>
          );
        })}

        {/* Legal note */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)', fontSize: 12, color: 'var(--ts-fg-muted)', lineHeight: 1.6 }}
        >
          <strong style={{ color: 'var(--ts-fg-secondary)' }}>Legal Reference:</strong> Economic substance requirements are governed by the UAE Corporate Tax Law (Federal Decree-Law No. 47/2022) and Cabinet Decision No. 100/2023.
          Non-compliance results in loss of QFZP status and 9% corporate tax liability for a minimum of 5 years.
          Consult your tax advisor for entity-specific substance assessments.
        </div>
      </div>
    </div>
  );
}
