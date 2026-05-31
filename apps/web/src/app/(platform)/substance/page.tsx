'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { TopRibbon } from '@/components/dashboard/TopRibbon';
import { FileText, CheckCircle2, AlertCircle, Clock, Users, Building2, Briefcase, Upload, Trash2, Download, X } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type RequirementStatus = 'PASS' | 'FAIL' | 'PARTIAL' | 'PENDING';

interface Requirement {
  id: string;
  category: string;
  label: string;
  description: string;
  status: RequirementStatus;
  detail?: string;
  docType?: string;
  document?: any;
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

function RequirementRow({ 
  req, 
  onUploadClick,
  onDownloadDocument,
  onDeleteDocument
}: { 
  req: Requirement;
  onUploadClick: (docType: string) => void;
  onDownloadDocument: (docId: string) => void;
  onDeleteDocument: (docId: string) => void;
}) {
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
        
        {req.docType && (
          <div className="mt-3 flex items-center gap-3">
            {req.document ? (
              <div className="flex items-center gap-3 rounded-lg px-3 py-2 bg-[var(--ts-bg-base)] border border-[var(--ts-border-subtle)] w-full">
                <FileText size={14} className="text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--ts-fg-primary)] truncate">{req.document.fileName}</p>
                  <p className="text-[10px] text-[var(--ts-fg-muted)]">
                    {(req.document.fileSize / 1024).toFixed(1)} KB • Uploaded {new Date(req.document.uploadedAt).toLocaleDateString()}
                    {req.document.expiresAt && ` • Expires ${new Date(req.document.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onDownloadDocument(req.document.id)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 rounded bg-white border border-gray-200"
                    title="Download"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={() => onDeleteDocument(req.document.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded bg-white border border-gray-200"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => onUploadClick(req.docType!)}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
              >
                <Upload size={12} /> Upload Document
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function UploadDocumentDialog({
  docType,
  onClose,
}: {
  docType: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [expiresAt, setExpiresAt] = useState('');

  const uploadMutation = useMutation({
    mutationFn: async (f: File) => {
      const form = new FormData();
      form.append('file', f);
      const url = `/substance/documents?docType=${docType}${expiresAt ? `&expiresAt=${expiresAt}` : ''}`;
      const res = await api.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['substance-health'] });
      queryClient.invalidateQueries({ queryKey: ['risk-score'] });
      onClose();
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="premium-card w-full max-w-lg" style={{ padding: 32, margin: 20 }}>
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ts-fg-primary)', margin: 0 }}>
            Upload Document
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ts-fg-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div
          className="rounded-xl text-center"
          style={{
            padding: '32px 20px', border: '2px dashed var(--ts-border)', background: 'var(--ts-bg-elevated)',
            cursor: 'pointer', marginBottom: 20,
          }}
          onClick={() => document.getElementById('doc-input')?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) setFile(f);
          }}
        >
          <Upload size={28} color="var(--ts-fg-muted)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ts-fg-primary)', marginBottom: 4 }}>
            {file ? file.name : 'Drop file here or click to browse'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--ts-fg-muted)', margin: 0 }}>
            PDF, JPEG, PNG, Excel, Word (Max 50MB)
          </p>
          <input id="doc-input" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ts-fg-primary)', marginBottom: 8 }}>
            Expiry Date (Optional)
          </label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            style={{ padding: '10px 12px', background: 'var(--ts-bg-elevated)', border: '1px solid var(--ts-border)', color: 'var(--ts-fg-primary)', fontSize: 14 }}
          />
        </div>

        {uploadMutation.isError && (
          <p style={{ fontSize: 12, color: 'var(--ts-red-500)', marginBottom: 12 }}>
            Upload failed. Please try again.
          </p>
        )}

        <button
          disabled={!file || uploadMutation.isPending}
          onClick={() => file && uploadMutation.mutate(file)}
          className="w-full rounded-xl font-bold transition-all"
          style={{
            padding: '12px 24px', fontSize: 14,
            background: !file ? 'var(--ts-bg-elevated)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: !file ? 'var(--ts-fg-muted)' : 'white',
            border: 'none', cursor: !file ? 'not-allowed' : 'pointer',
            opacity: uploadMutation.isPending ? 0.7 : 1,
          }}
        >
          {uploadMutation.isPending ? 'Uploading…' : 'Upload Document'}
        </button>
      </div>
    </div>
  );
}

const SUBSTANCE_REQUIREMENTS: Requirement[] = [
  {
    id: 'ciga-1',
    category: 'Core Income Generating Activity',
    label: 'Board Minutes (UAE Decision-Making)',
    description: 'Key management and commercial decisions must be made by qualified employees in the UAE Free Zone.',
    status: 'PENDING',
    docType: 'BOARD_MINUTES',
  },
  {
    id: 'ciga-2',
    category: 'Core Income Generating Activity',
    label: 'Payroll Register',
    description: 'Adequate number of qualified full-time employees must be present in the free zone.',
    status: 'PENDING',
    docType: 'PAYROLL_REGISTER',
  },
  {
    id: 'ciga-2-1',
    category: 'Core Income Generating Activity',
    label: 'Emirates IDs of Qualified Employees',
    description: 'Evidence of qualified full-time employees.',
    status: 'PENDING',
    docType: 'EMIRATES_IDS',
  },
  {
    id: 'ciga-3',
    category: 'Core Income Generating Activity',
    label: 'OpEx Split Demonstrating UAE Substance',
    description: 'Adequate operating expenditure must be incurred in the free zone.',
    status: 'PENDING',
    docType: 'OPEX_SPLIT',
  },
  {
    id: 'premises',
    category: 'Physical Presence',
    label: 'Office Lease Agreement',
    description: 'Active registered office or physical premises in the free zone must be maintained.',
    status: 'PENDING',
    docType: 'LEASE_AGREEMENT',
  },
  {
    id: 'trade-license',
    category: 'Physical Presence',
    label: 'Trade License',
    description: 'Valid trade license issued by the free zone authority.',
    status: 'PENDING',
    docType: 'TRADE_LICENSE',
  },
  {
    id: 'org-chart',
    category: 'Core Income Generating Activity',
    label: 'Organisation Chart',
    description: 'Demonstrating structure and roles within the free zone.',
    status: 'PENDING',
    docType: 'ORG_CHART',
  },
  {
    id: 'audit',
    category: 'Core Income Generating Activity',
    label: 'Audited Financial Statements',
    description: 'Required to demonstrate compliance and arm\'s length pricing.',
    status: 'PENDING',
    docType: 'AUDITED_FINANCIAL_STATEMENTS',
  },
];

export default function SubstancePage() {
  const queryClient = useQueryClient();
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);

  const { data: substanceData } = useQuery({
    queryKey: ['substance-health'],
    queryFn: () => api.get('/substance/health').then((r) => r.data.data).catch(() => null),
  });
  
  const checklistMap = new Map((substanceData?.checklist ?? []).map((c: any) => [c.docType, c]));

  const requirements: Requirement[] = SUBSTANCE_REQUIREMENTS.map(req => {
    if (req.docType) {
      const cl = checklistMap.get(req.docType) as any;
      if (cl) {
        let mappedStatus: RequirementStatus = 'PENDING';
        if (cl.status === 'ACTIVE') mappedStatus = 'PASS';
        if (cl.status === 'EXPIRING_SOON') mappedStatus = 'PARTIAL';
        if (cl.status === 'EXPIRED') mappedStatus = 'FAIL';
        if (cl.status === 'MISSING') mappedStatus = 'PENDING';
        return { ...req, status: mappedStatus, document: cl.document };
      }
    }
    return req;
  });

  const categories = Array.from(new Set(requirements.map((r) => r.category)));
  const passCount = requirements.filter((r) => r.status === 'PASS').length;
  const failCount = requirements.filter((r) => r.status === 'FAIL').length;
  const partialCount = requirements.filter((r) => r.status === 'PARTIAL').length;
  const score = Math.round((passCount / requirements.length) * 100);

  const overallBand =
    failCount > 0 ? 'FAIL' : partialCount > 0 ? 'PARTIAL' : 'PASS';
  const overallSc = STATUS_CONFIG[overallBand];

  const handleDownload = async (docId: string) => {
    try {
      const res = await api.get(`/substance/documents/${docId}/download`);
      window.open(res.data.url, '_blank');
    } catch (e) {
      alert('Failed to get download link');
    }
  };

  const handleDelete = async (docId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await api.delete(`/substance/documents/${docId}`);
      queryClient.invalidateQueries({ queryKey: ['substance-health'] });
      queryClient.invalidateQueries({ queryKey: ['risk-score'] });
    }
  };

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
                <RequirementRow 
                  key={req.id} 
                  req={req} 
                  onUploadClick={setUploadingDocType}
                  onDownloadDocument={handleDownload}
                  onDeleteDocument={handleDelete}
                />
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

      {uploadingDocType && (
        <UploadDocumentDialog docType={uploadingDocType} onClose={() => setUploadingDocType(null)} />
      )}
    </div>
  );
}
