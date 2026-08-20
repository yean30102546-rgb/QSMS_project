import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Save, FileText, ExternalLink, PenTool, Trash2, Plus, 
  ChevronDown, AlertCircle, Camera, CheckCircle2, Image as ImageIcon, X,
  Package, Wrench, Edit3, Check, HelpCircle, Tag, FileSpreadsheet, Download, Loader2
} from 'lucide-react';
import { ReworkCase, ReworkItem, updateCase, CUSTOMER_OPTIONS } from '@/src/services/api';
import { useNotification } from '@/src/contexts/NotificationContext';
import { convertDMYToYMD, convertYMDToDMY, enforceNumeric } from '@/src/utils/helpers';
import { AppleProgressBar } from '@/src/components/shared/AppleProgressBar';
import { CopyButton } from '@/src/components/ui/CopyButton';
import { Combobox } from '@/src/components/ui/Combobox';
import { useSaveProgress } from '@/src/hooks/useSaveProgress';
import { useReworkData } from '@/src/contexts/ReworkDataContext';
import { useExportReport } from '@/src/hooks/useExportReport';
import { ExportTemplate } from '@/src/modules/drawings/components/ExportTemplate';

const LEAK_SUBTYPES = [
  'รั่วซึม', 'รั่วซีลฟอยล์', 'รั่วตามด', 'รั่วรอยลากแกลลอน',
  'รั่วขูดเจาะ', 'รั่วโดนเครื่องจักร', 'รั่วกระแทก', 'รั่วตะเข็บ', 'รั่วบุบแตก', 'รอยมีด',
] as const;

const RESPONSIBLE_SUBDIVISIONS: Record<string, string[]> = {
  SFC: ['PDF', 'WPK', 'WFG', 'อื่นๆ'],
  Supplier: ['SP', 'PJW', 'Polymer', 'ธนกร', 'Fuchs', 'อื่นๆ'],
};

const REASON_OPTIONS = [
  { label: 'รั่ว', value: 'รั่ว' },
  { label: 'เปื้อน', value: 'เปื้อน' },
  { label: 'อื่นๆ', value: 'อื่นๆ' },
];

const getReasonSubtypeOptions = (reason: string) => {
  if (reason === 'รั่ว') return LEAK_SUBTYPES.map(s => ({ label: s.trim(), value: s.trim() }));
  if (reason === 'เปื้อน')
    return ['ขวดเปื้อน', 'กล่องเปื้อน', 'ขวดเปื้อน และ กล่องเปื้อน'].map(s => ({ label: s, value: s }));
  return [];
};

const RESPONSIBLE_OPTIONS = [
  { label: 'SFC', value: 'SFC' },
  { label: 'Supplier', value: 'Supplier' },
  { label: 'Customer', value: 'Customer' },
  { label: 'อื่นๆ', value: 'อื่นๆ' },
];

const getResponsibleSubdivisionOptions = (resp: string) =>
  (RESPONSIBLE_SUBDIVISIONS[resp] || []).map(s => ({ label: s.trim(), value: s.trim() }));

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
      {children}
    </label>
  );
}

