'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, Clock, Plus, Trash2, HelpCircle, X, Copy, Search, Tag, FileSpreadsheet, Sparkles } from 'lucide-react';
import { parseOrExcelFile, findOrMatch, type OrItemInfo } from '@/src/utils/orExcelParser';
import { useForm, useFieldArray, FormProvider, Controller, UseFormGetValues, UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useReworkData } from '@/src/contexts/ReworkDataContext';
import { createPortal } from 'react-dom';
import { useNotification } from '@/src/contexts/NotificationContext';
import { useItemVerification } from '@/src/hooks/useItemVerification';
import type { ReworkItem, ReworkCase } from '@/src/services/api';
import { CUSTOMER_OPTIONS, insertCase } from '@/src/services/api';
import { ImageUpload } from '@/src/modules/storage/components/ImageUpload_ui';
import { AppleProgressBar } from '@/src/components/shared/AppleProgressBar';
import { convertDMYToYMD, convertYMDToDMY, findDuplicateItemNumbers } from '@/src/utils/helpers';
import { ConflictModal } from '@/src/components/modals/ConflictModal';
import { MobileFastTrackApp, FastTrackItem } from '@/src/modules/rework/views/MobileFastTrackApp';
import { Combobox } from '@/src/components/ui/Combobox';
import { RecentDatePicker } from '@/src/components/shared/RecentDatePicker';

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
const LEAK_SUBTYPES = ['รั่วซึม', 'รั่วซีลฟอยล์', 'รั่วตามด', 'รั่วรอยลากแกลลอน', 'รั่วขูดเจาะ', 'รั่วโดนเครื่องจักร', 'รั่วกระแทก', 'รั่วตะเข็บ', 'รั่วบุบแตก', 'รอยมีด'] as const;
const STAIN_SUBTYPES = ['ขวดเปื้อน', 'กล่องเปื้อน'] as const;
const RESPONSIBLE_MAIN_OPTIONS = ['SFC', 'Supplier', 'Customer', 'อื่นๆ'] as const;

const RESPONSIBLE_SUBDIVISIONS: Record<string, string[]> = {
  SFC: ['PDF', 'WPK', 'WFG', 'อื่นๆ'],
  Supplier: ['SP', 'PJW', 'Polymer', 'ธนกร', 'Fuchs', 'อื่นๆ'],
  Customer: ['Customer'],
};

const COMBINED_REASON_OPTIONS = [
  ...LEAK_SUBTYPES.map(s => ({ label: s.trim(), value: `รั่ว:${s.trim()}`, group: 'รั่ว' })),
  { label: 'ขวดเปื้อน', value: 'เปื้อน:ขวดเปื้อน', group: 'เปื้อน' },
  { label: 'กล่องเปื้อน', value: 'เปื้อน:กล่องเปื้อน', group: 'เปื้อน' },
  { label: 'ขวดเปื้อน และ กล่องเปื้อน', value: 'เปื้อน:ขวดเปื้อน, กล่องเปื้อน', group: 'เปื้อน' },
  { label: 'อื่นๆ', value: 'อื่นๆ', group: 'อื่นๆ' }
];

const COMBINED_RESPONSIBLE_OPTIONS = [
  ...RESPONSIBLE_SUBDIVISIONS.SFC.map(s => ({ label: s.trim(), value: `SFC:${s.trim()}`, group: 'SFC' })),
  ...RESPONSIBLE_SUBDIVISIONS.Supplier.map(s => ({ label: s.trim(), value: `Supplier:${s.trim()}`, group: 'Supplier' })),
  { label: 'Customer', value: 'Customer', group: 'Customer' },
  { label: 'อื่นๆ', value: 'อื่นๆ', group: 'อื่นๆ' }
];

