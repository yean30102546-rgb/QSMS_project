'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, Clock, Plus, Trash2, HelpCircle, X, Copy, Search } from 'lucide-react';
import { useForm, useFieldArray, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useReworkData } from '../../contexts/ReworkDataContext';
import { useItemVerification } from '../../hooks/useItemVerification';
import type { ReworkItem, ReworkCase } from '../../services/api';
import { CUSTOMER_OPTIONS, insertCase } from '../../services/api';
import { ImageUpload } from '../ui/ImageUpload';
import { AppleProgressBar } from '../ui/AppleProgressBar';
import { convertDMYToYMD, convertYMDToDMY, findDuplicateItemNumbers } from '../../utils/helpers';
import { ConflictModal } from '../modals/ConflictModal';

type SaveMessage = {
  type: 'success' | 'error';
  text: string;
} | null;

type SelectionModalState = {
  itemIndex: number;
  type: 'reason' | 'responsible';
  title: string;
  options: string[];
} | null;

interface AddCaseTabProps {
  onOpenTutorial?: () => void;
}

const REASON_MAIN_OPTIONS = ['รั่ว', 'เปื้อน', 'อื่นๆ'] as const;
const LEAK_SUBTYPES = ['รั่วซึม', 'รั่วซีลฟอยล์', 'รั่วตามด', 'รั่วรอยลากแกลลอน', 'รั่วขูดเจาะ', 'รั่วโดนเครื่องจักร', 'รั่วกระแทก', 'รั่วตะเข็บ', ' รั่วบุบแตก', 'รอยมีด'] as const;
const STAIN_SUBTYPES = ['ขวดเปื้อน', 'กล่องเปื้อน'] as const;
const RESPONSIBLE_MAIN_OPTIONS = ['SFC', 'Supplier', 'Customer', 'อื่นๆ'] as const;

const RESPONSIBLE_SUBDIVISIONS: Record<string, string[]> = {
  SFC: ['PDF', 'PDB', 'WPK', 'WFG', 'อื่นๆ'],
  Supplier: ['SP', 'PJW', 'Polymer', 'ธนกร', 'Fuchs', 'อื่นๆ'],
  Customer: ['Customer'],
};

const initialFormItem = {
  customerName: '',
  itemNumber: '',
  itemCode: '',
  itemName: '',
  batchNo: '',
  gallonDate: '',
  boxNumber: '',
  mold: '',
  line: '',
  amount: 0,
  reason: '',
  reasonSubtype: '',
  responsible: '',
  responsibleSubtype: '',
  details: '',
  linkedSourceId: '',
  verificationStatus: 'idle' as const,
  lastActiveField: 'itemNumber' as const,
};

const reworkItemSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  itemNumber: z.string(),
  itemCode: z.string(),
  itemName: z.string(),
  batchNo: z.string().optional().nullable(),
  gallonDate: z.string().optional().nullable(),
  boxNumber: z.string().optional().nullable(),
  mold: z.string().optional().nullable(),
  line: z.string().optional().nullable(),
  amount: z.number().min(0),
  reason: z.string(),
  reasonSubtype: z.string().optional().nullable(),
  responsible: z.string(),
  responsibleSubtype: z.string().optional().nullable(),
  details: z.string().optional().nullable(),
  linkedSourceId: z.string().optional().nullable(),
  verificationStatus: z.string().optional().nullable(),
  lastActiveField: z.string().optional().nullable()
});

const formSchema = z.object({
  caseSource: z.string(),
  caseNumber: z.string(),
  items: z.array(reworkItemSchema)
});

type FormValues = z.infer<typeof formSchema>;

