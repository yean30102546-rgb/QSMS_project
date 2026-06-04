'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Clock, AlertCircle, ImageOff, ExternalLink, FileText, Download, FileImage, HelpCircle, Landmark, PenTool, Calculator, Trash2, Package, Plus, FileSpreadsheet } from 'lucide-react';
import { ReworkCase, CUSTOMER_OPTIONS, MaterialUsage } from '../../services/api';
import { formatThaiDate, formatThaiDateShort, enforceNumeric, convertDMYToYMD, convertYMDToDMY } from '../../utils/helpers';
import { useExportReport } from '../../hooks/useExportReport';
import { ExportTemplate } from '../ui/ExportTemplate';
import { DriveImage } from '../ui/DriveImage';
import { getCurrentUserRole } from '../../services/auth';
import { UserRole } from '../../config/auth.config';
import { AppleProgressBar } from '../ui/AppleProgressBar';
import { useSaveProgress } from '../../hooks/useSaveProgress';

interface UpdateModalProps {
  isOpen: boolean;
  caseData: ReworkCase | null;
  isLoading: boolean;
  onClose: () => void;
  onUpdate: (caseId: string, updates: Partial<ReworkCase>) => Promise<void>;
  onDelete?: (caseId: string) => Promise<void>;
}

const STANDARD_MATERIALS = ['บรรจุภัณฑ์', 'แกลลอน', 'ฝา', 'สติ๊กเกอร์', 'ชริ้งค์ ลาเบล', 'ของแถม'];

