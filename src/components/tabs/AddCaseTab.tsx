'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, Clock, Plus, Trash2, HelpCircle, X, Copy, Search } from 'lucide-react';

import type { ReworkItem } from '../../services/api';
import { CUSTOMER_OPTIONS } from '../../services/api';
import { ImageUpload } from '../ui/ImageUpload';
import { AppleProgressBar } from '../ui/AppleProgressBar';

type SaveMessage = {
  type: 'success' | 'error';
  text: string;
} | null;

type SelectionModalState = {
  itemId: string;
  type: 'reason' | 'responsible';
  title: string;
  options: string[];
} | null;

interface AddCaseTabProps {
  caseSource: string;
  setCaseSource: (source: string) => void;
  formItems: ReworkItem[];
  addFormItem: () => void;
  removeFormItem: (id: string) => void;
  resetFormItem: (id: string) => void;
  clearAllForm: () => void;
  duplicateFormItem: (id: string) => void;
  updateFormItem: (id: string, field: string, value: string | number) => void;
  handleImagesSelected: (itemId: string, files: File[]) => void;
  uploadedImages: Record<string, File[]>;
  orFiles: File[];
  setOrFiles: (files: File[]) => void;
  handleCheckItem: (id: string, field: 'itemNumber' | 'itemCode') => void;
  handleSubmit: () => void;
  isSaving: boolean;
  progress: number;
  statusText?: string;
  isComplete: boolean;
  saveMessage: SaveMessage;
  isSaveDisabled: (items: ReworkItem[]) => boolean;
  autoFillTriggeredItem: string | null;
  selectionModal: SelectionModalState;
  setSelectionModal: (modal: SelectionModalState) => void;
  onOpenTutorial: () => void;
}

const REASON_MAIN_OPTIONS = [
  'รั่ว',
  'เปื้อน',
  'อื่นๆ',
] as const;


const LEAK_SUBTYPES = ['รั่วซึม', 'รั่วซีลฟอยล์', 'รั่วตามด', 'รั่วรอยลากแกลลอน', 'รั่วโดนเครื่องจักร', 'แตกตะเข็บ', 'รอยมีด'] as const;
const STAIN_SUBTYPES = ['ขวดเปื้อน', 'กล่องเปื้อน'] as const;

const RESPONSIBLE_MAIN_OPTIONS = ['SFC', 'Supplier', 'Customer', 'อื่นๆ'] as const;

const RESPONSIBLE_SUBDIVISIONS: Record<string, string[]> = {
  SFC: ['PDF', 'PDB', 'WPK', 'อื่นๆ'],
  Supplier: ['SP', 'PJW', 'Polymer', 'ธนกร', 'Fuchs', 'อื่นๆ'],
  Customer: ['Customer'],
};

// CUSTOMER_OPTIONS moved to api.ts

