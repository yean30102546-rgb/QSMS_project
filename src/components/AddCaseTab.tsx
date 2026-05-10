import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, Clock, Plus, Trash2, HelpCircle } from 'lucide-react';

import type { ReworkItem } from '../services/api';
import { ImageUpload } from './ImageUpload';

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
  updateFormItem: (id: string, field: string, value: string | number) => void;
  handleImagesSelected: (itemId: string, files: File[]) => void;
  uploadedImages: Record<string, File[]>;
  handleCheckItemNumber: (id: string) => void;
  handleItemNumberBlur: (id: string) => void;
  handleSubmit: () => void;
  isSaving: boolean;
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

const LEAK_SUBTYPES = ['รั่วซึม', 'รั่วซีลฟอยล์', 'รั่วตามด', 'แตกตะเข็บ', 'รอยมีด'] as const;
const STAIN_SUBTYPES = ['ขวดเปื้อน', 'กล่องเปื้อน'] as const;

const RESPONSIBLE_MAIN_OPTIONS = ['SFC', 'Supplier', 'Customer', 'อื่นๆ'] as const;

const RESPONSIBLE_SUBDIVISIONS: Record<string, string[]> = {
  SFC: ['PDF', 'WFG', 'WPK', 'อื่นๆ'],
  Supplier: ['SP', 'PJW', 'Polymer', 'ธนกร', 'Fuchs', 'อื่นๆ'],
  Customer: ['Customer'],
};

export function AddCaseTab({
  caseSource,
  setCaseSource,
  formItems,
  addFormItem,
  removeFormItem,
  updateFormItem,
  handleImagesSelected,
  uploadedImages,
  handleCheckItemNumber,
  handleItemNumberBlur,
  handleSubmit,
  isSaving,
  saveMessage,
  isSaveDisabled,
  autoFillTriggeredItem,
  selectionModal,
  setSelectionModal,
  onOpenTutorial,
}: AddCaseTabProps) {
  const [expandedReasonSelection, setExpandedReasonSelection] = useState<string | null>(null);
  const [expandedResponsibleSelection, setExpandedResponsibleSelection] = useState<string | null>(null);

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
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted">
          <Clock size={12} /> บันทึกข้อมูลสด
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
        </div>

        <div className="space-y-6">
          {formItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card relative overflow-hidden bg-white p-8"
            >
              <div className="absolute left-0 top-0 h-full w-1 bg-accent opacity-20" />
              <div className="mb-8 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-accent">
                  <Plus size={16} /> Item {idx + 1}
                </h3>
                {formItems.length > 1 && (
                  <motion.button
                    onClick={() => removeFormItem(item.id)}
                    whileHover={{ scale: 1.1, color: 'rgb(239, 68, 68)' }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="will-change-transform rounded-lg p-1.5 text-muted hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                )}
              </div>

              <div className="mb-6 space-y-2">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                  หมายเลขรายการ (Item Number) *
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={item.itemNumber}
                    onChange={(e) => updateFormItem(item.id, 'itemNumber', e.target.value)}
                    onBlur={() => handleItemNumberBlur(item.id)}
                    placeholder="เช่น 60001234A"
                    disabled={isSaving}
                    className="flex-1 rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm font-medium transition-colors duration-200 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 focus:border-accent focus:outline-none"
                  />
                  <motion.button
                    type="button"
                    onClick={() => handleCheckItemNumber(item.id)}
                    disabled={isSaving || !item.itemNumber.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25, duration: 0.15 }}
                    className="will-change-transform whitespace-nowrap rounded-xl border-2 border-amber-600 bg-amber-50 px-6 py-3 text-xs font-bold text-amber-700 shadow-sm hover:bg-amber-100 active:bg-amber-200 disabled:cursor-not-allowed disabled:border-opacity-50 disabled:opacity-50"
                  >
                    ตรวจสอบ
                  </motion.button>
                </div>
              </div>

              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                    ชื่อรายการ (Item Name) *
                  </label>
                  <input
                    value={item.itemName}
                    onChange={(e) => updateFormItem(item.id, 'itemName', e.target.value)}
                    placeholder="เช่น Bottle Plastic 250ml"
                    disabled={isSaving}
                    className="w-full rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm font-medium transition-colors duration-200 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 focus:border-accent focus:outline-none"
                  />
                  <AnimatePresence>
                    {autoFillTriggeredItem === item.id && (
                      <motion.p
                        initial={{ opacity: 0, y: -6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="flex items-center gap-1 text-xs font-medium text-emerald-600"
                      >
                        ชื่อรายการถูกเติมอัตโนมัติจากฐานข้อมูล
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <InputField
                  label="รหัสรายการ (Item Code)"
                  value={item.itemCode}
                  onChange={(v) => updateFormItem(item.id, 'itemCode', v)}
                  placeholder="เช่น 40001234"
                  disabled={isSaving}
                />
                <InputField
                  label="จำนวน (Box) *"
                  type="number"
                  value={item.amount}
                  onChange={(v) => updateFormItem(item.id, 'amount', v)}
                  disabled={isSaving}
                />
                <InputField
                  label="Batch no. (Number only) *"
                  value={item.batchNo || ''}
                  onChange={(v) => updateFormItem(item.id, 'batchNo', v)}
                  placeholder="เช่น 240510"
                  disabled={isSaving}
                />
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
                                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                                    isSelected
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
                              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-200 ${
                                item.responsibleSubtype === subtype
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
            </motion.div>
          ))}

          <div className="flex flex-col gap-4 sm:flex-row">
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
              className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-bold text-white shadow-xl shadow-accent/10 hover:bg-black active:bg-black disabled:cursor-not-allowed disabled:opacity-50 sm:h-auto"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  บันทึกข้อมูลเข้าสู่ระบบ <ChevronRight size={16} />
                </>
              )}
            </motion.button>
          </div>

          <AnimatePresence>
            {saveMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`rounded-lg border p-4 text-sm font-semibold ${
                  saveMessage.type === 'success'
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
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}

function InputField({ label, value, onChange, placeholder, type = 'text', disabled = false }: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm font-medium transition-all placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 focus:border-accent focus:outline-none"
      />
    </div>
  );
}
