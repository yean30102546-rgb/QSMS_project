'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Plus,
  Send,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  Loader2,
  Package,
  History,
  Info,
  X,
  Maximize2,
  HelpCircle
} from 'lucide-react';
import { useForm, FormProvider, Controller, UseFormGetValues, UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useNotification } from '../../../contexts/NotificationContext';
import { useItemVerification } from '../../../hooks/useItemVerification';
import { insertCase, uploadItemImage, ReworkItem } from '../../../services/api';
import { addWatermark, getCurrentLocation } from '../../../utils/watermark';
import { formatThaiDate } from '../../../utils/helpers';
import { compressImage } from '../../../utils/imageCompressionUtils';
import { ImageUpload } from '@/src/modules/storage/components/ImageUpload_ui';
import { Combobox } from '@/src/components/ui/Combobox';

// Constants
const DRAFT_KEY = 'qsms_fast_track_draft';
const SOURCES = ['SFC', 'Customer'] as const;
const REASONS = ['รั่ว', 'เปื้อน', 'อื่นๆ'] as const;
const LEAK_SUBTYPES = ['รั่วซึม', 'รั่วซีลฟอยล์', 'รั่วตามด', 'รั่วรอยลากแกลลอน', 'รั่วขูดเจาะ', 'รั่วโดนเครื่องจักร', 'รั่วกระแทก', 'รั่วตะเข็บ', 'รั่วบุบแตก', 'รอยมีด'] as const;
const STAIN_SUBTYPES = ['ขวดเปื้อน', 'กล่องเปื้อน'] as const;

const COMBINED_REASON_OPTIONS = [
  ...LEAK_SUBTYPES.map(s => ({ label: s, value: `รั่ว:${s}`, group: 'รั่ว' })),
  { label: 'ขวดเปื้อน', value: 'เปื้อน:ขวดเปื้อน', group: 'เปื้อน' },
  { label: 'กล่องเปื้อน', value: 'เปื้อน:กล่องเปื้อน', group: 'เปื้อน' },
  { label: 'ขวดเปื้อน และ กล่องเปื้อน', value: 'เปื้อน:ขวดเปื้อน, กล่องเปื้อน', group: 'เปื้อน' },
  { label: 'อื่นๆ', value: 'อื่นๆ', group: 'อื่นๆ' }
];

// Validation Schema
const itemSchema = z.object({
  itemNumber: z.string().trim().min(1, 'กรุณาระบุ Item Number'),
  itemCode: z.string().trim().optional(),
  itemName: z.string().trim().min(1, 'กรุณาระบุชื่อสินค้า'),
  amount: z.number().min(1, 'จำนวนต้องมากกว่า 0'),
  reason: z.string().trim().min(1, 'กรุณาเลือกสาเหตุ'),
  reasonSubtype: z.string().trim().optional(),
  images: z.array(z.string()).min(1, 'กรุณาเพิ่มรูปหลักฐานอย่างน้อย 1 รูป'),
  batchNo: z.string().trim().optional(),
  verificationStatus: z.string().optional(),
  lastActiveField: z.string().optional(),
}).refine(data => {
  if (data.reason === 'รั่ว' || data.reason === 'เปื้อน') {
    return !!data.reasonSubtype;
  }
  return true;
}, { message: "กรุณาระบุรูปแบบ", path: ["reasonSubtype"] });

const defaultItemValues = {
  itemNumber: '',
  itemCode: '',
  itemName: '',
  amount: 1,
  reason: 'รั่ว',
  reasonSubtype: '',
  images: [] as string[],
  batchNo: '',
  verificationStatus: 'idle',
  lastActiveField: 'itemNumber',
};

type FastTrackFormValues = z.infer<typeof itemSchema>;
type SourceType = typeof SOURCES[number];

export interface FastTrackItem extends FastTrackFormValues {
  id: string;
  imageUrls: string[];
}

interface DraftState {
  source: SourceType;
  caseId: string;
  items: FastTrackItem[];
}

