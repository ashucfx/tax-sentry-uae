'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Upload, X, CheckCircle2, ArrowRight } from 'lucide-react';

const REQUIRED_FIELDS = [
  { key: 'date', label: 'Transaction Date' },
  { key: 'amount_aed', label: 'Amount (AED)' },
  { key: 'counterparty', label: 'Counterparty Name' },
];

const OPTIONAL_FIELDS = [
  { key: 'activity_code', label: 'Activity Code' },
  { key: 'counterparty_type', label: 'Counterparty Type' },
  { key: 'invoice_no', label: 'Invoice No.' },
  { key: 'description', label: 'Description' },
];

export function CsvImporter({
  taxPeriodId,
  onClose,
}: {
  taxPeriodId: string | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({}); // { "CSV_Header": "taxsentry_key" }
  const [result, setResult] = useState<{ imported: number; errors: any[] } | null>(null);

  const parseHeaders = async (f: File) => {
    const text = await f.slice(0, 4096).text();
    const firstLine = text.split('\n')[0];
    if (firstLine) {
      // Very basic split by comma, handling quotes optionally
      const headers = firstLine.split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());
      setCsvHeaders(headers);
      
      // Auto-mapping heuristics
      const initialMapping: Record<string, string> = {};
      headers.forEach(h => {
        const lower = h.toLowerCase();
        if (lower.includes('date')) initialMapping[h] = 'date';
        else if (lower.includes('amount') || lower.includes('value')) initialMapping[h] = 'amount_aed';
        else if (lower.includes('name') || lower.includes('party') || lower.includes('customer')) initialMapping[h] = 'counterparty';
        else if (lower.includes('desc')) initialMapping[h] = 'description';
        else if (lower.includes('invoice') || lower.includes('ref')) initialMapping[h] = 'invoice_no';
      });
      setMapping(initialMapping);
    }
  };

  const importMutation = useMutation({
    mutationFn: async (f: File) => {
      const form = new FormData();
      form.append('file', f);
      form.append('mapping', JSON.stringify(mapping));
      
      const url = `/revenue/transactions/csv-import${taxPeriodId ? `?taxPeriodId=${taxPeriodId}` : ''}`;
      const res = await api.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data?.data ?? res.data;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['transactions-page'] });
      queryClient.invalidateQueries({ queryKey: ['deminimis-status'] });
      queryClient.invalidateQueries({ queryKey: ['risk-score'] });
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="premium-card w-full max-w-2xl bg-white shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 m-0">
            Import CSV Transactions
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {result ? (
            <div className="text-center py-8">
              <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
              <p className="text-xl font-bold text-gray-900 mb-2">
                {result.imported} transactions imported
              </p>
              {result.errors?.length > 0 && (
                <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-100 text-left max-h-48 overflow-y-auto">
                  <p className="text-sm font-bold text-red-600 mb-3">
                    {result.errors.length} rows skipped:
                  </p>
                  {result.errors.map((e: any, i: number) => (
                    <p key={i} className="text-xs text-gray-600 mb-1">
                      Row {e.row}: {e.error}
                    </p>
                  ))}
                </div>
              )}
              <button
                onClick={onClose}
                className="mt-8 rounded-xl px-8 py-3 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          ) : !file ? (
            <div
              className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer p-12 text-center"
              onClick={() => document.getElementById('csv-input')?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f?.name.endsWith('.csv')) {
                  setFile(f);
                  parseHeaders(f);
                }
              }}
            >
              <Upload size={32} className="mx-auto text-gray-400 mb-4" />
              <p className="text-sm font-bold text-gray-900 mb-2">
                Drop your CSV file here, or click to browse
              </p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Upload exports from Xero, QuickBooks, Zoho, or your bank. We will help you map the columns next.
              </p>
              <input id="csv-input" type="file" accept=".csv" className="hidden"
                onChange={(e) => { 
                  const f = e.target.files?.[0]; 
                  if (f) {
                    setFile(f);
                    parseHeaders(f);
                  }
                }} 
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                  <CheckCircle2 size={16} /> File loaded: {file.name}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Map your columns</h3>
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-500 mb-2 px-2 uppercase tracking-wider">
                  <div>Your CSV Header</div>
                  <div>TaxSentry Field</div>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {csvHeaders.map(header => (
                    <div key={header} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex-1 font-medium text-gray-900 truncate" title={header}>
                        {header}
                      </div>
                      <ArrowRight size={16} className="text-gray-300 flex-shrink-0" />
                      <div className="flex-1">
                        <select
                          className="w-full text-sm rounded-md border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 bg-white"
                          value={mapping[header] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMapping(prev => {
                              const newMap = { ...prev };
                              if (!val) delete newMap[header];
                              else newMap[header] = val;
                              return newMap;
                            });
                          }}
                        >
                          <option value="">-- Ignore Column --</option>
                          <optgroup label="Required">
                            {REQUIRED_FIELDS.map(f => (
                              <option key={f.key} value={f.key}>{f.label} *</option>
                            ))}
                          </optgroup>
                          <optgroup label="Optional">
                            {OPTIONAL_FIELDS.map(f => (
                              <option key={f.key} value={f.key}>{f.label}</option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {!taxPeriodId && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  No active tax period found. Complete onboarding first.
                </div>
              )}

              {importMutation.isError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                  Import failed. Please check your file format and mapping.
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => { setFile(null); setCsvHeaders([]); }}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!taxPeriodId || importMutation.isPending}
                  onClick={() => file && importMutation.mutate(file)}
                  className="flex-[2] rounded-xl py-3 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importMutation.isPending ? 'Importing...' : 'Import Transactions'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
