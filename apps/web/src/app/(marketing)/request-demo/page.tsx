'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Users,
  BarChart3,
  Calendar,
  Building2,
  Mail,
  Phone,
  User,
  Briefcase,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

const FREE_ZONES = [
  'DMCC', 'DIFC', 'JAFZA', 'ADGM', 'RAKEZ', 'DIC', 'DWTC', 'DAFZA',
  'Dubai Science Park', 'Dubai Internet City', 'Abu Dhabi Free Zone', 'Other',
];

const COMPANY_SIZES = [
  '1–10 employees', '11–50 employees', '51–200 employees', '201–1,000 employees', '1,000+ employees',
];

const REVENUE_RANGES = [
  'Under AED 1M', 'AED 1M – 5M', 'AED 5M – 20M', 'AED 20M – 100M', 'AED 100M+',
];

const DEMO_SLOTS = [
  { label: 'This week', sub: 'Mon–Fri, 9am–6pm GST' },
  { label: 'Next week', sub: 'Flexible scheduling' },
  { label: 'In 2 weeks', sub: 'Flexible scheduling' },
  { label: 'Custom date', sub: 'We\'ll reach out to confirm' },
];

const BENEFITS = [
  {
    icon: BarChart3,
    title: 'Live Platform Walkthrough',
    desc: 'See your actual risk exposure modelled in real-time using your company profile.',
    color: '#60a5fa',
  },
  {
    icon: ShieldCheck,
    title: 'QFZP Health Assessment',
    desc: 'Our UAE tax specialist will audit your current de-minimis position on the call.',
    color: '#34d399',
  },
  {
    icon: Users,
    title: 'Tailored to Your Structure',
    desc: 'Whether you\'re single-entity or a group, we demo the exact workflow that fits you.',
    color: '#a78bfa',
  },
  {
    icon: Clock,
    title: '30 Minutes, No Fluff',
    desc: 'Focused, technical demo. No sales pitch. Our clients are CFOs — we respect your time.',
    color: '#fb923c',
  },
];

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  company: string;
  freeZone: string;
  companySize: string;
  revenueRange: string;
  demoSlot: string;
  message: string;
}

function SelectField({
  label, value, onChange, options, placeholder, icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  icon: React.ElementType;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ts-fg-secondary)', marginBottom: 6, letterSpacing: '0.02em' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Icon size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ts-fg-muted)', pointerEvents: 'none' }} />
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '11px 40px 11px 40px',
            borderRadius: 10,
            border: '1px solid var(--ts-border)',
            background: 'var(--ts-bg-muted)',
            color: value ? 'var(--ts-fg-primary)' : 'var(--ts-fg-muted)',
            fontSize: 14,
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            outline: 'none',
          }}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <ChevronDown size={14} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ts-fg-muted)', pointerEvents: 'none' }} />
      </div>
    </div>
  );
}

function InputField({
  label, value, onChange, placeholder, icon: Icon, type = 'text', required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ElementType;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ts-fg-secondary)', marginBottom: 6, letterSpacing: '0.02em' }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <Icon size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ts-fg-muted)', pointerEvents: 'none' }} />
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          style={{
            width: '100%',
            padding: '11px 14px 11px 40px',
            borderRadius: 10,
            border: '1px solid var(--ts-border)',
            background: 'var(--ts-bg-muted)',
            color: 'var(--ts-fg-primary)',
            fontSize: 14,
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--ts-blue-400)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px oklch(0.55 0.22 260 / 0.10)'; }}
          onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--ts-border)'; (e.target as HTMLInputElement).style.boxShadow = 'none'; }}
        />
      </div>
    </div>
  );
}