export function AddCaseTab({
  caseSource,
  setCaseSource,
  formItems,
  addFormItem,
  removeFormItem,
  resetFormItem,
  clearAllForm,
  duplicateFormItem,
  updateFormItem,
  handleImagesSelected,
  uploadedImages,
  orFiles,
  setOrFiles,
  handleCheckItem,
  handleSubmit,
  isSaving,
  progress,
  statusText,
  isComplete,
  saveMessage,
  isSaveDisabled,
  autoFillTriggeredItem,
  selectionModal,
  setSelectionModal,
  onOpenTutorial,
}: AddCaseTabProps) {
  const [expandedReasonSelection, setExpandedReasonSelection] = useState<string | null>(null);
  const [expandedResponsibleSelection, setExpandedResponsibleSelection] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (orFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [orFiles]);

  const handleSelectionModalChoose = (value: string) => {
    if (!selectionModal) return;

    if (selectionModal.type === 'reason') {
      updateFormItem(selectionModal.itemId, 'reasonSubtype', value);
    } else {
      updateFormItem(selectionModal.itemId, 'responsibleSubtype', value);
    }

    setSelectionModal(null);
  };

  const getReasonDropdownOptions = (item: ReworkItem) => {
    const options = [...REASON_MAIN_OPTIONS];
    if (item.reason && !options.includes(item.reason as (typeof REASON_MAIN_OPTIONS)[number])) {
      options.push(item.reason as (typeof REASON_MAIN_OPTIONS)[number]);
    }
    return options;
  };

  const getResponsibleDropdownOptions = (item: ReworkItem) => {
    const options = [...RESPONSIBLE_MAIN_OPTIONS];
    if (item.responsible && !options.includes(item.responsible as (typeof RESPONSIBLE_MAIN_OPTIONS)[number])) {
      options.push(item.responsible as (typeof RESPONSIBLE_MAIN_OPTIONS)[number]);
    }
    return options;
  };

  const handleReasonChange = (itemId: string, reason: string) => {
    updateFormItem(itemId, 'reason', reason);

    // Clear subtype if it's not a type that uses subtypes
    if (reason !== 'รั่ว' && reason !== 'เปื้อน') {
      updateFormItem(itemId, 'reasonSubtype', '');
      updateFormItem(itemId, 'linkedSourceId', '');
      setExpandedReasonSelection((prev) => (prev === itemId ? null : prev));
    } else {
      // Clear subtype when switching between 'รั่ว' and 'เปื้อน' to avoid invalid data
      updateFormItem(itemId, 'reasonSubtype', '');
      if (reason === 'รั่ว') {
        updateFormItem(itemId, 'linkedSourceId', '');
      }
    }
  };

  const handleResponsibleChange = (itemId: string, responsible: string) => {
    updateFormItem(itemId, 'responsible', responsible);
    updateFormItem(itemId, 'responsibleSubtype', '');
    if (responsible !== 'SFC' && responsible !== 'Supplier') {
      setExpandedResponsibleSelection((prev) => (prev === itemId ? null : prev));
    }
  };

  const toggleReasonSubtype = (itemId: string, currentSubtypes: string, subtype: string) => {
    const subtypes = currentSubtypes ? currentSubtypes.split(',').map(s => s.trim()).filter(Boolean) : [];
    const index = subtypes.indexOf(subtype);

    if (index > -1) {
      subtypes.splice(index, 1);
    } else {
      subtypes.push(subtype);
    }

    updateFormItem(itemId, 'reasonSubtype', subtypes.join(', '));
  };

  return (
    <motion.div
      key="add"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="mx-auto max-w-5xl space-y-10 pb-20"
    >
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">บันทึกงาน Rework ใหม่</h2>
          <p className="mt-1 text-sm text-muted">เพิ่มข้อมูลล็อตสินค้าที่พบคราบหรือความเสียหายเพื่อบันทึกเข้าสู่ระบบ</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={clearAllForm}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-red-600 hover:border-red-200 active:scale-95"
            title="ล้างข้อมูลที่กรอกค้างไว้ทั้งหมดในหน้านี้"
          >
            <Trash2 size={12} /> ล้างฟอร์มทั้งหมด
          </button>
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">
            <Clock size={12} /> บันทึกข้อมูลสด
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="glass-card bg-white p-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">แหล่งที่มาของงาน (Source) *</label>
              <select
                value={caseSource}
                onChange={(e) => setCaseSource(e.target.value)}
                className="w-full rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm focus:border-accent focus:outline-none"
              >
                <option>SFC</option>
                <option>Customer</option>
              </select>
            </div>

          </div>

          {formItems.length > 0 && formItems.every(item => item.customerName === 'OR') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 border-t border-slate-100 pt-6"
            >
              <div className="rounded-2xl bg-amber-50 p-6 border border-amber-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <HelpCircle size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">เอกสารสำหรับ OR (Optional)</h4>
                    <p className="text-[11px] text-amber-700/80">แนบไฟล์ Excel, PDF หรือ PNG (สูงสุด 2 ไฟล์)</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[240px]">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".xlsx,.xls,.pdf,.png"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setOrFiles(files.slice(0, 2));
                      }}
                      className="block w-full text-sm text-slate-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-amber-100 file:text-amber-700
                          hover:file:bg-amber-200"
                    />
                  </div>
                  {orFiles.length > 0 && (
                    <div className="flex gap-2 items-center">
                      {orFiles.map((file, i) => (
                        <div key={i} className="px-3 py-1 bg-white border border-amber-200 rounded-lg text-xs font-medium text-amber-800 flex items-center gap-2">
                          {file.name}
                          <button onClick={() => setOrFiles(orFiles.filter((_, idx) => idx !== i))} className="text-amber-400 hover:text-amber-600">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          {formItems.map((item, idx) => (
            <motion.div
              key={item.id}
              id={`form-card-${item.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card relative overflow-hidden bg-white p-8"
            >
              <div className="absolute left-0 top-0 h-full w-1 bg-accent opacity-20" />
              <div className="mb-8 flex items-center justify-between">
                <h3 className="flex items-center gap-2.5 text-sm font-bold text-accent">
                  <Plus size={16} /> รายการที่ {idx + 1}
                  {item.verificationStatus === 'verified' && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> พบในระบบ
                    </span>
                  )}
                  {item.verificationStatus === 'new' && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> สินค้าใหม่
                    </span>
                  )}
                  {item.verificationStatus === 'checking' && (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> กำลังตรวจสอบ...
                    </span>
                  )}
                  {item.verificationStatus === 'updating' && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> กำลังอัพเดตข้อมูล...
                    </span>
                  )}
                  {item.verificationStatus === 'conflict' && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> ⚠️ รหัสซ้ำซ้อนในระบบ
                    </span>
                  )}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">ชื่อลูกค้า (Customer Name) *</label>
                  <select
                    value={item.customerName || ''}
                    onChange={(e) => updateFormItem(item.id, 'customerName', e.target.value)}
                    className="w-full rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm focus:border-accent focus:outline-none disabled:opacity-50 h-[46px]"
                    disabled={isSaving}
                  >
                    <option value="">กรุณาเลือก</option>
                    {CUSTOMER_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1 mb-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                      หมายเลขบาร์โค้ด (Item Number) *
                    </label>
                    {item.lastActiveField === 'itemNumber' && (
                      <span className="text-[9px] font-bold text-black/40 bg-black/5 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                        ลำดับความสำคัญหลัก
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      autoComplete="off"
                      value={item.itemNumber}
                      onChange={(e) => updateFormItem(item.id, 'itemNumber', e.target.value)}
                      placeholder="เช่น 60001234A"
                      disabled={isSaving}
                      className={`w-full rounded-xl border pl-4 pr-10 py-3 text-sm font-medium transition-all duration-200 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none ${item.lastActiveField === 'itemNumber'
                        ? 'border-[#1d1d1f] bg-white ring-2 ring-black/5'
                        : 'border-border bg-slate-50 focus:border-accent'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleCheckItem(item.id, 'itemNumber')}
                      disabled={isSaving || !item.itemNumber.trim()}
                      className="absolute right-3 text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors"
                      title="ตรวจสอบข้อมูลด้วยบาร์โค้ด"
                    >
                      <Search size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1 mb-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                      รหัสสินค้า (Item Code) *
                    </label>
                    {item.lastActiveField === 'itemCode' && (
                      <span className="text-[9px] font-bold text-black/40 bg-black/5 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                        ลำดับความสำคัญหลัก
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      autoComplete="off"
                      value={item.itemCode}
                      onChange={(e) => updateFormItem(item.id, 'itemCode', e.target.value)}
                      placeholder="เช่น 40001234"
                      disabled={isSaving}
                      className={`w-full rounded-xl border pl-4 pr-10 py-3 text-sm font-medium transition-all duration-200 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none ${item.lastActiveField === 'itemCode'
                        ? 'border-[#1d1d1f] bg-white ring-2 ring-black/5'
                        : 'border-border bg-slate-50 focus:border-accent'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleCheckItem(item.id, 'itemCode')}
                      disabled={isSaving || !item.itemCode.trim()}
                      className="absolute right-3 text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors"
                      title="ตรวจสอบข้อมูลด้วยรหัสสินค้า"
                    >
                      <Search size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <InputField
                  label="ชื่อรายการ (Item Name) *"
                  value={item.itemName}
                  onChange={(v) => updateFormItem(item.id, 'itemName', v)}
                  placeholder="ระบบจะกรอกให้อัตโนมัติเมื่อกดตรวจสอบ หรือกรอกเองหากไม่พบในฐานข้อมูล"
                  disabled={isSaving}
                />
              </div>

              <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div className="col-span-1">
                  <InputField
                    label="หมายเลขล็อต (Batch no.) *"
                    value={item.batchNo || ''}
                    onChange={(v) => updateFormItem(item.id, 'batchNo', v)}
                    placeholder="เช่น 240510"
                    disabled={isSaving}
                  />
                </div>
                <div className="col-span-1">
                  <InputField
                    label="เลขกล่อง (Box Number) *"
                    type="text"
                    value={item.packagingDate || ''}
                    onChange={(v) => updateFormItem(item.id, 'packagingDate', v)}
                    placeholder="เช่น 001"
                    disabled={isSaving}
                  />
                </div>
                <div className="col-span-1">
                  <InputField
                    label="Mold"
                    type="text"
                    value={item.mold || ''}
                    onChange={(v) => updateFormItem(item.id, 'mold', v)}
                    placeholder="เลข Mold"
                    disabled={isSaving}
                  />
                </div>
                <div className="col-span-1">
                  <InputField
                    label="Line"
                    type="text"
                    value={item.line || ''}
                    onChange={(v) => updateFormItem(item.id, 'line', v)}
                    placeholder="เลข Line"
                    disabled={isSaving}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <InputField
                    label="จำนวน (Amount) *"
                    type="number"
                    value={item.amount}
                    onChange={(v) => updateFormItem(item.id, 'amount', v)}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">สาเหตุที่พบ *</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={item.reason}
                        onChange={(e) => handleReasonChange(item.id, e.target.value)}
                        className="flex-1 rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none disabled:opacity-50"
                        disabled={isSaving}
                      >
                        <option value="" className="text-slate-400">กรุณาเลือก</option>
                        {getReasonDropdownOptions(item).map((option) => (
                          <option key={option} value={option} className="text-slate-900">{option}</option>
                        ))}
                      </select>
                      {(item.reason === 'รั่ว' || item.reason === 'เปื้อน') && (
                        <button
                          type="button"
                          onClick={() => setExpandedReasonSelection(expandedReasonSelection === item.id ? null : item.id)}
                          className="whitespace-nowrap rounded-xl border border-accent bg-accent/10 px-4 py-3 text-sm font-semibold text-accent transition-colors duration-200 hover:bg-accent/20 disabled:opacity-50"
                          disabled={isSaving}
                        >
                          เลือก
                        </button>
                      )}
                    </div>
                    <AnimatePresence>
                      {(item.reason === 'รั่ว' || item.reason === 'เปื้อน') && expandedReasonSelection === item.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-1 gap-2"
                        >
                          {(item.reason === 'รั่ว' ? LEAK_SUBTYPES : STAIN_SUBTYPES).map((subtype) => {
                            const isSelected = item.reason === 'รั่ว'
                              ? item.reasonSubtype === subtype
                              : (item.reasonSubtype || '').split(', ').includes(subtype);

                            return (
                              <button
                                key={subtype}
                                type="button"
                                onClick={() => {
                                  if (item.reason === 'รั่ว') {
                                    updateFormItem(item.id, 'reasonSubtype', subtype);
                                    setExpandedReasonSelection(null);
                                  } else {
                                    toggleReasonSubtype(item.id, item.reasonSubtype || '', subtype);
                                  }
                                }}
                                className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${isSelected
                                  ? (item.reason === 'รั่ว' ? 'border border-accent bg-accent text-white' : 'bg-slate-800 text-white shadow-lg')
                                  : 'border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                disabled={isSaving}
                              >
                                {subtype}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {(item.reason === 'รั่ว' || item.reason === 'เปื้อน') && item.reasonSubtype && (
                      <div className="rounded-lg border border-accent bg-accent/10 px-3 py-2">
                        <p className="mb-1 text-[10px] font-semibold text-muted">เลือก:</p>
                        <p className="text-sm font-semibold text-accent">{item.reasonSubtype}</p>
                      </div>
                    )}
                    {(item.reason === 'รั่ว' || item.reason === 'เปื้อน') && !item.reasonSubtype && (
                      <p className="text-[10px] font-medium text-amber-600">กรุณาเลือกรูปแบบ {item.reason}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">ผู้รับผิดชอบ *</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={item.responsible}
                        onChange={(e) => handleResponsibleChange(item.id, e.target.value)}
                        className="flex-1 rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-accent focus:outline-none disabled:opacity-50"
                        disabled={isSaving}
                      >
                        <option value="" className="text-slate-400">กรุณาเลือก</option>
                        {getResponsibleDropdownOptions(item).map((option) => (
                          <option key={option} value={option} className="text-slate-900">{option}</option>
                        ))}
                      </select>
                      {(item.responsible === 'SFC' || item.responsible === 'Supplier') && (
                        <button
                          type="button"
                          onClick={() => setExpandedResponsibleSelection(expandedResponsibleSelection === item.id ? null : item.id)}
                          className="whitespace-nowrap rounded-xl border border-accent bg-accent/10 px-4 py-3 text-sm font-semibold text-accent transition-colors duration-200 hover:bg-accent/20 disabled:opacity-50"
                          disabled={isSaving}
                        >
                          เลือก
                        </button>
                      )}
                    </div>
                    <AnimatePresence>
                      {(item.responsible === 'SFC' || item.responsible === 'Supplier') && expandedResponsibleSelection === item.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-1 gap-2"
                        >
                          {(RESPONSIBLE_SUBDIVISIONS[item.responsible] || []).map((subtype) => (
                            <button
                              key={subtype}
                              type="button"
                              onClick={() => {
                                updateFormItem(item.id, 'responsibleSubtype', subtype);
                                setExpandedResponsibleSelection(null);
                              }}
                              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-200 ${item.responsibleSubtype === subtype
                                ? 'border border-accent bg-accent text-white'
                                : 'border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              disabled={isSaving}
                            >
                              {subtype}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {(item.responsible === 'SFC' || item.responsible === 'Supplier') && item.responsibleSubtype && (
                      <div className="rounded-lg border border-accent bg-accent/10 px-3 py-2">
                        <p className="mb-1 text-[10px] font-semibold text-muted">เลือก:</p>
                        <p className="text-sm font-semibold text-accent">{item.responsibleSubtype}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cross-Item Leakage Logic for 'เปื้อน' */}
              {item.reason === 'เปื้อน' && formItems.some(i => i.reason === 'รั่ว' && i.id !== item.id) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-8 overflow-hidden"
                >
                  <div className="rounded-2xl border-2 border-amber-100 bg-amber-50/50 p-5 transition-all">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                          <HelpCircle size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-amber-900">ระบุความเชื่อมโยง (Cross-Item Link)</p>
                          <label className="mt-0.5 flex cursor-pointer items-center gap-2 text-xs font-medium text-amber-700">
                            <input
                              type="checkbox"
                              checked={!!item.linkedSourceId}
                              onChange={(e) => {
                                if (!e.target.checked) {
                                  updateFormItem(item.id, 'linkedSourceId', '');
                                } else {
                                  // Auto-select first leaking item if only one exists
                                  const leaks = formItems.filter(i => i.reason === 'รั่ว' && i.id !== item.id);
                                  if (leaks.length === 1) {
                                    updateFormItem(item.id, 'linkedSourceId', leaks[0].id);
                                  }
                                }
                              }}
                              className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                            />
                            สาเหตุมาจากไอเทมที่รั่วในเคสนี้
                          </label>
                        </div>
                      </div>

                      <AnimatePresence>
                        {item.linkedSourceId !== undefined && item.linkedSourceId !== '' && (
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex flex-col gap-1.5"
                          >
                            <label className="text-[10px] font-bold uppercase tracking-wider text-amber-900/60">ไอเทมต้นเหตุ *</label>
                            <select
                              value={item.linkedSourceId}
                              onChange={(e) => updateFormItem(item.id, 'linkedSourceId', e.target.value)}
                              className="min-w-[200px] rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-amber-900 shadow-sm focus:border-amber-500 focus:outline-none"
                            >
                              <option value="">-- เลือกรายการ --</option>
                              {formItems
                                .filter(i => i.reason === 'รั่ว' && i.id !== item.id)
                                .map(leak => (
                                  <option key={leak.id} value={leak.id}>
                                    {leak.itemNumber || 'ไม่ระบุเบอร์'} - {leak.itemName || 'ไม่ระบุชื่อ'}
                                  </option>
                                ))
                              }
                            </select>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">รายละเอียดเพิ่มเติม</label>
                  <textarea
                    rows={3}
                    value={item.details || ''}
                    onChange={(e) => updateFormItem(item.id, 'details', e.target.value)}
                    placeholder="ระบุรายละเอียดเพิ่มเติม..."
                    className="w-full resize-none rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm focus:border-accent focus:outline-none disabled:opacity-50"
                    disabled={isSaving}
                  />
                </div>

                <div className="md:col-span-1">
                  <ImageUpload
                    itemIndex={idx}
                    onImagesSelected={(files) => handleImagesSelected(item.id, files)}
                    currentImages={uploadedImages[item.id] || []}
                    maxImages={5}
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
                <motion.button
                  type="button"
                  onClick={() => {
                    duplicateFormItem(item.id);
                    setTimeout(() => {
                      const card = document.getElementById(`form-card-${item.id}`);
                      card?.nextElementSibling?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 rounded-xl bg-indigo-50/80 px-4 py-2.5 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
                >
                  <Copy size={16} /> คัดลอกรายการ
                </motion.button>
                {formItems.length > 1 ? (
                  <motion.button
                    type="button"
                    onClick={() => removeFormItem(item.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 rounded-xl bg-red-50/80 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
                  >
                    <Trash2 size={16} /> ลบรายการ
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={() => resetFormItem(item.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200"
                  >
                    <Trash2 size={16} /> ล้างข้อมูลการ์ดนี้
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}

          <AnimatePresence mode="wait">
            {isSaving ? (
              <motion.div
                key="saving-card"
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="w-full rounded-2xl border border-slate-200/60 bg-white/90 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90 dark:shadow-none"
              >
                <AppleProgressBar progress={progress} statusText={statusText} isComplete={isComplete} />
              </motion.div>
            ) : (
              <motion.div
                key="action-buttons"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4 sm:flex-row w-full"
              >
                <motion.button
                  onClick={addFormItem}
                  disabled={isSaving}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-xs font-bold uppercase tracking-widest text-muted hover:bg-slate-50 disabled:opacity-50 sm:h-auto"
                >
                  <Plus size={16} /> [ + ] เพิ่มรายการ
                </motion.button>
                <motion.button
                  onClick={handleSubmit}
                  disabled={isSaveDisabled(formItems) || isSaving}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.15 }}
                  className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-bold text-white shadow-xl shadow-accent/10 hover:bg-black active:bg-black disabled:cursor-not-allowed disabled:opacity-50 sm:h-auto overflow-hidden relative"
                >
                  <>
                    บันทึกข้อมูลเข้าสู่ระบบ <ChevronRight size={16} />
                  </>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {saveMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`rounded-lg border p-4 text-sm font-semibold ${saveMessage.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
                  }`}
              >
                {saveMessage.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selectionModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-xl rounded-3xl border border-border bg-white p-6 shadow-2xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted">เลือกคำตอบ</p>
                  <h2 className="text-xl font-semibold text-foreground">{selectionModal.title}</h2>
                </div>
                <button onClick={() => setSelectionModal(null)} className="text-sm text-muted hover:text-foreground">
                  ปิด
                </button>
              </div>
              <div className="grid gap-3">
                {selectionModal.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelectionModalChoose(option)}
                    className="w-full rounded-2xl border border-border bg-slate-50 px-4 py-4 text-left text-sm font-semibold text-foreground transition hover:bg-slate-100"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface InputFieldProps {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}

function InputField({ label, value, onChange, onBlur, placeholder, type = 'text', disabled = false }: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm font-medium transition-all placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 focus:border-accent focus:outline-none"
      />
    </div>
  );
}
