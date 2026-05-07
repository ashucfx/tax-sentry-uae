'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { TaxSentryLogo } from '@/components/marketing/MarketingNav';
import { ArrowRight, Building2, Calendar, FileText, MapPin } from 'lucide-react';

const FREE_ZONES = [
  'DMCC', 'JAFZA', 'IFZA', 'DIFC', 'ADGM', 'RAKEZ', 'DWC', 'SHAMS', 'MEYDAN', 'OTHER',
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    tradeLicenseNo: '',
    freeZone: 'DMCC',
    taxRegistrationNo: '',
    taxPeriodStart: '',
    taxPeriodEnd: '',
  });

  const setupMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/organizations/me/setup', data).then((r) => r.data),
    onSuccess: () => router.push('/dashboard'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.tradeLicenseNo || !form.taxPeriodStart || !form.taxPeriodEnd) return;
    setupMutation.mutate(form);
  };

  const field = (
    label: string,
    key: keyof typeof form,
    opts?: { type?: string; placeholder?: string; required?: boolean },
  ) => (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ts-fg-secondary)', marginBottom: 6 }}>
        {label} {opts?.required !== false && <span style={{ color: 'var(--ts-red-500)' }}>*</span>}
      </label>
      <input
        type={opts?.type ?? 'text'}
        value={form[key]}
        placeholder={opts?.placeholder ?? ''}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
          background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)',
          color: 'var(--ts-fg-primary)', outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--ts-bg-deepest)', padding: '40px 20px' }}
    >
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <TaxSentryLogo size={40} gradId="ob-sg" filterId="ob-sf" />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ts-fg-primary)', marginTop: 16, marginBottom: 6 }}>
            Set up your organization
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ts-fg-muted)', textAlign: 'center' }}>
            We need a few details to configure your QFZP compliance monitoring.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="premium-card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Company Name */}
          <div className="flex items-center gap-2" style={{ color: 'var(--ts-fg-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <Building2 size={12} /> Company Details
          </div>
          {field('Company Name', 'name', { placeholder: 'Acme Trading DMCC' })}
          {field('Trade License Number', 'tradeLicenseNo', { placeholder: 'DMCC-123456' })}

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ts-fg-secondary)', marginBottom: 6 }}>
              Free Zone <span style={{ color: 'var(--ts-red-500)' }}>*</span>
            </label>
            <select
              value={form.freeZone}
              onChange={(e) => setForm((f) => ({ ...f, freeZone: e.target.value }))}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
                background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)',
                color: 'var(--ts-fg-primary)', outline: 'none',
              }}
            >
              {FREE_ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          {field('Tax Registration Number (TRN)', 'taxRegistrationNo', {
            placeholder: '100-XXXXXXXXX-X (optional)',
            required: false,
          })}

          {/* Tax Period */}
          <div className="flex items-center gap-2" style={{ color: 'var(--ts-fg-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
            <Calendar size={12} /> Tax Period
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('Period Start', 'taxPeriodStart', { type: 'date' })}
            {field('Period End', 'taxPeriodEnd', { type: 'date' })}
          </div>

          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'oklch(0.55 0.22 260 / 0.07)', border: '1px solid oklch(0.55 0.22 260 / 0.15)', fontSize: 12, color: 'var(--ts-fg-muted)', lineHeight: 1.6 }}>
            <FileText size={12} style={{ display: 'inline', marginRight: 6 }} />
            Most UAE QFZP entities use a 1 January – 31 December tax year. Your first period may be shorter if you registered mid-year.
          </div>

          {setupMutation.isError && (
            <p style={{ fontSize: 13, color: 'var(--ts-red-500)', textAlign: 'center' }}>
              Setup failed — please check your details and try again.
            </p>
          )}

          <button
            type="submit"
            disabled={setupMutation.isPending || !form.name || !form.tradeLicenseNo || !form.taxPeriodStart || !form.taxPeriodEnd}
            className="flex items-center justify-center gap-2 rounded-xl font-bold transition-all"
            style={{
              padding: '13px 24px', fontSize: 15, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#fff', border: 'none', cursor: 'pointer', opacity: setupMutation.isPending ? 0.7 : 1,
            }}
          >
            {setupMutation.isPending ? 'Setting up…' : 'Go to Dashboard'}
            {!setupMutation.isPending && <ArrowRight size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