const initialFormItem = {
  customerName: '',
  itemNumber: '',
  itemCode: '',
  itemName: '',
  batchNo: '',
  gallonDate: '',
  boxNumber: '1',
  mold: '',
  line: '',
  amount: 1,
  reason: '',
  reasonSubtype: '',
  responsible: '',
  responsibleSubtype: '',
  details: '',
  linkedSourceId: '',
  verificationStatus: 'idle' as const,
  lastActiveField: 'itemNumber' as const,
  imageUrls: [] as string[],
};

const reworkItemSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  itemNumber: z.string().optional().nullable(),
  itemCode: z.string().optional().nullable(),
  itemName: z.string(),
  batchNo: z.string().optional().nullable(),
  gallonDate: z.string().optional().nullable(),
  boxNumber: z.string().optional().nullable().refine((val) => !val || parseInt(val, 10) > 0, { message: 'จำนวนกล่องต้องมากกว่า 0' }),
  mold: z.string().optional().nullable(),
  line: z.string().optional().nullable(),
  amount: z.union([z.number(), z.nan()]).optional().nullable(),
  reason: z.string().optional().nullable(),
  reasonSubtype: z.string().optional().nullable(),
  responsible: z.string().optional().nullable(),
  responsibleSubtype: z.string().optional().nullable(),
  details: z.string().optional().nullable(),
  linkedSourceId: z.string().optional().nullable(),
  verificationStatus: z.string().optional().nullable(),
  lastActiveField: z.string().optional().nullable(),
  imageUrls: z.array(z.string()).optional()
});

const formSchema = z.object({
  caseSource: z.string(),
  caseName: z.string().optional(),
  caseNumber: z.string().optional(),
  customerName: z.string().optional(),
  items: z.array(reworkItemSchema)
});

type FormValues = z.infer<typeof formSchema>;

