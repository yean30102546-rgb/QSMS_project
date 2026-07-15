import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, Upload } from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';

interface DocumentRecord {
  id: string;
  drawing_number: string;
  revision: string;
  part_name: string;
  customer_name: string;
  item_code: string | null;
  type: 'drawing' | 'master';
}

interface GapAnalysisProps {
  refreshKey: number;
  onUploadMaster: (data: Record<string, unknown>) => void;
}

export function GapAnalysis({ refreshKey, onUploadMaster }: GapAnalysisProps) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotification();

  useEffect(() => {
    fetchDocuments();
  }, [refreshKey]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_drawings' }),
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
      } else {
        showToast(data.error || 'Failed to fetch documents', 'error');
      }
    } catch (err) {
      showToast('Network error fetching documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Logic: Find 'drawing' (customer) that has NO corresponding 'master' (internal)
  // We match by item_code if present, otherwise by drawing_number
  const gaps = documents.filter(doc => doc.type === 'drawing').filter(drawing => {
    return !documents.some(master => 
      master.type === 'master' && 
      ((drawing.item_code && master.item_code === drawing.item_code) || 
       (!drawing.item_code && master.drawing_number === drawing.drawing_number))
    );
  });

  if (loading) {
    return <div className="flex justify-center py-20 text-slate-500">Running analysis...</div>;
  }

  return (
    <div className="w-full">
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/20 p-4 flex gap-4">
        <div className="flex-shrink-0 mt-0.5">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Missing Master Documents ({gaps.length})</h3>
          <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-1">
            The following customer drawings do not have a corresponding internal Master file in the system. Please create and upload a Master file to ensure production alignment.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1c1c1e] rounded-xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-black/20 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Customer Drawing</th>
                <th className="px-6 py-4">Part Name</th>
                <th className="px-6 py-4">Expected Link</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {gaps.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {doc.drawing_number} <span className="text-xs text-slate-500 ml-1">Rev.{doc.revision}</span>
                  </td>
                  <td className="px-6 py-4">{doc.part_name}</td>
                  <td className="px-6 py-4">
                    {doc.item_code ? (
                      <span>Match by Item Code: <strong className="text-slate-900 dark:text-white">{doc.item_code}</strong></span>
                    ) : (
                      <span>Match by Drawing No: <strong className="text-slate-900 dark:text-white">{doc.drawing_number}</strong></span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Master Missing
                      </span>
                      <button
                        onClick={() => onUploadMaster({
                          type: 'master',
                          drawing_number: doc.drawing_number,
                          revision: doc.revision,
                          part_name: doc.part_name,
                          customer_name: doc.customer_name,
                          item_code: doc.item_code || ''
                        })}
                        className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 transition-colors"
                      >
                        <Upload className="h-3 w-3" />
                        Upload Master
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {gaps.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-4">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">All Clear!</h3>
                    <p className="mt-1 text-sm text-slate-500">Every customer drawing has a matched master file.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
