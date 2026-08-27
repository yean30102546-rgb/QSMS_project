'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, Clock, Plus, Trash2, HelpCircle, X, Copy, Search, Tag, FileSpreadsheet } from 'lucide-react';
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
  customerName: 'SFC',
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
  customerName: z.string().optional(),
  items: z.array(reworkItemSchema)
});

type FormValues = z.infer<typeof formSchema>;

export function AddCaseTab({ onOpenTutorial }: AddCaseTabProps) {
  const { cases, loadCases } = useReworkData();
  const { showToast, showAlert, showConfirm } = useNotification();

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
      customerName: 'SFC',
      items: [{ ...initialFormItem, customerName: 'SFC', id: `form-${Date.now()}` }]
    }
  });

  const { control, register, handleSubmit, watch, setValue, getValues, reset } = methods;

  const { fields, append, remove, insert, update } = useFieldArray({
    control,
    name: 'items'
  });

  const caseSource = watch('caseSource');
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
        customerName: 'SFC',
        items: [{ ...initialFormItem, customerName: 'SFC', id: `form-${Date.now()}` }]
      });
      setUploadedImages({});
      setOrFiles([]);
    });
  };

  const handleAddItem = () => {
    const curCustomer = getValues('customerName') || 'SFC';
    append({
      ...initialFormItem,
      customerName: curCustomer,
      id: `form-${Date.now()}-${fields.length}`
    });
  };

  const handleDuplicateItem = (index: number) => {
    const source = formItems[index];
    if (!source) return;
    const newId = `form-${Date.now()}-${fields.length}`;
    const dup = {
      ...source,
      id: newId,
      imageUrls: [...(source.imageUrls || [])]
    };
    if (uploadedImages[source.id]) {
      setUploadedImages(prev => ({
        ...prev,
        [newId]: [...prev[source.id]]
      }));
    }
    insert(index + 1, dup);
    showToast(`✓ คัดลอกข้อมูลจากรายการที่ ${index + 1} เรียบร้อยแล้ว`, 'success');
  };

  const onSubmit = async (data: FormValues) => {
    if (!data.items || data.items.length === 0) {
      showAlert('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ', 'error');
      return;
    }

    if (isSaveDisabled(data.items)) {
      showAlert('กรุณากรอกข้อมูลสินค้าให้ครบถ้วน (ต้องระบุชื่อลูกค้า, รหัสสินค้า, ชื่อสินค้า และจำนวนกล่องห้ามเป็น 0)', 'error');
      return;
    }

    const isCustomerCase = data.caseSource === 'Customer' || (data.customerName && data.customerName !== 'SFC');

    // Validate mandatory attachments for Customer / RT cases
    if (isCustomerCase && orFiles.length === 0) {
      showAlert('งาน RT (เคสลูกค้า) จำเป็นต้องมีเอกสารหรือไฟล์อ้างอิงแนบอย่างน้อย 1 ไฟล์ก่อนเปิดเคส', 'error');
      if (fileInputRef.current) {
        fileInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setIsSaving(true);
      setProgress(15);
      setStatusText('กำลังเตรียมข้อมูลเคส...');

      // Transform items for API
      const apiItems = data.items.map(item => ({
        ...item,
        amount: Number(item.boxNumber) || Number(item.amount) || 1
      })) as ReworkItem[];

      setProgress(45);
      setStatusText('กำลังสร้าง Case ID และบันทึกข้อมูล...');

      const result = await insertCase(
        data.caseSource,
        apiItems,
        uploadedImages,
        orFiles,
        undefined, // Let server assign atomic Case ID
        false,
        undefined, // Case Name will automatically be Case ID
        data.customerName
      );

      if (result.success) {
        setProgress(100);
        setStatusText('เปิดเคสสำเร็จ!');
        setIsComplete(true);
        const assignedId = result.data?.caseId || '';
        setSaveMessage({ type: 'success', text: `เปิดเคสใหม่ (${assignedId}) และส่งต่อให้ QSMS วิเคราะห์สำเร็จ!` });
        showToast(`✓ เปิดเคสสำเร็จ: ${assignedId} สถานะงานเป็น "รอวิเคราะห์" ส่งต่อให้ QSMS เรียบร้อยแล้ว`, 'success');

        // Reset form
        setTimeout(() => {
          reset({
            caseSource: 'SFC',
            customerName: 'SFC',
            items: [{ ...initialFormItem, customerName: 'SFC', id: `form-${Date.now()}` }]
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

  const isCustomerCase = caseSource === 'Customer' || (customerName && customerName !== 'SFC');

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-5xl space-y-5 pb-32 pb-[calc(8rem+env(safe-area-inset-bottom))]">
        
        {/* Step Indicator Banner */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-500 text-slate-950 font-bold text-xs shadow-xs">
                1
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight">Step 1: เปิดเคสแจ้งเรื่อง (Case Initiation)</h2>
                <p className="text-xs text-slate-500">กรอกข้อมูลเบื้องต้นเพื่อสร้าง Case ID อัตโนมัติและส่งเคสเข้าสู่สถานะ <strong className="text-amber-700 font-semibold">"รอวิเคราะห์"</strong></p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                📋 Rework Entry Form
              </span>
            </div>
          </div>

          {/* Workflow Steps Preview */}
          <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-medium text-slate-500 pt-1">
            <div className="flex items-center gap-1.5 text-amber-800 font-bold">
              <span className="h-2 w-2 rounded-full bg-amber-500 ring-2 ring-amber-200" />
              1. เปิดเคส
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              2. วิเคราะห์ & ขอของ
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              3. เบิกจ่ายของ
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              4. ซ่อมงาน
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              5. ปิดงานสมบูรณ์
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Main Case Info Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-stretch">
              
              {/* Customer Selection */}
              <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-4">
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
                          const previousVal = field.value || 'SFC';
                          field.onChange(val);
                          const newSource = val === 'SFC' ? 'SFC' : 'Customer';
                          setValue('caseSource', newSource);
                          // Auto-propagate to items that had empty or previous default customer
                          const currentItems = getValues('items');
                          if (currentItems && currentItems.length > 0) {
                            currentItems.forEach((item, idx) => {
                              if (!item.customerName || item.customerName === previousVal || item.customerName === 'SFC') {
                                setValue(`items.${idx}.customerName`, val, { shouldDirty: true });
                              }
                            });
                          }
                        }}
                        placeholder="เลือกลูกค้า หรือ SFC"
                        className="bg-white font-medium"
                      />
                    )}
                  />
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  ชื่อลูกค้านี้จะเป็นค่าเริ่มต้นให้กับทุกรายการสินค้าด้านล่าง
                </div>
              </div>

              {/* Auto Case ID Preview & Auto State Badge */}
              <div className="flex flex-col justify-between rounded-lg bg-slate-50 p-4 border border-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-mono font-bold text-sm shadow-2xs shrink-0">
                      {isCustomerCase ? 'RT' : 'RW'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-slate-500">รหัสเคสอัตโนมัติ:</div>
                      <div className="font-mono text-sm font-bold text-slate-900 tracking-wide whitespace-nowrap">
                        {isCustomerCase ? `RT-${new Date().getFullYear()}-XXX` : `RW-${new Date().getFullYear()}-XXX`}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse shrink-0" />
                      รอวิเคราะห์
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  ระบบจะรันหมายเลข Case ID ให้โดยอัตโนมัติเมื่อกดบันทึก
                </div>
              </div>
            </div>

            {/* Reference Files Section (OR, Excel, PDF, Initial Photos) */}
            <div className={`border-t border-slate-100 pt-5 space-y-3 rounded-2xl p-4 transition-all ${
              isCustomerCase && orFiles.length === 0
                ? 'bg-amber-50/60 border border-amber-200'
                : 'bg-transparent'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-800">
                      {isCustomerCase
                        ? 'เอกสารหรือรูปถ่ายอ้างอิงของลูกค้า * (Mandatory for RT)'
                        : 'เอกสารหรือรูปถ่ายอ้างอิงเบื้องต้น (Reference Attachments)'}
                    </h4>
                    {isCustomerCase ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        orFiles.length > 0
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                      }`}>
                        {orFiles.length > 0 ? `✓ แนบแล้ว ${orFiles.length} ไฟล์` : '* จำเป็นต้องแนบเอกสารสำหรับงาน RT'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        ไม่บังคับ (เปิดงาน RW ได้ทันที)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isCustomerCase
                      ? 'งาน RT ต้องมีเอกสารแนบก่อนเปิดเคส เช่น ใบส่งของ, ใบแจ้งเคลมจากลูกค้า, ไฟล์สรุป OR, หรือรูปภาพหน้างาน'
                      : 'งาน RW สามารถเปิดเคสได้ทันที (แนบไฟล์ Excel, PDF หรือรูปถ่ายหน้างานเพิ่มเติมได้ถ้ามี)'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 items-center pt-1">
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
                    className={`block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold cursor-pointer ${
                      isCustomerCase && orFiles.length === 0
                        ? 'file:bg-amber-600 file:text-white hover:file:bg-amber-700'
                        : 'file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200'
                    }`}
                  />
                </div>
                {orFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    {orFiles.map((file, i) => (
                      <div key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-2 shadow-2xs">
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const remaining = orFiles.filter((_, idx) => idx !== i);
                            handleOrFileUpload(remaining);
                          }}
                          className="text-slate-400 hover:text-red-600 cursor-pointer"
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
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer"
                      >
                        <FileSpreadsheet size={14} /> ดึงรายการสินค้าทั้งหมดจากไฟล์ OR ({orItemsList.length} รายการ)
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Detailed Item List */}
          <div className="flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">รายการสินค้าและสาเหตุความเสียหาย (Item Breakdown)</h3>
                <p className="text-xs text-slate-400">กรอกรหัสสินค้า, วันที่ล็อต, จำนวนกล่อง และสาเหตุที่พบ (ไม่จำกัดจำนวนรายการ)</p>
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
                      className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs relative overflow-hidden"
                    >
                      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-mono text-xs font-bold">
                            {idx + 1}
                          </span>
                          รายการที่ {idx + 1}
                          {item.verificationStatus === 'verified' && (
                            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> พบในระบบ
                            </span>
                          )}
                          {item.verificationStatus === 'new' && (
                            <span className="text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.2 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> สินค้าใหม่
                            </span>
                          )}
                          {item.verificationStatus === 'checking' && (
                            <span className="text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.2 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" /> กำลังตรวจ...
                            </span>
                          )}
                          {(() => {
                            const qirMatch = (item.details || '').match(/\[QIR:\s*([^\]]+)\]/);
                            const qirVal = qirMatch ? qirMatch[1] : null;
                            if (!qirVal) return null;
                            return (
                              <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.2 rounded-full flex items-center gap-1">
                                <Tag size={11} className="text-slate-500" /> QIR: {qirVal}
                              </span>
                            );
                          })()}
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">ชื่อลูกค้า (Customer Name) *</label>
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
                                className="bg-white font-medium"
                              />
                            )}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">หมายเลขบาร์โค้ด (Item Number)</label>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              autoComplete="off"
                              onFocus={(e) => e.target.select()}
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
                              className={`w-full rounded-md border pl-3 pr-9 py-2 text-xs sm:text-sm font-mono font-semibold transition-colors placeholder:text-slate-400 placeholder:font-normal disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none ${item.lastActiveField === 'itemNumber' ? 'border-amber-500 bg-white ring-2 ring-amber-500/20' : 'border-slate-300 bg-white text-slate-900 shadow-2xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'}`}
                            />
                            <button
                              type="button"
                              onClick={() => triggerDebouncedVerification(item.id, idx, 'itemNumber', item.itemNumber)}
                              disabled={isSaving || !item.itemNumber}
                              className="absolute right-2.5 text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors cursor-pointer"
                            >
                              <Search size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">รหัสสินค้า (Item Code)</label>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              autoComplete="off"
                              onFocus={(e) => e.target.select()}
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
                              className={`w-full rounded-md border pl-3 pr-9 py-2 text-xs sm:text-sm font-mono font-semibold transition-colors placeholder:text-slate-400 placeholder:font-normal disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none ${item.lastActiveField === 'itemCode' ? 'border-amber-500 bg-white ring-2 ring-amber-500/20' : 'border-slate-300 bg-white text-slate-900 shadow-2xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'}`}
                            />
                            <button
                              type="button"
                              onClick={() => triggerDebouncedVerification(item.id, idx, 'itemCode', item.itemCode)}
                              disabled={isSaving || !item.itemCode}
                              className="absolute right-2.5 text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-colors cursor-pointer"
                            >
                              <Search size={15} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mb-5">
                        <InputField label="ชื่อรายการ (Item Name) *" {...register(`items.${idx}.itemName`)} disabled={isSaving} />
                      </div>

                      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
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
                        <div className="col-span-1"><InputField label="Mold" className="font-mono uppercase font-semibold text-center" {...register(`items.${idx}.mold`)} disabled={isSaving} /></div>
                        <div className="col-span-1"><InputField label="Line" className="font-mono uppercase font-semibold text-center" {...register(`items.${idx}.line`)} disabled={isSaving} /></div>
                        <div className="col-span-1"><InputField label="จำนวนกล่อง (ลัง) *" type="number" className="font-mono font-bold text-center" {...register(`items.${idx}.boxNumber`)} disabled={isSaving} /></div>
                      </div>

                      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">สาเหตุที่พบ (Defect Cause)</label>
                          <div className="space-y-1.5">
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
                                    className="bg-white font-medium"
                                  />
                                );
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">ผู้รับผิดชอบ (Responsible)</label>
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
                                    className="bg-white font-medium"
                                  />
                                );
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {(item.reason === 'เปื้อน' || item.reason?.startsWith('เปื้อน')) && formItems.some((i, iidx) => (i.reason === 'รั่ว' || i.reason?.startsWith('รั่ว')) && iidx !== idx) && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="mb-5 overflow-hidden">
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 transition-all">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded bg-amber-100 text-amber-700">
                                  <HelpCircle size={18} />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-amber-900">ระบุความเชื่อมโยง (Cross-Item Link)</p>
                                  <label className="mt-0.5 flex cursor-pointer items-center gap-2 text-xs font-medium text-amber-800">
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
                                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-amber-900">ไอเทมต้นเหตุ *</label>
                                    <select
                                      {...register(`items.${idx}.linkedSourceId`)}
                                      className="min-w-[200px] rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-none"
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

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-xs font-semibold text-slate-700">รายละเอียดเพิ่มเติม (Notes)</label>
                          <textarea
                            rows={3}
                            {...register(`items.${idx}.details`)}
                            placeholder="ระบุรายละเอียดเพิ่มเติม..."
                            className="w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
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

                      <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(idx)}
                          className="flex items-center justify-center gap-1.5 rounded-md bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <Copy size={14} /> คัดลอกรายการ
                        </button>
                        {fields.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              remove(idx);
                              setUploadedImages(prev => { const n = { ...prev }; delete n[item.id]; return n; });
                            }}
                            className="flex items-center justify-center gap-1.5 rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} /> ลบรายการ
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const curCust = getValues('customerName') || 'SFC';
                              update(idx, { ...initialFormItem, customerName: curCust, id: item.id });
                              setUploadedImages(prev => { const n = { ...prev }; delete n[item.id]; return n; });
                            }}
                            className="flex items-center justify-center gap-1.5 rounded-md bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} /> ล้างข้อมูลการ์ดนี้
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {isSaving ? (
              <motion.div
                key="saving-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="w-full rounded-lg border border-slate-200 bg-white p-4 shadow-xs"
              >
                <AppleProgressBar progress={progress} statusText={statusText} isComplete={isComplete} />
              </motion.div>
            ) : (
              <div className="flex flex-col w-full gap-3">
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={isSaving}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-white py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Plus size={16} /> [ + ] เพิ่มรายการสินค้า
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSaving || isSaveDisabled(formItems)}
                    className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-md bg-amber-500 py-2 text-xs sm:text-sm font-bold text-slate-950 hover:bg-amber-600 active:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
                  >
                    🚀 เปิดเคสใหม่และส่งต่อให้ QSMS วิเคราะห์ <ChevronRight size={16} />
                  </button>
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
                  className={`rounded-md border p-3.5 text-xs font-semibold ${saveMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}
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

const InputField = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string }>(({ label, className, id: externalId, onFocus, ...props }, ref) => {
  const internalId = React.useId();
  const id = externalId || internalId;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700">{label}</label>
      <input
        id={id}
        ref={ref}
        onFocus={(e) => {
          if (props.type === 'number' || className?.includes('font-mono')) {
            e.target.select();
          }
          onFocus?.(e);
        }}
        {...props}
        className={`block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-900 shadow-2xs transition-colors placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 ${className || ''}`}
      />
    </div>
  );
});
InputField.displayName = 'InputField';
