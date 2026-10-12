import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Save, FileText, ExternalLink, PenTool, Trash2, Plus, 
  ChevronDown, AlertCircle, Camera, CheckCircle2, Image as ImageIcon, X,
  Package, Wrench, Edit3, Check, HelpCircle, Tag, FileSpreadsheet, Download, 
  Loader2, Shield, Eye, Clock, ChevronRight, Truck, CheckCheck, AlertTriangle,
  Sparkles, Printer, Award, Send, Layers, ClipboardCheck
} from 'lucide-react';
import { ReworkCase, ReworkItem, updateCase, CUSTOMER_OPTIONS, MaterialRequestItem } from '@/src/services/api';
import { getCurrentUser } from '@/src/services/auth';
import { useNotification } from '@/src/contexts/NotificationContext';
import { convertDMYToYMD, convertYMDToDMY, enforceNumeric } from '@/src/utils/helpers';
import { AppleProgressBar } from '@/src/components/shared/AppleProgressBar';
import { CopyButton } from '@/src/components/ui/CopyButton';
import { Combobox } from '@/src/components/ui/Combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { useSaveProgress } from '@/src/hooks/useSaveProgress';
import { useReworkData } from '@/src/contexts/ReworkDataContext';
import { useExportReport } from '@/src/hooks/useExportReport';
import { ExportTemplate } from '@/src/modules/drawings/components/ExportTemplate';
import { RequisitionSlipModal } from '@/src/modules/rework/components/RequisitionSlipModal';
import { DrawingPreviewDrawer } from '@/src/modules/rework/components/DrawingPreviewDrawer';
import { WorkflowStepperBar, WorkflowStep } from './case-update/WorkflowStepperBar';
import { CaseUpdateHeader } from './case-update/CaseUpdateHeader';
import { Step2AnalysisPanel } from './case-update/Step2AnalysisPanel';
import { Step3IssuingPanel } from './case-update/Step3IssuingPanel';
import { Step4RepairPanel } from './case-update/Step4RepairPanel';
import { MobileTechnicianQuickBar } from './case-update/MobileTechnicianQuickBar';

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

