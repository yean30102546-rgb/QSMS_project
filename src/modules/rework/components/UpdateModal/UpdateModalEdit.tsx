import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, FileText, ExternalLink, PenTool, Trash2, Plus, ChevronDown } from 'lucide-react';
import { useUpdateModal } from './UpdateModalContext';
import { CUSTOMER_OPTIONS } from '@/src/services/api';
import { convertDMYToYMD, convertYMDToDMY, enforceNumeric } from '@/src/utils/helpers';
import { AppleProgressBar } from '@/src/components/shared/AppleProgressBar';
import { CopyButton } from '@/src/components/ui/CopyButton';
import { Combobox } from '@/src/components/ui/Combobox';

/* ── Static option data ──────────────────────────────── */

const LEAK_SUBTYPES = [
  'รั่วซึม', 'รั่วซีลฟอยล์', 'รั่วตามด', 'รั่วรอยลากแกลลอน',
  'รั่วขูดเจาะ', 'รั่วโดนเครื่องจักร', 'รั่วกระแทก', 'รั่วตะเข็บ', 'รั่วบุบแตก', 'รอยมีด',
] as const;

const RESPONSIBLE_SUBDIVISIONS: Record<string, string[]> = {
  SFC: ['PDF', 'PDB', 'WPK', 'WFG', 'อื่นๆ'],
  Supplier: ['SP', 'PJW', 'Polymer', 'ธนกร', 'Fuchs', 'อื่นๆ'],
};

const REASON_OPTIONS = [
  { label: 'รั่ว', value: 'รั่ว' },
  { label: 'เปื้อน', value: 'เปื้อน' },
  { label: 'อื่นๆ', value: 'อื่นๆ' },
];

const getReasonSubtypeOptions = (reason: string) => {
  if (reason === 'รั่ว') return LEAK_SUBTYPES.map(s => ({ label: s.trim(), value: s.trim() }));
  if (reason === 'เปื้อน')
    return ['ขวดเปื้อน', 'กล่องเปื้อน', 'ขวดเปื้อน และ กล่องเปื้อน'].map(s => ({ label: s, value: s }));
  return [];
};

const RESPONSIBLE_OPTIONS = [
  { label: 'SFC', value: 'SFC' },
  { label: 'Supplier', value: 'Supplier' },
  { label: 'Customer', value: 'Customer' },
  { label: 'อื่นๆ', value: 'อื่นๆ' },
];

const getResponsibleSubdivisionOptions = (resp: string) =>
  (RESPONSIBLE_SUBDIVISIONS[resp] || []).map(s => ({ label: s.trim(), value: s.trim() }));

