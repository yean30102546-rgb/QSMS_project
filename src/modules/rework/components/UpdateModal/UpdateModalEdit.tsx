import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Clock, AlertCircle, ImageOff, ExternalLink, FileText, Download, FileImage, HelpCircle, Landmark, PenTool, Calculator, Trash2, Package, Plus, FileSpreadsheet } from 'lucide-react';
import { useUpdateModal, STANDARD_MATERIALS } from './UpdateModalContext';
import { CUSTOMER_OPTIONS } from '@/src/services/api';
import { convertDMYToYMD, convertYMDToDMY, enforceNumeric } from '@/src/utils/helpers';
import { AppleProgressBar } from '@/src/components/shared/AppleProgressBar';

export function UpdateModalEdit() {
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
    handleAddMaterial, handleMaterialChange, handleRemoveMaterial, handleUpdate, handleDelete, confirmDelete, handleRemoveItem, getStatusLabel,
    isSaving, progress, statusText, isComplete
  } = useUpdateModal();

  return (

                  <div className="relative bg-system-background w-full flex flex-col flex-1 min-h-0 overflow-hidden">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 px-4 sm:px-6 py-4 border-b border-divider-color bg-surface-secondary/50 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-apple-blue-deep/10 flex items-center justify-center">
                          <PenTool size={16} className="text-apple-blue-deep" />
                        </div>
                        <h2 className="text-xl font-semibold text-on-surface">โหมดแก้ไข</h2>
                        <span className="text-sm text-on-surface-variant font-medium bg-surface-variant px-3 py-1 rounded-full">
                          {previewCaseName || caseData?.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {isSaving && <AppleProgressBar progress={progress} statusText={statusText} isComplete={isComplete} />}
                        {!isSaving && (
                          <>
                            <button onClick={handleRequestClose} className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors">
                              ยกเลิก
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              disabled={isLoading || !isAdmin}
                              className="px-5 py-2 text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#0055aa] rounded-full shadow-sm transition-all disabled:opacity-50"
                            >
                              บันทึกการแก้ไข
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden bg-surface-bright">
                      {/* Left Column (Items) */}
                      <div className="w-full lg:w-1/2 overflow-y-auto custom-scrollbar p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-divider-color space-y-4 sm:space-y-6">

                        {/* Case Info - Edit */}
                      <div className="bg-system-background border border-divider-color rounded-xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-2 mb-4 border-b border-divider-color pb-3">
                          <AlertCircle size={18} className="text-on-surface-variant" />
                          <h3 className="text-base font-semibold text-on-surface">Case Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-on-surface-variant">แหล่งที่มา</label>
                            <select
                              value={editedSource}
                              onChange={(e) => setEditedSource(e.target.value)}
                              className="w-full border border-divider-color bg-surface-secondary px-4 py-2.5 text-base font-semibold rounded-lg text-on-surface"
                            >
                              {SOURCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-on-surface-variant">เลขที่เคส</label>
                            <div className="flex items-center bg-surface-secondary rounded-lg border border-divider-color focus-within:ring-[3px] focus-within:ring-blue-500/30 transition-all overflow-hidden">
                              <span className="pl-4 py-2.5 text-base font-semibold text-on-surface-variant">{caseNamePrefix}</span>
                              <input
                                value={editedCaseNumber}
                                onChange={(e) => setEditedCaseNumber(enforceNumeric(e.target.value))}
                                placeholder="เช่น 084"
                                className="w-full bg-transparent px-2 py-2.5 text-base font-bold text-center outline-none text-on-surface"
                              />
                              <span className="pr-4 py-2.5 text-base font-semibold text-on-surface-variant">-{caseNameYear}</span>
                            </div>
                          </div>
                        </div>

                        {/* Files Section */}
                        {(editedItems.every(i => i.customerName === 'OR')) && (
                          <div className="pt-4 border-t border-divider-color space-y-3">
                            <label className="text-sm font-medium text-on-surface-variant">เอกสาร OR</label>
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
                      <div className="bg-system-background border border-divider-color rounded-xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-2 mb-2 sm:mb-4 border-b border-divider-color pb-3">
                          <FileText size={18} className="text-[#0066cc]" />
                          <h3 className="text-base font-semibold text-on-surface">รายการสินค้า ({editedItems.length})</h3>
                        </div>

                        <div className="space-y-4">
                          <AnimatePresence initial={false}>
                          {editedItems.map((item, index) => {
                            const isExpanded = expandedItemId === item.id || (expandedItemId === index.toString());
                            const toggleExpand = () => setExpandedItemId(isExpanded ? null : (item.id || index.toString()));

                            return (
                              <motion.div 
                                key={item.id || index} 
                                initial={{ opacity: 0, height: 0, scale: 0.98 }}
                                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                className="border border-divider-color rounded-xl bg-surface-bright overflow-hidden transition-all duration-300"
                              >
                                
                                {/* Always Visible Summary */}
                                <div className="p-5 flex flex-col md:flex-row gap-4 items-start md:items-stretch">
                                  <div className="flex-1 space-y-4 w-full">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium text-on-surface-variant">ชื่อรายการ</label>
                                        <input
                                          value={item.itemName || ''}
                                          onChange={(e) => {
                                            const newItems = [...editedItems];
                                            newItems[index] = { ...newItems[index], itemName: e.target.value };
                                            setEditedItems(newItems);
                                          }}
                                          className="w-full border border-divider-color bg-system-background px-3 py-2.5 text-sm font-semibold text-on-surface rounded-lg"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium text-on-surface-variant">ลูกค้า</label>
                                        <select
                                          value={item.customerName || ''}
                                          onChange={(e) => {
                                            const newItems = [...editedItems];
                                            newItems[index] = { ...newItems[index], customerName: e.target.value };
                                            setEditedItems(newItems);
                                          }}
                                          className="w-full border border-divider-color bg-system-background px-3 py-2.5 text-sm font-semibold text-on-surface rounded-lg"
                                        >
                                          <option value="">เลือกสีลูกค้า</option>
                                          {CUSTOMER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-4">
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium text-on-surface-variant">อาการเสีย / รายละเอียด</label>
                                        <textarea
                                          value={item.details || ''}
                                          onChange={(e) => {
                                            const newItems = [...editedItems];
                                            newItems[index] = { ...newItems[index], details: e.target.value };
                                            setEditedItems(newItems);
                                          }}
                                          rows={2}
                                          className="w-full border border-divider-color bg-system-background p-3 text-sm font-medium text-on-surface rounded-lg resize-none"
                                        />
                                      </div>
                                      <div className="space-y-2 flex flex-col items-end">
                                        <label className="text-sm font-medium text-on-surface-variant w-full text-right">จำนวน</label>
                                        <div className="flex items-center justify-end gap-2 w-full">
                                          <input
                                            type="number"
                                            value={item.amount || ''}
                                            onChange={(e) => {
                                              const newItems = [...editedItems];
                                              newItems[index] = { ...newItems[index], amount: Number(e.target.value) };
                                              setEditedItems(newItems);
                                            }}
                                            className="w-full border border-divider-color bg-system-background px-2 py-2.5 text-center text-sm font-bold text-on-surface rounded-lg"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="w-full md:w-48 flex flex-col items-end gap-3 shrink-0 h-full justify-between">
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
                                        
                                        {/* Production Group */}
                                        <div>
                                          <h4 className="text-[13px] font-semibold text-on-surface mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-apple-blue-deep"></div>
                                            ข้อมูลการผลิต
                                          </h4>
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <div className="space-y-3">
                                              <label className="text-xs tracking-wide font-semibold text-on-surface-variant uppercase">Batch No.</label>
                                              <input
                                                type="text"
                                                value={item.batchNo || ''}
                                                onChange={(e) => {
                                                  const newItems = [...editedItems];
                                                  newItems[index] = { ...newItems[index], batchNo: e.target.value };
                                                  setEditedItems(newItems);
                                                }}
                                                className="w-full border border-divider-color bg-system-background px-4 py-2.5 text-sm font-medium text-on-surface rounded-lg"
                                              />
                                            </div>
                                            <div className="space-y-3">
                                              <label className="text-xs tracking-wide font-semibold text-on-surface-variant uppercase">วันที่ผลิตแกลลอน</label>
                                              <input
                                                type="date"
                                                value={item.gallonDate ? convertDMYToYMD(item.gallonDate) : ''}
                                                onChange={(e) => {
                                                  const newItems = [...editedItems];
                                                  newItems[index] = { ...newItems[index], gallonDate: convertYMDToDMY(e.target.value) };
                                                  setEditedItems(newItems);
                                                }}
                                                className="w-full border border-divider-color bg-system-background px-4 py-2.5 text-sm font-medium text-on-surface rounded-lg"
                                              />
                                            </div>
                                            <div className="space-y-3">
                                              <label className="text-xs tracking-wide font-semibold text-on-surface-variant uppercase">Box Number</label>
                                              <input
                                                type="text"
                                                value={item.boxNumber || ''}
                                                onChange={(e) => {
                                                  const newItems = [...editedItems];
                                                  newItems[index] = { ...newItems[index], boxNumber: e.target.value };
                                                  setEditedItems(newItems);
                                                }}
                                                className="w-full border border-divider-color bg-system-background px-4 py-2.5 text-sm font-medium text-on-surface rounded-lg"
                                              />
                                            </div>
                                            <div className="space-y-3">
                                              <label className="text-xs tracking-wide font-semibold text-on-surface-variant uppercase">Mold / Line</label>
                                              <div className="flex gap-3">
                                                <input
                                                  type="text"
                                                  value={item.mold || ''}
                                                  onChange={(e) => {
                                                    const newItems = [...editedItems];
                                                    newItems[index] = { ...newItems[index], mold: e.target.value };
                                                    setEditedItems(newItems);
                                                  }}
                                                  placeholder="Mold"
                                                  className="w-1/2 border border-divider-color bg-system-background px-4 py-2.5 text-sm font-medium text-on-surface rounded-lg"
                                                />
                                                <input
                                                  type="text"
                                                  value={item.line || ''}
                                                  onChange={(e) => {
                                                    const newItems = [...editedItems];
                                                    newItems[index] = { ...newItems[index], line: e.target.value };
                                                    setEditedItems(newItems);
                                                  }}
                                                  placeholder="Line"
                                                  className="w-1/2 border border-divider-color bg-system-background px-4 py-2.5 text-sm font-medium text-on-surface rounded-lg"
                                                />
                                              </div>
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
                                            <div className="space-y-3">
                                              <label className="text-xs tracking-wide font-semibold text-on-surface-variant uppercase">สาเหตุหลัก (Reason)</label>
                                              <input
                                                type="text"
                                                value={item.reason || ''}
                                                onChange={(e) => {
                                                  const newItems = [...editedItems];
                                                  newItems[index] = { ...newItems[index], reason: e.target.value };
                                                  setEditedItems(newItems);
                                                }}
                                                placeholder="เช่น รั่ว, เปื้อน"
                                                className="w-full border border-divider-color bg-system-background px-4 py-2.5 text-sm font-medium text-on-surface rounded-lg"
                                              />
                                            </div>
                                            <div className="space-y-3">
                                              <label className="text-xs tracking-wide font-semibold text-on-surface-variant uppercase">ประเภทย่อย (Subtype)</label>
                                              <input
                                                type="text"
                                                value={item.reasonSubtype || ''}
                                                onChange={(e) => {
                                                  const newItems = [...editedItems];
                                                  newItems[index] = { ...newItems[index], reasonSubtype: e.target.value };
                                                  setEditedItems(newItems);
                                                }}
                                                placeholder="เช่น รั่วซึม, กล่องเปื้อน"
                                                className="w-full border border-divider-color bg-system-background px-4 py-2.5 text-sm font-medium text-on-surface rounded-lg"
                                              />
                                            </div>
                                            <div className="space-y-3">
                                              <label className="text-xs tracking-wide font-semibold text-on-surface-variant uppercase">ผู้รับผิดชอบ (Responsible)</label>
                                              <input
                                                type="text"
                                                value={item.responsible || ''}
                                                onChange={(e) => {
                                                  const newItems = [...editedItems];
                                                  newItems[index] = { ...newItems[index], responsible: e.target.value };
                                                  setEditedItems(newItems);
                                                }}
                                                placeholder="เช่น SFC, Customer, Supplier"
                                                className="w-full border border-divider-color bg-system-background px-4 py-2.5 text-sm font-medium text-on-surface rounded-lg"
                                              />
                                            </div>
                                            <div className="space-y-3">
                                              <label className="text-xs tracking-wide font-semibold text-on-surface-variant uppercase">แผนก (Subdivision)</label>
                                              <input
                                                type="text"
                                                value={item.responsibleSubtype || ''}
                                                onChange={(e) => {
                                                  const newItems = [...editedItems];
                                                  newItems[index] = { ...newItems[index], responsibleSubtype: e.target.value };
                                                  setEditedItems(newItems);
                                                }}
                                                placeholder="เช่น PDF, WPK"
                                                className="w-full border border-divider-color bg-system-background px-4 py-2.5 text-sm font-medium text-on-surface rounded-lg"
                                              />
                                            </div>
                                          </div>
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
                      </div> {/* End of Left Column */}

                      {/* Right Column (Workflow / Resources) */}
                      <div className="w-full lg:w-1/2 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-surface-secondary/10 space-y-4 sm:space-y-6">

                      {/* Labor Management - Edit */}
                      {(isOperator || isAdmin) && (
                        <div className="bg-system-background border border-divider-color rounded-xl p-6 shadow-sm space-y-6">
                          <div className="flex items-center gap-2 mb-4 border-b border-divider-color pb-3">
                            <Clock size={18} className="text-[#0066cc]" />
                            <h3 className="text-base font-semibold text-on-surface">การจัดการเวลาทำงาน (Labor)</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-on-surface-variant">จำนวนพนักงาน (คน)</label>
                              <select
                                value={laborCount}
                                onChange={(e) => setLaborCount(e.target.value === '' ? '' : Number(e.target.value))}
                                disabled={!canEditMaterialNameQty}
                                className="w-full border border-divider-color bg-surface-secondary px-4 py-2.5 text-base font-semibold rounded-lg"
                              >
                                <option value="">เลือกจำนวน</option>
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} คน</option>)}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-on-surface-variant">ชั่วโมงที่ใช้ (ชม.)</label>
                              <input
                                type="number"
                                min="0" step="0.5"
                                value={laborHours === undefined || laborHours === null || laborHours.toString() === 'NaN' ? '' : laborHours}
                                onChange={(e) => setLaborHours(e.target.value === '' ? '' : Number(e.target.value))}
                                disabled={!canEditMaterialNameQty}
                                placeholder="0.0"
                                className="w-full border border-divider-color bg-surface-secondary px-4 py-2.5 text-base font-semibold rounded-lg"
                              />
                            </div>
                            {canViewFinancialData && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-on-surface-variant">อัตราค่าแรง (บาท/ชม.)</label>
                                <div className="relative">
                                  <input
                                    type="number" min="0" step="1"
                                    value={laborRate === undefined || laborRate === null || laborRate.toString() === 'NaN' ? '' : laborRate}
                                    onChange={(e) => setLaborRate(e.target.value === '' ? '' : Number(e.target.value))}
                                    disabled={!canEditUnitPrice}
                                    placeholder="0"
                                    className="w-full border border-divider-color bg-surface-secondary pl-8 pr-4 py-2.5 text-base font-semibold rounded-lg"
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
                              <button onClick={handleAddMaterial} className="text-sm border border-divider-color bg-surface-secondary hover:bg-surface-variant text-[#0066cc] px-4 py-2 rounded-lg font-medium">
                                + เพิ่มวัสดุ
                              </button>
                            )}
                          </div>

                          {materials.length > 0 ? (
                            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                              <table className="w-full text-left min-w-[500px]">
                                <thead>
                                  <tr className="text-xs font-medium text-on-surface-variant border-b border-divider-color">
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
                                          className="w-full border border-divider-color bg-surface-bright px-2 py-1.5 text-sm font-medium rounded-md"
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
                                          className="w-full border border-divider-color bg-surface-bright px-1 py-1.5 text-center text-sm font-medium rounded-md"
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
                                            className="w-full border border-divider-color bg-surface-bright px-2 py-1.5 text-right text-sm font-medium rounded-md"
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
                            className="w-full border border-divider-color bg-surface-secondary p-4 rounded-lg text-sm font-medium text-on-surface min-h-[100px] leading-relaxed"
                          />
                        </div>
                      )}

                      </div> {/* End of Right Column */}
                    </div>
                  </div>
  );
}
