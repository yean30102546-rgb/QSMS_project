import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Clock, ChevronRight } from 'lucide-react';

import { ImageUpload } from './ImageUpload';

interface AddCaseTabProps {
  caseSource: string;
  setCaseSource: (source: string) => void;
  formItems: any[];
  addFormItem: () => void;
  removeFormItem: (id: string) => void;
  updateFormItem: (id: string, field: string, value: string | number) => void;
  handleImagesSelected: (itemId: string, files: File[]) => void;
  uploadedImages: Record<string, File[]>;
  handleCheckItemNumber: (id: string) => void;
  handleItemNumberBlur: (id: string) => void;
  handleSubmit: () => void;
  isSaving: boolean;
  saveMessage: any;
  isSaveDisabled: (items: any[]) => boolean;
  autoFillTriggeredItem: string | null;
  selectionModal: any;
  setSelectionModal: (modal: any) => void;
}

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
}: AddCaseTabProps) {
  // State for inline selection
  const [expandedLeakSelection, setExpandedLeakSelection] = useState<string | null>(null);
  const [expandedResponsibleSelection, setExpandedResponsibleSelection] = useState<string | null>(null);

  const REASON_MAIN_OPTIONS = [
    'รั่ว',
    'แตกตะเข็บ',
    'รอยมีด',
    'ขวดเปื้อน',
    'กล่องเปื้อนอย่างเดียว',
    'อื่นๆ',
  ];

  const LEAK_SUBTYPES = ['รั่วซึม', 'รั่วซีลฟอยล์', 'รั่วตามด'];

  const REASON_DEFAULT_RESPONSIBLE: Record<string, 'SFC' | 'Supplier' | ''> = {
    'รั่วซึม': 'SFC',
    'รั่วตามด': 'Supplier',
    'แตกตะเข็บ': 'Supplier',
    'รอยมีด': 'Supplier',
    'ขวดเปื้อน': 'SFC',
  };

  const RESPONSIBLE_MAIN_OPTIONS = ['SFC', 'Supplier', 'Customer', 'อื่นๆ'];

  const RESPONSIBLE_SUBDIVISIONS: Record<string, string[]> = {
    SFC: ['PDF', 'WFG', 'WPK', 'อื่นๆ'],
    Supplier: ['SP', 'PJW', 'Polymer', 'ธนกร', 'Fuchs', 'อื่นๆ'],
    Customer: ['Customer'],
  };

  const openSelectionModal = (
    itemId: string,
    type: 'reason' | 'responsible',
    title: string,
    options: string[]
  ) => {
    setSelectionModal({ itemId, type, title, options });
  };

  const handleSelectionModalChoose = (value: string) => {
    if (!selectionModal) return;

    // Handle selection for reason subtype (leak)
    if (selectionModal.type === 'reason') {
      updateFormItem(selectionModal.itemId, 'reasonSubtype', value);
    } else if (selectionModal.type === 'responsible') {
      // Handle selection for responsible subtype
      updateFormItem(selectionModal.itemId, 'responsibleSubtype', value);
    }
    setSelectionModal(null);
  };

  const getReasonDropdownOptions = (item: any) => {
    const options = [...REASON_MAIN_OPTIONS];
    if (item.reason && !options.includes(item.reason)) {
      options.push(item.reason);
    }
    return options;
  };

  const getResponsibleDropdownOptions = (item: any) => {
    const base = [...RESPONSIBLE_MAIN_OPTIONS];
    if (item.responsible && !base.includes(item.responsible)) {
      base.push(item.responsible);
    }
    return base;
  };

  return (
    <motion.div
      key="add"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-5xl mx-auto space-y-10 pb-20"
    >
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">บันทึกงาน Rework ใหม่</h2>
          <p className="text-muted text-sm mt-1">เพิ่มข้อมูลล็อตสินค้าที่พบคราบหรือความเสียหาย</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
          <Clock size={12} /> บันทึกข้อมูลสด
        </div>
      </div>



      <div className="space-y-8">
        {/* Global Info */}
        <div className="glass-card p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-[0.1em] ml-1">แหล่งที่มาของงาน (Source) *</label>
              <select
                value={caseSource}
                onChange={(e) => setCaseSource(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-accent text-sm"
              >
                <option>SFC</option>
                <option>Customer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-6">
          {formItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 bg-white relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-20"></div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-bold text-accent flex items-center gap-2">
                  <Plus size={16} /> 📦 Item ที่ {idx + 1}
                </h3>
                {formItems.length > 1 && (
                  <motion.button
                    onClick={() => removeFormItem(item.id)}
                    whileHover={{ scale: 1.1, color: "rgb(239, 68, 68)" }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="p-1.5 text-muted hover:bg-red-50 rounded-lg will-change-transform"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                )}
              </div>

              {/* Row 1: Item Number + Verify Button */}
              <div className="space-y-2 mb-6">
                <label className="text-[10px] font-bold text-muted uppercase tracking-[0.1em] ml-1">
                  หมายเลขรายการ (Item Number) *
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={item.itemNumber}
                    onChange={(e) => updateFormItem(item.id, 'itemNumber', e.target.value)}
                    onBlur={() => handleItemNumberBlur(item.id)}
                    placeholder="เช่น 60001234"
                    disabled={isSaving}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-accent text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-400 transition-colors duration-200"
                  />
                  <motion.button
                    type="button"
                    onClick={() => handleCheckItemNumber(item.id)}
                    disabled={isSaving || !item.itemNumber.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25, duration: 0.15 }}
                    className="px-6 py-3 bg-amber-50 text-amber-700 border-2 border-amber-600 rounded-xl text-xs font-bold hover:bg-amber-100 active:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-opacity-50 whitespace-nowrap shadow-sm will-change-transform"
                  >
                    ✓ ตรวจสอบ
                  </motion.button>
                </div>
              </div>

              {/* Row 2: Item Name, Code, Amount */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-[0.1em] ml-1">
                    ชื่อรายการ (Item Name) *
                  </label>
                  <input
                    value={item.itemName}
                    onChange={(e) => updateFormItem(item.id, 'itemName', e.target.value)}
                    placeholder="เช่น Bottle Plastic 250ml"
                    disabled={isSaving}
                    className="w-full px-4 py-3 bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-accent text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-400 transition-colors duration-200"
                  />
                  <AnimatePresence>
                    {autoFillTriggeredItem === item.id && (
                      <motion.p
                        initial={{ opacity: 0, y: -6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="text-xs text-emerald-600 font-medium flex items-center gap-1"
                      >
                        ✓ ชื่อรายการถูกเติมอัตโนมัติ
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-[0.1em] ml-1">
                    สาเหตุที่พบ *
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={item.reason}
                        onChange={(e) => updateFormItem(item.id, 'reason', e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-accent text-sm disabled:opacity-50 text-slate-900"
                        disabled={isSaving}
                      >
                        <option value="" className="text-slate-400">กรุณาเลือก</option>
                        {getReasonDropdownOptions(item).map((option) => (
                          <option key={option} value={option} className="text-slate-900">{option}</option>
                        ))}
                      </select>
                      {item.reason === 'รั่ว' && (
                        <button
                          type="button"
                          onClick={() => setExpandedLeakSelection(expandedLeakSelection === item.id ? null : item.id)}
                          className="px-4 py-3 bg-accent/10 text-accent border border-accent rounded-xl text-sm font-semibold hover:bg-accent/20 transition-colors duration-200 disabled:opacity-50 whitespace-nowrap"
                          disabled={isSaving}
                          title="เลือกรูปแบบการรั่ว"
                        >
                          เลือก
                        </button>
                      )}
                    </div>
                    <AnimatePresence>
                      {item.reason === 'รั่ว' && expandedLeakSelection === item.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-1 gap-2"
                        >
                          {LEAK_SUBTYPES.map((subtype) => (
                            <button
                              key={subtype}
                              type="button"
                              onClick={() => {
                                updateFormItem(item.id, 'reasonSubtype', subtype);
                                setExpandedLeakSelection(null);
                              }}
                              className={`px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-200 ${item.reasonSubtype === subtype
                                  ? 'bg-accent text-white border border-accent'
                                  : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                                }`}
                              disabled={isSaving}
                            >
                              {subtype}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {item.reason === 'รั่ว' && item.reasonSubtype && (
                      <div className="px-3 py-2 bg-accent/10 border border-accent rounded-lg">
                        <p className="text-[10px] text-muted font-semibold mb-1">เลือก: </p>
                        <p className="text-sm font-semibold text-accent">{item.reasonSubtype}</p>
                      </div>
                    )}
                    {item.reason === 'รั่ว' && !item.reasonSubtype && (
                      <p className="text-[10px] text-amber-600 font-medium">⚠ กรุณาเลือกรูปแบบการรั่ว</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-[0.1em] ml-1">
                    ผู้รับผิดชอบ *
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={item.responsible}
                        onChange={(e) => updateFormItem(item.id, 'responsible', e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-accent text-sm disabled:opacity-50 text-slate-900"
                        disabled={isSaving}
                      >
                        <option value="" className="text-slate-400">กรุณาเลือก</option>
                        {getResponsibleDropdownOptions(item).map(option => (
                          <option key={option} value={option} className="text-slate-900">{option}</option>
                        ))}
                      </select>
                      {(item.responsible === 'SFC' || item.responsible === 'Supplier') && (
                        <button
                          type="button"
                          onClick={() => setExpandedResponsibleSelection(expandedResponsibleSelection === item.id ? null : item.id)}
                          className="px-4 py-3 bg-accent/10 text-accent border border-accent rounded-xl text-sm font-semibold hover:bg-accent/20 transition-colors duration-200 disabled:opacity-50 whitespace-nowrap"
                          disabled={isSaving}
                          title={`เลือกระดับผู้รับผิดชอบ (${item.responsible})`}
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
                          {RESPONSIBLE_SUBDIVISIONS[item.responsible as 'SFC' | 'Supplier' | 'Customer'].map((subtype) => (
                            <button
                              key={subtype}
                              type="button"
                              onClick={() => {
                                updateFormItem(item.id, 'responsibleSubtype', subtype);
                                setExpandedResponsibleSelection(null);
                              }}
                              className={`px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-200 ${item.responsibleSubtype === subtype
                                  ? 'bg-accent text-white border border-accent'
                                  : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
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
                      <div className="px-3 py-2 bg-accent/10 border border-accent rounded-lg">
                        <p className="text-[10px] text-muted font-semibold mb-1">เลือก: </p>
                        <p className="text-sm font-semibold text-accent">{item.responsibleSubtype}</p>
                      </div>
                    )}
                    {item.responsible === 'SFC' && !item.responsibleSubtype && (
                      <p className="text-[10px] text-amber-600 font-medium">⚠ กรุณาเลือกแผนก SFC</p>
                    )}
                    {item.responsible === 'Supplier' && !item.responsibleSubtype && (
                      <p className="text-[10px] text-amber-600 font-medium">⚠ กรุณาเลือก Supplier</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-[0.1em] ml-1">
                    รายละเอียดเพิ่มเติม
                  </label>
                  <textarea
                    rows={3}
                    value={item.details || ''}
                    onChange={(e) => updateFormItem(item.id, 'details', e.target.value)}
                    placeholder="ระบุรายละเอียดเพิ่มเติม..."
                    className="w-full px-4 py-3 bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-accent text-sm resize-none disabled:opacity-50"
                    disabled={isSaving}
                  ></textarea>
                </div>

                {/* Image Upload */}
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

          <div className="flex gap-4">
            <motion.button
              onClick={addFormItem}
              disabled={isSaving}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 py-4 border border-border border-dashed rounded-2xl text-muted text-xs font-bold uppercase tracking-widest hover:bg-slate-50 flex items-center justify-center gap-2 disabled:opacity-50 will-change-transform"
            >
              <Plus size={16} /> [ + ] เพิ่มรายการ
            </motion.button>
            <motion.button
              onClick={handleSubmit}
              disabled={isSaveDisabled(formItems) || isSaving}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="flex-[2] py-4 bg-accent text-white rounded-2xl text-sm font-bold hover:bg-black active:bg-black shadow-xl shadow-accent/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed will-change-transform"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  บันทึกข้อมูลเข้าสู่ระบบ <ChevronRight size={16} />
                </>
              )}
            </motion.button>
          </div>

          {/* Success/Error Message */}
          <AnimatePresence>
            {saveMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-lg font-semibold text-sm ${
                  saveMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {saveMessage.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Selection Modal */}
      <AnimatePresence>
        {selectionModal && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-border"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] text-muted uppercase tracking-[0.18em] mb-1">เลือกคำตอบ</p>
                  <h2 className="text-xl font-semibold text-foreground">{selectionModal.title}</h2>
                </div>
                <button
                  onClick={() => setSelectionModal(null)}
                  className="text-sm text-muted hover:text-foreground"
                >
                  ปิด
                </button>
              </div>
              <div className="grid gap-3">
                {selectionModal.options.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelectionModalChoose(option)}
                    className="w-full rounded-2xl border border-border bg-slate-50 px-4 py-4 text-left text-sm font-semibold text-foreground hover:bg-slate-100 transition"
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

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
}: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase text-muted tracking-[0.1em] ml-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-3 bg-slate-50 border border-border rounded-xl focus:outline-none focus:border-accent transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-400"
      />
    </div>
  );
}
