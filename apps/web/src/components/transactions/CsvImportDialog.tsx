'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';
import { useQueryClient } from '@tanstack/react-query';

interface CsvImportDialogProps {
  onClose: () => void;
  taxPeriodId?: string;
}

export function CsvImportDialog({ onClose, taxPeriodId }: CsvImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: Array<{ row: number; error: string }> } | null>(null);
  const queryClient = useQueryClient();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file || !taxPeriodId) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(`/revenue/transactions/csv-import?taxPeriodId=${taxPeriodId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(response.data);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['deminimis-status'] });
      queryClient.invalidateQueries({ queryKey: ['risk-score'] });
    } catch (err) {
      console.error('File upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-background/50">
          <div>
            <h3 className="text-lg font-bold text-foreground">Import Transactions</h3>
            <p className="text-xs text-muted-foreground">Upload your revenue ledger from Zoho, Xero, or Excel</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6">
          {!result ? (
            <div className="space-y-6">
              {/* Dropzone */}
              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer",
                  isDragActive ? "border-blue-500 bg-blue-50/50" : "border-border hover:border-blue-400 hover:bg-muted/50",
                  file && "border-blue-500/50 bg-blue-50/20"
                )}
              >
                <input {...getInputProps()} />
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                {file ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB · Ready to import</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">
                      {isDragActive ? "Drop the file here" : "Click or drag CSV to upload"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Max file size: 10MB</p>
                  </div>
                )}
              </div>

              {/* Template instructions */}
              <div className="p-4 bg-background border rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <FileText className="w-3.5 h-3.5" /> Required Headers
                </div>
                <div className="flex flex-wrap gap-2">
                  {['date', 'amount_aed', 'counterparty', 'activity_code'].map(h => (
                    <code key={h} className="px-2 py-0.5 bg-muted text-[10px] rounded font-mono border italic">{h}</code>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground italic">
                  Note: Activity codes must match the Cabinet Decision 100/2023 list.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg border font-bold text-sm hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={!file || isUploading}
                  onClick={handleUpload}
                  className="flex-[2] px-4 py-2.5 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {isUploading ? 'Processing...' : 'Start Import'}
                </button>
              </div>
            </div>
          ) : (
            /* Result Screen */
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-emerald-900">Import Complete</h4>
                <p className="text-sm text-emerald-700 mt-1">
                  Successfully imported <span className="font-bold underline">{result.imported}</span> transactions.
                </p>
              </div>

              {result.errors.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-red-50 border-b flex items-center gap-2 text-xs font-bold text-red-700">
                    <AlertCircle className="w-3.5 h-3.5" /> Skip Log ({result.errors.length} rows)
                  </div>
                  <div className="max-h-32 overflow-y-auto p-3 space-y-1 bg-white">
                    {result.errors.slice(0, 20).map((err, i) => (
                      <div key={i} className="text-[11px] text-muted-foreground">
                        Row {err.row}: <span className="text-red-500">{err.error}</span>
                      </div>
                    ))}
                    {result.errors.length > 20 && (
                      <div className="text-[11px] text-muted-foreground italic pt-1">
                        ... and {result.errors.length - 20} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button 
                onClick={onClose}
                className="w-full px-4 py-3 rounded-xl bg-foreground text-card font-bold text-sm hover:bg-foreground/90 transition-all"
              >
                Close and Refresh Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