export function UpdateModal({
  isOpen,
  caseData,
  isLoading,
  onClose,
  onUpdate,
  onDelete,
}: UpdateModalProps) {
  const { progress, isSaving, statusText, isComplete, startSaving, finishSaving, failSaving } = useSaveProgress();
  const [caseStatus, setCaseStatus] = useState<ReworkCase['status']>(
    caseData?.status || 'Pending'
  );
  const [resolutionMethod, setResolutionMethod] = useState('');
  const [reworkCost, setReworkCost] = useState<number | string>('');

  // State สำหรับ lightbox (ดูรูปเต็มจอ)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Administrative Edit Mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedSource, setEditedSource] = useState('');
  const [editedItems, setEditedItems] = useState<ReworkCase['items']>([]);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Delete Confirmation State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // New Fields
  const [newOrFiles, setNewOrFiles] = useState<File[]>([]);
  const [newImages, setNewImages] = useState<Record<string, File[]>>({});

  // Materials Management
  const [materials, setMaterials] = useState<MaterialUsage[]>([]);
  const [editExitIntent, setEditExitIntent] = useState(false);
  const [editedCaseNumber, setEditedCaseNumber] = useState('');
  const SOURCE_OPTIONS = ['SFC', 'Customer'];
  const caseNamePrefix = editedSource === 'Customer' ? 'RT' : 'RW';
  const caseNameYear = new Date().getFullYear().toString().slice(2);
  const previewCaseName = caseData?.caseName || caseData?.id;
  const getCaseNumber = (caseName?: string, id?: string) => caseName || id || 'Unknown';
  const handleToggleEditMode = () => setIsEditMode(!isEditMode);
  const handleSaveEdit = () => handleUpdate();
  const handleSaveStatus = () => handleUpdate();

  const handleRequestClose = () => {
    if (isEditMode) {
      if (window.confirm('คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการปิดใช่หรือไม่?')) {
        setIsEditMode(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Labor Management State
  const [laborCount, setLaborCount] = useState<number | string>('');
  const [laborHours, setLaborHours] = useState<number | string>('');
  const [laborRate, setLaborRate] = useState<number | string>('');

  const userRole = getCurrentUserRole();
  const isAdmin = userRole === UserRole.QSMS;
  const isFinance = userRole === UserRole.FINANCE || isAdmin;
  const isOperator = userRole === UserRole.OPERATOR || isAdmin;
  const isPDB = isOperator;
  const isRestrictedRole = userRole === UserRole.OPERATOR;
  const isStrictOperator = isRestrictedRole && !isAdmin;
  const canManageRows = isOperator || isAdmin;
  const canEditMaterialNameQty = isOperator || isAdmin;
  const canEditUnitPrice = isFinance || isAdmin;
  const canViewFinancialData = !isStrictOperator;

  // ===== Export Hook =====
  const { exportRef, isExporting, exportProgress, exportPNG, exportPDF, exportExcel } = useExportReport();

  // Fix layout shift by managing body overflow
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      return () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (caseData) {
      setCaseStatus(caseData.status);
      setResolutionMethod(caseData.resolutionMethod || '');
      setReworkCost(caseData.reworkCost || '');
      setEditedSource(caseData.source);
      setEditedItems([...caseData.items]);
      setDeletedItemIds([]);
      setNewOrFiles([]);
      setMaterials(caseData.materials ? [...caseData.materials] : []);
      setLaborCount(caseData.laborCount !== undefined && caseData.laborCount !== null ? caseData.laborCount : '');
      setLaborHours(caseData.laborHours !== undefined && caseData.laborHours !== null ? caseData.laborHours : '');
      setLaborRate(caseData.laborRate !== undefined && caseData.laborRate !== null ? caseData.laborRate : '');
    }
  }, [caseData]);

  // Auto-calculate grand total of materials and labor to populate Rework Cost (Grand Total)
  useEffect(() => {
    const matTotal = materials.reduce((sum, mat) => {
      const qty = Number(mat.quantity) || 0;
      const price = Number(mat.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);

    const lCount = Number(laborCount) || 0;
    const lHours = Number(laborHours) || 0;
    const lRate = Number(laborRate) || 0;
    const laborTotal = lCount * lHours * lRate;

    const grandTotal = matTotal + laborTotal;

    if (materials.length > 0 || laborTotal > 0) {
      setReworkCost(Number(grandTotal.toFixed(2)));
    }
  }, [materials, laborCount, laborHours, laborRate]);

  const handleAddMaterial = () => {
    const newMat: MaterialUsage = {
      id: `mat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: STANDARD_MATERIALS[0],
      quantity: 1,
      unit: 'ชิ้น',
      unitPrice: 0,
      totalPrice: 0
    };
    setMaterials(prev => [...prev, newMat]);
  };

  const handleMaterialChange = (id: string, field: keyof MaterialUsage, value: any) => {
    setMaterials(prev => prev.map(mat => {
      if (mat.id !== id) return mat;
      const updated = { ...mat, [field]: value };

      // Auto-calculate total price for the row
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = Number(updated.quantity) || 0;
        const price = Number(updated.unitPrice) || 0;
        updated.totalPrice = qty * price;
      }
      return updated;
    }));
  };

  const handleRemoveMaterial = (id: string) => {
    setMaterials(prev => prev.filter(mat => mat.id !== id));
  };

  const handleUpdate = async () => {
    if (!caseData) return;

    startSaving();

    try {
      const updates: Partial<ReworkCase> & { newOrFiles?: File[]; deleteItemIds?: string[] } = {};

      // Unified status transition logic
      let targetStatus = (isAdmin || isOperator) ? caseStatus : caseData.status;

      // Auto-transition rules (apply if not explicitly overridden by admin or operator to a NEW status)
      const isExplicitOverride = (isAdmin || isOperator) && caseStatus !== caseData.status;

      if (!isExplicitOverride) {
        if (caseData.status === 'Pending') {
          const hasMaterials = materials.length > 0;
          const hasLabor = (Number(laborHours) || 0) > 0 && (Number(laborCount) || 0) > 0;
          if (resolutionMethod.trim() !== '' || hasMaterials || hasLabor) {
            targetStatus = 'Awaiting Valuation';
          } else if (!isAdmin) {
            // Non-admins move to In-Progress just by opening/viewing/saving notes
            targetStatus = 'In-Progress';
          }
        } else if (caseData.status === 'In-Progress') {
          const hasMaterials = materials.length > 0;
          const hasLabor = (Number(laborHours) || 0) > 0 && (Number(laborCount) || 0) > 0;
          if (resolutionMethod.trim() !== '' || hasMaterials || hasLabor) {
            targetStatus = 'Awaiting Valuation';
          }
        } else if (caseData.status === 'Awaiting Valuation') {
          targetStatus = 'Completed';
        }
      }

      updates.status = targetStatus;
      if (isOperator || isAdmin) {
        updates.resolutionMethod = resolutionMethod;
      }
      if (isAdmin) {
        updates.source = editedSource;
      }

      if (reworkCost !== '' && (isFinance || isAdmin)) {
        updates.reworkCost = Number(reworkCost);
      }

      if (isPDB || isAdmin) {
        updates.items = editedItems;
      }

      if (canManageRows || canEditUnitPrice || isAdmin) {
        updates.materials = materials;
      }

      if (isOperator || isAdmin) {
        if (laborCount !== '') {
          updates.laborCount = Number(laborCount);
        } else {
          updates.laborCount = 0;
        }
        if (laborHours !== '') {
          updates.laborHours = Number(laborHours);
        } else {
          updates.laborHours = 0;
        }
      }

      if (isFinance || isAdmin) {
        if (laborRate !== '') {
          updates.laborRate = Number(laborRate);
        } else {
          updates.laborRate = 0;
        }
      }

      // Handle OR Files in updates
      if (newOrFiles.length > 0) {
        updates.newOrFiles = newOrFiles;
      }

      if (deletedItemIds.length > 0) {
        updates.deleteItemIds = deletedItemIds;
      }

      await onUpdate(caseData.id, updates);
      finishSaving();
      setIsEditMode(false);
    } catch (error) {
      console.error('Update failed:', error);
      failSaving();
    }
  };

  const handleDelete = () => {
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!caseData || !onDelete) return;
    setIsActionLoading(true);
    try {
      await onDelete(caseData.id);
      setIsDeleteConfirmOpen(false);
      onClose(); // Close the main modal after deletion
    } catch (error) {
      console.error('Delete failed:', error);
      alert('ไม่สามารถลบรายการได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (editedItems.length <= 1) {
      alert('ต้องมีอย่างน้อย 1 รายการในงานนี้');
      return;
    }
    if (window.confirm('คุณต้องการลบรายการย่อยนี้ใช่หรือไม่?')) {
      const itemToDelete = editedItems[index];
      const idToDelete = itemToDelete.uid || itemToDelete.id;

      if (idToDelete) {
        setDeletedItemIds(prev => [...prev, idToDelete]);
      }

      const newItems = editedItems.filter((_, i) => i !== index);
      setEditedItems(newItems);
    }
  };

  const getStatusIcon = (status: ReworkCase['status']) => {
    switch (status) {
      case 'Pending': return <AlertCircle size={20} className="mx-auto mb-2" />;
      case 'In-Progress': return <Clock size={20} className="mx-auto mb-2" />;
      case 'Awaiting Valuation': return <Landmark size={20} className="mx-auto mb-2" />;
      case 'Completed': return <CheckCircle2 size={20} className="mx-auto mb-2" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: ReworkCase['status']) => {
    switch (status) {
      case 'Pending': return 'รอดำเนินการ';
      case 'In-Progress': return 'กำลังดำเนินการ';
      case 'Awaiting Valuation': return 'รอประเมินราคา';
      case 'Completed': return 'เสร็จสิ้น';
      default: return status;
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleRequestClose}
              className="fixed inset-0 bg-black/35  z-40 will-change-opacity"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none will-change-transform"
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{
                  opacity: editExitIntent ? 0.6 : 1,
                  y: 0,
                  scale: editExitIntent ? 0.98 : 1,
                }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden={!!editExitIntent}
                className="pointer-events-auto w-full max-w-5xl max-h-[90vh] will-change-transform flex"
              >
                {isEditMode ? (
                  /* =========================================
                     EDIT MODE SCREEN (Prototype Style)
                     ========================================= */
                  <div className="relative bg-system-background w-full rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-divider-color flex flex-col max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-divider-color bg-surface-secondary/50 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-apple-blue-deep/10 flex items-center justify-center">
                          <PenTool size={16} className="text-apple-blue-deep" />
                        </div>
                        <h2 className="text-xl font-semibold text-on-surface">Edit Mode</h2>
                        <span className="text-sm text-on-surface-variant font-medium bg-surface-variant px-3 py-1 rounded-full">
                          {previewCaseName || caseData?.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {isSaving && <AppleProgressBar progress={progress} statusText={statusText} isComplete={isComplete} />}
                        {!isSaving && (
                          <>
                            <button onClick={handleRequestClose} className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors">
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              disabled={isLoading || !isAdmin}
                              className="px-5 py-2 text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#0055aa] rounded-full shadow-sm transition-all disabled:opacity-50"
                            >
                              Save Changes
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="overflow-y-auto flex-1 custom-scrollbar p-6 bg-surface-bright space-y-6">

                      {/* Case Info - Edit */}
                      <div className="bg-system-background border border-divider-color rounded-xl p-6 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 mb-4 border-b border-divider-color pb-3">
                          <AlertCircle size={18} className="text-on-surface-variant" />
                          <h3 className="text-base font-semibold text-on-surface">Case Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">แหล่งที่มา</label>
                            <select
                              value={editedSource}
                              onChange={(e) => setEditedSource(e.target.value)}
                              className="apple-input w-full bg-surface-secondary px-4 py-2.5 text-base font-semibold rounded-lg text-on-surface"
                            >
                              {SOURCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">เลขที่เคส</label>
                            <div className="flex items-center bg-surface-secondary rounded-lg border border-divider-color focus-within:ring-[3px] focus-within:ring-blue-500/30 transition-all overflow-hidden">
                              <span className="pl-4 py-2.5 text-base font-semibold text-on-surface-variant">{caseNamePrefix}</span>
                              <input
                                value={editedCaseNumber}
                                onChange={(e) => setEditedCaseNumber(enforceNumeric(e.target.value))}
                                className="w-full bg-transparent px-2 py-2.5 text-base font-bold text-center outline-none text-on-surface"
                              />
                              <span className="pr-4 py-2.5 text-base font-semibold text-on-surface-variant">-{caseNameYear}</span>
                            </div>
                          </div>
                        </div>

                        {/* Files Section */}
                        {(editedItems.every(i => i.customerName === 'OR')) && (
                          <div className="pt-4 border-t border-divider-color space-y-3">
                            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">เอกสาร OR</label>
                            <div className="flex flex-wrap items-center gap-3">
                              {caseData?.orFilesUrls?.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-full text-[#0066cc] text-sm font-semibold hover:bg-surface-variant transition-colors">
                                  <ExternalLink size={14} /> OR {i + 1}
                                </a>
                              ))}
                              <div className="flex items-center gap-2 bg-surface-secondary rounded-full px-4 py-2 hover:bg-surface-variant transition-colors cursor-pointer border border-dashed border-divider-color">
                                <input type="file" multiple accept=".xlsx,.xls,.pdf,.png" onChange={(e) => setNewOrFiles(Array.from(e.target.files || []).slice(0, 2))} className="hidden" id="or-upload" />
                                <label htmlFor="or-upload" className="text-sm font-semibold text-on-surface cursor-pointer w-full h-full flex items-center">{newOrFiles.length > 0 ? `เลือก ${newOrFiles.length} ไฟล์` : '+ เพิ่มไฟล์ OR'}</label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      
                      {/* Item Details - Edit */}
                      <div className="bg-system-background border border-divider-color rounded-xl p-6 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 mb-4 border-b border-divider-color pb-3">
                          <FileText size={18} className="text-[#0066cc]" />
                          <h3 className="text-base font-semibold text-on-surface">รายการสินค้า ({editedItems.length})</h3>
                        </div>

                        <div className="space-y-4">
                          {editedItems.map((item, index) => {
                            const isExpanded = expandedItemId === item.id || (expandedItemId === index.toString());
                            const toggleExpand = () => setExpandedItemId(isExpanded ? null : (item.id || index.toString()));

                            return (
                              <div key={item.id || index} className="border border-divider-color rounded-xl bg-surface-bright overflow-hidden transition-all duration-300">
                                
                                {/* Always Visible Summary */}
                                <div className="p-5 flex flex-col md:flex-row gap-4 items-start md:items-stretch">
                                  <div className="flex-1 space-y-4 w-full">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">ชื่อรายการ</label>
                                        <input
                                          value={item.itemName || ''}
                                          onChange={(e) => {
                                            const newItems = [...editedItems];
                                            newItems[index] = { ...newItems[index], itemName: e.target.value };
                                            setEditedItems(newItems);
                                          }}
                                          className="apple-input w-full bg-system-background px-3 py-2.5 text-sm font-semibold text-on-surface rounded-lg"
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">ลูกค้า</label>
                                        <select
                                          value={item.customerName || ''}
                                          onChange={(e) => {
                                            const newItems = [...editedItems];
                                            newItems[index] = { ...newItems[index], customerName: e.target.value };
                                            setEditedItems(newItems);
                                          }}
                                          className="apple-input w-full bg-system-background px-3 py-2.5 text-sm font-semibold text-on-surface rounded-lg"
                                        >
                                          <option value="">เลือกสีลูกค้า</option>
                                          {CUSTOMER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-4">
                                      <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">อาการเสีย / รายละเอียด</label>
                                        <textarea
                                          value={item.details || ''}
                                          onChange={(e) => {
                                            const newItems = [...editedItems];
                                            newItems[index] = { ...newItems[index], details: e.target.value };
                                            setEditedItems(newItems);
                                          }}
                                          rows={2}
                                          className="apple-input w-full bg-system-background p-3 text-sm font-medium text-on-surface rounded-lg resize-none"
                                        />
                                      </div>
                                      <div className="space-y-1.5 flex flex-col items-end">
                                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider w-full text-right">จำนวน</label>
                                        <div className="flex items-center justify-end gap-2 w-full">
                                          <input
                                            type="number"
                                            value={item.amount || ''}
                                            onChange={(e) => {
                                              const newItems = [...editedItems];
                                              newItems[index] = { ...newItems[index], amount: Number(e.target.value) };
                                              setEditedItems(newItems);
                                            }}
                                            className="apple-input w-full bg-system-background px-2 py-2.5 text-center text-sm font-bold text-on-surface rounded-lg"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="w-full md:w-48 flex flex-col items-end gap-3 shrink-0 h-full justify-between">
                                    <div className="w-full flex-1 border border-divider-color rounded-lg bg-system-background p-2">
                                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1.5 text-center">รูปภาพ ({((item.imageUrls || []).length - deletedItemIds.filter(u => (item.imageUrls||[]).includes(u)).length) + (newImages[item.id || index.toString()] || []).length})</label>
                                      <div className="flex gap-2 flex-wrap min-h-[50px] items-start justify-center">
                                        {(item.imageUrls || []).map((url, i) => {
                                          const isDeleted = deletedItemIds.includes(url);
                                          return (
                                            <div key={i} className="relative group w-10 h-10 rounded-md overflow-hidden bg-surface-secondary">
                                              <img src={url} alt="item" className={`w-full h-full object-cover ${isDeleted ? 'opacity-30 grayscale' : ''}`} />
                                              <button 
                                                onClick={() => {
                                                  if (isDeleted) {
                                                    setDeletedItemIds(prev => prev.filter(u => u !== url));
                                                  } else {
                                                    setDeletedItemIds(prev => [...prev, url]);
                                                  }
                                                }}
                                                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                {isDeleted ? <Plus size={16} className="text-white" /> : <X size={16} className="text-white" />}
                                              </button>
                                              {isDeleted && <div className="absolute inset-0 border-2 border-error rounded-md" />}
                                            </div>
                                          );
                                        })}
                                        
                                        {/* New images */}
                                        {(newImages[item.id || index.toString()] || []).map((file, i) => (
                                          <div key={`new-${i}`} className="relative group w-10 h-10 rounded-md overflow-hidden bg-blue-50 border-2 border-[#0066cc]/40">
                                            <img src={URL.createObjectURL(file)} alt="new" className="w-full h-full object-cover" />
                                            <button 
                                              onClick={() => {
                                                const newImgs = { ...newImages };
                                                newImgs[item.id || index.toString()] = newImgs[item.id || index.toString()].filter((_, idx) => idx !== i);
                                                setNewImages(newImgs);
                                              }}
                                              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              <X size={16} className="text-white" />
                                            </button>
                                          </div>
                                        ))}

                                        <label className="w-10 h-10 rounded-md border-2 border-dashed border-divider-color flex items-center justify-center cursor-pointer hover:bg-surface-variant transition-colors text-on-surface-variant shrink-0">
                                          <Plus size={16} />
                                          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            if (files.length > 0) {
                                              setNewImages(prev => ({
                                                ...prev,
                                                [item.id || index.toString()]: [...(prev[item.id || index.toString()] || []), ...files]
                                              }));
                                            }
                                          }} />
                                        </label>
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-2 w-full mt-1">
                                      <button onClick={() => handleRemoveItem(index)} className="p-2 text-error hover:bg-error-container/30 rounded-lg transition-colors border border-transparent hover:border-error/20" title="ลบรายการ">
                                        <Trash2 size={16} />
                                      </button>
                                      <button 
                                        onClick={toggleExpand}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-[13px] font-semibold text-[#0066cc] bg-[#0066cc]/10 hover:bg-[#0066cc]/20 rounded-lg transition-colors"
                                      >
                                        {isExpanded ? 'ย่อรายละเอียด' : 'รายละเอียดเพิ่มเติม'}
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Collapsible Complex Fields */}
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="border-t border-divider-color bg-surface-secondary/40 overflow-hidden"
                                    >
                                      <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-1.5">
                                          <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Batch No.</label>
                                          <input
                                            type="text"
                                            value={item.batchNo || ''}
                                            onChange={(e) => {
                                              const newItems = [...editedItems];
                                              newItems[index] = { ...newItems[index], batchNo: e.target.value };
                                              setEditedItems(newItems);
                                            }}
                                            className="apple-input w-full bg-system-background px-3 py-2 text-sm font-medium text-on-surface rounded-lg"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">วันที่ผลิตแกลลอน</label>
                                          <input
                                            type="date"
                                            value={item.gallonDate ? convertDMYToYMD(item.gallonDate) : ''}
                                            onChange={(e) => {
                                              const newItems = [...editedItems];
                                              newItems[index] = { ...newItems[index], gallonDate: convertYMDToDMY(e.target.value) };
                                              setEditedItems(newItems);
                                            }}
                                            className="apple-input w-full bg-system-background px-3 py-2 text-sm font-medium text-on-surface rounded-lg"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Box Number</label>
                                          <input
                                            type="text"
                                            value={item.boxNumber || ''}
                                            onChange={(e) => {
                                              const newItems = [...editedItems];
                                              newItems[index] = { ...newItems[index], boxNumber: e.target.value };
                                              setEditedItems(newItems);
                                            }}
                                            className="apple-input w-full bg-system-background px-3 py-2 text-sm font-medium text-on-surface rounded-lg"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Mold</label>
                                          <input
                                            type="text"
                                            value={item.mold || ''}
                                            onChange={(e) => {
                                              const newItems = [...editedItems];
                                              newItems[index] = { ...newItems[index], mold: e.target.value };
                                              setEditedItems(newItems);
                                            }}
                                            className="apple-input w-full bg-system-background px-3 py-2 text-sm font-medium text-on-surface rounded-lg"
                                          />
                                        </div>
                                        <div className="space-y-1.5">
                                          <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Line</label>
                                          <input
                                            type="text"
                                            value={item.line || ''}
                                            onChange={(e) => {
                                              const newItems = [...editedItems];
                                              newItems[index] = { ...newItems[index], line: e.target.value };
                                              setEditedItems(newItems);
                                            }}
                                            className="apple-input w-full bg-system-background px-3 py-2 text-sm font-medium text-on-surface rounded-lg"
                                          />
                                        </div>
                                        
                                        <div className="space-y-1.5 col-span-2">
                                          <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">สาเหตุ (Reason)</label>
                                          <input
                                            type="text"
                                            value={item.reason || ''}
                                            onChange={(e) => {
                                              const newItems = [...editedItems];
                                              newItems[index] = { ...newItems[index], reason: e.target.value };
                                              setEditedItems(newItems);
                                            }}
                                            placeholder="เช่น รั่ว, เปื้อน"
                                            className="apple-input w-full bg-system-background px-3 py-2 text-sm font-medium text-on-surface rounded-lg"
                                          />
                                        </div>
                                        <div className="space-y-1.5 col-span-2">
                                          <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">ประเภทย่อย (Subtype)</label>
                                          <input
                                            type="text"
                                            value={item.reasonSubtype || ''}
                                            onChange={(e) => {
                                              const newItems = [...editedItems];
                                              newItems[index] = { ...newItems[index], reasonSubtype: e.target.value };
                                              setEditedItems(newItems);
                                            }}
                                            placeholder="เช่น รั่วซึม, กล่องเปื้อน"
                                            className="apple-input w-full bg-system-background px-3 py-2 text-sm font-medium text-on-surface rounded-lg"
                                          />
                                        </div>

                                        <div className="space-y-1.5 col-span-2">
                                          <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">ผู้รับผิดชอบ (Responsible)</label>
                                          <input
                                            type="text"
                                            value={item.responsible || ''}
                                            onChange={(e) => {
                                              const newItems = [...editedItems];
                                              newItems[index] = { ...newItems[index], responsible: e.target.value };
                                              setEditedItems(newItems);
                                            }}
                                            placeholder="เช่น SFC, Customer, Supplier"
                                            className="apple-input w-full bg-system-background px-3 py-2 text-sm font-medium text-on-surface rounded-lg"
                                          />
                                        </div>
                                        <div className="space-y-1.5 col-span-2">
                                          <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">แผนก (Subdivision)</label>
                                          <input
                                            type="text"
                                            value={item.responsibleSubtype || ''}
                                            onChange={(e) => {
                                              const newItems = [...editedItems];
                                              newItems[index] = { ...newItems[index], responsibleSubtype: e.target.value };
                                              setEditedItems(newItems);
                                            }}
                                            placeholder="เช่น PDF, WPK"
                                            className="apple-input w-full bg-system-background px-3 py-2 text-sm font-medium text-on-surface rounded-lg"
                                          />
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Labor Management - Edit */}
                      {(isOperator || isAdmin) && (
                        <div className="bg-system-background border border-divider-color rounded-xl p-6 shadow-sm space-y-6">
                          <div className="flex items-center gap-2 mb-4 border-b border-divider-color pb-3">
                            <Clock size={18} className="text-[#0066cc]" />
                            <h3 className="text-base font-semibold text-on-surface">การจัดการเวลาทำงาน (Labor)</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">จำนวนพนักงาน (คน)</label>
                              <select
                                value={laborCount}
                                onChange={(e) => setLaborCount(e.target.value === '' ? '' : Number(e.target.value))}
                                disabled={!canEditMaterialNameQty}
                                className="apple-input w-full bg-surface-secondary px-4 py-2.5 text-base font-semibold rounded-lg"
                              >
                                <option value="">เลือกจำนวน</option>
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} คน</option>)}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">ชั่วโมงที่ใช้ (ชม.)</label>
                              <input
                                type="number"
                                min="0" step="0.5"
                                value={laborHours === undefined || laborHours === null || laborHours.toString() === 'NaN' ? '' : laborHours}
                                onChange={(e) => setLaborHours(e.target.value === '' ? '' : Number(e.target.value))}
                                disabled={!canEditMaterialNameQty}
                                placeholder="0.0"
                                className="apple-input w-full bg-surface-secondary px-4 py-2.5 text-base font-semibold rounded-lg"
                              />
                            </div>
                            {canViewFinancialData && (
                              <div className="space-y-2">
                                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">อัตราค่าแรง (บาท/ชม.)</label>
                                <div className="relative">
                                  <input
                                    type="number" min="0" step="1"
                                    value={laborRate === undefined || laborRate === null || laborRate.toString() === 'NaN' ? '' : laborRate}
                                    onChange={(e) => setLaborRate(e.target.value === '' ? '' : Number(e.target.value))}
                                    disabled={!canEditUnitPrice}
                                    placeholder="0"
                                    className="apple-input w-full bg-surface-secondary pl-8 pr-4 py-2.5 text-base font-semibold rounded-lg"
                                  />
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-on-surface-variant font-semibold">฿</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Material Management - Edit */}
                      {(isOperator || isAdmin) && (
                        <div className="bg-system-background border border-divider-color rounded-xl p-6 shadow-sm space-y-6">
                          <div className="flex items-center justify-between mb-4 border-b border-divider-color pb-3">
                            <div className="flex items-center gap-2">
                              <Package size={18} className="text-[#0066cc]" />
                              <h3 className="text-base font-semibold text-on-surface">รายการวัสดุที่ใช้ (Materials)</h3>
                            </div>
                            {canManageRows && (
                              <button onClick={handleAddMaterial} className="apple-button text-sm bg-surface-secondary hover:bg-surface-variant text-[#0066cc]">
                                + เพิ่มวัสดุ
                              </button>
                            )}
                          </div>

                          {materials.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider border-b border-divider-color">
                                    <th className="pb-3 px-2">ชื่อวัสดุ</th>
                                    <th className="pb-3 px-2 text-center w-24">จำนวน</th>
                                    <th className="pb-3 px-2 text-center w-16">หน่วย</th>
                                    {canViewFinancialData && <th className="pb-3 px-2 text-right w-32">ราคา/หน่วย</th>}
                                    {canManageRows && <th className="pb-3 w-10"></th>}
                                  </tr>
                                </thead>
                                <tbody>
                                  {materials.map((mat) => (
                                    <tr key={mat.id} className="border-b border-divider-color/50 last:border-0 group">
                                      <td className="py-2 px-2">
                                        <select
                                          value={mat.name}
                                          onChange={(e) => handleMaterialChange(mat.id, 'name', e.target.value)}
                                          disabled={!canEditMaterialNameQty}
                                          className="apple-input w-full bg-surface-bright px-2 py-1.5 text-sm font-medium"
                                        >
                                          {STANDARD_MATERIALS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                      </td>
                                      <td className="py-2 px-2">
                                        <input
                                          type="number"
                                          value={mat.quantity || ''}
                                          onChange={(e) => handleMaterialChange(mat.id, 'quantity', Number(e.target.value))}
                                          disabled={!canEditMaterialNameQty}
                                          className="apple-input w-full bg-surface-bright px-1 py-1.5 text-center text-sm font-medium"
                                        />
                                      </td>
                                      <td className="py-2 px-2 text-center text-sm text-on-surface-variant">{mat.unit}</td>
                                      {canViewFinancialData && (
                                        <td className="py-2 px-2">
                                          <input
                                            type="number"
                                            value={mat.unitPrice || ''}
                                            onChange={(e) => handleMaterialChange(mat.id, 'unitPrice', Number(e.target.value))}
                                            disabled={!canEditUnitPrice}
                                            className="apple-input w-full bg-surface-bright px-2 py-1.5 text-right text-sm font-medium"
                                          />
                                        </td>
                                      )}
                                      {canManageRows && (
                                        <td className="py-2 text-right">
                                          <button onClick={() => handleRemoveMaterial(mat.id)} className="p-1.5 text-error opacity-50 hover:opacity-100 hover:bg-error-container/30 rounded-full transition-all">
                                            <Trash2 size={16} />
                                          </button>
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="py-6 text-center border border-dashed border-divider-color rounded-lg text-on-surface-variant">
                              <p className="text-sm font-medium">ไม่มีรายการวัสดุ</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Workflow / Resolution - Edit */}
                      {(isOperator || isAdmin) && (
                        <div className="bg-system-background border border-divider-color rounded-xl p-6 shadow-sm space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <PenTool size={18} className="text-[#0066cc]" />
                            <h3 className="text-base font-semibold text-on-surface">วิธีแก้ไขปัญหา (Resolution Method)</h3>
                          </div>
                          <textarea
                            value={resolutionMethod}
                            onChange={(e) => setResolutionMethod(e.target.value)}
                            placeholder="ระบุรายละเอียดการแก้ไขปัญหา..."
                            className="apple-input w-full bg-surface-secondary p-4 rounded-lg text-sm font-medium text-on-surface min-h-[100px] leading-relaxed"
                          />
                        </div>
                      )}

                    </div>
                  </div>
                ) : (
                  /* =========================================
                     VIEW MODE SCREEN (Prototype Style)
                     ========================================= */
                  <div className="bg-system-background rounded-[16px] w-full max-w-5xl flex flex-col shadow-[0_24px_48px_rgba(0,0,0,0.12)] border border-[rgba(0,0,0,0.08)] overflow-hidden max-h-[90vh]">
                    {/* Header */}
                    <div className="flex justify-between items-start px-6 pt-10 pb-4 border-b border-divider-color bg-system-background z-10 shrink-0">
                      <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-on-surface">Update Status</h1>
                        <p className="text-base text-on-surface-variant mt-1">{previewCaseName || caseData?.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <button
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="text-sm font-semibold text-[#ff3b30] bg-[#fff2f2] px-4 py-2 rounded-full hover:bg-[#ff3b30]/10 transition-all"
                          >
                            Delete
                          </button>
                        )}
                        <button onClick={handleRequestClose} className="text-on-surface-variant hover:bg-surface-secondary p-2 rounded-full transition-colors focus:outline-none">
                          <X size={24} />
                        </button>
                      </div>
                    </div>

                    {/* Meta Info Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-6 py-4 border-b border-divider-color bg-surface-secondary/30 shrink-0">
                      <div>
                        <div className="flex items-center gap-1.5 text-on-surface-variant mb-1">
                          <span className="text-sm font-medium">Source</span>
                        </div>
                        <div className="text-base font-medium text-on-surface">{caseData?.source}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-on-surface-variant mb-1">
                          <span className="text-sm font-medium">Case Number</span>
                        </div>
                        <div className="text-base font-medium text-on-surface">{getCaseNumber(caseData?.caseName, caseData?.id)}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-on-surface-variant mb-1">
                          <span className="text-sm font-medium">Date</span>
                        </div>
                        <div className="text-base font-medium text-on-surface">{formatThaiDate(caseData?.timestamp || caseData?.date)}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-on-surface-variant mb-1">
                          <span className="text-sm font-medium">Quantity</span>
                        </div>
                        <div className="text-base font-medium text-on-surface">{caseData?.items?.length} รายการ</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-on-surface-variant mb-1">
                          <span className="text-sm font-medium">Status</span>
                        </div>
                        {caseData && <StatusBadge status={caseStatus} />}
                      </div>
                    </div>

                    {/* Section Header */}
                    <div className="px-6 py-3 bg-surface-secondary/50 border-b border-divider-color shrink-0 flex items-center gap-2 text-on-surface">
                      <FileText size={20} />
                      <span className="text-lg font-semibold">Item Details</span>
                    </div>

                    {/* Scrollable Content */}
                    <div className="overflow-y-auto flex-1 custom-scrollbar p-6 bg-surface-bright space-y-6">

                      {caseData?.items.map((item, idx) => {
                        const images = item.imageUrls || [];
                        return (
                          <div key={idx} className="bg-system-background border border-[rgba(0,0,0,0.08)] rounded-xl p-5 hover:border-[rgba(0,0,0,0.15)] transition-colors">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-semibold text-on-surface text-base">{item.itemName}</h3>
                                <div className="text-sm text-on-surface-variant mt-1 flex gap-2 items-center">
                                  <span className="bg-surface-secondary px-2 py-0.5 rounded-full font-medium">{item.customerName || 'N/A'}</span>
                                  <span>SN: {item.itemNumber || '-'}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-on-surface text-lg">{item.amount} <span className="text-sm text-on-surface-variant font-normal">pcs</span></div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-divider-color/50">
                              <div>
                                <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Details</h4>
                                <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap break-words">{item.details || 'ไม่มีข้อมูล'}</p>
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 flex justify-between">
                                  <span>Images ({images.length})</span>
                                  {item.imageFolderUrl && <a href={item.imageFolderUrl} target="_blank" rel="noopener noreferrer" className="text-[#0066cc] hover:underline normal-case">Drive</a>}
                                </h4>
                                {images.length > 0 ? (
                                  <div className="flex gap-2 overflow-x-auto pb-2">
                                    {images.map((url, i) => (
                                      <div key={i} onClick={() => setLightboxUrl(url)} className="w-16 h-16 rounded-lg overflow-hidden shrink-0 cursor-pointer border border-divider-color hover:opacity-80 transition-opacity">
                                        <DriveImage src={url} alt="Item" className="w-full h-full object-cover" />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-sm text-on-surface-variant italic">ไม่มีรูปภาพ</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Display OR Files if exist */}
                      {caseData?.orFilesUrls && caseData.orFilesUrls.length > 0 && (
                        <div className="bg-system-background border border-[rgba(0,0,0,0.08)] rounded-xl p-5">
                          <h4 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-3">เอกสาร OR</h4>
                          <div className="flex gap-3">
                            {caseData.orFilesUrls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-full text-[#0066cc] text-sm font-semibold hover:bg-surface-variant transition-colors">
                                <ExternalLink size={14} /> OR {i + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Financial / Workflow Section in View Mode */}
                      {(isOperator || isAdmin || isFinance) && (
                        <div className="bg-system-background border border-[rgba(0,0,0,0.08)] rounded-xl p-5 space-y-6">
                          <div className="flex items-center gap-2 mb-2 border-b border-divider-color pb-3">
                            <Landmark size={18} className="text-[#0066cc]" />
                            <h3 className="text-base font-semibold text-on-surface">Workflow & Financials</h3>
                          </div>

                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              {(['Pending', 'In-Progress', 'Awaiting Valuation', 'Completed'] as const).map((status) => {
                                const isActive = caseStatus === status;
                                const isAllowed = isAdmin || (
                                  isOperator &&
                                  (caseData?.status === 'Pending' || caseData?.status === 'In-Progress') &&
                                  (status === 'Pending' || status === 'In-Progress')
                                );
                                return (
                                  <button
                                    key={status}
                                    type="button"
                                    disabled={!isAllowed}
                                    onClick={() => setCaseStatus(status)}
                                    className={`px-4 py-1.5 rounded-full font-medium text-sm transition-all border ${isActive
                                      ? 'bg-apple-blue-deep text-white border-apple-blue-deep shadow-sm'
                                      : isAllowed
                                        ? 'bg-surface-secondary text-on-surface border-divider-color hover:bg-surface-variant'
                                        : 'bg-transparent text-on-surface-variant border-transparent cursor-not-allowed opacity-50'
                                      }`}
                                  >
                                    {getStatusLabel(status)}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Operator resolution text block */}
                            {(caseData?.status === 'Pending' || caseData?.status === 'In-Progress') && isOperator && (
                              <div className="space-y-2 mt-4">
                                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">วิธีแก้ไขปัญหา (Resolution Method)</label>
                                <textarea
                                  value={resolutionMethod}
                                  onChange={(e) => setResolutionMethod(e.target.value)}
                                  placeholder="ระบุรายละเอียดการแก้ไขปัญหา..."
                                  className="apple-input w-full bg-surface-secondary p-4 rounded-lg text-sm font-medium text-on-surface min-h-[80px]"
                                />
                              </div>
                            )}

                            {/* Finance valuation input block */}
                            {caseData?.status === 'Awaiting Valuation' && isFinance && (
                              <div className="space-y-4 mt-4 bg-surface-bright p-4 rounded-lg border border-divider-color">
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">วิธีแก้ไขปัญหา (Read-only)</label>
                                  <p className="text-sm font-medium text-on-surface">{resolutionMethod || '-'}</p>
                                </div>
                                <div className="space-y-1 pt-3 border-t border-divider-color">
                                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">ราคาประเมินจริง (Actual Cost)</label>
                                  <div className="relative max-w-xs">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-on-surface font-semibold">฿</span>
                                    <input
                                      type="number"
                                      value={reworkCost}
                                      onChange={(e) => setReworkCost(e.target.value)}
                                      disabled={userRole !== UserRole.FINANCE && !isAdmin}
                                      placeholder="0.00"
                                      className="apple-input w-full bg-system-background pl-8 pr-4 py-2 text-base font-semibold rounded-lg text-on-surface"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Grand Total display if available */}
                            {canViewFinancialData && reworkCost !== '' && (
                              <div className="flex justify-between items-center bg-surface-variant/50 p-4 rounded-lg mt-2">
                                <span className="text-sm font-semibold text-on-surface">Grand Total (Rework Cost)</span>
                                <span className="text-lg font-bold text-apple-blue-deep">฿{Number(reworkCost).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                              </div>
                            )}

                          </div>
                        </div>
                      )}

                    </div>

                    {/* Footer */}
                    <div className="border-t border-divider-color bg-system-background px-6 py-4 flex justify-between items-center shrink-0 rounded-b-[16px]">
                      <div className="flex gap-4 items-center">
                        <button onClick={() => caseData && exportPNG(caseData.id)} disabled={isExporting || !caseData} className="text-sm font-semibold text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-colors">
                          <FileImage size={16} /> PNG
                        </button>
                        <button onClick={() => caseData && exportExcel(caseData)} disabled={isExporting || !caseData} className="text-sm font-semibold text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-colors">
                          <FileSpreadsheet size={16} /> Excel
                        </button>
                        <button onClick={() => {
                          if (caseData) {
                            exportPDF({
                              ...caseData,
                              source: editedSource,
                              status: caseStatus,
                              resolutionMethod: resolutionMethod,
                              reworkCost: Number(reworkCost),
                              items: editedItems
                            });
                          }
                        }} disabled={isExporting || !caseData} className="text-sm font-semibold text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-colors">
                          <Download size={16} /> PDF
                        </button>
                      </div>

                      <div className="flex gap-3 items-center">
                        {isAdmin && (
                          <button onClick={handleToggleEditMode} className="apple-button bg-surface-secondary text-on-surface hover:bg-surface-variant text-sm">
                            Edit Mode
                          </button>
                        )}
                        {isSaving ? (
                          <div className="w-48"><AppleProgressBar progress={progress} statusText={statusText} isComplete={isComplete} /></div>
                        ) : (
                          <button
                            onClick={handleSaveStatus}
                            disabled={(() => {
                              if (isLoading || !caseData) return true;
                              if (newOrFiles.length > 0 && (isOperator || isFinance || isAdmin)) return false;
                              if (caseData.status === 'Awaiting Valuation' && !isFinance) return true;
                              if ((caseData.status === 'Pending' || caseData.status === 'In-Progress') && !isPDB && !isOperator) return true;
                              if (caseData.status === 'Completed' && !isAdmin) return true;
                              return false;
                            })()}
                            className="apple-button apple-button-primary shadow-md text-sm"
                          >
                            Save Status
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* Lightbox component remains same */}
      <AnimatePresence>
        {lightboxUrl && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLightboxUrl(null)}
              className="fixed inset-0 bg-black/90 z-[100] cursor-zoom-out "
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-12"
              onClick={() => setLightboxUrl(null)}
            >
              <DriveImage
                src={lightboxUrl}
                alt="Fullscreen Preview"
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl select-none"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                onClick={() => setLightboxUrl(null)}
                className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors border border-white/20"
              >
                <X size={24} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Export Overlay */}
      <AnimatePresence>
        {isExporting && (
          <div className="fixed inset-0 z-[120] bg-slate-900/80  flex items-center justify-center p-8">
            <div className="bg-white rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full text-center">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-accent/10 border-t-accent rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Download size={24} className="text-accent animate-bounce" />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 mb-1">กำลังเตรียมเอกสาร...</h4>
                <p className="text-sm text-slate-500">{exportProgress}</p>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-full bg-accent"
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
          source: editedSource,
          status: caseStatus,
          resolutionMethod: resolutionMethod,
          reworkCost: Number(reworkCost),
          items: editedItems
        } : null}
      />

      {/* ===== Delete Confirmation Modal ===== */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="fixed inset-0 bg-slate-900/60  z-[200] will-change-opacity"
            />
            <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="pointer-events-auto w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-red-100 flex flex-col"
              >
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <AlertCircle size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900">ยืนยันการลบรายการ</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      คุณต้องการลบรายการ <span className="font-bold text-slate-700">{caseData?.id}</span> ใช่หรือไม่?
                      การลบข้อมูลนี้จะไม่สามารถกู้คืนได้
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 grid grid-cols-2 gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(false)}
                    className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={isActionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-200 disabled:opacity-50"
                  >
                    {isActionLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        กำลังลบ...
                      </>
                    ) : (
                      'ลบรายการจริง'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function StatusBadge({ status }: { status: ReworkCase['status'] }) {
  const styles: Record<ReworkCase['status'], string> = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    'In-Progress': 'bg-blue-50 text-blue-700 border-blue-200',
    'Awaiting Valuation': 'bg-purple-50 text-purple-700 border-purple-200',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const thaiLabels: Record<ReworkCase['status'], string> = {
    Pending: 'รอดำเนินการ',
    'In-Progress': 'กำลังดำเนินการ',
    'Awaiting Valuation': 'รอประเมินราคา',
    Completed: 'เสร็จสิ้น',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${styles[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {thaiLabels[status]}
    </span>
  );
}
