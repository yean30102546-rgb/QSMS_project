import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Save, FileText, ExternalLink, PenTool, Trash2, Plus, 
  ChevronDown, AlertCircle, Camera, CheckCircle2, Image as ImageIcon, X,
  Package, Wrench, Edit3, Check, HelpCircle, Tag, FileSpreadsheet, Download, 
  Loader2, Shield, Eye, Clock, ChevronRight, Truck, CheckCheck, AlertTriangle,
  Sparkles, Printer
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
  
  if (!item.itemCode?.trim()) missing.push('รหัสสินค้า');
  if (!item.itemNumber?.trim()) missing.push('รหัสสูตร');
  if (!item.amount || Number(item.amount) <= 0) missing.push('จำนวนกล่อง');
  if (!item.batchNo?.trim()) missing.push('หมายเลขล็อต');
  if (!item.gallonDate?.trim() && !item.packagingDate?.trim()) missing.push('วันที่ผลิต');
  if (!item.reason?.trim()) missing.push('สาเหตุหลัก');
  if (!item.responsible?.trim()) missing.push('ผู้รับผิดชอบ');
  if (activePhotos === 0) missing.push('รูปภาพหลักฐาน');
  
  if (missing.length === 0) {
    return { status: 'complete', label: 'ข้อมูลสมบูรณ์', missingFields: [] };
  }
  
  const hasSomeProgress = Boolean(
    item.batchNo?.trim() || 
    item.reason?.trim() || 
    item.responsible?.trim() || 
    activePhotos > 0 ||
    item.details?.trim() ||
    item.gallonDate?.trim() ||
    item.packagingDate?.trim() ||
    item.mold?.trim() ||
    item.line?.trim()
  );
  
  if (hasSomeProgress) {
    return { status: 'partial', label: 'อัปเดตแล้ว', missingFields: missing };
  }
  
  return { status: 'pending', label: 'รอตรวจสอบ', missingFields: missing };
}