function StatusBadge({ status }: { status: ReworkCase['status'] }) {
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

function StagedImageThumbnail({
  file,
  canDelete,
  onView,
  onDelete,
}: {
  file: File;
  canDelete: boolean;
  onView: (url: string) => void;
  onDelete: () => void;
}) {
  const [previewUrl, setPreviewUrl] = React.useState<string>('');

  React.useEffect(() => {
    if (!file) return;
    let isCancelled = false;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (!isCancelled && typeof reader.result === 'string') {
        setPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    return () => {
      isCancelled = true;
    };
  }, [file]);

  return (
    <div 
      className="relative group w-16 h-16 rounded-xl overflow-hidden border-2 border-dashed border-amber-400 bg-amber-50/50 shadow-2xs cursor-pointer transition-all hover:scale-105"
      onClick={() => {
        if (previewUrl) onView(previewUrl);
      }}
    >
      {previewUrl ? (
        <img src={previewUrl} alt="Staged" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-100">
          <Loader2 size={16} className="animate-spin text-slate-400" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white">
        <Eye size={15} />
      </div>
      {canDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-1 right-1 w-5 h-5 rounded-md bg-black/60 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <span>X</span>
        </button>
      )}
      <div className="absolute bottom-0 inset-x-0 bg-amber-500 text-white text-[8px] font-bold text-center py-0.5">
        ใหม่
      </div>
    </div>
  );
}

export type ItemCompletionStatus = 'complete' | 'partial' | 'pending';

export function calculateItemStatus(
  item: ReworkItem, 
  stagedFilesCount: number = 0, 
  deletedUrls: string[] = []
): { status: ItemCompletionStatus; label: string; missingFields: string[] } {
  const missing: string[] = [];
  const activePhotos = (item.imageUrls || []).filter(u => !deletedUrls.includes(u)).length + stagedFilesCount;
  
  if (!item.itemCode?.trim() && !item.itemNumber?.trim()) missing.push('รหัส/สูตรสินค้า');
  if (!item.amount || Number(item.amount) <= 0) missing.push('จำนวนกล่อง');
  if (!item.reason?.trim()) missing.push('สาเหตุหลัก');
  if (!item.reasonSubtype?.trim()) missing.push('สาเหตุย่อย');
  if (!item.responsible?.trim()) missing.push('ผู้รับผิดชอบหลัก');
  if (!item.responsibleSubtype?.trim()) missing.push('ผู้รับผิดชอบย่อย');
  if (activePhotos === 0) missing.push('รูปภาพหลักฐาน');
  
  if (missing.length === 0) {
    return { status: 'complete', label: 'ข้อมูลสมบูรณ์', missingFields: [] };
  }
  
  const hasSomeProgress = Boolean(
    item.batchNo?.trim() || 
    item.reason?.trim() || 
    item.reasonSubtype?.trim() ||
    item.responsible?.trim() || 
    item.responsibleSubtype?.trim() ||
    activePhotos > 0 ||
    item.details?.trim() ||
    item.gallonDate?.trim() ||
    item.packagingDate?.trim() ||
    item.mold?.trim() ||
    item.line?.trim()
  );
  
  const missingText = missing.join(', ');
  if (hasSomeProgress) {
    return { status: 'partial', label: `ยังไม่ครบ (ขาด: ${missingText})`, missingFields: missing };
  }
  
  return { status: 'pending', label: `รอตรวจสอบ (ขาด: ${missingText})`, missingFields: missing };
}

// WorkflowStep is imported from ./case-update/WorkflowStepperBar

interface CaseUpdateViewProps {
  caseData: ReworkCase;
  onBack: () => void;
  onSuccess?: () => void;
  onSaveSuccess?: () => void;
  onDelete?: (caseId: string) => Promise<void>;
  isAdmin: boolean;
  isOperator: boolean;
}

export function CaseUpdateView({
  caseData,
  onBack,
  onSuccess,
  onSaveSuccess,
  onDelete,
  isAdmin,
  isOperator,
}: CaseUpdateViewProps) {
  const { showToast, showAlert, showConfirm } = useNotification();
  const { progress, isSaving, statusText, isComplete, startSaving, finishSaving, failSaving } = useSaveProgress();
  const { itemMaster } = useReworkData();
  const { exportRef, isExporting, exportProgress, exportExcel } = useExportReport();
  
  // Current User & Role-Based Permissions
  const currentUser = getCurrentUser();
  const userRole = (currentUser?.role || (isAdmin ? 'ADMIN' : (isOperator ? 'PDF' : 'QSMS'))).toUpperCase();
  
  const canEditItems = userRole === 'ADMIN' || userRole === 'QSMS';
  const canEditAnalysis = userRole === 'ADMIN' || userRole === 'QSMS';
  const canEditIssuing = userRole === 'ADMIN' || userRole === 'WPK';
  const canEditRepair = userRole === 'ADMIN' || userRole === 'PDF';

  // Active Workflow Step Tab
  const [activeStep, setActiveStep] = useState<WorkflowStep>('items');

  // Case Data State
  const [editedItems, setEditedItems] = useState<ReworkItem[]>([]);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>({});
  const [newOrFiles, setNewOrFiles] = useState<File[]>([]);
  const [newImages, setNewImages] = useState<Record<string, File[]>>({});
  const [caseStatus, setCaseStatus] = useState<ReworkCase['status']>('Pending');
  const [lightboxData, setLightboxData] = useState<{ url: string; title?: string } | null>(null);
  const [savingItemIndex, setSavingItemIndex] = useState<number | null>(null);

  // Calculate unsaved/staged photos count
  const totalNewPhotos = Object.values(newImages).reduce((acc, files) => acc + files.length, 0);
  const hasUnsavedPhotos = totalNewPhotos > 0 || deletedItemIds.length > 0;

  const getItemStagedCount = (it: ReworkItem, idx: number) => {
    const k = it.id || it.uid || `idx-${idx}`;
    const files = newImages[k] || (it.id ? newImages[it.id] : undefined) || newImages[`idx-${idx}`] || newImages[idx.toString()] || [];
    return files.length;
  };

  const itemsCompletion = useMemo(() => {
    let completed = 0;
    const details = editedItems.map((item, idx) => {
      const stagedCount = getItemStagedCount(item, idx);
      const stat = calculateItemStatus(item, stagedCount, deletedItemIds);
      if (stat.status === 'complete') completed++;
      const itemKey = item.id || item.uid || `idx-${idx}`;
      return { item, index: idx, itemKey, stat };
    });
    const total = editedItems.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 100;
    return { completed, total, percent, details };
  }, [editedItems, newImages, deletedItemIds]);

  // Requisition Slip & Drawing Drawer Modals
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState<boolean>(false);
  const [drawingDrawerQuery, setDrawingDrawerQuery] = useState<{ query: string; title?: string } | null>(null);

  // Step 2 & 3: Material Requests State
  const [materialRequests, setMaterialRequests] = useState<MaterialRequestItem[]>([]);
  const [customMaterialName, setCustomMaterialName] = useState('');
  const [customMaterialQty, setCustomMaterialQty] = useState(1);
  const [customMaterialUnit, setCustomMaterialUnit] = useState('ชิ้น');
  const [isAddingCustomMaterial, setIsAddingCustomMaterial] = useState(false);

  // Step 3: WPK Quick Add Material State
  const [isAddingWPKMaterial, setIsAddingWPKMaterial] = useState(false);
  const [wpkMaterialName, setWpkMaterialName] = useState('');
  const [wpkMaterialQty, setWpkMaterialQty] = useState(1);
  const [wpkMaterialUnit, setWpkMaterialUnit] = useState('กล่อง');

  // Step 2 Analysis
  const [resolutionMethod, setResolutionMethod] = useState<string>('');

  // Step 3 & 4 Progress & Material Blockers State
  const [missingBoxes, setMissingBoxes] = useState<number>(0);
  const [missingGallons, setMissingGallons] = useState<number>(0);
  const [missingOil, setMissingOil] = useState<number>(0);

  // Step 4 PDF Defend Mode State
  const [isDefendBlocked, setIsDefendBlocked] = useState<boolean>(false);
  const [defendCategory, setDefendCategory] = useState<string>('waiting_oil');
  const [defendNotes, setDefendNotes] = useState<string>('');

  // Phase 5: Closed-Loop MES Handshake & QC Sign-off Gate
  const [receivedHandshake, setReceivedHandshake] = useState<{
    receivedBy?: string;
    receivedAt?: string;
    isPartial?: boolean;
    status?: 'complete' | 'partial';
    missingSummary?: string;
    note?: string;
  } | null>((caseData as unknown as { materialReceivedInfo?: { receivedBy?: string; receivedAt?: string; isPartial?: boolean; status?: 'complete' | 'partial'; missingSummary?: string; note?: string } })?.materialReceivedInfo || null);

  const [qcSignoff, setQcSignoff] = useState<{
    approvedBy?: string;
    approvedAt?: string;
    qcNotes?: string;
  } | null>((caseData as unknown as { qcApprovalInfo?: { approvedBy?: string; approvedAt?: string; qcNotes?: string } })?.qcApprovalInfo || null);
  const [qcNotesInput, setQcNotesInput] = useState('');

  // Keyboard shortcut to close Lightbox, Drawers, or Return to Overall
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxData) {
          setLightboxData(null);
        } else if (drawingDrawerQuery) {
          setDrawingDrawerQuery(null);
        } else if (isRequisitionModalOpen) {
          setIsRequisitionModalOpen(false);
        } else if (!isSaving) {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxData, drawingDrawerQuery, isRequisitionModalOpen, isSaving, onBack]);

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

  const currentCaseIdRef = useRef<string | null>(null);

  // Smart Auto-Tab Selection based on Case Status & User Role
  useEffect(() => {
    if (caseData) {
      const isSameCase = currentCaseIdRef.current === caseData.id;
      currentCaseIdRef.current = caseData.id;

      if (!isSameCase || editedItems.length === 0) {
        const itemsWithFallback = caseData.items.map((item, idx) => ({
          ...item,
          itemSequence: item.itemSequence ?? (idx + 1),
          customerName: item.customerName || caseData.customerName || ''
        }));
        setEditedItems(itemsWithFallback);
        setDeletedItemIds([]);
        setNewOrFiles([]);
        setNewImages({});
        
        // Initialize accordion: expand only the first incomplete item
        const initialExpanded: Record<string, boolean> = {};
        let foundFirstIncomplete = false;
        itemsWithFallback.forEach((item, idx) => {
          const itemKey = item.id || (item as unknown as { uid?: string }).uid || `idx-${idx}`;
          const itemStat = calculateItemStatus(item, 0, []);
          if (!foundFirstIncomplete && itemStat.status !== 'complete') {
            initialExpanded[itemKey] = true;
            foundFirstIncomplete = true;
          } else {
            initialExpanded[itemKey] = false;
          }
        });
        setExpandedItemIds(initialExpanded);
      }

      setCaseStatus(caseData.status);
      setMaterialRequests(caseData.materialRequests || []);
      setMissingBoxes(caseData.missingBoxes || 0);
      setMissingGallons(caseData.missingGallons || 0);
      setMissingOil(caseData.missingOil || 0);
      setResolutionMethod(caseData.resolutionMethod || '');
      setIsDefendBlocked(caseData.status === 'Blocked');
      setReceivedHandshake((caseData as unknown as { materialReceivedInfo?: { receivedBy?: string; receivedAt?: string; isPartial?: boolean; status?: 'complete' | 'partial'; missingSummary?: string; note?: string } })?.materialReceivedInfo || null);
      setQcSignoff((caseData as unknown as { qcApprovalInfo?: { approvedBy?: string; approvedAt?: string; qcNotes?: string } })?.qcApprovalInfo || null);

      // Smart default tab based on Case Status Lifecycle
      if (caseData.status === 'Pending Analysis' || caseData.status === 'Pending') {
        setActiveStep('items');
      } else if (caseData.status === 'Awaiting Materials') {
        setActiveStep('issuing');
      } else if (caseData.status === 'In-Progress' || caseData.status === 'Blocked' || caseData.status === 'Completed') {
        setActiveStep('repair');
      } else {
        setActiveStep('items');
      }
    }
  }, [caseData, userRole]);

  // Completion metrics
  const totalBoxes = editedItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const globalCompleted = editedItems.reduce((acc, item) => acc + (Number(item.completedBoxes) || 0), 0);
  const completionPercentage = totalBoxes > 0 ? Math.round((globalCompleted / totalBoxes) * 100) : 0;

  // Derived Shortage & Single Source of Truth from materialRequests
  const derivedShortage = useMemo(() => {
    let boxes = 0;
    let gallons = 0;
    let oil = 0;
    const shortageList: { id: string; name: string; missingQty: number; unit: string; requestedQty: number; issuedQty: number }[] = [];

    materialRequests.forEach(m => {
      const requested = Number(m.requestedQty) || 0;
      const issued = m.status === 'unavailable' ? 0 : (Number(m.issuedQty) || 0);
      const diff = Math.max(0, requested - issued);

      if (m.status === 'unavailable' || diff > 0) {
        const missingAmt = m.status === 'unavailable' ? requested : diff;
        shortageList.push({
          id: m.id,
          name: m.materialName,
          missingQty: missingAmt,
          unit: m.unit,
          requestedQty: requested,
          issuedQty: issued
        });

        const nameLower = (m.materialName || '').toLowerCase();
        const unitLower = (m.unit || '').toLowerCase();
        if (nameLower.includes('กล่อง') || unitLower.includes('กล่อง')) {
          boxes += missingAmt;
        } else if (nameLower.includes('แกลลอน') || unitLower.includes('ใบ') || unitLower.includes('แกลลอน')) {
          gallons += missingAmt;
        } else if (nameLower.includes('น้ำมัน') || unitLower.includes('ลิตร')) {
          oil += missingAmt;
        }
      }
    });

    const isAllFulfilled = materialRequests.length > 0 && shortageList.length === 0 && materialRequests.every(m => m.status === 'fulfilled');
    const hasShortage = shortageList.length > 0;
    const summaryText = shortageList.map(s => `${s.name} (ขาด ${s.missingQty} ${s.unit})`).join(', ');

    return {
      boxes,
      gallons,
      oil,
      shortageList,
      isAllFulfilled,
      hasShortage,
      summaryText
    };
  }, [materialRequests]);

  // Keep missing boxes/gallons/oil synced with derivedShortage in background
  useEffect(() => {
    setMissingBoxes(derivedShortage.boxes);
    setMissingGallons(derivedShortage.gallons);
    setMissingOil(derivedShortage.oil);
  }, [derivedShortage.boxes, derivedShortage.gallons, derivedShortage.oil]);

  // Material helpers
  const handleAddPresetMaterial = (name: string, unit: string) => {
    if (!canEditAnalysis) return;
    const existingIndex = materialRequests.findIndex(m => m.materialName === name);
    if (existingIndex >= 0) {
      const updated = [...materialRequests];
      updated[existingIndex].requestedQty += 1;
      setMaterialRequests(updated);
      showToast(`+ เพิ่มจำนวน "${name}" เป็น ${updated[existingIndex].requestedQty} ${unit} แล้ว`, 'info');
      return;
    }

    const newItem: MaterialRequestItem = {
      id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      materialName: name,
      requestedQty: 1,
      issuedQty: 0,
      unit: unit,
      status: 'pending'
    };
    setMaterialRequests(prev => [...prev, newItem]);
    showToast(`+ เพิ่ม "${name}" ในรายการขอเบิกแล้ว`, 'info');
  };

  const handleCustomMaterialAdd = () => {
    if (!canEditAnalysis) return;
    if (!customMaterialName.trim()) {
      showAlert('กรุณาระบุชื่อภาชนะหรือวัสดุที่ต้องการขอเบิก', 'warning');
      return;
    }
    const newItem: MaterialRequestItem = {
      id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      materialName: customMaterialName.trim(),
      requestedQty: Math.max(1, customMaterialQty),
      issuedQty: 0,
      unit: customMaterialUnit.trim() || 'ชิ้น',
      status: 'pending'
    };
    setMaterialRequests(prev => [...prev, newItem]);
    setCustomMaterialName('');
    setCustomMaterialQty(1);
    setIsAddingCustomMaterial(false);
    showToast(`+ เพิ่ม "${newItem.materialName}" ในรายการขอเบิกแล้ว`, 'info');
  };

  const handleMaterialQtyChange = (id: string, qty: number) => {
    if (!canEditAnalysis) return;
    setMaterialRequests(prev => prev.map(m => m.id === id ? { ...m, requestedQty: Math.max(0, qty) } : m));
  };

  const handleMaterialIssuedQtyChange = (id: string, issuedQty: number) => {
    if (!canEditIssuing) return;
    setMaterialRequests(prev => prev.map(m => {
      if (m.id === id) {
        const clampedIssued = Math.max(0, issuedQty);
        let status: MaterialRequestItem['status'] = 'pending';
        if (clampedIssued >= m.requestedQty && m.requestedQty > 0) {
          status = 'fulfilled';
        } else if (clampedIssued > 0) {
          status = 'partial';
        }
        return { ...m, issuedQty: clampedIssued, status };
      }
      return m;
    }));
  };

  const handleFulfillAllMaterials = () => {
    if (!canEditIssuing) return;
    setMaterialRequests(prev => prev.map(m => ({
      ...m,
      issuedQty: m.requestedQty,
      status: 'fulfilled'
    })));
    showToast('ปรับยอดเบิกจ่ายครบตามจำนวนที่ขอแล้วทุกรายการ', 'success');
  };

  const handleRemoveMaterial = (id: string) => {
    if (!canEditAnalysis) return;
    setMaterialRequests(prev => prev.filter(m => m.id !== id));
  };

  const handleMaterialSetFulfilled = (id: string) => {
    if (!canEditIssuing) return;
    setMaterialRequests(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, issuedQty: m.requestedQty, status: 'fulfilled' };
      }
      return m;
    }));
  };

  const handleMaterialSetUnavailable = (id: string) => {
    if (!canEditIssuing) return;
    setMaterialRequests(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, issuedQty: 0, status: 'unavailable' };
      }
      return m;
    }));
    showToast('ระบุสถานะเป็น "ของขาด" เรียบร้อย', 'info');
  };

  const handleRemoveMaterialWPK = (id: string) => {
    if (!canEditIssuing) return;
    setMaterialRequests(prev => prev.filter(m => m.id !== id));
    showToast('ลบรายการเบิกจ่ายเรียบร้อย', 'info');
  };

  const handleWPKAddCustomMaterial = () => {
    if (!canEditIssuing) return;
    if (!wpkMaterialName.trim()) {
      showAlert('กรุณาระบุชื่อภาชนะหรือวัสดุ', 'warning');
      return;
    }
    const newItem: MaterialRequestItem = {
      id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      materialName: wpkMaterialName.trim(),
      requestedQty: Math.max(1, wpkMaterialQty),
      issuedQty: Math.max(1, wpkMaterialQty),
      unit: wpkMaterialUnit.trim() || 'ชิ้น',
      status: 'fulfilled'
    };
    setMaterialRequests(prev => [...prev, newItem]);
    setWpkMaterialName('');
    setWpkMaterialQty(1);
    setIsAddingWPKMaterial(false);
    showToast(`+ เพิ่ม "${newItem.materialName}" ในรายการเบิกจ่ายแล้ว`, 'info');
  };

  // Step 2 Handover: QSMS Completed Analysis ➔ Awaiting Materials
  const handleQSMSHandover = async () => {
    startSaving();
    try {
      const updates: Partial<ReworkCase> & Record<string, unknown> = {
        status: 'Awaiting Materials',
        resolutionMethod,
        materialRequests,
        items: editedItems,
      };
      if (Object.keys(newImages).length > 0) updates.newImages = newImages;
      if (newOrFiles.length > 0) updates.newOrFiles = newOrFiles;
      if (deletedItemIds.length > 0) updates.deleteItemIds = deletedItemIds;

      const res = await updateCase(caseData.id, updates as Partial<ReworkCase>);
      if (res.success) {
        if (updates.items) setEditedItems(updates.items as ReworkItem[]);
        setNewImages({});
        setDeletedItemIds([]);
        setNewOrFiles([]);
      }

      setCaseStatus('Awaiting Materials');
      finishSaving();
      showToast('บันทึกผลวิเคราะห์สำเร็จ: เปลี่ยนสถานะเป็น "รอเบิกภาชนะ" ส่งต่อให้ WPK แล้ว', 'success');
      setActiveStep('issuing');
      onSaveSuccess?.();
    } catch (error) {
      failSaving();
      showAlert('บันทึกไม่สำเร็จ', 'error');
    }
  };

  // Step 3 Handover: WPK Completed Issuing ➔ In-Progress
  const handleWPKHandover = async () => {
    startSaving();
    try {
      const updates: Partial<ReworkCase> & Record<string, unknown> = {
        status: 'In-Progress',
        materialRequests,
        missingBoxes,
        missingGallons,
        missingOil,
        items: editedItems,
      };
      const res = await updateCase(caseData.id, updates as Partial<ReworkCase>);
      if (res.success) {
        if (updates.items) setEditedItems(updates.items as ReworkItem[]);
        setNewImages({});
        setDeletedItemIds([]);
        setNewOrFiles([]);
      }

      setCaseStatus('In-Progress');
      finishSaving();
      showToast(
        derivedShortage.hasShortage
          ? 'บันทึกการเบิกจ่าย (มีของขาด): ส่งงานให้ PDF ซ่อมต่อแล้ว'
          : 'บันทึกการเบิกจ่ายสำเร็จ: เปลี่ยนสถานะเป็น "กำลังซ่อม" ส่งงานให้ PDF แล้ว',
        derivedShortage.hasShortage ? 'warning' : 'success'
      );
      setActiveStep('repair');
      onSaveSuccess?.();
    } catch (error) {
      failSaving();
      showAlert('บันทึกไม่สำเร็จ', 'error');
    }
  };

  // Step 3 Handshake: PDF / Operator Confirm Material Receipt (Full vs Partial)
  const handleConfirmMaterialReceipt = async (isPartial: boolean = false) => {
    startSaving();
    try {
      const receiptInfo = {
        receivedBy: currentUser?.name || 'PDF Technician',
        receivedAt: new Date().toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        isPartial,
        status: (isPartial ? 'partial' : 'complete') as 'complete' | 'partial',
        missingSummary: isPartial ? derivedShortage.summaryText : undefined
      };
      const updates: Record<string, unknown> = {
        materialReceivedInfo: receiptInfo
      };
      await updateCase(caseData.id, updates as Partial<ReworkCase>);
      setReceivedHandshake(receiptInfo);
      finishSaving();
      if (isPartial) {
        showToast('บันทึกการรับมอบบางส่วน (เริ่มซ่อมเท่าที่มี) เรียบร้อยแล้ว', 'warning');
      } else if (receivedHandshake?.isPartial) {
        showToast('ตรวจรับชิ้นส่วนส่วนที่เหลือครบชุด 100% เรียบร้อยแล้ว', 'success');
      } else {
        showToast('ยืนยันตรวจนับและรับมอบชิ้นส่วนครบชุดหน้างานเรียบร้อยแล้ว', 'success');
      }
      onSaveSuccess?.();
    } catch (err) {
      failSaving();
      showAlert('ไม่สามารถบันทึกการรับมอบได้', 'error');
    }
  };

  const handleReportShortageBlockage = async () => {
    startSaving();
    try {
      const defaultReason = derivedShortage.boxes > 0 || derivedShortage.gallons > 0 ? 'waiting_container' : 'waiting_oil';
      const missingDesc = derivedShortage.summaryText ? `วัสดุขาดจากการเบิกจ่าย: ${derivedShortage.summaryText}` : 'วัสดุขาด ไม่สามารถเริ่มงานซ่อมได้';
      setDefendCategory(defaultReason);
      setDefendNotes(missingDesc);
      setIsDefendBlocked(true);

      const receiptInfo = {
        receivedBy: currentUser?.name || 'PDF Technician',
        receivedAt: new Date().toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        isPartial: true,
        status: 'partial' as const,
        missingSummary: derivedShortage.summaryText
      };
      setReceivedHandshake(receiptInfo);

      const updates: Partial<ReworkCase> & Record<string, unknown> = {
        status: 'Blocked',
        materialReceivedInfo: receiptInfo,
        items: editedItems,
        missingBoxes: derivedShortage.boxes,
        missingGallons: derivedShortage.gallons,
        missingOil: derivedShortage.oil,
        materialRequests,
        blockedInfo: {
          isBlocked: true,
          reasonCategory: defaultReason,
          reasonDetail: missingDesc,
          blockedAt: new Date().toISOString(),
          reportedBy: currentUser?.name || 'PDF Technician',
          reportedByRole: userRole
        }
      };

      await updateCase(caseData.id, updates as Partial<ReworkCase>);
      setCaseStatus('Blocked');
      finishSaving();
      showToast('บันทึกสถานะติดปัญหา (Defend Mode): วัสดุไม่พอซ่อม เรียบร้อยแล้ว', 'warning');
      setActiveStep('repair');
      onSaveSuccess?.();
    } catch (err) {
      failSaving();
      showAlert('ไม่สามารถบันทึกสถานะติดปัญหาได้', 'error');
    }
  };

  // Step 4 Completion / Defend Action
  const handlePDFSave = async (isClosure: boolean = false, isBlocked: boolean = false) => {
    startSaving();
    try {
      let targetStatus: ReworkCase['status'] = caseStatus;
      if (isClosure || (globalCompleted >= totalBoxes && totalBoxes > 0)) {
        targetStatus = 'Completed';
      } else if (isBlocked) {
        targetStatus = 'Blocked';
      } else if (globalCompleted > 0) {
        targetStatus = 'In-Progress';
      }

      const updates: Partial<ReworkCase> & Record<string, unknown> = {
        status: targetStatus,
        items: editedItems,
        missingBoxes,
        missingGallons,
        missingOil,
        resolutionMethod,
        materialRequests,
        blockedInfo: isBlocked ? {
          isBlocked: true,
          reasonCategory: defendCategory,
          reasonDetail: defendNotes,
          blockedAt: new Date().toISOString(),
          reportedBy: currentUser?.name || 'PDF Technician',
          reportedByRole: userRole
        } : undefined
      };

      const res = await updateCase(caseData.id, updates as Partial<ReworkCase>);
      if (res.success) {
        if (updates.items) setEditedItems(updates.items as ReworkItem[]);
        setNewImages({});
        setDeletedItemIds([]);
        setNewOrFiles([]);
      }

      setCaseStatus(targetStatus);
      finishSaving();
      showToast(isClosure ? 'ปิดเคส Rework เสร็จสมบูรณ์ 100% เรียบร้อยแล้ว' : isBlocked ? 'บันทึกสถานะติดปัญหา (Defend Mode) แล้ว' : 'บันทึกความคืบหน้าสำเร็จ', 'success');
      
      if (isClosure) {
        onSuccess?.();
      } else {
        onSaveSuccess?.();
      }
    } catch (error) {
      failSaving();
      showAlert('บันทึกไม่สำเร็จ', 'error');
    }
  };

  // Step 4 QC Sign-off Gate (QSMS / Admin only)
  const handleQCSignoff = async () => {
    startSaving();
    try {
      const signoffInfo = {
        approvedBy: currentUser?.name || (userRole === 'ADMIN' ? 'QSMS Administrator' : 'QSMS Inspector'),
        approvedAt: new Date().toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        qcNotes: qcNotesInput.trim() || 'ตรวจรับงาน Rework ผ่านเกณฑ์คุณภาพมาตรฐาน 100%'
      };
      const updates: Partial<ReworkCase> & Record<string, unknown> = {
        status: 'Completed',
        qcApprovalInfo: signoffInfo,
        items: editedItems,
      };
      await updateCase(caseData.id, updates as Partial<ReworkCase>);
      setQcSignoff(signoffInfo);
      setCaseStatus('Completed');
      finishSaving();
      showToast('ตรวจรับงานผ่านเกณฑ์ QC และลงนามปิดเคสสมบูรณ์ 100% เรียบร้อยแล้ว', 'success');
      onSuccess?.();
    } catch (err) {
      failSaving();
      showAlert('เกิดข้อผิดพลาดในการลงนามตรวจรับ QC', 'error');
    }
  };

  // General Save
  const handleSave = async (forceDraft: boolean = false) => {
    if (!caseData) return;
    startSaving();
    try {
      let itemsToSave = [...editedItems];
      const currentlyExpandedIndex = editedItems.findIndex(item => {
        const k = item.id || (item as unknown as { uid?: string }).uid;
        return k ? expandedItemIds[k] : false;
      });

      if (currentlyExpandedIndex >= 0 && currentlyExpandedIndex < editedItems.length - 1) {
        const targetItem = itemsToSave[currentlyExpandedIndex];
        const remainingItems = itemsToSave.filter((_, i) => i !== currentlyExpandedIndex);
        itemsToSave = [...remainingItems, {
          ...targetItem,
          itemSequence: targetItem.itemSequence ?? (currentlyExpandedIndex + 1),
          amount: Math.max(1, Number(targetItem.amount) || 1)
        }];
      }

      const determinedStatus = forceDraft
        ? (caseData.status === 'Pending Analysis' || caseData.status === 'Awaiting Materials'
            ? caseData.status
            : (globalCompleted > 0 ? 'In-Progress' : (caseData.status || 'Pending Analysis')))
        : (caseStatus || caseData.status || 'Pending Analysis');

      const updates: Parameters<typeof updateCase>[1] = {
        status: determinedStatus,
        items: itemsToSave,
        materialRequests,
        missingBoxes,
        missingGallons,
        missingOil,
        resolutionMethod,
      };

      if (Object.keys(newImages).length > 0) updates.newImages = newImages;
      if (newOrFiles.length > 0) updates.newOrFiles = newOrFiles;
      if (deletedItemIds.length > 0) updates.deleteItemIds = deletedItemIds;

      const res = await updateCase(caseData.id, updates);
      if (res.success) {
        let finalItems: ReworkItem[] = itemsToSave;
        if ((res.data as ReworkCase)?.items) {
          const dbItems = (res.data as ReworkCase).items;
          finalItems = itemsToSave.map(localItem => {
            const matched = dbItems.find(dbItem => (dbItem.id && dbItem.id === localItem.id) || (dbItem.uid && dbItem.uid === localItem.uid));
            if (matched) {
              return {
                ...localItem,
                ...matched,
                itemSequence: localItem.itemSequence
              };
            }
            return localItem;
          });
        }
        setEditedItems(finalItems);
        setNewImages({});
        setDeletedItemIds([]);
        setNewOrFiles([]);

        // Auto-expand next incomplete item
        const nextIncompleteIdx = finalItems.findIndex((it: ReworkItem) => calculateItemStatus(it, 0, []).status !== 'complete');
        const targetExpandIdx = nextIncompleteIdx >= 0 ? nextIncompleteIdx : 0;
        const nextExpandedMap: Record<string, boolean> = {};
        finalItems.forEach((it: ReworkItem, i: number) => {
          const k = it.id || it.uid || `idx-${i}`;
          nextExpandedMap[k] = (i === targetExpandIdx);
        });
        setExpandedItemIds(nextExpandedMap);
      }

      finishSaving();
      showToast(forceDraft ? 'บันทึกรูปภาพและข้อมูลสำเร็จ' : 'บันทึกสำเร็จ', 'success');
      onSaveSuccess?.();
    } catch (error) {
      failSaving();
      showAlert('บันทึกไม่สำเร็จ', 'error');
    }
  };

  const handleGlobalProgressChange = (val: number) => {
    if (!canEditRepair) return;
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
    if (!canEditRepair) return;
    const newItems = [...editedItems];
    const amount = Number(newItems[index].amount) || 0;
    const clamped = Math.min(Math.max(0, completedBoxes), amount);
    newItems[index] = { ...newItems[index], completedBoxes: clamped };
    setEditedItems(newItems);
  };

  const handleItemCodeChange = (index: number, val: string) => {
    if (!canEditItems) return;
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
    if (!canEditItems) return;
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

  const handleSaveSingleItem = async (index: number) => {
    if (!canEditItems || savingItemIndex !== null) return;
    const targetItem = editedItems[index];
    if (!targetItem) return;

    const itemKey = targetItem.id || targetItem.uid || `idx-${index}`;
    const stagedFiles = newImages[itemKey] || 
                        (targetItem.id ? newImages[targetItem.id] : undefined) || 
                        newImages[`idx-${index}`] || 
                        newImages[index.toString()] || [];

    const itemDeletedUrls = deletedItemIds.filter(url => (targetItem.imageUrls || []).includes(url));

    try {
      setSavingItemIndex(index);
      startSaving();

      // 1. Keep order fixed in-place (Do not move item to bottom)
      const updatedTargetItem: ReworkItem = {
        ...targetItem,
        itemSequence: targetItem.itemSequence ?? (index + 1),
        amount: Math.max(1, Number(targetItem.amount) || 1)
      };
      const updatedItems = editedItems.map((it, i) => (i === index ? updatedTargetItem : it));

      // 2. Prepare payload for updateCase
      const updates: Partial<ReworkCase> & Record<string, unknown> = {
        items: updatedItems,
        materialRequests,
        missingBoxes,
        missingGallons,
        missingOil,
        resolutionMethod,
      };

      if (stagedFiles.length > 0) {
        updates.newImages = { [itemKey]: stagedFiles };
      }
      if (itemDeletedUrls.length > 0) {
        updates.deleteItemIds = itemDeletedUrls;
      }

      const res = await updateCase(caseData.id, updates);
      let finalItems: ReworkItem[] = updatedItems;
      if (res.success && (res.data as ReworkCase)?.items) {
        const dbItems = (res.data as ReworkCase).items;
        finalItems = updatedItems.map(localItem => {
          const matched = dbItems.find(dbItem => (dbItem.id && dbItem.id === localItem.id) || (dbItem.uid && dbItem.uid === localItem.uid));
          if (matched) {
            return {
              ...localItem,
              ...matched,
              itemSequence: localItem.itemSequence
            };
          }
          return localItem;
        });
      }
      setEditedItems(finalItems);

      // Clean up staged files and deleted URLs for this saved item
      setNewImages(prev => {
        const next = { ...prev };
        delete next[itemKey];
        if (targetItem.id) delete next[targetItem.id];
        delete next[`idx-${index}`];
        delete next[index.toString()];
        return next;
      });

      if (itemDeletedUrls.length > 0) {
        setDeletedItemIds(prev => prev.filter(url => !itemDeletedUrls.includes(url)));
      }

      // Auto-expand next incomplete item starting after current index (or wrap around)
      let nextTargetIdx = -1;
      for (let offset = 1; offset < finalItems.length; offset++) {
        const checkIdx = (index + offset) % finalItems.length;
        if (calculateItemStatus(finalItems[checkIdx], 0, []).status !== 'complete') {
          nextTargetIdx = checkIdx;
          break;
        }
      }

      const nextExpandedMap: Record<string, boolean> = {};
      if (nextTargetIdx >= 0) {
        finalItems.forEach((it: ReworkItem, i: number) => {
          const k = it.id || it.uid || `idx-${i}`;
          nextExpandedMap[k] = (i === nextTargetIdx);
        });
      } else {
        // If all items are complete, collapse all to show clean summary
        finalItems.forEach((it: ReworkItem, i: number) => {
          const k = it.id || it.uid || `idx-${i}`;
          nextExpandedMap[k] = false;
        });
      }
      setExpandedItemIds(nextExpandedMap);

      const statusInfo = calculateItemStatus(updatedTargetItem, 0, []);
      finishSaving();
      const currentSeq = updatedTargetItem.itemSequence || (index + 1);
      const nextSeq = nextTargetIdx >= 0 ? (finalItems[nextTargetIdx].itemSequence || (nextTargetIdx + 1)) : null;

      if (statusInfo.status === 'complete') {
        showToast(
          `บันทึกรายการที่ ${currentSeq} แล้ว (ข้อมูลสมบูรณ์)${nextSeq ? ` ➔ เปิดรายการที่ ${nextSeq}` : ' • ครบทุกรายการแล้ว'}`,
          'success'
        );
      } else {
        showToast(
          `บันทึกรายการที่ ${currentSeq} แล้ว (ยังขาด: ${statusInfo.missingFields.join(', ')})${nextSeq ? ` ➔ ตรวจสอบรายการที่ ${nextSeq}` : ''}`,
          'info'
        );
      }
      onSaveSuccess?.();
    } catch (error) {
      console.error('Failed to save single item:', error);
      failSaving();
      showAlert('บันทึกรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
    } finally {
      setSavingItemIndex(null);
    }
  };

  return (
    <div className="relative flex flex-col w-full h-full bg-slate-50 overflow-hidden font-sans">
      {/* 0. TOP PROGRESS STRIPE (Subtle Glowing Line on Save) */}
      {isSaving && (
        <div className="absolute top-0 left-0 right-0 z-50 h-1 bg-slate-100/60 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 via-sky-400 to-emerald-500 shadow-[0_0_10px_rgba(236,197,66,0.8)]"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut", duration: 0.3 }}
          />
        </div>
      )}

      {/* 1. TOP ZEN FOCUS HEADER */}
      <CaseUpdateHeader
        caseData={caseData}
        caseStatus={caseStatus}
        editedItems={editedItems}
        missingBoxes={missingBoxes}
        missingGallons={missingGallons}
        missingOil={missingOil}
        resolutionMethod={resolutionMethod}
        isSaving={isSaving}
        isExporting={isExporting}
        isAdmin={isAdmin}
        onBack={onBack}
        onDelete={onDelete ? () => onDelete(caseData.id) : undefined}
        handleDeleteCaseClick={handleDeleteCaseClick}
        handleSave={handleSave}
        exportExcel={exportExcel}
      />

      {/* 2. 4-STEP PIPELINE WORKSPACE NAVIGATION */}
      <WorkflowStepperBar
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        editedItems={editedItems}
        completedItemsCount={itemsCompletion.completed}
        globalCompleted={globalCompleted}
        totalBoxes={totalBoxes}
        resolutionMethod={resolutionMethod}
        hasShortage={derivedShortage.hasShortage}
        receivedHandshake={receivedHandshake}
        isDefendBlocked={isDefendBlocked}
        qcSignoff={qcSignoff}
        userRole={userRole}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 3. STEP CONTENT WORKSPACE PANELS */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 bg-[#F5F5F7]">
          <div className="max-w-4xl mx-auto space-y-6 pb-28">

            {/* ========================================================================= */}
            {/* STEP 1 PANEL: รายการสินค้า & รูปภาพหลักฐาน (ITEMS & EVIDENCE) */}
            {/* ========================================================================= */}
            {activeStep === 'items' && (
              <div className="space-y-6">
              {/* Step Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">Step 1: บันทึกข้อมูลสินค้า (SFC/ผู้แจ้ง)</h2>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-medium border ${
                      canEditItems ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {canEditItems ? 'โหมดแก้ไขข้อมูล (QSMS / Admin)' : 'โหมดดูข้อมูล (Preview Only)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {canEditItems 
                      ? 'ตรวจสอบและแก้ไขข้อมูลล็อต รหัสสินค้า จำนวนกล่อง และแนบรูปหลักฐานความเสียหาย' 
                      : 'ข้อมูลสินค้าที่ระบุไว้ในระบบ (เฉพาะแผนก QSMS/Admin จึงจะสามารถแก้ไขรายการนี้ได้)'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (hasUnsavedPhotos) {
                        showToast('กำลังบันทึกรูปภาพและข้อมูลเข้าระบบ...', 'info');
                        await handleSave(true);
                      }
                      setActiveStep('analysis');
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>ถัดไป: วิเคราะห์และออกใบเบิก (QSMS) ➔</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {/* ── Case Items Completion Checklist Banner ── */}
                <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        itemsCompletion.percent === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {itemsCompletion.percent === 100 ? <CheckCircle2 size={18} /> : <ClipboardCheck size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                            เช็กลิสต์ความสมบูรณ์ของรายการสินค้า
                          </h3>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                            itemsCompletion.percent === 100
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}>
                            {itemsCompletion.percent === 100 ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                            <span>{itemsCompletion.completed}/{itemsCompletion.total} รายการ ({itemsCompletion.percent}%)</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {itemsCompletion.percent === 100
                            ? 'ทุกรายการมีข้อมูลและรูปภาพหลักฐานครบถ้วนแล้ว พร้อมสำหรับการวิเคราะห์'
                            : 'คลิกที่รายการด้านล่างเพื่อตรวจสอบและกรอกข้อมูล/แนบรูปภาพที่ยังขาด'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const allOpen: Record<string, boolean> = {};
                          editedItems.forEach((it, idx) => {
                            const k = it.id || it.uid || `idx-${idx}`;
                            allOpen[k] = true;
                          });
                          setExpandedItemIds(allOpen);
                        }}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        ขยายทั้งหมด
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const allClosed: Record<string, boolean> = {};
                          editedItems.forEach((it, idx) => {
                            const k = it.id || it.uid || `idx-${idx}`;
                            allClosed[k] = false;
                          });
                          setExpandedItemIds(allClosed);
                        }}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        พับทั้งหมด
                      </button>
                      {canEditItems && (
                        <button
                          type="button"
                          onClick={() => {
                            const newItem: ReworkItem = {
                              id: `item-${Date.now()}`,
                              itemNumber: '',
                              itemCode: '',
                              itemName: '',
                              amount: 1,
                              completedBoxes: 0,
                              reason: '',
                              reasonSubtype: '',
                              responsible: '',
                              responsibleSubtype: '',
                              details: '',
                              imageUrls: []
                            };
                            setEditedItems(prev => [newItem, ...prev]);
                            const newKey = newItem.id;
                            setExpandedItemIds(prev => ({ ...prev, [newKey]: true }));
                            showToast('+ เพิ่มแถวสินค้าใหม่เรียบร้อย', 'info');
                          }}
                          className="min-h-9 px-3 py-1.5 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Plus size={13} /> <span>เพิ่มสินค้า</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        itemsCompletion.percent === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${itemsCompletion.percent}%` }}
                    />
                  </div>

                  {/* Interactive Item Checklist Chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {itemsCompletion.details.map(({ item, index, itemKey, stat }) => {
                      const isComplete = stat.status === 'complete';
                      return (
                        <button
                          key={itemKey}
                          type="button"
                          onClick={() => {
                            setExpandedItemIds(prev => ({ ...prev, [itemKey]: true }));
                            setTimeout(() => {
                              const el = document.getElementById(`rework-item-${itemKey}`);
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 50);
                          }}
                          className={`group text-left px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
                            isComplete 
                              ? 'bg-emerald-50/70 hover:bg-emerald-100/80 border-emerald-200 text-emerald-950'
                              : 'bg-amber-50/80 hover:bg-amber-100 border-amber-300/80 text-amber-950 shadow-2xs'
                          }`}
                          title={isComplete ? 'คลิกเพื่อเปิดรายการนี้' : `คลิกเพื่อไปแก้ไข: ขาด ${stat.missingFields.join(', ')}`}
                        >
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                            isComplete ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {isComplete ? '✓' : '!'}
                          </span>
                          <span className="text-xs font-semibold truncate max-w-[140px] sm:max-w-[200px]">
                            #{item.itemSequence ?? (index + 1)} {item.itemName || 'ยังไม่ระบุชื่อ'}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                            isComplete 
                              ? 'bg-emerald-200/60 text-emerald-800' 
                              : 'bg-amber-200/70 text-amber-900'
                          }`}>
                            {isComplete ? 'สมบูรณ์' : `ขาด: ${stat.missingFields.slice(0, 2).join(', ')}${stat.missingFields.length > 2 ? '...' : ''}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Items Accordion Cards */}
                {editedItems.map((item, index) => {
                  const itemIdStr = item.id || item.uid || `idx-${index}`;
                  const isExpanded = expandedItemIds[itemIdStr] ?? false;

                  const stagedFiles = newImages[itemIdStr] || 
                                      (item.id ? newImages[item.id] : undefined) || 
                                      newImages[`idx-${index}`] || 
                                      newImages[index.toString()] || [];

                  const itemStat = calculateItemStatus(item, stagedFiles.length, deletedItemIds);

                  const reasonBadgeColor = item.reason === 'รั่ว' 
                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                    : item.reason === 'เปื้อน' 
                    ? 'bg-amber-50 text-amber-800 border-amber-300' 
                    : 'bg-slate-100 text-slate-700 border-slate-200';

                  const responsibleBadgeColor = item.responsible === 'SFC'
                    ? 'bg-slate-100 text-slate-800 border-slate-300'
                    : item.responsible === 'Supplier'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-sky-50 text-sky-700 border-sky-200';

                  const reasonSubtypes = getReasonSubtypeOptions(item.reason || '');
                  const responsibleSubtypes = getResponsibleSubdivisionOptions(item.responsible || '');

                  return (
                    <div key={itemIdStr} id={`rework-item-${itemIdStr}`} className={`rounded-xl border transition-all overflow-hidden ${
                      isExpanded 
                        ? 'border-slate-300 shadow-xs ring-1 ring-slate-300/40' 
                        : 'border-slate-200 shadow-2xs hover:border-slate-300'
                    }`}>
                      {/* ── Item Summary Bar (Clickable Accordion Header) ── */}
                      <div 
                        onClick={() => {
                          setExpandedItemIds(prev => ({
                            ...prev,
                            [itemIdStr]: !isExpanded
                          }));
                        }}
                        className={`p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b transition-colors cursor-pointer select-none ${
                          isExpanded 
                            ? 'bg-slate-100/90 border-slate-200' 
                            : 'bg-slate-50/80 hover:bg-slate-100/60 border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 font-mono transition-colors ${
                            isExpanded 
                              ? 'bg-slate-900 text-white font-bold shadow-2xs' 
                              : 'bg-slate-200 text-slate-700 border border-slate-300'
                          }`}>
                            {item.itemSequence ?? (index + 1)}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate transition-colors">
                                {item.itemName || 'ยังไม่ระบุชื่อสินค้า'}
                              </h4>
                              {/* Status Badge */}
                              {itemStat.status === 'complete' ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 shrink-0">
                                  <CheckCircle2 size={11} className="text-emerald-600" /> ข้อมูลสมบูรณ์
                                </span>
                              ) : (
                                <span 
                                  className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1 shrink-0 max-w-full" 
                                  title={`ยังขาด: ${itemStat.missingFields.join(', ')}`}
                                >
                                  <AlertCircle size={11} className="text-amber-600 shrink-0" />
                                  <span className="truncate">ยังไม่ครบ (ขาด: {itemStat.missingFields.join(', ')})</span>
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                              {item.itemCode && <span>รหัส: <strong>{item.itemCode}</strong></span>}
                              {item.itemNumber && <span>| สูตร: <strong>{item.itemNumber}</strong></span>}
                              {item.batchNo && <span>| ล็อต: <strong>{item.batchNo}</strong></span>}
                              {item.customerName && <span>| ลูกค้า: <strong>{item.customerName}</strong></span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0" onClick={e => e.stopPropagation()}>
                          <div className="flex flex-wrap items-center gap-1.5 justify-end">
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200/90 rounded-md text-xs font-semibold font-mono">
                              {item.amount || 0} กล่อง
                            </span>
                            {item.reason && (
                              <span className={`px-2 py-0.2 rounded text-[11px] font-semibold border ${reasonBadgeColor}`}>
                                {item.reason}{item.reasonSubtype ? ` • ${item.reasonSubtype}` : ''}
                              </span>
                            )}
                            {item.responsible && (
                              <span className={`px-2 py-0.2 rounded text-[11px] font-semibold border ${responsibleBadgeColor}`}>
                                {item.responsible}{item.responsibleSubtype ? ` • ${item.responsibleSubtype}` : ''}
                              </span>
                            )}
                          </div>

                          {canEditItems && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="min-h-11 min-w-11 inline-flex items-center justify-center text-slate-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer ml-1"
                              title="ลบรายการนี้"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setExpandedItemIds(prev => ({
                                ...prev,
                                [itemIdStr]: !isExpanded
                              }));
                            }}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              isExpanded 
                                ? 'text-amber-800 bg-amber-100/80 hover:bg-amber-200/80' 
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                            title={isExpanded ? "พับการ์ด" : "ขยายการ์ด"}
                          >
                            <ChevronDown size={15} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* ── Item Details Form: AddCaseTab Styled Clean Block Structure ── */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5 space-y-5 bg-white border-t border-amber-100/90">

                          {/* BLOCK 1: ข้อมูลสินค้าหลัก (Product Identification) */}
                          <div className="space-y-3">
                            {/* 3 Columns: Customer, Item Number, Item Code */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {/* ชื่อลูกค้า */}
                              <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-700">ชื่อลูกค้า (Customer Name) *</label>
                                <Select
                                  value={item.customerName || ''}
                                  disabled={!canEditItems}
                                  onValueChange={(val) => {
                                    const n = [...editedItems];
                                    n[index] = { ...n[index], customerName: val };
                                    setEditedItems(n);
                                  }}
                                >
                                  <SelectTrigger className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100 disabled:text-slate-500">
                                    <SelectValue placeholder="กรุณาเลือก" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white border border-slate-200 shadow-lg rounded-md p-1 z-[100]">
                                    {CUSTOMER_OPTIONS.map((opt) => (
                                      <SelectItem key={opt} value={opt}>
                                        {opt}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* หมายเลขบาร์โค้ด / สูตร */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className="block text-xs font-semibold text-slate-700">หมายเลขบาร์โค้ด (Item Number)</label>
                                  {item.itemNumber && (
                                    <button
                                      type="button"
                                      onClick={() => setDrawingDrawerQuery({ query: item.itemNumber!, title: item.itemName || item.itemNumber! })}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 cursor-pointer transition-colors shadow-2xs"
                                      title="ดูแบบแปลน Drawing สำหรับสูตรนี้"
                                    >
                                      <FileText size={10} className="text-amber-700" />
                                      <span>ดู Drawing</span>
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  value={item.itemNumber || ''}
                                  disabled={!canEditItems}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const n = [...editedItems];
                                    n[index] = { ...n[index], itemNumber: e.target.value };
                                    setEditedItems(n);
                                  }}
                                  placeholder="เช่น 6165xxxx"
                                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-mono font-semibold tracking-tight text-slate-900 shadow-2xs placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                                />
                              </div>

                              {/* รหัสสินค้า */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className="block text-xs font-semibold text-slate-700">รหัสสินค้า (Item Code)</label>
                                  {item.itemCode && (
                                    <button
                                      type="button"
                                      onClick={() => setDrawingDrawerQuery({ query: item.itemCode!, title: item.itemName || item.itemCode! })}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 cursor-pointer transition-colors shadow-2xs"
                                      title="ดูแบบแปลน Drawing สำหรับสินค้านี้"
                                    >
                                      <FileText size={10} className="text-amber-700" />
                                      <span>ดู Drawing</span>
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  value={item.itemCode || ''}
                                  disabled={!canEditItems}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => handleItemCodeChange(index, e.target.value)}
                                  placeholder="เช่น 4000xxxx"
                                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-mono font-semibold tracking-tight text-slate-900 shadow-2xs placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                                />
                              </div>
                            </div>

                            {/* Full Width: ชื่อรายการ */}
                            <div className="space-y-1">
                              <label className="block text-xs font-semibold text-slate-700">ชื่อรายการ (Item Name) *</label>
                              <input
                                type="text"
                                value={item.itemName || ''}
                                disabled={!canEditItems}
                                onChange={(e) => {
                                  const n = [...editedItems];
                                  n[index] = { ...n[index], itemName: e.target.value };
                                  setEditedItems(n);
                                }}
                                placeholder="ระบุชื่อสินค้า / น้ำมัน"
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-900 shadow-2xs placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                              />
                            </div>
                          </div>

                          {/* BLOCK 2: แผงไฮไลท์ข้อมูลการผลิต */}
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 bg-slate-50 p-3.5 rounded-lg border border-slate-200 shadow-2xs items-end">
                            <div className="col-span-2 sm:col-span-1 space-y-1.5 flex flex-col justify-end">
                              <label className="block text-xs font-semibold text-slate-700 h-5 flex items-center truncate">หมายเลขล็อต (Batch no.)</label>
                              <input
                                type="text"
                                value={item.batchNo || ''}
                                disabled={!canEditItems}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const n = [...editedItems];
                                  n[index] = { ...n[index], batchNo: e.target.value };
                                  setEditedItems(n);
                                }}
                                placeholder="เช่น 16/05/2026"
                                className="w-full h-[42px] rounded-md border border-slate-300 bg-white px-3 text-xs font-mono font-semibold tracking-tight text-slate-900 shadow-2xs placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100"
                              />
                            </div>

                            <div className="col-span-2 sm:col-span-1 space-y-1.5 flex flex-col justify-end">
                              <label className="block text-xs font-semibold text-slate-700 h-5 flex items-center truncate">วันที่ผลิตแกลลอน</label>
                              <input
                                type="date"
                                value={item.gallonDate ? convertDMYToYMD(item.gallonDate) : (item.packagingDate ? convertDMYToYMD(item.packagingDate) : '')}
                                disabled={!canEditItems}
                                onChange={(e) => {
                                  const n = [...editedItems];
                                  const dmy = convertYMDToDMY(e.target.value);
                                  n[index] = { ...n[index], gallonDate: dmy, packagingDate: dmy };
                                  setEditedItems(n);
                                }}
                                className="w-full h-[42px] rounded-md border border-slate-300 bg-white px-3 text-xs font-mono font-medium text-slate-900 shadow-2xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100"
                              />
                            </div>

                            <div className="col-span-1 space-y-1.5 flex flex-col justify-end">
                              <label className="block text-xs font-semibold text-slate-700 h-5 flex items-center truncate">Mold</label>
                              <input
                                type="text"
                                value={item.mold || ''}
                                disabled={!canEditItems}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const n = [...editedItems];
                                  n[index] = { ...n[index], mold: e.target.value };
                                  setEditedItems(n);
                                }}
                                placeholder="ระบุ Mold"
                                className="w-full h-[42px] rounded-md border border-slate-300 bg-white px-3 text-xs font-mono font-semibold uppercase tracking-tight text-slate-900 text-center shadow-2xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100"
                              />
                            </div>

                            <div className="col-span-1 space-y-1.5 flex flex-col justify-end">
                              <label className="block text-xs font-semibold text-slate-700 h-5 flex items-center truncate">Line</label>
                              <input
                                type="text"
                                value={item.line || ''}
                                disabled={!canEditItems}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const n = [...editedItems];
                                  n[index] = { ...n[index], line: e.target.value };
                                  setEditedItems(n);
                                }}
                                placeholder="ระบุ Line"
                                className="w-full h-[42px] rounded-md border border-slate-300 bg-white px-3 text-xs font-mono font-semibold uppercase tracking-tight text-slate-900 text-center shadow-2xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100"
                              />
                            </div>

                            <div className="col-span-2 sm:col-span-1 space-y-1.5 flex flex-col justify-end">
                              <label className="block text-xs font-bold text-amber-950 h-5 flex items-center truncate gap-1">
                                <span>จำนวนกล่อง (ลัง)</span>
                                <span className="text-amber-600 font-bold">*</span>
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={item.amount || ''}
                                disabled={!canEditItems}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const n = [...editedItems];
                                  n[index] = { ...n[index], amount: Math.max(1, Number(e.target.value) || 1) };
                                  setEditedItems(n);
                                }}
                                className="w-full h-[42px] rounded-md border-2 border-amber-400 bg-amber-50/40 px-3 text-xs font-mono font-bold tracking-tight text-slate-900 text-center shadow-2xs focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-slate-100"
                              />
                            </div>
                          </div>

                          {/* BLOCK 3: สาเหตุที่พบ & ผู้รับผิดชอบ (Defect Cause & Responsibility) */}
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* สาเหตุที่พบ */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                                  <span>สาเหตุที่พบ <span className="text-amber-600 font-bold">*</span></span>
                                  {(!item.reason || !item.reasonSubtype) && (
                                    <span className="text-[10px] text-amber-600 font-medium">
                                      {item.reason ? '⚠️ ต้องเลือกประเภทย่อย' : '⚠️ ต้องระบุสาเหตุ'}
                                    </span>
                                  )}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                  <Select
                                    value={item.reason || ''}
                                    disabled={!canEditItems}
                                    onValueChange={(val) => {
                                      const n = [...editedItems];
                                      n[index] = { ...n[index], reason: val, reasonSubtype: '' };
                                      setEditedItems(n);
                                    }}
                                  >
                                    <SelectTrigger className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100 disabled:text-slate-500">
                                      <SelectValue placeholder="เลือกสาเหตุหลัก" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-slate-200/90 shadow-xl rounded-md p-1 z-[100]">
                                      {REASON_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  <Select
                                    value={item.reasonSubtype || ''}
                                    disabled={!canEditItems || !item.reason || reasonSubtypes.length === 0}
                                    onValueChange={(val) => {
                                      const n = [...editedItems];
                                      n[index] = { ...n[index], reasonSubtype: val };
                                      setEditedItems(n);
                                    }}
                                  >
                                    <SelectTrigger className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100 disabled:text-slate-500">
                                      <SelectValue placeholder={item.reason ? "เลือกประเภทย่อย" : "ระบุสาเหตุหลักก่อน"} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-slate-200/90 shadow-xl rounded-md p-1 z-[100]">
                                      {reasonSubtypes.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {/* ผู้รับผิดชอบ */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                                  <span>ผู้รับผิดชอบ <span className="text-amber-600 font-bold">*</span></span>
                                  {(!item.responsible || !item.responsibleSubtype) && (
                                    <span className="text-[10px] text-amber-600 font-medium">
                                      {item.responsible ? '⚠️ ต้องระบุแผนก/ผู้ผลิต' : '⚠️ ต้องระบุผู้รับผิดชอบ'}
                                    </span>
                                  )}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                  <Select
                                    value={item.responsible || ''}
                                    disabled={!canEditItems}
                                    onValueChange={(val) => {
                                      const n = [...editedItems];
                                      n[index] = { ...n[index], responsible: val, responsibleSubtype: '' };
                                      setEditedItems(n);
                                    }}
                                  >
                                    <SelectTrigger className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100 disabled:text-slate-500">
                                      <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-slate-200/90 shadow-xl rounded-md p-1 z-[100]">
                                      {RESPONSIBLE_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  {responsibleSubtypes.length > 0 ? (
                                    <Select
                                      value={item.responsibleSubtype || ''}
                                      disabled={!canEditItems || !item.responsible}
                                      onValueChange={(val) => {
                                        const n = [...editedItems];
                                        n[index] = { ...n[index], responsibleSubtype: val };
                                        setEditedItems(n);
                                      }}
                                    >
                                      <SelectTrigger className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100 disabled:text-slate-500">
                                        <SelectValue placeholder="เลือกแผนก/ผู้ผลิต" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-white border border-slate-200/90 shadow-xl rounded-md p-1 z-[100]">
                                        {responsibleSubtypes.map((opt) => (
                                          <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <input
                                      type="text"
                                      value={item.responsibleSubtype || ''}
                                      disabled={!canEditItems}
                                      onChange={(e) => {
                                        const n = [...editedItems];
                                        n[index] = { ...n[index], responsibleSubtype: e.target.value };
                                        setEditedItems(n);
                                      }}
                                      className="w-full h-9 text-xs font-medium bg-white border border-slate-300 rounded-md px-3 py-1.5 shadow-2xs disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                      placeholder="ระบุชื่อแผนก/ผู้ผลิต"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* อาการเสีย / รายละเอียดเพิ่มเติม */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-600">อาการเสีย / รายละเอียดเพิ่มเติม (Defect Notes & Details)</label>
                              <input
                                type="text"
                                value={item.details || ''}
                                disabled={!canEditItems}
                                onChange={(e) => {
                                  const n = [...editedItems];
                                  n[index] = { ...n[index], details: e.target.value };
                                  setEditedItems(n);
                                }}
                                className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 shadow-2xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                                placeholder="ระบุอาการ เช่น รอยพับซีลฟอยล์ไม่สนิท น้ำมันซึมออกมาเล็กน้อยที่ขอบฝา..."
                              />
                            </div>
                          </div>

                          {/* BLOCK 4: รูปภาพหลักฐาน + ปุ่มบันทึกรายไอเทม */}
                          <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            {/* Images List */}
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                  <Camera size={14} className="text-slate-500" />
                                  <span>รูปภาพหลักฐานความเสียหาย <span className="text-amber-600 font-bold">*</span> ({(item.imageUrls || []).filter(u => !deletedItemIds.includes(u)).length + stagedFiles.length} ภาพ)</span>
                                </span>

                                {((item.imageUrls || []).filter(u => !deletedItemIds.includes(u)).length + stagedFiles.length === 0) ? (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <AlertCircle size={10} className="text-amber-600" />
                                    <span>⚠️ ยังไม่ได้แนบรูปถ่ายหลักฐาน</span>
                                  </span>
                                ) : stagedFiles.length > 0 ? (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    <span>{stagedFiles.length} รูปใหม่รอการบันทึก</span>
                                  </span>
                                ) : null}
                              </div>

                              <div className="flex flex-wrap gap-2.5 items-center">
                                {/* 1. Existing Uploaded Images */}
                                {(item.imageUrls || []).map((url, imgIdx) => {
                                  const isDeleted = deletedItemIds.includes(url);
                                  return (
                                    <div 
                                      key={`existing-${imgIdx}`} 
                                      className={`relative group w-16 h-16 rounded-xl overflow-hidden border shadow-2xs cursor-pointer transition-all ${
                                        isDeleted ? 'border-red-300 opacity-40 grayscale' : 'border-slate-200 hover:scale-105 hover:shadow-md'
                                      }`}
                                      onClick={() => {
                                        if (!isDeleted) {
                                          setLightboxData({ url, title: `${item.itemName || 'รายการที่ ' + (index + 1)} (ภาพที่ ${imgIdx + 1})` });
                                        }
                                      }}
                                    >
                                      <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white">
                                        <Eye size={15} />
                                      </div>
                                      {canEditItems && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (isDeleted) {
                                              setDeletedItemIds(prev => prev.filter(u => u !== url));
                                            } else {
                                              setDeletedItemIds(prev => [...prev, url]);
                                            }
                                          }}
                                          className="absolute top-1 right-1 w-5 h-5 rounded-md bg-black/60 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                          title={isDeleted ? "ยกเลิกการลบ" : "ลบรูปภาพนี้"}
                                        >
                                          {isDeleted ? <Plus size={11} /> : <Trash2 size={11} />}
                                        </button>
                                      )}
                                      {isDeleted && (
                                        <div className="absolute bottom-0 inset-x-0 bg-red-600 text-white text-[8px] font-bold text-center py-0.5">
                                          รอการลบ
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                {/* 2. Newly Staged Local Files */}
                                {stagedFiles.map((file, fileIdx) => (
                                  <StagedImageThumbnail
                                    key={`staged-${fileIdx}-${file.name}`}
                                    file={file}
                                    canDelete={canEditItems}
                                    onView={(url) => setLightboxData({ url, title: `รูปใหม่ ${file.name} (Draft)` })}
                                    onDelete={() => {
                                      setNewImages(prev => {
                                        const cur = prev[itemIdStr] || (item.id ? prev[item.id] : undefined) || prev[`idx-${index}`] || [];
                                        const nextFiles = cur.filter((_, idx) => idx !== fileIdx);
                                        return {
                                          ...prev,
                                          [itemIdStr]: nextFiles
                                        };
                                      });
                                    }}
                                  />
                                ))}

                                {/* 3. Add Photo Button */}
                                {canEditItems && (
                                  <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 hover:border-slate-800 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer shrink-0">
                                    <span className="text-[10px] font-bold mt-0.5">+ เพิ่มรูป</span>
                                    <input
                                      type="file"
                                      multiple
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        if (files.length > 0) {
                                          setNewImages(prev => {
                                            const updated = { ...prev };
                                            const existing = updated[itemIdStr] || (item.id ? updated[item.id] : undefined) || updated[`idx-${index}`] || [];
                                            const combined = [...existing, ...files];
                                            updated[itemIdStr] = combined;
                                            if (item.id) updated[item.id] = combined;
                                            updated[`idx-${index}`] = combined;
                                            return updated;
                                          });
                                          showToast(`+ เพิ่ม ${files.length} รูปใหม่แล้ว`, 'info');
                                        }
                                        e.target.value = '';
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>

                            {/* Per-Item Save Action Button */}
                            {canEditItems && (
                              <div className="shrink-0 flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={savingItemIndex !== null}
                                  onClick={() => handleSaveSingleItem(index)}
                                  className="min-h-11 px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold rounded-lg text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                                >
                                  {savingItemIndex === index ? (
                                    <>
                                      <Loader2 size={13} className="animate-spin text-white" />
                                      <span>กำลังบันทึก...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check size={13} strokeWidth={2.5} className="text-white" />
                                      <span>บันทึกรายการนี้</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2 PANEL: QSMS วิเคราะห์ & ระบุภาชนะ (ANALYSIS & REQUISITION) */}
          {/* ========================================================================= */}
          {activeStep === 'analysis' && (
            <Step2AnalysisPanel
              canEditAnalysis={canEditAnalysis}
              resolutionMethod={resolutionMethod}
              setResolutionMethod={setResolutionMethod}
              materialRequests={materialRequests}
              setMaterialRequests={setMaterialRequests}
              handleQSMSHandover={handleQSMSHandover}
              handleRemoveMaterial={handleRemoveMaterial}
              isAddingCustomMaterial={isAddingCustomMaterial}
              setIsAddingCustomMaterial={setIsAddingCustomMaterial}
              customMaterialName={customMaterialName}
              setCustomMaterialName={setCustomMaterialName}
              customMaterialQty={customMaterialQty}
              setCustomMaterialQty={setCustomMaterialQty}
              customMaterialUnit={customMaterialUnit}
              setCustomMaterialUnit={setCustomMaterialUnit}
              handleCustomMaterialAdd={handleCustomMaterialAdd}
              handleAddPresetMaterial={handleAddPresetMaterial}
              handleMaterialQtyChange={handleMaterialQtyChange}
              isSaving={isSaving}
            />
          )}

          {/* ========================================================================= */}
          {/* STEP 3 PANEL: WPK คลังเบิกจ่ายภาชนะ (WAREHOUSE ISSUING) */}
          {/* ========================================================================= */}
          {activeStep === 'issuing' && (
            <Step3IssuingPanel
              canEditIssuing={canEditIssuing}
              canEditRepair={canEditRepair}
              userRole={userRole}
              materialRequests={materialRequests}
              derivedShortage={derivedShortage}
              receivedHandshake={receivedHandshake}
              isSaving={isSaving}
              setIsRequisitionModalOpen={setIsRequisitionModalOpen}
              handleFulfillAllMaterials={handleFulfillAllMaterials}
              handleWPKHandover={handleWPKHandover}
              handleMaterialIssuedQtyChange={handleMaterialIssuedQtyChange}
              handleMaterialSetFulfilled={handleMaterialSetFulfilled}
              handleMaterialSetUnavailable={handleMaterialSetUnavailable}
              handleRemoveMaterialWPK={handleRemoveMaterialWPK}
              isAddingWPKMaterial={isAddingWPKMaterial}
              setIsAddingWPKMaterial={setIsAddingWPKMaterial}
              wpkMaterialName={wpkMaterialName}
              setWpkMaterialName={setWpkMaterialName}
              wpkMaterialQty={wpkMaterialQty}
              setWpkMaterialQty={setWpkMaterialQty}
              wpkMaterialUnit={wpkMaterialUnit}
              setWpkMaterialUnit={setWpkMaterialUnit}
              handleWPKAddCustomMaterial={handleWPKAddCustomMaterial}
              handleConfirmMaterialReceipt={handleConfirmMaterialReceipt}
              handleReportShortageBlockage={handleReportShortageBlockage}
            />
          )}

          {/* ========================================================================= */}
          {/* STEP 4 PANEL: PDF ซ่อมงาน & DEFEND MODE (REPAIR & DEFEND) */}
          {/* ========================================================================= */}
          {activeStep === 'repair' && (
            <Step4RepairPanel
              canEditRepair={canEditRepair}
              userRole={userRole}
              isAdmin={isAdmin}
              caseStatus={caseStatus}
              isDefendBlocked={isDefendBlocked}
              setIsDefendBlocked={setIsDefendBlocked}
              defendCategory={defendCategory}
              setDefendCategory={setDefendCategory}
              defendNotes={defendNotes}
              setDefendNotes={setDefendNotes}
              handlePDFSave={handlePDFSave}
              isSaving={isSaving}
              editedItems={editedItems}
              handleItemProgressChange={handleItemProgressChange}
              globalCompleted={globalCompleted}
              totalBoxes={totalBoxes}
              qcSignoff={qcSignoff}
              qcNotesInput={qcNotesInput}
              setQcNotesInput={setQcNotesInput}
              handleQCSignoff={handleQCSignoff}
            />
          )}

        </div>
      </div>
    </div>

      {/* 4. MOBILE TECHNICIAN QUICK ACTION BAR (PDF / REPAIR STAGE) */}
      <MobileTechnicianQuickBar
        canEditRepair={canEditRepair}
        totalBoxes={totalBoxes}
        globalCompleted={globalCompleted}
        isSaving={isSaving}
        editedItems={editedItems}
        handleItemProgressChange={handleItemProgressChange}
        handlePDFSave={handlePDFSave}
      />

      {/* Export Overlay */}
      <AnimatePresence>
        {isExporting && (
          <div className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-8">
            <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-5 max-w-sm w-full text-center border border-slate-200">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Download size={20} className="text-slate-800 animate-pulse" />
                </div>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 mb-1">กำลังเตรียมเอกสาร Excel...</h4>
                <p className="text-xs text-slate-500">{exportProgress}</p>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-full bg-amber-500"
                />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox Image Preview Modal */}
      <AnimatePresence>
        {lightboxData && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxData(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs cursor-zoom-out"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="relative z-10 max-w-4xl max-h-[90vh] flex flex-col items-center select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative rounded-lg overflow-hidden shadow-2xl border border-white/20 bg-slate-900 flex items-center justify-center max-h-[80vh]">
                <img
                  src={lightboxData.url}
                  alt="Fullscreen Preview"
                  className="max-h-[80vh] max-w-full object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setLightboxData(null)}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/90 text-white rounded-full flex items-center justify-center transition-colors border border-white/20 cursor-pointer"
                  title="ปิด (Esc)"
                >
                  <X size={16} />
                </button>
              </div>
              {lightboxData.title && (
                <div className="mt-3 px-3.5 py-1 rounded-full bg-slate-900/80 text-white text-xs font-semibold backdrop-blur-md border border-white/10 flex items-center gap-2">
                  <Camera size={13} className="text-amber-400" />
                  <span>{lightboxData.title}</span>
                  <a
                    href={lightboxData.url}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 text-amber-300 hover:text-white underline text-[11px] inline-flex items-center gap-1"
                  >
                    <span>เปิดขนาดเต็ม</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING SAVE PROGRESS ISLAND (Bottom Center Floating Feedback) */}
      <AnimatePresence>
        {isSaving && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/95 text-slate-800 border border-slate-200 shadow-xl backdrop-blur-md min-w-[260px] sm:min-w-[300px]">
              {isComplete ? (
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} className="text-emerald-700" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] flex items-center justify-center shrink-0">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="truncate text-slate-800">{statusText || (isComplete ? 'บันทึกเรียบร้อย' : 'กำลังบันทึกข้อมูล...')}</span>
                  <span className="font-mono text-[#92400E] shrink-0 ml-2">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#F5C754] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
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
      {/* Requisition Slip Modal (Print-ready) */}
      <RequisitionSlipModal
        isOpen={isRequisitionModalOpen}
        onClose={() => setIsRequisitionModalOpen(false)}
        caseData={{
          ...caseData,
          status: caseStatus,
          items: editedItems,
        }}
        materialRequests={materialRequests}
        resolutionMethod={resolutionMethod}
      />

      {/* 1-Click Drawing Preview Drawer */}
      <DrawingPreviewDrawer
        isOpen={Boolean(drawingDrawerQuery)}
        onClose={() => setDrawingDrawerQuery(null)}
        query={drawingDrawerQuery?.query || ''}
        itemTitle={drawingDrawerQuery?.title}
      />
    </div>
  );
}