export function AddCaseTab({ onOpenTutorial }: AddCaseTabProps) {
  const { cases, loadCases } = useReworkData();
  const { showToast, showAlert, showConfirm } = useNotification();

  const [isFastTrackMode, setIsFastTrackMode] = useState(false);
  const [entryMode, setEntryMode] = useState<'wpk_fast' | 'full_items'>('wpk_fast');
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [saveMessage, setSaveMessage] = useState<SaveMessage>(null);

  const [uploadedImages, setUploadedImages] = useState<Record<string, File[]>>({});
  const [orFiles, setOrFiles] = useState<File[]>([]);
  const [orParsedMap, setOrParsedMap] = useState<Record<string, OrItemInfo>>({});
  const [orItemsList, setOrItemsList] = useState<OrItemInfo[]>([]);
  const [isParsingOr, setIsParsingOr] = useState(false);

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
      caseName: '',
      caseNumber: '',
      customerName: 'SFC',
      items: [{ ...initialFormItem, id: `form-${Date.now()}` }]
    }
  });

  const { control, register, handleSubmit, watch, setValue, getValues, reset } = methods;

  const { fields, append, remove, insert, update } = useFieldArray({
    control,
    name: 'items'
  });

  const caseSource = watch('caseSource');
  const caseName = watch('caseName');
  const caseNumber = watch('caseNumber');
  const customerName = watch('customerName');
  const formItems = watch('items');

  const { triggerDebouncedVerification } = useItemVerification({
    onConflict: () => setIsConflictModalOpen(true),
    onAutofillTriggered: (itemId) => {
      setAutoFillTriggeredItem(itemId);
      setTimeout(() => setAutoFillTriggeredItem(null), 1500);
    },
    getValues: methods.getValues as unknown as UseFormGetValues<import('@/src/hooks/useItemVerification').ReworkFormValues>,
    setValue: methods.setValue as unknown as UseFormSetValue<import('@/src/hooks/useItemVerification').ReworkFormValues>
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
        } catch (e) { }
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

  // Handle OR File Upload & Auto-Parsing
  const handleOrFileUpload = async (files: File[]) => {
    setOrFiles(files);
    const excelFile = files.find(f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
    if (!excelFile) {
      setOrParsedMap({});
      setOrItemsList([]);
      return;
    }

    try {
      setIsParsingOr(true);
      const result = await parseOrExcelFile(excelFile);
      if (result.success && Object.keys(result.itemMap).length > 0) {
        setOrParsedMap(result.itemMap);
        setOrItemsList(result.itemsList);

        let matchedCount = 0;
        const currentItems = getValues('items') || [];
        currentItems.forEach((item, idx) => {
          const match = findOrMatch(item.itemCode || '', item.itemNumber || '', result.itemMap);
          if (match && match.qir) {
            matchedCount++;
            const tagText = `[QIR: ${match.qir}]`;
            const currentDetails = item.details || '';
            if (!currentDetails.includes(tagText)) {
              setValue(`items.${idx}.details`, currentDetails ? `${tagText} ${currentDetails}` : tagText, { shouldDirty: true });
            }
            if (match.batchNo && !item.batchNo) {
              setValue(`items.${idx}.batchNo`, match.batchNo, { shouldDirty: true });
            }
          }
        });

        showToast(`✓ อ่าน Sheet 2 สำเร็จ: พบข้อมูล QIR ${result.itemsList.length} รายการ (จับคู่ตรงกับฟอร์ม ${matchedCount} รายการ)`, 'success');
      } else if (result.error) {
        showToast(`ไม่สามารถอ่านข้อมูล QIR จากไฟล์ Excel ได้: ${result.error}`, 'warning');
      }
    } catch (err) {
      console.error('Failed to parse OR file:', err);
    } finally {
      setIsParsingOr(false);
    }
  };

  // Reactive matching when typing ItemCode or ItemNumber (Flow B)
  useEffect(() => {
    if (Object.keys(orParsedMap).length > 0 && formItems.length > 0) {
      formItems.forEach((item, idx) => {
        const match = findOrMatch(item.itemCode || '', item.itemNumber || '', orParsedMap);
        if (match && match.qir) {
          const tagText = `[QIR: ${match.qir}]`;
          const currentDetails = item.details || '';
          if (!currentDetails.includes(tagText)) {
            setValue(`items.${idx}.details`, currentDetails ? `${tagText} ${currentDetails}` : tagText, { shouldDirty: true });
          }
          if (match.batchNo && !item.batchNo) {
            setValue(`items.${idx}.batchNo`, match.batchNo, { shouldDirty: true });
          }
        }
      });
    }
  }, [formItems, orParsedMap, setValue]);

  const existingCaseIds = cases.map(c => c.id);

  const isSaveDisabled = (items: typeof formItems) => {
    return items.some((item) => {
      const isZeroBox = !item.boxNumber || String(item.boxNumber).trim() === '0';

      return (
        !item.customerName ||
        (!item.itemNumber && !item.itemCode) ||
        !item.itemName ||
        isZeroBox
      );
    });
  };

  const clearAllForm = () => {
    showConfirm('คุณต้องการล้างข้อมูลที่กรอกค้างไว้ทั้งหมดใช่หรือไม่? ข้อมูลและไฟล์ที่แนบไว้จะหายไปทั้งหมด', () => {
      reset({
        caseSource: 'SFC',
        caseNumber: '',
        items: [{ ...initialFormItem, id: `form-${Date.now()}` }]
      });
      setUploadedImages({});
      setOrFiles([]);
    });
  };

  const onSubmit = async (data: FormValues) => {
    // If in full items mode, check validity
    if (entryMode === 'full_items' && data.items.length > 0 && isSaveDisabled(data.items)) {
      showAlert('กรุณากรอกข้อมูลสินค้าให้ครบถ้วน (ต้องระบุชื่อลูกค้า, รหัสสินค้า, ชื่อสินค้า และจำนวนกล่องห้ามเป็น 0)', 'error');
      return;
    }

    const isCustomerCase = data.caseSource === 'Customer' || (data.customerName && data.customerName !== 'SFC');
    const prefix = isCustomerCase ? 'RT' : 'RW';
    const currentYear = new Date().getFullYear();

    try {
      setIsSaving(true);
      setProgress(15);
      setStatusText('กำลังเตรียมข้อมูลเคส...');

      // Transform items for API
      const apiItems = (entryMode === 'full_items' && data.items.length > 0 && data.items[0].itemName)
        ? data.items.map(item => ({
            ...item,
            amount: Number(item.boxNumber) || Number(item.amount) || 1
          })) as ReworkItem[]
        : [];

      setProgress(45);
      setStatusText('กำลังสร้าง Case ID และบันทึกข้อมูล...');

      const customName = data.caseName?.trim() || `${data.customerName || data.caseSource} Rework Ticket`;

      const result = await insertCase(
        data.caseSource,
        apiItems,
        uploadedImages,
        orFiles,
        undefined, // Let server assign atomic Case ID
        false,
        customName
      );

      if (result.success) {
        setProgress(100);
        setStatusText('เปิดเคสสำเร็จ!');
        setIsComplete(true);
        setSaveMessage({ type: 'success', text: 'เปิดเคสใหม่และส่งต่อให้ QSMS วิเคราะห์สำเร็จ!' });
        showToast('✓ เปิดเคสสำเร็จ: สถานะงานเป็น "รอวิเคราะห์" ส่งต่อให้ QSMS เรียบร้อยแล้ว', 'success');

        // Reset form
        setTimeout(() => {
          reset({
            caseSource: 'SFC',
            caseName: '',
            caseNumber: '',
            customerName: 'SFC',
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

  const handleFastTrackComplete = (source: string, caseId: string, fastTrackItems: FastTrackItem[]) => {
    setIsFastTrackMode(false);
  };

  if (isFastTrackMode) {
    return createPortal(
      <div className="fixed inset-0 z-50 bg-background">
        <MobileFastTrackApp
          initialSource={getValues('caseSource') as "SFC" | "Customer"}
          initialCaseId={getValues('caseNumber')}
          onComplete={handleFastTrackComplete}
          onCancel={() => setIsFastTrackMode(false)}
        />
      </div>,
      document.body
    );
  }

  const isCustomerCase = caseSource === 'Customer' || (customerName && customerName !== 'SFC');

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-5xl space-y-6 md:space-y-8 pb-32 pb-[calc(8rem+env(safe-area-inset-bottom))]">
        
        {/* Step Indicator Banner */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs">
                1
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">Step 1: WPK เปิดเคสแจ้งเรื่อง (Case Initiation)</h2>
                <p className="text-xs text-slate-500">กรอกข้อมูลเบื้องต้นเพื่อสร้าง Case ID อัตโนมัติและส่งเคสเข้าสู่สถานะ <strong className="text-amber-700">"รอวิเคราะห์"</strong></p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1 border border-slate-200/60 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setEntryMode('wpk_fast')}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  entryMode === 'wpk_fast' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ⚡ WPK Fast Ticket
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('full_items')}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  entryMode === 'full_items' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📋 Advanced Item Entry
              </button>
            </div>
          </div>

          {/* Workflow Steps Preview */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-semibold text-slate-500 pt-1">
            <div className="flex items-center gap-1.5 text-amber-700 font-bold">
              <span className="h-2 w-2 rounded-full bg-amber-500 ring-4 ring-amber-100" />
              1. WPK เปิดเคส
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              2. QSMS วิเคราะห์ & ขอภาชนะ
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              3. WPK เบิกจ่ายของ
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              4. PDF ซ่อม & Defend
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              5. ปิดงานสมบูรณ์
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Main Case Info Card */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              
              {/* Case Name / Subject */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ชื่อเรื่อง / หัวข้อเคส (Case Title) *</label>
                <input
                  type="text"
                  {...register('caseName')}
                  placeholder="เช่น พบน้ำมันรั่วซึมจากกล่องล็อต 26/08, งานรับคืน Eneos ฯลฯ"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Customer Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">ลูกค้า / แหล่งที่มา (Customer) *</label>
                <Controller
                  control={control}
                  name="customerName"
                  render={({ field }) => (
                    <Combobox
                      options={['SFC', ...CUSTOMER_OPTIONS]}
                      value={field.value || 'SFC'}
                      onChange={(val) => {
                        field.onChange(val);
                        setValue('caseSource', val === 'SFC' ? 'SFC' : 'Customer');
                      }}
                      placeholder="เลือกลูกค้า หรือ SFC"
                      className="bg-slate-50/50 font-normal"
                    />
                  )}
                />
              </div>
            </div>

            {/* Auto Case ID Preview & Auto State Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-indigo-50/60 p-4 border border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-mono font-bold text-xs shadow-xs">
                  {isCustomerCase ? 'RT' : 'RW'}
                </div>
                <div>
                  <div className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                    <span>รหัสเคสอัตโนมัติ:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-indigo-200 text-indigo-700">
                      {isCustomerCase ? `RT-${new Date().getFullYear()}-XXX` : `RW-${new Date().getFullYear()}-XXX`}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-600">ระบบจะกำหนดหมายเลขลำดับ 001, 002... ให้อัตโนมัติเมื่อกดบันทึก</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="text-[11px] font-semibold text-slate-500">สถานะเริ่มต้น:</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
                  รอวิเคราะห์ (Pending Analysis)
                </span>
              </div>
            </div>

            {/* Reference Files Section (OR, Excel, PDF, Initial Photos) */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">เอกสารหรือรูปถ่ายอ้างอิงเบื้องต้น (Reference Attachments)</h4>
                  <p className="text-[11px] text-slate-400">แนบไฟล์ Excel, PDF ใบส่งของ หรือรูปถ่ายหน้างานเบื้องต้น (ถ้ามี)</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[240px]">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".xlsx,.xls,.pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      handleOrFileUpload(files.slice(0, 4));
                    }}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>
                {orFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    {orFiles.map((file, i) => (
                      <div key={i} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-2">
                        <span>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const remaining = orFiles.filter((_, idx) => idx !== i);
                            handleOrFileUpload(remaining);
                          }}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                          handleOrFileUpload(files.slice(0, 2));
                        }}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
                      />
                    </div>
                    {orFiles.length > 0 && (
                      <div className="flex gap-2 items-center">
                        {orFiles.map((file, i) => (
                          <div key={i} className="px-3 py-1 bg-white border border-amber-200 rounded-lg text-xs font-medium text-amber-800 flex items-center gap-2">
                            {file.name}
                            <button onClick={() => {
                              const remaining = orFiles.filter((_, idx) => idx !== i);
                              handleOrFileUpload(remaining);
                            }} className="text-amber-400 hover:text-amber-600">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {isParsingOr && (
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-700">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" /> กำลังสกัดคอลัมน์ QIR จาก Sheet 2...
                    </div>
                  )}
                  {orItemsList.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                        <FileSpreadsheet size={16} className="text-amber-600" />
                        <span>พบรายการใน Sheet 2 ทั้งหมด {orItemsList.length} รายการ</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const generatedItems = orItemsList.map((orItem, index) => ({
                            ...initialFormItem,
                            id: `or-gen-${Date.now()}-${index}`,
                            customerName: 'OR',
                            itemCode: orItem.itemCode || '',
                            itemName: orItem.description || '',
                            batchNo: orItem.batchNo || '',
                            boxNumber: String(orItem.amount || 1),
                            amount: orItem.amount || 1,
                            details: `[QIR: ${orItem.qir}]`,
                            verificationStatus: 'verified' as const,
                          }));
                          setValue('items', generatedItems);
                          showToast(`✓ ดึงรายการสินค้า ${generatedItems.length} รายการจากไฟล์ OR สำเร็จ!`, 'success');
                        }}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                      >
                        <Sparkles size={14} /> ดึงรายการสินค้าทั้งหมดจากไฟล์ OR ({orItemsList.length} รายการ)
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Detailed Item List (Only shown in full items mode) */}
          {entryMode === 'full_items' && (
            <div className="flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">รายการสินค้าและสาเหตุความเสียหาย (Item Breakdown)</h3>
                  <p className="text-xs text-slate-400">กรอกรหัสสินค้า, วันที่ล็อต, จำนวนกล่อง และสาเหตุที่พบ</p>
                </div>
              </div>

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
                          {(() => {
                            const qirMatch = (item.details || '').match(/\[QIR:\s*([^\]]+)\]/);
                            const qirVal = qirMatch ? qirMatch[1] : null;
                            if (!qirVal) return null;
                            return (
                              <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Tag size={12} className="text-purple-600" /> QIR: {qirVal}
                              </span>
                            );
                          })()}
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <div className="space-y-2">
                          <label className="ml-1 text-xs font-semibold text-slate-500">ชื่อลูกค้า (Customer Name) *</label>
                          <Controller
                            control={control}
                            name={`items.${idx}.customerName`}
                            render={({ field }) => (
                              <Combobox
                                options={[...CUSTOMER_OPTIONS]}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="กรุณาเลือก"
                                searchPlaceholder="ค้นหาชื่อลูกค้า..."
                                className="bg-slate-50/50 font-normal"
                              />
                            )}
                          />
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
                                  if (item.verificationStatus && item.verificationStatus !== 'idle') {
                                    setValue(`items.${idx}.verificationStatus`, 'idle');
                                  }
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
                                  if (item.verificationStatus && item.verificationStatus !== 'idle') {
                                    setValue(`items.${idx}.verificationStatus`, 'idle');
                                  }
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

                      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        <div className="col-span-2 sm:col-span-1">
                          <Controller
                            control={control}
                            name={`items.${idx}.batchNo`}
                            render={({ field }) => (
                              <RecentDatePicker
                                label="หมายเลขล็อต (Batch no.)"
                                value={field.value || ''}
                                onChange={field.onChange}
                                disabled={isSaving}
                              />
                            )}
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <Controller
                            control={control}
                            name={`items.${idx}.gallonDate`}
                            render={({ field }) => (
                              <RecentDatePicker
                                label="วันที่ผลิตแกลลอน"
                                value={field.value || ''}
                                onChange={field.onChange}
                                disabled={isSaving}
                              />
                            )}
                          />
                        </div>
                        <div className="col-span-1"><InputField label="Mold" {...register(`items.${idx}.mold`)} disabled={isSaving} /></div>
                        <div className="col-span-1"><InputField label="Line" {...register(`items.${idx}.line`)} disabled={isSaving} /></div>
                        <div className="col-span-1"><InputField label="จำนวนกล่อง (ลัง) *" {...register(`items.${idx}.boxNumber`)} disabled={isSaving} /></div>
                      </div>

                      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="ml-1 text-xs font-semibold text-slate-500">สาเหตุที่พบ (Optional)</label>
                          <div className="space-y-2">
                            <Controller
                              control={control}
                              name={`items.${idx}.reason`}
                              render={({ field }) => {
                                const reasonVal = watch(`items.${idx}.reason`);
                                const subtypeVal = watch(`items.${idx}.reasonSubtype`);
                                const composedValue = subtypeVal ? `${reasonVal}:${subtypeVal}` : reasonVal;
                                return (
                                  <Combobox
                                    options={COMBINED_REASON_OPTIONS}
                                    value={composedValue}
                                    onChange={(val) => {
                                      if (val.includes(':')) {
                                        const [r, s] = val.split(':');
                                        setValue(`items.${idx}.reason`, r);
                                        setValue(`items.${idx}.reasonSubtype`, s);
                                      } else {
                                        setValue(`items.${idx}.reason`, val);
                                        setValue(`items.${idx}.reasonSubtype`, '');
                                      }
                                    }}
                                    placeholder="เลือกสาเหตุ (ระบุภายหลังได้)..."
                                    className="bg-slate-50/50 font-normal"
                                  />
                                );
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="ml-1 text-xs font-semibold text-slate-500">ผู้รับผิดชอบ (Optional)</label>
                          <div className="space-y-2">
                            <Controller
                              control={control}
                              name={`items.${idx}.responsible`}
                              render={({ field }) => {
                                const respVal = watch(`items.${idx}.responsible`);
                                const subtypeVal = watch(`items.${idx}.responsibleSubtype`);
                                const composedValue = (respVal === 'Customer' || respVal === 'อื่นๆ')
                                  ? respVal
                                  : (subtypeVal ? `${respVal}:${subtypeVal}` : respVal);
                                return (
                                  <Combobox
                                    options={COMBINED_RESPONSIBLE_OPTIONS}
                                    value={composedValue}
                                    onChange={(val) => {
                                      if (val.includes(':')) {
                                        const [r, s] = val.split(':');
                                        setValue(`items.${idx}.responsible`, r);
                                        setValue(`items.${idx}.responsibleSubtype`, s);
                                      } else {
                                        setValue(`items.${idx}.responsible`, val);
                                        setValue(`items.${idx}.responsibleSubtype`, '');
                                      }
                                    }}
                                    placeholder="เลือกผู้รับผิดชอบ (ระบุภายหลังได้)..."
                                    className="bg-slate-50/50 font-normal"
                                  />
                                );
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {(item.reason === 'เปื้อน' || item.reason?.startsWith('เปื้อน')) && formItems.some((i, iidx) => (i.reason === 'รั่ว' || i.reason?.startsWith('รั่ว')) && iidx !== idx) && (
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
                                          const leaks = formItems.filter((i, iidx) => (i.reason === 'รั่ว' || i.reason?.startsWith('รั่ว')) && iidx !== idx);
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
                                      {formItems.filter((i, iidx) => (i.reason === 'รั่ว' || i.reason?.startsWith('รั่ว')) && iidx !== idx).map(leak => (
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
                            onUrlsChange={(urls) => setValue(`items.${idx}.imageUrls`, urls)}
                            currentImages={uploadedImages[item.id] || []}
                            initialImageUrls={item.imageUrls || []}
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
                              setUploadedImages(prev => { const n = { ...prev }; delete n[item.id]; return n; });
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
                              setUploadedImages(prev => { const n = { ...prev }; delete n[item.id]; return n; });
                            }}
                            className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                          >
                            <Trash2 size={16} /> ล้างข้อมูลการ์ดนี้
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          )}

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
                  {entryMode === 'full_items' && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.01, backgroundColor: 'rgba(241,245,249,1)' }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      onClick={() => append({ ...initialFormItem, id: `form-${Date.now()}` })}
                      disabled={isSaving}
                      className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm font-semibold text-slate-500 disabled:opacity-50 sm:h-auto cursor-pointer"
                    >
                      <Plus size={16} /> [ + ] เพิ่มรายการ
                    </motion.button>
                  )}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSaving || (entryMode === 'full_items' && isSaveDisabled(formItems))}
                    className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50 sm:h-auto transition-colors cursor-pointer"
                  >
                      {entryMode === 'wpk_fast' ? (
                        <>
                          🚀 เปิดเคสใหม่และส่งต่อให้ QSMS วิเคราะห์ <ChevronRight size={16} />
                        </>
                      ) : (
                        <>
                          บันทึกข้อมูลแบบละเอียดเข้าสู่ระบบ <ChevronRight size={16} />
                        </>
                      )}
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
      <ConflictModal isOpen={isConflictModalOpen} onClose={() => setIsConflictModalOpen(false)} />
    </FormProvider>
  );
}

const InputField = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string }>(({ label, className, id: externalId, ...props }, ref) => {
  const internalId = React.useId();
  const id = externalId || internalId;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block ml-1 text-xs font-semibold text-slate-500">{label}</label>
      <input
        id={id}
        ref={ref}
        {...props}
        className={`block w-full rounded-xl border border-border bg-slate-50/50 px-4 py-3 text-sm font-medium transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none ${className || ''}`}
      />
    </div>
  );
});
InputField.displayName = 'InputField';