export default function RequestDemoPage() {
  const [form, setForm] = useState<FormState>({
    firstName: '', lastName: '', email: '', phone: '', jobTitle: '',
    company: '', freeZone: '', companySize: '', revenueRange: '', demoSlot: '', message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof FormState) => (value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.company) {
      setError('Please fill in the required fields.');
      return;
    }
    setError('');
    setSubmitting(true);
    // Simulate API call — replace with your actual endpoint
    await new Promise(r => setTimeout(r, 1800));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div style={{ background: 'var(--ts-bg-base)', color: 'var(--ts-fg-primary)', fontFamily: 'var(--font-sans)', minHeight: '100vh' }}>
      <MarketingNav />

      {/* Hero */}
      <section
        className="ts-section ts-container"
        style={{ paddingTop: 'clamp(100px, 12vw, 140px)' }}
      >
        <div className="text-center" style={{ maxWidth: 720, margin: '0 auto 64px' }}>
          <div
            className="inline-flex items-center gap-2 mb-6"
            style={{ padding: '6px 16px', borderRadius: 9999, background: 'oklch(0.55 0.22 260 / 0.10)', border: '1px solid oklch(0.55 0.22 260 / 0.28)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#93c5fd' }}
          >
            <Calendar size={12} /> Book a Personalised Demo
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.06, marginBottom: 20 }}>
            See TaxSentry built<br />
            <span style={{ background: 'linear-gradient(125deg, #60a5fa 0%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              around your entity
            </span>
          </h1>
          <p style={{ fontSize: 'clamp(14px, 2vw, 17px)', color: 'oklch(0.60 0 0)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
            In 30 minutes, our UAE tax compliance specialist will walk you through a live scenario using your company profile — showing exactly where your QFZP risk sits today.
          </p>
        </div>

        {/* Main layout */}
        <div className="ts-demo-layout" style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Left: Benefits */}
          <div>
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--ts-fg-primary)', marginBottom: 8 }}>
                What you&apos;ll get in the demo
              </h2>
              <p style={{ fontSize: 14, color: 'var(--ts-fg-muted)', lineHeight: 1.6 }}>
                No slides. No generic product tour. A focused walkthrough built for UAE finance leaders.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 48 }}>
              {BENEFITS.map(({ icon: Icon, title, desc, color }) => (
                <div
                  key={title}
                  className="flex gap-4"
                  style={{ padding: '20px 24px', borderRadius: 14, background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)', boxShadow: 'var(--ts-shadow-card)' }}
                >
                  <div
                    style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    <Icon size={20} color={color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ts-fg-primary)', marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 13, color: 'var(--ts-fg-muted)', lineHeight: 1.55 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Social proof panel */}
            <div
              style={{ padding: '24px 28px', borderRadius: 16, background: 'oklch(0.55 0.22 260 / 0.06)', border: '1px solid oklch(0.55 0.22 260 / 0.18)' }}
            >
              <div style={{ fontSize: 14, color: 'oklch(0.75 0 0)', fontStyle: 'italic', lineHeight: 1.65, marginBottom: 16 }}>
                &ldquo;The demo was 28 minutes. By minute 10 our CFO had already found an NQI exposure she didn&apos;t know existed. We signed the same day.&rdquo;
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-full text-white flex-shrink-0" style={{ width: 36, height: 36, background: '#1d4ed8', fontSize: 12, fontWeight: 700 }}>CF</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#93c5fd' }}>CFO, DMCC Technology Group</div>
                  <div style={{ fontSize: 11, color: 'oklch(0.55 0 0)' }}>AED 48M revenue · DMCC Free Zone</div>
                </div>
              </div>
            </div>

            {/* Contact alternatives */}
            <div style={{ marginTop: 32, padding: '20px 24px', borderRadius: 14, background: 'var(--ts-bg-muted)', border: '1px solid var(--ts-border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ts-fg-secondary)', marginBottom: 12 }}>Prefer a different channel?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a
                  href="mailto:hello@taxsentry.com"
                  className="flex items-center gap-3"
                  style={{ fontSize: 13, color: 'var(--ts-fg-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-primary)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ts-fg-secondary)'; }}
                >
                  <Mail size={14} color="var(--ts-blue-400)" />
                  hello@taxsentry.com
                </a>
                <div className="flex items-center gap-3" style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>
                  <Building2 size={14} color="var(--ts-fg-muted)" />
                  For legal enquiries: <a href="mailto:info@theripplenexus.com" style={{ color: 'var(--ts-fg-secondary)', marginLeft: 4 }}>info@theripplenexus.com</a>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div>
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  style={{ padding: 'clamp(32px, 5vw, 56px)', borderRadius: 20, background: 'var(--ts-bg-card)', border: '1px solid oklch(0.70 0.20 155 / 0.30)', textAlign: 'center', boxShadow: '0 8px 40px oklch(0.70 0.20 155 / 0.08)' }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                    style={{ width: 72, height: 72, borderRadius: '50%', background: 'oklch(0.70 0.20 155 / 0.12)', border: '2px solid oklch(0.70 0.20 155 / 0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}
                  >
                    <CheckCircle2 size={36} color="#34d399" />
                  </motion.div>
                  <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 12 }}>
                    You&apos;re booked in! 🎉
                  </h2>
                  <p style={{ fontSize: 15, color: 'oklch(0.62 0 0)', lineHeight: 1.7, marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
                    Our team will email you a calendar invite within 2 hours. We&apos;ll also send you a brief pre-demo questionnaire so we can tailor the session to your entity.
                  </p>
                  <div style={{ padding: '16px 20px', borderRadius: 12, background: 'oklch(0.70 0.20 155 / 0.06)', border: '1px solid oklch(0.70 0.20 155 / 0.18)', fontSize: 13, color: '#34d399', marginBottom: 32 }}>
                    📧 A confirmation has been sent to <strong>{form.email}</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Link
                      href="/demo"
                      className="flex items-center justify-center gap-2 rounded-xl font-bold"
                      style={{ padding: '14px 24px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', textDecoration: 'none', fontSize: 15 }}
                    >
                      Explore the Live Demo <ArrowRight size={15} />
                    </Link>
                    <Link
                      href="/"
                      style={{ fontSize: 13, color: 'oklch(0.58 0 0)', textDecoration: 'none', padding: '8px' }}
                    >
                      Return to home →
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  style={{ padding: 'clamp(24px, 4vw, 40px)', borderRadius: 20, background: 'var(--ts-bg-card)', border: '1px solid var(--ts-border)', boxShadow: '0 4px 32px oklch(0 0 0 / 0.05)' }}
                >
                  <div style={{ marginBottom: 28 }}>
                    <h2 style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.4rem)', fontWeight: 800, color: 'var(--ts-fg-primary)', marginBottom: 6 }}>
                      Request your demo
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--ts-fg-muted)' }}>
                      Takes under 2 minutes. We&apos;ll confirm via email within 2 hours.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Name row */}
                    <div className="ts-form-row">
                      <InputField label="First Name" value={form.firstName} onChange={set('firstName')} placeholder="Ahmed" icon={User} required />
                      <InputField label="Last Name" value={form.lastName} onChange={set('lastName')} placeholder="Al Maktoum" icon={User} />
                    </div>

                    {/* Email & Phone */}
                    <InputField label="Work Email" value={form.email} onChange={set('email')} placeholder="cfo@yourcompany.ae" icon={Mail} type="email" required />
                    <InputField label="Phone Number" value={form.phone} onChange={set('phone')} placeholder="+971 50 123 4567" icon={Phone} type="tel" />

                    {/* Job & Company */}
                    <div className="ts-form-row">
                      <InputField label="Job Title" value={form.jobTitle} onChange={set('jobTitle')} placeholder="CFO" icon={Briefcase} />
                      <InputField label="Company Name" value={form.company} onChange={set('company')} placeholder="Acme FZE" icon={Building2} required />
                    </div>

                    {/* Selects */}
                    <SelectField
                      label="Free Zone"
                      value={form.freeZone}
                      onChange={set('freeZone')}
                      options={FREE_ZONES}
                      placeholder="Select your Free Zone"
                      icon={Building2}
                    />

                    <div className="ts-form-row">
                      <SelectField
                        label="Company Size"
                        value={form.companySize}
                        onChange={set('companySize')}
                        options={COMPANY_SIZES}
                        placeholder="Team size"
                        icon={Users}
                      />
                      <SelectField
                        label="Annual Revenue"
                        value={form.revenueRange}
                        onChange={set('revenueRange')}
                        options={REVENUE_RANGES}
                        placeholder="Revenue range"
                        icon={BarChart3}
                      />
                    </div>

                    {/* Demo slot */}
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ts-fg-secondary)', marginBottom: 10 }}>
                        Preferred Demo Window
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {DEMO_SLOTS.map(slot => (
                          <button
                            key={slot.label}
                            type="button"
                            onClick={() => set('demoSlot')(slot.label)}
                            style={{
                              padding: '12px 14px',
                              borderRadius: 10,
                              border: `1px solid ${form.demoSlot === slot.label ? 'var(--ts-blue-400)' : 'var(--ts-border)'}`,
                              background: form.demoSlot === slot.label ? 'oklch(0.55 0.22 260 / 0.08)' : 'var(--ts-bg-muted)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.15s',
                              fontFamily: 'var(--font-sans)',
                            }}
                          >
                            <div style={{ fontSize: 13, fontWeight: 600, color: form.demoSlot === slot.label ? 'var(--ts-blue-400)' : 'var(--ts-fg-secondary)', marginBottom: 2 }}>
                              {slot.label}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--ts-fg-muted)' }}>{slot.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ts-fg-secondary)', marginBottom: 6 }}>
                        Anything you'd like to share? <span style={{ fontWeight: 400, color: 'var(--ts-fg-muted)' }}>(optional)</span>
                      </label>
                      <textarea
                        value={form.message}
                        onChange={e => set('message')(e.target.value)}
                        placeholder="e.g. We have 3 entities across DMCC and JAFZA. Our biggest concern is related-party transactions with our mainland subsidiary..."
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: 10,
                          border: '1px solid var(--ts-border)',
                          background: 'var(--ts-bg-muted)',
                          color: 'var(--ts-fg-primary)',
                          fontSize: 13,
                          fontFamily: 'var(--font-sans)',
                          resize: 'vertical',
                          outline: 'none',
                          lineHeight: 1.5,
                          boxSizing: 'border-box',
                        }}
                        onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--ts-blue-400)'; }}
                        onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--ts-border)'; }}
                      />
                    </div>

                    {/* Error */}
                    {error && (
                      <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 13, color: '#f87171' }}>
                        {error}
                      </div>
                    )}

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={submitting}
                      whileHover={{ y: submitting ? 0 : -1 }}
                      whileTap={{ y: 0 }}
                      style={{
                        width: '100%',
                        padding: '15px 24px',
                        borderRadius: 12,
                        border: 'none',
                        background: submitting ? 'oklch(0.45 0.12 260)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: submitting ? 'wait' : 'pointer',
                        fontFamily: 'var(--font-sans)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: submitting ? 'none' : '0 4px 20px rgba(37,99,235,0.35)',
                        transition: 'all 0.2s',
                      }}
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Booking your demo…
                        </>
                      ) : (
                        <>
                          Book My Demo <ArrowRight size={16} />
                        </>
                      )}
                    </motion.button>

                    {/* Trust line */}
                    <div
                      style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 16px', paddingTop: 4 }}
                    >
                      {[
                        { icon: ShieldCheck, label: 'No credit card required' },
                        { icon: CheckCircle2, label: 'Reply within 2 hours' },
                        { icon: Clock, label: '30-minute session' },
                      ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--ts-fg-muted)', fontWeight: 600 }}>
                          <Icon size={12} color="#34d399" /> {label}
                        </div>
                      ))}
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Quick stats strip */}
      <section className="ts-section" style={{ background: 'var(--ts-bg-deepest)' }}>
        <div className="ts-container">
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 24, textAlign: 'center' }}
          >
            {[
              { stat: '50+', label: 'CFOs who trust TaxSentry' },
              { stat: '<2h', label: 'Average response time' },
              { stat: '30 min', label: 'Demo duration' },
              { stat: '6+', label: 'UAE Free Zones served' },
            ].map(({ stat, label }) => (
              <div key={stat}>
                <div style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-0.03em', fontFamily: 'JetBrains Mono, monospace', background: 'linear-gradient(125deg, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 8 }}>
                  {stat}
                </div>
                <div style={{ fontSize: 13, color: 'oklch(0.60 0 0)', fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
