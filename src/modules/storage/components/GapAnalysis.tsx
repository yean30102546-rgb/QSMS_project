import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, Upload, Download } from 'lucide-react';
import ExcelJS from 'exceljs';
import { useNotification } from '../../../contexts/NotificationContext';

interface DocumentRecord {
  id: string;
  drawing_number: string;
  revision: string;
  part_name: string;
  customer_name: string;
  item_code: string | null;
  type: 'drawing' | 'master';
  package_details?: { volume?: number; unit?: string; qty?: number; free?: number } | null;
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
        body: JSON.stringify({ action: 'list_drawings', pageSize: 10000 }),
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

  const gaps = documents.filter(doc => doc.type === 'drawing').filter(drawing => {
    const drawingCode = drawing.item_code;
    
    // Only analyze drawings that have a valid numeric item_code
    // (Documents without item_code are considered 'incomplete_code' in DocumentList, not 'missing_master')
    if (!drawingCode || !/^\d+$/.test(drawingCode)) return false;
    
    return !documents.some(master => {
      return master.type === 'master' && master.item_code === drawingCode;
    });
  });

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Gap Analysis');

      worksheet.columns = [
        { header: 'Customer Drawing', key: 'drawing', width: 25 },
        { header: 'Rev', key: 'rev', width: 10 },
        { header: 'Part Name', key: 'part', width: 40 },
        { header: 'Customer Name', key: 'customer', width: 25 },
        { header: 'Expected Match Code', key: 'match', width: 30 },
        { header: 'Status', key: 'status', width: 20 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      gaps.forEach((doc) => {
        const row = worksheet.addRow({
          drawing: doc.drawing_number,
          rev: doc.revision,
          part: doc.part_name,
          customer: doc.customer_name,
          match: doc.item_code ? `Item Code: ${doc.item_code}` : `Drawing No: ${doc.drawing_number}`,
          status: 'Master Missing'
        });
        row.alignment = { vertical: 'middle' };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Gap_Analysis_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      showToast('Exported Gap Analysis Report successfully', 'success');
    } catch (error) {
      console.error('Export Error:', error);
      showToast('Failed to export report', 'error');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20 text-slate-500">Running analysis...</div>;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="shrink-0 mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/20 p-4 flex gap-4 justify-between items-start">
        <div className="flex gap-4">
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
        
        {gaps.length > 0 && (
          <button
            onClick={handleExportExcel}
            className="flex-shrink-0 flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-sm font-medium text-white transition-all shadow-sm active:scale-95"
          >
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#1c1c1e] rounded-xl shadow-sm border border-slate-200 dark:border-white/10 flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto flex-1">
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