const fastTrackFields = [
  'itemNumber', 'itemCode', 'itemName', 'amount', 'reason',
  'reasonSubtype', 'images', 'batchNo', 'verificationStatus', 'lastActiveField'
] as const;

type FastTrackField = typeof fastTrackFields[number];
function isFastTrackField(value: string): value is FastTrackField {
  return (fastTrackFields as readonly string[]).includes(value);
}

export interface MobileFastTrackAppProps {
  onComplete?: (source: SourceType, caseId: string, items: FastTrackItem[]) => void;
  onCancel?: () => void;
  initialSource?: SourceType;
  initialCaseId?: string;
}

export function MobileFastTrackApp({ onComplete, onCancel, initialSource, initialCaseId }: MobileFastTrackAppProps) {
  const { showToast, showAlert, showConfirm } = useNotification();
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<'entry' | 'queue'>('entry');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [previewData, setPreviewData] = useState<{ index: number, images: string[] } | null>(null);
  const [isEditingCaseId, setIsEditingCaseId] = useState(false);

  // Form for single item entry
  const methods = useForm<FastTrackFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: defaultItemValues
  });

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = methods;
  const watchedItemNumber = watch('itemNumber');
  const watchedItemCode = watch('itemCode');
  const watchedImages = watch('images');

  // Bridging useItemVerification to work with our flat form
  const bridgeSetValue = useMemo(() => (name: string, value: unknown, options?: Record<string, unknown>) => {
    const match = name.match(/^items\.0\.(.+)$/);
    const fieldName = match ? match[1] : name;
    if (isFastTrackField(fieldName)) {
      setValue(fieldName as keyof FastTrackFormValues, value as never, options);
    }
  }, [setValue]);

  const bridgeGetValues = useMemo(() => (name?: string | readonly string[]) => {
    const readValue = (fieldName?: string): unknown => {
      if (!fieldName) return methods.getValues();
      if (fieldName === 'items') return [methods.getValues()];
      const match = fieldName.match(/^items\.0\.(.+)$/);
      const normalizedField = match ? match[1] : fieldName;
      if (isFastTrackField(normalizedField)) return methods.getValues(normalizedField as keyof FastTrackFormValues);
      return undefined;
    };
    if (name && typeof name !== 'string') return Array.from(name).map(fieldName => readValue(fieldName));
    return readValue(name as string);
  }, [methods]);

  // Item Verification Hook
  const { triggerDebouncedVerification } = useItemVerification({
    onConflict: () => setStatusMessage({ type: 'error', text: 'ข้อมูลสินค้าขัดแย้งกับระบบ' }),
    onAutofillTriggered: () => setStatusMessage({ type: 'success', text: 'พบข้อมูลสินค้าแล้ว' }),
    getValues: bridgeGetValues as unknown as UseFormGetValues<import('../../../hooks/useItemVerification').ReworkFormValues>,
    setValue: bridgeSetValue as unknown as UseFormSetValue<import('../../../hooks/useItemVerification').ReworkFormValues>
  });

  useEffect(() => {
    if (watchedItemNumber) {
      setValue('lastActiveField', 'itemNumber');
      triggerDebouncedVerification('mobile-entry', 0, 'itemNumber', watchedItemNumber);
    }
  }, [watchedItemNumber, triggerDebouncedVerification, setValue]);

  useEffect(() => {
    if (watchedItemCode) {
      setValue('lastActiveField', 'itemCode');
      triggerDebouncedVerification('mobile-entry', 0, 'itemCode', watchedItemCode);
    }
  }, [watchedItemCode, triggerDebouncedVerification, setValue]);

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        // Prioritize props if provided and they have a value, else use saved
        const currentSource = (initialSource && initialSource !== parsed.source) ? initialSource : parsed.source;
        let currentCaseId = (initialCaseId && initialCaseId !== parsed.caseId) ? initialCaseId : parsed.caseId;
        
        if (currentCaseId === '0') {
          currentCaseId = '';
        }
        
        setDraft({ ...parsed, source: currentSource, caseId: currentCaseId || '' });
        setIsEditingCaseId(true); // Always open in edit mode (Option 1)
      } catch (e) { console.error(e); }
    } else {
      const cleanInitialCaseId = initialCaseId === '0' ? '' : initialCaseId;
      setDraft({ source: initialSource || 'SFC', caseId: cleanInitialCaseId || '', items: [] });
      setIsEditingCaseId(true); // Always open in edit mode (Option 1)
    }
  }, [initialSource, initialCaseId]);

  useEffect(() => {
    if (draft) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          showToast('หน่วยความจำสำหรับ Draft เต็ม กรุณาลบรูปภาพบางส่วน', 'error');
        }
      }
    }
  }, [draft, showToast]);

  useEffect(() => {
    setValue('images', currentFiles.map(() => 'pending'));
  }, [currentFiles, setValue]);

  const onAddItem = async (data: FastTrackFormValues) => {
    if (!draft) return;
    
    setIsAdding(true);
    let uploadedUrls: string[] = [];
    
    try {
      const timestamp = formatThaiDate(new Date().toISOString());
      const location = await getCurrentLocation();
      const watermarkText = `${timestamp}${location ? ` | ${location}` : ''}`;

      for (const file of currentFiles) {
        const fileId = crypto.randomUUID();
        const reader = new FileReader();
        const base64: string = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const watermarked = await addWatermark(base64, watermarkText);
        const uploadRes = await uploadItemImage(`fast-${fileId}.jpg`, watermarked);
        if (uploadRes.success && uploadRes.data) {
          uploadedUrls.push(uploadRes.data.url);
        } else { 
          throw new Error(uploadRes.error); 
        }
      }
    } catch (err) { 
      showAlert('อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่', 'error'); 
      setIsAdding(false);
      return;
    }

    if (uploadedUrls.length === 0) {
      methods.setError('images', { type: 'manual', message: 'กรุณาเพิ่มรูปหลักฐานอย่างน้อย 1 รูป' });
      setIsAdding(false);
      return;
    }

    const newItem: FastTrackItem = { ...data, images: uploadedUrls, id: crypto.randomUUID(), imageUrls: uploadedUrls };
    setDraft(prev => prev ? { ...prev, items: [...prev.items, newItem] } : null);

    setCurrentFiles([]);
    reset({
      ...defaultItemValues,
      reason: data.reason,
      reasonSubtype: ''
    });

    setStatusMessage({ type: 'success', text: 'บันทึกไอเทมลงคิวแล้ว' });
    setTimeout(() => setStatusMessage(null), 3000);
    setIsAdding(false);
  };

  const handleRemoveItem = (id: string) => {
    setDraft(prev => prev ? {
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    } : null);
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!previewData) return;
    setPreviewData({ ...previewData, index: (previewData.index + 1) % previewData.images.length });
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!previewData) return;
    setPreviewData({ ...previewData, index: (previewData.index - 1 + previewData.images.length) % previewData.images.length });
  };

  const handleSubmitAll = async () => {
    if (!draft || draft.items.length === 0) return;
    setIsSubmittingAll(true);
    setStatusMessage(null);

    try {
      if (onComplete) {
        // Transfer to main ADDCASE form
        onComplete(draft.source, draft.caseId, draft.items);
        localStorage.removeItem(DRAFT_KEY);
        setDraft({ source: 'SFC', caseId: '', items: [] });
        setActiveTab('entry');
      } else {
        // Fallback: Direct API submission (original behavior)
        const itemsToInsert: ReworkItem[] = draft.items.map(item => ({
          id: item.id, itemNumber: item.itemNumber, itemCode: item.itemCode || '',
          itemName: item.itemName, amount: item.amount, reason: item.reason,
          reasonSubtype: item.reasonSubtype, responsible: 'รอระบุ', imageUrls: item.imageUrls, status: 'Pending',
          batchNo: item.batchNo || ''
        }));
        const res = await insertCase(draft.source, itemsToInsert, undefined, undefined, draft.caseId || undefined, true);
        if (res.success) {
          localStorage.removeItem(DRAFT_KEY);
          setDraft({ source: 'SFC', caseId: '', items: [] });
          setActiveTab('entry');
          showToast(`บันทึกสำเร็จ! Case ID: ${res.data?.caseId}`, 'success');
        } else { throw new Error(res.error); }
      }
    } catch (err) { setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error' }); }
    finally { setIsSubmittingAll(false); }
  };

  if (!draft) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto mb-2" /> กำลังโหลด...</div>;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center md:bg-slate-900/50 md:backdrop-blur-sm md:p-6">
      <div className="flex flex-col w-full h-[100dvh] md:max-w-[500px] md:max-h-[850px] md:h-[90vh] md:rounded-[2.5rem] md:overflow-hidden bg-slate-50 text-slate-900 font-sans overflow-hidden shadow-2xl relative md:border md:border-slate-300/50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-sm relative">
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <div className={`flex items-center gap-2 ${onCancel ? 'ml-8' : ''}`}>
          <div className="bg-blue-600 p-1.5 rounded-lg"><Package className="text-white w-5 h-5" /></div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Fast-Track</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Assistant</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner">
          <button onClick={() => setActiveTab('entry')} className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${activeTab === 'entry' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>บันทึก</button>
          <button onClick={() => setActiveTab('queue')} className={`px-4 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1.5 ${activeTab === 'queue' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
            คิว {draft.items.length > 0 && <span className="bg-blue-600 text-white text-[10px] min-w-[18px] h-4.5 rounded-full flex items-center justify-center font-bold">{draft.items.length}</span>}
          </button>
        </div>
      </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-white pb-32 min-h-0 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'entry' ? (
            <motion.div key="entry" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }} className="space-y-0">
              {/* Source Selection Card */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Source</span>
                  <div className="flex bg-slate-200/50 p-1 rounded-xl">
                    {SOURCES.map(s => (
                      <button key={s} onClick={() => setDraft({ ...draft, source: s })} className={`px-5 py-2 rounded-lg text-sm font-black transition-all ${draft.source === s ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase">หมายเลขเคส (Optional)</label>
                  
                  {draft.caseId && !isEditingCaseId ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase">กำลังบันทึกเข้าเคส</p>
                          <p className="text-base font-black text-emerald-800 font-mono tracking-wider">
                            {draft.source === 'Customer' ? 'RT' : 'RW'}{draft.caseId}-{new Date().getFullYear()}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsEditingCaseId(true)}
                        className="bg-white p-2 rounded-xl border border-emerald-200 text-emerald-600 shadow-sm active:scale-95 transition-transform"
                      >
                        <span className="text-xs font-bold px-1">แก้ไข</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2 items-center w-full">
                        <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                          <div className="bg-slate-100 px-4 py-4 text-slate-500 font-mono font-medium select-none border-r border-slate-200">
                            {draft.source === 'Customer' ? 'RT' : 'RW'}
                          </div>
                          <input
                            type="text"
                            value={draft.caseId}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setDraft({ ...draft, caseId: val });
                            }}
                            placeholder="012"
                            className="w-full px-4 py-4 bg-transparent border-0 text-base font-mono focus:ring-0 outline-none placeholder:text-slate-300"
                          />
                          <div className="bg-slate-100 px-4 py-4 text-slate-500 font-mono font-medium border-l border-slate-200 select-none">
                            -{new Date().getFullYear()}
                          </div>
                        </div>
                        
                        {draft.caseId && isEditingCaseId && (
                          <button 
                            type="button"
                            onClick={() => setIsEditingCaseId(false)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-blue-200 active:scale-95 transition-all flex-shrink-0"
                          >
                            ตกลง
                          </button>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                        <HelpCircle size={14} />
                        ระบุเฉพาะตัวเลขตรงกลาง (เช่น 012)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Form Card */}
              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onAddItem)} className="p-5 space-y-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                    <h2 className="text-base font-black text-slate-800 tracking-tight">ข้อมูลไอเทม</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Item Number</label>
                      <Controller name="itemNumber" control={control} render={({ field }) => <input {...field} placeholder="6000400" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />} />
                      {errors.itemNumber && <p className="text-[10px] text-red-500 font-bold">{errors.itemNumber.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Item Code</label>
                      <Controller name="itemCode" control={control} render={({ field }) => <input {...field} placeholder="ตัวอย่าง 4000100" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase">ชื่อสินค้า (Item Name)</label>
                    <Controller name="itemName" control={control} render={({ field }) => <textarea {...field} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />} />
                    {errors.itemName && <p className="text-[10px] text-red-500 font-bold">{errors.itemName.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase">จำนวน (Qty)</label>
                      <Controller name="amount" control={control} render={({ field }) => <input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || undefined)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase">สาเหตุและรูปแบบ</label>
                      <Controller
                        name="reason"
                        control={control}
                        render={({ field }) => {
                          const reasonVal = watch('reason');
                          const subtypeVal = watch('reasonSubtype');
                          const composedValue = subtypeVal ? `${reasonVal}:${subtypeVal}` : reasonVal;
                          
                          return (
                            <Combobox
                              options={COMBINED_REASON_OPTIONS}
                              value={composedValue}
                              onChange={(val) => {
                                if (val.includes(':')) {
                                  const [r, s] = val.split(':');
                                  setValue('reason', r);
                                  setValue('reasonSubtype', s);
                                } else {
                                  setValue('reason', val);
                                  setValue('reasonSubtype', '');
                                }
                              }}
                              placeholder="เลือกสาเหตุ..."
                              searchPlaceholder="ค้นหาสาเหตุ..."
                            />
                          );
                        }}
                      />
                    </div>
                  </div>

                  {/* Photo Uploader */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 rounded-full border border-blue-100 ml-auto">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-[9px] text-blue-600 font-black uppercase">Auto-Watermark</span>
                      </div>
                    </div>
                    
                    <ImageUpload
                      itemIndex={0}
                      onImagesSelected={setCurrentFiles}
                      currentImages={currentFiles}
                      maxImages={5}
                    />

                    {errors.images && <p className="text-[10px] text-red-500 font-bold px-1">{errors.images.message}</p>}
                  </div>

                  {/* THE IMPORTANT BUTTON: ADD ITEM */}
                  <div className="pt-2 pb-10">
                    <button
                      type="submit"
                      disabled={isAdding}
                      className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 flex items-center justify-center gap-3 transition-all active:scale-[0.97]"
                    >
                      <Plus className="w-6 h-6 stroke-[3px]" />
                      <span className="text-base">บันทึกไอเทมนี้ลงคิว</span>
                    </button>
                  </div>
                </form>
              </FormProvider>

              {statusMessage && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-black shadow-sm border ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  {statusMessage.text}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div key="queue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 pb-20">
              <div className="flex items-center justify-between mb-1 px-1">
                <h2 className="text-base font-black text-slate-800">รายการที่รอส่ง ({draft.items.length})</h2>
                <button onClick={() => { 
                  showConfirm('ล้างรายการทั้งหมด?', () => { 
                    localStorage.removeItem(DRAFT_KEY); 
                    setDraft({ ...draft, items: [] }); 
                  }); 
                }} className="text-[11px] font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 active:bg-red-100 transition-all">ล้างคิว</button>
              </div>

              {draft.items.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 border-2 border-slate-200 border-dashed text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto"><History className="text-slate-300 w-8 h-8" /></div>
                  <p className="text-sm font-bold text-slate-400">ยังไม่มีรายการในคิว บันทึกไอเทมที่แท็บแรกก่อนครับ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {draft.items.map((item) => (
                    <motion.div layout key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex gap-4 relative cursor-pointer active:scale-[0.99] transition-all" onClick={() => setPreviewData({ index: 0, images: item.imageUrls })}>
                      <div className="w-20 h-20 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-100 shadow-inner">
                        {item.imageUrls[0] ? <img src={item.imageUrls[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-slate-300 w-8 h-8" /></div>}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                        <h3 className="text-sm font-black text-slate-800 truncate">{item.itemNumber}</h3>
                        <p className="text-[11px] font-bold text-slate-500 truncate leading-tight">{item.itemName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded-lg text-slate-600 border border-slate-200">Q: {item.amount}</span>
                          <span className="text-[10px] font-black bg-blue-50 px-2 py-1 rounded-lg text-blue-600 border border-blue-100">{item.reason}</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id); }} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700 leading-relaxed font-bold">
                  รายการเหล่านี้ถูกเก็บไว้ในเครื่องคุณ (Draft) หากเน็ตหลุดคุณสามารถกลับมาส่งได้เมื่อต่อเน็ตสำเร็จ
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistent Footer: Submit All */}
      <footer className="bg-white border-t border-slate-200 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(0,0,0,0.1)] z-[80] flex-shrink-0 relative">
        <button
          onClick={handleSubmitAll}
          disabled={isSubmittingAll || draft.items.length === 0}
          className="w-full min-h-[64px] bg-slate-950 hover:bg-black active:scale-[0.98] disabled:bg-slate-200 disabled:active:scale-100 text-white font-black py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 transition-all relative overflow-hidden"
        >
          {isSubmittingAll ? (
            <>
              <Loader2 className="animate-spin w-7 h-7" />
              <span className="text-lg">กำลังบันทึกข้อมูล...</span>
            </>
          ) : (
            <>
              <Send className="w-7 h-7" />
              <div className="flex flex-col items-center">
                <span className="text-lg leading-tight">Submit All Items</span>
                <span className="text-[11px] text-white/70 uppercase tracking-widest font-bold">สร้าง Case ทั้งหมด ({draft.items.length} รายการ)</span>
              </div>
            </>
          )}
        </button>
      </footer>

      {/* Enhanced Multi-Image Preview Modal */}
      <AnimatePresence>
        {previewData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewData(null)} transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col cursor-pointer">
            <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
              <div className="px-3 py-1 bg-white/10 rounded-full text-white/90 text-xs font-bold border border-white/10">{previewData.index + 1} / {previewData.images.length}</div>
              <button type="button" onClick={(e) => { e.stopPropagation(); setPreviewData(null); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all active:scale-90"><X size={28} strokeWidth={2.5} /></button>
            </div>
            <div className="flex-1 relative flex items-center justify-center p-4">
              {previewData.images.length > 1 && <button type="button" onClick={handlePrevImage} className="absolute left-2 z-10 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-sm border border-white/10 active:scale-90 transition-all"><ChevronLeft size={28} /></button>}

              <AnimatePresence mode="wait">
                <motion.div
                  key={previewData.index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center justify-center w-full h-full"
                >
                  <img src={previewData.images[previewData.index]} alt="" onClick={(e) => e.stopPropagation()} className="max-w-[85vw] max-h-[60vh] sm:max-w-md object-contain rounded-2xl shadow-2xl ring-1 ring-white/20 cursor-default select-none bg-black/20" />
                </motion.div>
              </AnimatePresence>

              {previewData.images.length > 1 && <button type="button" onClick={handleNextImage} className="absolute right-2 z-10 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-sm border border-white/10 active:scale-90 transition-all"><ChevronRight size={28} /></button>}
            </div>
            <div className="p-8 pb-12 text-center bg-gradient-to-t from-black/50 to-transparent">
              <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.3em]">แตะพื้นที่ว่างเพื่อปิด</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}