type WorkflowStep = 'items' | 'analysis' | 'issuing' | 'repair';

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

  // Requisition Slip & Drawing Drawer Modals
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState<boolean>(false);
  const [drawingDrawerQuery, setDrawingDrawerQuery] = useState<{ query: string; title?: string } | null>(null);

  // Step 2 & 3: Material Requests State
  const [materialRequests, setMaterialRequests] = useState<MaterialRequestItem[]>([]);
  const [customMaterialName, setCustomMaterialName] = useState('');
  const [customMaterialQty, setCustomMaterialQty] = useState(1);
  const [customMaterialUnit, setCustomMaterialUnit] = useState('ชิ้น');
  const [isAddingCustomMaterial, setIsAddingCustomMaterial] = useState(false);

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
  } | null>((caseData as unknown as { materialReceivedInfo?: { receivedBy?: string; receivedAt?: string } })?.materialReceivedInfo || null);

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
      setReceivedHandshake((caseData as unknown as { materialReceivedInfo?: { receivedBy?: string; receivedAt?: string } })?.materialReceivedInfo || null);
      setQcSignoff((caseData as unknown as { qcApprovalInfo?: { approvedBy?: string; approvedAt?: string; qcNotes?: string } })?.qcApprovalInfo || null);

      // Smart default tab
      if (caseData.status === 'Pending Analysis' || caseData.status === 'Pending') {
        setActiveStep('items');
      } else if (userRole === 'WPK' && caseData.status === 'Awaiting Materials') {
        setActiveStep('issuing');
      } else if (userRole === 'PDF' && (caseData.status === 'In-Progress' || caseData.status === 'Blocked' || caseData.status === 'Completed')) {
        setActiveStep('repair');
      } else if (caseData.status === 'Awaiting Materials') {
        setActiveStep('issuing');
      } else if (caseData.status === 'In-Progress' || caseData.status === 'Blocked') {
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
    showToast('✓ ปรับยอดเบิกจ่ายครบตามจำนวนที่ขอแล้วทุกรายการ', 'success');
  };

  const handleRemoveMaterial = (id: string) => {
    if (!canEditAnalysis) return;
    setMaterialRequests(prev => prev.filter(m => m.id !== id));
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
      showToast('✓ บันทึกผลวิเคราะห์สำเร็จ: เปลี่ยนสถานะเป็น "รอเบิกภาชนะ" ส่งต่อให้ WPK แล้ว', 'success');
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
      showToast('✓ บันทึกการเบิกจ่ายสำเร็จ: เปลี่ยนสถานะเป็น "กำลังซ่อม" ส่งงานให้ PDF แล้ว', 'success');
      setActiveStep('repair');
      onSaveSuccess?.();
    } catch (error) {
      failSaving();
      showAlert('บันทึกไม่สำเร็จ', 'error');
    }
  };

  // Step 3 Handshake: PDF / Operator Confirm Material Receipt
  const handleConfirmMaterialReceipt = async () => {
    startSaving();
    try {
      const receiptInfo = {
        receivedBy: currentUser?.name || 'PDF Technician',
        receivedAt: new Date().toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      };
      const updates: Record<string, unknown> = {
        materialReceivedInfo: receiptInfo
      };
      await updateCase(caseData.id, updates as Partial<ReworkCase>);
      setReceivedHandshake(receiptInfo);
      finishSaving();
      showToast('✓ ยืนยันตรวจนับและรับมอบชิ้นส่วนครบชุดหน้างานเรียบร้อยแล้ว', 'success');
      onSaveSuccess?.();
    } catch (err) {
      failSaving();
      showAlert('ไม่สามารถบันทึกการรับมอบได้', 'error');
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
      showToast(isClosure ? '🎉 ปิดเคส Rework เสร็จสมบูรณ์ 100% เรียบร้อยแล้ว' : isBlocked ? '⚠️ บันทึกสถานะติดปัญหา (Defend Mode) แล้ว' : 'บันทึกความคืบหน้าสำเร็จ', 'success');
      
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
      showToast('🏅 ตรวจรับงานผ่านเกณฑ์ QC และลงนามปิดเคสสมบูรณ์ 100% เรียบร้อยแล้ว', 'success');
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
          const k = it.id || (it as any).uid || `idx-${i}`;
          nextExpandedMap[k] = (i === targetExpandIdx);
        });
        setExpandedItemIds(nextExpandedMap);
      }

      finishSaving();
      showToast(forceDraft ? '✓ บันทึกรูปภาพและข้อมูลสำเร็จ' : '✓ บันทึกสำเร็จ', 'success');
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

    const itemKey = targetItem.id || (targetItem as any).uid || `idx-${index}`;
    const stagedFiles = newImages[itemKey] || 
                        (targetItem.id ? newImages[targetItem.id] : undefined) || 
                        newImages[`idx-${index}`] || 
                        newImages[index.toString()] || [];

    const itemDeletedUrls = deletedItemIds.filter(url => (targetItem.imageUrls || []).includes(url));

    try {
      setSavingItemIndex(index);
      startSaving();

      // 1. Move target item to bottom
      const remainingItems = editedItems.filter((_, i) => i !== index);
      const updatedTargetItem: ReworkItem = {
        ...targetItem,
        itemSequence: targetItem.itemSequence ?? (index + 1),
        amount: Math.max(1, Number(targetItem.amount) || 1)
      };
      const reorderedItems = [...remainingItems, updatedTargetItem];

      // 2. Prepare payload for updateCase
      const updates: any = {
        items: reorderedItems,
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
      let finalItems: ReworkItem[] = reorderedItems;
      if (res.success && (res.data as ReworkCase)?.items) {
        const dbItems = (res.data as ReworkCase).items;
        finalItems = reorderedItems.map(localItem => {
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

      // Auto-expand the next incomplete item in the new list (or top item)
      const nextIncompleteIdx = finalItems.findIndex((it: ReworkItem) => calculateItemStatus(it, 0, []).status !== 'complete');
      const targetExpandIdx = nextIncompleteIdx >= 0 ? nextIncompleteIdx : 0;
      const nextExpandedMap: Record<string, boolean> = {};

      finalItems.forEach((it: ReworkItem, i: number) => {
        const k = it.id || (it as any).uid || `idx-${i}`;
        nextExpandedMap[k] = (i === targetExpandIdx);
      });
      setExpandedItemIds(nextExpandedMap);

      const statusInfo = calculateItemStatus(updatedTargetItem, 0, []);
      finishSaving();
      showToast(
        `✓ บันทึกรายการที่ ${updatedTargetItem.itemSequence || (index + 1)} แล้ว ➔ ย้ายลงล่าง และเปิดรายการถัดไปให้อัตโนมัติ`,
        'success'
      );
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 bg-white shrink-0 gap-3">
        {/* Left Side: Back button + Breadcrumb + Case ID + Status Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs border border-slate-200"
            title="ย้อนกลับไปหน้าภาพรวมเคส (ESC)"
          >
            <ArrowLeft size={14} />
            <span>กลับหน้าภาพรวมเคส</span>
          </button>
          
          <div className="hidden sm:block h-6 w-px bg-slate-200" />

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onBack}
                className="text-xs font-semibold text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                title="คลิกเพื่อกลับหน้าภาพรวมเคส"
              >
                ภาพรวมเคส (Overall) /
              </button>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 font-mono truncate">
                {caseData.id}
              </h1>
              <StatusBadge status={caseStatus} />
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 font-mono">
              <span className="font-semibold text-slate-700">{caseData.id}</span>
              <CopyButton text={caseData.id} size={11} />
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">{caseData.customerName || caseData.source}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Action Buttons Toolbar */}
        <div className="flex items-center justify-end gap-2 overflow-x-auto scrollbar-hide">
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
            title="ส่งออกรายงาน Rework เป็นไฟล์ Excel พร้อมรูปภาพ"
            className="whitespace-nowrap shrink-0 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
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

          {onDelete && isAdmin && (
            <button
              type="button"
              onClick={handleDeleteCaseClick}
              disabled={isSaving}
              className="whitespace-nowrap shrink-0 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-all border border-red-200 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={12} /> <span>ลบเคส</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="whitespace-nowrap shrink-0 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-all cursor-pointer disabled:opacity-50"
          >
            <span>บันทึกร่าง</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN WORKSPACE: LEFT WORKFLOW STEPPER SIDEBAR + RIGHT FORM VIEWPORT */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Workflow Stepper Navigation (Vertical on Desktop, Horizontal Tab Slider on Mobile) */}
        <aside className="w-full md:w-64 lg:w-72 border-b md:border-b-0 md:border-r border-slate-200/90 bg-white shrink-0 overflow-y-auto p-3 sm:p-4 flex flex-col justify-between select-none">
          <div>
            <div className="hidden md:flex items-center justify-between px-1 mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ขั้นตอนการทำงาน</span>
              <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">4 ขั้นตอน</span>
            </div>

            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0 scrollbar-hide">
              {[
                {
                  id: 'items' as const,
                  stepNum: '1',
                  icon: FileText,
                  title: '1. ข้อมูลสินค้า & รูปภาพ',
                  subtitle: 'Item Breakdown & Evidence',
                  roleLabel: 'QSMS / WPK',
                  badgeText: `${editedItems.filter(it => calculateItemStatus(it).status === 'complete').length}/${editedItems.length} ครบ`,
                  badgeComplete: editedItems.length > 0 && editedItems.every(i => calculateItemStatus(i).status === 'complete'),
                  isActive: activeStep === 'items',
                  canEdit: canEditItems,
                },
                {
                  id: 'analysis' as const,
                  stepNum: '2',
                  icon: Wrench,
                  title: '2. QSMS วิเคราะห์ & ภาชนะ',
                  subtitle: 'Analysis & Requisition',
                  roleLabel: 'QSMS Only',
                  badgeText: caseStatus === 'Pending Analysis' ? 'รอวิเคราะห์' : 'วิเคราะห์แล้ว',
                  badgeComplete: caseStatus !== 'Pending Analysis' && caseStatus !== 'Pending',
                  isActive: activeStep === 'analysis',
                  canEdit: canEditAnalysis,
                },
                {
                  id: 'issuing' as const,
                  stepNum: '3',
                  icon: Truck,
                  title: '3. WPK คลังเบิกจ่ายภาชนะ',
                  subtitle: 'Warehouse Issuing',
                  roleLabel: 'WPK Only',
                  badgeText: missingBoxes === 0 && missingGallons === 0 && missingOil === 0 ? 'เบิกครบ' : 'รอเบิกของ',
                  badgeComplete: caseStatus === 'In-Progress' || caseStatus === 'Blocked' || caseStatus === 'Completed',
                  isActive: activeStep === 'issuing',
                  canEdit: canEditIssuing,
                },
                {
                  id: 'repair' as const,
                  stepNum: '4',
                  icon: CheckCheck,
                  title: '4. PDF ซ่อม & Defend',
                  subtitle: 'Repair & Closure',
                  roleLabel: 'PDF Only',
                  badgeText: caseStatus === 'Completed' ? 'เสร็จสิ้น' : 'กำลังซ่อม',
                  badgeComplete: caseStatus === 'Completed',
                  isActive: activeStep === 'repair',
                  canEdit: canEditRepair,
                },
              ].map((step) => {
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className={`w-full shrink-0 md:shrink flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer select-none min-w-[200px] md:min-w-0 ${
                      step.isActive
                        ? 'bg-[#FEF9E7] text-[#92400E] border-[#FDE68A] shadow-2xs ring-1 ring-[#FDE68A]/60'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 font-mono mt-0.5 ${
                      step.badgeComplete
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : step.isActive
                          ? 'bg-[#FDE68A] text-[#78350F] border border-[#FCD34D]'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {step.badgeComplete ? '✓' : step.stepNum}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-bold truncate leading-tight ${step.isActive ? 'text-[#92400E]' : 'text-slate-800'}`}>
                          {step.title}
                        </p>
                      </div>
                      <p className={`text-[10px] truncate mt-0.5 ${step.isActive ? 'text-[#B45309]' : 'text-slate-400'}`}>
                        {step.subtitle}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium border ${
                          step.badgeComplete
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : step.isActive
                              ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                              : 'bg-slate-50 text-slate-600 border-slate-200/80'
                        }`}>
                          {step.badgeText}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium border ${
                          step.canEdit
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200/60'
                        }`}>
                          {step.canEdit ? 'แก้ไข' : 'ดู'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Case Summary on Bottom Left (Desktop Only) */}
          <div className="hidden md:block mt-6 pt-4 border-t border-slate-200/80">
            <div className="rounded-xl bg-slate-50/90 border border-slate-200/80 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>จำนวนสินค้า</span>
                <span className="font-bold font-mono text-slate-800">{editedItems.length} รายการ</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>ยอดกล่องรวม</span>
                <span className="font-bold font-mono text-slate-800">
                  {editedItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0)} กล่อง
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>สถานะเคส</span>
                <StatusBadge status={caseStatus} />
              </div>
            </div>
          </div>
        </aside>

        {/* 3. STEP CONTENT WORKSPACE PANELS */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 bg-slate-50/60">
          <div className="max-w-5xl mx-auto space-y-6 pb-24">

            {/* ========================================================================= */}
            {/* STEP 1 PANEL: รายการสินค้า & รูปภาพหลักฐาน (ITEMS & EVIDENCE) */}
            {/* ========================================================================= */}
            {activeStep === 'items' && (
              <div className="space-y-6">
              {/* Step Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">Step 1: ข้อมูลสินค้าและรูปภาพหลักฐาน</h2>
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
                    <span>ถัดไป: QSMS วิเคราะห์ ➔</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {/* Header Toolbar: Count + Status + Accordion Toggle + Add Item */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      รายการสินค้าในเคส ({editedItems.length} รายการ)
                    </h3>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      <span>{editedItems.filter(it => calculateItemStatus(it).status === 'complete').length}/{editedItems.length} ข้อมูลสมบูรณ์</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const allOpen: Record<string, boolean> = {};
                        editedItems.forEach((it, idx) => {
                          const k = it.id || (it as any).uid || `idx-${idx}`;
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
                          const k = it.id || (it as any).uid || `idx-${idx}`;
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
                        className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-300 transition-all flex items-center gap-1 cursor-pointer ml-1 shadow-2xs"
                      >
                        <Plus size={13} /> <span>เพิ่มรายการสินค้า</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Items Accordion Cards */}
                {editedItems.map((item, index) => {
                  const itemIdStr = item.id || (item as any).uid || `idx-${index}`;
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
                    <div key={itemIdStr} className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden transition-all">
                      {/* ── Item Summary Bar (Clickable Accordion Header) ── */}
                      <div 
                        onClick={() => {
                          setExpandedItemIds(prev => ({
                            ...prev,
                            [itemIdStr]: !isExpanded
                          }));
                        }}
                        className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-white hover:bg-amber-50/20 cursor-pointer transition-colors select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] flex items-center justify-center text-xs font-bold shrink-0 font-mono">
                            {item.itemSequence ?? (index + 1)}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {item.itemName || 'ยังไม่ระบุชื่อสินค้า'}
                              </h4>
                              {/* Status Badge */}
                              {itemStat.status === 'complete' ? (
                                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 shrink-0">
                                <CheckCircle2 size={11} /> ข้อมูลสมบูรณ์
                              </span>
                              ) : itemStat.status === 'partial' ? (
                                <span 
                                  className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1 shrink-0" 
                                  title={`ยังขาด: ${itemStat.missingFields.join(', ')}`}
                                >
                                  <AlertCircle size={11} /> อัปเดตแล้ว
                                </span>
                              ) : (
                                <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1 shrink-0">
                                  <Clock size={11} /> รอตรวจสอบ
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
                              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer ml-1"
                              title="ลบรายการนี้"
                            >
                              <Trash2 size={13} />
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
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-transform duration-200 cursor-pointer"
                            title={isExpanded ? "พับการ์ด" : "ขยายการ์ด"}
                          >
                            <ChevronDown size={15} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* ── Item Details Form: AddCaseTab Styled Clean Block Structure ── */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5 space-y-5 bg-white border-t border-slate-100">

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
                                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                                      title="ดูแบบแปลน Drawing สำหรับสูตรนี้"
                                    >
                                      <FileText size={11} />
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
                                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                                      title="ดูแบบแปลน Drawing สำหรับสินค้านี้"
                                    >
                                      <FileText size={11} />
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
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 bg-slate-50 p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                            <div className="col-span-2 sm:col-span-1 space-y-1">
                              <label className="block text-xs font-semibold text-slate-700">หมายเลขล็อต (Batch no.)</label>
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
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono font-semibold tracking-tight text-slate-900 shadow-2xs placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100"
                              />
                            </div>

                            <div className="col-span-2 sm:col-span-1 space-y-1">
                              <label className="block text-xs font-semibold text-slate-700">วันที่ผลิตแกลลอน</label>
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
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono font-medium text-slate-900 shadow-2xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100"
                              />
                            </div>

                            <div className="col-span-1 space-y-1">
                              <label className="block text-xs font-semibold text-slate-700 text-center">Mold</label>
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
                                placeholder="Mold"
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-tight text-slate-900 text-center shadow-2xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100"
                              />
                            </div>

                            <div className="col-span-1 space-y-1">
                              <label className="block text-xs font-semibold text-slate-700 text-center">Line</label>
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
                                placeholder="Line"
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-tight text-slate-900 text-center shadow-2xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100"
                              />
                            </div>

                            <div className="col-span-2 sm:col-span-1 space-y-1">
                              <label className="block text-xs font-bold text-slate-900 text-center">จำนวนกล่อง (ลัง) *</label>
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
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono font-bold tracking-tight text-slate-900 text-center shadow-2xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-slate-100"
                              />
                            </div>
                          </div>

                          {/* BLOCK 3: สาเหตุที่พบ & ผู้รับผิดชอบ (Defect Cause & Responsibility) */}
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* สาเหตุที่พบ */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500">สาเหตุที่พบ (Optional)</label>
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
                                    <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-500">
                                      <SelectValue placeholder="เลือกสาเหตุหลัก" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-slate-200/90 shadow-xl rounded-xl p-1 z-[100]">
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
                                    <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-500">
                                      <SelectValue placeholder={item.reason ? "เลือกประเภทย่อย" : "ระบุสาเหตุหลักก่อน"} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-slate-200/90 shadow-xl rounded-xl p-1 z-[100]">
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
                                <label className="text-xs font-semibold text-slate-500">ผู้รับผิดชอบ (Optional)</label>
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
                                    <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-500">
                                      <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-slate-200/90 shadow-xl rounded-xl p-1 z-[100]">
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
                                      <SelectTrigger className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-500">
                                        <SelectValue placeholder="เลือกแผนก/ผู้ผลิต" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-white border border-slate-200/90 shadow-xl rounded-xl p-1 z-[100]">
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
                                      className="w-full h-10 text-xs font-medium bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500 focus:bg-white focus:outline-none focus:border-indigo-500"
                                      placeholder="ระบุชื่อแผนก/ผู้ผลิต"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* อาการเสีย / รายละเอียดเพิ่มเติม */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-500">อาการเสีย / รายละเอียดเพิ่มเติม (Defect Notes & Details)</label>
                              <input
                                type="text"
                                value={item.details || ''}
                                disabled={!canEditItems}
                                onChange={(e) => {
                                  const n = [...editedItems];
                                  n[index] = { ...n[index], details: e.target.value };
                                  setEditedItems(n);
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
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
                                  <span>รูปภาพหลักฐานความเสียหาย ({(item.imageUrls || []).filter(u => !deletedItemIds.includes(u)).length + stagedFiles.length} ภาพ)</span>
                                </span>

                                {stagedFiles.length > 0 && (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    <span>{stagedFiles.length} รูปใหม่รอการบันทึก</span>
                                  </span>
                                )}
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
                                  <label className="w-16 h-16 rounded-md border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/50 flex flex-col items-center justify-center text-slate-400 hover:text-amber-700 transition-colors cursor-pointer shrink-0">
                                    <span className="text-[9px] font-bold mt-0.5">+ เพิ่มรูป</span>
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
                                  className="px-3.5 py-2 bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] border border-[#FDE68A] rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
                                >
                                  {savingItemIndex === index ? (
                                    <span>กำลังบันทึก...</span>
                                  ) : (
                                    <span>บันทึกรายการนี้</span>
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
            <div className="space-y-5">
              {/* Step Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">Step 2: ผลการวิเคราะห์และระบุภาชนะที่ต้องใช้</h2>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-medium border ${
                      canEditAnalysis ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {canEditAnalysis ? 'โหมดวิเคราะห์ & ขอเบิก (QSMS / Admin)' : 'โหมดดูผลวิเคราะห์ (Preview Only)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {canEditAnalysis
                      ? 'ระบุสาเหตุข้อบกพร่อง แนวทางแก้ไข และกำหนดรายการภาชนะที่ต้องใช้ส่งต่อให้คลัง (WPK)'
                      : 'ผลการวิเคราะห์จากแผนก QSMS (เฉพาะ QSMS/Admin จึงจะสามารถแก้ไขส่วนนี้ได้)'}
                  </p>
                </div>

                {canEditAnalysis && (
                  <button
                    type="button"
                    onClick={handleQSMSHandover}
                    disabled={isSaving}
                    className="px-4 py-2 bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] border border-[#FDE68A] text-xs font-medium rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>บันทึกผล & ส่งขอเบิกภาชนะ</span>
                  </button>
                )}
              </div>

              {/* Analysis Textarea */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>ผลการวิเคราะห์สาเหตุและแนวทางแก้ไข (Analysis & Resolution Notes)</span>
                  </h3>
                </div>
                <textarea
                  rows={3}
                  value={resolutionMethod}
                  disabled={!canEditAnalysis}
                  onChange={(e) => setResolutionMethod(e.target.value)}
                  placeholder="ระบุผลการวิเคราะห์สาเหตุ เช่น ซีลฟอยล์ไม่สนิทจากความร้อนตก และแนวทางการแก้ไข เช่น ให้เปลี่ยนแกลลอนใหม่และรันซีลซ้ำ..."
                  className="w-full text-xs font-medium rounded-md border border-slate-300 bg-white p-3 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              {/* Container & Material Requisition Table */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                      <span>รายการภาชนะและวัสดุที่ต้องใช้ (Container & Material Requisition)</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 shrink-0">
                        {materialRequests.length} รายการ
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">ระบุรายการและจำนวนภาชนะเพื่อให้แผนกคลัง (WPK) ดำเนินการเบิกจ่าย</p>
                  </div>
                </div>

                {canEditAnalysis && (
                  <div className="rounded-xl bg-slate-50/80 border border-slate-200/70 p-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 shrink-0">
                      <span>เพิ่มด่วน:</span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5 w-full flex-wrap sm:flex-nowrap">
                      {[
                        { name: 'กล่องใหม่', unit: 'กล่อง' },
                        { name: 'แกลลอน 1L', unit: 'ใบ' },
                        { name: 'แกลลอน 4L', unit: 'ใบ' },
                        { name: 'แกลลอน 5L', unit: 'ใบ' },
                        { name: 'ฝาแกลลอน', unit: 'ชิ้น' },
                        { name: 'สติกเกอร์/ฉลาก', unit: 'แผ่น' },
                        { name: 'ถัง 200L', unit: 'ถัง' },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleAddPresetMaterial(preset.name, preset.unit)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
                        >
                          + {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {materialRequests.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                    <p className="text-xs font-semibold text-slate-600">ยังไม่มีการระบุภาชนะหรือวัสดุที่ต้องใช้</p>
                    {canEditAnalysis && (
                      <div className="mt-3 flex justify-center">
                        <button
                          type="button"
                          onClick={() => setIsAddingCustomMaterial(true)}
                          className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>เพิ่มรายการวัสดุแบบกำหนดเอง</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">รายการภาชนะ / วัสดุ</th>
                          <th className="py-2.5 px-3 text-center">จำนวนที่ขอ (QSMS)</th>
                          <th className="py-2.5 px-3 text-center">หน่วยนับ</th>
                          <th className="py-2.5 px-3 text-center">สถานะ</th>
                          {canEditAnalysis && <th className="py-2.5 px-3 text-right">จัดการ</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {materialRequests.map((mat, idx) => (
                          <tr key={mat.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{mat.materialName}</td>
                            <td className="py-2 px-3 text-center">
                              {canEditAnalysis ? (
                                <input
                                  type="number"
                                  min="1"
                                  value={mat.requestedQty}
                                  onChange={(e) => handleMaterialQtyChange(mat.id, Number(e.target.value) || 0)}
                                  className="w-16 text-center border border-slate-200 bg-slate-50 rounded-lg py-1 px-2 font-bold text-slate-900 focus:bg-white focus:border-orange-500"
                                />
                              ) : (
                                <span className="font-bold text-slate-900">{mat.requestedQty}</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center text-slate-500">{mat.unit}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                mat.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-800' :
                                mat.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                                mat.status === 'unavailable' ? 'bg-red-100 text-red-800' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {mat.status === 'fulfilled' ? 'เบิกจ่ายครบแล้ว' :
                                 mat.status === 'partial' ? 'เบิกจ่ายบางส่วน' :
                                 mat.status === 'unavailable' ? 'ของขาด' :
                                 'รอคลังเบิกจ่าย'}
                              </span>
                            </td>
                            {canEditAnalysis && (
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMaterial(mat.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                  <span>ลบ</span>
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {canEditAnalysis && (
                      <div className="p-3 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setIsAddingCustomMaterial(!isAddingCustomMaterial)}
                          className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isAddingCustomMaterial ? 'ยกเลิก' : '+ เพิ่มรายการวัสดุอื่นๆ แบบกำหนดเอง'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Material Input Form */}
                {isAddingCustomMaterial && canEditAnalysis && (
                  <div className="p-3.5 rounded-xl border border-orange-200 bg-orange-50/40 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">ชื่อภาชนะ / วัสดุ *</label>
                      <input
                        type="text"
                        value={customMaterialName}
                        onChange={(e) => setCustomMaterialName(e.target.value)}
                        placeholder="เช่น ฝาซีลกันปลอม, ฟิล์มหด ฯลฯ"
                        className="w-full text-xs border border-slate-200 rounded-lg py-1.5 px-3 bg-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">จำนวนที่ขอ *</label>
                      <input
                        type="number"
                        min="1"
                        value={customMaterialQty}
                        onChange={(e) => setCustomMaterialQty(Number(e.target.value) || 1)}
                        className="w-full text-xs border border-slate-200 rounded-lg py-1.5 px-3 bg-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleCustomMaterialAdd}
                        className="w-full py-1.5 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        บันทึกเข้าตาราง
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3 PANEL: WPK คลังเบิกจ่ายภาชนะ (WAREHOUSE ISSUING) */}
          {/* ========================================================================= */}
          {activeStep === 'issuing' && (
            <div className="space-y-6">
              {/* Step Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">Step 3: คลังบันทึกการเบิกจ่ายภาชนะ (WPK Fulfillment)</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      canEditIssuing ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {canEditIssuing ? 'โหมดเบิกจ่ายของ (WPK / Admin)' : 'โหมดดูการเบิกจ่าย (Preview Only)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {canEditIssuing
                      ? 'ตรวจสอบรายการที่ QSMS ขอ และบันทึกยอดเบิกได้จริงเพื่อส่งมอบงานให้ PDF ซ่อม'
                      : 'รายการเบิกจ่ายของแผนกคลัง (เฉพาะแผนก WPK/Admin จึงจะสามารถบันทึกยอดเบิกได้)'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => setIsRequisitionModalOpen(true)}
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                    title="เปิดใบขอเบิกภาชนะขนาด A5 สำหรับพิมพ์หรือดาวน์โหลด"
                  >
                    <Printer size={13} className="text-indigo-600" />
                    <span>พิมพ์ใบเบิกภาชนะ</span>
                  </button>

                  {canEditIssuing && (
                    <>
                      <button
                        type="button"
                        onClick={handleFulfillAllMaterials}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer shrink-0"
                      >
                        ✓ เบิกครบตามยอดทั้งหมด
                      </button>
                      <button
                        type="button"
                        onClick={handleWPKHandover}
                        disabled={isSaving}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Truck size={14} />
                        <span>จ่ายของครบ & ส่งให้ PDF ซ่อม ➔</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Warehouse Issuing Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>ตารางเบิกจ่ายภาชนะและวัสดุ</span>
                </h3>

                {materialRequests.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs font-semibold text-slate-500">QSMS ยังไม่ได้ระบุรายการขอเบิกภาชนะใน Step 2</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">รายการภาชนะ / วัสดุ</th>
                          <th className="py-2.5 px-3 text-center">ยอดที่ QSMS ขอ</th>
                          <th className="py-2.5 px-3 text-center">ยอดเบิกได้จริง (WPK)</th>
                          <th className="py-2.5 px-3 text-center">หน่วยนับ</th>
                          <th className="py-2.5 px-3 text-center">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {materialRequests.map((mat, idx) => (
                          <tr key={mat.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{mat.materialName}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-600">{mat.requestedQty}</td>
                            <td className="py-2.5 px-3 text-center">
                              {canEditIssuing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={mat.issuedQty ?? 0}
                                  onChange={(e) => handleMaterialIssuedQtyChange(mat.id, Number(e.target.value) || 0)}
                                  className="w-20 text-center border border-slate-200 bg-slate-50 rounded-lg py-1 px-2 font-bold text-orange-900 focus:bg-white focus:border-orange-500"
                                />
                              ) : (
                                <span className="font-bold text-orange-950">{mat.issuedQty ?? '-'}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-500">{mat.unit}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                mat.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-800' :
                                mat.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                                mat.status === 'unavailable' ? 'bg-red-100 text-red-800' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {mat.status === 'fulfilled' ? '✓ เบิกจ่ายครบแล้ว' :
                                 mat.status === 'partial' ? '⚡ เบิกจ่ายบางส่วน' :
                                 mat.status === 'unavailable' ? '✗ ของขาด' :
                                 '⏳ รอคลังเบิกจ่าย'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Material Shortage Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-2.5">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <AlertCircle size={14} className="text-amber-600" />
                  <span>บันทึกวัสดุที่ขาด (Material Shortage Record)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ขาดกล่อง (ใบ)</label>
                    <input
                      type="number"
                      min="0"
                      value={missingBoxes || ''}
                      disabled={!canEditIssuing}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setMissingBoxes(Number(e.target.value) || 0)}
                      className="w-full text-xs font-mono font-bold tracking-tight bg-white border border-slate-300 rounded-md px-3 py-1.5 text-slate-900 shadow-2xs disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ขาดแกลลอน (ใบ)</label>
                    <input
                      type="number"
                      min="0"
                      value={missingGallons || ''}
                      disabled={!canEditIssuing}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setMissingGallons(Number(e.target.value) || 0)}
                      className="w-full text-xs font-mono font-bold tracking-tight bg-white border border-slate-300 rounded-md px-3 py-1.5 text-slate-900 shadow-2xs disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ขาดน้ำมัน (ลิตร)</label>
                    <input
                      type="number"
                      min="0"
                      value={missingOil || ''}
                      disabled={!canEditIssuing}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setMissingOil(Number(e.target.value) || 0)}
                      className="w-full text-xs font-mono font-bold tracking-tight bg-white border border-slate-300 rounded-md px-3 py-1.5 text-slate-900 shadow-2xs disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Material Receipt & Handshake Card */}
              <div className={`p-4 rounded-xl border transition-all ${
                receivedHandshake
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border font-bold text-sm ${
                      receivedHandshake
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {receivedHandshake ? '✓' : '📦'}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>สถานะการรับมอบชิ้นส่วนหน้างาน (Material Handshake Receipt)</span>
                        {receivedHandshake && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                            ✓ รับมอบเรียบร้อย
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {receivedHandshake
                          ? `ยืนยันตรวจรับชิ้นส่วนครบชุดแล้ว โดย ${receivedHandshake.receivedBy} เมื่อ ${receivedHandshake.receivedAt}`
                          : 'ฝ่ายซ่อม (PDF) หรือผู้รับมอบหน้างานต้องตรวจนับและยืนยันการรับมอบเมื่อของมาถึง'}
                      </p>
                    </div>
                  </div>

                  {!receivedHandshake && (canEditRepair || userRole === 'ADMIN' || userRole === 'PDF') && (
                    <button
                      type="button"
                      onClick={handleConfirmMaterialReceipt}
                      disabled={isSaving}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[40px]"
                    >
                      <CheckCircle2 size={15} />
                      <span>🤝 ยืนยันตรวจรับชิ้นส่วนครบชุด</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4 PANEL: PDF ซ่อมงาน & DEFEND MODE (REPAIR & DEFEND) */}
          {/* ========================================================================= */}
          {activeStep === 'repair' && (
            <div className="space-y-5">
              {/* Step Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-white border border-slate-200 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">Step 4: ช่างซ่อมบันทึกความคืบหน้า & Defend</h2>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-medium border ${
                      canEditRepair ? 'bg-sky-50 text-sky-800 border-sky-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {canEditRepair ? 'โหมดซ่อม & Defend (PDF / Admin)' : 'โหมดดูความคืบหน้า (Preview Only)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {canEditRepair
                      ? 'บันทึกยอดกล่องที่ซ่อมเสร็จจริง หรือบันทึกปัญหา Defend กรณีติดอุปสรรคหน้างาน'
                      : 'ความคืบหน้างานซ่อมของแผนก PDF (เฉพาะแผนก PDF/Admin จึงจะสามารถบันทึกยอดซ่อมได้)'}
                  </p>
                </div>

                {canEditRepair && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePDFSave(false, false)}
                      disabled={isSaving}
                      className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-all cursor-pointer"
                    >
                      บันทึกความคืบหน้า
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePDFSave(true, false)}
                      disabled={isSaving || globalCompleted < totalBoxes}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white text-xs font-medium rounded-md transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCheck size={14} />
                      <span>ปิดเคส 100% (Completed)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Progress Gauge Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>ความคืบหน้าการซ่อมรวม (Overall Progress)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ยอดเสร็จ: <strong className="text-emerald-800">{globalCompleted}</strong> จากทั้งหมด <strong>{totalBoxes}</strong> กล่อง ({completionPercentage}%)
                    </p>
                  </div>

                  {canEditRepair && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max={totalBoxes}
                        value={globalCompleted || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleGlobalProgressChange(Number(e.target.value) || 0)}
                        placeholder="ระบุยอดรวมที่เสร็จ..."
                        className="w-32 text-xs font-mono font-bold tracking-tight text-center border border-slate-300 rounded-md py-1.5 px-3 bg-white text-slate-900 shadow-2xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => handleGlobalProgressChange(totalBoxes)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-300 transition-colors cursor-pointer"
                      >
                        เสร็จทั้งหมด
                      </button>
                    </div>
                  )}
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, completionPercentage)}%` }}
                  />
                </div>
              </div>

              {/* PDF Defend Mode Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Shield size={16} className="text-rose-600" />
                      <span>PDF Defend Mode (รายงานอุปสรรค & ข้อแก้ต่างหน้างาน)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ระบุเหตุผลที่งานยังไม่เสร็จสิ้น เพื่อชี้แจงความรับผิดชอบอย่างโปร่งใส
                    </p>
                  </div>

                  {canEditRepair && (
                    <button
                      type="button"
                      onClick={() => handlePDFSave(false, true)}
                      disabled={isSaving}
                      className="px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-md transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <AlertTriangle size={13} />
                      <span>⚠️ บันทึกสถานะติดปัญหา (Defend Case)</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">หมวดหมู่ปัญหา (Defend Category)</label>
                    <Select
                      value={defendCategory}
                      disabled={!canEditRepair}
                      onValueChange={setDefendCategory}
                    >
                      <SelectTrigger className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100 disabled:text-slate-400 transition-colors">
                        <SelectValue placeholder="เลือกหมวดหมู่ปัญหา" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-slate-200 shadow-xl rounded-md p-1 z-[100]">
                        <SelectItem value="waiting_oil">รอน้ำมัน (Waiting for Oil)</SelectItem>
                        <SelectItem value="waiting_container">รอภาชนะจาก WPK (Waiting for Containers)</SelectItem>
                        <SelectItem value="waiting_label">รอฉลากจาก Supplier (Waiting for Labels)</SelectItem>
                        <SelectItem value="waiting_lab">รอผลตรวจแล็บ QSMS (Waiting for Lab)</SelectItem>
                        <SelectItem value="waiting_machine">เครื่องจักรขัดข้อง (Machine Breakdown)</SelectItem>
                        <SelectItem value="other">อื่นๆ (Other)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">บันทึกข้อแก้ต่าง / อุปสรรค (Defend Notes)</label>
                    <textarea
                      rows={2}
                      value={defendNotes}
                      disabled={!canEditRepair}
                      onChange={(e) => setDefendNotes(e.target.value)}
                      placeholder="ระบุรายละเอียด เช่น รอน้ำมันล็อตพิเศษจากคลัง แจ้งเรื่องไปเมื่อ 10:00 น. กำลังรอการจัดส่ง..."
                      className="w-full text-xs font-medium bg-white border border-slate-300 rounded-md p-2.5 disabled:bg-slate-100 disabled:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* QC Verification Gate & Final Sign-Off Card */}
              <div className={`rounded-xl border p-5 transition-all ${
                qcSignoff
                  ? 'border-emerald-300 bg-emerald-50/40 shadow-xs'
                  : 'border-slate-200 bg-white shadow-xs'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold text-lg ${
                      qcSignoff
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      🏅
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>QC Verification Gate (การตรวจรับคุณภาพและปิดเคสอย่างเป็นทางการ)</span>
                        {qcSignoff && (
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                            ✓ QC Approved
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {qcSignoff
                          ? `เคสนี้ได้รับการตรวจรับและลงนามปิดเคสเรียบร้อยแล้ว โดย ${qcSignoff.approvedBy} เมื่อ ${qcSignoff.approvedAt}`
                          : 'เมื่อยอดซ่อมเสร็จ 100% เจ้าหน้าที่ QSMS หรือ Admin สามารถตรวจสอบและลงนามรับรองผลเพื่อปิดเคส'}
                      </p>
                    </div>
                  </div>

                  {/* QC Action for Admin / QSMS */}
                  {!qcSignoff && (userRole === 'ADMIN' || userRole === 'QSMS') && globalCompleted >= totalBoxes && totalBoxes > 0 && (
                    <button
                      type="button"
                      onClick={handleQCSignoff}
                      disabled={isSaving}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[40px]"
                    >
                      <CheckCheck size={16} />
                      <span>🏅 ลงนามตรวจรับ QC & ปิดเคส</span>
                    </button>
                  )}
                </div>

                {/* Inspection Details / Input */}
                {qcSignoff ? (
                  <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs space-y-1">
                    <div className="font-bold text-emerald-900 flex items-center justify-between">
                      <span>ผลการตรวจรับ QC:</span>
                      <span className="font-normal text-slate-500 text-[11px]">{qcSignoff.approvedAt}</span>
                    </div>
                    <p className="text-emerald-800 font-medium">{qcSignoff.qcNotes || 'ตรวจรับงาน Rework ผ่านเกณฑ์คุณภาพมาตรฐาน 100%'}</p>
                    <p className="text-[11px] text-emerald-700 pt-1">ผู้ลงนามอนุมัติ: <strong>{qcSignoff.approvedBy}</strong></p>
                  </div>
                ) : (
                  (userRole === 'ADMIN' || userRole === 'QSMS') && (
                    <div className="mt-3 space-y-2">
                      <label className="block text-xs font-semibold text-slate-700">
                        บันทึกผลการตรวจสอบของ QC (QC Inspection Notes):
                      </label>
                      <textarea
                        rows={2}
                        value={qcNotesInput}
                        onChange={(e) => setQcNotesInput(e.target.value)}
                        placeholder="ระบุข้อคิดเห็น QC เช่น ตรวจสอบสภาพกล่อง แกลลอน และรอยรั่วซึมแล้ว อยู่ในเกณฑ์มาตรฐาน พร้อมส่งเข้าคลัง..."
                        className="w-full text-xs font-medium bg-white border border-slate-300 rounded-md p-2.5 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>

      {/* Export Overlay */}
      <AnimatePresence>
        {isExporting && (
          <div className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-8">
            <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-5 max-w-sm w-full text-center border border-slate-200">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Download size={20} className="text-amber-600 animate-pulse" />
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
                    className="ml-2 text-amber-300 hover:text-white underline text-[11px]"
                  >
                    เปิดขนาดเต็ม ↗
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
                  <CheckCircle2 size={16} className="animate-bounce" />
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