export function AddCaseTab({ onOpenTutorial }: AddCaseTabProps) {
  const { cases, loadCases } = useReworkData();
  
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [saveMessage, setSaveMessage] = useState<SaveMessage>(null);
  
  const [uploadedImages, setUploadedImages] = useState<Record<string, File[]>>({});
  const [orFiles, setOrFiles] = useState<File[]>([]);
  
  const [selectionModal, setSelectionModal] = useState<SelectionModalState>(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [autoFillTriggeredItem, setAutoFillTriggeredItem] = useState<string | null>(null);

  const [expandedReasonSelection, setExpandedReasonSelection] = useState<number | null>(null);
  const [expandedResponsibleSelection, setExpandedResponsibleSelection] = useState<number | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caseSource: 'SFC',
      caseNumber: '',
      items: [{ ...initialFormItem, id: `form-${Date.now()}` }]
    }
  });

  const { control, register, handleSubmit, watch, setValue, getValues, reset } = methods;
  
  const { fields, append, remove, insert, update } = useFieldArray({
    control,
    name: 'items'
  });

  const caseSource = watch('caseSource');
  const caseNumber = watch('caseNumber');
  const formItems = watch('items');

  const { triggerDebouncedVerification } = useItemVerification({
    onConflict: () => setIsConflictModalOpen(true),
    onAutofillTriggered: (itemId) => {
      setAutoFillTriggeredItem(itemId);
      setTimeout(() => setAutoFillTriggeredItem(null), 1500);
    },
    getValues: methods.getValues,
    setValue: methods.setValue
  });

  // Restore session state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedItems = sessionStorage.getItem('rework_formItems');
      const savedSource = sessionStorage.getItem('rework_caseSource');
      if (savedSource) setValue('caseSource', savedSource);
      if (savedItems) {
        try {
          const parsed = JSON.parse(savedItems);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setValue('items', parsed);
          }
        } catch(e) {}
      }
      
      // Allow DOM to update with restored state before enabling animations
      requestAnimationFrame(() => {
        setTimeout(() => setIsRestoring(false), 10);
      });
    }
  }, [setValue]);

  // Save session state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('rework_caseSource', caseSource);
      sessionStorage.setItem('rework_formItems', JSON.stringify(formItems));
    }
  }, [caseSource, formItems]);

  const existingCaseIds = cases.map(c => c.id);

  const isSaveDisabled = (items: typeof formItems) => {
    return items.some((item) => {
      const imgCount = (uploadedImages[item.id] || []).length;
      return (
        !item.customerName ||
        !item.reason ||
        !item.responsible ||
        (!item.itemNumber && !item.itemCode) ||
        !item.itemName ||
        imgCount === 0 ||
        ((item.reason === 'รั่ว' || item.reason === 'เปื้อน') && !item.reasonSubtype)
      );
    });
  };

  const clearAllForm = () => {
    if (window.confirm('คุณต้องการล้างข้อมูลที่กรอกค้างไว้ทั้งหมดใช่หรือไม่? ข้อมูลและไฟล์ที่แนบไว้จะหายไปทั้งหมด')) {
      reset({
        caseSource: 'SFC',
        caseNumber: '',
        items: [{ ...initialFormItem, id: `form-${Date.now()}` }]
      });
      setUploadedImages({});
      setOrFiles([]);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (isSaveDisabled(data.items)) {
      alert('กรุณากรอกข้อมูลสินค้าให้ครบถ้วนและถูกต้อง (ต้องระบุรหัสสินค้า, บาร์โค้ด, ชื่อสินค้า และแนบรูปภาพอย่างน้อย 1 รูป)');
      return;
    }

    const trimmedNumber = data.caseNumber.trim();
    if (!trimmedNumber) {
      alert('กรุณากรอกหมายเลขเคส (Running Number)');
      return;
    }

    const prefix = String(data.caseSource).toLowerCase() === 'customer' ? 'RT' : 'RW';
    const currentYear = new Date().getFullYear();
    const composedCaseId = `${prefix}${trimmedNumber}-${currentYear}`;

    if (existingCaseIds.includes(composedCaseId)) {
      alert(`หมายเลขเคส "${composedCaseId}" มีอยู่ในระบบแล้ว กรุณาใช้หมายเลขอื่น`);
      return;
    }

    try {
      setIsSaving(true);
      setProgress(10);
      setStatusText('กำลังเตรียมข้อมูล...');

      // Transform items for API
      const apiItems = data.items.map(item => ({
        ...item,
        amount: Number(item.amount) || 0
      })) as ReworkItem[];

      setProgress(40);
      setStatusText('กำลังบันทึกข้อมูลเข้าสู่ฐานข้อมูล...');

      const result = await insertCase(data.caseSource, apiItems, uploadedImages, orFiles, composedCaseId);
      
      if (result.success) {
        setProgress(100);
        setStatusText('บันทึกสำเร็จ!');
        setIsComplete(true);
        setSaveMessage({ type: 'success', text: 'บันทึกสำเร็จ' });
        
        // Reset form
        setTimeout(() => {
          reset({
            caseSource: 'SFC',
            caseNumber: '',
            items: [{ ...initialFormItem, id: `form-${Date.now()}` }]
          });
          setUploadedImages({});
          setOrFiles([]);
          setIsSaving(false);
          setIsComplete(false);
          setProgress(0);
          setSaveMessage(null);
          loadCases();
        }, 1500);
      } else {
        throw new Error(result.error || 'ไม่สามารถบันทึกได้');
      }
    } catch (error) {
      setIsSaving(false);
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบันทึก'
      });
    }
  };

  return (
    <FormProvider {...methods}>
      <div
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
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-red-600 hover:border-red-200"
            >
              <Trash2 size={12} /> ล้างฟอร์มทั้งหมด
            </button>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-500">
              <Clock size={12} /> บันทึกข้อมูลสด
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-card bg-white p-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-2">
                <label className="ml-1 text-xs font-semibold text-slate-500">แหล่งที่มาของงาน (Source) *</label>
                <select
                  {...register('caseSource')}
                  className="w-full rounded-xl border border-border bg-slate-50/50 px-4 py-3 text-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                >
                  <option value="SFC">SFC</option>
                  <option value="Customer">Customer</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-xs font-semibold text-slate-500">หมายเลขเคส (Case ID) *</label>
                <div className={`flex items-center w-fit overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] border transition-all duration-300 focus-within:bg-white focus-within:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_0_0_3px_rgba(59,130,246,0.15)] group ${!caseNumber.trim() ? 'border-red-400/60 focus-within:border-red-400/80' : 'border-slate-200/60 focus-within:border-blue-400/30'}`}>
                  <span className={`inline-flex items-center pl-4 pr-1 py-2.5 text-[15px] font-medium select-none transition-colors duration-200 ${!caseNumber.trim() ? 'text-red-400' : 'text-slate-400'}`}>
                    {String(caseSource).toLowerCase() === 'customer' ? 'RT' : 'RW'}
                  </span>
                  <input
                    type="text"
                    {...register('caseNumber', {
                      onChange: (e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, '');
                      }
                    })}
                    placeholder="012"
                    className="w-14 bg-transparent px-0 py-2.5 text-[15px] font-semibold text-center text-slate-800 outline-none border-none placeholder:text-slate-300 placeholder:font-normal"
                    maxLength={4}
                  />
                  <span className={`inline-flex items-center pr-4 pl-1 py-2.5 text-[15px] font-medium select-none ${!caseNumber.trim() ? 'text-red-400' : 'text-slate-400'}`}>
                    - {new Date().getFullYear()}
                  </span>
                </div>
                {!caseNumber.trim() ? (
                  <p className="ml-1 text-xs font-semibold text-red-600">⚠️ จำเป็นต้องกรอกหมายเลขเคส</p>
                ) : (() => {
                  const composedId = `${String(caseSource).toLowerCase() === 'customer' ? 'RT' : 'RW'}${caseNumber.trim()}-${new Date().getFullYear()}`;
                  const isDuplicate = existingCaseIds.includes(composedId);
                  return isDuplicate ? (
                    <p className="ml-1 text-xs font-semibold text-red-600">⚠️ Case ID "{composedId}" มีอยู่ในระบบแล้ว</p>
                  ) : (
                    <p className="ml-1 text-xs font-semibold text-emerald-600">✓ Case ID: {composedId}</p>
                  );
                })()}
              </div>
            </div>
            
            {formItems.length > 0 && formItems.every(item => item.customerName === 'OR') && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="mt-6 border-t border-slate-100 pt-6">
                <div className="rounded-2xl bg-amber-50 p-6 border border-amber-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                      <HelpCircle size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">เอกสารสำหรับ OR (Optional)</h4>
                      <p className="text-xs text-amber-700/80">แนบไฟล์ Excel, PDF หรือ PNG (สูงสุด 2 ไฟล์)</p>
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
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
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

          <div className="flex flex-col">
            <AnimatePresence initial={false}>
            {fields.map((field, idx) => {
              const item = formItems[idx];
              if (!item) return null;
              
              return (
              <motion.div
                key={field.id}
                id={`form-card-wrapper-${item.id}`}
                initial={isRestoring ? false : { opacity: 0, height: 0, scale: 0.98, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', scale: 1, marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, scale: 0.95, marginBottom: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden"
              >
                <div 
                  id={`form-card-${item.id}`}
                  className="glass-card relative overflow-hidden bg-white p-5 sm:p-8"
                >
                  <div className="absolute left-0 top-0 h-full w-1 bg-accent opacity-20" />
                  <div className="mb-8 flex items-center justify-between">
                  <h3 className="flex items-center gap-2.5 text-sm font-bold text-accent">
                    <Plus size={16} /> รายการที่ {idx + 1}
                    {item.verificationStatus === 'verified' && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> พบในระบบ
                      </span>
                    )}
                    {item.verificationStatus === 'new' && (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> สินค้าใหม่
                      </span>
                    )}
                    {item.verificationStatus === 'checking' && (
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> กำลังตรวจสอบ...
                      </span>
                    )}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="ml-1 text-xs font-semibold text-slate-500">ชื่อลูกค้า (Customer Name) *</label>
                    <select
                      {...register(`items.${idx}.customerName`)}
                      className="w-full rounded-xl border border-border bg-slate-50/50 px-4 py-3 text-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none disabled:opacity-50 h-[46px]"
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
                      <label className="text-xs font-semibold text-slate-500">หมายเลขบาร์โค้ด (Item Number)</label>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        autoComplete="off"
                        {...register(`items.${idx}.itemNumber`, {
                          onChange: (e) => {
                            const val = e.target.value.replace(/[<>]/g, '').slice(0, 50);
                            setValue(`items.${idx}.lastActiveField`, 'itemNumber');
                            triggerDebouncedVerification(item.id, idx, 'itemNumber', val);
                          }
                        })}
                        placeholder="เช่น 60001234A"
                        disabled={isSaving}
                        className={`w-full rounded-xl border pl-4 pr-10 py-3 text-sm font-medium transition-all duration-200 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none ${item.lastActiveField === 'itemNumber' ? 'border-blue-500 bg-white ring-4 ring-blue-500/10' : 'border-border bg-slate-50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'}`}
                      />
                      <button
                        type="button"
                        onClick={() => triggerDebouncedVerification(item.id, idx, 'itemNumber', item.itemNumber)}
                        disabled={isSaving || !item.itemNumber}
                        className="absolute right-3 text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors"
                      >
                        <Search size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1 mb-1.5">
                      <label className="text-xs font-semibold text-slate-500">รหัสสินค้า (Item Code)</label>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        autoComplete="off"
                        {...register(`items.${idx}.itemCode`, {
                          onChange: (e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 50);
                            setValue(`items.${idx}.lastActiveField`, 'itemCode');
                            triggerDebouncedVerification(item.id, idx, 'itemCode', val);
                          }
                        })}
                        placeholder="เช่น 40001234"
                        disabled={isSaving}
                        className={`w-full rounded-xl border pl-4 pr-10 py-3 text-sm font-medium transition-all duration-200 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none ${item.lastActiveField === 'itemCode' ? 'border-blue-500 bg-white ring-4 ring-blue-500/10' : 'border-border bg-slate-50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'}`}
                      />
                      <button
                        type="button"
                        onClick={() => triggerDebouncedVerification(item.id, idx, 'itemCode', item.itemCode)}
                        disabled={isSaving || !item.itemCode}
                        className="absolute right-3 text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors"
                      >
                        <Search size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <InputField label="ชื่อรายการ (Item Name) *" {...register(`items.${idx}.itemName`)} disabled={isSaving} />
                </div>

                <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div className="col-span-2 sm:col-span-1">
                    <Controller
                      control={control}
                      name={`items.${idx}.batchNo`}
                      render={({ field }) => (
                        <InputField label="หมายเลขล็อต (Batch no.)" type="date" value={convertDMYToYMD(field.value || '')} onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(convertYMDToDMY(e.target.value))} disabled={isSaving} />
                      )}
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Controller
                      control={control}
                      name={`items.${idx}.gallonDate`}
                      render={({ field }) => (
                        <InputField label="วันที่ผลิตแกลลอน" type="date" value={convertDMYToYMD(field.value || '')} onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(convertYMDToDMY(e.target.value))} disabled={isSaving} />
                      )}
                    />
                  </div>
                  <div className="col-span-1"><InputField label="เลขกล่อง" {...register(`items.${idx}.boxNumber`)} disabled={isSaving} /></div>
                  <div className="col-span-1"><InputField label="Mold" {...register(`items.${idx}.mold`)} disabled={isSaving} /></div>
                  <div className="col-span-1"><InputField label="Line" {...register(`items.${idx}.line`)} disabled={isSaving} /></div>
                  <div className="col-span-1"><InputField label="จำนวน (Amount)" type="number" {...register(`items.${idx}.amount`, { valueAsNumber: true })} disabled={isSaving} /></div>
                </div>

                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="ml-1 text-xs font-semibold text-slate-500">สาเหตุที่พบ *</label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <select
                          {...register(`items.${idx}.reason`, {
                            onChange: (e) => {
                              setValue(`items.${idx}.reasonSubtype`, '');
                              if (e.target.value !== 'รั่ว' && e.target.value !== 'เปื้อน') setExpandedReasonSelection(null);
                            }
                          })}
                          className="flex-1 rounded-xl border border-border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                        >
                          <option value="">กรุณาเลือก</option>
                          {REASON_MAIN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        {(item.reason === 'รั่ว' || item.reason === 'เปื้อน') && (
                          <button
                            type="button"
                            onClick={() => setExpandedReasonSelection(expandedReasonSelection === idx ? null : idx)}
                            className="whitespace-nowrap rounded-xl border border-accent bg-accent/10 px-4 py-3 text-sm font-semibold text-accent transition-colors duration-200 hover:bg-accent/20"
                          >
                            เลือก
                          </button>
                        )}
                      </div>
                      <AnimatePresence>
                        {(item.reason === 'รั่ว' || item.reason === 'เปื้อน') && expandedReasonSelection === idx && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="grid grid-cols-1 gap-2">
                            {(item.reason === 'รั่ว' ? LEAK_SUBTYPES : STAIN_SUBTYPES).map(subtype => {
                              const isSelected = item.reason === 'รั่ว' ? item.reasonSubtype === subtype : (item.reasonSubtype || '').split(', ').includes(subtype);
                              return (
                                <button
                                  key={subtype}
                                  type="button"
                                  onClick={() => {
                                    if (item.reason === 'รั่ว') {
                                      setValue(`items.${idx}.reasonSubtype`, subtype);
                                      setExpandedReasonSelection(null);
                                    } else {
                                      const current = (item.reasonSubtype || '').split(', ').filter(Boolean);
                                      const pos = current.indexOf(subtype);
                                      if (pos > -1) current.splice(pos, 1);
                                      else current.push(subtype);
                                      setValue(`items.${idx}.reasonSubtype`, current.join(', '));
                                    }
                                  }}
                                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${isSelected ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}
                                >{subtype}</button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {item.reasonSubtype && (
                        <div className="rounded-lg border border-accent bg-accent/10 px-3 py-2">
                          <p className="mb-1 text-xs font-semibold text-slate-500">เลือก:</p>
                          <p className="text-sm font-semibold text-accent">{item.reasonSubtype}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-xs font-semibold text-slate-500">ผู้รับผิดชอบ *</label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <select
                          {...register(`items.${idx}.responsible`, {
                            onChange: (e) => {
                              setValue(`items.${idx}.responsibleSubtype`, '');
                              if (e.target.value !== 'SFC' && e.target.value !== 'Supplier') setExpandedResponsibleSelection(null);
                            }
                          })}
                          className="flex-1 rounded-xl border border-border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                        >
                          <option value="">กรุณาเลือก</option>
                          {RESPONSIBLE_MAIN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        {(item.responsible === 'SFC' || item.responsible === 'Supplier') && (
                          <button
                            type="button"
                            onClick={() => setExpandedResponsibleSelection(expandedResponsibleSelection === idx ? null : idx)}
                            className="whitespace-nowrap rounded-xl border border-accent bg-accent/10 px-4 py-3 text-sm font-semibold text-accent"
                          >
                            เลือก
                          </button>
                        )}
                      </div>
                      <AnimatePresence>
                        {(item.responsible === 'SFC' || item.responsible === 'Supplier') && expandedResponsibleSelection === idx && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="grid grid-cols-1 gap-2">
                            {(RESPONSIBLE_SUBDIVISIONS[item.responsible] || []).map(subtype => (
                              <button
                                key={subtype}
                                type="button"
                                onClick={() => {
                                  setValue(`items.${idx}.responsibleSubtype`, subtype);
                                  setExpandedResponsibleSelection(null);
                                }}
                                className={`rounded-xl px-4 py-3 text-sm font-semibold ${item.responsibleSubtype === subtype ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}
                              >{subtype}</button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {item.responsibleSubtype && (
                        <div className="rounded-lg border border-accent bg-accent/10 px-3 py-2">
                          <p className="mb-1 text-xs font-semibold text-slate-500">เลือก:</p>
                          <p className="text-sm font-semibold text-accent">{item.responsibleSubtype}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {item.reason === 'เปื้อน' && formItems.some((i, iidx) => i.reason === 'รั่ว' && iidx !== idx) && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="mb-8 overflow-hidden">
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
                                  if (!e.target.checked) setValue(`items.${idx}.linkedSourceId`, '');
                                  else {
                                    const leaks = formItems.filter((i, iidx) => i.reason === 'รั่ว' && iidx !== idx);
                                    if (leaks.length === 1) setValue(`items.${idx}.linkedSourceId`, leaks[0].id);
                                  }
                                }}
                                className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                              />
                              สาเหตุมาจากไอเทมที่รั่วในเคสนี้
                            </label>
                          </div>
                        </div>

                        <AnimatePresence>
                          {item.linkedSourceId && (
                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-amber-900/60">ไอเทมต้นเหตุ *</label>
                              <select
                                {...register(`items.${idx}.linkedSourceId`)}
                                className="min-w-[200px] rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-amber-900 shadow-sm focus:border-amber-500 focus:outline-none"
                              >
                                <option value="">-- เลือกรายการ --</option>
                                {formItems.filter((i, iidx) => i.reason === 'รั่ว' && iidx !== idx).map(leak => (
                                  <option key={leak.id} value={leak.id}>
                                    {leak.itemNumber || 'ไม่ระบุเบอร์'} - {leak.itemName || 'ไม่ระบุชื่อ'}
                                  </option>
                                ))}
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
                    <label className="ml-1 text-xs font-semibold text-slate-500">รายละเอียดเพิ่มเติม</label>
                    <textarea
                      rows={3}
                      {...register(`items.${idx}.details`)}
                      placeholder="ระบุรายละเอียดเพิ่มเติม..."
                      className="w-full resize-none rounded-xl border border-border bg-slate-50/50 px-4 py-3 text-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <ImageUpload
                      itemIndex={idx}
                      onImagesSelected={(files) => setUploadedImages(prev => ({ ...prev, [item.id]: files }))}
                      currentImages={uploadedImages[item.id] || []}
                      maxImages={5}
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-slate-100 pt-6">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    onClick={() => {
                      const dup = { ...item, id: `form-${Date.now()}` };
                      insert(idx + 1, dup);
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-indigo-50/80 px-4 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
                  >
                    <Copy size={16} /> คัดลอกรายการ
                  </motion.button>
                  {fields.length > 1 ? (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      onClick={() => {
                        remove(idx);
                        setUploadedImages(prev => { const n = {...prev}; delete n[item.id]; return n; });
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl bg-red-50/80 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} /> ลบรายการ
                    </motion.button>
                  ) : (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      onClick={() => {
                        update(idx, { ...initialFormItem, id: item.id });
                        setUploadedImages(prev => { const n = {...prev}; delete n[item.id]; return n; });
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      <Trash2 size={16} /> ล้างข้อมูลการ์ดนี้
                    </motion.button>
                  )}
                  </div>
                </div>
              </motion.div>
            );})}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {isSaving ? (
                <motion.div
                  key="saving-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                >
                  <AppleProgressBar progress={progress} statusText={statusText} isComplete={isComplete} />
                </motion.div>
              ) : (
                <div className="flex flex-col w-full gap-4">
                  <div className="flex flex-col gap-4 sm:flex-row w-full">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.01, backgroundColor: 'rgba(241,245,249,1)' }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      onClick={() => append({ ...initialFormItem, id: `form-${Date.now()}` })}
                      disabled={isSaving}
                      className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm font-semibold text-slate-500 disabled:opacity-50 sm:h-auto"
                    >
                      <Plus size={16} /> [ + ] เพิ่มรายการ
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      onClick={handleSubmit(onSubmit)}
                      disabled={isSaveDisabled(formItems) || isSaving || !caseNumber.trim()}
                      className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-bold text-white shadow-xl shadow-accent/10 hover:bg-black active:bg-black disabled:cursor-not-allowed disabled:opacity-50 sm:h-auto transition-colors"
                    >
                      บันทึกข้อมูลเข้าสู่ระบบ <ChevronRight size={16} />
                    </motion.button>
                  </div>
                </div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {saveMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className={`rounded-lg border p-4 text-sm font-semibold ${saveMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}
                >
                  {saveMessage.text}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <ConflictModal isOpen={isConflictModalOpen} onClose={() => setIsConflictModalOpen(false)} />
    </FormProvider>
  );
}

const InputField = React.forwardRef<HTMLInputElement, any>(({ label, className, ...props }, ref) => (
  <div className="space-y-2">
    <label className="ml-1 text-xs font-semibold text-slate-500">{label}</label>
    <input
      ref={ref}
      {...props}
      className={`w-full rounded-xl border border-border bg-slate-50/50 px-4 py-3 text-sm font-medium transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none ${className || ''}`}
    />
  </div>
));
InputField.displayName = 'InputField';
