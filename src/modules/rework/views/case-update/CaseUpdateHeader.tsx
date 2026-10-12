import React from 'react';
import { ArrowLeft, FileSpreadsheet, Trash2, Loader2, Save } from 'lucide-react';
import { ReworkCase, ReworkItem } from '@/src/services/api';
import { CopyButton } from '@/src/components/ui/CopyButton';

export function StatusBadge({ status }: { status: ReworkCase['status'] }) {
  const styles: Record<ReworkCase['status'], string> = {
    'Pending Analysis': 'bg-amber-50 text-amber-800 border-amber-200/80',
    'Awaiting Materials': 'bg-orange-50 text-orange-800 border-orange-200/80',
    Pending: 'bg-slate-100 text-slate-700 border-slate-200',
    'In-Progress': 'bg-sky-50 text-sky-800 border-sky-200/80',
    Blocked: 'bg-rose-50 text-rose-800 border-rose-200/80',
    Completed: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  };

  const thaiLabels: Record<ReworkCase['status'], string> = {
    'Pending Analysis': 'รอวิเคราะห์',
    'Awaiting Materials': 'รอเบิกภาชนะ',
    Pending: 'รอดำเนินการ',
    'In-Progress': 'กำลังซ่อม',
    Blocked: 'ติดปัญหา (Defend)',
    Completed: 'เสร็จสิ้น 100%',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap shrink-0 ${styles[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {thaiLabels[status] || status}
    </span>
  );
}

export interface CaseUpdateHeaderProps {
  caseData: ReworkCase;
  caseStatus: ReworkCase['status'];
  editedItems: ReworkItem[];
  missingBoxes: number;
  missingGallons: number;
  missingOil: number;
  resolutionMethod: string;
  isSaving: boolean;
  isExporting: boolean;
  isAdmin: boolean;
  onBack: () => void;
  onDelete?: () => void;
  handleDeleteCaseClick: () => void;
  handleSave: (isDraft: boolean) => Promise<void>;
  exportExcel: (caseData: ReworkCase & Record<string, unknown>) => Promise<void>;
}

export const CaseUpdateHeader: React.FC<CaseUpdateHeaderProps> = ({
  caseData,
  caseStatus,
  editedItems,
  missingBoxes,
  missingGallons,
  missingOil,
  resolutionMethod,
  isSaving,
  isExporting,
  isAdmin,
  onBack,
  onDelete,
  handleDeleteCaseClick,
  handleSave,
  exportExcel,
}) => {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 bg-white shrink-0 gap-3">
      {/* Left: Back button + Breadcrumb + Case ID + Status Badge */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="กลับหน้าภาพรวมเคส"
          className="min-h-11 flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs border border-slate-200"
          title="กลับหน้าภาพรวมเคส (ESC)"
        >
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">กลับหน้าภาพรวมเคส</span>
          <span className="sm:hidden">กลับ</span>
        </button>

        <div className="hidden sm:block h-6 w-px bg-slate-200" />

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              type="button"
              onClick={onBack}
              className="hidden sm:inline text-xs font-semibold text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
              title="คลิกเพื่อกลับหน้าภาพรวมเคส"
            >
              ภาพรวมเคส (Overall) /
            </button>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 font-mono truncate">
              {caseData.id}
            </h1>
            <StatusBadge status={caseStatus} />
          </div>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 font-mono">
            <span className="font-semibold text-slate-700">{caseData.id}</span>
            <CopyButton text={caseData.id} size={12} />
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 truncate">{caseData.customerName || caseData.source}</span>
          </div>
        </div>
      </div>

      {/* Right: Action Buttons Toolbar */}
      <div className="flex items-center justify-end gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide w-full sm:w-auto">
        <button
          type="button"
          onClick={() =>
            caseData &&
            exportExcel({
              ...caseData,
              status: caseStatus,
              items: editedItems,
              missingBoxes,
              missingGallons,
              missingOil,
              resolutionMethod,
            })
          }
          disabled={isExporting || !caseData}
          title="ส่งออกรายงาน Rework เป็นไฟล์ Excel พร้อมรูปภาพ"
          aria-label="ส่งออกรายงานเป็นไฟล์ Excel"
          className="min-h-11 whitespace-nowrap shrink-0 px-2.5 sm:px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
        >
          {isExporting ? (
            <>
              <Loader2 size={14} className="animate-spin text-emerald-600" />
              <span className="hidden sm:inline">กำลังส่งออก...</span>
              <span className="sm:hidden">...</span>
            </>
          ) : (
            <>
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <span className="hidden sm:inline">ส่งออก Excel</span>
              <span className="sm:hidden">Excel</span>
            </>
          )}
        </button>

        {onDelete && isAdmin && (
          <button
            type="button"
            onClick={handleDeleteCaseClick}
            disabled={isSaving}
            aria-label="ลบเคส Rework"
            className="min-h-11 whitespace-nowrap shrink-0 px-2.5 sm:px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all border border-rose-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">ลบเคส</span>
            <span className="sm:hidden">ลบ</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => handleSave(true)}
          disabled={isSaving}
          aria-label="บันทึกร่าง"
          className="min-h-11 whitespace-nowrap shrink-0 px-2.5 sm:px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-all cursor-pointer disabled:opacity-50"
        >
          <span className="hidden sm:inline">บันทึกร่าง</span>
          <span className="sm:hidden">ร่าง</span>
        </button>
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={isSaving}
          aria-label="บันทึกเสร็จสิ้น"
          className="min-h-11 whitespace-nowrap shrink-0 px-3 sm:px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 sm:gap-2 shadow-xs"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span className="hidden sm:inline">บันทึกเสร็จสิ้น</span>
          <span className="sm:hidden">บันทึก</span>
        </button>
      </div>
    </header>
  );
};