/* ── Helpers ─────────────────────────────────────────── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
      {children}
    </label>
  );
}

function FieldInput({
  value,
  onChange,
  type = 'text',
  placeholder,
  rows,
  className,
}: {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  const base =
    'w-full border border-divider-color bg-system-background px-3 py-2.5 text-sm font-medium text-on-surface rounded-lg focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]/30 transition-all';
  if (rows) {
    return (
      <textarea
        value={value}
        onChange={onChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
        rows={rows}
        placeholder={placeholder}
        className={`${base} resize-none ${className ?? ''}`}
      />
    );
  }
  return (
    <input
      type={type}
      value={value}
      onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
      placeholder={placeholder}
      className={`${base} ${className ?? ''}`}
    />
  );
}

/* ── Section dot accent ──────────────────────────────── */
function SectionTitle({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <h4 className="text-[13px] font-semibold text-on-surface mb-4 flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full ${color} shrink-0`} />
      {children}
    </h4>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════ */
export function UpdateModalEdit() {
  const {
    caseData, isLoading, caseStatus,
    editedSource, setEditedSource,
    editedItems, setEditedItems, deletedItemIds, setDeletedItemIds,
    expandedItemId, setExpandedItemId,
    newOrFiles, setNewOrFiles,
    newImages, setNewImages,
    editedCaseNumber, setEditedCaseNumber,
    SOURCE_OPTIONS, caseNamePrefix, caseNameYear, previewCaseName, getCaseNumber,
    handleSaveEdit, handleCancelEdit,
    isAdmin, isOperator,
    handleRemoveItem, getStatusLabel,
    isSaving, progress, statusText, isComplete,
  } = useUpdateModal();

  return (
    <div className="relative bg-system-background w-full flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* ── Header (mirrors UpdateModalView) ─────────────── */}
      <div className="flex justify-between items-start px-4 sm:px-6 pt-6 sm:pt-10 pb-4 border-b border-divider-color bg-system-background z-10 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <PenTool size={16} className="text-[#0066cc]" />
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-on-surface">
              โหมดแก้ไข
            </h1>
          </div>
          <p className="text-sm sm:text-base text-on-surface-variant mt-1 flex items-center gap-1.5">
            <span>{previewCaseName || caseData?.id}</span>
            {(previewCaseName || caseData?.id) && (
              <CopyButton text={previewCaseName || caseData?.id || ''} size={13} />
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isSaving ? (
            <AppleProgressBar progress={progress} statusText={statusText} isComplete={isComplete} />
          ) : (
            <>
              {/* Status segmented control removed */}

              <button
                onClick={handleCancelEdit}
                className="text-on-surface-variant hover:bg-surface-secondary p-1.5 sm:p-2 rounded-full transition-colors focus:outline-none"
              >
                <X size={24} />
              </button>
            </>
          )}

          {/* Save button — always visible */}
          {!isSaving && (
            <button
              onClick={handleSaveEdit}
              disabled={isLoading || !isAdmin}
              className="px-4 sm:px-5 py-2 text-sm font-semibold text-white bg-[#0066cc] hover:bg-[#0055aa] rounded-full shadow-sm transition-all disabled:opacity-50 shrink-0"
            >
              บันทึก
            </button>
          )}
        </div>
      </div>

      {/* ── Meta info bar (mirrors UpdateModalView) ──────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-2 sm:gap-4 px-4 sm:px-6 py-4 border-b border-divider-color bg-surface-secondary/30 shrink-0">
        {/* Source edit */}
        <div>
          <div className="text-sm font-medium text-on-surface-variant mb-1">Source</div>
          <select
            value={editedSource}
            onChange={(e) => setEditedSource(e.target.value)}
            className="w-full border border-divider-color bg-system-background px-2 py-1.5 text-sm font-semibold rounded-lg text-on-surface focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]/30"
          >
            {SOURCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {/* Case number edit */}
        <div>
          <div className="text-sm font-medium text-on-surface-variant mb-1">Case Number</div>
          <div className="flex items-center bg-system-background rounded-lg border border-divider-color focus-within:ring-1 focus-within:ring-[#0066cc]/30 focus-within:border-[#0066cc] transition-all overflow-hidden">
            <span className="pl-2.5 text-sm font-semibold text-on-surface-variant whitespace-nowrap shrink-0">{caseNamePrefix}</span>
            <input
              value={editedCaseNumber}
              onChange={(e) => setEditedCaseNumber(enforceNumeric(e.target.value))}
              placeholder="084"
              className="w-full bg-transparent px-1.5 py-1.5 text-sm font-bold text-center outline-none text-on-surface"
            />
            <span className="pr-2.5 text-sm font-semibold text-on-surface-variant whitespace-nowrap shrink-0">-{caseNameYear}</span>
          </div>
        </div>

        {/* Date (read-only) */}
        <div>
          <div className="text-sm font-medium text-on-surface-variant mb-1">Date</div>
          <div className="text-base font-medium text-on-surface">
            {caseData?.date || '-'}
          </div>
        </div>

        {/* Item count (read-only) */}
        <div>
          <div className="text-sm font-medium text-on-surface-variant mb-1">รายการ</div>
          <div className="text-base font-medium text-on-surface">{editedItems.length} รายการ</div>
        </div>
      </div>

      {/* ── Scrollable content ───────────────────────────── */}
      <div className="w-full flex-1 overflow-y-auto custom-scrollbar bg-surface-bright">
        <div className="max-w-4xl mx-auto flex flex-col p-4 sm:p-6 space-y-4 sm:space-y-6">

          {/* OR Files section */}
          {editedItems.every(i => i.customerName === 'OR') && (
            <div className="bg-system-background border border-divider-color rounded-xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-divider-color">
                <AlertCircle size={16} className="text-on-surface-variant" />
                <h3 className="text-sm font-semibold text-on-surface">เอกสาร OR</h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {caseData?.orFilesUrls?.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-full text-[#0066cc] text-sm font-semibold hover:bg-surface-variant transition-colors"
                  >
                    <ExternalLink size={14} /> OR {i + 1}
                  </a>
                ))}
                <label className="flex items-center gap-2 bg-surface-secondary rounded-full px-4 py-2 hover:bg-surface-variant transition-colors cursor-pointer border border-dashed border-divider-color text-sm font-semibold text-on-surface">
                  <input
                    type="file"
                    multiple
                    accept=".xlsx,.xls,.pdf,.png"
                    onChange={(e) => setNewOrFiles(Array.from(e.target.files || []).slice(0, 2))}
                    className="hidden"
                  />
                  {newOrFiles.length > 0 ? `เลือก ${newOrFiles.length} ไฟล์` : '+ เพิ่มไฟล์ OR'}
                </label>
              </div>
            </div>
          )}

          {/* Items section */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-divider-color text-on-surface">
              <FileText size={20} className="text-[#0066cc]" />
              <span className="text-base sm:text-lg font-semibold">รายการสินค้า ({editedItems.length})</span>
            </div>

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {editedItems.map((item, index) => {
                  const isExpanded = expandedItemId === item.id || expandedItemId === index.toString();
                  const toggleExpand = () =>
                    setExpandedItemId(isExpanded ? null : (item.id || index.toString()));

                  const reasonColor =
                    item.reason === 'รั่ว'
                      ? 'bg-error'
                      : item.reason === 'เปื้อน'
                      ? 'bg-[#ff9500]'
                      : 'bg-[#0066cc]';

                  return (
                    <motion.div
                      key={item.id || index}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="bg-system-background border border-[rgba(0,0,0,0.08)] rounded-xl overflow-hidden hover:border-[rgba(0,0,0,0.14)] transition-all duration-200"
                    >
                      {/* ─ Card summary row ─ */}
                      <div className="p-4 sm:p-5 flex flex-col gap-4">

                        {/* Top row: name + customer + images */}
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* Color accent + item info */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`w-1.5 h-10 rounded-full shrink-0 mt-0.5 ${reasonColor}`} />
                            <div className="flex-1 min-w-0 space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <FieldLabel>ชื่อรายการ</FieldLabel>
                                  <FieldInput
                                    value={item.itemName || ''}
                                    onChange={(e) => {
                                      const n = [...editedItems];
                                      n[index] = { ...n[index], itemName: (e.target as HTMLInputElement).value };
                                      setEditedItems(n);
                                    }}
                                  />
                                </div>
                                <div>
                                  <FieldLabel>ลูกค้า</FieldLabel>
                                  <select
                                    value={item.customerName || ''}
                                    onChange={(e) => {
                                      const n = [...editedItems];
                                      n[index] = { ...n[index], customerName: e.target.value };
                                      setEditedItems(n);
                                    }}
                                    className="w-full border border-divider-color bg-system-background px-3 py-2.5 text-sm font-medium text-on-surface rounded-lg focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]/30 transition-all"
                                  >
                                    <option value="">เลือกลูกค้า</option>
                                    {CUSTOMER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                                </div>
                              </div>

                              {/* Details + amount */}
                              <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
                                <div>
                                  <FieldLabel>อาการเสีย / รายละเอียด</FieldLabel>
                                  <FieldInput
                                    value={item.details || ''}
                                    onChange={(e) => {
                                      const n = [...editedItems];
                                      n[index] = { ...n[index], details: (e.target as HTMLTextAreaElement).value };
                                      setEditedItems(n);
                                    }}
                                    rows={2}
                                  />
                                </div>
                                <div>
                                  <FieldLabel>จำนวน</FieldLabel>
                                  <input
                                    type="number"
                                    value={item.amount || ''}
                                    onChange={(e) => {
                                      const n = [...editedItems];
                                      n[index] = { ...n[index], amount: Number(e.target.value) };
                                      setEditedItems(n);
                                    }}
                                    className="w-full border border-divider-color bg-system-background px-2 py-2.5 text-center text-sm font-bold text-on-surface rounded-lg focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]/30 transition-all"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Images panel - Boxed to separate from inputs */}
                          <div className="lg:w-[260px] shrink-0 bg-surface-secondary/30 rounded-xl p-4 border border-divider-color/60">
                            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">
                              รูปภาพ (
                              {(item.imageUrls || []).length -
                                deletedItemIds.filter(u => (item.imageUrls || []).includes(u)).length +
                                (newImages[item.id || index.toString()] || []).length}
                              )
                            </p>
                            <div className="flex flex-wrap gap-2.5">
                              {(item.imageUrls || []).map((url, i) => {
                                const isDeleted = deletedItemIds.includes(url);
                                return (
                                  <div key={i} className="relative group w-12 h-12 rounded-lg overflow-hidden bg-system-background shadow-sm border border-divider-color/50">
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
                                    {isDeleted && <div className="absolute inset-0 border-2 border-error rounded-lg" />}
                                  </div>
                                );
                              })}

                              {(newImages[item.id || index.toString()] || []).map((file, i) => (
                                <div key={`new-${i}`} className="relative group w-12 h-12 rounded-lg overflow-hidden bg-blue-50 border-2 border-[#0066cc]/30">
                                  <img src={URL.createObjectURL(file)} alt="new" className="w-full h-full object-cover" />
                                  <button
                                    onClick={() => {
                                      const imgs = { ...newImages };
                                      imgs[item.id || index.toString()] = imgs[item.id || index.toString()].filter((_, idx) => idx !== i);
                                      setNewImages(imgs);
                                    }}
                                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X size={16} className="text-white" />
                                  </button>
                                </div>
                              ))}

                              <label className="w-12 h-12 rounded-lg border-2 border-dashed border-divider-color/70 flex items-center justify-center cursor-pointer hover:bg-surface-variant transition-colors text-on-surface-variant bg-system-background">
                                <Plus size={18} />
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length > 0) {
                                      setNewImages(prev => ({
                                        ...prev,
                                        [item.id || index.toString()]: [
                                          ...(prev[item.id || index.toString()] || []),
                                          ...files,
                                        ],
                                      }));
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Action row */}
                        <div className="flex gap-2 pt-1 border-t border-divider-color/50">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="p-2 text-error hover:bg-error/8 rounded-lg transition-colors"
                            title="ลบรายการ"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={toggleExpand}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-[13px] font-semibold text-[#0066cc] bg-[#0066cc]/8 hover:bg-[#0066cc]/14 rounded-lg transition-colors"
                          >
                            <span>{isExpanded ? 'ย่อรายละเอียด' : 'รายละเอียดเพิ่มเติม'}</span>
                            <ChevronDown
                              size={15}
                              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* ─ Expandable details ─ */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                            className="border-t border-divider-color bg-surface-secondary/30 overflow-hidden"
                          >
                            <div className="p-5 flex flex-col gap-8">

                              {/* Production data */}
                              <div>
                                <SectionTitle color="bg-[#0066cc]">ข้อมูลการผลิต</SectionTitle>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                  <div>
                                    <FieldLabel>Batch No.</FieldLabel>
                                    <FieldInput
                                      value={item.batchNo || ''}
                                      onChange={(e) => {
                                        const n = [...editedItems];
                                        n[index] = { ...n[index], batchNo: (e.target as HTMLInputElement).value };
                                        setEditedItems(n);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <FieldLabel>วันที่ผลิตแกลลอน</FieldLabel>
                                    <input
                                      type="date"
                                      value={item.gallonDate ? convertDMYToYMD(item.gallonDate) : ''}
                                      onChange={(e) => {
                                        const n = [...editedItems];
                                        n[index] = { ...n[index], gallonDate: convertYMDToDMY(e.target.value) };
                                        setEditedItems(n);
                                      }}
                                      className="w-full border border-divider-color bg-system-background px-3 py-2.5 text-sm font-medium text-on-surface rounded-lg focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]/30 transition-all"
                                    />
                                  </div>
                                  <div>
                                    <FieldLabel>Box Number</FieldLabel>
                                    <FieldInput
                                      value={item.boxNumber || ''}
                                      onChange={(e) => {
                                        const n = [...editedItems];
                                        n[index] = { ...n[index], boxNumber: (e.target as HTMLInputElement).value };
                                        setEditedItems(n);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <FieldLabel>Mold / Line</FieldLabel>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={item.mold || ''}
                                        onChange={(e) => {
                                          const n = [...editedItems];
                                          n[index] = { ...n[index], mold: e.target.value };
                                          setEditedItems(n);
                                        }}
                                        placeholder="Mold"
                                        className="w-1/2 border border-divider-color bg-system-background px-3 py-2.5 text-sm font-medium text-on-surface rounded-lg focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]/30"
                                      />
                                      <input
                                        type="text"
                                        value={item.line || ''}
                                        onChange={(e) => {
                                          const n = [...editedItems];
                                          n[index] = { ...n[index], line: e.target.value };
                                          setEditedItems(n);
                                        }}
                                        placeholder="Line"
                                        className="w-1/2 border border-divider-color bg-system-background px-3 py-2.5 text-sm font-medium text-on-surface rounded-lg focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]/30"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="h-px bg-divider-color/40" />

                              {/* Reason + responsible */}
                              <div>
                                <SectionTitle color="bg-[#ff9500]">สาเหตุและผู้รับผิดชอบ</SectionTitle>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                                  <div className="space-y-1.5 relative z-[60]">
                                    <FieldLabel>สาเหตุหลัก</FieldLabel>
                                    <Combobox
                                      options={REASON_OPTIONS}
                                      value={item.reason || ''}
                                      onChange={(val) => {
                                        const n = [...editedItems];
                                        n[index] = { ...n[index], reason: val, reasonSubtype: '' };
                                        setEditedItems(n);
                                      }}
                                      placeholder="เลือกสาเหตุ..."
                                    />
                                  </div>

                                  <div className="space-y-1.5 relative z-[55]">
                                    <FieldLabel>ประเภทย่อย</FieldLabel>
                                    <Combobox
                                      options={getReasonSubtypeOptions(item.reason || '')}
                                      value={item.reasonSubtype || ''}
                                      onChange={(val) => {
                                        const n = [...editedItems];
                                        n[index] = { ...n[index], reasonSubtype: val };
                                        setEditedItems(n);
                                      }}
                                      placeholder="เลือกประเภทย่อย..."
                                      disabled={!item.reason || item.reason === 'อื่นๆ'}
                                    />
                                  </div>

                                  <div className="space-y-1.5 relative z-[50]">
                                    <FieldLabel>ผู้รับผิดชอบ</FieldLabel>
                                    <Combobox
                                      options={RESPONSIBLE_OPTIONS}
                                      value={item.responsible || ''}
                                      onChange={(val) => {
                                        const n = [...editedItems];
                                        n[index] = { ...n[index], responsible: val, responsibleSubtype: '' };
                                        setEditedItems(n);
                                      }}
                                      placeholder="เลือกผู้รับผิดชอบ..."
                                    />
                                  </div>

                                  <div className="space-y-1.5 relative z-[45]">
                                    <FieldLabel>แผนก</FieldLabel>
                                    <Combobox
                                      options={getResponsibleSubdivisionOptions(item.responsible || '')}
                                      value={item.responsibleSubtype || ''}
                                      onChange={(val) => {
                                        const n = [...editedItems];
                                        n[index] = { ...n[index], responsibleSubtype: val };
                                        setEditedItems(n);
                                      }}
                                      placeholder="เลือกแผนก..."
                                      disabled={
                                        !item.responsible ||
                                        item.responsible === 'Customer' ||
                                        item.responsible === 'อื่นๆ'
                                      }
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

        </div>
      </div>
    </div>
  );
}
