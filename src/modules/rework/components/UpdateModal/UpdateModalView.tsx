import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Clock, AlertCircle, ImageOff, ExternalLink, FileText, Download, FileImage, HelpCircle, Landmark, PenTool, Calculator, Trash2, Package, Plus, FileSpreadsheet } from 'lucide-react';
import { useUpdateModal } from './UpdateModalContext';
import { CUSTOMER_OPTIONS, ReworkCase } from '@/src/services/api';
import { formatThaiDate, formatThaiDateShort, convertDMYToYMD, convertYMDToDMY, enforceNumeric } from '@/src/utils/helpers';
import { DriveImage } from '@/src/modules/storage/components/DriveImage';
import { ExportTemplate } from '@/src/modules/drawings/components/ExportTemplate';
import { AppleProgressBar } from '@/src/components/shared/AppleProgressBar';
import { UserRole } from '@/src/config/auth.config';
import { CopyButton } from '@/src/components/ui/CopyButton';


function StatusBadge({ status }: { status: ReworkCase['status'] }) {
  const styles: Record<ReworkCase['status'], string> = {
    Pending: 'bg-slate-100 text-slate-700 border-slate-200',
    'In-Progress': 'bg-sky-100 text-sky-800 border-sky-200',
    Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  const thaiLabels: Record<ReworkCase['status'], string> = {
    Pending: 'รอดำเนินการ',
    'In-Progress': 'กำลังดำเนินการ',
    Completed: 'เสร็จสิ้น',
  };

  return (
    <motion.span 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider ${styles[status]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {thaiLabels[status]}
    </motion.span>
  );
}


export function UpdateModalView() {
  const {
    caseData, isLoading, caseStatus,
    lightboxUrl, setLightboxUrl, isEditMode, setIsEditMode, editedSource, setEditedSource,
    editedItems, setEditedItems, deletedItemIds, setDeletedItemIds, expandedItemId, setExpandedItemId,
    isDeleteConfirmOpen, setIsDeleteConfirmOpen, isActionLoading, newOrFiles, setNewOrFiles,
    newImages, setNewImages, editExitIntent, editedCaseNumber, setEditedCaseNumber,
    SOURCE_OPTIONS, caseNamePrefix, caseNameYear, previewCaseName, getCaseNumber,
    handleToggleEditMode, handleSaveEdit, handleRequestClose, handleDownloadImages,
    userRole, isAdmin, isOperator, isPDB, canManageRows,
    exportRef, isExporting, exportProgress, exportExcel,
    handleUpdate, handleDelete, confirmDelete, handleRemoveItem, getStatusLabel,
    handleRequestClose: onClose, isSaving, progress, statusText, isComplete,
    missingBoxes, setMissingBoxes, missingGallons, setMissingGallons,
    missingOil, setMissingOil, handleGlobalProgressChange, handleItemProgressChange
  } = useUpdateModal();

  return (
    <>

                  <div className="relative bg-system-background w-full flex flex-col flex-1 min-h-0 overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-start px-4 sm:px-6 pt-6 sm:pt-10 pb-4 border-b border-divider-color bg-system-background z-10 shrink-0">
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-on-surface">Update Status</h1>
                        <p className="text-sm sm:text-base text-on-surface-variant mt-1 flex items-center gap-1.5">
                          <span>{previewCaseName || caseData?.id}</span>
                          {(previewCaseName || caseData?.id) && <CopyButton text={previewCaseName || caseData?.id || ''} size={13} />}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button onClick={handleRequestClose} className="text-on-surface-variant hover:bg-surface-secondary p-1.5 sm:p-2 rounded-full transition-colors focus:outline-none">
                          <X size={24} />
                        </button>
                      </div>
                    </div>

                    {/* Meta Info Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-y-3 gap-x-2 sm:gap-4 px-4 sm:px-6 py-4 border-b border-divider-color bg-surface-secondary/30 shrink-0">
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

                    <div className="w-full flex-1 overflow-y-auto custom-scrollbar bg-surface-bright">
                      <div className="max-w-4xl mx-auto flex flex-col p-4 sm:p-6 space-y-4 sm:space-y-6">

                        {/* Item Details */}
                        <div className="flex items-center gap-2 mb-2 pb-2 text-on-surface border-b border-divider-color">
                          <FileText size={20} className="text-[#0066cc]" />
                          <span className="text-base sm:text-lg font-semibold">รายการสินค้า ({caseData?.items.length})</span>
                        </div>

                      {/* Global Progress Update */}
                      {(isOperator || isAdmin) && caseStatus !== 'Completed' && (
                        <div className="mb-6 bg-surface-secondary/50 rounded-xl p-4 sm:p-5 border border-divider-color">
                          <h4 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-apple-blue-deep" />
                            อัปเดตยอดเสร็จสิ้นรวม <span className="text-on-surface-variant font-medium text-xs ml-1">(จากทั้งหมด {editedItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0)} กล่อง)</span>
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <input
                              type="number"
                              min="0"
                              max={editedItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0)}
                              placeholder="ระบุยอดรวมที่เสร็จแล้ว..."
                              className="flex-1 min-w-[140px] max-w-[220px] border border-divider-color bg-system-background rounded-lg py-2 px-3 font-semibold text-sm focus:outline-none focus:border-apple-blue-deep focus:ring-1 focus:ring-apple-blue-deep"
                              value={editedItems.reduce((acc, item) => acc + (Number(item.completedBoxes) || 0), 0) || ''}
                              onChange={(e) => {
                                handleGlobalProgressChange(Number(e.target.value) || 0);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleGlobalProgressChange(editedItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0))}
                              className="bg-apple-blue-deep/10 text-apple-blue-deep hover:bg-apple-blue-deep/20 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors shrink-0 flex items-center gap-1"
                            >
                              <CheckCircle2 size={14} />
                              สูงสุด
                            </button>
                            <span className="text-[13px] text-on-surface-variant hidden sm:inline w-full sm:w-auto mt-1 sm:mt-0">ระบบจะกระจายยอดให้อัตโนมัติ</span>
                          </div>
                        </div>
                      )}

                      {/* Material Shortage (Blockers) UI */}
                      {(isOperator || isAdmin) && (caseStatus === 'In-Progress' || caseStatus === 'Pending') && (
                        <div className="mb-6 bg-[#fff9eb] border border-amber-200 rounded-xl p-4 sm:p-5">
                          <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <AlertCircle size={18} />
                              อุปสรรค / วัสดุที่ขาด (ถ้ามี)
                            </div>
                            <span className="font-normal text-amber-700/80 text-xs">(ล้างค่าอัตโนมัติเมื่อปิดงาน)</span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-amber-700 mb-1">ขาดกล่อง (ใบ)</label>
                              <input type="number" min="0" value={missingBoxes || ''} onChange={e => setMissingBoxes(Number(e.target.value) || 0)} className="w-full border-transparent shadow-sm bg-white rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" placeholder="0" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-amber-700 mb-1">ขาดแกลลอน (ใบ)</label>
                              <input type="number" min="0" value={missingGallons || ''} onChange={e => setMissingGallons(Number(e.target.value) || 0)} className="w-full border-transparent shadow-sm bg-white rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" placeholder="0" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-amber-700 mb-1">ขาดน้ำมัน (ลิตร/ถัง)</label>
                              <input type="number" min="0" value={missingOil || ''} onChange={e => setMissingOil(Number(e.target.value) || 0)} className="w-full border-transparent shadow-sm bg-white rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" placeholder="0" />
                            </div>
                          </div>
                        </div>
                      )}

                          {editedItems.map((item, idx) => {
                            const images = item.imageUrls || [];
                            const isExpanded = expandedItemId === (item.id || idx.toString());
                            const toggleExpand = (e: React.MouseEvent) => {
                              e.stopPropagation();
                              setExpandedItemId(isExpanded ? null : (item.id || idx.toString()));
                            };
                            const boxNum = Number(item.amount) || 0;
                            const completed = caseStatus === 'Completed' ? boxNum : (Number(item.completedBoxes) || 0);
                            const isItemComplete = boxNum > 0 && completed >= boxNum;
                            const canEditProgress = (isOperator || isAdmin) && caseStatus !== 'Completed';

                            return (
                              <div key={idx} className="bg-system-background border border-[rgba(0,0,0,0.08)] rounded-xl overflow-hidden hover:border-[rgba(0,0,0,0.15)] transition-all duration-300">
                                {/* Always Visible Summary (Clickable) */}
                                <div 
                                  onClick={toggleExpand}
                                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-surface-secondary/50 transition-colors gap-4"
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className={`w-1.5 h-10 rounded-full shrink-0 ${item.reason === 'รั่ว' ? 'bg-error' : item.reason === 'เปื้อน' ? 'bg-[#ff9500]' : 'bg-[#0066cc]'}`}></div>
                                    <div className="min-w-0">
                                      <h4 className="text-[14px] font-bold text-on-surface flex items-center gap-2 flex-wrap">
                                        <span className="truncate max-w-[200px] sm:max-w-xs">{item.itemName || 'ไม่มีชื่อรายการ'}</span>
                                        {item.itemCode && (
                                          <span className="text-on-surface-variant font-medium text-[13px] flex items-center gap-1">
                                            <span>({item.itemCode})</span>
                                            <CopyButton text={item.itemCode} size={11} />
                                          </span>
                                        )}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                          item.reason === 'รั่ว' ? 'bg-error/10 text-error' : 
                                          item.reason === 'เปื้อน' ? 'bg-[#ff9500]/10 text-[#ff9500]' : 
                                          'bg-surface-variant text-on-surface-variant'
                                        }`}>
                                          {item.reason || 'ไม่ระบุสาเหตุ'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                                    <div className="flex items-center gap-2 text-[13px] font-bold" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center gap-1.5">
                                        <span className={isItemComplete ? "text-success" : "text-apple-blue-deep"}>
                                          {completed}
                                        </span>
                                        <span className="text-on-surface-variant/40">/</span>
                                        <span className="text-on-surface-variant font-semibold">
                                          {boxNum}
                                        </span>
                                        <span className="text-[11px] text-on-surface-variant/75 font-normal ml-0.5">กล่อง</span>
                                      </div>
                                      
                                      {/* Quick Max Button */}
                                      {canEditProgress && !isItemComplete && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleItemProgressChange(idx, boxNum);
                                          }}
                                          className="ml-2 bg-apple-blue-deep/10 text-apple-blue-deep hover:bg-apple-blue-deep/20 px-2 py-1 rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 sm:opacity-100 focus:opacity-100"
                                          title="เสร็จสิ้นทั้งหมด"
                                        >
                                          <CheckCircle2 size={12} />
                                          สูงสุด
                                        </button>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <div className={`p-1.5 rounded-full bg-surface-secondary text-on-surface-variant transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Collapsible Complex Fields */}
                                <AnimatePresence initial={false}>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                      className="border-t border-divider-color bg-surface-secondary/30 overflow-hidden"
                                    >
                                      <div className="p-5 flex flex-col gap-8">
                                        
                                        {/* Basic Info Group */}
                                        <div>
                                          <h4 className="text-[13px] font-semibold text-on-surface mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#0066cc]"></div>
                                            ข้อมูลทั่วไป & อาการเสีย
                                          </h4>
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className="space-y-1">
                                              <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">ชื่อรายการ</label>
                                              <div className="text-[15px] font-medium text-on-surface">{item.itemName || '-'}</div>
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">รหัสสินค้า</label>
                                              <div className="text-[15px] font-medium text-on-surface">{item.itemCode || '-'}</div>
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">ลูกค้า</label>
                                              <div className="text-[15px] font-medium text-on-surface">{item.customerName || '-'}</div>
                                            </div>
                                            <div className="space-y-1 md:col-span-2 lg:col-span-3">
                                              <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">อาการเสีย / รายละเอียดเพิ่มเติม</label>
                                              <div className="text-[15px] font-medium text-on-surface whitespace-pre-wrap">{item.details || '-'}</div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="h-px bg-divider-color/50 w-full"></div>

                                        {/* Images & Amount Group */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                          <div>
                                            <h4 className="text-[13px] font-semibold text-on-surface mb-4 flex items-center gap-2">
                                              <div className="w-1.5 h-1.5 rounded-full bg-[#0066cc]"></div>
                                              จำนวนสินค้า
                                            </h4>
                                            <div className="space-y-2">
                                              {canEditProgress ? (
                                                <>
                                                  <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">ยอดเสร็จ / รวม (ชิ้น)</label>
                                                  <div className="flex flex-wrap items-center gap-2">
                                                    <input
                                                      type="number"
                                                      min="0"
                                                      max={boxNum}
                                                      placeholder="ยอดที่เสร็จแล้ว..."
                                                      className="w-[120px] border border-divider-color bg-white rounded-lg py-1.5 px-3 font-semibold text-[13px] focus:outline-none focus:border-apple-blue-deep focus:ring-1 focus:ring-apple-blue-deep transition-all"
                                                      value={completed || ''}
                                                      onChange={(e) => {
                                                        const val = Math.min(Math.max(0, Number(e.target.value) || 0), boxNum);
                                                        handleItemProgressChange(idx, val);
                                                      }}
                                                    />
                                                    <span className="text-on-surface-variant font-semibold text-[13px]">/ {boxNum}</span>
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleItemProgressChange(idx, boxNum);
                                                      }}
                                                      className="bg-apple-blue-deep/10 text-apple-blue-deep hover:bg-apple-blue-deep/20 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0 ml-1"
                                                    >
                                                      <CheckCircle2 size={14} />
                                                      สูงสุด
                                                    </button>
                                                  </div>
                                                </>
                                              ) : (
                                                <>
                                                  <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">จำนวน (ชิ้น)</label>
                                                  <div className="text-[15px] font-medium text-on-surface">{completed} / {item.amount || '-'}</div>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                          
                                          <div>
                                            <h4 className="text-[13px] font-semibold text-on-surface mb-4 flex justify-between items-center">
                                              <span className="flex items-center gap-2">รูปภาพแนบ ({images.length})</span>
                                              {images.length > 0 && (
                                                <button
                                                  onClick={() => handleDownloadImages(images, item.itemName)}
                                                  className="text-[#0066cc] hover:underline normal-case text-xs font-semibold flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                                                >
                                                  <Download size={12} /> ดาวน์โหลดรูปภาพ
                                                </button>
                                              )}
                                            </h4>
                                            {images.length > 0 ? (
                                              <div className="flex gap-2 flex-wrap items-start">
                                                {images.map((url, i) => (
                                                  <div key={i} onClick={() => setLightboxUrl(url)} className="relative w-14 h-14 rounded-lg overflow-hidden bg-surface-secondary border border-divider-color cursor-pointer hover:opacity-80 transition-opacity">
                                                    <DriveImage src={url} alt="Item" className="w-full h-full object-cover" />
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <div className="text-sm text-on-surface-variant italic">ไม่มีรูปภาพ</div>
                                            )}
                                          </div>
                                        </div>

                                        <div className="h-px bg-divider-color/50 w-full"></div>

                                        {/* Production Group */}
                                        <div>
                                          <h4 className="text-[13px] font-semibold text-on-surface mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-apple-blue-deep"></div>
                                            ข้อมูลการผลิต
                                          </h4>
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <div className="space-y-1">
                                              <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Batch No.</label>
                                              <div className="text-[15px] font-medium text-on-surface flex items-center gap-1.5">
                                                <span>{item.batchNo || '-'}</span>
                                                {item.batchNo && <CopyButton text={item.batchNo} size={12} />}
                                              </div>
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">วันที่ผลิตแกลลอน</label>
                                              <div className="text-[15px] font-medium text-on-surface">{item.gallonDate || '-'}</div>
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">ยอดกล่อง (เสร็จ/รวม)</label>
                                              <div className="text-[15px] font-medium text-on-surface">
                                                <span className={Number(item.completedBoxes) >= Number(item.amount) && Number(item.amount) > 0 ? 'text-success' : 'text-[#0066cc]'}>{item.completedBoxes || 0}</span> / {item.amount || '-'}
                                              </div>
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Mold / Line</label>
                                              <div className="text-[15px] font-medium text-on-surface">{item.mold || '-'} / {item.line || '-'}</div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="h-px bg-divider-color/50 w-full"></div>

                                        {/* Responsibility Group */}
                                        <div>
                                          <h4 className="text-[13px] font-semibold text-on-surface mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#ff9500]"></div>
                                            สาเหตุและผู้รับผิดชอบ
                                          </h4>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                              <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">สาเหตุหลัก (Reason)</label>
                                              <div className="text-[15px] font-medium text-on-surface">{item.reason || '-'}</div>
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">ประเภทย่อย (Subtype)</label>
                                              <div className="text-[15px] font-medium text-on-surface">{item.reasonSubtype || '-'}</div>
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">ผู้รับผิดชอบ (Responsible)</label>
                                              <div className="text-[15px] font-medium text-on-surface">{item.responsible || '-'}</div>
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">แผนก (Subdivision)</label>
                                              <div className="text-[15px] font-medium text-on-surface">{item.responsibleSubtype || '-'}</div>
                                            </div>
                                          </div>
                                        </div>
                                        
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
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

                      </div> {/* End of Scrollable Content */}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-divider-color bg-system-background px-4 sm:px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 rounded-b-none sm:rounded-b-[16px] shadow-[0_-4px_16px_rgba(0,0,0,0.02)] z-10">
                      
                      {/* Left Side: Export Buttons (Desktop) or Bottom row (Mobile) */}
                      <div className="flex gap-4 items-center w-full md:w-auto justify-center md:justify-start order-3 md:order-1 border-t md:border-t-0 border-divider-color/50 pt-3 md:pt-0">
                        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider md:hidden mr-1">ส่งออก:</span>
                        <button onClick={() => caseData && exportExcel(caseData)} disabled={isExporting || !caseData} className="text-sm font-semibold text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-surface-secondary">
                          <FileSpreadsheet size={16} /> <span className="inline">Excel</span>
                        </button>
                      </div>

                      {/* Right Side: Status Group + Actions Group */}
                      <div className="flex flex-col md:flex-row items-center w-full md:w-auto gap-4 order-1 md:order-2">
                        
                        {isAdmin && (
                          <button
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="text-[13px] sm:text-sm font-semibold text-[#ff3b30] hover:bg-[#fff2f2] px-3 py-1.5 md:py-2 rounded-xl transition-all mr-auto md:mr-2 flex items-center gap-1.5"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        )}
                        
                        {/* Segmented Control Status Update Removed per user request */}
                        
                        {/* Divider - visible only when horizontal */}
                        <div className="hidden md:block h-6 w-[1px] bg-divider-color" />

                        {/* Control Buttons */}
                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                          {isAdmin && (
                            <button onClick={handleToggleEditMode} className="flex-1 md:flex-none bg-surface-secondary text-on-surface hover:bg-surface-variant text-[13px] sm:text-sm px-4 py-2.5 rounded-xl font-bold transition-colors border border-divider-color whitespace-nowrap">
                              {isEditMode ? 'ยกเลิกแก้' : 'แก้ไข'}
                            </button>
                          )}
                          <button onClick={onClose} className="flex-1 md:flex-none bg-surface-secondary text-on-surface hover:bg-surface-variant text-[13px] sm:text-sm px-4 py-2.5 rounded-xl font-bold transition-colors border border-divider-color whitespace-nowrap">
                            ปิด
                          </button>
                          {isSaving ? (
                            <div className="w-32 sm:w-48 shrink-0"><AppleProgressBar progress={progress} statusText={statusText} isComplete={isComplete} /></div>
                          ) : (
                            <button
                              onClick={handleUpdate}
                              disabled={(() => {
                                if (isLoading || !caseData) return true;
                                if (newOrFiles.length > 0 && (isOperator || isAdmin)) return false;
                                if ((caseData.status === 'Pending' || caseData.status === 'In-Progress') && !isPDB && !isOperator && !isAdmin) return true;
                                if (caseData.status === 'Completed' && !isAdmin) return true;
                                return false;
                              })()}
                              className="bg-[#0066cc] text-white hover:bg-[#0055aa] shadow-md text-[13px] sm:text-sm px-5 py-2.5 rounded-xl font-bold flex-1 md:flex-none justify-center whitespace-nowrap transition-colors disabled:opacity-50"
                            >
                              {isEditMode ? 'บันทึก' : 'อัปเดต'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>


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
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
                  <Download size={24} className="text-accent animate-pulse" />
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