function FieldInput({
  value,
  onChange,
  type = 'text',
  placeholder,
  rows,
  className,
}: {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  const base =
    'w-full border border-divider-color bg-system-background px-3 py-2.5 text-sm font-medium text-on-surface rounded-lg focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]/30 transition-all';
  if (rows) {
    return (
      <textarea
        value={value}
        onChange={onChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
        rows={rows}
        placeholder={placeholder}
        className={`${base} resize-none ${className ?? ''}`}
      />
    );
  }
  return (
    <input
      type={type}
      value={value}
      onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
      placeholder={placeholder}
      className={`${base} ${className ?? ''}`}
    />
  );
}

function SectionTitle({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <h4 className="text-[13px] font-semibold text-on-surface mb-4 flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full ${color} shrink-0`} />
      {children}
    </h4>
  );
}

function StatusBadge({ status }: { status: ReworkCase['status'] }) {
  const styles: Record<ReworkCase['status'], string> = {
    Pending: 'bg-slate-100 text-slate-700 border-slate-200',
    'In-Progress': 'bg-sky-100 text-sky-800 border-sky-200',
    Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  const thaiLabels: Record<ReworkCase['status'], string> = {
    Pending: 'รอดำเนินการ (PENDING)',
    'In-Progress': 'กำลังดำเนินการ (IN-PROGRESS)',
    Completed: 'เสร็จสิ้น (COMPLETED)',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider whitespace-nowrap shrink-0 ${styles[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {thaiLabels[status]}
    </span>
  );
}

interface CaseUpdateViewProps {
  caseData: ReworkCase;
  onBack: () => void;
  onSuccess: () => void;
  onDelete?: (caseId: string) => Promise<void>;
  isAdmin: boolean;
  isOperator: boolean;
}

export function CaseUpdateView({
  caseData,
  onBack,
  onSuccess,
  onDelete,
  isAdmin,
  isOperator,
}: CaseUpdateViewProps) {
  const { showToast, showAlert, showConfirm } = useNotification();
  const { progress, isSaving, statusText, isComplete, startSaving, finishSaving, failSaving } = useSaveProgress();
  const { itemMaster } = useReworkData();
  const { exportRef, isExporting, exportProgress, exportExcel } = useExportReport();
  
  const [editedItems, setEditedItems] = useState<ReworkItem[]>([]);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>({});
  const [editingItemIds, setEditingItemIds] = useState<Record<string, boolean>>({});
  const [newOrFiles, setNewOrFiles] = useState<File[]>([]);
  const [newImages, setNewImages] = useState<Record<string, File[]>>({});
  const [caseStatus, setCaseStatus] = useState<ReworkCase['status']>('Pending');

  // Progress & Material Blockers State
  const [missingBoxes, setMissingBoxes] = useState<number>(0);
  const [missingGallons, setMissingGallons] = useState<number>(0);
  const [missingOil, setMissingOil] = useState<number>(0);
  const [resolutionMethod, setResolutionMethod] = useState<string>('');
  const [isObstaclesOpen, setIsObstaclesOpen] = useState<boolean>(false);

  const handleDeleteCaseClick = () => {
    const caseName = caseData.caseName || caseData.id;
    showConfirm(
      `คุณแน่ใจหรือไม่ว่าต้องการลบเคส "${caseName}"? การดำเนินการนี้จะลบเคสและรายการทั้งหมดในเคสนี้ออกจากระบบ และไม่สามารถย้อนกลับได้`,
      async () => {
        if (onDelete) {
          await onDelete(caseData.id);
        }
      }
    );
  };

  useEffect(() => {
    if (caseData) {
      const itemsWithFallback = caseData.items.map(item => ({
        ...item,
        customerName: item.customerName || caseData.customerName || ''
      }));
      setEditedItems(itemsWithFallback);
      setDeletedItemIds([]);
      setNewOrFiles([]);
      setNewImages({});
      setEditingItemIds({});
      setCaseStatus(caseData.status);
      setMissingBoxes(caseData.missingBoxes || 0);
      setMissingGallons(caseData.missingGallons || 0);
      setMissingOil(caseData.missingOil || 0);
      setResolutionMethod(caseData.resolutionMethod || '');
      const hasBlockers = (caseData.missingBoxes || 0) > 0 || (caseData.missingGallons || 0) > 0 || (caseData.missingOil || 0) > 0;
      setIsObstaclesOpen(hasBlockers);
    }
  }, [caseData]);

  // Derived completion stats
  const totalBoxes = editedItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const globalCompleted = editedItems.reduce((acc, item) => acc + (Number(item.completedBoxes) || 0), 0);
  const completionPercentage = totalBoxes > 0 ? Math.round((globalCompleted / totalBoxes) * 100) : 0;

  useEffect(() => {
    let status: ReworkCase['status'] = 'Pending';
    if (globalCompleted >= totalBoxes && totalBoxes > 0) {
      status = 'Completed';
    } else if (globalCompleted > 0) {
      status = 'In-Progress';
    } else if (caseData?.status === 'Completed' && totalBoxes === 0) {
      status = 'Completed';
    }
    setCaseStatus(status);
  }, [globalCompleted, totalBoxes, caseData]);

  const handleGlobalProgressChange = (val: number) => {
    let remaining = Math.max(0, val);
    const newItems = editedItems.map((item) => {
      const amount = Number(item.amount) || 0;
      const completedForThisItem = Math.min(amount, remaining);
      remaining -= completedForThisItem;
      return { ...item, completedBoxes: completedForThisItem };
    });
    setEditedItems(newItems);
  };

  const handleItemProgressChange = (index: number, completedBoxes: number) => {
    const newItems = [...editedItems];
    const amount = Number(newItems[index].amount) || 0;
    const clamped = Math.min(Math.max(0, completedBoxes), amount);
    newItems[index] = { ...newItems[index], completedBoxes: clamped };
    setEditedItems(newItems);
  };

  const handleItemCodeChange = (index: number, val: string) => {
    const newItems = [...editedItems];
    const trimmed = val.trim().toLowerCase();
    let updatedName = newItems[index].itemName || '';
    if (trimmed) {
      const match = itemMaster.find(m => (m.itemCode || '').trim().toLowerCase() === trimmed);
      if (match && match.itemName) {
        updatedName = match.itemName;
      }
    }
    newItems[index] = { ...newItems[index], itemCode: val, itemName: updatedName };
    setEditedItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (editedItems.length <= 1) {
      showAlert('ต้องมีอย่างน้อย 1 รายการในงานนี้', 'warning');
      return;
    }
    showConfirm('คุณต้องการลบรายการย่อยนี้ใช่หรือไม่?', () => {
      const itemToDelete = editedItems[index];
      const idToDelete = itemToDelete.uid || itemToDelete.id;
      if (idToDelete) setDeletedItemIds(prev => [...prev, idToDelete]);
      setEditedItems(editedItems.filter((_, i) => i !== index));
    });
  };

  const handleSave = async (forceDraft: boolean = false) => {
    if (!caseData) return;
    
    // Check validation if not drafting
    if (!forceDraft && (isOperator || isAdmin)) {
      if (editedItems.some(item => (Number(item.amount) || 0) <= 0)) {
        showAlert('จำนวนกล่องต้องมากกว่า 0 (หรือบันทึกเป็นแบบร่างหากข้อมูลยังไม่ครบ)', 'error');
        return;
      }
    }

    startSaving();
    try {
      const updates: any = {};
      
      let targetStatus = caseStatus;
      if (forceDraft) {
        targetStatus = (globalCompleted > 0) ? 'In-Progress' : 'Pending';
      }

      let finalItems = [...editedItems];

      // Format items payload
      const modifiedItems = finalItems.filter(item => {
        const original = caseData.items.find(i => i.id === item.id);
        if (!original) return true;
        
        return (
          String(item.itemName || '') !== String(original.itemName || '') ||
          String(item.amount || '') !== String(original.amount || '') ||
          String(item.completedBoxes || '') !== String(original.completedBoxes || '') ||
          String(item.reason || '') !== String(original.reason || '') ||
          String(item.reasonSubtype || '') !== String(original.reasonSubtype || '') ||
          String(item.responsible || '') !== String(original.responsible || '') ||
          String(item.responsibleSubtype || '') !== String(original.responsibleSubtype || '') ||
          String(item.details || '') !== String(original.details || '') ||
          String(item.batchNo || '') !== String(original.batchNo || '') ||
          String(item.packagingDate || '') !== String(original.packagingDate || '') ||
          String(item.mold || '') !== String(original.mold || '') ||
          String(item.line || '') !== String(original.line || '') ||
          String(item.linkedSourceId || '') !== String(original.linkedSourceId || '') ||
          String(item.itemCode || '') !== String(original.itemCode || '') ||
          String(item.customerName || '') !== String(original.customerName || '') ||
          (item.imageUrls && original.imageUrls && item.imageUrls.length !== original.imageUrls.length) ||
          (newImages[item.id || ''] && newImages[item.id || ''].length > 0)
        );
      });

      updates.items = modifiedItems;
      updates.status = targetStatus;
      updates.missingBoxes = missingBoxes;
      updates.missingGallons = missingGallons;
      updates.missingOil = missingOil;
      updates.resolutionMethod = resolutionMethod;

      if (Object.keys(newImages).length > 0) {
        updates.newImages = newImages;
      }

      if (newOrFiles.length > 0) updates.newOrFiles = newOrFiles;
      if (deletedItemIds.length > 0) updates.deleteItemIds = deletedItemIds;

      await updateCase(caseData.id, updates);
      finishSaving();
      showToast(forceDraft ? 'บันทึกแบบร่างสำเร็จ' : 'บันทึกสำเร็จ', 'success');
      onSuccess();
    } catch (error) {
      console.error('Update failed:', error);
      failSaving();
      showAlert('บันทึกไม่สำเร็จ', 'error');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 z-30 flex flex-col w-full h-full bg-system-background overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-divider-color bg-white/90 backdrop-blur-xl shrink-0 gap-4">
        {/* Left Side: Back button + Title + Case ID + Status Badge */}
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={onBack}
            className="p-2 hover:bg-surface-secondary rounded-full transition-colors text-on-surface-variant shrink-0 cursor-pointer"
            title="ย้อนกลับ"
          >
            <ArrowLeft size={19} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-on-surface flex items-center gap-1.5 whitespace-nowrap">
                <PenTool size={16} className="text-primary shrink-0" />
                <span>จัดการงาน Rework</span>
              </h1>
              <StatusBadge status={caseStatus} />
            </div>
            <div className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1.5 font-mono whitespace-nowrap">
              <span className="font-semibold text-slate-700">{caseData.caseName || caseData.id}</span>
              <CopyButton text={caseData.caseName || caseData.id} size={12} />
            </div>
          </div>
        </div>

        {/* Right Side: Action Buttons Toolbar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Export to Excel Button */}
          <button
            type="button"
            onClick={() => caseData && exportExcel({
              ...caseData,
              status: caseStatus,
              items: editedItems,
              missingBoxes,
              missingGallons,
              missingOil,
              resolutionMethod
            })}
            disabled={isExporting || !caseData}
            title="ส่งออกรายงาน Rework เป็นไฟล์ Excel พร้อมฝังรูปภาพ"
            className="whitespace-nowrap shrink-0 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-full transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            {isExporting ? (
              <>
                <Loader2 size={13} className="animate-spin text-emerald-600" />
                <span>กำลังส่งออก...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet size={13} className="text-emerald-600" />
                <span>ส่งออก Excel</span>
              </>
            )}
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={handleDeleteCaseClick}
              disabled={isSaving}
              className="whitespace-nowrap shrink-0 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-all border border-red-200/80 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 size={13} /> <span>ลบเคสนี้</span>
            </button>
          )}

          {isSaving ? (
            <div className="w-44 shrink-0">
              <AppleProgressBar progress={progress} statusText={statusText} isComplete={isComplete} />
            </div>
          ) : (
            <>
              <button
                onClick={() => handleSave(true)}
                className="whitespace-nowrap shrink-0 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
              >
                <span>บันทึกร่าง (Draft)</span>
              </button>
              <button
                onClick={() => handleSave(false)}
                className="whitespace-nowrap shrink-0 px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-full shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save size={13} /> <span>บันทึกและเสร็จสิ้น</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-surface-bright">
        <div className="w-full space-y-6 pb-20">
          
          {/* SECTION 1: Overall Progress & Quick Completion Tracker */}
          <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-primary" />
                  ความคืบหน้าการทำงานรวม (Overall Progress)
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  ยอดเสร็จสิ้นปัจจุบัน: <span className="font-bold text-primary">{globalCompleted}</span> จากทั้งหมด <span className="font-bold">{totalBoxes}</span> กล่อง ({completionPercentage}%)
                </p>
              </div>

              {/* Quick Global Progress Input */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={totalBoxes}
                  placeholder="ระบุยอดรวมที่เสร็จแล้ว..."
                  className="w-48 border border-divider-color bg-system-background rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                  value={globalCompleted || ''}
                  onChange={(e) => handleGlobalProgressChange(Number(e.target.value) || 0)}
                />
                <button
                  type="button"
                  onClick={() => handleGlobalProgressChange(totalBoxes)}
                  className="bg-primary/10 text-primary hover:bg-primary/20 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                >
                  <CheckCircle2 size={14} />
                  เสร็จทั้งหมด
                </button>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, completionPercentage)}%` }}
              />
            </div>
          </div>

          {/* SECTION 2: Material Shortage Blockers Banner (Collapsible Accordion) */}
          <div className="bg-[#fff9eb] border border-amber-200/80 rounded-2xl overflow-hidden shadow-sm transition-all">
            {/* Accordion Toggle Header */}
            <button
              type="button"
              onClick={() => setIsObstaclesOpen(!isObstaclesOpen)}
              className="w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-amber-100/50 transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center flex-wrap gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-700">
                  <AlertCircle size={17} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-amber-900">
                      รายงานอุปสรรค / วัสดุที่ขาดในกระบวนการ Rework
                    </h4>
                    <span className="text-[11px] text-amber-700/80 font-medium hidden sm:inline">
                      (รายละเอียดเพิ่มเติม / ไม่บังคับ)
                    </span>
                  </div>
                  {/* Summary badge if has data */}
                  {(missingBoxes > 0 || missingGallons > 0 || missingOil > 0) && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-md border border-amber-300">
                        <span>มีบันทึกวัสดุที่ขาด:</span>
                        {missingBoxes > 0 && <span>กล่อง {missingBoxes}</span>}
                        {missingGallons > 0 && <span>แกลลอน {missingGallons}</span>}
                        {missingOil > 0 && <span>น้ำมัน {missingOil} ลิตร</span>}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-amber-800">
                <span className="text-xs font-semibold hidden md:inline">
                  {isObstaclesOpen ? 'ย่อซ่อน' : 'คลิกเพื่อระบุ'}
                </span>
                <motion.div
                  animate={{ rotate: isObstaclesOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={18} className="text-amber-700" />
                </motion.div>
              </div>
            </button>

            {/* Collapsible Content */}
            <AnimatePresence initial={false}>
              {isObstaclesOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-2 border-t border-amber-200/60 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-amber-700 font-medium">
                      <span>กรอกจำนวนวัสดุที่ขาดเพื่อให้ทีมที่เกี่ยวข้องเตรียมความพร้อม</span>
                      <span>(ระบบจะล้างข้อมูลอัตโนมัติเมื่อเคสเสร็จสิ้น 100%)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-amber-800 mb-1">ขาดกล่อง (ใบ)</label>
                        <input
                          type="number"
                          min="0"
                          value={missingBoxes || ''}
                          onChange={(e) => setMissingBoxes(Number(e.target.value) || 0)}
                          className="w-full border border-amber-200 bg-white rounded-lg py-2 px-3 text-sm font-semibold text-amber-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-amber-800 mb-1">ขาดแกลลอน (ใบ)</label>
                        <input
                          type="number"
                          min="0"
                          value={missingGallons || ''}
                          onChange={(e) => setMissingGallons(Number(e.target.value) || 0)}
                          className="w-full border border-amber-200 bg-white rounded-lg py-2 px-3 text-sm font-semibold text-amber-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-amber-800 mb-1">ขาดน้ำมัน (ลิตร/ถัง)</label>
                        <input
                          type="number"
                          min="0"
                          value={missingOil || ''}
                          onChange={(e) => setMissingOil(Number(e.target.value) || 0)}
                          className="w-full border border-amber-200 bg-white rounded-lg py-2 px-3 text-sm font-semibold text-amber-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SECTION 3: Item Workspace & Photo Attachment */}
          <div className="flex items-center justify-between pb-2 border-b border-divider-color text-on-surface">
            <div className="flex items-center gap-2">
              <Package size={20} className="text-primary" />
              <span className="text-base sm:text-lg font-semibold">รายการสินค้า ({editedItems.length})</span>
            </div>
            {editedItems.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const allOpen = editedItems.every((item, idx) => expandedItemIds[item.id || idx.toString()]);
                  const nextState: Record<string, boolean> = {};
                  editedItems.forEach((item, idx) => {
                    nextState[item.id || idx.toString()] = !allOpen;
                  });
                  setExpandedItemIds(nextState);
                }}
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                {editedItems.every((item, idx) => expandedItemIds[item.id || idx.toString()]) ? 'พับข้อมูลทั้งหมด' : 'ขยายข้อมูลทั้งหมด'}
              </button>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {editedItems.map((item, index) => {
                const itemIdStr = item.id || index.toString();
                const isExpanded = !!expandedItemIds[itemIdStr];
                const toggleExpand = () => setExpandedItemIds(prev => ({ ...prev, [itemIdStr]: !prev[itemIdStr] }));
                const amount = Number(item.amount) || 0;
                const completed = Number(item.completedBoxes) || 0;
                const isItemComplete = amount > 0 && completed >= amount;
                const activeImageCount = (item.imageUrls || []).length - deletedItemIds.filter(u => (item.imageUrls || []).includes(u)).length + (newImages[itemIdStr] || []).length;

                return (
                  <motion.div
                    key={itemIdStr}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl overflow-hidden shadow-xs hover:border-divider-color transition-all"
                  >
                    {/* Item Card Header (Always visible & actionable) */}
                    <div className="bg-surface-secondary/40 px-3.5 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 select-none">
                      {/* Clickable Title & Badges */}
                      <div 
                        onClick={toggleExpand}
                        className="flex items-center flex-wrap gap-2 cursor-pointer flex-1 min-w-0 hover:opacity-85 transition-opacity"
                        title={isExpanded ? "คลิกเพื่อย่อซ่อน" : "คลิกเพื่อดูรายละเอียด"}
                      >
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown size={18} className="text-on-surface-variant shrink-0" />
                        </motion.div>
                        <span className={`w-2.5 h-2.5 rounded-full ${isItemComplete ? 'bg-emerald-500' : completed > 0 ? 'bg-sky-500' : 'bg-slate-300'} shrink-0`} />
                        <span className="font-bold text-xs sm:text-sm text-on-surface flex items-center gap-1.5 truncate">
                          <span>รายการที่ {index + 1}: {item.itemName || 'ยังไม่ระบุชื่อสินค้า'}</span>
                          {item.itemCode && <span className="text-on-surface-variant font-medium text-xs">({item.itemCode})</span>}
                        </span>
                        <span className="text-xs text-on-surface-variant font-medium shrink-0">({completed} / {amount} กล่อง)</span>
                        {activeImageCount === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-xs shrink-0">
                            <AlertCircle size={12} className="text-amber-600 shrink-0" />
                            <span>ยังไม่แนบรูป</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                            <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                            <span>แนบรูปแล้ว ({activeImageCount})</span>
                          </span>
                        )}
                        {(() => {
                          const qirMatch = (item.details || '').match(/\[QIR:\s*([^\]]+)\]/);
                          const qirVal = qirMatch ? qirMatch[1] : null;
                          if (!qirVal) return null;
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                              <Tag size={12} className="text-purple-600 shrink-0" />
                              <span>QIR: {qirVal}</span>
                            </span>
                          );
                        })()}
                      </div>

                      {/* Quick Item Completion Button & Edit Toggle */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const nextEditing = !editingItemIds[itemIdStr];
                            setEditingItemIds(prev => ({ ...prev, [itemIdStr]: nextEditing }));
                            if (nextEditing) {
                              setExpandedItemIds(prev => ({ ...prev, [itemIdStr]: true }));
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border shadow-2xs ${
                            editingItemIds[itemIdStr] 
                              ? 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100' 
                              : 'bg-white text-on-surface-variant border-divider-color hover:bg-surface-secondary'
                          }`}
                        >
                          {editingItemIds[itemIdStr] ? (
                            <>
                              <Check size={13} className="text-sky-600" />
                              <span>เสร็จสิ้น</span>
                            </>
                          ) : (
                            <>
                              <Edit3 size={13} className="text-on-surface-variant/80" />
                              <span>แก้ไข</span>
                            </>
                          )}
                        </button>

                        <div className="h-4 w-[1px] bg-divider-color/60 mx-0.5 hidden sm:block" />

                        <label className="text-xs font-semibold text-on-surface-variant">ยอดเสร็จ:</label>
                        <input
                          type="number"
                          min="0"
                          max={amount}
                          value={completed || ''}
                          onChange={(e) => handleItemProgressChange(index, Number(e.target.value) || 0)}
                          className="w-16 sm:w-20 border border-divider-color bg-white rounded-lg py-1 px-1.5 text-xs font-bold focus:outline-none focus:border-primary text-center"
                        />
                        <button
                          type="button"
                          onClick={() => handleItemProgressChange(index, amount)}
                          className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-2.5 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                        >
                          <CheckCircle2 size={12} />
                          เสร็จแล้ว
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Item Body (Default Folded) */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="border-t border-divider-color/60 overflow-hidden"
                        >
                          <div className="p-4 sm:p-5 space-y-6">
                            <div className="flex flex-col xl:flex-row gap-6">
                              
                              {/* Data Inputs / Read-Only View (Left Column) */}
                              <div className="flex-1 space-y-4 min-w-0">
                                {editingItemIds[itemIdStr] ? (
                                  <div className="space-y-4">
                                    {/* Row 1: Item Name & Item Code */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div className="md:col-span-2">
                                        <FieldLabel>ชื่อสินค้า / Item Name</FieldLabel>
                                        <FieldInput
                                          value={item.itemName || ''}
                                          onChange={(e) => {
                                            const n = [...editedItems];
                                            n[index] = { ...n[index], itemName: e.target.value };
                                            setEditedItems(n);
                                          }}
                                          placeholder="ระบุชื่อสินค้า..."
                                        />
                                      </div>
                                      <div>
                                        <FieldLabel>รหัสสินค้า / Item Code</FieldLabel>
                                        <FieldInput
                                          value={item.itemCode || ''}
                                          onChange={(e) => handleItemCodeChange(index, e.target.value)}
                                          placeholder="เช่น 40001355"
                                        />
                                      </div>
                                    </div>

                                    {/* Row 2: Customer Name, Amount & Batch No */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div className="relative z-[40]">
                                        <FieldLabel>ลูกค้า / Customer</FieldLabel>
                                        <Combobox
                                          options={CUSTOMER_OPTIONS.map(c => ({ label: c, value: c }))}
                                          value={item.customerName || ''}
                                          onChange={(val) => {
                                            const n = [...editedItems];
                                            n[index] = { ...n[index], customerName: val };
                                            setEditedItems(n);
                                          }}
                                          placeholder="เลือกลูกค้า..."
                                        />
                                      </div>
                                      <div>
                                        <FieldLabel>จำนวนทั้งหมด (ลัง/กล่อง)</FieldLabel>
                                        <FieldInput
                                          type="number"
                                          value={item.amount || ''}
                                          onChange={(e) => {
                                            const n = [...editedItems];
                                            n[index] = { ...n[index], amount: Number(e.target.value) };
                                            setEditedItems(n);
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <FieldLabel>Batch No.</FieldLabel>
                                        <FieldInput
                                          value={item.batchNo || ''}
                                          onChange={(e) => {
                                            const n = [...editedItems];
                                            n[index] = { ...n[index], batchNo: e.target.value };
                                            setEditedItems(n);
                                          }}
                                        />
                                      </div>
                                    </div>

                                    {/* Row 3: Mold & Line */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <FieldLabel>Mold</FieldLabel>
                                        <FieldInput
                                          value={item.mold || ''}
                                          onChange={(e) => {
                                            const n = [...editedItems];
                                            n[index] = { ...n[index], mold: e.target.value };
                                            setEditedItems(n);
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <FieldLabel>Line</FieldLabel>
                                        <FieldInput
                                          value={item.line || ''}
                                          onChange={(e) => {
                                            const n = [...editedItems];
                                            n[index] = { ...n[index], line: e.target.value };
                                            setEditedItems(n);
                                          }}
                                        />
                                      </div>
                                    </div>
                                    
                                    <div>
                                       <FieldLabel>อาการเสีย / รายละเอียดการวิเคราะห์</FieldLabel>
                                       <FieldInput
                                          value={item.details || ''}
                                          onChange={(e) => {
                                            const n = [...editedItems];
                                            n[index] = { ...n[index], details: e.target.value };
                                            setEditedItems(n);
                                          }}
                                          rows={2}
                                       />
                                    </div>
                                  </div>
                                ) : (
                                  /* Read-Only Summary Mode */
                                  <div className="bg-surface/50 border border-divider-color/50 rounded-xl p-4 space-y-3.5 shadow-2xs">
                                    <div>
                                      <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">ชื่อสินค้า / Item Name</span>
                                      <p className="text-sm sm:text-base font-bold text-on-surface bg-white px-3.5 py-2 rounded-lg border border-divider-color/40 shadow-3xs">
                                        {item.itemName || 'ยังไม่ระบุชื่อสินค้า'}
                                      </p>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                      <div className="bg-white p-2.5 rounded-lg border border-divider-color/40 shadow-3xs">
                                        <span className="text-[10px] font-bold text-on-surface-variant uppercase block">รหัสสินค้า / Code</span>
                                        <span className="text-xs font-bold text-primary mt-0.5 block">{item.itemCode || '-'}</span>
                                      </div>
                                      <div className="bg-white p-2.5 rounded-lg border border-divider-color/40 shadow-3xs">
                                        <span className="text-[10px] font-bold text-on-surface-variant uppercase block">ลูกค้า / Customer</span>
                                        <span className="text-xs font-bold text-on-surface mt-0.5 block">{item.customerName || '-'}</span>
                                      </div>
                                      <div className="bg-white p-2.5 rounded-lg border border-divider-color/40 shadow-3xs">
                                        <span className="text-[10px] font-bold text-on-surface-variant uppercase block">จำนวนทั้งหมด</span>
                                        <span className="text-xs font-bold text-on-surface mt-0.5 block">{item.amount || 0} ลัง/กล่อง</span>
                                      </div>
                                      <div className="bg-white p-2.5 rounded-lg border border-divider-color/40 shadow-3xs">
                                        <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Batch No.</span>
                                        <span className={`text-xs font-semibold mt-0.5 block ${item.batchNo ? 'text-on-surface' : 'text-on-surface-variant italic'}`}>{item.batchNo || 'ไม่ได้ระบุ'}</span>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="bg-white p-2.5 rounded-lg border border-divider-color/40 shadow-3xs">
                                        <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Mold</span>
                                        <span className={`text-xs font-semibold mt-0.5 block ${item.mold ? 'text-on-surface' : 'text-on-surface-variant italic'}`}>{item.mold || 'ไม่ได้ระบุ'}</span>
                                      </div>
                                      <div className="bg-white p-2.5 rounded-lg border border-divider-color/40 shadow-3xs">
                                        <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Line</span>
                                        <span className={`text-xs font-semibold mt-0.5 block ${item.line ? 'text-on-surface' : 'text-on-surface-variant italic'}`}>{item.line || 'ไม่ได้ระบุ'}</span>
                                      </div>
                                    </div>

                                    <div className="bg-white p-3 rounded-lg border border-divider-color/40 shadow-3xs">
                                      <span className="text-[10px] font-bold text-on-surface-variant uppercase block mb-1">อาการเสีย / รายละเอียดการวิเคราะห์</span>
                                      <p className={`text-xs font-medium leading-relaxed ${item.details ? 'text-on-surface' : 'text-on-surface-variant italic'}`}>
                                        {item.details || 'ยังไม่มีการระบุรายละเอียดอาการเสีย'}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Photo Uploader Workspace (Right Column) */}
                              <div className="xl:w-[320px] shrink-0 bg-surface-secondary/40 rounded-xl p-4 border border-divider-color/60">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                                    <Camera size={14} /> 
                                    รูปภาพหลักฐานหลังวิเคราะห์
                                  </p>
                                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                    {activeImageCount} รูป
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2">
                                  {/* Existing Images */}
                                  {(item.imageUrls || []).map((url, i) => {
                                    const isDeleted = deletedItemIds.includes(url);
                                    return (
                                      <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-white shadow-sm border border-divider-color/50">
                                        <img src={url} alt="item" className={`w-full h-full object-cover ${isDeleted ? 'opacity-30 grayscale' : ''}`} />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (isDeleted) setDeletedItemIds(prev => prev.filter(u => u !== url));
                                            else setDeletedItemIds(prev => [...prev, url]);
                                          }}
                                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          {isDeleted ? <Plus size={20} className="text-white" /> : <Trash2 size={20} className="text-white" />}
                                        </button>
                                        {isDeleted && <div className="absolute inset-0 border-2 border-error rounded-lg" />}
                                      </div>
                                    );
                                  })}

                                  {/* New Images */}
                                  {(newImages[itemIdStr] || []).map((file, i) => (
                                    <div key={`new-${i}`} className="relative group aspect-square rounded-lg overflow-hidden bg-blue-50 border-2 border-primary/40">
                                      <img src={URL.createObjectURL(file)} alt="new" className="w-full h-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const imgs = { ...newImages };
                                          imgs[itemIdStr] = imgs[itemIdStr].filter((_, idx) => idx !== i);
                                          setNewImages(imgs);
                                        }}
                                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X size={20} className="text-white" />
                                      </button>
                                      <div className="absolute top-1 right-1 bg-primary text-white text-[9px] px-1 rounded-sm font-bold">NEW</div>
                                    </div>
                                  ))}

                                  {/* Upload Button */}
                                  <label className="aspect-square rounded-lg border-2 border-dashed border-primary/50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-primary/5 transition-colors text-primary bg-primary/5">
                                    <Plus size={24} />
                                    <span className="text-[10px] font-semibold">เพิ่มรูป</span>
                                    <input
                                      type="file"
                                      multiple
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        if (files.length > 0) {
                                          setNewImages(prev => ({
                                            ...prev,
                                            [itemIdStr]: [...(prev[itemIdStr] || []), ...files],
                                          }));
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>

                            </div>

                            {/* Section: Reason & Responsible */}
                            <div className="p-4 rounded-xl border border-divider-color bg-surface-secondary/20">
                              <SectionTitle color="bg-[#ff9500]">สาเหตุและผู้รับผิดชอบ</SectionTitle>
                              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                <div className="space-y-1.5 relative z-[60]">
                                  <FieldLabel>สาเหตุหลัก</FieldLabel>
                                  <Combobox
                                    options={REASON_OPTIONS}
                                    value={item.reason || ''}
                                    onChange={(val) => {
                                      const n = [...editedItems];
                                      n[index] = { ...n[index], reason: val, reasonSubtype: '' };
                                      setEditedItems(n);
                                    }}
                                    placeholder="เลือกสาเหตุ..."
                                  />
                                </div>
                                <div className="space-y-1.5 relative z-[55]">
                                  <FieldLabel>ประเภทย่อย</FieldLabel>
                                  <Combobox
                                    options={getReasonSubtypeOptions(item.reason || '')}
                                    value={item.reasonSubtype || ''}
                                    onChange={(val) => {
                                      const n = [...editedItems];
                                      n[index] = { ...n[index], reasonSubtype: val };
                                      setEditedItems(n);
                                    }}
                                    placeholder="เลือกประเภทย่อย..."
                                    disabled={!item.reason || item.reason === 'อื่นๆ'}
                                  />
                                </div>
                                <div className="space-y-1.5 relative z-[50]">
                                  <FieldLabel>ผู้รับผิดชอบ</FieldLabel>
                                  <Combobox
                                    options={RESPONSIBLE_OPTIONS}
                                    value={item.responsible || ''}
                                    onChange={(val) => {
                                      const n = [...editedItems];
                                      n[index] = { ...n[index], responsible: val, responsibleSubtype: '' };
                                      setEditedItems(n);
                                    }}
                                    placeholder="เลือกผู้รับผิดชอบ..."
                                  />
                                </div>
                                <div className="space-y-1.5 relative z-[45]">
                                  <FieldLabel>แผนก</FieldLabel>
                                  <Combobox
                                    options={getResponsibleSubdivisionOptions(item.responsible || '')}
                                    value={item.responsibleSubtype || ''}
                                    onChange={(val) => {
                                      const n = [...editedItems];
                                      n[index] = { ...n[index], responsibleSubtype: val };
                                      setEditedItems(n);
                                    }}
                                    placeholder="เลือกแผนก..."
                                    disabled={!item.responsible || item.responsible === 'Customer' || item.responsible === 'อื่นๆ'}
                                  />
                                </div>
                              </div>

                              {(item.reason || '').includes('เปื้อน') && editedItems.some((i, iidx) => iidx !== index && (i.reason || '').includes('รั่ว')) && (
                                <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50/80 space-y-3">
                                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                                    <HelpCircle size={16} className="text-amber-600" />
                                    <span>ระบุความเชื่อมโยง (Cross-Item Link)</span>
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <label className="flex items-center gap-2 text-xs text-amber-800 font-medium cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={!!item.linkedSourceId}
                                        onChange={(e) => {
                                          const n = [...editedItems];
                                          if (!e.target.checked) {
                                            n[index] = { ...n[index], linkedSourceId: '' };
                                          } else {
                                            const leaks = editedItems.filter((i, iidx) => iidx !== index && (i.reason || '').includes('รั่ว'));
                                            n[index] = { ...n[index], linkedSourceId: leaks.length === 1 ? (leaks[0].id || '') : '' };
                                          }
                                          setEditedItems(n);
                                        }}
                                        className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                      />
                                      <span>สาเหตุมาจากไอเทมที่รั่วในเคสนี้</span>
                                    </label>
                                    {item.linkedSourceId !== undefined && item.linkedSourceId !== null && item.linkedSourceId !== '' && (
                                      <select
                                        value={item.linkedSourceId || ''}
                                        onChange={(e) => {
                                          const n = [...editedItems];
                                          n[index] = { ...n[index], linkedSourceId: e.target.value };
                                          setEditedItems(n);
                                        }}
                                        className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm focus:border-amber-500 focus:outline-none"
                                      >
                                        <option value="">-- เลือกรายการไอเทมต้นเหตุ --</option>
                                        {editedItems.filter((i, iidx) => iidx !== index && (i.reason || '').includes('รั่ว')).map(leak => (
                                          <option key={leak.id} value={leak.id}>
                                            {leak.itemNumber || leak.itemCode || 'ไม่ระบุรหัส'} - {leak.itemName || 'ไม่ระบุชื่อ'}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Delete Item button */}
                            <div className="flex justify-end pt-2 border-t border-divider-color/40">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                                title="ลบรายการนี้"
                              >
                                <Trash2 size={14} />
                                <span>ลบรายการนี้</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Export Overlay */}
      <AnimatePresence>
        {isExporting && (
          <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-8">
            <div className="bg-white rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full text-center">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Download size={24} className="text-emerald-600 animate-pulse" />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 mb-1">กำลังเตรียมเอกสาร Excel...</h4>
                <p className="text-sm text-slate-500">{exportProgress}</p>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-full bg-emerald-500"
                />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <ExportTemplate
        ref={exportRef}
        caseData={caseData ? {
          ...caseData,
          status: caseStatus,
          items: editedItems,
          missingBoxes,
          missingGallons,
          missingOil,
          resolutionMethod
        } : null}
      />
    </motion.div>
  );
}
