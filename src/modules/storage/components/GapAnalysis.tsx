import React, { useEffect, useRef, useState } from 'react';
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
  canEdit?: boolean;
}

export function GapAnalysis({ refreshKey, onUploadMaster, canEdit = true }: GapAnalysisProps) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(true);
  const { showToast } = useNotification();

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setIsCompact(entry.contentRect.width < 900);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

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
    const drawingCode = drawing.item_code?.trim();
    const drawingNum = drawing.drawing_number?.trim().toLowerCase();

    // 1. Check if matched by item_code
    if (drawingCode && /^\d+$/.test(drawingCode)) {
      const hasMasterByCode = documents.some(
        master => master.type === 'master' && master.item_code?.trim() === drawingCode
      );
      if (hasMasterByCode) return false;
    }

    // 2. Check if matched by drawing_number fallback
    if (drawingNum) {
      const hasMasterByDocNo = documents.some(
        master => master.type === 'master' && master.drawing_number?.trim().toLowerCase() === drawingNum
      );
      if (hasMasterByDocNo) return false;
    }

    // If it has neither item_code nor drawing_number, it is incomplete data, not a missing master gap
    if (!drawingCode && !drawingNum) return false;

    return true;
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
    return <div className="flex justify-center py-20 text-slate-500">กำลังตรวจสอบเอกสาร...</div>;
  }

  return (
    <div ref={contentRef} className="w-full h-full flex flex-col">
      <div className="shrink-0 mb-4 sm:mb-6 rounded-xl border border-slate-200 bg-white dark:bg-[#1c1c1e] dark:border-white/10 p-3.5 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-3 sm:gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <ShieldAlert className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Drawing ที่ยังไม่มี Master ({gaps.length})</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              รายการด้านล่างยังไม่พบเอกสาร Master ภายในที่จับคู่กับ Drawing ลูกค้า ตรวจสอบรหัสก่อนสร้างและอัปโหลด Master
            </p>
          </div>
        </div>
        
        {gaps.length > 0 && (
          <button
            onClick={handleExportExcel}
            className="w-full sm:w-auto min-h-11 flex-shrink-0 flex items-center justify-center gap-2 rounded-lg bg-[#0066cc] hover:bg-[#0071e3] px-3 py-2 text-xs sm:text-sm font-medium text-white transition-colors active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            <span>ส่งออกรายงาน</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#1c1c1e] rounded-xl shadow-sm border border-slate-200 dark:border-white/10 flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          {/* Mobile Gap Cards (md:hidden) */}
          <div className={`${isCompact ? 'block' : 'hidden'} p-3 space-y-3`}>
            {gaps.length === 0 ? (
              <div className="py-12 text-center">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">เอกสารครบแล้ว</h3>
                <p className="mt-1 text-xs text-slate-500">Drawing ลูกค้าทุกรายการมี Master ที่จับคู่ได้</p>
              </div>
            ) : (
              gaps.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 bg-white dark:bg-[#252528] rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50/10 dark:bg-rose-950/10 space-y-2.5 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                          {doc.drawing_number}
                        </span>
                        <span className="inline-flex items-center rounded bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 font-mono">
                          Rev.{doc.revision}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                        {doc.customer_name}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 shrink-0">
                      <AlertTriangle className="h-3 w-3" />
                      ขาด Master
                    </span>
                  </div>

                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                    {doc.part_name}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/5 text-[11px]">
                    <div className="text-slate-500 dark:text-slate-400">
                      {doc.item_code ? (
                        <span>รหัสสินค้า: <strong className="font-mono text-slate-700 dark:text-slate-200">{doc.item_code}</strong></span>
                      ) : (
                        <span>เลขเอกสาร: <strong className="font-mono text-slate-700 dark:text-slate-200">{doc.drawing_number}</strong></span>
                      )}
                    </div>

                    {canEdit && (
                      <button
                        onClick={() => onUploadMaster({
                          type: 'master',
                          drawing_number: doc.drawing_number,
                          revision: doc.revision,
                          part_name: doc.part_name,
                          customer_name: doc.customer_name,
                          item_code: doc.item_code || ''
                        })}
                        className="min-h-9 px-3 py-1.5 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
                      >
                        <Upload className="h-3 w-3" />
                        <span>สร้าง Master</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (hidden md:table) */}
          <table className={`${isCompact ? 'hidden' : 'table'} w-full text-left text-sm text-slate-600 dark:text-slate-300`}>
            <thead className="bg-slate-50 dark:bg-black/20 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Drawing ลูกค้า</th>
                <th className="px-6 py-4">ชื่อชิ้นส่วน</th>
                <th className="px-6 py-4">รหัสที่ใช้จับคู่</th>
                <th className="px-6 py-4">สถานะ</th>
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
                      <span>จับคู่ด้วยรหัสสินค้า: <strong className="text-slate-900 dark:text-white">{doc.item_code}</strong></span>
                    ) : (
                      <span>จับคู่ด้วยเลข Drawing: <strong className="text-slate-900 dark:text-white">{doc.drawing_number}</strong></span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        ขาด Master
                      </span>
                      {canEdit && (
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
                          สร้าง Master
                        </button>
                      )}
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
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">เอกสารครบแล้ว</h3>
                    <p className="mt-1 text-sm text-slate-500">Drawing ลูกค้าทุกรายการมี Master ที่จับคู่ได้</p>
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
