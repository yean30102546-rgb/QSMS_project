import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Clock, AlertCircle, ImageOff, ExternalLink, FileText, Download, FileImage, HelpCircle, Landmark, PenTool, Calculator, Trash2, Package, Plus, FileSpreadsheet } from 'lucide-react';
import { useUpdateModal, STANDARD_MATERIALS } from './UpdateModalContext';
import { CUSTOMER_OPTIONS, ReworkCase } from '@/src/services/api';
import { formatThaiDate, formatThaiDateShort, convertDMYToYMD, convertYMDToDMY, enforceNumeric } from '@/src/utils/helpers';
import { DriveImage } from '@/src/modules/storage/components/DriveImage';
import { ExportTemplate } from '@/src/modules/drawings/components/ExportTemplate';
import { AppleProgressBar } from '@/src/components/shared/AppleProgressBar';
import { UserRole } from '@/src/config/auth.config';


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
    caseData, isLoading, caseStatus, setCaseStatus, resolutionMethod, setResolutionMethod, reworkCost, setReworkCost,
    lightboxUrl, setLightboxUrl, isEditMode, setIsEditMode, editedSource, setEditedSource,
    editedItems, setEditedItems, deletedItemIds, setDeletedItemIds, expandedItemId, setExpandedItemId,
    isDeleteConfirmOpen, setIsDeleteConfirmOpen, isActionLoading, newOrFiles, setNewOrFiles,
    newImages, setNewImages, materials, setMaterials, editExitIntent, editedCaseNumber, setEditedCaseNumber,
    SOURCE_OPTIONS, caseNamePrefix, caseNameYear, previewCaseName, getCaseNumber,
    handleToggleEditMode, handleSaveEdit, handleRequestClose, handleDownloadImages,
    laborCount, setLaborCount, laborHours, setLaborHours, laborRate, setLaborRate,
    userRole, isAdmin, isFinance, isOperator, isPDB, canManageRows, canEditMaterialNameQty, canEditUnitPrice, canViewFinancialData,
    exportRef, isExporting, exportProgress, exportPNG, exportPDF, exportExcel,
    handleAddMaterial, handleMaterialChange, handleRemoveMaterial, handleUpdate, handleDelete, confirmDelete, handleRemoveItem, getStatusLabel,
    handleRequestClose: onClose, isSaving, progress, statusText, isComplete
  } = useUpdateModal();

  return (
    <>

                  <div className="relative bg-system-background w-full flex flex-col flex-1 min-h-0 overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-start px-4 sm:px-6 pt-6 sm:pt-10 pb-4 border-b border-divider-color bg-system-background z-10 shrink-0">
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-on-surface">Update Status</h1>
                        <p className="text-sm sm:text-base text-on-surface-variant mt-1">{previewCaseName || caseData?.id}</p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        {isAdmin && (
                          <button
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="text-[13px] sm:text-sm font-semibold text-[#ff3b30] bg-[#fff2f2] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-[#ff3b30]/10 transition-all"
                          >
                            Delete
                          </button>
                        )}
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

                    <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
                      {/* Left Column (Items) */}
                      <div className="w-full md:w-1/2 flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-divider-color bg-surface-bright">
                        {/* Section Header */}
                        <div className="px-4 sm:px-6 py-3 bg-surface-secondary/50 border-b border-divider-color shrink-0 flex items-center gap-2 text-on-surface">
                          <FileText size={20} />
                          <span className="text-base sm:text-lg font-semibold">Item Details</span>
                        </div>

                        {/* Scrollable Content (Left) */}
                        <div className="overflow-y-auto flex-1 custom-scrollbar p-4 sm:p-6 space-y-4 sm:space-y-6">

                          {caseData?.items.map((item, idx) => {
                        const images = item.imageUrls || [];
                        return (
                          <div key={idx} className="bg-system-background border border-[rgba(0,0,0,0.08)] rounded-xl p-4 sm:p-5 hover:border-[rgba(0,0,0,0.15)] transition-colors">
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

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-5 gap-x-4 sm:gap-6 mt-3 mb-5 bg-surface-secondary/20 p-4 sm:p-5 rounded-2xl border border-divider-color/50">
                              <div>
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">Batch No.</div>
                                <div className="text-[15px] font-semibold text-on-surface">{item.batchNo || '-'}</div>
                              </div>
                              <div>
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">วันที่ผลิตแกลลอน</div>
                                <div className="text-[15px] font-semibold text-on-surface">{item.gallonDate || '-'}</div>
                              </div>
                              <div>
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">Box Number</div>
                                <div className="text-[15px] font-semibold text-on-surface">{item.boxNumber || '-'}</div>
                              </div>
                              <div>
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">Mold</div>
                                <div className="text-[15px] font-semibold text-on-surface">{item.mold || '-'}</div>
                              </div>
                              <div>
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">Line</div>
                                <div className="text-[15px] font-semibold text-on-surface">{item.line || '-'}</div>
                              </div>
                              <div className="col-span-2 sm:col-span-3 md:col-span-1">
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">สาเหตุ (Reason)</div>
                                <div className="text-[15px] font-semibold text-on-surface">
                                  {item.reason || '-'} {item.reasonSubtype ? <span className="text-on-surface-variant font-medium">({item.reasonSubtype})</span> : ''}
                                </div>
                              </div>
                              <div className="col-span-2 sm:col-span-3 md:col-span-2">
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">ผู้รับผิดชอบ (Responsible)</div>
                                <div className="text-[15px] font-semibold text-on-surface">
                                  {item.responsible || '-'} {item.responsibleSubtype ? <span className="text-on-surface-variant font-medium">({item.responsibleSubtype})</span> : ''}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-divider-color/50">
                              <div>
                                <h4 className="text-sm font-medium text-on-surface-variant mb-2">Details</h4>
                                <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap break-words">{item.details || 'ไม่มีข้อมูล'}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-on-surface-variant mb-2 flex justify-between items-center">
                                  <span>Images ({images.length})</span>
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

                        </div> {/* End of Scrollable Left */}
                      </div> {/* End of Left Column */}

                      {/* Right Column (Workflow / Financials) */}
                      <div className="w-full lg:w-1/2 flex flex-col min-h-0 bg-surface-secondary/20">
                        <div className="overflow-y-auto flex-1 custom-scrollbar p-4 sm:p-6 space-y-6">

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

                            {/* --- Resource Management in View Mode --- */}
                            {(isOperator || isAdmin || isFinance) && (
                              <div className="space-y-6 mt-6 pt-4 border-t border-divider-color">
                                {/* Labor Management */}
                                <div className="space-y-4">
                                  <h4 className="text-sm font-semibold text-on-surface flex items-center gap-2"><Clock size={16} className="text-[#0066cc]" /> การจัดการเวลาทำงาน (Labor)</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-on-surface-variant">จำนวนพนักงาน (คน)</label>
                                      <select
                                        value={laborCount}
                                        onChange={(e) => setLaborCount(e.target.value === '' ? '' : Number(e.target.value))}
                                        disabled={!canEditMaterialNameQty}
                                        className="apple-input w-full bg-surface-bright border border-divider-color px-3 py-2 text-sm font-semibold rounded-lg"
                                      >
                                        <option value="">เลือกจำนวน</option>
                                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} คน</option>)}
                                      </select>
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-on-surface-variant">ชั่วโมงที่ใช้ (ชม.)</label>
                                      <input
                                        type="number" min="0" step="0.5"
                                        value={laborHours === undefined || laborHours === null || laborHours.toString() === 'NaN' ? '' : laborHours}
                                        onChange={(e) => setLaborHours(e.target.value === '' ? '' : Number(e.target.value))}
                                        disabled={!canEditMaterialNameQty}
                                        placeholder="0.0"
                                        className="apple-input w-full bg-surface-bright border border-divider-color px-3 py-2 text-sm font-semibold rounded-lg"
                                      />
                                    </div>
                                    {canViewFinancialData && (
                                      <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-on-surface-variant">อัตราค่าแรง (บาท/ชม.)</label>
                                        <div className="relative">
                                          <input
                                            type="number" min="0" step="1"
                                            value={laborRate === undefined || laborRate === null || laborRate.toString() === 'NaN' ? '' : laborRate}
                                            onChange={(e) => setLaborRate(e.target.value === '' ? '' : Number(e.target.value))}
                                            disabled={!canEditUnitPrice}
                                            placeholder="0"
                                            className="apple-input w-full bg-surface-bright border border-divider-color pl-7 pr-3 py-2 text-sm font-semibold rounded-lg"
                                          />
                                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant font-semibold">฿</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Material Management */}
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-on-surface flex items-center gap-2"><Package size={16} className="text-[#0066cc]" /> รายการวัสดุที่ใช้ (Materials)</h4>
                                    {canManageRows && (
                                      <button onClick={handleAddMaterial} className="text-xs font-semibold text-[#0066cc] bg-[#0066cc]/10 hover:bg-[#0066cc]/20 px-3 py-1.5 rounded-full transition-colors">
                                        + เพิ่มวัสดุ
                                      </button>
                                    )}
                                  </div>
                                  
                                  {materials.length > 0 ? (
                                    <div className="overflow-hidden border border-divider-color rounded-lg">
                                      <table className="w-full text-left bg-surface-bright">
                                        <thead className="bg-surface-secondary/50">
                                          <tr className="text-xs font-medium text-on-surface-variant border-b border-divider-color">
                                            <th className="py-2 px-3">ชื่อวัสดุ</th>
                                            <th className="py-2 px-3 text-center w-20">จำนวน</th>
                                            <th className="py-2 px-3 text-center w-16">หน่วย</th>
                                            {canViewFinancialData && <th className="py-2 px-3 text-right w-28">ราคา/หน่วย</th>}
                                            {canManageRows && <th className="py-2 w-10"></th>}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {materials.map((mat) => (
                                            <tr key={mat.id} className="border-b border-divider-color/50 last:border-0">
                                              <td className="p-2">
                                                <select
                                                  value={mat.name}
                                                  onChange={(e) => handleMaterialChange(mat.id, 'name', e.target.value)}
                                                  disabled={!canEditMaterialNameQty}
                                                  className="apple-input w-full bg-system-background px-2 py-1.5 text-xs font-medium border border-divider-color rounded"
                                                >
                                                  {STANDARD_MATERIALS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                              </td>
                                              <td className="p-2">
                                                <input
                                                  type="number"
                                                  value={mat.quantity || ''}
                                                  onChange={(e) => handleMaterialChange(mat.id, 'quantity', Number(e.target.value))}
                                                  disabled={!canEditMaterialNameQty}
                                                  className="apple-input w-full bg-system-background px-1 py-1.5 text-center text-xs font-medium border border-divider-color rounded"
                                                />
                                              </td>
                                              <td className="p-2 text-center text-xs text-on-surface-variant">{mat.unit}</td>
                                              {canViewFinancialData && (
                                                <td className="p-2">
                                                  <input
                                                    type="number"
                                                    value={mat.unitPrice || ''}
                                                    onChange={(e) => handleMaterialChange(mat.id, 'unitPrice', Number(e.target.value))}
                                                    disabled={!canEditUnitPrice}
                                                    className="apple-input w-full bg-system-background px-2 py-1.5 text-right text-xs font-medium border border-divider-color rounded"
                                                  />
                                                </td>
                                              )}
                                              {canManageRows && (
                                                <td className="p-2 text-right">
                                                  <button onClick={() => handleRemoveMaterial(mat.id)} className="p-1 text-error/70 hover:text-error hover:bg-error/10 rounded transition-colors">
                                                    <Trash2 size={14} />
                                                  </button>
                                                </td>
                                              )}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <div className="py-4 text-center border border-dashed border-divider-color rounded-lg text-on-surface-variant bg-surface-bright/50">
                                      <p className="text-xs font-medium">ไม่มีรายการวัสดุ</p>
                                    </div>
                                  )}
                                </div>

                                {/* Resolution Method */}
                                {((caseData?.status === 'Pending' || caseData?.status === 'In-Progress') && isOperator) || isAdmin ? (
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-on-surface flex items-center gap-2"><PenTool size={16} className="text-[#0066cc]" /> วิธีแก้ไขปัญหา (Resolution Method)</h4>
                                    <textarea
                                      value={resolutionMethod}
                                      onChange={(e) => setResolutionMethod(e.target.value)}
                                      placeholder="ระบุรายละเอียดการแก้ไขปัญหา..."
                                      className="apple-input w-full bg-surface-bright border border-divider-color p-3 rounded-lg text-sm font-medium text-on-surface min-h-[80px]"
                                    />
                                  </div>
                                ) : null}
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
                      </div> {/* End of Right Column */}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-divider-color bg-system-background px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 shrink-0 rounded-b-none sm:rounded-b-[16px]">
                      <div className="flex gap-4 items-center w-full sm:w-auto justify-center sm:justify-start order-2 sm:order-1">
                        <button onClick={() => caseData && exportPNG(caseData.id)} disabled={isExporting || !caseData} className="text-sm font-semibold text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-colors">
                          <FileImage size={16} /> <span className="hidden sm:inline">PNG</span>
                        </button>
                        <button onClick={() => caseData && exportExcel(caseData)} disabled={isExporting || !caseData} className="text-sm font-semibold text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-colors">
                          <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Excel</span>
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
                          <Download size={16} /> <span className="hidden sm:inline">PDF</span>
                        </button>
                      </div>

                      <div className="flex gap-2 sm:gap-3 items-center w-full sm:w-auto justify-between sm:justify-end order-1 sm:order-2">
                        {/* Quick Status Update (Sticky in Footer) */}
                        {(isOperator || isAdmin || isFinance) && (
                          <div className="hidden md:flex bg-surface-secondary rounded-full p-1 border border-divider-color mr-2">
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
                                  className={`px-3 py-1.5 rounded-full font-semibold text-[12px] transition-all border ${isActive
                                    ? 'bg-apple-blue-deep text-white border-apple-blue-deep shadow-sm'
                                    : isAllowed
                                      ? 'bg-transparent text-on-surface border-transparent hover:bg-surface-variant'
                                      : 'bg-transparent text-on-surface-variant border-transparent cursor-not-allowed opacity-40'
                                    }`}
                                >
                                  {getStatusLabel(status)}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {isAdmin && (
                          <button onClick={handleToggleEditMode} className="apple-button bg-surface-secondary text-on-surface hover:bg-surface-variant text-[13px] sm:text-sm px-3 sm:px-4 py-2">
                            {isEditMode ? 'ยกเลิกแก้' : 'แก้ไข'}
                          </button>
                        )}
                        <button onClick={onClose} className="apple-button bg-surface-secondary text-on-surface hover:bg-surface-variant text-[13px] sm:text-sm px-3 sm:px-4 py-2">
                          ปิด
                        </button>
                        {isSaving ? (
                          <div className="w-32 sm:w-48"><AppleProgressBar progress={progress} statusText={statusText} isComplete={isComplete} /></div>
                        ) : (
                          <button
                            onClick={handleUpdate}
                            disabled={(() => {
                              if (isLoading || !caseData) return true;
                              if (newOrFiles.length > 0 && (isOperator || isFinance || isAdmin)) return false;
                              if (caseData.status === 'Awaiting Valuation' && !isFinance) return true;
                              if ((caseData.status === 'Pending' || caseData.status === 'In-Progress') && !isPDB && !isOperator) return true;
                              if (caseData.status === 'Completed' && !isAdmin) return true;
                              return false;
                            })()}
                            className="apple-button apple-button-primary shadow-md text-[13px] sm:text-sm px-4 sm:px-6 py-2 flex-1 sm:flex-none justify-center whitespace-nowrap"
                          >
                            {isEditMode ? 'บันทึก' : 'อัปเดต'}
                          </button>
                        )}
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
