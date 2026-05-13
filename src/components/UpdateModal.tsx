import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Clock, AlertCircle, ImageOff, ExternalLink, FileText, Download, FileImage, HelpCircle, Landmark, PenTool, Calculator, Trash2 } from 'lucide-react';
import { ReworkCase, CUSTOMER_OPTIONS } from '../services/api';
import { formatThaiDate } from '../utils/helpers';
import { useExportReport } from '../hooks/useExportReport';
import { ExportTemplate } from './ExportTemplate';
import { DriveImage } from './DriveImage';
import { getCurrentUserRole } from '../services/auth';
import { UserRole } from '../config/auth.config';

interface UpdateModalProps {
  isOpen: boolean;
  caseData: ReworkCase | null;
  isLoading: boolean;
  onClose: () => void;
  onUpdate: (caseId: string, updates: Partial<ReworkCase>) => Promise<void>;
  onDelete?: (caseId: string) => Promise<void>;
}

export function UpdateModal({
  isOpen,
  caseData,
  isLoading,
  onClose,
  onUpdate,
  onDelete,
}: UpdateModalProps) {
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

  // Delete Confirmation State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // New Fields
  const [newOrFiles, setNewOrFiles] = useState<File[]>([]);

  const userRole = getCurrentUserRole();
  const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.QSMS;
  const isFinance = userRole === UserRole.FINANCE || isAdmin;
  const isWFG = userRole === UserRole.WFG || isAdmin;

  // ===== Export Hook =====
  const { exportRef, isExporting, exportProgress, exportPNG, exportPDF } = useExportReport();

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
      setNewOrFiles([]);
    }
  }, [caseData]);

  const handleUpdate = async () => {
    if (!caseData) return;

    const updates: Partial<ReworkCase> & { newOrFiles?: File[] } = {};

    // Auto-transition logic based on role and current state
    if (isAdmin) {
      // Admin can manually override status via the selector
      updates.status = caseStatus;
      updates.source = editedSource;
      if (resolutionMethod.trim() !== '') updates.resolutionMethod = resolutionMethod;
      if (reworkCost !== '') updates.reworkCost = Number(reworkCost);
      updates.items = editedItems;
    } else {
      // Flow-based transitions for WFG and Finance
      if (caseData.status === 'Pending') {
        if (resolutionMethod.trim() !== '') {
          updates.status = 'Awaiting Valuation';
        } else {
          updates.status = 'In-Progress';
        }
      } else if (caseData.status === 'In-Progress') {
        if (resolutionMethod.trim() !== '') {
          updates.status = 'Awaiting Valuation';
        }
      } else if (caseData.status === 'Awaiting Valuation') {
        if (reworkCost !== '' && Number(reworkCost) > 0) {
          updates.status = 'Completed';
        }
      }

      if (resolutionMethod.trim() !== '') {
        updates.resolutionMethod = resolutionMethod;
      }
      
      if (reworkCost !== '' && (isFinance || isAdmin)) {
        updates.reworkCost = Number(reworkCost);
      }

      if (isWFG || isAdmin) {
        updates.items = editedItems;
      }
    }

    // Handle OR Files in updates
    if (newOrFiles.length > 0) {
      updates.newOrFiles = newOrFiles;
    }

    await onUpdate(caseData.id, updates);
    setIsEditMode(false);
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
            {/* Backdrop - quick fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/40 z-40 will-change-opacity"
            />

            {/* Modal - slide-up quickly */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none will-change-transform"
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="pointer-events-auto w-full max-w-3xl max-h-[90vh] will-change-transform"
              >
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200/80 max-h-[90vh] flex flex-col">
                  {/* Header */}
                  <div className="bg-slate-50 px-8 py-6 flex items-center justify-between border-b border-slate-200">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">อัปเดตสถานะงาน</h2>
                      <p className="text-sm text-muted mt-1">{caseData?.id}</p>
                    </div>
                    <motion.button
                      type="button"
                      onClick={onClose}
                      disabled={isLoading}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      className="p-2 hover:bg-white rounded-lg disabled:opacity-50 will-change-transform"
                    >
                      <X size={20} className="text-foreground" />
                    </motion.button>
                  </div>

                  {/* Content — scrollable */}
                  <div className="px-8 py-6 space-y-8 overflow-y-auto flex-1">
                    {/* Case Info */}
                    {caseData && (
                      <div className="bg-slate-50 rounded-xl p-6 space-y-4 shadow-inner border border-slate-100">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">แหล่งที่มา</p>
                            {isEditMode ? (
                              <input 
                                value={editedSource} 
                                onChange={(e) => setEditedSource(e.target.value)}
                                className="w-full px-2 py-1 text-sm border rounded bg-white font-bold"
                              />
                            ) : (
                              <p className="text-sm font-bold text-foreground">{caseData.source}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">วันที่</p>
                            <p className="text-sm font-bold text-foreground">{formatThaiDate(caseData.date)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">จำนวนรายการ</p>
                            <p className="text-sm font-bold text-foreground">{caseData.items.length} รายการ</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">สถานะปัจจุบัน</p>
                            <StatusBadge status={caseData.status} />
                          </div>
                        </div>

                        {/* Customer Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-slate-200/50">
                           <div className="col-span-1">
                              <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">ลูกค้า</p>
                              <p className="text-sm font-bold text-slate-400 italic">แยกตามรายการ</p>
                           </div>
                           {(editedItems.every(i => i.customerName === 'OR')) && (
                             <div className="col-span-3">
                                <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">เอกสาร OR</p>
                                <div className="flex flex-wrap gap-2">
                                   {caseData.orFilesUrls && caseData.orFilesUrls.map((url, i) => (
                                     <a 
                                       key={i} 
                                       href={url} 
                                       target="_blank" 
                                       rel="noopener noreferrer"
                                       className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 hover:bg-amber-100 transition-colors"
                                     >
                                       <ExternalLink size={12} />
                                       ไฟล์ OR {i + 1}
                                     </a>
                                   ))}
                                   {(!caseData.orFilesUrls || caseData.orFilesUrls.length === 0) && !isEditMode && (
                                     <span className="text-xs text-red-500 font-bold italic">ยังไม่มีการแนบไฟล์</span>
                                   )}
                                   {isEditMode && (
                                     <div className="flex items-center gap-3">
                                        <input 
                                          type="file" 
                                          multiple 
                                          accept=".xlsx,.xls,.pdf,.png"
                                          onChange={(e) => setNewOrFiles(Array.from(e.target.files || []).slice(0, 2))}
                                          className="text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-accent file:text-white"
                                        />
                                        {newOrFiles.length > 0 && (
                                          <span className="text-[10px] text-accent font-bold">เลือก {newOrFiles.length} ไฟล์ใหม่</span>
                                        )}
                                     </div>
                                   )}
                                </div>
                             </div>
                           )}
                        </div>
                      </div>
                    )}

                    {/* ===== รายละเอียดและรูปภาพแนบ แบ่งตาม Item ===== */}
                    {caseData && (
                      <div className="space-y-5">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-accent" />
                          <label className="text-[10px] font-bold text-muted uppercase tracking-[0.1em]">
                            รายละเอียดและรูปภาพแนบ
                          </label>
                        </div>

                        {editedItems.map((item, index) => {
                          const images = item.imageUrls || [];
                          return (
                            <div key={item.id || index} className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                  <div className="flex items-center gap-3 flex-1">
                                    <span className="w-7 h-7 rounded-lg bg-accent text-white text-xs font-black flex items-center justify-center shadow-sm shrink-0">
                                      {index + 1}
                                    </span>
                                    <div className="flex-1">
                                      {isEditMode ? (
                                        <div className="flex flex-col gap-2">
                                          <input 
                                            value={item.itemName} 
                                            onChange={(e) => {
                                              const newItems = [...editedItems];
                                              newItems[index] = { ...newItems[index], itemName: e.target.value };
                                              setEditedItems(newItems);
                                            }}
                                            placeholder="ชื่อรายการ"
                                            className="w-full text-sm font-bold px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                                          />
                                          <div className="flex gap-2">
                                            <input 
                                              value={item.itemNumber} 
                                              onChange={(e) => {
                                                const newItems = [...editedItems];
                                                newItems[index] = { ...newItems[index], itemNumber: e.target.value };
                                                setEditedItems(newItems);
                                              }}
                                              placeholder="Item Number / Batch"
                                              className="flex-1 text-[10px] font-mono font-bold px-3 py-1 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                                            />
                                            <select
                                              value={item.customerName || ''}
                                              onChange={(e) => {
                                                const newItems = [...editedItems];
                                                newItems[index] = { ...newItems[index], customerName: e.target.value };
                                                setEditedItems(newItems);
                                              }}
                                              className="w-24 text-[10px] font-bold border border-slate-200 rounded-lg bg-white px-2 py-1"
                                            >
                                              <option value="">ลูกค้า</option>
                                              {CUSTOMER_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                              ))}
                                            </select>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-foreground">{item.itemName || item.itemNumber}</p>
                                            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-[8px] font-black uppercase text-slate-600">
                                              {item.customerName || 'N/A'}
                                            </span>
                                          </div>
                                          <p className="text-[10px] text-muted font-bold">{item.itemCode}</p>
                                        </>
                                      )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      {isEditMode ? (
                                        <div className="flex items-center gap-2">
                                          <input 
                                            type="number"
                                            value={item.amount === undefined || item.amount === null || item.amount.toString() === 'NaN' ? '' : item.amount}
                                            onChange={(e) => {
                                              const newItems = [...editedItems];
                                              const val = e.target.value;
                                              newItems[index] = { ...newItems[index], amount: val === '' ? '' as any : Number(val) };
                                              setEditedItems(newItems);
                                            }}
                                            className="w-16 px-2 py-1 text-center text-[10px] font-bold border border-slate-200 rounded-lg bg-white"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="ลบรายการย่อย"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                                          {item.amount} ชิ้น
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                {item.linkedSourceId && (
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
                                    <HelpCircle size={14} className="text-amber-600" />
                                    <span className="text-[10px] font-bold text-amber-800">Linked to leaking source</span>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">อาการเสีย/รายละเอียด:</p>
                                  {isEditMode || isWFG ? (
                                    <textarea 
                                      value={item.details || ''} 
                                      onChange={(e) => {
                                        const newItems = [...editedItems];
                                        newItems[index] = { ...newItems[index], details: e.target.value };
                                        setEditedItems(newItems);
                                      }}
                                      className="w-full bg-white p-3 rounded-xl border border-slate-200 text-sm text-slate-700 min-h-[60px] focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
                                    />
                                  ) : (
                                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-sm text-slate-700 min-h-[60px] whitespace-pre-wrap leading-relaxed shadow-sm">
                                      {item.details || <span className="text-slate-400 italic">ไม่มีข้อมูล</span>}
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">รูปภาพแนบ ({images.length}):</p>
                                  {images.length > 0 ? (
                                    <div className="grid grid-cols-4 gap-2">
                                      {images.map((url, imgIdx) => (
                                        <motion.button
                                          key={imgIdx}
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => setLightboxUrl(url)}
                                          className="aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-white"
                                        >
                                          <DriveImage src={url} alt="Rework" className="w-full h-full object-cover" />
                                        </motion.button>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="bg-white p-4 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                                      <ImageOff size={20} className="mb-1 opacity-20" />
                                      <span className="text-[10px] font-bold">ไม่มีรูปภาพ</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ===== UPDATE WORKFLOW SECTION ===== */}
                    <div className="space-y-6 pt-4">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-accent" />
                        <label className="text-[10px] font-bold text-muted uppercase tracking-[0.1em]">
                          จัดการสถานะและขั้นตอนงาน
                        </label>
                      </div>

                      {/* Status Selector (Disabled for flow control, but showing for visibility) */}
                      <div className="grid grid-cols-4 gap-4">
                        {(['Pending', 'In-Progress', 'Awaiting Valuation', 'Completed'] as const).map((status) => {
                          const isActive = caseStatus === status;
                          const isAllowed = isAdmin; // Only admin can manually jump statuses
                          return (
                            <button
                              key={status}
                              type="button"
                              disabled={!isAllowed}
                              onClick={() => setCaseStatus(status)}
                              className={`p-4 rounded-2xl border-2 font-bold text-center transition-all flex flex-col items-center justify-center gap-1 ${isActive
                                ? 'border-accent bg-accent/5 text-accent shadow-lg shadow-accent/5'
                                : isAllowed 
                                  ? 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 hover:text-slate-600'
                                  : 'border-slate-100 bg-slate-50 text-slate-300 opacity-50 cursor-not-allowed'
                                }`}
                            >
                              {getStatusIcon(status)}
                              <span className="text-[10px] leading-tight">{getStatusLabel(status)}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Input fields based on status */}
                      <AnimatePresence mode="wait">
                        {(caseData?.status === 'Pending' || caseData?.status === 'In-Progress') && isWFG && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3 bg-blue-50/50 p-6 rounded-2xl border border-blue-100"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <PenTool size={16} className="text-blue-600" />
                              <label className="text-xs font-bold text-blue-900">วิธีแก้ไขปัญหา (Resolution Method) *</label>
                            </div>
                            <textarea
                              value={resolutionMethod}
                              onChange={(e) => setResolutionMethod(e.target.value)}
                              placeholder="กรอกรายละเอียดการแก้ไขปัญหา..."
                              className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none min-h-[100px]"
                            />
                            <div className="flex flex-col gap-1">
                              <p className="text-[10px] text-blue-600 font-bold">💡 สถานะปัจจุบัน: {getStatusLabel(caseData.status)}</p>
                              <p className="text-[10px] text-blue-600 font-bold">⚠️ เมื่อกรอกวิธีแก้ไขและบันทึก สถานะจะเปลี่ยนเป็น "รอประเมินราคา" อัตโนมัติ</p>
                            </div>
                          </motion.div>
                        )}

                        {caseData?.status === 'Awaiting Valuation' && isFinance && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-5 bg-purple-50/50 p-6 rounded-2xl border border-purple-100"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <PenTool size={14} className="text-slate-400" />
                                <label className="text-[10px] font-bold text-muted uppercase">วิธีแก้ไขปัญหา (Read-only)</label>
                              </div>
                              <div className="bg-white/50 px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-600">
                                {resolutionMethod || '-'}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Calculator size={16} className="text-purple-600" />
                                <label className="text-xs font-bold text-purple-900">ราคาประเมิน (Rework Cost) *</label>
                              </div>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={reworkCost}
                                  onChange={(e) => setReworkCost(e.target.value)}
                                  disabled={userRole !== UserRole.FINANCE && !isAdmin}
                                  placeholder="0.00"
                                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-purple-200 bg-white text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none font-bold"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 font-bold">฿</span>
                                {userRole !== UserRole.FINANCE && !isAdmin && (
                                  <div className="mt-2 flex items-center gap-1.5 text-red-500">
                                    <AlertCircle size={12} />
                                    <span className="text-[10px] font-bold uppercase">เฉพาะฝ่ายการเงินเท่านั้นที่สามารถระบุราคาได้</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className="text-[10px] text-purple-600 font-bold">⚠️ เมื่อบันทึก สถานะจะเปลี่ยนเป็น "เสร็จสิ้น" อัตโนมัติ</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Footer — ปุ่ม Export + ปุ่ม Action */}
                  <div className="bg-slate-50 px-8 py-5 flex items-center justify-between border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => caseData && exportPNG(caseData.id)}
                        disabled={isExporting || !caseData}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-40"
                      >
                        <FileImage size={14} /> PNG
                      </button>
                      <button
                        type="button"
                        onClick={() => caseData && exportPDF(caseData.id)}
                        disabled={isExporting || !caseData}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-40"
                      >
                        <Download size={14} /> PDF
                      </button>
                    </div>

                    <div className="flex gap-3">
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => setIsEditMode(!isEditMode)}
                            disabled={isLoading}
                            className={`px-6 py-2.5 rounded-xl border text-sm font-semibold transition-colors disabled:opacity-50 ${
                              isEditMode 
                              ? 'bg-amber-50 border-amber-200 text-amber-700' 
                              : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {isEditMode ? 'ยกเลิกการแก้ไข' : 'แก้ไขข้อมูล'}
                          </button>
                          <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="px-6 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 active:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            ลบรายการ
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-50"
                      >
                        ยกเลิก
                      </button>
                      <motion.button
                        type="button"
                        onClick={handleUpdate}
                        disabled={(() => {
                          if (isLoading || !caseData) return true;
                          if (caseData.status === 'Awaiting Valuation' && !isFinance) return true;
                          if ((caseData.status === 'Pending' || caseData.status === 'In-Progress') && !isWFG) return true;
                          if (caseData.status === 'Completed' && !isAdmin) return true;
                          return false;
                        })()}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="px-8 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-slate-900 active:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                      >
                        {isLoading ? (
                          <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> กำลังบันทึก...</>
                        ) : 'ยืนยันการบันทึก'}
                      </motion.button>
                    </div>
                  </div>
                </div>
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
              className="fixed inset-0 bg-black/90 z-[100] cursor-zoom-out backdrop-blur-sm"
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
          <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-8">
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
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] will-change-opacity"
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
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${styles[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {thaiLabels[status]}
    </span>
  );
}
